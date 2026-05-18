import { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ChatBox from '../components/ChatBox';
import useAuthStore from '../store/useAuthStore';
import useChatStore from '../store/useChatStore';
import { useMusic } from '../context/MusicContext';
import { socket } from '../socket/socket';

const Dashboard = () => {
  const { user } = useAuthStore();
  const { addMessage, selectedUser, updateUserStatus, markMessagesAsRead, updateMessagesAsReadByReceiver, updateMessageLocally } = useChatStore();
  const { joinMusicRoom } = useMusic();

  useEffect(() => {
    if (user) {
      socket.connect();
      socket.emit('userConnected', user._id);

      socket.on('receiveMessage', (message) => {
        const currentSelectedUser = useChatStore.getState().selectedUser;
        const senderId = message.senderId?._id || message.senderId;
        if (currentSelectedUser && currentSelectedUser._id === senderId) {
          addMessage(message);
          // Only mark as read for normal text/image messages, not invites
          if (message.type !== 'music_invite') {
            markMessagesAsRead(senderId);
            socket.emit('markMessagesAsRead', { senderId: senderId, receiverId: user._id });
          }
        } else {
          useChatStore.getState().incrementUnreadCount(senderId);
        }
      });

      socket.on('messagesRead', ({ readerId }) => {
        updateMessagesAsReadByReceiver(readerId);
      });

      socket.on('inviteStatusUpdated', (updatedMessage) => {
        updateMessageLocally(updatedMessage);
        
        // If invite was accepted, the SENDER needs to join the room
        // updatedMessage.senderId and receiverId are plain string IDs (not populated)
        if (updatedMessage.inviteStatus === 'accepted') {
          const myId = user._id.toString();
          const senderObj = updatedMessage.senderId;
          const receiverObj = updatedMessage.receiverId;
          
          const senderIdStr = (senderObj?._id || senderObj).toString();
          const receiverIdStr = (receiverObj?._id || receiverObj).toString();
          
          // I am the original sender of the invite → join the room now
          if (myId === senderIdStr) {
            const newRoomId = [myId, receiverIdStr].sort().join('_');
            joinMusicRoom(newRoomId);
          }
        }
      });

      socket.on('updateUserStatus', ({ userId, isOnline }) => {
        updateUserStatus(userId, isOnline);
      });

      return () => {
        socket.off('receiveMessage');
        socket.off('updateUserStatus');
        socket.off('messagesRead');
        socket.off('inviteStatusUpdated');
        socket.disconnect();
      };
    }
  }, [user?._id, joinMusicRoom]);

  return (
    <div className="h-screen flex flex-col bg-dark-bg overflow-hidden">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <ChatBox />
      </div>
    </div>
  );
};

export default Dashboard;
