import React from 'react';
import { cn } from '@/lib/utils';

interface PageWrapperProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function PageWrapper({
  children,
  title,
  description,
  className,
}: PageWrapperProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {(title || description) && (
        <div className="glass-card-dark p-6 rounded-xl border border-white/10">
          {title && (
            <h1 className="text-xl font-semibold text-white mb-2">{title}</h1>
          )}
          {description && (
            <p className="text-gray-400 text-sm">{description}</p>
          )}
        </div>
      )}
      <div className="glass-card-dark rounded-xl border border-white/10 p-6">
        {children}
      </div>
    </div>
  );
}

// Specialized version for data display
export function DataPageWrapper({
  children,
  title,
  description,
  className,
}: PageWrapperProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {(title || description) && (
        <div className="glass-card-dark p-6 rounded-xl border border-white/10">
          {title && (
            <h1 className="text-xl font-semibold text-white mb-2">{title}</h1>
          )}
          {description && (
            <p className="text-gray-400 text-sm">{description}</p>
          )}
        </div>
      )}
      <div className="glass-card-dark rounded-xl border border-white/10 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

// Card wrapper for dashboard widgets
export function CardWrapper({
  children,
  title,
  icon,
  className,
}: {
  children: React.ReactNode;
  title?: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("glass-card-dark rounded-xl border border-white/10 p-6", className)}>
      {title && (
        <div className="flex items-center gap-2 mb-4">
          {icon && <div className="text-primary">{icon}</div>}
          <h2 className="text-lg font-medium text-white">{title}</h2>
        </div>
      )}
      {children}
    </div>
  );
} 