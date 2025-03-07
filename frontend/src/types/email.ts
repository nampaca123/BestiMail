import { Editor } from '@tiptap/react';

export interface AttachedFile {
  name: string;
  size: number;
  type: string;
}

export interface EmailHeaderData {
  to: string;
  cc: string;
  subject: string;
}

export interface EmailHeaderProps {
  onHeaderChange: (data: EmailHeaderData) => void;
}

export interface EmailBodyProps {
  editor: Editor | null;
  attachedFiles: AttachedFile[];
}

export interface EmailToolbarProps {
  editor: Editor | null;
  onAttachFiles: (files: FileList) => void;
  onAttachImages: (files: FileList) => void;
  isGrammarEnabled: boolean;
  onToggleGrammar: (enabled: boolean) => void;
}

export interface EmailActionButtonProps {
  icon: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
  disabled?: boolean;
}

export interface EmailActionContainerProps {
  editor: Editor | null;
  headerData: EmailHeaderData;
  sendEmail: (to: string, cc: string, subject: string, content: string) => Promise<boolean>;
}

export interface InputFieldProps {
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface ToolbarButtonProps {
  icon: React.ReactNode;
  command: () => void;
  isActive?: boolean;
} 