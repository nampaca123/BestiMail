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
import { useEmailSocket } from '@/lib/websocket';

export default function EmailContainer() {
  const { checkGrammar, isLoading } = useEmailSocket();
  const [content, setContent] = useState('');
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
    onUpdate: async ({ editor }) => {
      if (!editor) return;
      
      const currentContent = editor.state.doc.textContent;
      const lastChar = currentContent[currentContent.length - 1];
      
      // 문장 종료 부호를 입력했을 때만 교정 수행
      if (['.', '!', '?'].includes(lastChar)) {
        console.log('[Editor] Detected sentence ending:', lastChar);
        console.log('[Editor] Current content:', currentContent);
        
        // 문장 분리 패턴 개선
        const sentenceRegex = /([^.!?]+[.!?]+)/g;
        const sentences = currentContent.match(sentenceRegex) || [];
        console.log('[Editor] Detected sentences:', sentences);
        
        if (sentences.length > 0) {
          // 마지막 문장 추출
          const lastSentence = sentences[sentences.length - 1];
          console.log('[Editor] Processing last sentence:', lastSentence);
          
          try {
            console.log('[Editor] Sending to server:', lastSentence);
            const correctedSentence = await checkGrammar(lastSentence);
            console.log('[Editor] Received from server:', correctedSentence);
            
            if (correctedSentence !== lastSentence) {
              // 마지막 문장의 위치 찾기
              const sentencePos = currentContent.lastIndexOf(lastSentence);
              const sentenceStart = sentencePos;
              const sentenceEnd = sentencePos + lastSentence.length;
              
              console.log('[Editor] Applying correction at position:', sentenceStart, sentenceEnd);
              editor.chain().focus()
                .setTextSelection({ from: sentenceStart, to: sentenceEnd })
                .setMark('highlight', { color: 'red' })
                .run();
              
              setTimeout(() => {
                editor.chain().focus()
                  .setTextSelection({ from: sentenceStart, to: sentenceEnd })
                  .deleteSelection()
                  .insertContent(correctedSentence)
                  .setMark('highlight', { color: 'green' })
                  .run();
                console.log('[Editor] Correction applied');
                
                setTimeout(() => {
                  editor.chain().focus().unsetMark('highlight').run();
                  console.log('[Editor] Highlight removed');
                }, 2000);
              }, 1000);
            } else {
              console.log('[Editor] No correction needed');
            }
          } catch (error) {
            console.error('[Editor] Grammar check failed:', error);
          }
        }
      }
    },
    editorProps: {
      attributes: {
        class: 'prose-sm w-full max-w-none [&_ol]:list-decimal [&_ul]:list-disc focus:outline-none',
      },
    },
    immediatelyRender: false,
  });
  
  const handleAttachFiles = (files: FileList) => {
    const newFiles = Array.from(files).map(file => ({
      name: file.name,
      size: file.size,
      type: file.type
    }));
    setAttachedFiles(prev => [...prev, ...newFiles]);
  };

  const handleAttachImages = async (files: FileList) => {
    // 이미지 처리 로직
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