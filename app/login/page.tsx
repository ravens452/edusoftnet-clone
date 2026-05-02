import { redirect } from 'next/navigation';
import Image from 'next/image';
import { getSession } from '@/lib/auth';
import LoginForm from './login-form';
import { SCHOOL_INFO } from '@/lib/payments';

export default async function LoginPage() {
  const user = await getSession();
  if (user) redirect('/dashboard');
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr]">
      {/* Panel izquierdo — branding Mercedario, sobrio y elegante */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-[var(--brand-blue)] via-[var(--brand-blue-mid)] to-[var(--brand-blue-dark)] p-14 text-white relative overflow-hidden">
        {/* Capa de luz suave */}
        <div
          className="absolute inset-0 opacity-50 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 60% 50% at 100% 0%, rgba(255,140,0,0.18) 0%, transparent 55%), radial-gradient(ellipse 80% 60% at 0% 100%, rgba(122,193,67,0.10) 0%, transparent 55%)',
          }}
        />
        {/* Patrón sutil de puntos */}
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Logo + nombre */}
        <div className="relative flex items-center gap-4">
          <Image
            src="/logo.png"
            alt="El Mercedario"
            width={64}
            height={64}
            priority
            className="drop-shadow-md"
          />
          <div>
            <div
              className="font-bold tracking-tight text-xl leading-tight"
              style={{ fontFamily: 'var(--font-merriweather), Georgia, serif' }}
            >
              I.E.P. El Mercedario
            </div>
            <div className="text-[11px] text-white/60 mt-1.5 uppercase tracking-[0.18em] font-medium">
              RVDO. P.E.A.B. · Cayma
            </div>
          </div>
        </div>

        {/* Lema */}
        <div className="relative">
          <div className="text-[10px] text-white/50 uppercase tracking-[0.25em] font-medium mb-4">
            Plataforma educativa
          </div>
          <h1
            className="text-[44px] font-bold leading-[1.1] tracking-[-0.025em]"
            style={{ fontFamily: 'var(--font-merriweather), Georgia, serif' }}
          >
            Educación
            <br />
            <span className="italic font-normal opacity-90">con Fe</span>
            <br />
            <span className="italic font-normal opacity-90">y Valores</span>
            <span className="text-[var(--brand-orange)]">.</span>
          </h1>
          <p className="mt-6 text-white/70 max-w-sm leading-relaxed text-[15px]">
            Una plataforma única para gestionar la vida escolar de docentes, familias y dirección.
          </p>
        </div>

        {/* Footer */}
        <div className="relative flex items-center justify-between text-[11px] text-white/50">
          <div>© 2026 · {SCHOOL_INFO.address}</div>
          <div className="flex items-center gap-2 text-white/40">
            <span className="h-1 w-1 rounded-full bg-[var(--brand-orange)]" />
            <span>v1.0</span>
          </div>
        </div>
      </div>

      {/* Panel derecho — login limpio */}
      <div className="flex items-center justify-center p-6 lg:p-12 bg-[var(--background)]">
        <LoginForm />
      </div>
    </div>
  );
}
