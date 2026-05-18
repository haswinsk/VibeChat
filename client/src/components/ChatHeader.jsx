import { ArrowLeft, Music, Trash2, MoreVertical } from 'lucide-react';
import useChatStore from '../store/useChatStore';
import useAuthStore from '../store/useAuthStore';
import { useMusic } from '../context/MusicContext';
import { socket } from '../socket/socket';

const ChatHeader = () => {
  const { selectedUser, setSelectedUser, clearChat, sendMusicInvite } = useChatStore();
  const { user } = useAuthStore();
  const { joinMusicRoom, roomId: activeRoomId } = useMusic();

  if (!selectedUser) {
    return (
      <div className="h-16 border-b border-dark-border bg-dark-bg flex items-center px-4">
        <p className="text-gray-400 text-sm">Select a user to start chatting</p>
      </div>
    );
  }

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear this chat?')) {
      clearChat(selectedUser._id);
    }
  };

  const handleMusicInvite = async () => {
    const inviteMsg = await sendMusicInvite(selectedUser._id);
    if (inviteMsg) {
      socket.emit('sendMessage', {
        receiverId: selectedUser._id,
        message: inviteMsg,
      });
    }
  };

  return (
    <div className="h-16 border-b border-dark-border bg-dark-bg flex items-center justify-between px-4 sticky top-0 z-10">
      {/* Left Section - User Info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Back Button for Mobile */}
        <button
          onClick={() => setSelectedUser(null)}
          className="md:hidden p-1 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Profile Picture */}
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0 overflow-hidden">
          {selectedUser.profilePic ? (
            <img
              src={selectedUser.profilePic}
              alt={selectedUser.name}
              className="w-full h-full object-cover"
            />
          ) : (
            selectedUser.name.charAt(0).toUpperCase()
          )}
        </div>

        {/* User Details */}
        <div className="flex-1 min-w-0">
          <h2 className="text-white font-semibold text-sm truncate">{selectedUser.name}</h2>
          <p className={`text-xs font-medium transition-colors ${
            selectedUser.onlineStatus
              ? 'text-green-400'
              : 'text-gray-500'
          }`}>
            {selectedUser.onlineStatus ? '● Online' : '● Offline'}
          </p>
        </div>
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-2">
        {/* Listen Together Button */}
        <button
          onClick={handleMusicInvite}
          className={`p-2 rounded-full transition-all ${
            activeRoomId === [user._id, selectedUser._id].sort().join('_')
              ? 'bg-primary text-white'
              : 'text-gray-400 hover:text-white hover:bg-dark-surface'
          }`}
          title="Listen Together"
        >
          <Music className="w-5 h-5" />
        </button>

        {/* Clear Chat Button */}
        <button
          onClick={handleClearChat}
          className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-dark-bg"
          title="Clear Chat"
        >
          <Trash2 className="w-5 h-5" />
        </button>

        {/* More Options */}
        <button className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-dark-surface">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
