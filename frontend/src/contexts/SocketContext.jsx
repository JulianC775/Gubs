import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import socketService from '../services/socketService';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => {
    // Connect on mount
    socketService.connect()
      .then(() => {
        setConnected(true);
      })
      .catch((error) => {
        console.error('Failed to connect:', error);
      });

    // Setup connection event listeners
    socketService.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
      setReconnecting(false);
    });

    socketService.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    socketService.on('reconnect_attempt', () => {
      console.log('Attempting to reconnect...');
      setReconnecting(true);
    });

    socketService.on('reconnect', (attemptNumber) => {
      console.log('Reconnected after', attemptNumber, 'attempts');
      setConnected(true);
      setReconnecting(false);
    });

    socketService.on('reconnect_failed', () => {
      console.error('Failed to reconnect');
      setReconnecting(false);
    });

    // Cleanup on unmount
    return () => {
      socketService.off('connect');
      socketService.off('disconnect');
      socketService.off('reconnect_attempt');
      socketService.off('reconnect');
      socketService.off('reconnect_failed');
      socketService.disconnect();
    };
  }, []);

  const emit = useCallback((event, data) => {
    socketService.emit(event, data);
  }, []);

  const on = useCallback((event, callback) => {
    socketService.on(event, callback);
  }, []);

  const off = useCallback((event, callback) => {
    socketService.off(event, callback);
  }, []);

  const emitWithAck = useCallback((event, data) => {
    return socketService.emitWithAck(event, data);
  }, []);

  const value = {
    connected,
    reconnecting,
    emit,
    on,
    off,
    emitWithAck,
    socket: socketService.socket
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
