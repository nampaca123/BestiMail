'use client';

interface InputFieldProps {
  label: string;
  type: string;
  placeholder?: string;
}

const InputField = ({ label, type, placeholder }: InputFieldProps) => (
  <div className="flex items-center border-b border-gray-200">
    <label className="w-20 px-4 py-2 text-gray-600 font-medium border-r border-gray-200">
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
    <div className="border-b border-gray-200">
      <InputField label="To:" type="email" placeholder="recipient@example.com" />
      <InputField label="Cc:" type="email" placeholder="cc@example.com" />
      <InputField label="Subject:" type="text" placeholder="Email subject" />
    </div>
  );
} 