/**
 * Siembra ventanas de captura de notas realistas para la demo:
 *  - Mes de marzo (I Bim, semana 1-2): cerrada (vencida)
 *  - Mes de abril (I Bim, semana 5-6): cerrada (vencida)
 *  - Mes de mayo (I Bim, cierre del bimestre): ABIERTA del 1 al 15
 *  - II Bimestre completo: programada — aún no abre
 */

import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../lib/generated/prisma/client';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Limpiar ventanas previas
  await prisma.gradingWindow.deleteMany({});

  const periods = await prisma.period.findMany({ orderBy: { ordinal: 'asc' } });
  if (periods.length < 2) {
    console.log('⚠️  No hay suficientes periodos. Corre primero la importación principal.');
    return;
  }
  const [bim1, bim2] = periods;

  const windows = [
    {
      periodId: bim1.id,
      name: 'Captura Marzo — I Bimestre',
      opensAt: new Date('2026-03-25'),
      closesAt: new Date('2026-04-05'),
      scope: 'GLOBAL' as const,
      state: 'AUTO' as const,
      notes: 'Captura del primer mes. Cerró el 5 de abril.',
    },
    {
      periodId: bim1.id,
      name: 'Captura Abril — I Bimestre',
      opensAt: new Date('2026-04-22'),
      closesAt: new Date('2026-04-30'),
      scope: 'GLOBAL' as const,
      state: 'AUTO' as const,
      notes: 'Captura del segundo mes.',
    },
    {
      periodId: bim1.id,
      name: 'Cierre I Bimestre — Mayo',
      opensAt: new Date('2026-05-01'),
      closesAt: new Date('2026-05-15T23:59:59'),
      scope: 'GLOBAL' as const,
      state: 'AUTO' as const,
      notes: 'Captura final del bimestre. Vence el viernes 15 de mayo a las 23:59.',
    },
    {
      periodId: bim2.id,
      name: 'Captura II Bimestre — Mes 1',
      opensAt: new Date('2026-06-25'),
      closesAt: new Date('2026-07-05'),
      scope: 'GLOBAL' as const,
      state: 'AUTO' as const,
      notes: 'Programada por Coordinación Académica.',
    },
  ];

  for (const w of windows) {
    await prisma.gradingWindow.create({ data: w });
  }
  console.log(`✅ ${windows.length} ventanas de captura sembradas.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
