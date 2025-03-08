import React, { forwardRef, useState } from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

export interface GlassyInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: string;
  label?: string;
  theme?: 'light' | 'dark';
  variant?: 'default' | 'premium' | 'frosted';
  blurIntensity?: 'low' | 'medium' | 'high';
  highlightOnFocus?: boolean;
}

const GlassyInput = forwardRef<HTMLInputElement, GlassyInputProps>(
  ({ 
    className, 
    type, 
    icon, 
    error, 
    label, 
    theme = 'light',
    variant = 'default',
    blurIntensity = 'medium',
    highlightOnFocus = true,
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    // Determine blur class based on intensity
    const getBlurClass = () => {
      switch (blurIntensity) {
        case 'low': return 'backdrop-filter-glass-sm';
        case 'high': return 'backdrop-filter-glass-lg';
        case 'medium':
        default: return 'backdrop-filter-glass';
      }
    };

    // Determine base class based on theme and variant
    const getBaseClass = () => {
      if (variant === 'premium') {
        return theme === 'light' ? 'glass-premium' : 'glass-premium-dark';
      }
      return theme === 'light' ? 'glass-input' : 'glass-input bg-[#111928]/20 border-white/10';
    };

    return (
      <div className="space-y-2 w-full">
        {label && (
          <label className="text-sm font-medium text-foreground/80 block">
            {label}
          </label>
        )}
        <div className={cn(
          "relative",
          {
            "animate-glow-pulse": isFocused && highlightOnFocus && variant === 'premium',
          }
        )}>
          {icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              getBaseClass(),
              getBlurClass(),
              'w-full rounded-md border px-4 py-2 text-sm outline-none transition-all duration-300',
              'focus:border-primary/30 focus:ring-2 focus:ring-primary/20',
              'placeholder:text-muted-foreground/50',
              icon && 'pl-10',
              error && 'border-destructive/50 focus:border-destructive focus:ring-destructive/20',
              {
                'shadow-glass-sm': variant === 'premium' && !isFocused,
                'shadow-glass': variant === 'premium' && isFocused,
                'scale-[1.01] transform': isFocused && highlightOnFocus,
              },
              className
            )}
            ref={ref}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
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

GlassyInput.displayName = 'GlassyInput';

export { GlassyInput }; 