'use client';

import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Moon, Sun, Menu, LogOut, User as UserIcon } from 'lucide-react';
import { useAuthStore, useSidebarStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';

export default function TopBar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { setMobileOpen } = useSidebarStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    router.push('/auth/login');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="h-14 border-b border-border bg-card flex items-center justify-between px-4">
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent md:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <div className="hidden md:block" />

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="Toggle theme"
        >
          <Sun size={18} className="hidden dark:block" />
          <Moon size={18} className="block dark:hidden" />
        </button>

        {/* User menu */}
        {user && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors',
                'text-foreground hover:bg-accent',
                menuOpen && 'bg-accent'
              )}
            >
              <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                {(user.displayName || user.email).charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline text-sm font-medium">
                {user.displayName || user.email}
              </span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 rounded-md border border-border bg-card shadow-lg py-1 z-50">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-sm font-medium text-foreground">{user.displayName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-accent transition-colors"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
