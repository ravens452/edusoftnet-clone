import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '/Users/mini/edusoftnet-clone/lib/generated/prisma/client';

const adapter = new PrismaBetterSqlite3({ url: 'file:/Users/mini/edusoftnet-clone/dev.db' });
const prisma = new PrismaClient({ adapter });

const COMPETENCIES_MINEDU: Record<string, { code: string; name: string; capabilities: string[] }[]> = {
  'CYT-SE': [
    { code: 'CT01', name: 'Indaga mediante métodos científicos para construir conocimientos',
      capabilities: ['Problematiza situaciones', 'Diseña estrategias para hacer indagación', 'Genera y registra datos e información', 'Analiza datos e información', 'Evalúa y comunica el proceso y resultados de su indagación'] },
    { code: 'CT02', name: 'Explica el mundo físico basándose en conocimientos sobre los seres vivos, materia y energía, biodiversidad, Tierra y universo',
      capabilities: ['Comprende y usa conocimientos sobre los seres vivos, materia y energía, biodiversidad, Tierra y universo', 'Evalúa las implicancias del saber y del quehacer científico y tecnológico'] },
    { code: 'CT03', name: 'Diseña y construye soluciones tecnológicas para resolver problemas de su entorno',
      capabilities: ['Determina una alternativa de solución tecnológica', 'Diseña la alternativa de solución tecnológica', 'Implementa y valida la alternativa de solución tecnológica', 'Evalúa y comunica el funcionamiento y los impactos de su alternativa de solución tecnológica'] },
  ],
  'MAT-SE': [
    { code: 'MA01', name: 'Resuelve problemas de cantidad',
      capabilities: ['Traduce cantidades a expresiones numéricas', 'Comunica su comprensión sobre los números y las operaciones', 'Usa estrategias y procedimientos de estimación y cálculo', 'Argumenta afirmaciones sobre las relaciones numéricas y las operaciones'] },
    { code: 'MA02', name: 'Resuelve problemas de regularidad, equivalencia y cambio',
      capabilities: ['Traduce datos y condiciones a expresiones algebraicas y gráficas', 'Comunica su comprensión sobre las relaciones algebraicas', 'Usa estrategias y procedimientos para encontrar equivalencias y reglas generales', 'Argumenta afirmaciones sobre relaciones de cambio y equivalencia'] },
    { code: 'MA03', name: 'Resuelve problemas de forma, movimiento y localización',
      capabilities: ['Modela objetos con formas geométricas y sus transformaciones', 'Comunica su comprensión sobre las formas y relaciones geométricas', 'Usa estrategias y procedimientos para medir y orientarse en el espacio', 'Argumenta afirmaciones sobre relaciones geométricas'] },
    { code: 'MA04', name: 'Resuelve problemas de gestión de datos e incertidumbre',
      capabilities: ['Representa datos con gráficos y medidas estadísticas o probabilísticas', 'Comunica la comprensión de los conceptos estadísticos y probabilísticos', 'Usa estrategias y procedimientos para recopilar y procesar datos', 'Sustenta conclusiones o decisiones con base en la información obtenida'] },
  ],
};

async function migratePeriods() {
  console.log('🗓️  Migrando bimestres → trimestres…');
  const periods = await prisma.period.findMany({ orderBy: { ordinal: 'asc' } });
  if (periods.length === 0) { console.log('   sin periods'); return; }
  if (periods[0].name.includes('Trimestre')) { console.log('   ya migrado'); return; }

  if (periods.length !== 4) { console.log('   inesperado:', periods.length); return; }
  const [b1, b2, b3, b4] = periods;

  // Estrategia simple: borrar b2 y b4 (no se pueden fusionar por unique constraint).
  // Quedan ~50% de las notas que había — suficiente para demo.
  await prisma.score.deleteMany({ where: { periodId: { in: [b2.id, b4.id] } } });
  await prisma.finalScore.deleteMany({ where: { periodId: { in: [b2.id, b4.id] } } });
  await prisma.period.delete({ where: { id: b2.id } });
  await prisma.period.delete({ where: { id: b4.id } });

  // Renombrar: b1 → I Trimestre, b3 → II Trimestre, crear III Trimestre
  const year = b1.startDate.getFullYear();
  await prisma.period.update({
    where: { id: b1.id },
    data: { name: 'I Trimestre', ordinal: 1, startDate: new Date(`${year}-03-01`), endDate: new Date(`${year}-06-15`) },
  });
  await prisma.period.update({
    where: { id: b3.id },
    data: { name: 'II Trimestre', ordinal: 2, startDate: new Date(`${year}-06-16`), endDate: new Date(`${year}-09-30`) },
  });
  await prisma.period.create({
    data: {
      schoolYearId: b1.schoolYearId,
      name: 'III Trimestre',
      ordinal: 3,
      startDate: new Date(`${year}-10-01`),
      endDate: new Date(`${year}-12-20`),
    },
  });
  console.log('   ✓ 3 trimestres creados');
}

async function reassignDemoTeacher() {
  console.log('\n👨‍🏫  Reasignando docente demo a CTA + Matemática (secundaria)…');
  const u = await prisma.user.findUnique({ where: { username: '46419291' }, include: { teacher: true } });
  if (!u?.teacher) { console.log('   sin teacher'); return; }
  const tid = u.teacher.id;

  // Quitar todas las asignaciones actuales
  const existing = await prisma.courseAssignment.findMany({ where: { teacherId: tid } });
  for (const ca of existing) {
    // Reasignar las viejas a otro teacher random para no perder los scores
    const other = await prisma.teacher.findFirst({ where: { id: { not: tid } } });
    if (other) {
      await prisma.courseAssignment.update({ where: { id: ca.id }, data: { teacherId: other.id } });
    }
  }

  // Asignar CTA en 3° y 4° A; Matemática en 2° A y 3° B
  const cta = await prisma.course.findFirst({ where: { code: 'CYT-SE' } });
  const mat = await prisma.course.findFirst({ where: { code: 'MAT-SE' } });
  const sec3A = await prisma.section.findFirst({ where: { name: 'A', grade: { name: '3° Secundaria' } } });
  const sec4A = await prisma.section.findFirst({ where: { name: 'A', grade: { name: '4° Secundaria' } } });
  const sec2A = await prisma.section.findFirst({ where: { name: 'A', grade: { name: '2° Secundaria' } } });
  const sec3B = await prisma.section.findFirst({ where: { name: 'B', grade: { name: '3° Secundaria' } } });

  for (const [course, section, label] of [
    [cta, sec3A, 'CTA · 3° A'], [cta, sec4A, 'CTA · 4° A'],
    [mat, sec2A, 'Matemática · 2° A'], [mat, sec3B, 'Matemática · 3° B'],
  ] as const) {
    if (!course || !section) continue;
    // ¿Ya hay asignación de ese course+section a OTRO teacher? La reasignamos a nuestro demo.
    const existing = await prisma.courseAssignment.findFirst({ where: { courseId: course.id, sectionId: section.id } });
    if (existing) {
      await prisma.courseAssignment.update({ where: { id: existing.id }, data: { teacherId: tid } });
      console.log('   ✓', label, '(reasignado)');
    } else {
      await prisma.courseAssignment.create({ data: { courseId: course.id, sectionId: section.id, teacherId: tid } });
      console.log('   ✓', label, '(nuevo)');
    }
  }
}

async function loadCompetencies() {
  console.log('\n📚  Cargando competencias MINEDU para CTA y Matemática…');
  for (const code of Object.keys(COMPETENCIES_MINEDU)) {
    const course = await prisma.course.findFirst({ where: { code } });
    if (!course) continue;
    // Borrar competencias anteriores para empezar limpio
    await prisma.competency.deleteMany({ where: { courseId: course.id } });
    for (const c of COMPETENCIES_MINEDU[code]) {
      const comp = await prisma.competency.create({
        data: { courseId: course.id, code: c.code, name: c.name },
      });
      for (let i = 0; i < c.capabilities.length; i++) {
        await prisma.capability.create({
          data: { competencyId: comp.id, code: `${c.code}.${i+1}`, name: c.capabilities[i] },
        });
      }
    }
    console.log(`   ✓ ${code} (${course.name}): ${COMPETENCIES_MINEDU[code].length} competencias`);
  }
}

async function summary() {
  const periods = await prisma.period.findMany({ orderBy: { ordinal: 'asc' } });
  console.log('\n📊  Resumen final:');
  console.log('   Periods:', periods.map(p => p.name).join(', '));
  const u = await prisma.user.findUnique({ where: { username: '46419291' }, include: { teacher: true } });
  if (u?.teacher) {
    const cas = await prisma.courseAssignment.findMany({
      where: { teacherId: u.teacher.id },
      include: { course: { include: { competencies: { include: { capabilities: true } } } }, section: { include: { grade: true } } },
    });
    console.log(`\n   Docente demo (DNI ${u.username}):`);
    for (const ca of cas) {
      console.log(`     • ${ca.course.name} en ${ca.section.grade.name} ${ca.section.name}`);
      for (const comp of ca.course.competencies) {
        console.log(`         - [${comp.code}] ${comp.name.slice(0, 70)}…`);
      }
    }
  }
}

(async () => {
  await migratePeriods();
  await reassignDemoTeacher();
  await loadCompetencies();
  await summary();
  await prisma.$disconnect();
})();
