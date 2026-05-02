'use client';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Search, LogOut, User, Menu } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggle } from './theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { logoutAction } from '@/app/login/actions';
import { initials } from '@/lib/utils';

export function Topbar({
  firstName,
  lastName,
  role,
  unread = 0,
  onMenuClick,
}: {
  firstName: string;
  lastName: string;
  role: string;
  unread?: number;
  onMenuClick?: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function handleLogout(e: Event) {
    e.preventDefault();
    start(async () => {
      await logoutAction();
      router.push('/login');
      router.refresh();
    });
  }

  return (
    <header className="sticky top-0 z-30 h-14 sm:h-16 border-b border-[var(--border)] glass flex items-center px-3 sm:px-6 gap-2 sm:gap-4">
      {/* Hamburger (solo mobile) */}
      <button
        type="button"
        onClick={onMenuClick}
        className="lg:hidden h-10 w-10 -ml-1 grid place-items-center rounded-xl hover:bg-[var(--muted)] active:scale-95 transition-all"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5 text-[var(--foreground)]" strokeWidth={2} />
      </button>

      {/* Search — oculto en mobile chiquito */}
      <div className="hidden sm:flex flex-1 items-center gap-3 max-w-xl">
        <div className="flex-1 flex items-center gap-3 h-9 px-3.5 rounded-xl bg-[var(--muted)]/60 border border-transparent hover:border-[var(--border-strong)] focus-within:border-[var(--primary)]/30 focus-within:bg-[var(--card)] transition-all">
          <Search className="h-4 w-4 text-[var(--muted-foreground)] shrink-0" />
          <input
            placeholder="Buscar alumnos, cursos, tareas…"
            className="w-full bg-transparent outline-none text-sm placeholder:text-[var(--muted-foreground)]"
          />
        </div>
      </div>
      {/* Spacer en mobile */}
      <div className="flex-1 sm:hidden" />

      {/* Theme toggle */}
      <ThemeToggle />

      {/* Notifs */}
      <button className="relative h-9 w-9 grid place-items-center rounded-xl hover:bg-[var(--muted)] transition-colors">
        <Bell className="h-[18px] w-[18px] text-[var(--muted-foreground)]" strokeWidth={1.8} />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 h-4 min-w-4 px-1 rounded-full bg-[var(--brand-orange)] text-white text-[9px] font-bold grid place-items-center ring-2 ring-[var(--card)]">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* User */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-3 rounded-xl hover:bg-[var(--muted)] pl-1 pr-3 py-1 transition-colors">
          <Avatar className="h-8 w-8 ring-2 ring-[var(--background)]">
            <AvatarFallback>{initials(firstName, lastName)}</AvatarFallback>
          </Avatar>
          <div className="text-left hidden md:block leading-tight">
            <div className="text-sm font-semibold tracking-tight">{firstName} {lastName}</div>
            <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5 uppercase tracking-wider font-medium">{role}</div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[200px]">
          <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] font-semibold">
            Mi cuenta
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2.5">
            <User className="h-4 w-4 text-[var(--muted-foreground)]" /> Perfil
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleLogout} disabled={pending} className="gap-2.5 text-[var(--destructive)] focus:text-[var(--destructive)] focus:bg-[var(--soft-danger)]">
            <LogOut className="h-4 w-4" />
            {pending ? 'Cerrando…' : 'Cerrar sesión'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
