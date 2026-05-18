// src/socket/socketManager.js
import { io } from 'socket.io-client';
import { toastInfo, toastError, toastSuccess } from '../components/ToastProvider';

// Initialize socket with reconnection strategy
export const socket = io(import.meta.env.VITE_SOCKET_URL, {
  withCredentials: true,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  path: '/socket.io',
  reconnectionDelayMax: 10000,
});

console.log('[SOCKET] Connecting to:', import.meta.env.VITE_SOCKET_URL);

// Track connection status for UI components
let isConnected = false;

// Emit rejoin-room on successful reconnection to resync music playback
socket.on('reconnect', () => {
  isConnected = true;
  toastInfo('Reconnected – syncing music...');
  // Emit a custom event that server will handle to place the user back into the current room
  socket.emit('rejoin-room');
});

socket.on('connect', () => {
  isConnected = true;
  toastSuccess('Connected to server');
});

socket.on('disconnect', (reason) => {
  isConnected = false;
  toastError(`Disconnected: ${reason}`);
});

/**
 * Helper to add a listener that automatically cleans up on component unmount.
 * Usage: const handler = useSocket('event', cb);
 */
export const useSocket = (event, handler) => {
  // This hook will be used inside React components.
  // Import React inside the function to avoid circular dependencies.
  const { useEffect } = require('react');
  useEffect(() => {
    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, handler]);
};

export const emit = (event, data) => socket.emit(event, data);
export const on = (event, handler) => socket.on(event, handler);
export const off = (event, handler) => socket.off(event, handler);
export const getSocket = () => socket;
export const isSocketConnected = () => isConnected;
