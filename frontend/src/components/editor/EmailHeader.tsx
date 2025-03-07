'use client';

import Image from 'next/image';
import { InputFieldProps } from '@/types/email';
import { useState } from 'react';
import { EmailHeaderData, EmailHeaderProps } from '@/types/email';

// Reusable input field component for email header fields
// Maintains consistent styling and layout for all header inputs
const InputField = ({ label, type, placeholder, value, onChange }: InputFieldProps) => (
  <div className="flex items-center border-b border-gray-200">
    <label className="w-24 px-6 py-2 text-gray-600 font-medium border-r border-gray-200">
      {label}
    </label>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="flex-1 px-4 py-2 focus:outline-none"
    />
  </div>
);

export default function EmailHeader({ onHeaderChange }: EmailHeaderProps) {
  // State to manage email header fields (to, cc, subject)
  const [headerData, setHeaderData] = useState<EmailHeaderData>({
    to: '',
    cc: '',
    subject: ''
  });

  // Generic handler for updating any header field
  // Uses type safety with keyof to ensure only valid fields are updated
  const handleChange = (field: keyof EmailHeaderData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const newData = { ...headerData, [field]: e.target.value };
    setHeaderData(newData);
    onHeaderChange(newData);
  };

  return (
    <div>
      {/* Logo section at the top of the email header */}
      <div className="p-4 border-b border-gray-200 flex justify-end">
        <Image 
          src="/bestiaLogo.svg" 
          alt="Bestia Logo" 
          width={92} 
          height={24}
          priority
        />
      </div>
      {/* Email header fields container */}
      <div className="border-b border-gray-200">
        <InputField 
          label="To:" 
          type="email" 
          placeholder="recipient@example.com" 
          value={headerData.to}
          onChange={handleChange('to')}
        />
        <InputField 
          label="Cc:" 
          type="email" 
          placeholder="cc@example.com" 
          value={headerData.cc}
          onChange={handleChange('cc')}
        />
        <InputField 
          label="Subject:" 
          type="text" 
          placeholder="Email subject" 
          value={headerData.subject}
          onChange={handleChange('subject')}
        />
      </div>
    </div>
  );
} 