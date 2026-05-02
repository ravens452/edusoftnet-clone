'use client';

import { useEffect, useState } from 'react';

const MANUAL_TTL_MS = 4 * 60 * 60 * 1000;

function timeBasedTheme(): 'dark' | 'light' {
  const h = new Date().getHours();
  return (h >= 18 || h < 5) ? 'dark' : 'light';
}

function manualIsValid(): boolean {
  if (typeof window === 'undefined') return false;
  if (localStorage.getItem('theme-mode') !== 'manual') return false;
  if (!localStorage.getItem('theme')) return false;
  const atStr = localStorage.getItem('theme-manual-at');
  if (!atStr) return false;
  const age = Date.now() - parseInt(atStr, 10);
  return age >= 0 && age < MANUAL_TTL_MS;
}

function resolveTheme(): 'dark' | 'light' {
  if (manualIsValid()) return (localStorage.getItem('theme') as 'dark' | 'light') || timeBasedTheme();
  return timeBasedTheme();
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initial = (document.documentElement.getAttribute('data-theme') as 'dark' | 'light') || resolveTheme();
    setTheme(initial);
    setMounted(true);

    // Re-evaluar cada minuto: si el override manual expira, vuelve al automático
    const interval = setInterval(() => {
      const next = resolveTheme();
      if (document.documentElement.getAttribute('data-theme') !== next) {
        document.documentElement.setAttribute('data-theme', next);
        setTheme(next);
      }
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    localStorage.setItem('theme-mode', 'manual');
    localStorage.setItem('theme-manual-at', Date.now().toString());
    setTheme(next);
  }

  // Mientras hidrata mostrar un placeholder neutro (evita hydration mismatch)
  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Cambiar modo"
        className="h-9 w-9 grid place-items-center rounded-xl hover:bg-[var(--muted)] transition-colors text-base"
      >
        <span className="opacity-0">🌙</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Cambiar a modo día' : 'Cambiar a modo noche'}
      title="Cambiar modo día/noche"
      className="h-9 w-9 grid place-items-center rounded-xl hover:bg-[var(--muted)] transition-all text-base hover:rotate-12 active:scale-95"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
