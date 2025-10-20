import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  closeOnBackdrop?: boolean;
  showCloseButton?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  showCloseButton = true,
}: ModalProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center sm:p-4 bg-white/20 dark:bg-black/40 backdrop-blur-md"
      onClick={handleBackdropClick}
    >
      <div
        className={cn(
          'bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-t-2xl sm:rounded-2xl w-full max-h-[90vh] sm:max-h-[85vh] overflow-y-auto border border-white/40 dark:border-white/20',
          'shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-1px_0_rgba(0,0,0,0.1)]',
          'dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.2)]',
          sizeClasses[size]
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/40 dark:border-white/20 sticky top-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md z-10">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center transition-all duration-200 hover:bg-white/30 dark:hover:bg-white/10 rounded-lg backdrop-blur-sm"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center gap-3 p-4 sm:p-6 pt-0 sm:pt-0 sticky bottom-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-t sm:border-t-0 border-white/40 dark:border-white/20">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
