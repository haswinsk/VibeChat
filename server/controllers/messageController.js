import Message from '../models/Message.js';
import User from '../models/User.js';
import { getIo } from '../socket/socket.js';

// @desc    Get messages between current user and another user
// @route   GET /api/messages/:userId
// @access  Private
export const getMessages = async (req, res) => {
  try {
    const { userId: receiverId } = req.params;
    const senderId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: senderId, receiverId: receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
      deletedBy: { $ne: senderId }, // Filter out messages deleted by this user
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
};

// @desc    Send a message
// @route   POST /api/messages/send
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const { receiverId, text, imageUrl, audioUrl, duration } = req.body;
    const senderId = req.user._id;

    if (!receiverId) {
      return res.status(400).json({ message: 'Receiver ID is required' });
    }

    if (!text && !imageUrl && !audioUrl) {
      return res.status(400).json({ message: 'Message text, image, or audio is required' });
    }

    let type = 'text';
    if (audioUrl) type = 'audio';

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text: text || '',
      imageUrl: imageUrl || '',
      audioUrl: audioUrl || '',
      duration: duration || 0,
      type,
    });

    // Populate sender info if needed
    await newMessage.populate('senderId', 'name profilePic');

    // Emit socket event to notify receiver only
    try {
      const io = getIo();
      console.log('[MESSAGE] Emitting receiveMessage to receiver:', receiverId);
      io.to(receiverId.toString()).emit('receiveMessage', newMessage);
    } catch (error) {
      console.log('[SOCKET] Warning: Could not emit socket event:', error.message);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

// @desc    Get all users for the sidebar
// @route   GET /api/messages/users
// @access  Private
export const getUsersForSidebar = async (req, res) => {
  try {
    // Return all users except the current user
    const users = await User.find({ _id: { $ne: req.user._id } }).select('-password').lean();
    
    const unreadCounts = await Message.aggregate([
      { $match: { receiverId: req.user._id, isRead: false } },
      { $group: { _id: '$senderId', count: { $sum: 1 } } }
    ]);
    
    const unreadMap = {};
    unreadCounts.forEach(item => {
      if (item._id) unreadMap[item._id.toString()] = item.count;
    });

    // Get last message timestamp for each user
    const lastMessages = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: req.user._id },
            { receiverId: req.user._id }
          ]
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', req.user._id] },
              '$receiverId',
              '$senderId'
            ]
          },
          lastMessageTime: { $first: '$createdAt' }
        }
      }
    ]);

    const lastMessageMap = {};
    lastMessages.forEach(item => {
      if (item._id) lastMessageMap[item._id.toString()] = item.lastMessageTime;
    });

    const usersWithUnread = users.map(user => ({
      ...user,
      unreadCount: unreadMap[user._id.toString()] || 0,
      lastMessageTime: lastMessageMap[user._id.toString()] || null
    }));

    // Sort by most recent message first
    usersWithUnread.sort((a, b) => {
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      return timeB - timeA;
    });

    res.status(200).json(usersWithUnread);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// @desc    Clear chat history for current user
// @route   DELETE /api/messages/:userId
// @access  Private
export const clearChat = async (req, res) => {
  try {
    const { userId: otherUserId } = req.params;
    const currentUserId = req.user._id;

    // Find all messages between the two users
    await Message.updateMany(
      {
        $or: [
          { senderId: currentUserId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: currentUserId },
        ],
      },
      {
        $addToSet: { deletedBy: currentUserId },
      }
    );

    res.status(200).json({ message: 'Chat cleared successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to clear chat' });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/messages/read/:senderId
// @access  Private
export const markMessagesAsRead = async (req, res) => {
  try {
    const { senderId } = req.params;
    const receiverId = req.user._id;

    await Message.updateMany(
      { senderId, receiverId, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to mark messages as read' });
  }
};

// @desc    Send a music room invite
// @route   POST /api/messages/invite
// @access  Private
export const sendMusicInvite = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user._id;

    // Check if there's already a pending invite
    const existingInvite = await Message.findOne({
      senderId,
      receiverId,
      type: 'music_invite',
      inviteStatus: 'pending'
    });

    if (existingInvite) {
      return res.status(400).json({ message: 'You already have a pending invite with this user.' });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      type: 'music_invite',
      inviteStatus: 'pending',
    });

    await newMessage.save();
    await newMessage.populate('senderId', 'name profilePic');

    res.status(201).json(newMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to send invite' });
  }
};

// @desc    Update a music room invite (accept/reject)
// @route   PUT /api/messages/invite/:messageId
// @access  Private
export const updateMusicInvite = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { status } = req.body; // 'accepted' or 'rejected'

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Invite not found' });
    }

    // Only the receiver can accept/reject
    if (message.receiverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this invite' });
    }

    message.inviteStatus = status;
    await message.save();
    await message.populate('senderId', 'name profilePic');

    res.status(200).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update invite' });
  }
};
