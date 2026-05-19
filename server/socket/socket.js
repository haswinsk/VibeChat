import { Server } from 'socket.io';
import User from '../models/User.js';
import MusicRoom from '../models/MusicRoom.js';
import Message from '../models/Message.js';

let io;
const userSocketMap = {}; // userId: socketId

export const getIo = () => io;
export const getUserSocketId = (userId) => userSocketMap[userId];

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [process.env.CLIENT_URL, 'https://vibe-chat-lake.vercel.app', 'http://localhost:5173', 'http://localhost:5174'],
      methods: ["GET", "POST"],
      credentials: true,
      allowEIO3: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log('[SOCKET] New connection:', socket.id);
    console.log('[SOCKET] Client origin:', socket.handshake.headers.origin);

    // When a user connects and provides their userId
    socket.on('userConnected', async (userId) => {
      userSocketMap[userId] = socket.id;
      console.log('[SOCKET] User connected:', userId, 'socket:', socket.id);
      await User.findByIdAndUpdate(userId, { onlineStatus: true });
      io.emit('updateUserStatus', { userId, isOnline: true });
    });

    // Chat events
    socket.on('sendMessage', (data) => {
      const { receiverId, message } = data;
      const receiverSocketId = userSocketMap[receiverId];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receiveMessage', message);
      }
    });

    socket.on('typing', ({ senderId, receiverId }) => {
      const receiverSocketId = userSocketMap[receiverId];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('typing', { senderId });
      }
    });

    socket.on('stopTyping', ({ senderId, receiverId }) => {
      const receiverSocketId = userSocketMap[receiverId];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('stopTyping', { senderId });
      }
    });

    socket.on('markMessagesAsRead', ({ senderId, receiverId }) => {
      // The receiverId here is the person who just READ the messages (the current user)
      // The senderId is the person whose messages were read.
      // We need to notify the sender that their messages were read by the receiver.
      const senderSocketId = userSocketMap[senderId];
      if (senderSocketId) {
        io.to(senderSocketId).emit('messagesRead', { readerId: receiverId });
      }
    });

    socket.on('inviteUpdated', ({ message, senderId }) => {
      // Receiver updated the invite. We notify the original sender of the invite
      const senderSocketId = userSocketMap[senderId];
      if (senderSocketId) {
        io.to(senderSocketId).emit('inviteStatusUpdated', message);
      }
    });

    // ==========================================
    // PRIVATE MUSIC ROOM EVENTS
    // ==========================================
    socket.on('join-room', async ({ roomId, userId }) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined private music room ${roomId}`);

      // Fetch or create the room state
      try {
        let room = await MusicRoom.findOne({ roomId });
        if (!room) {
          room = await MusicRoom.create({ roomId, users: [userId] });
        } else if (!room.users.includes(userId)) {
          room.users.push(userId);
          await room.save();
        }

        // Send current state to the joining user instantly
        socket.emit('sync-song-state', {
          currentSongUrl: room.currentSongUrl,
          currentSongName: room.currentSongName,
          currentTime: room.currentTime,
          isPlaying: room.isPlaying,
        });
      } catch (error) {
        console.error('Error joining music room:', error);
      }
    });

    socket.on('leave-room', async ({ roomId, userId }) => {
      socket.leave(roomId);
      console.log(`Socket ${socket.id} left private music room ${roomId}`);
      try {
        const room = await MusicRoom.findOne({ roomId });
        if (room) {
          room.users = room.users.filter((id) => id.toString() !== userId.toString());
          if (room.users.length === 0) {
            room.isPlaying = false;
            
            // Both users have left -> Mark the active accepted music invite as 'ended'
            const [user1, user2] = roomId.split('_');
            if (user1 && user2) {
              const inviteMsg = await Message.findOneAndUpdate(
                {
                  type: 'music_invite',
                  inviteStatus: 'accepted',
                  $or: [
                    { senderId: user1, receiverId: user2 },
                    { senderId: user2, receiverId: user1 },
                  ],
                },
                { inviteStatus: 'ended' },
                { sort: { createdAt: -1 }, new: true }
              ).populate('senderId', 'name profilePic');

              if (inviteMsg) {
                const sSocket = userSocketMap[user1];
                const rSocket = userSocketMap[user2];
                if (sSocket) io.to(sSocket).emit('inviteStatusUpdated', inviteMsg);
                if (rSocket) io.to(rSocket).emit('inviteStatusUpdated', inviteMsg);
              }
            }
          }
          await room.save();
          socket.to(roomId).emit('user-left-room');
        }
      } catch (error) {
        console.error(error);
      }
    });

    socket.on('song-changed', async ({ roomId, songUrl, songName }) => {
      try {
        await MusicRoom.findOneAndUpdate({ roomId }, {
          currentSongUrl: songUrl,
          currentSongName: songName,
          currentTime: 0,
          isPlaying: true
        });
        socket.to(roomId).emit('song-changed', { songUrl, songName });
      } catch (error) {
        console.error(error);
      }
    });

    socket.on('play-song', async ({ roomId, currentTime }) => {
      try {
        await MusicRoom.findOneAndUpdate({ roomId }, { isPlaying: true, currentTime });
        socket.to(roomId).emit('play-song', { currentTime });
      } catch (error) {
        console.error(error);
      }
    });

    socket.on('pause-song', async ({ roomId, currentTime }) => {
      try {
        await MusicRoom.findOneAndUpdate({ roomId }, { isPlaying: false, currentTime });
        socket.to(roomId).emit('pause-song', { currentTime });
      } catch (error) {
        console.error(error);
      }
    });

    socket.on('seek-song', async ({ roomId, currentTime }) => {
      try {
        await MusicRoom.findOneAndUpdate({ roomId }, { currentTime });
        socket.to(roomId).emit('seek-song', { currentTime });
      } catch (error) {
        console.error(error);
      }
    });

    socket.on('sync-song-time', async ({ roomId, currentTime }) => {
      // Just emit without DB update to avoid DB spam during frequent time syncs
      socket.to(roomId).emit('sync-song-state', { currentTime });
    });

    socket.on('disconnect', async () => {
      console.log('User disconnected:', socket.id);
      // Find the userId based on socket.id and remove from map
      const userId = Object.keys(userSocketMap).find(
        (key) => userSocketMap[key] === socket.id
      );

      if (userId) {
        delete userSocketMap[userId];
        await User.findByIdAndUpdate(userId, { onlineStatus: false });
        io.emit('updateUserStatus', { userId, isOnline: false });

        // Clean up any active music rooms for this disconnected user
        try {
          const activeRooms = await MusicRoom.find({ users: userId });
          for (const room of activeRooms) {
            room.users = room.users.filter((id) => id.toString() !== userId.toString());
            if (room.users.length === 0) {
              room.isPlaying = false;
              const [user1, user2] = room.roomId.split('_');
              if (user1 && user2) {
                const inviteMsg = await Message.findOneAndUpdate(
                  {
                    type: 'music_invite',
                    inviteStatus: 'accepted',
                    $or: [
                      { senderId: user1, receiverId: user2 },
                      { senderId: user2, receiverId: user1 },
                    ],
                  },
                  { inviteStatus: 'ended' },
                  { sort: { createdAt: -1 }, new: true }
                ).populate('senderId', 'name profilePic');
                if (inviteMsg) {
                  const sSocket = userSocketMap[user1];
                  const rSocket = userSocketMap[user2];
                  if (sSocket) io.to(sSocket).emit('inviteStatusUpdated', inviteMsg);
                  if (rSocket) io.to(rSocket).emit('inviteStatusUpdated', inviteMsg);
                }
              }
            }
            await room.save();
            socket.to(room.roomId).emit('user-left-room');
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
  });

  return io;
};
