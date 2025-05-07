import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { startLogStreaming } from '../controllers/dockerController';

export type AuthenticatedSocket = Socket & {
  userId?: string;
};

let io: Server;

export const initSocketServer = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log('New client connected');

    socket.on('authenticate', (userId: string) => {
      socket.userId = userId;
      socket.join(userId);
      console.log(`Socket joined user room: ${userId}`);
    });

    socket.on('startLogStream', ({ containerName }) => {
      if (!socket.userId) {
        console.error('Unauthorized socket tried to start log stream.');
        return;
      }
      startLogStreaming(socket, containerName);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  console.log('Socket.IO server initialized');
};

export { io };

