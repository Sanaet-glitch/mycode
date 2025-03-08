import React from 'react';
import { cn } from '../../lib/utils';

export interface GlassyBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'accent' | 'outline';
  size?: 'sm' | 'default' | 'lg';
}

export function GlassyBadge({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: GlassyBadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium transition-colors',
        'backdrop-blur-glass border',
        {
          'bg-background/20 border-white/10 text-foreground': variant === 'default',
          'bg-primary/20 border-primary/30 text-primary neon-text': variant === 'primary',
          'bg-secondary/20 border-secondary/30 text-secondary': variant === 'secondary',
          'bg-accent/20 border-accent/30 text-accent': variant === 'accent',
          'bg-transparent border-white/10 text-foreground': variant === 'outline',
          'px-2 py-0.5 text-[10px]': size === 'sm',
          'px-4 py-1.5 text-sm': size === 'lg',
        },
        className
      )}
      {...props}
    />
  );
} 