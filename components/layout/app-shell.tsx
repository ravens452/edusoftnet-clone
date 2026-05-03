'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import type { NavGroup } from '@/lib/navigation';
import type { NotifItem } from './notif-bell';

export function AppShell({
  groups,
  role,
  firstName,
  lastName,
  unread,
  recentNotifs = [],
  children,
}: {
  groups: NavGroup[];
  role: string;
  firstName: string;
  lastName: string;
  unread: number;
  recentNotifs?: NotifItem[];
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Cerrar el drawer cuando cambia la ruta
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Bloquear scroll del body cuando el drawer está abierto
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [mobileOpen]);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[var(--background)]">
      {/* Sidebar desktop (lg+) */}
      <Sidebar groups={groups} role={role} />

      {/* Sidebar drawer mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 max-w-[80vw] bg-[var(--card)] shadow-2xl animate-in slide-in-from-left">
            <Sidebar groups={groups} role={role} mobile />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar
          firstName={firstName}
          lastName={lastName}
          role={role}
          unread={unread}
          recentNotifs={recentNotifs}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-10 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
