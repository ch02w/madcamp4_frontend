import { io, Socket } from 'socket.io-client';

class SocketService {
  socket: Socket;

  constructor() {
    this.socket = io('http://52.79.208.231:3001', {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('Connected to the WebSocket server');
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`Disconnected: ${reason}`);
    });

    this.socket.on('connect_error', (error) => {
      console.error(`Connection Error: ${error.message}`);
    });
  }

  on(event: string, callback: (data: any) => void) {
    this.socket.on(event, (data) => {
      callback(data);
    });
  }

  off(event: string) {
    this.socket.off(event);
  }

  emit(event: string, data: any = "") {
    this.socket.emit(event, data);
  }
}

const socketServiceInstance = new SocketService();
export default socketServiceInstance;
