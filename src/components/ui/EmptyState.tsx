import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'text-center py-8 sm:py-12 text-gray-500 dark:text-gray-400',
        className
      )}
    >
      <div className="flex flex-col items-center space-y-3">
        {icon && (
          <div className="text-gray-400 dark:text-gray-600">
            {icon}
          </div>
        )}
        <div className="space-y-2">
          <p className="text-base sm:text-lg font-medium text-gray-700 dark:text-gray-300">
            {title}
          </p>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              {description}
            </p>
          )}
        </div>
        {action && (
          <div className="pt-2">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
