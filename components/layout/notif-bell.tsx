'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Check, ChevronRight } from 'lucide-react';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { markAsRead, markAllAsRead } from '@/lib/actions/notifications';

export type NotifItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  readAt: Date | null;
  createdAt: Date;
};

const TYPE_ICON: Record<string, string> = {
  GRADE: '📊', ATTENDANCE: '📅', PAYMENT: '💵', ANNOUNCEMENT: '📢',
  ASSIGNMENT: '📝', INTERVIEW: '👥', HEALTH: '⚕️', PSYCHOLOGY: '🧠',
  GENERAL: '🔔', WORKSHOP: '✨',
};

function timeAgo(d: Date | string) {
  const date = typeof d === 'string' ? new Date(d) : d;
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return 'ahora';
  const m = Math.floor(s / 60); if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60); if (h < 24) return `${h} h`;
  const d_ = Math.floor(h / 24); if (d_ < 7) return `${d_} d`;
  return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
}

export function NotifBell({ unread, items }: { unread: number; items: NotifItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [, start] = useTransition();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [localItems, setLocalItems] = useState(items);

  function localUnread() {
    return localItems.filter((n) => !n.readAt).length;
  }

  function onItemClick(n: NotifItem) {
    // Marcar como leída en el servidor
    if (!n.readAt) {
      start(() => markAsRead(n.id).then(() => router.refresh()));
      // Optimistic update
      setLocalItems((prev) => prev.map((x) => x.id === n.id ? { ...x, readAt: new Date() } : x));
    }
    if (n.link) {
      setOpen(false);
      router.push(n.link);
    } else {
      // Expandir/contraer inline
      setExpanded((cur) => cur === n.id ? null : n.id);
    }
  }

  function onMarkAll() {
    start(() => markAllAsRead().then(() => router.refresh()));
    setLocalItems((prev) => prev.map((x) => x.readAt ? x : { ...x, readAt: new Date() }));
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Notificaciones"
          className="relative h-9 w-9 grid place-items-center rounded-xl hover:bg-[var(--muted)] transition-colors"
        >
          <Bell className="h-[18px] w-[18px] text-[var(--muted-foreground)]" strokeWidth={1.8} />
          {localUnread() > 0 && (
            <span className="absolute top-1.5 right-1.5 h-4 min-w-4 px-1 rounded-full bg-[var(--brand-orange)] text-white text-[9px] font-bold grid place-items-center ring-2 ring-[var(--card)]">
              {localUnread() > 9 ? '9+' : localUnread()}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[360px] max-w-[92vw] p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
          <div className="font-semibold text-sm">Notificaciones</div>
          {localUnread() > 0 && (
            <button
              type="button"
              onClick={onMarkAll}
              className="text-[11px] font-medium text-[var(--primary)] hover:underline inline-flex items-center gap-1"
            >
              <Check className="h-3 w-3" /> Marcar todas
            </button>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto divide-y divide-[var(--border)]">
          {localItems.length === 0 ? (
            <div className="p-8 text-center text-sm text-[var(--muted-foreground)]">
              Sin notificaciones
            </div>
          ) : localItems.map((n) => {
            const unread = !n.readAt;
            const open = expanded === n.id;
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => onItemClick(n)}
                className={`w-full text-left px-3 py-2.5 flex gap-3 items-start transition hover:bg-[var(--muted)]/50 ${unread ? 'bg-[var(--soft-blue)]/40' : ''}`}
              >
                <div className="text-lg shrink-0 mt-0.5">{TYPE_ICON[n.type] || '🔔'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${unread ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}`}>
                      {n.title}
                    </span>
                    {unread && <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-orange)] shrink-0" />}
                  </div>
                  <p className={`text-xs mt-0.5 text-[var(--muted-foreground)] ${open ? '' : 'line-clamp-2'}`}>
                    {n.body}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[var(--muted-foreground)]">
                    <span>{timeAgo(n.createdAt)}</span>
                    {n.link && <span className="inline-flex items-center gap-0.5 text-[var(--primary)] font-medium">
                      Abrir <ChevronRight className="h-2.5 w-2.5" />
                    </span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <Link
          href="/notificaciones"
          className="block px-4 py-3 text-center text-xs font-semibold text-[var(--primary)] border-t border-[var(--border)] hover:bg-[var(--muted)]/50"
          onClick={() => setOpen(false)}
        >
          Ver todas las notificaciones
        </Link>
      </PopoverContent>
    </Popover>
  );
}
