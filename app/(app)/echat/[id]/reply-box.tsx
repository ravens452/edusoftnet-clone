'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { sendMessageAction } from './actions';

export default function ReplyBox({ threadId }: { threadId: string }) {
  const [msg, setMsg] = useState('');
  const [pending, start] = useTransition();
  const router = useRouter();

  function send(e: React.FormEvent) {
    e.preventDefault();
    if (!msg.trim()) return;
    start(async () => {
      await sendMessageAction(threadId, msg);
      setMsg('');
      router.refresh();
    });
  }

  return (
    <form onSubmit={send} className="border-t border-[var(--border)] p-3 flex gap-2">
      <input
        value={msg} onChange={(e) => setMsg(e.target.value)}
        placeholder="Escribe un mensaje…"
        className="flex-1 h-9 rounded-md border border-[var(--input)] bg-[var(--card)] px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      />
      <Button type="submit" disabled={pending}><Send className="h-4 w-4" /></Button>
    </form>
  );
}
