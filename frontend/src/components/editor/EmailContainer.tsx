'use client';

import { useState } from 'react';
import EmailHeader from '@/components/editor/EmailHeader';
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

export default function EmailContainer() {
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {},
        orderedList: {},
        listItem: {},
      }),
      TextAlign.configure({
        types: ['paragraph', 'heading'],
        alignments: ['left', 'center', 'right'],
      }),
      Underline,
      Image,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      if (!editor) return;
      handleSentenceUpdate(editor.state.doc.textContent);
    },
    editorProps: {
      attributes: {
        class: 'prose-sm w-full max-w-none [&_ol]:list-decimal [&_ul]:list-disc focus:outline-none',
      },
    },
    immediatelyRender: false,
  });

  const { handleSentenceUpdate } = useGrammarChecker(editor);

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
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-card">
        <EmailHeader />
        <Toolbar 
          editor={editor} 
          onAttachFiles={handleAttachFiles}
          onAttachImages={handleAttachImages}
        />
        <EmailBody editor={editor} attachedFiles={attachedFiles} />
        <ActionButtons />
      </div>
    </main>
  );
} 