import React, { ReactNode } from 'react';
import { Animator } from '../../../arwes/packages/react-animator/src';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';

export interface ArwesNavMenuProps {
  className?: string;
  children?: ReactNode;
}

export interface ArwesNavItemProps {
  children: ReactNode;
  className?: string;
  href: string;
  active?: boolean;
}

const ArwesNavMenu = (props: ArwesNavMenuProps) => {
  const { className, children, ...rest } = props;

  return (
    <Animator>
      <nav
        className={cn(
          'relative flex items-center space-x-4 lg:space-x-6 rounded-md border-2 border-yellow-500',
          className
        )}
        {...rest}
      >
        <div className="relative z-10 flex w-full items-center p-4">
          {children}
        </div>
      </nav>
    </Animator>
  );
};

ArwesNavMenu.displayName = 'ArwesNavMenu';

const ArwesNavItem = (props: ArwesNavItemProps) => {
  const { children, className, href, active, ...rest } = props;

  return (
    <Animator>
      <Link
        to={href}
        className={cn(
          'relative inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:text-blue-400',
          active ? 'text-blue-400 border-2 border-blue-500' : 'text-gray-400',
          className
        )}
        {...rest}
      >
        <span className="relative z-10">
          {children}
        </span>
      </Link>
    </Animator>
  );
};

ArwesNavItem.displayName = 'ArwesNavItem';

export { ArwesNavMenu, ArwesNavItem }; 