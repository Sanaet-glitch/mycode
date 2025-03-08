import React, { ReactNode } from 'react';
import { Animator } from '../../../arwes/packages/react-animator/src';
import { cn } from '../../lib/utils';

export interface ArwesPageWrapperProps {
  className?: string;
  children: ReactNode;
}

const ArwesPageWrapper = (props: ArwesPageWrapperProps) => {
  const { className, children, ...rest } = props;

  return (
    <Animator>
      <div
        className={cn(
          'relative min-h-screen w-full bg-black border-4 border-blue-500',
          className
        )}
        {...rest}
      >
        <div className="relative z-10 p-6">
          {children}
        </div>
      </div>
    </Animator>
  );
};

export { ArwesPageWrapper }; 