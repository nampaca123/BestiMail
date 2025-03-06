'use client';

import { EditorContent } from '@tiptap/react';
import { EmailBodyProps } from '@/types/email';

export default function EmailBody({ editor, attachedFiles }: EmailBodyProps) {
  if (!editor) return null;

  return (
    <div className="relative">
      <EditorContent 
        editor={editor} 
        className="min-h-[300px] p-6 prose max-w-none focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:border-none"
      />
      {attachedFiles && attachedFiles.length > 0 && (
        <div className="border-t border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Attachments:</h3>
          <ul className="space-y-2">
            {attachedFiles.map((file, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                <span className="material-icons text-gray-400">attach_file</span>
                <span>{file.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!editor.getText() && (
        <div className="absolute top-6 left-6 pointer-events-none text-gray-400">
          Write your email here...
        </div>
      )}
    </div>
  );
} 