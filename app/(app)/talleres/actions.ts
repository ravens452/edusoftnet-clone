'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth';

const CreateSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  schedule: z.string().optional(),
  capacity: z.coerce.number().int().min(1).max(200).default(20),
  teacherId: z.string().optional(),
});

export async function createWorkshopAction(formData: FormData) {
  const user = await requireSession();
  if (!['DIRECTION', 'ADMIN'].includes(user.role)) return { error: 'Solo dirección puede crear talleres' };

  const parsed = CreateSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(' · ') };

  try {
    await prisma.workshop.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
        schedule: parsed.data.schedule || null,
        capacity: parsed.data.capacity,
        teacherId: parsed.data.teacherId || null,
      },
    });
    revalidatePath('/talleres');
    return { success: true };
  } catch (err) {
    console.error('createWorkshop', err);
    return { error: 'Error guardando' };
  }
}

const EnrollSchema = z.object({
  workshopId: z.string().min(1),
  studentId: z.string().min(1),
});

export async function enrollWorkshopAction(formData: FormData) {
  const user = await requireSession();
  if (!['PARENT', 'STUDENT', 'DIRECTION', 'ADMIN', 'SECRETARY'].includes(user.role)) {
    return { error: 'No tienes permiso' };
  }
  const parsed = EnrollSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: 'Datos inválidos' };

  try {
    const ws = await prisma.workshop.findUnique({
      where: { id: parsed.data.workshopId },
      include: { _count: { select: { enrollments: true } } },
    });
    if (!ws) return { error: 'Taller no encontrado' };
    if (ws._count.enrollments >= ws.capacity) return { error: 'Cupo lleno' };
    await prisma.workshopEnrollment.create({ data: parsed.data });
    revalidatePath('/talleres');
    return { success: true };
  } catch (err: any) {
    if (err?.code === 'P2002') return { error: 'Ese alumno ya está inscrito en este taller' };
    console.error('enroll', err);
    return { error: 'Error al inscribir' };
  }
}
