import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { toCsv } from '@/lib/csv';

export async function GET() {
  await requireRole('ADMIN', 'DIRECTION', 'SECRETARY');

  const enrollments = await prisma.enrollment.findMany({
    include: {
      student: { include: { user: true, parents: { include: { parent: { include: { user: true } } } } } },
      section: { include: { grade: true } },
    },
    orderBy: [{ section: { grade: { ordinal: 'asc' } } }, { student: { user: { lastName: 'asc' } } }],
  });

  const rows = enrollments.map((e) => {
    const apo = e.student.parents[0]?.parent.user;
    return {
      'CODIGO_ESTUDIANTE': e.student.studentCode,
      'APELLIDO_PATERNO': e.student.user.lastName.split(' ')[0] ?? '',
      'APELLIDO_MATERNO': e.student.user.lastName.split(' ')[1] ?? '',
      'NOMBRES': e.student.user.firstName,
      'FECHA_NACIMIENTO': e.student.birthDate.toISOString().slice(0, 10),
      'SEXO': e.student.gender ?? '',
      'NIVEL': e.section.grade.level,
      'GRADO': e.section.grade.ordinal,
      'SECCION': e.section.name,
      'ESTADO': e.status,
      'FECHA_MATRICULA': e.enrolledAt.toISOString().slice(0, 10),
      'APODERADO_DNI': apo?.dni ?? '',
      'APODERADO_NOMBRE': apo ? `${apo.firstName} ${apo.lastName}` : '',
      'APODERADO_TELEFONO': apo?.phone ?? '',
    };
  });

  const csv = '﻿' + toCsv(rows);
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="siagie-matricula-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
