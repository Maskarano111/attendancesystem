import React from 'react';
import { cn } from '../../lib/utils';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  onClose?: () => void;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, type = 'info', title, onClose, children, ...props }, ref) => {
    const types = {
      success: 'bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800',
      error: 'bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800',
      warning: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-800',
      info: 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800',
    };

    const titleColors = {
      success: 'text-green-800 dark:text-green-200',
      error: 'text-red-800 dark:text-red-200',
      warning: 'text-yellow-800 dark:text-yellow-200',
      info: 'text-blue-800 dark:text-blue-200',
    };

    const textColors = {
      success: 'text-green-700 dark:text-green-300',
      error: 'text-red-700 dark:text-red-300',
      warning: 'text-yellow-700 dark:text-yellow-300',
      info: 'text-blue-700 dark:text-blue-300',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg border p-4 animate-fade-in',
          types[type],
          className
        )}
        {...props}
      >
        <div className="flex gap-3">
          <div className="flex-1">
            {title && <h3 className={cn('font-semibold text-sm', titleColors[type])}>{title}</h3>}
            <div className={cn('text-sm', textColors[type], title && 'mt-1')}>
              {children}
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className={cn('flex-shrink-0 font-bold', titleColors[type])}
              aria-label="Close alert"
            >
              ×
            </button>
          )}
        </div>
      </div>
    );
  }
);

Alert.displayName = 'Alert';
