'use client';

import { createContext, useContext, useEffect, useState, createElement, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { WebSocketState } from '@/types/websocketInterface';

// Context 생성
const WebSocketContext = createContext<WebSocketState>({
  socket: null,
  isConnected: false,
  isLoading: false,
  checkGrammar: () => Promise.reject('WebSocket not initialized'),
  formalizeText: () => Promise.reject('WebSocket not initialized'),
  sendEmail: () => Promise.reject('WebSocket not initialized'),
});

// Provider 컴포넌트
export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const socketInstance = io('http://localhost:5000');

    socketInstance.on('connect', () => setIsConnected(true));
    socketInstance.on('disconnect', () => setIsConnected(false));

    setSocket(socketInstance);
    return () => { socketInstance.disconnect(); };
  }, []);

  // 이메일 관련 WebSocket 메서드들
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

  const sendEmail = async (to: string, subject: string, content: string): Promise<boolean> => {
    if (!socket || !isConnected) throw new Error('WebSocket not connected');
    
    setIsLoading(true);
    return new Promise((resolve, reject) => {
      socket.emit('send_email', { to, subject, content });
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

// 훅 사용을 위한 export
export const useEmailSocket = () => useContext(WebSocketContext); 