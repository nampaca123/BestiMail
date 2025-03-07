interface LoadingOverlayProps {
  message?: string;
}

export default function LoadingOverlay({ message = 'Improving your text...' }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
        <p className="text-gray-700">{message}</p>
      </div>
    </div>
  );
} 