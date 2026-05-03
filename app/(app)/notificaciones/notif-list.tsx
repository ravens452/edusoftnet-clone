'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, ChevronDown, ChevronRight } from 'lucide-react';
import { markAsRead, markAllAsRead } from '@/lib/actions/notifications';
import type { NotifItem } from '@/components/layout/notif-bell';

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
  return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function NotifList({
  items,
  unreadCount,
  onlyUnread,
}: {
  items: NotifItem[];
  unreadCount: number;
  onlyUnread: boolean;
}) {
  const router = useRouter();
  const [, start] = useTransition();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [localItems, setLocalItems] = useState(items);

  function onItemClick(n: NotifItem) {
    if (!n.readAt) {
      start(() => markAsRead(n.id).then(() => router.refresh()));
      setLocalItems((prev) => prev.map((x) => x.id === n.id ? { ...x, readAt: new Date() } : x));
    }
    if (n.link) {
      router.push(n.link);
    } else {
      setExpanded((cur) => cur === n.id ? null : n.id);
    }
  }

  function onMarkAll() {
    start(() => markAllAsRead().then(() => router.refresh()));
    setLocalItems((prev) => prev.map((x) => x.readAt ? x : { ...x, readAt: new Date() }));
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between gap-3">
        <div className="flex gap-1.5">
          <Link
            href="/notificaciones"
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
              !onlyUnread ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                : 'bg-transparent border-[var(--border)] hover:border-[var(--border-strong)]'
            }`}
          >Todas ({localItems.length})</Link>
          <Link
            href="/notificaciones?filter=unread"
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
              onlyUnread ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                : 'bg-transparent border-[var(--border)] hover:border-[var(--border-strong)]'
            }`}
          >Sin leer ({unreadCount})</Link>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAll}
            className="text-xs font-medium text-[var(--primary)] hover:underline inline-flex items-center gap-1"
          >
            <Check className="h-3.5 w-3.5" /> Marcar todas como leídas
          </button>
        )}
      </div>

      <div className="divide-y divide-[var(--border)]">
        {localItems.length === 0 ? (
          <div className="p-12 text-center text-sm text-[var(--muted-foreground)]">
            {onlyUnread ? '🎉 No tienes notificaciones sin leer' : 'Sin notificaciones'}
          </div>
        ) : localItems.map((n) => {
          const unread = !n.readAt;
          const open = expanded === n.id;
          const Icon = open ? ChevronDown : (n.link ? ChevronRight : ChevronDown);
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => onItemClick(n)}
              className={`w-full text-left px-5 py-3 flex gap-3 items-start transition hover:bg-[var(--muted)]/40 ${unread ? 'bg-[var(--soft-blue)]/30' : ''}`}
            >
              <div className="text-xl shrink-0 mt-0.5">{TYPE_ICON[n.type] || '🔔'}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-semibold ${unread ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}`}>
                    {n.title}
                  </span>
                  {unread && <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-orange)] shrink-0" />}
                  <span className="text-[10px] text-[var(--muted-foreground)] ml-auto whitespace-nowrap">{timeAgo(n.createdAt)}</span>
                </div>
                <p className={`text-xs mt-1 text-[var(--muted-foreground)] whitespace-pre-wrap ${open ? '' : 'line-clamp-2'}`}>
                  {n.body}
                </p>
                {n.link && (
                  <div className="text-[11px] text-[var(--primary)] font-medium mt-1.5 inline-flex items-center gap-1">
                    Abrir <ChevronRight className="h-3 w-3" />
                  </div>
                )}
              </div>
              {!n.link && (
                <Icon className="h-4 w-4 text-[var(--muted-foreground)] shrink-0 mt-1" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
