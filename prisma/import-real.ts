/**
 * Importa los datos reales del colegio "El Mercedario" desde la carpeta
 * /Users/mini/Documents/abde:
 *   - asistencia.db (students + comunicados)
 *   - "Docentes Datos 2026 - Hoja 1.csv"
 *
 * Mantiene la generación ficticia para notas, asistencia, tareas, pagos, etc.
 *
 * Uso: npx tsx prisma/import-real.ts
 */

import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../lib/generated/prisma/client';
import Database from 'better-sqlite3';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'node:fs';

faker.seed(20260430);

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || 'file:./prisma/dev.db' });
const prisma = new PrismaClient({ adapter });
const sourceDb = new Database('/Users/mini/Documents/abde/asistencia.db', { readonly: true });

const password = (p: string) => bcrypt.hashSync(p, 8);

/* ============================================================
 *  HELPERS
 * ============================================================ */

function normalizeLevel(level: string): 'INICIAL' | 'PRIMARIA' | 'SECUNDARIA' {
  const l = level.toLowerCase().trim();
  if (l.startsWith('ini')) return 'INICIAL';
  if (l.startsWith('pri')) return 'PRIMARIA';
  if (l.startsWith('sec')) return 'SECUNDARIA';
  return 'PRIMARIA';
}

const ORDINAL_BY_NAME: Record<string, number> = {
  'PRIMERO': 1, '1': 1, '1°': 1, 'PRIMER': 1,
  'SEGUNDO': 2, '2': 2, '2°': 2,
  'TERCERO': 3, '3': 3, '3°': 3,
  'CUARTO': 4, '4': 4, '4°': 4,
  'QUINTO': 5, '5': 5, '5°': 5,
  'SEXTO': 6, '6': 6, '6°': 6,
  '3 AÑOS': 1, '4 AÑOS': 2, '5 AÑOS': 3,
};

function gradeOrdinal(level: 'INICIAL' | 'PRIMARIA' | 'SECUNDARIA', gradeName: string): number {
  const upper = gradeName.toUpperCase().trim();
  return ORDINAL_BY_NAME[upper] ?? 0;
}

function gradeDisplay(level: 'INICIAL' | 'PRIMARIA' | 'SECUNDARIA', gradeName: string): string {
  const upper = gradeName.toUpperCase().trim();
  if (level === 'INICIAL') return upper === '3 AÑOS' ? '3 años' : upper === '4 AÑOS' ? '4 años' : '5 años';
  const ord = ORDINAL_BY_NAME[upper];
  if (level === 'PRIMARIA') return `${ord}° Primaria`;
  return `${ord}° Secundaria`;
}

function slug(s: string): string {
  return s
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '');
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQ = false;
      else cur += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ',') { row.push(cur); cur = ''; }
      else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
      else if (c !== '\r') cur += c;
    }
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

/* ============================================================
 *  CLEAN
 * ============================================================ */

async function clean() {
  const tables = [
    'AuditLog', 'GateLog', 'FixedAsset', 'Interview', 'Ticket', 'DriveFile', 'Document',
    'WorkshopEnrollment', 'Workshop', 'StudentLifeEntry', 'Vaccination', 'HealthRecord',
    'PsychologicalTest', 'PsychologyCase', 'ReadingProgress', 'Book',
    'Payment', 'Invoice', 'Prospect',
    'Notification', 'Announcement', 'ChatMessage', 'ChatParticipant', 'ChatThread',
    'CurriculumPlan', 'LessonSession', 'Submission', 'Assignment',
    'AttendanceRecord', 'FinalScore', 'Score',
    'ScheduleSlot', 'CourseAssignment', 'PerformanceIndicator', 'Capability', 'Competency', 'Course',
    'Enrollment', 'ParentStudent', 'Section', 'Grade', 'Period', 'SchoolYear',
    'Staff', 'Teacher', 'Parent', 'Student', 'Session', 'User',
  ];
  for (const t of tables) {
    await prisma.$executeRawUnsafe(`DELETE FROM "${t}";`).catch(() => {});
  }
}

async function main() {
  console.log('🧹 limpiando…');
  await clean();

  /* ----------------------- AÑO ESCOLAR ----------------------- */
  console.log('📅 año escolar 2026…');
  const year = await prisma.schoolYear.create({
    data: {
      year: 2026, name: 'Año Escolar 2026', isActive: true,
      startDate: new Date('2026-03-01'), endDate: new Date('2026-12-20'),
    },
  });
  const periods = await Promise.all(
    [
      ['I Bimestre', new Date('2026-03-01'), new Date('2026-05-15')],
      ['II Bimestre', new Date('2026-05-16'), new Date('2026-07-25')],
      ['III Bimestre', new Date('2026-08-01'), new Date('2026-10-15')],
      ['IV Bimestre', new Date('2026-10-16'), new Date('2026-12-20')],
    ].map(([name, s, e], i) =>
      prisma.period.create({
        data: { schoolYearId: year.id, name: name as string, ordinal: i + 1, startDate: s as Date, endDate: e as Date },
      })
    )
  );

  /* ----------------------- LEER ALUMNOS REALES ----------------------- */
  type RealStudent = {
    student_code: string;
    first_name: string;
    last_name: string;
    grade: string;
    section: string;
    level: string;
    parent_email: string | null;
    padre_nombre: string | null;
    madre_nombre: string | null;
    tutor_nombre: string | null;
    padre_phone: string | null;
    madre_phone: string | null;
    tutor_phone: string | null;
    birth_date: string | null;
    dni: string | null;
  };
  const realStudents = sourceDb
    .prepare(
      `SELECT student_code, first_name, last_name, grade, section, level,
              parent_email, padre_nombre, madre_nombre, tutor_nombre,
              padre_phone, madre_phone, tutor_phone, birth_date, dni
         FROM students WHERE active = 1
         ORDER BY level, grade, section, last_name`
    )
    .all() as RealStudent[];
  console.log(`👨‍🎓 ${realStudents.length} alumnos reales encontrados`);

  /* ----------------------- LEER DOCENTES REALES ----------------------- */
  const csv = readFileSync('/Users/mini/Documents/abde/Docentes Datos 2026 - Hoja 1.csv', 'utf-8');
  const csvRows = parseCsv(csv).slice(1).filter((r) => r[3] && r[3].trim().length > 3);
  type RealTeacher = {
    tutoria: string;
    name: string;        // "Apellidos, Nombres" o "Apellidos Nombres"
    level: string;
    dni: string;
    birth: string;
    email: string;
    phone: string;
    address: string;
    areas: string;
  };
  const realTeachersRaw: RealTeacher[] = csvRows.map((r) => ({
    tutoria: (r[1] ?? '').trim(),
    name: (r[3] ?? '').trim(),
    level: (r[4] ?? '').trim(),
    dni: (r[5] ?? '').trim(),
    birth: (r[6] ?? '').trim(),
    email: (r[7] ?? '').trim(),
    phone: (r[8] ?? '').trim(),
    address: (r[9] ?? '').trim(),
    areas: (r[10] ?? '').trim(),
  })).filter((t) => t.dni && t.email);
  // Dedup por DNI (mantener el primero — usualmente el de tutor/área principal)
  const dniSeen = new Set<string>();
  const realTeachers: RealTeacher[] = [];
  for (const t of realTeachersRaw) {
    if (dniSeen.has(t.dni)) continue;
    dniSeen.add(t.dni);
    realTeachers.push(t);
  }
  console.log(`👩‍🏫 ${realTeachers.length} docentes reales encontrados`);

  /* ----------------------- GRADOS Y SECCIONES (a partir de datos reales) ----------------------- */
  console.log('🏫 grados y secciones (deducidos de los alumnos)…');
  const gradeKeySeen = new Map<string, { id: string; level: 'INICIAL' | 'PRIMARIA' | 'SECUNDARIA'; ordinal: number; name: string }>();
  const sectionKeySeen = new Map<string, { id: string; gradeKey: string; name: string }>();

  for (const s of realStudents) {
    const level = normalizeLevel(s.level);
    const ord = gradeOrdinal(level, s.grade);
    if (ord === 0) continue;
    const gradeKey = `${level}-${ord}`;
    if (!gradeKeySeen.has(gradeKey)) {
      const created = await prisma.grade.create({
        data: { schoolYearId: year.id, level, ordinal: ord, name: gradeDisplay(level, s.grade) },
      });
      gradeKeySeen.set(gradeKey, { id: created.id, level, ordinal: ord, name: created.name });
    }
    const secName = (s.section || 'A').trim().toUpperCase();
    const secKey = `${gradeKey}-${secName}`;
    if (!sectionKeySeen.has(secKey)) {
      const sec = await prisma.section.create({
        data: { gradeId: gradeKeySeen.get(gradeKey)!.id, name: secName, capacity: 35 },
      });
      sectionKeySeen.set(secKey, { id: sec.id, gradeKey, name: secName });
    }
  }
  console.log(`   ${gradeKeySeen.size} grados, ${sectionKeySeen.size} secciones`);

  /* ----------------------- CURSOS ----------------------- */
  console.log('📚 cursos…');
  const courseSpecs: Record<string, [string, string][]> = {
    INICIAL: [
      ['Comunicación', 'COM-IN'], ['Matemática', 'MAT-IN'], ['Personal Social', 'PSO-IN'],
      ['Ciencia y Tecnología', 'CYT-IN'], ['Psicomotricidad', 'PSI-IN'], ['Religión', 'REL-IN'],
    ],
    PRIMARIA: [
      ['Comunicación', 'COM-PR'], ['Matemática', 'MAT-PR'], ['Personal Social', 'PSO-PR'],
      ['Ciencia y Tecnología', 'CYT-PR'], ['Arte y Cultura', 'ART-PR'], ['Educación Física', 'EFI-PR'],
      ['Inglés', 'ING-PR'], ['Religión', 'REL-PR'], ['Razonamiento Verbal', 'RV-PR'],
      ['Razonamiento Matemático', 'RM-PR'],
    ],
    SECUNDARIA: [
      ['Comunicación', 'COM-SE'], ['Matemática', 'MAT-SE'], ['Ciencias Sociales', 'CSO-SE'],
      ['Ciencia, Tecnología y Ambiente', 'CYT-SE'], ['Desarrollo Personal, Cívica y Ciudadanía', 'DPC-SE'],
      ['Educación Física', 'EFI-SE'], ['Educación para el Trabajo', 'EPT-SE'], ['Arte y Cultura', 'ART-SE'],
      ['Inglés', 'ING-SE'], ['Educación Religiosa', 'REL-SE'], ['Física', 'FIS-SE'], ['Razonamiento Verbal', 'RV-SE'],
    ],
  };
  const coursesByLevel: Record<string, { id: string; name: string; code: string }[]> = { INICIAL: [], PRIMARIA: [], SECUNDARIA: [] };
  for (const level of Object.keys(courseSpecs) as (keyof typeof courseSpecs)[]) {
    for (const [name, code] of courseSpecs[level]) {
      const c = await prisma.course.create({ data: { name, code, level, hoursPerWeek: 4 } });
      coursesByLevel[level].push({ id: c.id, name, code });
      for (let i = 1; i <= 2; i++) {
        const comp = await prisma.competency.create({ data: { courseId: c.id, code: `C${i}`, name: `Competencia ${i}` } });
        for (let j = 1; j <= 2; j++) {
          const cap = await prisma.capability.create({ data: { competencyId: comp.id, code: `${comp.code}.${j}`, name: `Capacidad ${j}` } });
          for (let k = 1; k <= 2; k++) {
            await prisma.performanceIndicator.create({ data: { capabilityId: cap.id, description: `Indicador ${k}`, weight: 1.0 } });
          }
        }
      }
    }
  }

  /* ----------------------- USUARIOS BASE (no docentes) ----------------------- */
  console.log('🔐 cuentas administrativas…');
  const mkUser = async (data: any) =>
    prisma.user.create({
      data: {
        username: data.username,
        passwordHash: password(data.pw),
        firstName: data.firstName, lastName: data.lastName,
        role: data.role,
        email: data.email ?? `${data.username}@elmercedariocayma.com`,
        phone: data.phone ?? null, dni: data.dni ?? null,
      },
    });

  const admin = await mkUser({ username: 'admin', pw: 'admin123', firstName: 'Sistema', lastName: 'Mercedario', role: 'ADMIN' });
  const director = await mkUser({ username: 'direccion', pw: 'direccion123', firstName: 'Hno.', lastName: 'Director', role: 'DIRECTION' });
  const psicologa = await mkUser({ username: 'psicologia', pw: 'psico123', firstName: 'Departamento', lastName: 'Psicología', role: 'PSYCHOLOGY' });
  const tesorera = await mkUser({ username: 'tesoreria', pw: 'tesoreria123', firstName: 'Oficina', lastName: 'Tesorería', role: 'TREASURY' });
  const portero = await mkUser({ username: 'porteria', pw: 'porteria123', firstName: 'Portería', lastName: 'Mercedario', role: 'GATEKEEPER' });
  const secretaria = await mkUser({ username: 'secretaria', pw: 'secretaria123', firstName: 'Secretaría', lastName: 'Mercedario', role: 'SECRETARY' });
  await prisma.staff.create({ data: { userId: director.id, employeeCode: 'EMP-001', position: 'Director' } });
  await prisma.staff.create({ data: { userId: psicologa.id, employeeCode: 'EMP-002', position: 'Psicóloga' } });
  await prisma.staff.create({ data: { userId: tesorera.id, employeeCode: 'EMP-003', position: 'Tesorera', department: 'Administración' } });
  await prisma.staff.create({ data: { userId: portero.id, employeeCode: 'EMP-004', position: 'Portero' } });
  await prisma.staff.create({ data: { userId: secretaria.id, employeeCode: 'EMP-005', position: 'Secretaria' } });

  /* ----------------------- DOCENTES REALES ----------------------- */
  console.log('👩‍🏫 importando docentes reales…');
  const usedUsernames = new Set(['admin', 'direccion', 'psicologia', 'tesoreria', 'porteria', 'secretaria']);
  function uniqueUsername(base: string): string {
    let u = base; let i = 1;
    while (usedUsernames.has(u)) { u = `${base}.${i}`; i++; }
    usedUsernames.add(u);
    return u;
  }

  const teacherByTutoria = new Map<string, { id: string; userId: string }>();
  const teachers: { id: string; userId: string; firstName: string; lastName: string; speciality: string; tutoria: string }[] = [];

  for (let i = 0; i < realTeachers.length; i++) {
    const t = realTeachers[i];
    let lastName = ''; let firstName = '';
    if (t.name.includes(',')) {
      [lastName, firstName] = t.name.split(',').map((s) => s.trim());
    } else {
      const parts = t.name.split(/\s+/);
      // Heurística: 2 apellidos + nombres
      if (parts.length >= 4) {
        lastName = `${parts[0]} ${parts[1]}`;
        firstName = parts.slice(2).join(' ');
      } else if (parts.length === 3) {
        lastName = `${parts[0]} ${parts[1]}`;
        firstName = parts[2];
      } else {
        lastName = parts[0] ?? '';
        firstName = parts.slice(1).join(' ') || parts[0];
      }
    }
    const username = t.dni && /^\d+$/.test(t.dni) ? t.dni : uniqueUsername(slug(t.name).slice(0, 30));
    usedUsernames.add(username);
    // Si es el usuario que me dio (Carlos Andrade, DNI 46419291), uso su clave
    const isUser = t.dni === '46419291';
    const pw = isUser ? '457467' : '123456';

    const u = await prisma.user.create({
      data: {
        username,
        passwordHash: password(pw),
        firstName: firstName || 'Docente',
        lastName: lastName || 'Mercedario',
        role: 'TEACHER',
        email: t.email || `${slug(t.name)}@elmercedariocayma.com`,
        phone: t.phone || null,
        dni: t.dni || null,
      },
    });
    const teacher = await prisma.teacher.create({
      data: {
        userId: u.id,
        employeeCode: `DOC-${String(i + 1).padStart(3, '0')}`,
        speciality: t.areas || normalizeLevel(t.level),
        hiredAt: faker.date.past({ years: 3 }),
      },
    });
    teachers.push({ id: teacher.id, userId: u.id, firstName: firstName || '', lastName: lastName || '', speciality: t.areas || '', tutoria: t.tutoria });
    if (t.tutoria) teacherByTutoria.set(t.tutoria.toLowerCase(), { id: teacher.id, userId: u.id });
  }

  /* ----------------------- ASIGNAR TUTORES A SECCIONES ----------------------- */
  // Mapea tutoria del CSV (ej. "1AP", "5AS", "3 AÑOS", "5A AÑOS") a secciones del clon.
  const tutoriaResolvers: { match: (s: string) => boolean; gradeKey: string; section: string }[] = [];
  for (const sec of sectionKeySeen.values()) {
    const grade = gradeKeySeen.get(sec.gradeKey)!;
    const ord = grade.ordinal;
    const lvl = grade.level;
    const lvlSuffix = lvl === 'PRIMARIA' ? 'P' : lvl === 'SECUNDARIA' ? 'S' : '';
    const compact = `${ord}${sec.name.toLowerCase()}${lvlSuffix.toLowerCase()}`;
    if (lvl === 'INICIAL') {
      const yrs = ord === 1 ? '3' : ord === 2 ? '4' : '5';
      tutoriaResolvers.push({ match: (s) => s.toLowerCase().includes(`${yrs} año`) || s.toLowerCase().startsWith(`${yrs}años`) || s.toLowerCase().startsWith(`${yrs} año`) || (sec.name === 'A' && s.toLowerCase().includes(`${yrs}a años`)) || (sec.name === 'B' && s.toLowerCase().includes(`${yrs}b años`)), gradeKey: sec.gradeKey, section: sec.name });
    } else {
      tutoriaResolvers.push({
        match: (s) => s.toLowerCase().replace(/\s/g, '').startsWith(compact),
        gradeKey: sec.gradeKey, section: sec.name,
      });
    }
  }
  for (const t of teachers) {
    if (!t.tutoria) continue;
    const matched = tutoriaResolvers.find((r) => r.match(t.tutoria));
    if (matched) {
      const secId = sectionKeySeen.get(`${matched.gradeKey}-${matched.section}`)!.id;
      await prisma.section.update({ where: { id: secId }, data: { tutorId: t.id } }).catch(() => {});
    }
  }

  /* ----------------------- ASIGNACIONES (curso × sección × docente) ----------------------- */
  console.log('🧩 asignaciones de curso…');
  const courseAssignments: { id: string; sectionId: string; courseId: string; teacherId: string; level: string }[] = [];
  for (const sec of sectionKeySeen.values()) {
    const grade = gradeKeySeen.get(sec.gradeKey)!;
    const lvlCourses = coursesByLevel[grade.level];
    for (let i = 0; i < lvlCourses.length; i++) {
      const t = teachers[(i + grade.ordinal) % teachers.length];
      const ca = await prisma.courseAssignment.create({
        data: { courseId: lvlCourses[i].id, sectionId: sec.id, teacherId: t.id },
      });
      courseAssignments.push({ id: ca.id, sectionId: sec.id, courseId: lvlCourses[i].id, teacherId: t.id, level: grade.level });
      // Horario: 2 bloques semanales
      for (const d of [1 + (i % 5), ((i + 3) % 5) + 1]) {
        const start = 8 + ((i * 2) % 6);
        await prisma.scheduleSlot.create({
          data: {
            courseAssignmentId: ca.id, weekday: d,
            startTime: `${String(start).padStart(2, '0')}:00`,
            endTime: `${String(start + 1).padStart(2, '0')}:30`,
            classroom: `Aula ${grade.ordinal}${sec.name}`,
          },
        });
      }
    }
  }

  /* ----------------------- ALUMNOS Y PADRES REALES ----------------------- */
  console.log('👨‍👩‍👧 importando alumnos y padres reales…');
  const allStudents: { id: string; sectionId: string }[] = [];
  const allParents: { id: string; userId: string }[] = [];

  // Genérico para username único de alumno y padre
  let demoStudentSet = false; let demoParentSet = false;

  for (const s of realStudents) {
    const level = normalizeLevel(s.level);
    const ord = gradeOrdinal(level, s.grade);
    if (ord === 0) continue;
    const gradeKey = `${level}-${ord}`;
    const secName = (s.section || 'A').trim().toUpperCase();
    const secKey = `${gradeKey}-${secName}`;
    const sec = sectionKeySeen.get(secKey);
    if (!sec) continue;

    const studentBase = slug(`${s.first_name} ${s.last_name}`).slice(0, 30);
    const studentUsername = uniqueUsername(studentBase);
    // El primer alumno se asigna también como "alumno"
    const stUser = await prisma.user.create({
      data: {
        username: studentUsername,
        passwordHash: password('alumno123'),
        firstName: s.first_name, lastName: s.last_name, role: 'STUDENT',
        email: `${studentUsername}@elmercedariocayma.com`,
      },
    });
    if (!demoStudentSet) {
      // alias fácil
      try {
        await prisma.user.update({
          where: { id: stUser.id },
          data: { username: 'alumno' },
        });
        demoStudentSet = true;
      } catch {}
    }

    const studentBirth = s.birth_date ? new Date(s.birth_date) : faker.date.between({ from: '2008-01-01', to: '2020-12-31' });
    const stRow = await prisma.student.create({
      data: {
        userId: stUser.id,
        studentCode: s.student_code,
        birthDate: isNaN(studentBirth.getTime()) ? faker.date.between({ from: '2008-01-01', to: '2020-12-31' }) : studentBirth,
        gender: faker.helpers.arrayElement(['M', 'F']),
        address: faker.location.streetAddress() + ', Cayma — Arequipa',
        bloodType: faker.helpers.arrayElement(['O+', 'A+', 'B+', 'AB+', 'O-']),
        emergencyContact: s.padre_phone || s.madre_phone || s.tutor_phone || faker.phone.number({ style: 'national' }),
      },
    });
    await prisma.enrollment.create({ data: { studentId: stRow.id, sectionId: sec.id, schoolYearId: year.id } });
    allStudents.push({ id: stRow.id, sectionId: sec.id });

    // Padre / Apoderado real
    const parentName = s.padre_nombre || s.madre_nombre || s.tutor_nombre || '';
    const parentPhone = s.padre_phone || s.madre_phone || s.tutor_phone || '';
    if (parentName) {
      const parts = parentName.trim().split(/\s+/);
      let pLast = '', pFirst = '';
      if (parts.length >= 4) { pLast = `${parts[0]} ${parts[1]}`; pFirst = parts.slice(2).join(' '); }
      else if (parts.length === 3) { pLast = `${parts[0]} ${parts[1]}`; pFirst = parts[2]; }
      else { pLast = parts[0] ?? ''; pFirst = parts.slice(1).join(' ') || parts[0]; }
      const pUsername = uniqueUsername(slug(parentName).slice(0, 30) || `padre.${stRow.id.slice(-6)}`);
      const pUser = await prisma.user.create({
        data: {
          username: pUsername,
          passwordHash: password('padre123'),
          firstName: pFirst, lastName: pLast, role: 'PARENT',
          email: s.parent_email && s.parent_email.includes('@') ? s.parent_email : `${pUsername}@gmail.com`,
          phone: parentPhone || null,
        },
      });
      if (!demoParentSet) {
        try {
          await prisma.user.update({ where: { id: pUser.id }, data: { username: 'padre' } });
          demoParentSet = true;
        } catch {}
      }
      const p = await prisma.parent.create({
        data: {
          userId: pUser.id,
          relationship: s.padre_nombre ? 'Padre' : s.madre_nombre ? 'Madre' : 'Tutor',
        },
      });
      await prisma.parentStudent.create({ data: { parentId: p.id, studentId: stRow.id, isPrimary: true } });
      allParents.push({ id: p.id, userId: pUser.id });
    }
  }
  console.log(`   ${allStudents.length} alumnos, ${allParents.length} padres`);

  /* ----------------------- NOTAS, ASISTENCIA, TAREAS, PAGOS, ETC. (ficticios) ----------------------- */
  console.log('📊 generando datos académicos ficticios…');

  const sectionAssignments = new Map<string, typeof courseAssignments>();
  for (const ca of courseAssignments) {
    const arr = sectionAssignments.get(ca.sectionId) || [];
    arr.push(ca);
    sectionAssignments.set(ca.sectionId, arr);
  }

  const indicatorByCa = new Map<string, string[]>();
  for (const ca of courseAssignments) {
    const inds = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT pi.id FROM PerformanceIndicator pi
       JOIN Capability c ON c.id = pi.capabilityId
       JOIN Competency comp ON comp.id = c.competencyId
       WHERE comp.courseId = ?`, ca.courseId
    );
    indicatorByCa.set(ca.id, inds.map((x) => x.id));
  }

  // Solo generamos para los primeros dos bimestres (real time)
  for (const st of allStudents) {
    const cas = sectionAssignments.get(st.sectionId) || [];
    for (const ca of cas) {
      const indIds = indicatorByCa.get(ca.id) || [];
      for (const period of periods.slice(0, 2)) {
        for (let n = 0; n < 3; n++) {
          const value = faker.number.float({ min: 11, max: 20, fractionDigits: 1 });
          await prisma.score.create({
            data: {
              studentId: st.id, courseAssignmentId: ca.id,
              indicatorId: indIds[n % Math.max(indIds.length, 1)] ?? null,
              periodId: period.id, value,
              letterGrade: value >= 18 ? 'AD' : value >= 14 ? 'A' : value >= 11 ? 'B' : 'C',
            },
          });
        }
        const avg = faker.number.float({ min: 12, max: 19, fractionDigits: 1 });
        await prisma.finalScore.create({
          data: {
            studentId: st.id, courseAssignmentId: ca.id, periodId: period.id,
            value: avg, letterGrade: avg >= 18 ? 'AD' : avg >= 14 ? 'A' : avg >= 11 ? 'B' : 'C',
          },
        });
      }
    }
  }

  // Asistencia 30 días
  const today = new Date();
  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const d = new Date(today); d.setDate(d.getDate() - dayOffset);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    for (const st of allStudents) {
      const r = Math.random();
      const status = r < 0.86 ? 'PRESENT' : r < 0.91 ? 'LATE' : r < 0.96 ? 'EXCUSED' : 'ABSENT';
      await prisma.attendanceRecord.create({
        data: {
          studentId: st.id, sectionId: st.sectionId, date: new Date(d.toDateString()),
          status: status as any,
          arrivedAt: status === 'PRESENT' || status === 'LATE'
            ? new Date(d.setHours(status === 'LATE' ? 8 : 7, status === 'LATE' ? 25 : 50)) : null,
        },
      }).catch(() => {});
    }
  }

  // Tareas + entregas (limitamos a las primeras 60 asignaciones para velocidad)
  for (const ca of courseAssignments.slice(0, 80)) {
    for (let i = 0; i < 2; i++) {
      const due = new Date();
      due.setDate(due.getDate() + faker.number.int({ min: -10, max: 14 }));
      const a = await prisma.assignment.create({
        data: {
          courseAssignmentId: ca.id,
          title: faker.helpers.arrayElement(['Lectura del capítulo', 'Resolver ejercicios', 'Investigación grupal', 'Mapa conceptual', 'Ensayo argumentativo', 'Quiz de repaso']),
          description: faker.lorem.paragraph(),
          type: faker.helpers.arrayElement(['HOMEWORK', 'PROJECT', 'QUIZ', 'PRACTICE']),
          maxScore: 20, dueDate: due,
        },
      });
      const studentsInSection = allStudents.filter((s) => s.sectionId === ca.sectionId);
      for (const st of studentsInSection) {
        const submitted = Math.random() > 0.3;
        await prisma.submission.create({
          data: {
            assignmentId: a.id, studentId: st.id,
            content: submitted ? faker.lorem.sentences(2) : null,
            status: submitted ? (Math.random() > 0.5 ? 'GRADED' : 'SUBMITTED') : 'PENDING',
            submittedAt: submitted ? faker.date.recent({ days: 5 }) : null,
            score: submitted ? faker.number.float({ min: 12, max: 20, fractionDigits: 1 }) : null,
          },
        });
      }
    }
  }

  // Lecciones recientes
  for (const ca of courseAssignments.slice(0, 40)) {
    for (let i = 0; i < 3; i++) {
      const d = new Date(); d.setDate(d.getDate() - i * 7);
      await prisma.lessonSession.create({
        data: { courseAssignmentId: ca.id, date: d, topic: faker.lorem.sentence(4), description: faker.lorem.paragraph() },
      });
    }
  }

  // Planificación curricular
  for (const t of teachers.slice(0, 15)) {
    for (const type of ['ANNUAL', 'UNIT', 'SESSION'] as const) {
      await prisma.curriculumPlan.create({
        data: {
          teacherId: t.id, type, title: `${type} - ${t.speciality || 'General'}`,
          description: faker.lorem.paragraph(),
          startDate: new Date('2026-03-01'), endDate: new Date('2026-12-15'),
          status: faker.helpers.arrayElement(['DRAFT', 'APPROVED']),
        },
      });
    }
  }

  /* ----------------------- COMUNICADOS REALES ----------------------- */
  console.log('📣 importando comunicados reales…');
  const realComunicados = sourceDb
    .prepare('SELECT titulo, cuerpo, nivel, autor, destacado, created_at FROM comunicados ORDER BY created_at DESC')
    .all() as { titulo: string; cuerpo: string; nivel: string; autor: string; destacado: number; created_at: string }[];
  for (const c of realComunicados) {
    await prisma.announcement.create({
      data: {
        title: c.titulo,
        body: c.cuerpo,
        authorId: director.id,
        audience: c.nivel === 'todos' ? 'ALL' : c.nivel.toUpperCase(),
        publishedAt: new Date(c.created_at),
        pinned: c.destacado === 1,
      },
    });
  }

  // Más comunicados ficticios para llenar
  for (let i = 0; i < 5; i++) {
    await prisma.announcement.create({
      data: {
        title: faker.helpers.arrayElement(['Reunión de padres', 'Día del logro', 'Aniversario del colegio', 'Vacunación escolar', 'Suspensión por feriado']),
        body: faker.lorem.paragraphs(2),
        authorId: director.id, audience: 'ALL',
        publishedAt: faker.date.recent({ days: 30 }),
      },
    });
  }

  /* ----------------------- CHATS Y NOTIFICACIONES ----------------------- */
  console.log('💬 chats y notificaciones…');
  for (let i = 0; i < Math.min(20, allParents.length); i++) {
    const t = teachers[i % teachers.length];
    const p = allParents[i];
    const thread = await prisma.chatThread.create({ data: { isGroup: false, title: 'Conversación' } });
    await prisma.chatParticipant.createMany({
      data: [
        { threadId: thread.id, userId: t.userId },
        { threadId: thread.id, userId: p.userId },
      ],
    });
    for (let m = 0; m < 4; m++) {
      await prisma.chatMessage.create({
        data: { threadId: thread.id, senderId: m % 2 === 0 ? p.userId : t.userId, body: faker.lorem.sentence(), createdAt: faker.date.recent({ days: 7 }) },
      });
    }
  }

  const allUsers = await prisma.user.findMany({ select: { id: true } });
  for (const u of allUsers.slice(0, 200)) {
    for (let i = 0; i < 2; i++) {
      await prisma.notification.create({
        data: {
          userId: u.id,
          type: faker.helpers.arrayElement(['GRADE', 'ATTENDANCE', 'ASSIGNMENT', 'PAYMENT', 'ANNOUNCEMENT']),
          title: faker.lorem.sentence(4),
          body: faker.lorem.sentence(),
          createdAt: faker.date.recent({ days: 14 }),
          readAt: Math.random() > 0.6 ? faker.date.recent({ days: 5 }) : null,
        },
      });
    }
  }

  /* ----------------------- TESORERÍA ----------------------- */
  console.log('💰 boletas y pagos…');
  let invNum = 1;
  for (const st of allStudents) {
    for (let m = 0; m < 6; m++) {
      const issued = new Date(2026, 2 + m, 5);
      const due = new Date(2026, 2 + m, 20);
      const status = m < 3 ? 'PAID' : m < 5 ? 'PENDING' : Math.random() > 0.5 ? 'PENDING' : 'OVERDUE';
      const inv = await prisma.invoice.create({
        data: {
          number: `B001-${String(invNum++).padStart(6, '0')}`,
          studentId: st.id,
          concept: `Pensión de ${['Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto'][m]} 2026`,
          amount: 480, dueDate: due, issuedAt: issued,
          status: status as any, documentType: 'BOLETA',
          sunatCode: status === 'PAID' ? `SUNAT-${faker.string.alphanumeric(10)}` : null,
        },
      });
      if (status === 'PAID') {
        await prisma.payment.create({
          data: {
            invoiceId: inv.id, studentId: st.id, amount: 480,
            method: faker.helpers.arrayElement(['CAJA_AREQUIPA', 'BCP', 'INTERBANK', 'YAPE', 'PLIN', 'TARJETA']),
            reference: faker.string.alphanumeric(12),
            paidAt: new Date(issued.getTime() + 1000 * 60 * 60 * 24 * faker.number.int({ min: 1, max: 15 })),
          },
        });
      }
    }
  }

  /* ----------------------- PROSPECTOS ----------------------- */
  for (let i = 0; i < 25; i++) {
    await prisma.prospect.create({
      data: {
        childName: faker.person.fullName(),
        childBirthDate: faker.date.between({ from: '2010-01-01', to: '2020-12-31' }),
        desiredGrade: faker.helpers.arrayElement(['1° Inicial', '3° Primaria', '5° Primaria', '1° Secundaria', '3° Secundaria']),
        contactPhone: faker.phone.number({ style: 'national' }),
        contactEmail: faker.internet.email().toLowerCase(),
        source: faker.helpers.arrayElement(['Web', 'Referido', 'Feria', 'Redes sociales']),
        stage: faker.helpers.arrayElement(['LEAD', 'CONTACTED', 'INTERVIEW', 'EVALUATION', 'PRE_ENROLLMENT', 'ENROLLED']),
        notes: faker.lorem.sentence(),
      },
    });
  }

  /* ----------------------- LIBROS, PSICO, SALUD, TALLERES, DOCS ----------------------- */
  console.log('📖 plan lector…');
  const books = await Promise.all([
    { title: 'El principito', author: 'Antoine de Saint-Exupéry', level: 'PRIMARIA' as const },
    { title: 'Cuentos de la selva', author: 'Horacio Quiroga', level: 'PRIMARIA' as const },
    { title: 'Tradiciones peruanas', author: 'Ricardo Palma', level: 'SECUNDARIA' as const },
    { title: 'Los ríos profundos', author: 'José María Arguedas', level: 'SECUNDARIA' as const },
    { title: 'Patito feo', author: 'Hans Christian Andersen', level: 'INICIAL' as const },
  ].map((b) => prisma.book.create({ data: { ...b, publisher: 'Editorial Mercedaria', description: faker.lorem.paragraph() } })));
  for (const st of allStudents.slice(0, 80)) {
    const b = faker.helpers.arrayElement(books);
    await prisma.readingProgress.create({
      data: {
        studentId: st.id, bookId: b.id,
        state: faker.helpers.arrayElement(['ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'EVALUATED']),
        progress: faker.number.int({ min: 0, max: 100 }),
        literalScore: faker.number.float({ min: 12, max: 20, fractionDigits: 1 }),
        inferentialScore: faker.number.float({ min: 11, max: 20, fractionDigits: 1 }),
        criticalScore: faker.number.float({ min: 10, max: 20, fractionDigits: 1 }),
      },
    }).catch(() => {});
  }

  console.log('🧠 ecare, salud, talleres…');
  for (const st of allStudents.slice(0, 15)) {
    await prisma.psychologyCase.create({
      data: { studentId: st.id, title: faker.helpers.arrayElement(['Adaptación al aula', 'Conducta', 'Familiar']), description: faker.lorem.paragraph(), status: faker.helpers.arrayElement(['OPEN', 'IN_FOLLOWUP', 'CLOSED']) },
    });
    await prisma.healthRecord.create({
      data: { studentId: st.id, date: faker.date.recent({ days: 60 }), symptoms: faker.helpers.arrayElement(['Dolor de cabeza', 'Fiebre leve', 'Caída en patio']), treatment: 'Reposo', attendedBy: 'Tópico escolar' },
    });
  }
  for (const st of allStudents.slice(0, 30)) {
    for (const v of ['Antitetánica', 'COVID-19', 'Influenza']) {
      await prisma.vaccination.create({
        data: { studentId: st.id, vaccineName: v, dose: '1ra', appliedAt: faker.date.past({ years: 2 }) },
      });
    }
  }

  for (const name of ['Fútbol', 'Vóley', 'Ajedrez', 'Coro', 'Robótica', 'Danza folklórica', 'Teatro', 'Inglés conversacional']) {
    const w = await prisma.workshop.create({
      data: { name, description: `Taller de ${name}`, teacherId: faker.helpers.arrayElement(teachers).id, schedule: faker.helpers.arrayElement(['Lunes 4-6 PM', 'Miércoles 4-6 PM', 'Sábado 9-11 AM']), capacity: 25, level: 'PRIMARIA' },
    });
    for (const st of faker.helpers.arrayElements(allStudents, 8)) {
      await prisma.workshopEnrollment.create({ data: { workshopId: w.id, studentId: st.id } }).catch(() => {});
    }
  }

  // Documentos institucionales reales
  const realDocs = [
    'Reglamento interno 2026', 'Calendario académico 2026', 'Plan Anual de Trabajo 2026',
    'Plan lector institucional', 'Manual de convivencia escolar', 'Plan de tutoría',
    'Guía para padres 2026', 'Reglamento de evaluación',
  ];
  for (let i = 0; i < realDocs.length; i++) {
    await prisma.document.create({
      data: {
        ownerId: secretaria.id, title: realDocs[i], category: faker.helpers.arrayElement(['Académico', 'Administrativo', 'Tutoría', 'Reglamentos']),
        version: 1, signedAt: i % 2 === 0 ? faker.date.recent({ days: 60 }) : null,
        signedById: i % 2 === 0 ? director.id : null,
      },
    });
  }
  for (let i = 0; i < 30; i++) {
    const u = faker.helpers.arrayElement(teachers);
    await prisma.driveFile.create({
      data: {
        uploaderId: u.userId, filename: faker.system.fileName(),
        mimeType: faker.helpers.arrayElement(['application/pdf', 'image/jpeg', 'application/vnd.ms-excel']),
        sizeBytes: faker.number.int({ min: 100_000, max: 50_000_000 }),
        path: `/drive/${u.userId}/${faker.string.uuid()}`,
        folder: faker.helpers.arrayElement(['Material de clase', 'Exámenes', 'Recursos']),
        isShared: Math.random() > 0.5,
      },
    });
  }

  let ticketNum = 1;
  for (const p of allParents.slice(0, 10)) {
    await prisma.ticket.create({
      data: {
        number: `MP-${String(ticketNum++).padStart(5, '0')}`,
        subject: faker.helpers.arrayElement(['Solicitud de constancia', 'Cambio de sección', 'Solicitud de boleta']),
        body: faker.lorem.paragraph(), category: 'Académico',
        creatorId: p.userId, assigneeId: secretaria.id,
        status: faker.helpers.arrayElement(['OPEN', 'IN_REVIEW', 'ANSWERED', 'CLOSED']),
      },
    });
  }

  for (let i = 0; i < 30; i++) {
    const u = faker.helpers.arrayElement(allUsers);
    await prisma.gateLog.create({
      data: { userId: u.id, direction: i % 2 === 0 ? 'IN' : 'OUT', occurredAt: faker.date.recent({ days: 5 }), reason: faker.helpers.arrayElement([null, 'Recoge a su hijo', 'Reunión']) },
    });
  }

  for (let i = 0; i < 10; i++) {
    const t = faker.helpers.arrayElement(teachers);
    const p = faker.helpers.arrayElement(allParents);
    await prisma.interview.create({
      data: {
        teacherId: t.id, parentId: p.id, scheduledAt: faker.date.soon({ days: 14 }),
        topic: faker.helpers.arrayElement(['Rendimiento académico', 'Conducta', 'Apoyo familiar']),
        mode: faker.helpers.arrayElement(['IN_PERSON', 'VIRTUAL']),
        status: faker.helpers.arrayElement(['REQUESTED', 'CONFIRMED', 'COMPLETED']),
        durationMin: 30, meetingUrl: 'https://meet.google.com/' + faker.string.alphanumeric(10),
      },
    });
  }

  for (let i = 0; i < 30; i++) {
    await prisma.fixedAsset.create({
      data: {
        code: `INV-${String(i + 1).padStart(4, '0')}`,
        name: faker.helpers.arrayElement(['Proyector Epson', 'Pizarra acrílica', 'Computadora HP', 'Mesa redonda', 'Silla escolar']),
        category: faker.helpers.arrayElement(['Mobiliario', 'Equipo de cómputo', 'Audiovisual']),
        location: faker.helpers.arrayElement(['Aula 1A', 'Aula 2B', 'Sala de profesores', 'Dirección']),
        cost: faker.number.float({ min: 100, max: 3500, fractionDigits: 2 }),
        purchasedAt: faker.date.past({ years: 4 }),
      },
    });
  }

  console.log('✅ importación completa\n');
  console.log('🔑 Cuentas demo:');
  console.log('  admin / admin123');
  console.log('  direccion / direccion123');
  console.log('  46419291 / 457467  (tu cuenta — Carlos Andrade, docente 5° A Sec.)');
  console.log('  alumno / alumno123  (un alumno real)');
  console.log('  padre / padre123  (un padre real)');
  console.log('  cualquier docente: usuario = DNI, contraseña = 123456');
  console.log('  psicologia / psico123');
  console.log('  tesoreria / tesoreria123');
  console.log('  secretaria / secretaria123');
  console.log('  porteria / porteria123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => { prisma.$disconnect(); sourceDb.close(); });
