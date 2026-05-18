import { create } from 'zustand';
import api from '../services/api';
import { socket } from '../socket/socket';

const useRoomStore = create((set, get) => ({
  room: null,
  isLoading: false,

  joinRoom: async (roomName) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/rooms/create', { roomName });
      set({ room: data });
      socket.emit('joinRoom', data._id);
    } catch (error) {
      console.error('Error joining room:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  setRoomState: (newState) => set((state) => ({
    room: { ...state.room, ...newState }
  })),
}));

export default useRoomStore;
