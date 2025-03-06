'use client';

import { useRef, ChangeEvent } from 'react';
import { ToolbarProps, ToolbarButtonProps } from '@/types/email';

const ToolbarButton = ({ icon, command, isActive }: ToolbarButtonProps) => (
  <button
    onClick={command}
    className={`p-1.5 rounded hover:bg-secondary transition-colors ${
      isActive ? 'bg-secondary text-primary' : 'text-gray-600'
    }`}
  >
    <span className="material-icons text-lg">{icon}</span>
  </button>
);

const ToolbarGroup = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-1 px-4 border-r border-gray-200 last:border-0">
    {children}
  </div>
);

export default function Toolbar({ editor, onAttachFiles, onAttachImages }: ToolbarProps) {
  const attachFileInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);

  const handleAttachClick = () => {
    attachFileInput.current?.click();
  };

  const handleImageClick = () => {
    imageInput.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && onAttachFiles) {
      onAttachFiles(files);
    }
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && onAttachImages) {
      onAttachImages(files);
    }
  };

  if (!editor) return null;

  return (
    <div className="flex items-center p-2 border-b border-gray-200 bg-white">
      <ToolbarGroup>
        <ToolbarButton 
          icon="format_bold" 
          command={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
        />
        <ToolbarButton 
          icon="format_italic" 
          command={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
        />
        <ToolbarButton 
          icon="format_underlined" 
          command={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
        />
      </ToolbarGroup>
      
      <ToolbarGroup>
        <ToolbarButton 
          icon="format_align_left" 
          command={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
        />
        <ToolbarButton 
          icon="format_align_center" 
          command={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
        />
        <ToolbarButton 
          icon="format_align_right" 
          command={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
        />
      </ToolbarGroup>
      
      <ToolbarGroup>
        <ToolbarButton 
          icon="format_list_bulleted" 
          command={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
        />
        <ToolbarButton 
          icon="format_list_numbered" 
          command={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
        />
      </ToolbarGroup>
      
      <ToolbarGroup>
        <input
          type="file"
          ref={attachFileInput}
          onChange={handleFileChange}
          className="hidden"
          multiple
        />
        <button 
          onClick={handleAttachClick}
          className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:bg-secondary rounded transition-colors"
        >
          <span className="material-icons">attach_file</span>
          <span>Attach</span>
        </button>

        <input
          type="file"
          ref={imageInput}
          onChange={handleImageChange}
          accept="image/*"
          className="hidden"
          multiple
        />
        <button 
          onClick={handleImageClick}
          className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:bg-secondary rounded transition-colors"
        >
          <span className="material-icons">image</span>
          <span>Images</span>
        </button>
      </ToolbarGroup>
    </div>
  );
} 