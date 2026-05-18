import { useEffect, useRef, useState } from 'react';
import { Send, Image as ImageIcon, Loader2, Download, Trash2, CheckCheck, Music, ArrowLeft, Mic } from 'lucide-react';
import useChatStore from '../store/useChatStore';
import useAuthStore from '../store/useAuthStore';
import { socket } from '../socket/socket';
import api from '../services/api';
import { useMusic } from '../context/MusicContext';
import VoiceRecorder from './VoiceRecorder';
import VoiceMessagePlayer from './VoiceMessagePlayer';

const ChatBox = () => {
  const { selectedUser, setSelectedUser, messages, getMessages, isMessagesLoading, sendMessage, clearChat, markMessagesAsRead, sendMusicInvite, updateInviteStatus } = useChatStore();
  const { user } = useAuthStore();
  const { joinMusicRoom, roomId: activeRoomId, isMinimized } = useMusic();

  const [text, setText] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [isRecordingMode, setIsRecordingMode] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (selectedUser) {
      setIsOtherUserTyping(false);
      getMessages(selectedUser._id).then(() => {
        markMessagesAsRead(selectedUser._id);
        socket.emit('markMessagesAsRead', { senderId: selectedUser._id, receiverId: user._id });
      });
    }
  }, [selectedUser, getMessages, markMessagesAsRead, user._id]);

  useEffect(() => {
    const handleTyping = ({ senderId }) => {
      if (selectedUser && selectedUser._id === senderId) {
        setIsOtherUserTyping(true);
      }
    };
    const handleStopTyping = ({ senderId }) => {
      if (selectedUser && selectedUser._id === senderId) {
        setIsOtherUserTyping(false);
      }
    };

    socket.on('typing', handleTyping);
    socket.on('stopTyping', handleStopTyping);

    return () => {
      socket.off('typing', handleTyping);
      socket.off('stopTyping', handleStopTyping);
    };
  }, [selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleTextChange = (e) => {
    setText(e.target.value);
    if (!selectedUser) return;
    socket.emit('typing', { senderId: user._id, receiverId: selectedUser._id });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stopTyping', { senderId: user._id, receiverId: selectedUser._id });
    }, 500);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    let imageUrl = '';

    if (imagePreview) {
      setIsUploading(true);
      setUploadPercent(10);
      try {
        const formData = new FormData();
        formData.append('image', fileInputRef.current.files[0]);
        const { data } = await api.post('/upload/image', formData, {
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadPercent(percentCompleted);
            }
          }
        });
        imageUrl = data.imageUrl;
      } catch (error) {
        console.error('Failed to upload image', error);
        setIsUploading(false);
        setUploadPercent(0);
        return;
      }
    }

    const messageData = {
      receiverId: selectedUser._id,
      text: text.trim(),
      imageUrl,
    };

    const sentMessage = await sendMessage(messageData);

    // Emit through socket
    socket.emit('sendMessage', {
      receiverId: selectedUser._id,
      message: sentMessage,
    });

    socket.emit('stopTyping', { senderId: user._id, receiverId: selectedUser._id });
    setText('');
    setImagePreview(null);
    setIsUploading(false);
    setUploadPercent(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendVoiceMessage = async (audioUrl, duration) => {
    if (!selectedUser) return;
    try {
      const sentMsg = await sendMessage({
        receiverId: selectedUser._id,
        audioUrl,
        duration,
      });
      if (sentMsg) {
        socket.emit('sendMessage', {
          receiverId: selectedUser._id,
          message: sentMsg,
        });
      }
    } catch (err) {
      console.error('Error sending voice message:', err);
    } finally {
      setIsRecordingMode(false);
    }
  };

  if (!selectedUser) {
    return (
      <div className="flex-1 hidden md:flex flex-col items-center justify-center bg-dark-bg text-center px-4">
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
          <span className="text-primary font-bold text-2xl">V</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Welcome to VibeChat</h2>
        <p className="text-gray-400 max-w-md">
          Select a user from the sidebar to start messaging, sharing photos, and vibing to music together.
        </p>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col bg-[#0b101a] h-full overflow-hidden transition-all duration-300 ${activeRoomId && !isMinimized ? 'pb-32 md:pb-24' : ''}`}>
      {/* Chat Header */}
      <div className="p-4 bg-dark-surface border-b border-dark-border flex items-center gap-2 sm:gap-3">
        <button
          onClick={() => setSelectedUser(null)}
          className="md:hidden mr-1 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-dark-bg transition-colors"
          title="Back to user list"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden shrink-0">
          {selectedUser.profilePic ? (
            <img src={selectedUser.profilePic} alt={selectedUser.name} className="w-full h-full object-cover" />
          ) : (
            selectedUser.name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-white">{selectedUser.name}</h3>
          <p className="text-xs text-gray-400">{selectedUser.onlineStatus ? 'Online' : 'Offline'}</p>
        </div>

        <button
          onClick={async () => {
            const inviteMsg = await sendMusicInvite(selectedUser._id);
            if (inviteMsg) {
              socket.emit('sendMessage', {
                receiverId: selectedUser._id,
                message: inviteMsg,
              });
            }
          }}
          className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all shadow-sm ${activeRoomId === [user._id, selectedUser._id].sort().join('_')
              ? 'bg-primary-dark text-white ring-2 ring-primary ring-offset-2 ring-offset-dark-surface'
              : 'bg-primary hover:bg-primary-dark text-white'
            }`}
        >
          <Music className="w-4 h-4" />
          <span className="hidden sm:inline">Listen Together</span>
        </button>

        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to clear this chat? This will only clear it for you.')) {
              clearChat(selectedUser._id);
            }
          }}
          className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-dark-bg"
          title="Clear Chat"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isMessagesLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user._id || (msg.senderId?._id === user._id);

            // Render Music Invite Message
            if (msg.type === 'music_invite') {
              return (
                <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} my-2`}>
                  <div className={`max-w-xs w-full rounded-2xl p-3 border shadow-sm transition-all ${isMe ? 'bg-primary/10 border-primary/30' : 'bg-dark-surface border-dark-border'}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                        <Music className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-white truncate">Music Invite</h4>
                          <span className="text-[9px] text-gray-500 shrink-0">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-300 truncate mt-0.5">
                          {isMe ? `Invited ${selectedUser.name}` : `${selectedUser.name} invited you`}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-dark-border/80 flex items-center justify-between">
                      <span className="text-[10px] uppercase font-semibold text-gray-400">Status</span>
                      {msg.inviteStatus === 'pending' && (
                        <div>
                          {isMe ? (
                            <span className="text-[10px] text-yellow-400 bg-yellow-400/10 px-2.5 py-0.5 rounded-full font-medium">Waiting...</span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={async () => {
                                  const updated = await updateInviteStatus(msg._id, 'accepted');
                                  if (updated) {
                                    const senderIdStr = (msg.senderId?._id || msg.senderId).toString();
                                    socket.emit('inviteUpdated', { message: updated, senderId: senderIdStr });
                                    const newRoomId = [user._id, selectedUser._id].sort().join('_');
                                    joinMusicRoom(newRoomId);
                                  }
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white font-medium text-[10px] px-3 py-1 rounded-full transition-transform hover:scale-105"
                              >
                                Accept
                              </button>
                              <button
                                onClick={async () => {
                                  const updated = await updateInviteStatus(msg._id, 'rejected');
                                  if (updated) {
                                    const senderIdStr = (msg.senderId?._id || msg.senderId).toString();
                                    socket.emit('inviteUpdated', { message: updated, senderId: senderIdStr });
                                  }
                                }}
                                className="bg-red-600/80 hover:bg-red-600 text-white font-medium text-[10px] px-3 py-1 rounded-full transition-transform hover:scale-105"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {msg.inviteStatus === 'accepted' && (
                        <span className="text-[10px] text-green-400 bg-green-400/10 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                          Active
                        </span>
                      )}

                      {msg.inviteStatus === 'rejected' && (
                        <span className="text-[10px] text-red-400 bg-red-400/10 px-2.5 py-0.5 rounded-full font-medium">Rejected</span>
                      )}

                      {msg.inviteStatus === 'ended' && (
                        <span className="text-[10px] text-gray-400 bg-gray-500/10 px-2.5 py-0.5 rounded-full font-medium border border-gray-500/20">
                          🏁 Ended
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl p-3 ${isMe ? 'bg-primary text-white rounded-br-none' : 'bg-dark-surface text-gray-200 border border-dark-border rounded-bl-none'}`}>
                  {msg.type === 'audio' && msg.audioUrl && (
                    <div className="mb-1">
                      <VoiceMessagePlayer audioUrl={msg.audioUrl} duration={msg.duration} isMe={isMe} />
                    </div>
                  )}
                  {msg.imageUrl && (
                    <div className="relative group inline-block mb-2">
                      <img
                        src={msg.imageUrl}
                        alt="attachment"
                        className="rounded-lg max-w-full h-auto max-h-64 object-contain"
                      />
                      <a
                        href={msg.imageUrl.replace('/upload/', '/upload/fl_attachment/')}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="absolute bottom-2 right-2 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm"
                        title="Download Image"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                  {msg.text && <p className="text-sm">{msg.text}</p>}
                  <div className={`flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-primary-100/70' : 'text-gray-500'}`}>
                    <p className="text-[10px]">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {isMe && (
                      <CheckCheck className={`w-3.5 h-3.5 ${msg.isRead ? 'text-green-400' : 'text-red-400'}`} />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-dark-surface border-t border-dark-border">
        {isOtherUserTyping && (
          <div className="text-xs text-primary animate-pulse px-2 pb-2 font-medium flex items-center gap-1.5">
            <div className="flex gap-0.5 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce delay-100"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce delay-200"></span>
            </div>
            <span>{selectedUser.name} is typing...</span>
          </div>
        )}

        {isUploading && (
          <div className="w-full bg-dark-bg h-1.5 rounded-full overflow-hidden mb-3 border border-dark-border">
            <div className="bg-primary h-full transition-all duration-300 relative" style={{ width: `${uploadPercent}%` }}>
              <span className="absolute right-1 -top-4 text-[9px] font-mono text-primary-100">{uploadPercent}%</span>
            </div>
          </div>
        )}

        {isRecordingMode ? (
          <VoiceRecorder
            onSendVoice={handleSendVoiceMessage}
            onCancel={() => setIsRecordingMode(false)}
          />
        ) : (
          <>
            {imagePreview && (
              <div className="mb-3 relative inline-block">
                <img src={imagePreview} alt="Preview" className="h-20 w-auto rounded border border-dark-border" />
                <button
                  onClick={() => { setImagePreview(null); fileInputRef.current.value = ''; }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            )}
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-gray-400 hover:text-primary transition-colors bg-dark-bg rounded-full border border-dark-border shrink-0"
                title="Attach Image"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setIsRecordingMode(true)}
                className="p-3 text-gray-400 hover:text-red-400 transition-colors bg-dark-bg rounded-full border border-dark-border shrink-0"
                title="Record Voice Message"
              >
                <Mic className="w-5 h-5" />
              </button>
              <div className="flex-1 bg-dark-bg border border-dark-border rounded-full flex items-center px-4 overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                <input
                  type="text"
                  value={text}
                  onChange={handleTextChange}
                  placeholder="Type a message..."
                  className="w-full py-3 bg-transparent text-white focus:outline-none placeholder-gray-500 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={(!text.trim() && !imagePreview) || isUploading}
                className="p-3 bg-primary hover:bg-primary-dark text-white rounded-full shrink-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatBox;
