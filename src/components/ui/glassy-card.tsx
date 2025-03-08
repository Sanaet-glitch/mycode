import React from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface GlassyCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger' | 'premium';
  hoverEffect?: boolean;
  glowIntensity?: 'none' | 'low' | 'medium' | 'high';
  animated?: boolean;
  borderHighlight?: boolean;
  gradient?: boolean;
  theme?: 'light' | 'dark';
  highlightEffect?: boolean;
  borderGlow?: boolean;
  floatingEffect?: boolean;
}

export function GlassyCard({
  className,
  children,
  variant = 'default',
  hoverEffect = true,
  glowIntensity = 'medium',
  animated = false,
  borderHighlight = false,
  gradient = false,
  theme = 'light',
  highlightEffect = true,
  borderGlow = false,
  floatingEffect = false,
  ...props
}: GlassyCardProps) {
  // Function to get shadow classes based on glow intensity
  const getShadowClass = () => {
    if (theme === 'dark') {
      switch (glowIntensity) {
        case 'none': return 'shadow-none';
        case 'low': return 'shadow-glass-dark-sm';
        case 'high': return 'shadow-glass-dark-lg';
        case 'medium':
        default: return 'shadow-glass-dark';
      }
    } else {
      switch (glowIntensity) {
        case 'none': return 'shadow-none';
        case 'low': return 'shadow-glass-sm';
        case 'high': return 'shadow-glass-lg';
        case 'medium':
        default: return 'shadow-glass';
      }
    }
  };

  const cardContent = (
    <div
      className={cn(
        theme === 'light' ? 'glass-card' : 'glass-card-dark',
        'relative overflow-hidden',
        {
          'glass-premium': variant === 'premium' && theme === 'light',
          'glass-premium-dark': variant === 'premium' && theme === 'dark',
          'hover-element': hoverEffect,
          'gradient-overlay': gradient,
          'neon-border': borderGlow || borderHighlight,
          'glass-highlight': highlightEffect,
          
          // Variant-specific styles
          'border-l-primary/50': variant === 'primary' && borderHighlight,
          'border-l-secondary/50': variant === 'secondary' && borderHighlight,
          'border-l-accent/50': variant === 'accent' && borderHighlight,
          'border-l-success/50': variant === 'success' && borderHighlight,
          'border-l-amber-500/50': variant === 'warning' && borderHighlight,
          'border-l-red-500/50': variant === 'danger' && borderHighlight,
        },
        getShadowClass(),
        className
      )}
      {...props}
    >
      {/* Variant decorative elements */}
      {variant !== 'default' && variant !== 'premium' && (
        <div 
          className={cn(
            'absolute top-0 right-0 w-20 h-20 rounded-bl-3xl',
            {
              'bg-primary/10': variant === 'primary',
              'bg-secondary/10': variant === 'secondary',
              'bg-accent/10': variant === 'accent',
              'bg-green-500/10': variant === 'success',
              'bg-amber-500/10': variant === 'warning',
              'bg-red-500/10': variant === 'danger',
            }
          )} 
        />
      )}
      
      {/* Premium variant special effects */}
      {variant === 'premium' && (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-white/10 z-0 pointer-events-none" />
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl z-0" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl z-0" />
        </>
      )}
      
      {/* Main content */}
      <div className="relative z-10">{children}</div>
      
      {/* Accent line at bottom for certain variants */}
      {(variant === 'primary' || variant === 'secondary' || variant === 'accent' || variant === 'premium') && (
        <div 
          className={cn(
            'absolute bottom-0 left-0 h-1 w-full opacity-50',
            {
              'bg-gradient-to-r from-transparent via-primary to-transparent': variant === 'primary',
              'bg-gradient-to-r from-transparent via-secondary to-transparent': variant === 'secondary',
              'bg-gradient-to-r from-transparent via-accent to-transparent': variant === 'accent',
              'bg-gradient-to-r from-blue-400/50 via-indigo-500/50 to-purple-500/50': variant === 'premium',
            }
          )}
        />
      )}
    </div>
  );

  if (animated || floatingEffect) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={floatingEffect ? {
            opacity: 1,
            y: [0, -5, 0],
            transition: {
              y: {
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              },
              opacity: {
                duration: 0.3
              }
            }
          } : { 
            opacity: 1, 
            y: 0,
            transition: { duration: 0.3, ease: "easeOut" } 
          }}
          exit={{ opacity: 0, y: -20 }}
          whileHover={hoverEffect ? { y: -5, transition: { duration: 0.2 } } : undefined}
        >
          {cardContent}
        </motion.div>
      </AnimatePresence>
    );
  }

  return cardContent;
} 