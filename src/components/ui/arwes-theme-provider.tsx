import React, { ReactNode } from 'react';
import { Animator } from '../../../arwes/packages/react-animator/src';

interface ArwesThemeProviderProps {
  children: ReactNode;
}

const ArwesThemeProvider: React.FC<ArwesThemeProviderProps> = ({ children }) => {
  return (
    <Animator>
      <div className="arwes-theme">
        {children}
      </div>
    </Animator>
  );
};

export default ArwesThemeProvider; 