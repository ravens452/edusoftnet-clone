import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  allowedDevOrigins: ['*.trycloudflare.com'],
  // En Vercel el app vive en su propio subdomain, no necesitamos basePath
  // (en self-hosted bajo /edusoft sí, mediante NEXT_PUBLIC_BASE_PATH).
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  // Asegurar que la DB seed se incluye en el bundle de cada lambda
  outputFileTracingIncludes: {
    '/**/*': ['./dev.db'],
  },
};

export default nextConfig;
