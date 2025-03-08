import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
  speed: number;
}

interface GlassContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  particleCount?: number;
  showParticles?: boolean;
  showGlowOrbs?: boolean;
  blurIntensity?: 'none' | 'xs' | 'sm' | 'medium' | 'lg' | 'xl';
  className?: string;
  variant?: 'default' | 'premium' | 'frosted' | 'smooth';
  theme?: 'light' | 'dark';
  highlightEffect?: boolean;
  borderGlow?: boolean;
  floatingEffect?: boolean;
}

export function GlassContainer({
  children,
  particleCount = 15,
  showParticles = true,
  showGlowOrbs = true,
  blurIntensity = 'medium',
  className,
  variant = 'default',
  theme = 'light',
  highlightEffect = true,
  borderGlow = false,
  floatingEffect = false,
  ...props
}: GlassContainerProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  // Update container size on resize
  useEffect(() => {
    if (!container) return;

    const updateSize = () => {
      setContainerSize({
        width: container.offsetWidth,
        height: container.offsetHeight,
      });
    };

    // Initial size
    updateSize();

    // Add resize listener
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [container]);

  // Generate particles
  useEffect(() => {
    if (!containerSize.width || !containerSize.height) return;

    const newParticles: Particle[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      const colorPalette = theme === 'light' 
        ? ['rgba(155, 135, 245, 1)', 'rgba(126, 105, 171, 1)', 'rgba(14, 165, 233, 1)'] 
        : ['rgba(59, 130, 246, 0.8)', 'rgba(99, 102, 241, 0.8)', 'rgba(139, 92, 246, 0.8)'];
      
      newParticles.push({
        id: i,
        x: Math.random() * containerSize.width,
        y: Math.random() * containerSize.height,
        size: Math.random() * 6 + 2,
        color: colorPalette[i % 3],
        opacity: Math.random() * 0.4 + 0.2,
        speed: Math.random() * 1.5 + 0.5,
      });
    }
    
    setParticles(newParticles);
  }, [containerSize, particleCount, theme]);

  // Function to get the blur intensity class
  const getBlurClass = () => {
    switch (blurIntensity) {
      case 'none': return 'backdrop-filter-none';
      case 'xs': return 'backdrop-filter-glass-xs';
      case 'sm': return 'backdrop-filter-glass-sm';
      case 'lg': return 'backdrop-filter-glass-lg';
      case 'xl': return 'backdrop-filter-glass-xl';
      case 'medium':
      default: return 'backdrop-filter-glass';
    }
  };

  // Function to get shadow class
  const getShadowClass = () => {
    const baseClass = theme === 'light' ? 'shadow-glass' : 'shadow-glass-dark';
    
    switch (blurIntensity) {
      case 'none': return 'shadow-none';
      case 'xs': return theme === 'light' ? 'shadow-glass-xs' : 'shadow-glass-dark-xs';
      case 'sm': return theme === 'light' ? 'shadow-glass-sm' : 'shadow-glass-dark-sm';
      case 'lg': return theme === 'light' ? 'shadow-glass-lg' : 'shadow-glass-dark-lg';
      case 'xl': return theme === 'light' ? 'shadow-glass-xl' : 'shadow-glass-dark-xl';
      case 'medium':
      default: return baseClass;
    }
  };

  return (
    <motion.div 
      ref={setContainer}
      className={cn(
        'relative overflow-hidden glass-morphism-container',
        {
          // Variant classes
          'glass-premium': variant === 'premium' && theme === 'light',
          'glass-premium-dark': variant === 'premium' && theme === 'dark',
          'glass-card': variant === 'default' && theme === 'light',
          'glass-card-dark': variant === 'default' && theme === 'dark',
          'bg-glass': (variant === 'frosted' || variant === 'smooth') && theme === 'light',
          'bg-glass-dark': (variant === 'frosted' || variant === 'smooth') && theme === 'dark',
          
          // Effect classes
          'glass-highlight': highlightEffect,
          'neon-border': borderGlow,
          
          // Animation class
          'animate-float': floatingEffect,
        },
        getBlurClass(),
        getShadowClass(),
        className
      )}
      {...props}
      animate={floatingEffect ? {
        y: [0, -10, 0],
        transition: { 
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }
      } : undefined}
    >
      {/* Background particles */}
      {showParticles && particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full z-0"
          initial={{ 
            x: particle.x,
            y: particle.y,
            opacity: particle.opacity,
          }}
          animate={{ 
            y: [
              particle.y,
              particle.y + (Math.random() * 100 - 50) * particle.speed,
              particle.y,
            ],
            x: [
              particle.x,
              particle.x + (Math.random() * 100 - 50) * particle.speed,
              particle.x,
            ],
            opacity: [
              particle.opacity,
              particle.opacity * 0.7,
              particle.opacity,
            ]
          }}
          transition={{ 
            duration: 8 + Math.random() * 12, 
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          }}
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            opacity: particle.opacity,
          }}
        />
      ))}
      
      {/* Glowing orbs */}
      {showGlowOrbs && (
        <>
          <div className={cn(
            "absolute -top-20 -left-20 w-60 h-60 rounded-full filter blur-[80px] animate-pulse-slow z-0",
            {
              "bg-primary/20": theme === 'light',
              "bg-primary/10": theme === 'dark'
            }
          )} />
          <div className={cn(
            "absolute -bottom-20 -right-20 w-60 h-60 rounded-full filter blur-[80px] animate-pulse-slow z-0",
            {
              "bg-accent/20": theme === 'light',
              "bg-accent/10": theme === 'dark'
            }
          )} />
        </>
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
} 