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
    
    // Check if the sentence ends
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
          
          // Extract sentences
          const sentences = currentContent.split(/(?<=[.!?\n])\s+/).filter(s => s.trim().length > 0);
          
          if (sentences.length === 0) {
            isCorrectingRef.current = false;
            return;
          }
          
          let lastSentence = sentences[sentences.length - 1].trim();
          
          // Skip short sentences, common greetings, and already corrected sentences
          if (lastSentence.length < 5 || 
              /^(Dear|Hello|Hi|Hey|Sincerely|Best|Regards|Thank|Thanks)/i.test(lastSentence) ||
              correctedSentencesRef.current.has(lastSentence)) {
            isCorrectingRef.current = false;
            return;
          }
          
          // Request grammar correction
          const correctedSentence = await checkGrammar(lastSentence);
          
          if (correctedSentence !== lastSentence) {
            console.log(`Grammar correction: "${lastSentence}" -> "${correctedSentence}"`);
            
            // Current text state
            const currentText = editor.getText();
            
            // Sentence position improvement
            const trimmedSentence = lastSentence.trim();
            let sentencePos = currentText.lastIndexOf(trimmedSentence);
            
            // If the exact position cannot be found, try a more accurate search
            if (sentencePos === -1) {
              // Search within the last 50-100 characters (performance improvement and accuracy improvement)
              const searchStart = Math.max(0, currentText.length - Math.max(100, trimmedSentence.length * 2));
              const textToSearch = currentText.substring(searchStart);
              
              // Find the exact text match
              for (let i = 0; i <= textToSearch.length - trimmedSentence.length; i++) {
                if (textToSearch.substring(i, i + trimmedSentence.length) === trimmedSentence) {
                  sentencePos = searchStart + i;
                  break;
                }
              }
              
              // If still not found, try searching word by word
              if (sentencePos === -1) {
                const words = trimmedSentence.split(/\s+/);
                for (let i = words.length - 1; i >= Math.ceil(words.length / 2); i--) {
                  const partialSentence = words.slice(0, i).join(' ');
                  if (partialSentence.length > 10) {
                    const partialPos = currentText.lastIndexOf(partialSentence);
                    if (partialPos !== -1) {
                      sentencePos = partialPos;
                      break;
                    }
                  }
                }
              }
            }
            
            console.log(`Found sentence at position: ${sentencePos}`);
            
            if (sentencePos === -1) {
              console.warn('Could not find sentence position for: ', trimmedSentence);
              isCorrectingRef.current = false;
              return;
            }
            
            try {
              // Prevent duplicate periods
              let finalSentence = correctedSentence;
              if (trimmedSentence.endsWith('.') && correctedSentence.endsWith('.')) {
                finalSentence = correctedSentence.slice(0, -1);
              }
              
              // Space addition logic improvement
              if (sentencePos > 0) {
                const prevChar = currentText[sentencePos - 1];
                if (['.', '!', '?'].includes(prevChar) && 
                    !finalSentence.startsWith(' ') &&
                    /^[A-Z]/.test(finalSentence)) {
                  finalSentence = ' ' + finalSentence;
                }
              }
              
              // Set the replacement range and text
              const startPos = sentencePos;
              const endPos = sentencePos + trimmedSentence.length;
              
              console.log(`Replacing text: [${startPos}, ${endPos}] "${currentText.substring(startPos, endPos)}" -> "${finalSentence}"`);
              
              // Replace with the corrected sentence
              const transaction = editor.state.tr.replaceWith(
                startPos,
                endPos,
                editor.schema.text(finalSentence)
              );
              
              // Word comparison logic (highlight only the actually corrected words)
              const originalWords = lastSentence.split(/\s+/);
              const correctedWords = correctedSentence.split(/\s+/);
              
              const changedWordIndices = [];
              for (let i = 0; i < Math.min(originalWords.length, correctedWords.length); i++) {
                if (originalWords[i] !== correctedWords[i]) {
                  changedWordIndices.push(i);
                }
              }
              
              if (changedWordIndices.length > 0 && editor.schema.marks.highlight) {
                // Replace first
                editor.view.dispatch(transaction);
                
                // Highlight only the actually corrected words
                for (const wordIndex of changedWordIndices) {
                  let wordPos = sentencePos;
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
                  
                  // Remove highlight after 1 second
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
              
              // Add the corrected sentence to the cache
              correctedSentencesRef.current.add(correctedSentence);
            } catch (error) {
              console.error('[Editor] Text replacement failed:', error);
            }
          }
        } catch (error) {
          console.error('[Editor] Grammar check failed:', error);
        } finally {
          // Unlock after 200ms
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