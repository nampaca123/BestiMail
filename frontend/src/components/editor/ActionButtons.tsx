'use client';

import { useState } from 'react';
import { useEmailSocket } from '@/lib/websocket';
import { EmailActionButtonProps, EmailActionContainerProps } from '@/types/email';
import LoadingOverlay from '@/components/common/LoadingOverlay';
import { useToast } from '@/hooks/useToast';

// Button component for email editor actions with consistent styling
const EmailEditorButton = ({ icon, children, variant = 'secondary', onClick, disabled }: EmailActionButtonProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      flex items-center gap-2 px-4 py-2 rounded-md transition-colors
      ${variant === 'primary' 
        ? 'bg-primary text-white hover:bg-primary-dark disabled:bg-primary/50' 
        : 'bg-white text-gray-600 hover:bg-secondary border border-gray-200 disabled:bg-gray-100'
      }
      disabled:cursor-not-allowed
    `}
  >
    <span className="material-icons text-[18px]">{icon}</span>
    <span>{children}</span>
  </button>
);

export default function EmailEditorActions({ editor, headerData, sendEmail }: EmailActionContainerProps) {
  // State for managing loading states during async operations
  const [isLoading, setIsLoading] = useState(false);
  const { formalizeText } = useEmailSocket();
  const { showToast } = useToast();

  // Clears the editor content when canceling
  const handleCancel = () => {
    if (editor) {
      editor.commands.clearContent();
    }
  };

  // Improves the overall text formality using AI
  const handleOverallFix = async () => {
    if (!editor) return;
    
    try {
      setIsLoading(true);
      const currentContent = editor.getHTML();
      const formalizedText = await formalizeText(currentContent);
      
      editor.commands.setContent(formalizedText);
    } catch (error) {
      console.error('Failed to formalize text:', error);
      showToast('Failed to improve text. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handles the email sending process
  const handleSend = async () => {
    // Validate required fields
    if (!editor || !headerData.to || !headerData.subject) {
      showToast('Please fill in all required fields (To and Subject)', 'error');
      return;
    }

    try {
      setIsLoading(true);
      const content = editor.getHTML();
      const success = await sendEmail(headerData.to, headerData.cc, headerData.subject, content);
      
      if (success) {
        showToast('Email sent successfully!', 'success');
        editor.commands.clearContent();
      } else {
        showToast('Failed to send email. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      showToast('Failed to send email. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading && <LoadingOverlay />}
      <div className="flex justify-between items-center p-4 border-t border-gray-200">
        <EmailEditorButton 
          icon="cancel" 
          onClick={handleCancel}
          disabled={isLoading}
        >
          Cancel
        </EmailEditorButton>
        
        <div className="flex gap-3">
          <EmailEditorButton 
            icon="auto_fix_high" 
            onClick={handleOverallFix}
            disabled={isLoading}
          >
            {isLoading ? 'Improving...' : 'Overall Fix'}
          </EmailEditorButton>
          <EmailEditorButton 
            icon="send" 
            variant="primary" 
            onClick={handleSend}
            disabled={isLoading}
          >
            Send
          </EmailEditorButton>
        </div>
      </div>
    </>
  );
} 