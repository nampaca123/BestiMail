import { Socket } from 'socket.io-client';

export interface WebSocketState {
  socket: Socket | null;
  isConnected: boolean;
  isLoading: boolean;
  checkGrammar: (text: string) => Promise<string>;
  formalizeText: (text: string) => Promise<string>;
  sendEmail: (to: string, subject: string, content: string) => Promise<boolean>;
} 