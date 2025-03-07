'use client';

import { useRef, ChangeEvent } from 'react';
import { EmailToolbarProps, ToolbarButtonProps } from '@/types/email';
import { 
  Bold, Italic, Underline, 
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered,
  SpellCheck
} from 'lucide-react';

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

export default function Toolbar({ 
  editor, 
  onAttachFiles, 
  onAttachImages,
  isGrammarEnabled,
  onToggleGrammar
}: EmailToolbarProps) {
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
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1 ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
        >
          <Bold size={20} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1 ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
        >
          <Italic size={20} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1 ${editor.isActive('underline') ? 'bg-gray-200' : ''}`}
        >
          <Underline size={20} />
        </button>
      </ToolbarGroup>
      
      <ToolbarGroup>
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-1 ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : ''}`}
        >
          <AlignLeft size={20} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-1 ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''}`}
        >
          <AlignCenter size={20} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-1 ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''}`}
        >
          <AlignRight size={20} />
        </button>
      </ToolbarGroup>
      
      <ToolbarGroup>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1 ${editor.isActive('bulletList') ? 'bg-gray-200' : ''}`}
        >
          <List size={20} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1 ${editor.isActive('orderedList') ? 'bg-gray-200' : ''}`}
        >
          <ListOrdered size={20} />
        </button>
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
      
      <ToolbarGroup>
        <button
          onClick={() => onToggleGrammar(!isGrammarEnabled)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors whitespace-nowrap
            ${isGrammarEnabled 
              ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
              : 'text-gray-600 hover:bg-secondary'
            }
          `}
          title={`${isGrammarEnabled ? 'Disable' : 'Enable'} automatic grammar correction`}
        >
          <SpellCheck size={18} className={isGrammarEnabled ? 'text-blue-600' : 'text-gray-600'} />
          <span className="text-sm font-medium">Auto-Correct</span>
        </button>
      </ToolbarGroup>
    </div>
  );
} 