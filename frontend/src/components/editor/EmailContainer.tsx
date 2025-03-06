'use client';

import { useState, useEffect, useRef } from 'react';
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
  
  const lastSentenceRef = useRef<string>("");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isCorrectingRef = useRef(false);
  const lastCorrectionTimeRef = useRef<number>(0);
  const correctedSentencesRef = useRef<Set<string>>(new Set());

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
      
      if (isCorrectingRef.current) return;
      
      const now = Date.now();
      if (now - lastCorrectionTimeRef.current < 1000) return;
      
      const currentContent = editor.state.doc.textContent;
      const lastChar = currentContent[currentContent.length - 1];
      
      if (['.', '!', '?'].includes(lastChar)) {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        
        debounceTimerRef.current = setTimeout(async () => {
          if (isCorrectingRef.current) return;
          
          const sentenceRegex = /[^.!?]+[.!?]$/;
          const match = currentContent.match(sentenceRegex);
          
          if (match && match[0]) {
            const lastSentence = match[0].trim();
            
            if (lastSentence === lastSentenceRef.current || 
                correctedSentencesRef.current.has(lastSentence)) {
              return;
            }
            
            lastSentenceRef.current = lastSentence;
            console.log('[Editor] Processing sentence:', lastSentence);
            
            try {
              isCorrectingRef.current = true;
              lastCorrectionTimeRef.current = Date.now();
              
              const correctedSentence = await checkGrammar(lastSentence);
              
              if (correctedSentence !== lastSentence) {
                const sentencePos = currentContent.lastIndexOf(lastSentence);
                if (sentencePos === -1) {
                  isCorrectingRef.current = false;
                  return;
                }
                
                console.log('[Editor] Sentence position:', sentencePos);
                
                const originalWords = lastSentence.split(/\s+/);
                const correctedWords = correctedSentence.split(/\s+/);
                
                console.log('[Editor] Original words:', originalWords);
                console.log('[Editor] Corrected words:', correctedWords);
                
                const diffIndices = [];
                for (let i = 0; i < Math.min(originalWords.length, correctedWords.length); i++) {
                  if (originalWords[i] !== correctedWords[i]) {
                    diffIndices.push(i);
                  }
                }
                
                // 마침표 중복 체크 및 제거
                const finalSentence = lastSentence.endsWith('.') && correctedSentence.endsWith('.')
                  ? correctedSentence.slice(0, -1)
                  : correctedSentence;
                
                editor.commands.setTextSelection({
                  from: sentencePos,
                  to: sentencePos + lastSentence.length
                });
                
                editor.commands.deleteSelection();
                
                editor.commands.insertContent(finalSentence);
                
                if (diffIndices.length > 0) {
                  let wordPos = sentencePos;
                  for (let i = 0; i < diffIndices[0]; i++) {
                    wordPos += correctedWords[i].length + 1;
                  }
                  
                  const changedWord = correctedWords[diffIndices[0]];
                  console.log(`[Editor] Highlighting word: "${changedWord}" at position ${wordPos}`);
                  
                  editor.commands.setTextSelection({
                    from: wordPos,
                    to: wordPos + changedWord.length
                  });
                  
                  editor.commands.setMark('highlight', { color: 'green' });
                  
                  setTimeout(() => {
                    try {
                      editor.commands.setTextSelection({
                        from: wordPos,
                        to: wordPos + changedWord.length
                      });
                      
                      editor.commands.unsetMark('highlight');
                      editor.commands.blur();
                    } catch (err) {
                      console.error('[Editor] Failed to remove highlight:', err);
                    }
                  }, 1000);
                }
                
                correctedSentencesRef.current.add(finalSentence);
                
                setTimeout(() => {
                  isCorrectingRef.current = false;
                }, 3000);
              } else {
                correctedSentencesRef.current.add(lastSentence);
                isCorrectingRef.current = false;
              }
            } catch (error) {
              console.error('[Editor] Grammar check failed:', error);
              isCorrectingRef.current = false;
            }
          } else {
            isCorrectingRef.current = false;
          }
        }, 500);
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