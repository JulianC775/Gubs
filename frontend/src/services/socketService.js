import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect() {
    if (this.socket?.connected) {
      return Promise.resolve();
    }

    this.socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling']
    });

    return new Promise((resolve, reject) => {
      this.socket.on('connect', () => {
        console.log('Connected to server');
        this.connected = true;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from server');
        this.connected = false;
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  on(event, callback) {
    if (!this.socket) {
      console.warn('Socket not initialized');
      return;
    }
    this.socket.on(event, callback);
  }

  off(event, callback) {
    if (!this.socket) {
      console.warn('Socket not initialized');
      return;
    }
    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }

  emit(event, data) {
    if (!this.socket) {
      console.warn('Socket not initialized');
      return;
    }
    this.socket.emit(event, data);
  }

  emitWithAck(event, data) {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not initialized'));
        return;
      }

      this.socket.emit(event, data, (response) => {
        if (response?.success) {
          resolve(response);
        } else {
          reject(new Error(response?.error || 'Unknown error'));
        }
      });
    });
  }

  joinRoom(roomCode) {
    if (!this.socket) {
      console.warn('Socket not initialized');
      return;
    }
    this.socket.emit('room:join', roomCode);
  }

  leaveRoom(roomCode) {
    if (!this.socket) {
      console.warn('Socket not initialized');
      return;
    }
    this.socket.emit('room:leave', roomCode);
  }

  isConnected() {
    return this.connected && this.socket?.connected;
  }
}

export default new SocketService();
