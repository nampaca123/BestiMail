import { useRef, useState } from 'react';
import { Editor } from '@tiptap/react';
import { useEmailSocket } from '@/lib/websocket';

export function useGrammarChecker(editor: Editor | null) {
  // Socket connection for real-time grammar checking
  const { checkGrammar } = useEmailSocket();
  
  // Refs to manage state between renders and prevent redundant corrections
  const lastSentenceRef = useRef<string>("");  // Stores the last processed sentence
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);  // Debounce timer for processing
  const isCorrectingRef = useRef(false);  // Lock to prevent concurrent corrections
  const lastCorrectionTimeRef = useRef<number>(0);  // Timestamp of last correction
  const correctedSentencesRef = useRef<Set<string>>(new Set());  // Cache of already corrected sentences

  const [isEnabled, setIsEnabled] = useState(true);

  const handleSentenceUpdate = async (currentContent: string) => {
    if (!editor || !isEnabled || isCorrectingRef.current) return;
    
    const now = Date.now();
    if (now - lastCorrectionTimeRef.current < 1000) return;
    
    // 마지막 문자 확인 부분
    const lastChar = currentContent[currentContent.length - 1];
    const isSentenceEnder = ['.', '!', '?', '\n'].includes(lastChar);
    
    // 문장 종결자가 있을 때만 처리
    if (isSentenceEnder) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      debounceTimerRef.current = setTimeout(async () => {
        if (isCorrectingRef.current) return;
        
        try {
          isCorrectingRef.current = true;
          lastCorrectionTimeRef.current = Date.now();
          
          // 개선된 문장 추출 방식: 엔터 또는 문장 종결자로 나누고 마지막 부분 처리
          let sentences = currentContent.split(/(?<=[.!?\n])/);
          let lastSentence = sentences[sentences.length - 1].trim();
          
          // 빈 문장이면 마지막에서 두 번째 문장 시도
          if (!lastSentence && sentences.length > 1) {
            lastSentence = sentences[sentences.length - 2].trim();
          }
          
          // 인사말/맺음말 등 스킵
          if (!lastSentence || 
              /^(Dear|Hello|Hi|Hey|Sincerely|Best|Regards|Thank|Thanks)/i.test(lastSentence) ||
              lastSentence === lastSentenceRef.current || 
              correctedSentencesRef.current.has(lastSentence)) {
            isCorrectingRef.current = false;
            return;
          }
          
          lastSentenceRef.current = lastSentence;
          
          // 문법 교정 수행
          const correctedSentence = await checkGrammar(lastSentence);
          
          if (correctedSentence !== lastSentence) {
            // 마지막 문장의 위치를 정확히 찾기
            const sentencePos = currentContent.lastIndexOf(lastSentence);
            if (sentencePos === -1) {
              isCorrectingRef.current = false;
              return;
            }

            // 문장 끝 부호 중복 방지
            let finalSentence = correctedSentence;
            if (lastSentence.endsWith('.') && correctedSentence.endsWith('.')) {
              finalSentence = correctedSentence.slice(0, -1);
            } else if (lastSentence.endsWith('!') && correctedSentence.endsWith('!')) {
              finalSentence = correctedSentence.slice(0, -1);
            } else if (lastSentence.endsWith('?') && correctedSentence.endsWith('?')) {
              finalSentence = correctedSentence.slice(0, -1);
            } else if (lastSentence.endsWith('\n') && correctedSentence.endsWith('\n')) {
              finalSentence = correctedSentence.slice(0, -1);
            }
            
            // 문장 앞뒤의 공백 패턴 확인
            let leadingSpace = '';
            let trailingSpace = '';
            
            // 현재 문장 위치 기준 앞뒤 문자 확인
            if (sentencePos > 0 && currentContent[sentencePos - 1] === ' ') {
              leadingSpace = ' ';
            }
            
            const endPos = sentencePos + lastSentence.length;
            if (endPos < currentContent.length && currentContent[endPos] === ' ') {
              trailingSpace = ' ';
            }
            
            // 공백 패턴을 유지하며 텍스트 교체
            editor.commands.setTextSelection({
              from: sentencePos - (leadingSpace ? 1 : 0),
              to: sentencePos + lastSentence.length + (trailingSpace ? 1 : 0)
            });
            editor.commands.deleteSelection();
            editor.commands.insertContent(leadingSpace + finalSentence + trailingSpace);
            
            // Highlight the differences between original and corrected text
            const originalWords = lastSentence.split(/\s+/);
            const correctedWords = finalSentence.split(/\s+/);
            
            // Find words that were changed
            const diffIndices = [];
            for (let i = 0; i < Math.min(originalWords.length, correctedWords.length); i++) {
              if (originalWords[i] !== correctedWords[i]) {
                diffIndices.push(i);
              }
            }
            
            if (diffIndices.length > 0) {
              // Calculate position of the changed word in the text
              let wordPos = sentencePos;
              for (let i = 0; i < diffIndices[0]; i++) {
                wordPos += correctedWords[i].length + 1;
              }
              
              const changedWord = correctedWords[diffIndices[0]];
              
              // Select and highlight the corrected word in green
              editor.commands.setTextSelection({
                from: wordPos,
                to: wordPos + changedWord.length
              });
              editor.commands.setMark('highlight', { color: 'green' });
              
              // Remove highlight after 1 second
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
          }
          correctedSentencesRef.current.add(correctedSentence);
        } catch (error) {
          console.error('[Editor] Grammar check failed:', error);
        } finally {
          isCorrectingRef.current = false;
        }
      }, 500);
    }
  };

  return { 
    handleSentenceUpdate,
    isEnabled,
    setIsEnabled
  };
} 