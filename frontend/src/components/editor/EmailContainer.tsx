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

export default function EmailContainer() {
  const [content, setContent] = useState('');
  
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
    ],
    content: '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setContent(html);
    },
    editorProps: {
      attributes: {
        class: 'prose-sm w-full max-w-none [&_ol]:list-decimal [&_ul]:list-disc focus:outline-none',
      },
    },
    immediatelyRender: false,
  });
  
  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-card">
        <EmailHeader />
        <Toolbar editor={editor} />
        <EmailBody editor={editor} />
        <ActionButtons />
      </div>
    </main>
  );
} 