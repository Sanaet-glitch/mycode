import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface GlassyTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
}

const GlassyTextarea = forwardRef<HTMLTextAreaElement, GlassyTextareaProps>(
  ({ className, error, label, ...props }, ref) => {
    return (
      <div className="space-y-2 w-full">
        {label && (
          <label className="text-sm font-medium text-foreground/80 block">
            {label}
          </label>
        )}
        <div className="relative">
          <textarea
            className={cn(
              'glass-input',
              'w-full min-h-[120px] rounded-md border border-white/10 bg-background/30 backdrop-blur-glass px-4 py-2 text-sm outline-none transition-colors',
              'focus:border-primary/30 focus:ring-2 focus:ring-primary/20',
              'placeholder:text-muted-foreground/50',
              error && 'border-destructive/50 focus:border-destructive focus:ring-destructive/20',
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <p className="text-sm text-destructive mt-1">{error}</p>
        )}
      </div>
    );
  }
);

GlassyTextarea.displayName = 'GlassyTextarea';

export { GlassyTextarea }; 