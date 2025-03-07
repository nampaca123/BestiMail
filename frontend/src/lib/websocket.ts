'use client';

import { createContext, useContext, useEffect, useState, createElement, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { WebSocketState } from '@/types/websocketInterface';

// Context generation
const WebSocketContext = createContext<WebSocketState>({
  socket: null,
  isConnected: false,
  isLoading: false,
  checkGrammar: () => Promise.reject('WebSocket not initialized'),
  formalizeText: () => Promise.reject('WebSocket not initialized'),
  sendEmail: () => Promise.reject('WebSocket not initialized'),
});

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log('Attempting WebSocket connection...');
    const socketInstance = io('http://localhost:5001', {
      transports: ['websocket', 'polling'],
      withCredentials: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketInstance.on('connect', () => {
      console.log('WebSocket connected successfully');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    setSocket(socketInstance);
    return () => { socketInstance.disconnect(); };
  }, []);

  // Email-related WebSocket methods
  const checkGrammar = async (text: string): Promise<string> => {
    if (!socket || !isConnected) throw new Error('WebSocket not connected');
    
    setIsLoading(true);
    return new Promise((resolve, reject) => {
      socket.emit('check_grammar', { text });
      socket.once('grammar_result', (data) => {
        setIsLoading(false);
        resolve(data.corrected_text);
      });
      socket.once('error', (error) => {
        setIsLoading(false);
        reject(error);
      });
    });
  };

  const formalizeText = async (text: string): Promise<string> => {
    if (!socket || !isConnected) throw new Error('WebSocket not connected');
    
    setIsLoading(true);
    return new Promise((resolve, reject) => {
      socket.emit('formalize', { text });
      socket.once('formalize_result', (data) => {
        setIsLoading(false);
        resolve(data.formalized_text);
      });
      socket.once('error', (error) => {
        setIsLoading(false);
        reject(error);
      });
    });
  };

  const sendEmail = async (to: string, cc: string, subject: string, content: string): Promise<boolean> => {
    if (!socket || !isConnected) throw new Error('WebSocket not connected');
    
    setIsLoading(true);
    return new Promise((resolve, reject) => {
      socket.emit('send_email', { to, cc, subject, content });
      socket.once('email_result', (data) => {
        setIsLoading(false);
        resolve(data.success);
      });
      socket.once('error', (error) => {
        setIsLoading(false);
        reject(error);
      });
    });
  };

  return createElement(
    WebSocketContext.Provider,
    {
      value: {
        socket,
        isConnected,
        isLoading,
        checkGrammar,
        formalizeText,
        sendEmail,
      }
    },
    children
  );
}

export const useEmailSocket = () => useContext(WebSocketContext); 