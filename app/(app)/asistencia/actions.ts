'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth';

const Schema = z.object({
  sectionId: z.string().min(1),
  date: z.string().min(1),
  records: z.string(), // JSON: [{ studentId, status }]
});

export async function bulkMarkAttendanceAction(formData: FormData) {
  const user = await requireSession();
  if (!['TEACHER', 'DIRECTION', 'ADMIN'].includes(user.role)) return { error: 'No tienes permiso' };

  const parsed = Schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: 'Datos inválidos' };

  let records: { studentId: string; status: string }[];
  try { records = JSON.parse(parsed.data.records); } catch { return { error: 'Formato inválido' }; }

  const date = new Date(parsed.data.date);
  date.setHours(0, 0, 0, 0);

  try {
    for (const r of records) {
      if (!r.studentId || !['PRESENT','ABSENT','LATE','EXCUSED','EARLY_LEAVE'].includes(r.status)) continue;
      await prisma.attendanceRecord.upsert({
        where: { studentId_date: { studentId: r.studentId, date } },
        create: { studentId: r.studentId, sectionId: parsed.data.sectionId, date, status: r.status as any, markedBy: user.id },
        update: { status: r.status as any, sectionId: parsed.data.sectionId, markedBy: user.id },
      });
    }
    revalidatePath('/asistencia');
    return { success: true, count: records.length };
  } catch (err) {
    console.error('bulkMark', err);
    return { error: 'Error guardando' };
  }
}
