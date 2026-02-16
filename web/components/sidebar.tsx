'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, Settings, PanelLeftClose, PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/lib/store';

const NAV_ITEMS = [
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, isMobileOpen, toggleCollapsed, setMobileOpen } = useSidebarStore();

  return (
    <aside
      className={cn(
        'h-full border-r border-border bg-card flex flex-col transition-all duration-200',
        isCollapsed ? 'w-16' : 'w-60',
        'hidden md:flex',
        isMobileOpen && 'fixed inset-y-0 left-0 z-40 flex w-60 md:relative md:z-auto'
      )}
    >
      {/* Header */}
      <div className={cn(
        'flex items-center h-16 border-b border-border px-4',
        isCollapsed ? 'justify-center' : 'justify-between'
      )}>
        {!isCollapsed && (
          <h1 className="text-lg font-bold text-foreground tracking-tight">
            NexusComm
          </h1>
        )}
        <button
          onClick={() => {
            toggleCollapsed();
            setMobileOpen(false);
          }}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                isCollapsed && 'justify-center px-2'
              )}
              title={isCollapsed ? label : undefined}
            >
              <Icon size={20} />
              {!isCollapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
