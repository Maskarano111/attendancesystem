import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden dark:bg-gray-800 dark:border-gray-700 transition-all duration-300',
        hoverable && 'hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-700',
        className
      )}
      {...props}
    />
  )
);

Card.displayName = 'Card';

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  withGradient?: boolean;
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, withGradient = true, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'px-6 py-5 border-b border-gray-100 dark:border-gray-700',
        withGradient && 'bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-900 dark:to-transparent',
        className
      )}
      {...props}
    />
  )
);

CardHeader.displayName = 'CardHeader';

interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardBody = React.forwardRef<HTMLDivElement, CardBodyProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6', className)} {...props} />
  )
);

CardBody.displayName = 'CardBody';

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  withBorder?: boolean;
}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, withBorder = true, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'px-6 py-4',
        withBorder && 'border-t border-gray-100 dark:border-gray-700',
        className
      )}
      {...props}
    />
  )
);

CardFooter.displayName = 'CardFooter';
