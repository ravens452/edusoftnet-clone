'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginAction } from './actions';

const DEMO = [
  { user: 'admin', label: 'Administrador' },
  { user: 'direccion', label: 'Dirección' },
  { user: '46419291', label: 'Docente' },
  { user: 'alumno', label: 'Alumno' },
  { user: 'padre', label: 'Apoderado' },
  { user: 'psicologia', label: 'Psicología' },
  { user: 'tesoreria', label: 'Tesorería' },
  { user: 'secretaria', label: 'Secretaría' },
  { user: 'porteria', label: 'Portería' },
];
const PW: Record<string, string> = {
  admin: 'admin123', direccion: 'direccion123', '46419291': '457467',
  alumno: 'alumno123', padre: 'padre123', psicologia: 'psico123',
  tesoreria: 'tesoreria123', secretaria: 'secretaria123', porteria: 'porteria123',
};

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [u, setU] = useState('');
  const [p, setP] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await loginAction(fd);
      if (res?.error) setError(res.error);
    });
  }

  function quickLogin(user: string) {
    const password = PW[user] ?? '';
    setU(user);
    setP(password);
    setError(null);
    const fd = new FormData();
    fd.set('username', user);
    fd.set('password', password);
    start(async () => {
      const res = await loginAction(fd);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="w-full max-w-sm">
      {/* Logo en móvil */}
      <div className="lg:hidden flex items-center gap-3 mb-10">
        <Image src="/logo.png" alt="El Mercedario" width={52} height={52} priority />
        <div>
          <div
            className="font-bold leading-tight tracking-tight"
            style={{ fontFamily: 'var(--font-merriweather), Georgia, serif' }}
          >
            I.E.P. El Mercedario
          </div>
          <div className="text-[10px] text-[var(--muted-foreground)] mt-1 uppercase tracking-[0.14em] font-medium">
            Cayma · Arequipa
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2
          className="text-[28px] font-bold tracking-tight leading-tight"
          style={{ fontFamily: 'var(--font-merriweather), Georgia, serif' }}
        >
          Bienvenido
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-2 leading-relaxed">
          Ingresa con las credenciales que te entregó el colegio.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="username" className="text-xs uppercase tracking-wider text-[var(--muted-foreground)] font-semibold">
            Usuario
          </Label>
          <Input
            id="username"
            name="username"
            autoComplete="username"
            required
            value={u}
            onChange={(e) => setU(e.target.value)}
            placeholder="DNI o usuario"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-xs uppercase tracking-wider text-[var(--muted-foreground)] font-semibold">
            Contraseña
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={p}
            onChange={(e) => setP(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        {error && (
          <p className="text-sm text-[var(--destructive)] bg-[var(--soft-danger)] rounded-xl px-3.5 py-2.5">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? 'Ingresando…' : 'Ingresar a la plataforma'}
        </Button>
      </form>

      <div className="mt-10">
        <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted-foreground)] mb-3 font-semibold flex items-center gap-3">
          <span>Cuentas demo</span>
          <span className="flex-1 h-px bg-[var(--border)]" />
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {DEMO.map((d) => (
            <button
              key={d.user}
              type="button"
              disabled={pending}
              onClick={() => quickLogin(d.user)}
              className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-2.5 py-2 text-[11px] text-left hover:border-[var(--primary)]/30 hover:bg-[var(--soft-blue)] hover:shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="font-semibold text-[var(--foreground)]">{d.label}</div>
              <div className="text-[var(--muted-foreground)] truncate text-[10px] mt-0.5 font-mono">{d.user}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 pt-6 border-t border-[var(--border)] text-center text-[11px] text-[var(--muted-foreground)] leading-relaxed">
        ¿Problemas para ingresar?
        <br />
        <a className="text-[var(--primary)] hover:underline font-medium" href="mailto:soporte@elmercedariocayma.com">
          soporte@elmercedariocayma.com
        </a>
      </div>
    </div>
  );
}
