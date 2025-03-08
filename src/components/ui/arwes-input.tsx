import React, { InputHTMLAttributes, forwardRef } from 'react';
import { Animator } from '../../../arwes/packages/react-animator/src';
import { cn } from '../../lib/utils';

export interface ArwesInputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  error?: boolean;
}

const ArwesInput = forwardRef<HTMLInputElement, ArwesInputProps>((props, ref) => {
  const { className, error, ...rest } = props;

  return (
    <Animator>
      <div className="relative">
        <div className={cn(
          'absolute inset-0 rounded-md border-2',
          error ? 'border-red-500' : 'border-blue-500'
        )} />
        <input
          ref={ref}
          className={cn(
            'relative z-10 flex h-9 w-full rounded-md bg-transparent px-3 py-1 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          {...rest}
        />
      </div>
    </Animator>
  );
});

ArwesInput.displayName = 'ArwesInput';

export { ArwesInput }; 