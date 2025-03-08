import React from 'react';
import { useTheme } from './theme-provider';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { 
  Moon, 
  Sun, 
  LaptopIcon,
  SparklesIcon
} from 'lucide-react';

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={`rounded-full ${theme === 'glassmorphism' ? 'glass-button' : ''}`}>
          {theme === 'light' && <Sun className="h-5 w-5" />}
          {theme === 'dark' && <Moon className="h-5 w-5" />}
          {theme === 'system' && <LaptopIcon className="h-5 w-5" />}
          {theme === 'glassmorphism' && <SparklesIcon className="h-5 w-5 neon-text" />}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={theme === 'glassmorphism' ? 'glass-card' : ''}>
        <DropdownMenuItem 
          onClick={() => setTheme('glassmorphism')}
          className={theme === 'glassmorphism' ? 'bg-primary/20 neon-text' : ''}
        >
          <SparklesIcon className="mr-2 h-4 w-4" />
          <span>Glassmorphism</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <LaptopIcon className="mr-2 h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 