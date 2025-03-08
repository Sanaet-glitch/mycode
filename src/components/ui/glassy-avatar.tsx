import React from 'react';
import { cn } from '../../lib/utils';
import { getInitials } from '../../lib/utils';

export interface GlassyAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'default' | 'lg' | 'xl';
  variant?: 'default' | 'primary' | 'secondary' | 'accent';
  fallback?: React.ReactNode;
}

export function GlassyAvatar({
  className,
  src,
  alt,
  name,
  size = 'default',
  variant = 'default',
  fallback,
  ...props
}: GlassyAvatarProps) {
  // Determine the content to display if there's no image
  const getContent = () => {
    if (fallback) return fallback;
    if (name) return getInitials(name);
    return null;
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-full',
        {
          'w-8 h-8 text-xs': size === 'sm',
          'w-10 h-10 text-sm': size === 'default',
          'w-12 h-12 text-base': size === 'lg',
          'w-16 h-16 text-lg': size === 'xl',
          'border border-white/10 bg-background/30': variant === 'default',
          'border-2 border-primary bg-primary/20 neon-border': variant === 'primary',
          'border-2 border-secondary bg-secondary/20': variant === 'secondary',
          'border-2 border-accent bg-accent/20': variant === 'accent',
        },
        className
      )}
      {...props}
    >
      {src ? (
        <img 
          src={src} 
          alt={alt || name || 'Avatar'} 
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center backdrop-blur-glass font-medium uppercase">
          {getContent()}
        </div>
      )}
    </div>
  );
} 