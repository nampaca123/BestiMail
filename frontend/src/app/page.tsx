import EmailContainer from '@/components/editor/EmailContainer';
import { WebSocketProvider } from '@/lib/websocket';

export default function Home() {
  return (
    <WebSocketProvider>
      <EmailContainer />
    </WebSocketProvider>
  );
}