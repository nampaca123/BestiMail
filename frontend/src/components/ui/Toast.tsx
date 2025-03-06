'use client';

import { useState, useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose?: () => void;
}

export default function Toast({ 
  message, 
  type = 'info', 
  duration = 3000, 
  onClose 
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const baseStyles = "fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg transform transition-transform duration-300";
  const typeStyles = {
    success: "bg-green-500 text-white",
    error: "bg-red-500 text-white",
    info: "bg-primary text-white"
  };

  if (!isVisible) return null;

  return (
    <div className={`${baseStyles} ${typeStyles[type]} ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}>
      {message}
    </div>
  );
} 