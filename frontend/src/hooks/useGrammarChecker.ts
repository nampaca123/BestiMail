import { useRef } from 'react';
import { Editor } from '@tiptap/react';
import { useEmailSocket } from '@/lib/websocket';

export function useGrammarChecker(editor: Editor | null) {
  const { checkGrammar } = useEmailSocket();
  const lastSentenceRef = useRef<string>("");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isCorrectingRef = useRef(false);
  const lastCorrectionTimeRef = useRef<number>(0);
  const correctedSentencesRef = useRef<Set<string>>(new Set());

  const handleSentenceUpdate = async (currentContent: string) => {
    if (!editor || isCorrectingRef.current) return;
    
    const now = Date.now();
    if (now - lastCorrectionTimeRef.current < 1000) return;
    
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
              
              // 변경된 단어 하이라이트 처리
              const originalWords = lastSentence.split(/\s+/);
              const correctedWords = correctedSentence.split(/\s+/);
              
              const diffIndices = [];
              for (let i = 0; i < Math.min(originalWords.length, correctedWords.length); i++) {
                if (originalWords[i] !== correctedWords[i]) {
                  diffIndices.push(i);
                }
              }
              
              if (diffIndices.length > 0) {
                let wordPos = sentencePos;
                for (let i = 0; i < diffIndices[0]; i++) {
                  wordPos += correctedWords[i].length + 1;
                }
                
                const changedWord = correctedWords[diffIndices[0]];
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
        }
      }, 500);
    }
  };

  return { handleSentenceUpdate };
} 