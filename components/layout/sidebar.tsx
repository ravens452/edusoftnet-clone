'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, GraduationCap, CalendarCheck, BookOpen, MessageSquare,
  Megaphone, Users, Wallet, Library, HeartPulse, Brain, ClipboardList,
  FolderOpen, HardDrive, Sparkles, ShieldCheck, FileText, Calendar,
  Settings, UserPlus, School, Stethoscope, Receipt, Bell, ListChecks,
  Building2,
  type LucideIcon,
} from 'lucide-react';
import type { NavGroup, IconName } from '@/lib/navigation';
import { cn } from '@/lib/utils';

const ICONS: Record<IconName, LucideIcon> = {
  dashboard: LayoutDashboard,
  grade: GraduationCap,
  attendance: CalendarCheck,
  book: BookOpen,
  message: MessageSquare,
  megaphone: Megaphone,
  users: Users,
  wallet: Wallet,
  library: Library,
  heart: HeartPulse,
  brain: Brain,
  clipboard: ClipboardList,
  folder: FolderOpen,
  drive: HardDrive,
  sparkles: Sparkles,
  shield: ShieldCheck,
  file: FileText,
  calendar: Calendar,
  settings: Settings,
  userPlus: UserPlus,
  school: School,
  stethoscope: Stethoscope,
  receipt: Receipt,
  bell: Bell,
  list: ListChecks,
  building: Building2,
};

export function Sidebar({ groups, role, mobile = false }: { groups: NavGroup[]; role: string; mobile?: boolean }) {
  const pathname = usePathname();
  return (
    <aside className={cn(
      'w-72 shrink-0 flex-col border-r border-[var(--border)]',
      mobile
        ? 'flex h-full bg-[var(--card)]'
        : 'hidden lg:flex bg-[var(--card)]/50'
    )}>
      {/* Brand */}
      <div className="h-20 flex items-center gap-3 px-6 border-b border-[var(--border)]">
        <Image
          src="/logo.png"
          alt="Mercedario"
          width={44}
          height={44}
          priority
          className="shrink-0 drop-shadow-sm"
        />
        <div className="min-w-0">
          <div
            className="font-bold text-[15px] leading-tight tracking-tight text-[var(--foreground)]"
            style={{ fontFamily: 'var(--font-merriweather), Georgia, serif' }}
          >
            El Mercedario
          </div>
          <div className="text-[10px] text-[var(--muted-foreground)] mt-1 uppercase tracking-[0.12em] font-medium">
            {role}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-5 px-3">
        {groups.map((g) => (
          <div key={g.title} className="mb-6">
            <div className="px-3 mb-2 text-[10px] uppercase tracking-[0.14em] text-[var(--muted-foreground)]/80 font-semibold">
              {g.title}
            </div>
            <ul className="space-y-0.5">
              {g.items.map((it) => {
                const active = pathname === it.href || pathname?.startsWith(it.href + '/');
                const Icon = ICONS[it.icon];
                return (
                  <li key={it.href + it.label}>
                    <Link
                      href={it.href}
                      className={cn(
                        'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200',
                        active
                          ? 'bg-[var(--primary)] text-white font-medium shadow-[0_2px_8px_-2px_rgba(0,51,102,0.30)]'
                          : 'text-[var(--foreground)]/75 hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-[18px] w-[18px] shrink-0 transition-transform',
                          active ? 'text-white' : 'text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]',
                          'group-hover:scale-105'
                        )}
                        strokeWidth={active ? 2.2 : 1.8}
                      />
                      <span className="truncate">{it.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-[var(--border)] text-[10px] text-[var(--muted-foreground)] leading-relaxed">
        <div className="font-semibold text-[var(--foreground)]/70 tracking-tight">
          I.E.P. El Mercedario RVDO. P.E.A.B.
        </div>
        <div className="mt-0.5">Cayma · Arequipa · 2026</div>
      </div>
    </aside>
  );
}
