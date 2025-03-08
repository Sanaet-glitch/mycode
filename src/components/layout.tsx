import React from 'react';
import { ThemeProvider } from './theme-provider';
import { ThemeSelector } from './theme-selector';
import ArwesThemeProvider from './ui/arwes-theme-provider';
import { ArwesPageWrapper, ArwesNavMenu, ArwesNavItem, ArwesCard } from './ui/arwes-components';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <ThemeProvider defaultTheme="glassmorphism">
      <ArwesThemeProvider>
        <ArwesPageWrapper>
          <header className="sticky top-0 z-10">
            <ArwesCard className="mb-6">
              <div className="flex h-16 items-center justify-between py-4">
                <div className="flex items-center gap-6">
                  <h1 className="text-xl font-bold">Campus Connect</h1>
                  <ArwesNavMenu className="hidden md:flex">
                    <ArwesNavItem href="/" active={window.location.pathname === '/'}>
                      Home
                    </ArwesNavItem>
                    <ArwesNavItem href="/courses" active={window.location.pathname === '/courses'}>
                      Courses
                    </ArwesNavItem>
                    <ArwesNavItem href="/attendance" active={window.location.pathname === '/attendance'}>
                      Attendance
                    </ArwesNavItem>
                    <ArwesNavItem href="/admin" active={window.location.pathname === '/admin'}>
                      Admin
                    </ArwesNavItem>
                  </ArwesNavMenu>
                </div>
                <div className="flex items-center gap-4">
                  <ThemeSelector />
                  {/* Other header elements like profile, notifications, etc. */}
                </div>
              </div>
            </ArwesCard>
          </header>
          <main className="mx-auto py-6 px-4">{children}</main>
          <footer className="mt-auto py-6">
            <ArwesCard>
              <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                <p className="text-center text-sm text-muted-foreground md:text-left">
                  &copy; {new Date().getFullYear()} Campus Connect. All rights reserved.
                </p>
              </div>
            </ArwesCard>
          </footer>
        </ArwesPageWrapper>
      </ArwesThemeProvider>
    </ThemeProvider>
  );
} 