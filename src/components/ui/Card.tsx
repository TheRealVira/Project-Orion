import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  children: ReactNode;
}

const variantClasses = {
  default: 'card',
  bordered: 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg',
  elevated: 'bg-white dark:bg-gray-800 rounded-lg shadow-lg',
};

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4 sm:p-6',
  lg: 'p-6 sm:p-8',
};

export default function Card({
  variant = 'default',
  padding = 'md',
  hover = false,
  className = '',
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        variantClasses[variant],
        paddingClasses[padding],
        hover && 'transition-shadow hover:shadow-lg',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
