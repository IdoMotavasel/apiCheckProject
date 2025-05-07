// === 📁 src/socket/socket.ts ===
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let currentUserId: string | null = null;

export const connectSocket = (userId: string) => {
  // Reconnect if user changed
  if (socket && currentUserId !== userId) {
    socket.disconnect();
    socket = null;
  }

  if (!socket) {
    socket = io('http://localhost:3000', {
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.log('✅ Connected to WebSocket server');
      socket?.emit('authenticate', userId);
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from WebSocket server');
    });

    currentUserId = userId;
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentUserId = null;
    console.log('🔌 Socket manually disconnected');
  }
};

export const getSocket = (): Socket | null => socket;
