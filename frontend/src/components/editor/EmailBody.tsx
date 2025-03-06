'use client';

import { Editor, EditorContent } from '@tiptap/react';

interface EmailBodyProps {
  editor: Editor | null;
}

export default function EmailBody({ editor }: EmailBodyProps) {
  if (!editor) return null;

  return (
    <div className="relative">
      <EditorContent 
        editor={editor} 
        className="min-h-[300px] p-6 focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:border-none"
      />
      {!editor.getText() && (
        <div className="absolute top-6 left-6 pointer-events-none text-gray-400">
          Write your email here...
        </div>
      )}
    </div>
  );
} 