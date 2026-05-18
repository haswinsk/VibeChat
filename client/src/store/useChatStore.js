import { create } from 'zustand';
import api from '../services/api';
import { socket } from '../socket/socket';

const useChatStore = create((set, get) => ({
  users: [],
  messages: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const { data } = await api.get('/messages/users');
      set({ users: data });
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const { data } = await api.get(`/messages/${userId}`);
      set({ messages: data });
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    try {
      const { data } = await api.post('/messages/send', messageData);
      set((state) => ({ messages: [...state.messages, data] }));
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
    }
  },

  clearChat: async (userId) => {
    try {
      await api.delete(`/messages/${userId}`);
      set({ messages: [] });
      return true;
    } catch (error) {
      console.error('Error clearing chat:', error);
      return false;
    }
  },

  sendMusicInvite: async (receiverId) => {
    try {
      const { data } = await api.post('/messages/invite', { receiverId });
      set((state) => ({ messages: [...state.messages, data] }));
      return data;
    } catch (error) {
      console.error('Error sending invite:', error);
      alert(error.response?.data?.message || 'Failed to send invite');
      return null;
    }
  },

  updateInviteStatus: async (messageId, status) => {
    try {
      const { data } = await api.put(`/messages/invite/${messageId}`, { status });
      set((state) => ({
        messages: state.messages.map((msg) => (msg._id === messageId ? data : msg))
      }));
      return data;
    } catch (error) {
      console.error('Error updating invite:', error);
      return null;
    }
  },

  markMessagesAsRead: async (senderId) => {
    try {
      await api.put(`/messages/read/${senderId}`);
      // Update local messages state where senderId matches
      set((state) => ({
        messages: state.messages.map((msg) => 
          (msg.senderId === senderId || msg.senderId?._id === senderId) && !msg.isRead
            ? { ...msg, isRead: true } 
            : msg
        )
      }));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  },

  updateMessagesAsReadByReceiver: (receiverId) => {
    // This is called when we receive a socket event saying the other person read our messages
    set((state) => ({
      messages: state.messages.map((msg) => 
        (msg.receiverId === receiverId || msg.receiverId?._id === receiverId) && !msg.isRead
          ? { ...msg, isRead: true } 
          : msg
      )
    }));
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),

  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),

  updateMessageLocally: (updatedMessage) => set((state) => ({
    messages: state.messages.map((msg) => (msg._id === updatedMessage._id ? updatedMessage : msg))
  })),

  updateUserStatus: (userId, isOnline) => set((state) => ({
    users: state.users.map((user) => 
      user._id === userId ? { ...user, onlineStatus: isOnline } : user
    )
  })),

  incrementUnreadCount: (userId) => set((state) => ({
    users: state.users.map((user) =>
      user._id === userId ? { ...user, unreadCount: (user.unreadCount || 0) + 1 } : user
    )
  })),

  resetUnreadCount: (userId) => set((state) => ({
    users: state.users.map((user) =>
      user._id === userId ? { ...user, unreadCount: 0 } : user
    )
  })),
}));

export default useChatStore;
