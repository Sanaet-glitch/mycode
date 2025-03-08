import React, { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface ArwesGridProps {
  className?: string;
  children: ReactNode;
  gap?: number;
  columns?: number;
}

export interface ArwesGridItemProps {
  className?: string;
  children: ReactNode;
  colSpan?: number;
  rowSpan?: number;
}

const ArwesGrid: React.FC<ArwesGridProps> = ({ 
  className, 
  children, 
  gap = 4, 
  columns = 12,
  ...rest 
}) => {
  return (
    <div
      className={cn(
        'grid',
        `grid-cols-${columns}`,
        `gap-${gap}`,
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
};

const ArwesGridItem: React.FC<ArwesGridItemProps> = ({ 
  className, 
  children, 
  colSpan = 1, 
  rowSpan = 1,
  ...rest 
}) => {
  return (
    <div
      className={cn(
        `col-span-${colSpan}`,
        `row-span-${rowSpan}`,
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
};

export { ArwesGrid, ArwesGridItem }; 