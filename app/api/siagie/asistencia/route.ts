import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { toCsv } from '@/lib/csv';

export async function GET() {
  await requireRole('ADMIN', 'DIRECTION');

  const records = await prisma.attendanceRecord.findMany({
    include: {
      student: { include: { user: true } },
      section: { include: { grade: true } },
    },
    orderBy: [{ date: 'desc' }],
    take: 5000,
  });

  const rows = records.map((r) => ({
    'CODIGO_ESTUDIANTE': r.student.studentCode,
    'APELLIDOS_NOMBRES': `${r.student.user.lastName}, ${r.student.user.firstName}`,
    'NIVEL': r.section.grade.level,
    'GRADO': r.section.grade.ordinal,
    'SECCION': r.section.name,
    'FECHA': r.date.toISOString().slice(0, 10),
    'ESTADO': r.status,
    'HORA_INGRESO': r.arrivedAt ? r.arrivedAt.toISOString().slice(11, 16) : '',
    'OBSERVACION': r.remark ?? '',
  }));

  const csv = '﻿' + toCsv(rows);
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="siagie-asistencia-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
