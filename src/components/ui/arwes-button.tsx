import React, { ReactNode, ButtonHTMLAttributes } from 'react';
import { Animator } from '../../../arwes/packages/react-animator/src';
import { cn } from '../../lib/utils';

export interface ArwesButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
}

const ArwesButton = (props: ArwesButtonProps) => {
  const { children, variant = 'primary', size = 'default', className, disabled, ...rest } = props;

  // Map variant to Arwes colors
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-500 text-white';
      case 'secondary':
        return 'bg-yellow-500 text-black';
      case 'destructive':
        return 'bg-red-500 text-white';
      case 'outline':
        return 'bg-transparent border border-blue-500 text-blue-500';
      case 'ghost':
        return 'bg-transparent text-blue-500 hover:bg-blue-100';
      case 'link':
        return 'bg-transparent text-blue-500 underline-offset-4 hover:underline';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  // Map size to padding and font size
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs py-1 px-3';
      case 'lg':
        return 'text-base py-2 px-5';
      case 'icon':
        return 'h-9 w-9';
      default:
        return 'text-sm py-1.5 px-4';
    }
  };

  return (
    <Animator>
      <button
        className={cn(
          'relative inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none',
          getVariantClasses(),
          getSizeClasses(),
          className
        )}
        disabled={disabled}
        {...rest}
      >
        <span className="relative z-10 flex items-center justify-center">
          {children}
        </span>
      </button>
    </Animator>
  );
};

export { ArwesButton }; 