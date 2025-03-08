import React, { ReactNode, HTMLAttributes } from 'react';
import { Animator } from '../../../arwes/packages/react-animator/src';
import { cn } from '../../lib/utils';

export interface ArwesCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  title?: string;
  palette?: 'primary' | 'secondary' | 'success' | 'error' | 'info';
}

const ArwesCard = (props: ArwesCardProps) => {
  const { children, className, title, palette = 'primary', ...rest } = props;

  // Map palette to colors
  const getPaletteClasses = () => {
    switch (palette) {
      case 'primary':
        return 'border-blue-500';
      case 'secondary':
        return 'border-yellow-500';
      case 'success':
        return 'border-green-500';
      case 'error':
        return 'border-red-500';
      case 'info':
        return 'border-cyan-500';
      default:
        return 'border-blue-500';
    }
  };

  return (
    <Animator>
      <div
        className={cn(
          'relative overflow-hidden rounded-md bg-black/80 border-2 p-0.5',
          getPaletteClasses(),
          className
        )}
        {...rest}
      >
        <div className="relative z-10 p-4">
          {title && (
            <div className="mb-4 border-b border-border pb-2">
              <h3 className="text-lg font-semibold">
                {title}
              </h3>
            </div>
          )}
          <div>{children}</div>
        </div>
      </div>
    </Animator>
  );
};

export { ArwesCard }; 