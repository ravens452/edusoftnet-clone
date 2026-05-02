import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { toCsv } from '@/lib/csv';

export async function GET() {
  await requireRole('ADMIN', 'DIRECTION');

  const finals = await prisma.finalScore.findMany({
    include: {
      student: { include: { user: true, enrollments: { include: { section: { include: { grade: true } } } } } },
      courseAssignment: { include: { course: true } },
      period: true,
    },
    orderBy: [
      { period: { ordinal: 'asc' } },
      { student: { user: { lastName: 'asc' } } },
    ],
  });

  const rows = finals.map((f) => {
    const enr = f.student.enrollments[0];
    return {
      'CODIGO_ESTUDIANTE': f.student.studentCode,
      'APELLIDOS_NOMBRES': `${f.student.user.lastName}, ${f.student.user.firstName}`,
      'NIVEL': enr?.section.grade.level ?? '',
      'GRADO': enr?.section.grade.ordinal ?? '',
      'SECCION': enr?.section.name ?? '',
      'CURSO': f.courseAssignment.course.name,
      'CODIGO_CURSO': f.courseAssignment.course.code,
      'PERIODO': f.period.name,
      'PROMEDIO': f.value.toFixed(1),
      'CALIFICATIVO': f.letterGrade,
      'OBSERVACION': f.observation ?? '',
    };
  });

  const csv = '﻿' + toCsv(rows);
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="siagie-notas-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
