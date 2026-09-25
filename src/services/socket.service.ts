import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;

  public connect(): Socket {
    if (this.socket) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('⚡ 3rd Vision Socket.IO connected to server:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.warn('⚠️ 3rd Vision Socket.IO disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      this.isConnected = false;
      console.warn('Socket.IO connection error (using mock simulator fallback):', error.message);
    });

    return this.socket;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }
}

export const socketService = new SocketService();
