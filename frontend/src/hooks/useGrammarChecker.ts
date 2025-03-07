import { useRef, useState } from 'react';
import { Editor } from '@tiptap/react';
import { useEmailSocket } from '@/lib/websocket';

export function useGrammarChecker(editor: Editor | null) {
  // Socket connection for real-time grammar checking
  const { checkGrammar } = useEmailSocket();
  
  // Essential refs for state management
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isCorrectingRef = useRef(false);
  const lastCorrectionTimeRef = useRef<number>(0);
  const correctedSentencesRef = useRef<Set<string>>(new Set());
  
  const [isEnabled, setIsEnabled] = useState(true);

  const handleSentenceUpdate = async (currentContent: string) => {
    if (!editor || !isEnabled || isCorrectingRef.current) return;
    
    const now = Date.now();
    if (now - lastCorrectionTimeRef.current < 1500) return;
    
    // 문장 끝 확인 로직 (현재 사용중)
    const lastChar = currentContent[currentContent.length - 1];
    const isSentenceEnder = ['.', '!', '?', '\n'].includes(lastChar);
    
    if (isSentenceEnder) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      debounceTimerRef.current = setTimeout(async () => {
        if (isCorrectingRef.current) return;
        
        try {
          isCorrectingRef.current = true;
          lastCorrectionTimeRef.current = Date.now();
          
          // 문장 추출 간소화
          const sentences = currentContent.split(/(?<=[.!?\n])\s+/).filter(s => s.trim().length > 0);
          
          if (sentences.length === 0) {
            isCorrectingRef.current = false;
            return;
          }
          
          let lastSentence = sentences[sentences.length - 1].trim();
          
          // 문장 건너뛰기 조건 간소화
          if (lastSentence.length < 5 || 
              /^(Dear|Hello|Hi|Hey|Sincerely|Best|Regards|Thank|Thanks)/i.test(lastSentence) ||
              correctedSentencesRef.current.has(lastSentence)) {
            isCorrectingRef.current = false;
            return;
          }
          
          // 문법 교정 요청
          const correctedSentence = await checkGrammar(lastSentence);
          
          if (correctedSentence !== lastSentence) {
            // 교정된 문장 위치 계산
            const currentText = editor.getText();
            let sentencePos = currentText.lastIndexOf(lastSentence);
            
            if (sentencePos === -1) {
              console.warn('Could not find sentence position');
              isCorrectingRef.current = false;
              return;
            }
            
            // 문장 전후 컨텍스트 확인 로직 추가
            const beforeChar = sentencePos > 0 ? currentText[sentencePos - 1] : '';
            const leadingSpaces = /^\s+/.exec(lastSentence)?.[0] || '';
            
            // 수정 - 더 정확한 위치 계산을 위해 공백 처리 수정
            let leadingWhitespace = '';
            if (leadingSpaces) {
              leadingWhitespace = leadingSpaces;
              lastSentence = lastSentence.trimStart();
              sentencePos += leadingSpaces.length;
            }
            
            try {
              let finalSentence = correctedSentence;
              
              // 중복된 마침표 방지
              if (lastSentence.endsWith('.') && correctedSentence.endsWith('.')) {
                finalSentence = correctedSentence.slice(0, -1);
              } // 다른 punctuation 처리 유사하게 유지
              
              // 수정 - 정확한 교체 위치 사용
              const replacementText = finalSentence;
              
              // 수정 - 정확한 교체 범위 사용 (이전 문장 마침표를 포함하지 않도록)
              const transaction = editor.state.tr.replaceWith(
                sentencePos,
                sentencePos + lastSentence.length,
                editor.schema.text(replacementText)
              );
              
              // 단어 비교 로직 (실제 교정된 단어만 하이라이트)
              const originalWords = lastSentence.split(/\s+/);
              const correctedWords = correctedSentence.split(/\s+/);
              
              const changedWordIndices = [];
              for (let i = 0; i < Math.min(originalWords.length, correctedWords.length); i++) {
                if (originalWords[i] !== correctedWords[i]) {
                  changedWordIndices.push(i);
                }
              }
              
              if (changedWordIndices.length > 0 && editor.schema.marks.highlight) {
                // 교체 먼저 실행
                editor.view.dispatch(transaction);
                
                // 변경된 단어만 하이라이트
                for (const wordIndex of changedWordIndices) {
                  let wordPos = sentencePos + leadingWhitespace.length;
                  for (let i = 0; i < wordIndex; i++) {
                    wordPos += correctedWords[i].length + 1;
                  }
                  
                  const changedWord = correctedWords[wordIndex];
                  const highlightTransaction = editor.state.tr.addMark(
                    wordPos,
                    wordPos + changedWord.length,
                    editor.schema.marks.highlight.create({ color: '#C2E0C1' })
                  );
                  
                  editor.view.dispatch(highlightTransaction);
                  
                  // 1초 후 하이라이트 제거
                  setTimeout(() => {
                    if (editor && editor.isDestroyed !== true) {
                      editor.view.dispatch(
                        editor.state.tr.removeMark(
                          wordPos,
                          wordPos + changedWord.length,
                          editor.schema.marks.highlight
                        )
                      );
                    }
                  }, 1000);
                }
              } else {
                editor.view.dispatch(transaction);
              }
              
              // 교정된 문장 캐시에 추가
              correctedSentencesRef.current.add(correctedSentence);
            } catch (error) {
              console.error('[Editor] Text replacement failed:', error);
            }
          }
        } catch (error) {
          console.error('[Editor] Grammar check failed:', error);
        } finally {
          // 잠금 해제 지연
          setTimeout(() => {
            isCorrectingRef.current = false;
          }, 200);
        }
      }, 700);
    }
  };

  return { 
    handleSentenceUpdate,
    isEnabled,
    setIsEnabled
  };
} 