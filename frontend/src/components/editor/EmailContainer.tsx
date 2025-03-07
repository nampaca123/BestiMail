'use client';

import { useState } from 'react';
import EmailHeader from '@/components/editor/EmailHeader';
import { EmailHeaderData } from '@/types/email';
import Toolbar from '@/components/editor/Toolbar';
import EmailBody from '@/components/editor/EmailBody';
import ActionButtons from '@/components/editor/ActionButtons';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Highlight from '@tiptap/extension-highlight';
import { AttachedFile } from '@/types/email';
import { useGrammarChecker } from '@/hooks/useGrammarChecker';
import { useEmailSocket } from '@/lib/websocket';
import Toast from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';

export default function EmailContainer() {
  // State management for file attachments and email header data
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [headerData, setHeaderData] = useState<EmailHeaderData>({
    to: '',
    cc: '',
    subject: ''
  });

  // WebSocket connection for email operations
  const { sendEmail } = useEmailSocket();
  const { toast, hideToast } = useToast();
  
  // Initialize TipTap editor with required extensions
  const editor = useEditor({
    extensions: [
      // Basic text editing features
      StarterKit.configure({
        bulletList: {},
        orderedList: {},
        listItem: {},
      }),
      // Text alignment options
      TextAlign.configure({
        types: ['paragraph', 'heading'],
        alignments: ['left', 'center', 'right'],
      }),
      // Additional formatting features
      Underline,
      Image,
      Highlight.configure({
        multicolor: true,  // Enable different highlight colors
      }),
    ],
    content: '',
    // Real-time grammar checking on content updates
    onUpdate: ({ editor }) => {
      if (!editor) return;
      handleSentenceUpdate(editor.state.doc.textContent);
    },
    // Editor styling configuration
    editorProps: {
      attributes: {
        class: 'prose-sm w-full max-w-none [&_ol]:list-decimal [&_ul]:list-disc focus:outline-none',
      },
    },
    immediatelyRender: false,  // Prevent unnecessary re-renders
  });

  // Initialize grammar checker with the editor instance
  const { 
    handleSentenceUpdate, 
    isEnabled: isGrammarEnabled, 
    setIsEnabled: setGrammarEnabled 
  } = useGrammarChecker(editor);

  const handleAttachFiles = (files: FileList) => {
    const newFiles = Array.from(files).map(file => ({
      name: file.name,
      size: file.size,
      type: file.type
    }));
    setAttachedFiles(prev => [...prev, ...newFiles]);
  };

  const handleAttachImages = async (files: FileList) => {
    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string' && editor) {
          editor.chain().focus().setImage({ src: reader.result }).run();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toast notifications for user feedback */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
      <main className="min-h-screen p-4 md:p-8">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-card">
          {/* Email composition components */}
          <EmailHeader onHeaderChange={setHeaderData} />
          <Toolbar 
            editor={editor} 
            onAttachFiles={handleAttachFiles}
            onAttachImages={handleAttachImages}
            isGrammarEnabled={isGrammarEnabled}
            onToggleGrammar={setGrammarEnabled}
          />
          <EmailBody editor={editor} attachedFiles={attachedFiles} />
          <ActionButtons editor={editor} headerData={headerData} sendEmail={sendEmail} />
        </div>
      </main>
    </div>
  );
} 