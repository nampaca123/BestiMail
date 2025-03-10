import { useRef, useState, useEffect } from 'react';
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
          
          // Sentence splitter
          const sentences = currentContent
            .split(/([.!?\n])/)  // Split by sentence enders
            .reduce((result: string[], part, index, array) => {
              // Odd index is separator, even index is sentence content
              if (index % 2 === 0) {
                // If next element exists (separator), combine current part and separator
                if (index + 1 < array.length) {
                  result.push(part + array[index + 1]);
                } else {
                  // If last part, just save it
                  if (part) result.push(part);
                }
              }
              return result;
            }, [])
            .filter(s => s.trim().length > 0);
          
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
            
            // Logic for finding sentence position
            const trimmedSentence = lastSentence.trim();
            
            // Check for leading and trailing spaces in the original text before finding sentence position
            let sentencePos = currentText.lastIndexOf(trimmedSentence);
            let leadingSpace = false;
            let trailingSpace = false;
            
            // Improved search logic for finding sentence position
            if (sentencePos === -1) {
              // Search within last 100 characters (performance and accuracy improvement)
              const searchStart = Math.max(0, currentText.length - Math.max(100, trimmedSentence.length * 2));
              const textToSearch = currentText.substring(searchStart);
              
              for (let i = 0; i <= textToSearch.length - trimmedSentence.length; i++) {
                if (textToSearch.substring(i, i + trimmedSentence.length) === trimmedSentence) {
                  sentencePos = searchStart + i;
                  
                  // Check for leading and trailing spaces
                  if (sentencePos > 0) {
                    leadingSpace = currentText[sentencePos - 1] === ' ';
                  }
                  if (sentencePos + trimmedSentence.length < currentText.length) {
                    trailingSpace = currentText[sentencePos + trimmedSentence.length] === ' ';
                  }
                  break;
                }
              }
              
              // Still not found, search word by word
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
            } else {
              // Check for leading and trailing spaces
              if (sentencePos > 0) {
                leadingSpace = currentText[sentencePos - 1] === ' ';
              }
              if (sentencePos + trimmedSentence.length < currentText.length) {
                trailingSpace = currentText[sentencePos + trimmedSentence.length] === ' ';
              }
            }
            
            console.log(`Found sentence at position: ${sentencePos}`);
            
            if (sentencePos === -1) {
              console.warn('Could not find sentence position for: ', trimmedSentence);
              isCorrectingRef.current = false;
              return;
            }
            
            try {
              // Logic for preserving spaces
              let finalSentence = correctedSentence;
              
              // Prevent duplicate periods
              if ((trimmedSentence.endsWith('.') && correctedSentence.endsWith('.')) ||
                  (trimmedSentence.endsWith('!') && correctedSentence.endsWith('!')) ||
                  (trimmedSentence.endsWith('?') && correctedSentence.endsWith('?'))) {
                finalSentence = correctedSentence.slice(0, -1);
              }
              
              // Preserve leading spaces (if previous character is a sentence ender or there was an original space)
              if (sentencePos > 0) {
                const prevChar = currentText[sentencePos - 1];
                if ((['.', '!', '?'].includes(prevChar) && !finalSentence.startsWith(' ')) || leadingSpace) {
                  if (!finalSentence.startsWith(' ')) {
                    finalSentence = ' ' + finalSentence;
                  }
                }
              }
                         
              // Debug log
              console.log(`Original: "${trimmedSentence}"`);
              console.log(`Corrected: "${finalSentence}"`);
              
              // Set the replacement range and text
              const startPos = sentencePos;
              const endPos = sentencePos + trimmedSentence.length;
              
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
                  // Adjust position if leading space was added
                  if (finalSentence.startsWith(' ') && !trimmedSentence.startsWith(' ')) {
                    wordPos += 1;
                  }
                  
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

  // Directly detect changes in TipTap editor
  useEffect(() => {
    if (!editor || !isEnabled) return;
    
    // Add keyboard event handler - directly detect Enter key
    const handleKeyDown = (event: Event) => {
      const keyEvent = event as KeyboardEvent;
      if (keyEvent.key === 'Enter' && !keyEvent.shiftKey) {
        // Immediately run grammar correction logic when Enter key is detected
        setTimeout(() => {
          const currentContent = editor.getText();
          console.log('Enter key detected, checking grammar');
          handleSentenceUpdate(currentContent);
        }, 10); // Delay to ensure editor state is updated
      }
    };
    
    // Event called after editor transaction is complete
    const handleTransaction = ({ transaction }: { transaction: any }) => {
      // Detect sentence ender input
      const isEndPunctuation = transaction.steps.some((step: any) => {
        if (step.from !== undefined && step.to !== undefined && step.from === step.to - 1) {
          const insertedChar = transaction.doc.textBetween(step.from, step.to);
          return ['.', '!', '?'].includes(insertedChar);
        }
        return false;
      });
      
      if (isEndPunctuation) {
        // Run grammar correction logic
        const currentContent = editor.getText();
        console.log('Punctuation detected, checking grammar');
        handleSentenceUpdate(currentContent);
      }
    };
    
    // Register DOM event listener (for Enter key detection)
    const editorElement = document.querySelector('.ProseMirror');
    if (editorElement) {
      editorElement.addEventListener('keydown', handleKeyDown);
    }
    
    // Register transaction event listener (for sentence ender detection)
    editor.on('transaction', handleTransaction);
    
    return () => {
      // Remove event listeners on component unmount
      if (editorElement) {
        editorElement.removeEventListener('keydown', handleKeyDown);
      }
      editor.off('transaction', handleTransaction);
    };
  }, [editor, isEnabled]);

  return { 
    handleSentenceUpdate,
    isEnabled,
    setIsEnabled
  };
} 