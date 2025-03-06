import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans'
import "./globals.css";
import { WebSocketProvider } from '@/lib/websocket';

const geist = GeistSans

export const metadata: Metadata = {
  title: "Bestia - AI Email Assistant",
  description: "Write better emails with AI assistance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
      </head>
      <body className={`${geist.className} antialiased bg-gray-50`}>
        <WebSocketProvider>
          {children}
        </WebSocketProvider>
      </body>
    </html>
  );
}
