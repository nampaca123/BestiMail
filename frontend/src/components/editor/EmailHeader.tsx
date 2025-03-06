'use client';

import Image from 'next/image';
import { InputFieldProps } from '@/types/email';

const InputField = ({ label, type, placeholder }: InputFieldProps) => (
  <div className="flex items-center border-b border-gray-200">
    <label className="w-24 px-6 py-2 text-gray-600 font-medium border-r border-gray-200">
      {label}
    </label>
    <input
      type={type}
      placeholder={placeholder}
      className="flex-1 px-4 py-2 focus:outline-none"
    />
  </div>
);

export default function EmailForm() {
  return (
    <div>
      <div className="p-4 border-b border-gray-200 flex justify-end">
        <Image 
          src="/bestiaLogo.svg" 
          alt="Bestia Logo" 
          width={92} 
          height={24}
          priority
        />
      </div>
      <div className="border-b border-gray-200">
        <InputField label="To:" type="email" placeholder="recipient@example.com" />
        <InputField label="Cc:" type="email" placeholder="cc@example.com" />
        <InputField label="Subject:" type="text" placeholder="Email subject" />
      </div>
    </div>
  );
} 