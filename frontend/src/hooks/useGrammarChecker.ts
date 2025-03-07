import { useRef } from 'react';
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

  const handleSentenceUpdate = async (currentContent: string) => {
    // Skip if editor is not ready or correction is in progress
    if (!editor || isCorrectingRef.current) return;
    
    // Throttle corrections to once per second
    const now = Date.now();
    if (now - lastCorrectionTimeRef.current < 1000) return;
    
    // Check if the last character is a sentence terminator
    const lastChar = currentContent[currentContent.length - 1];
    
    if (['.', '!', '?'].includes(lastChar)) {
      // Clear existing timer to prevent multiple corrections
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      // Debounce the correction process to wait for user to finish typing
      debounceTimerRef.current = setTimeout(async () => {
        if (isCorrectingRef.current) return;
        
        // Extract the last sentence using regex
        const sentenceRegex = /[^.!?]+[.!?]$/;
        const match = currentContent.match(sentenceRegex);
        
        if (match && match[0]) {
          const lastSentence = match[0].trim();
          
          // Skip if sentence was already processed
          if (lastSentence === lastSentenceRef.current || 
              correctedSentencesRef.current.has(lastSentence)) {
            return;
          }
          
          lastSentenceRef.current = lastSentence;
          
          try {
            // Enable correction lock and update timestamp
            isCorrectingRef.current = true;
            lastCorrectionTimeRef.current = Date.now();
            
            // Request grammar correction from the server
            const correctedSentence = await checkGrammar(lastSentence);
            
            // Apply corrections if the sentence was modified
            if (correctedSentence !== lastSentence) {
              // Find the position of the sentence in the content
              const sentencePos = currentContent.lastIndexOf(lastSentence);
              if (sentencePos === -1) {
                isCorrectingRef.current = false;
                return;
              }

              // Handle period preservation in corrections
              const finalSentence = lastSentence.endsWith('.') && correctedSentence.endsWith('.')
                ? correctedSentence.slice(0, -1)
                : correctedSentence;
              
              // Replace the original sentence with the corrected version
              editor.commands.setTextSelection({
                from: sentencePos,
                to: sentencePos + lastSentence.length
              });
              editor.commands.deleteSelection();
              editor.commands.insertContent(finalSentence);
              
              // Highlight the differences between original and corrected text
              const originalWords = lastSentence.split(/\s+/);
              const correctedWords = correctedSentence.split(/\s+/);
              
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
                
                // Add corrected sentence to cache
                correctedSentencesRef.current.add(finalSentence);
                
                // Release correction lock after 3 seconds
                // This delay prevents rapid consecutive corrections
                setTimeout(() => {
                  isCorrectingRef.current = false;
                }, 3000);
              } else {
                // If no changes were needed, cache the sentence and release lock
                correctedSentencesRef.current.add(lastSentence);
                isCorrectingRef.current = false;
              }
            } else {
              correctedSentencesRef.current.add(lastSentence);
              isCorrectingRef.current = false;
            }
          } catch (error) {
            console.error('[Editor] Grammar check failed:', error);
            isCorrectingRef.current = false;
          }
        }
      }, 500); // 500ms debounce delay
    }
  };

  return { handleSentenceUpdate };
} 