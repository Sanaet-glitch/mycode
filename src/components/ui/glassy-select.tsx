import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

export interface GlassySelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
  error?: string;
  label?: string;
  icon?: React.ReactNode;
}

const GlassySelect = forwardRef<HTMLSelectElement, GlassySelectProps>(
  ({ className, options, error, label, icon, ...props }, ref) => {
    return (
      <div className="space-y-2 w-full">
        {label && (
          <label className="text-sm font-medium text-foreground/80 block">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}
          <select
            className={cn(
              'glass-input',
              'w-full appearance-none rounded-md border border-white/10 bg-background/30 backdrop-blur-glass px-4 py-2 text-sm outline-none transition-colors',
              'focus:border-primary/30 focus:ring-2 focus:ring-primary/20',
              icon && 'pl-10',
              error && 'border-destructive/50 focus:border-destructive focus:ring-destructive/20',
              className
            )}
            ref={ref}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-muted-foreground">
            <ChevronDown size={16} />
          </div>
        </div>
        {error && (
          <p className="text-sm text-destructive mt-1">{error}</p>
        )}
      </div>
    );
  }
);

GlassySelect.displayName = 'GlassySelect';

export { GlassySelect }; 