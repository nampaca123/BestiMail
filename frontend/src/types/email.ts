import { Editor } from '@tiptap/react';

export interface AttachedFile {
  name: string;
  size: number;
  type: string;
}

export interface EmailHeaderProps {
  to: string;
  cc?: string;
  subject: string;
}

export interface EmailBodyProps {
  editor: Editor | null;
  attachedFiles: AttachedFile[];
}

export interface ToolbarProps {
  editor: Editor | null;
  onAttachFiles: (files: FileList) => void;
  onAttachImages: (files: FileList) => void;
}

export interface ActionButtonProps {
  icon: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
}

export interface ToolbarButtonProps {
  icon: string;
  command: () => void;
  isActive?: boolean;
} 

export interface InputFieldProps {
    label: string;
    type: string;
    placeholder?: string;
  }