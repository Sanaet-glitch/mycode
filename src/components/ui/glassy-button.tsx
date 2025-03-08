import React from 'react';
import { cn } from '../../lib/utils';

interface GlassyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'accent' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
}

export function GlassyButton({
  className,
  children,
  variant = 'default',
  size = 'default',
  isLoading = false,
  ...props
}: GlassyButtonProps) {
  return (
    <button
      className={cn(
        'glass-button',
        {
          'neon-text': variant === 'outline',
          'neon-border': variant === 'outline',
          'bg-primary/80 hover:bg-primary/90': variant === 'primary',
          'bg-secondary/80 hover:bg-secondary/90': variant === 'secondary',
          'bg-accent/80 hover:bg-accent/90': variant === 'accent',
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-6 py-3 text-lg': size === 'lg',
          'p-2 aspect-square': size === 'icon',
          'opacity-80 pointer-events-none': isLoading,
        },
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
} 