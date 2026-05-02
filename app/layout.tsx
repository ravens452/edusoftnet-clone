import type { Metadata, Viewport } from 'next';
import { Outfit, Inter, Merriweather } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700', '800'],
});

const merriweather = Merriweather({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-merriweather',
  weight: ['400', '700', '900'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#003366',
};

export const metadata: Metadata = {
  title: 'I.E.P. El Mercedario — Plataforma escolar',
  description:
    'I.E.P. "El Mercedario" RVDO. P.E.A.B. — Plataforma de gestión educativa: notas, asistencia, comunicación y pagos.',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${outfit.variable} ${inter.variable} ${merriweather.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
