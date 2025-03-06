'use client';

interface ActionButtonProps {
  icon: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
}

const ActionButton = ({ icon, children, variant = 'secondary', onClick }: ActionButtonProps) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-2 px-4 py-2 rounded-md transition-colors
      ${variant === 'primary' 
        ? 'bg-primary text-white hover:bg-primary-dark' 
        : 'bg-white text-gray-600 hover:bg-secondary border border-gray-200'
      }
    `}
  >
    <span className="material-icons text-[18px]">{icon}</span>
    <span>{children}</span>
  </button>
);

export default function ActionButtons() {
  const handleCancel = () => {
    console.log('Cancel clicked');
  };

  const handleOverallFix = () => {
    console.log('Overall Fix clicked');
  };

  const handleSend = () => {
    console.log('Send clicked');
  };

  return (
    <div className="flex justify-between items-center p-4 border-t border-gray-200">
      <ActionButton icon="cancel" onClick={handleCancel}>
        Cancel
      </ActionButton>
      
      <div className="flex gap-3">
        <ActionButton icon="auto_fix_high" onClick={handleOverallFix}>
          Overall Fix
        </ActionButton>
        <ActionButton icon="send" variant="primary" onClick={handleSend}>
          Send
        </ActionButton>
      </div>
    </div>
  );
} 