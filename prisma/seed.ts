import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../lib/generated/prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

faker.seed(20260429);
const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || 'file:./prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

const password = (p: string) => bcrypt.hashSync(p, 8);

async function clean() {
  // ordering matters for FK
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

  /* -------------------- AÑO ESCOLAR + PERIODOS -------------------- */
  console.log('📅 año escolar…');
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

  /* -------------------- GRADOS + SECCIONES -------------------- */
  console.log('🏫 grados y secciones…');
  const grades: { id: string; level: 'INICIAL' | 'PRIMARIA' | 'SECUNDARIA'; ordinal: number; name: string }[] = [];
  for (let i = 1; i <= 3; i++) grades.push({ ...(await prisma.grade.create({ data: { schoolYearId: year.id, level: 'INICIAL', ordinal: i, name: `${i}° Inicial` } })) });
  for (let i = 1; i <= 6; i++) grades.push({ ...(await prisma.grade.create({ data: { schoolYearId: year.id, level: 'PRIMARIA', ordinal: i, name: `${i}° Primaria` } })) });
  for (let i = 1; i <= 5; i++) grades.push({ ...(await prisma.grade.create({ data: { schoolYearId: year.id, level: 'SECUNDARIA', ordinal: i, name: `${i}° Secundaria` } })) });

  const sections: { id: string; gradeId: string; name: string; level: string; ordinal: number }[] = [];
  for (const g of grades) {
    for (const letter of ['A', 'B']) {
      const s = await prisma.section.create({
        data: { gradeId: g.id, name: letter, capacity: 30 },
      });
      sections.push({ id: s.id, gradeId: g.id, name: letter, level: g.level, ordinal: g.ordinal });
    }
  }

  /* -------------------- CURSOS -------------------- */
  console.log('📚 cursos…');
  const coursesByLevel: Record<string, { id: string; name: string; code: string }[]> = {
    INICIAL: [],
    PRIMARIA: [],
    SECUNDARIA: [],
  };
  const courseSpecs: Record<string, [string, string][]> = {
    INICIAL: [
      ['Comunicación', 'COM-IN'],
      ['Matemática', 'MAT-IN'],
      ['Personal Social', 'PSO-IN'],
      ['Ciencia y Tecnología', 'CYT-IN'],
      ['Psicomotricidad', 'PSI-IN'],
      ['Religión', 'REL-IN'],
    ],
    PRIMARIA: [
      ['Comunicación', 'COM-PR'],
      ['Matemática', 'MAT-PR'],
      ['Personal Social', 'PSO-PR'],
      ['Ciencia y Tecnología', 'CYT-PR'],
      ['Arte y Cultura', 'ART-PR'],
      ['Educación Física', 'EFI-PR'],
      ['Inglés', 'ING-PR'],
      ['Religión', 'REL-PR'],
    ],
    SECUNDARIA: [
      ['Comunicación', 'COM-SE'],
      ['Matemática', 'MAT-SE'],
      ['Ciencias Sociales', 'CSO-SE'],
      ['Ciencia y Tecnología', 'CYT-SE'],
      ['Desarrollo Personal, Cívica y Ciudadanía', 'DPC-SE'],
      ['Educación Física', 'EFI-SE'],
      ['Educación para el Trabajo', 'EPT-SE'],
      ['Arte y Cultura', 'ART-SE'],
      ['Inglés', 'ING-SE'],
      ['Religión', 'REL-SE'],
    ],
  };
  for (const level of Object.keys(courseSpecs) as (keyof typeof courseSpecs)[]) {
    for (const [name, code] of courseSpecs[level]) {
      const c = await prisma.course.create({
        data: { name, code, level, hoursPerWeek: 4 },
      });
      coursesByLevel[level].push({ id: c.id, name, code });
      // Competencias por curso (2)
      for (let i = 1; i <= 2; i++) {
        const comp = await prisma.competency.create({
          data: { courseId: c.id, code: `C${i}`, name: `Competencia ${i} de ${name}` },
        });
        for (let j = 1; j <= 2; j++) {
          const cap = await prisma.capability.create({
            data: { competencyId: comp.id, code: `${comp.code}.${j}`, name: `Capacidad ${j} de ${comp.code}` },
          });
          for (let k = 1; k <= 2; k++) {
            await prisma.performanceIndicator.create({
              data: { capabilityId: cap.id, description: `Indicador de desempeño ${k} de ${cap.code}`, weight: 1.0 },
            });
          }
        }
      }
    }
  }

  /* -------------------- USUARIOS BASE -------------------- */
  console.log('🔐 usuarios fijos…');

  const mkUser = async (data: {
    username: string; pw: string; firstName: string; lastName: string;
    role: 'ADMIN' | 'DIRECTION' | 'TEACHER' | 'PARENT' | 'STUDENT' | 'PSYCHOLOGY' | 'TREASURY' | 'GATEKEEPER' | 'SECRETARY';
    email?: string; phone?: string; dni?: string;
  }) =>
    prisma.user.create({
      data: {
        username: data.username,
        passwordHash: password(data.pw),
        firstName: data.firstName, lastName: data.lastName,
        role: data.role,
        email: data.email ?? `${data.username}@elmercedariocayma.com`,
        phone: data.phone, dni: data.dni,
      },
    });

  const admin = await mkUser({ username: 'admin', pw: 'admin123', firstName: 'Sara', lastName: 'Quispe', role: 'ADMIN' });
  const director = await mkUser({ username: 'direccion', pw: 'direccion123', firstName: 'Manuel', lastName: 'Ramírez', role: 'DIRECTION' });
  const psicologa = await mkUser({ username: 'psicologia', pw: 'psico123', firstName: 'Carla', lastName: 'Mendoza', role: 'PSYCHOLOGY' });
  const tesorera = await mkUser({ username: 'tesoreria', pw: 'tesoreria123', firstName: 'Lucía', lastName: 'Fernández', role: 'TREASURY' });
  const portero = await mkUser({ username: 'porteria', pw: 'porteria123', firstName: 'Pedro', lastName: 'Huamán', role: 'GATEKEEPER' });
  const secretaria = await mkUser({ username: 'secretaria', pw: 'secretaria123', firstName: 'Rosa', lastName: 'Chávez', role: 'SECRETARY' });
  await prisma.staff.create({ data: { userId: director.id, employeeCode: 'EMP-001', position: 'Director' } });
  await prisma.staff.create({ data: { userId: psicologa.id, employeeCode: 'EMP-002', position: 'Psicóloga' } });
  await prisma.staff.create({ data: { userId: tesorera.id, employeeCode: 'EMP-003', position: 'Tesorera', department: 'Administración' } });
  await prisma.staff.create({ data: { userId: portero.id, employeeCode: 'EMP-004', position: 'Portero' } });
  await prisma.staff.create({ data: { userId: secretaria.id, employeeCode: 'EMP-005', position: 'Secretaria' } });

  /* -------------------- DOCENTES -------------------- */
  console.log('👩‍🏫 docentes…');
  const teacherSeed: { username: string; firstName: string; lastName: string; speciality: string }[] = [
    { username: 'profesor.garcia', firstName: 'Ana', lastName: 'García', speciality: 'Comunicación' },
    { username: 'profesor.torres', firstName: 'Luis', lastName: 'Torres', speciality: 'Matemática' },
    { username: 'profesor.silva', firstName: 'María', lastName: 'Silva', speciality: 'Ciencias' },
    { username: 'profesor.rojas', firstName: 'Jorge', lastName: 'Rojas', speciality: 'Sociales' },
    { username: 'profesor.castro', firstName: 'Patricia', lastName: 'Castro', speciality: 'Inglés' },
    { username: 'profesor.vega', firstName: 'Diego', lastName: 'Vega', speciality: 'Educación Física' },
    { username: 'profesor.flores', firstName: 'Elena', lastName: 'Flores', speciality: 'Arte' },
    { username: 'profesor.morales', firstName: 'Raúl', lastName: 'Morales', speciality: 'Religión' },
  ];
  const teachers: { id: string; userId: string; speciality: string; firstName: string; lastName: string }[] = [];
  for (let i = 0; i < teacherSeed.length; i++) {
    const u = await mkUser({ ...teacherSeed[i], pw: 'profesor123', role: 'TEACHER' });
    const t = await prisma.teacher.create({
      data: { userId: u.id, employeeCode: `DOC-${String(i + 1).padStart(3, '0')}`, speciality: teacherSeed[i].speciality, hiredAt: faker.date.past({ years: 5 }) },
    });
    teachers.push({ id: t.id, userId: u.id, speciality: teacherSeed[i].speciality, firstName: teacherSeed[i].firstName, lastName: teacherSeed[i].lastName });
  }

  // Tutores
  for (let i = 0; i < sections.length; i++) {
    const t = teachers[i % teachers.length];
    await prisma.section.update({ where: { id: sections[i].id }, data: { tutorId: t.id } });
  }

  /* -------------------- ASIGNACIONES (curso+sección+docente) -------------------- */
  console.log('🧩 asignaciones de curso…');
  const courseAssignments: { id: string; courseId: string; sectionId: string; teacherId: string; level: string }[] = [];
  for (const s of sections) {
    const lvlCourses = coursesByLevel[s.level];
    for (let i = 0; i < lvlCourses.length; i++) {
      const t = teachers[(i + s.ordinal) % teachers.length];
      const ca = await prisma.courseAssignment.create({
        data: { courseId: lvlCourses[i].id, sectionId: s.id, teacherId: t.id },
      });
      courseAssignments.push({ id: ca.id, courseId: lvlCourses[i].id, sectionId: s.id, teacherId: t.id, level: s.level });
      // horario: 2 bloques por semana
      for (let d of [1 + (i % 5), (i + 3) % 5 + 1]) {
        const start = 8 + ((i * 2) % 6);
        await prisma.scheduleSlot.create({
          data: {
            courseAssignmentId: ca.id, weekday: d,
            startTime: `${String(start).padStart(2, '0')}:00`,
            endTime: `${String(start + 1).padStart(2, '0')}:30`,
            classroom: `Aula ${s.ordinal}${s.name}`,
          },
        });
      }
    }
  }

  /* -------------------- ALUMNOS Y PADRES -------------------- */
  console.log('👨‍👩‍👧 estudiantes y padres…');
  const ALUMNO_DEMO_USERNAME = 'alumno';
  const PADRE_DEMO_USERNAME = 'padre';

  const allStudents: { id: string; firstName: string; lastName: string; sectionId: string }[] = [];
  const allParents: { id: string; userId: string }[] = [];

  let demoStudentCreated = false;
  let demoParentCreated = false;

  for (let si = 0; si < sections.length; si++) {
    const sec = sections[si];
    const studentsPerSection = 10;
    for (let i = 0; i < studentsPerSection; i++) {
      const isFirstAndOnce = !demoStudentCreated && si === Math.floor(sections.length / 2);
      const firstName = isFirstAndOnce ? 'Mateo' : faker.person.firstName();
      const lastName = isFirstAndOnce ? 'Pérez Quispe' : `${faker.person.lastName()} ${faker.person.lastName()}`;
      const studentUsername = isFirstAndOnce ? ALUMNO_DEMO_USERNAME : `${firstName.toLowerCase().replace(/[^a-z]/g, '')}.${lastName.toLowerCase().split(' ')[0].replace(/[^a-z]/g, '')}.${si}.${i}`;
      const u = await prisma.user.create({
        data: {
          username: studentUsername,
          passwordHash: password(isFirstAndOnce ? 'alumno123' : 'alumno123'),
          firstName, lastName, role: 'STUDENT',
          email: `${studentUsername}@elmercedariocayma.com`,
        },
      });
      const st = await prisma.student.create({
        data: {
          userId: u.id,
          studentCode: `ALU-${String(si).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
          birthDate: faker.date.between({ from: '2008-01-01', to: '2018-12-31' }),
          gender: faker.helpers.arrayElement(['M', 'F']),
          address: faker.location.streetAddress() + ', Arequipa',
          bloodType: faker.helpers.arrayElement(['O+', 'A+', 'B+', 'AB+', 'O-']),
          emergencyContact: faker.phone.number({ style: 'national' }),
        },
      });
      await prisma.enrollment.create({ data: { studentId: st.id, sectionId: sec.id, schoolYearId: year.id } });
      allStudents.push({ id: st.id, firstName, lastName, sectionId: sec.id });
      if (isFirstAndOnce) demoStudentCreated = true;

      // Padres (1 por estudiante; algunos comparten)
      const isDemoParent = isFirstAndOnce && !demoParentCreated;
      const pFirst = isDemoParent ? 'José' : faker.person.firstName();
      const pLast = isDemoParent ? 'Pérez Mendoza' : `${faker.person.lastName()} ${faker.person.lastName()}`;
      const pUsername = isDemoParent ? PADRE_DEMO_USERNAME : `${pFirst.toLowerCase().replace(/[^a-z]/g, '')}.${pLast.toLowerCase().split(' ')[0].replace(/[^a-z]/g, '')}.${si}.${i}`;
      const pu = await prisma.user.create({
        data: {
          username: pUsername,
          passwordHash: password('padre123'),
          firstName: pFirst, lastName: pLast, role: 'PARENT',
          email: `${pUsername}@gmail.com`,
          phone: faker.phone.number({ style: 'national' }),
          dni: faker.string.numeric(8),
        },
      });
      const p = await prisma.parent.create({
        data: { userId: pu.id, occupation: faker.person.jobTitle(), workplace: faker.company.name(), relationship: faker.helpers.arrayElement(['Padre', 'Madre', 'Tutor']) },
      });
      await prisma.parentStudent.create({ data: { parentId: p.id, studentId: st.id, isPrimary: true } });
      allParents.push({ id: p.id, userId: pu.id });
      if (isDemoParent) demoParentCreated = true;
    }
  }
  console.log(`   ${allStudents.length} alumnos, ${allParents.length} padres`);

  /* -------------------- NOTAS, ASISTENCIA, TAREAS -------------------- */
  console.log('📊 notas, asistencia, tareas…');
  const indicators = await prisma.performanceIndicator.findMany({ select: { id: true, capabilityId: true } });
  const capByCourse = new Map<string, string[]>();
  for (const ca of courseAssignments) {
    const inds = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT pi.id FROM PerformanceIndicator pi
       JOIN Capability c ON c.id = pi.capabilityId
       JOIN Competency comp ON comp.id = c.competencyId
       WHERE comp.courseId = ?`, ca.courseId
    );
    capByCourse.set(ca.id, inds.map((x) => x.id));
  }

  // Notas: 3 por (estudiante, courseAssignment, periodo) — solo periodos 1 y 2
  const lettersAB = ['AD', 'A', 'B', 'C'];
  const sectionAssignments = new Map<string, typeof courseAssignments>();
  for (const ca of courseAssignments) {
    const arr = sectionAssignments.get(ca.sectionId) || [];
    arr.push(ca);
    sectionAssignments.set(ca.sectionId, arr);
  }

  for (const st of allStudents) {
    const cas = sectionAssignments.get(st.sectionId) || [];
    for (const ca of cas) {
      const indIds = capByCourse.get(ca.id) || [];
      for (const period of periods.slice(0, 2)) {
        for (let n = 0; n < 3; n++) {
          const value = faker.number.float({ min: 10, max: 20, fractionDigits: 1 });
          await prisma.score.create({
            data: {
              studentId: st.id, courseAssignmentId: ca.id,
              indicatorId: indIds[n % indIds.length], periodId: period.id,
              value, letterGrade: value >= 18 ? 'AD' : value >= 14 ? 'A' : value >= 11 ? 'B' : 'C',
              comment: faker.helpers.arrayElement([null, 'Buen desempeño', 'Necesita reforzar', 'Excelente trabajo en equipo', null]),
            },
          });
        }
        // Promedio
        const avg = faker.number.float({ min: 11, max: 19, fractionDigits: 1 });
        await prisma.finalScore.create({
          data: {
            studentId: st.id, courseAssignmentId: ca.id, periodId: period.id,
            value: avg, letterGrade: avg >= 18 ? 'AD' : avg >= 14 ? 'A' : avg >= 11 ? 'B' : 'C',
            observation: avg < 13 ? 'Requiere apoyo en el bimestre' : null,
          },
        });
      }
    }
  }

  // Asistencia (últimos 30 días hábiles)
  const today = new Date();
  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const d = new Date(today);
    d.setDate(d.getDate() - dayOffset);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    for (const st of allStudents) {
      const r = Math.random();
      const status = r < 0.85 ? 'PRESENT' : r < 0.9 ? 'LATE' : r < 0.95 ? 'EXCUSED' : 'ABSENT';
      await prisma.attendanceRecord.create({
        data: {
          studentId: st.id, sectionId: st.sectionId, date: new Date(d.toDateString()),
          status: status as 'PRESENT' | 'LATE' | 'EXCUSED' | 'ABSENT',
          arrivedAt: status === 'PRESENT' || status === 'LATE' ? new Date(d.setHours(status === 'LATE' ? 8 : 7, status === 'LATE' ? 25 : 50)) : null,
          remark: status === 'EXCUSED' ? 'Cita médica' : null,
        },
      }).catch(() => {});
    }
  }

  // Tareas + entregas
  console.log('📝 tareas y entregas…');
  for (const ca of courseAssignments) {
    for (let i = 0; i < 3; i++) {
      const due = new Date();
      due.setDate(due.getDate() + faker.number.int({ min: -10, max: 14 }));
      const a = await prisma.assignment.create({
        data: {
          courseAssignmentId: ca.id,
          title: faker.helpers.arrayElement([
            'Lectura del capítulo 5',
            'Resolver ejercicios pares',
            'Investigación grupal',
            'Mapa conceptual',
            'Ensayo argumentativo',
            'Quiz de repaso',
            'Proyecto de innovación',
          ]),
          description: faker.lorem.paragraph(),
          type: faker.helpers.arrayElement(['HOMEWORK', 'PROJECT', 'QUIZ', 'PRACTICE']),
          maxScore: 20, dueDate: due,
        },
      });
      // entregas
      const studentsInSection = allStudents.filter((s) => s.sectionId === ca.sectionId);
      for (const st of studentsInSection) {
        const submitted = Math.random() > 0.3;
        await prisma.submission.create({
          data: {
            assignmentId: a.id, studentId: st.id,
            content: submitted ? faker.lorem.sentences(2) : null,
            status: submitted ? (Math.random() > 0.5 ? 'GRADED' : 'SUBMITTED') : 'PENDING',
            submittedAt: submitted ? faker.date.recent({ days: 5 }) : null,
            score: submitted ? faker.number.float({ min: 10, max: 20, fractionDigits: 1 }) : null,
            feedback: submitted ? faker.helpers.arrayElement([null, 'Buen trabajo', 'Revisar ortografía']) : null,
          },
        });
      }
    }
  }

  // Lecciones
  for (const ca of courseAssignments.slice(0, 30)) {
    for (let i = 0; i < 5; i++) {
      const d = new Date(); d.setDate(d.getDate() - i * 7);
      await prisma.lessonSession.create({
        data: { courseAssignmentId: ca.id, date: d, topic: faker.lorem.sentence(4), description: faker.lorem.paragraph() },
      });
    }
  }

  // Planificación curricular
  for (const t of teachers) {
    for (const type of ['ANNUAL', 'UNIT', 'SESSION'] as const) {
      await prisma.curriculumPlan.create({
        data: {
          teacherId: t.id, type, title: `${type} - ${t.speciality}`,
          description: faker.lorem.paragraph(),
          startDate: new Date('2026-03-01'), endDate: new Date('2026-12-15'),
          status: faker.helpers.arrayElement(['DRAFT', 'APPROVED']),
        },
      });
    }
  }

  /* -------------------- COMUNICACIÓN -------------------- */
  console.log('💬 chats, comunicados, notificaciones…');
  const allUsers = await prisma.user.findMany({ select: { id: true, role: true } });

  // Chats: hilos privados entre algunos padres y docentes
  for (let i = 0; i < 20; i++) {
    const t = teachers[i % teachers.length];
    const p = allParents[i % allParents.length];
    const thread = await prisma.chatThread.create({ data: { isGroup: false, title: 'Conversación' } });
    await prisma.chatParticipant.createMany({
      data: [
        { threadId: thread.id, userId: t.userId },
        { threadId: thread.id, userId: p.userId },
      ],
    });
    for (let m = 0; m < 4; m++) {
      await prisma.chatMessage.create({
        data: {
          threadId: thread.id,
          senderId: m % 2 === 0 ? p.userId : t.userId,
          body: faker.lorem.sentence(),
          createdAt: faker.date.recent({ days: 7 }),
        },
      });
    }
  }

  // Comunicados
  for (let i = 0; i < 8; i++) {
    await prisma.announcement.create({
      data: {
        title: faker.helpers.arrayElement([
          'Aniversario institucional',
          'Reunión de padres - 1° Bimestre',
          'Suspensión de clases por feriado',
          'Concurso de matemáticas',
          'Vacunación escolar',
          'Día del logro',
          'Inicio de talleres',
          'Examen bimestral próxima semana',
        ]),
        body: faker.lorem.paragraphs(2),
        authorId: director.id,
        audience: faker.helpers.arrayElement(['ALL', 'PARENTS', 'TEACHERS', 'STUDENTS']),
        publishedAt: faker.date.recent({ days: 30 }),
        pinned: i < 2,
      },
    });
  }

  // Notificaciones a padres y alumnos
  for (const u of allUsers.slice(0, 200)) {
    for (let i = 0; i < 3; i++) {
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

  /* -------------------- ADMISIÓN (efamily) -------------------- */
  console.log('📩 prospectos / admisión…');
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

  /* -------------------- TESORERÍA -------------------- */
  console.log('💰 tesorería…');
  let invoiceNum = 1;
  for (const st of allStudents) {
    for (let m = 0; m < 6; m++) {
      const issued = new Date(2026, 2 + m, 5);
      const due = new Date(2026, 2 + m, 20);
      const status = m < 3 ? 'PAID' : m < 5 ? 'PENDING' : Math.random() > 0.5 ? 'PENDING' : 'OVERDUE';
      const inv = await prisma.invoice.create({
        data: {
          number: `B001-${String(invoiceNum++).padStart(6, '0')}`,
          studentId: st.id,
          concept: `Pensión de ${['Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto'][m]} 2026`,
          amount: 480,
          dueDate: due, issuedAt: issued,
          status: status as 'PAID' | 'PENDING' | 'OVERDUE',
          documentType: 'BOLETA',
          sunatCode: status === 'PAID' ? `SUNAT-${faker.string.alphanumeric(10)}` : null,
        },
      });
      if (status === 'PAID') {
        await prisma.payment.create({
          data: {
            invoiceId: inv.id, studentId: st.id,
            amount: 480, method: faker.helpers.arrayElement(['BCP', 'Interbank', 'Yape', 'Tarjeta']),
            reference: faker.string.alphanumeric(12),
            paidAt: new Date(issued.getTime() + 1000 * 60 * 60 * 24 * faker.number.int({ min: 1, max: 15 })),
          },
        });
      }
    }
  }

  /* -------------------- PLAN LECTOR -------------------- */
  console.log('📖 plan lector…');
  const bookSeed = [
    { title: 'El principito', author: 'Antoine de Saint-Exupéry', level: 'PRIMARIA' as const },
    { title: 'Cuentos de la selva', author: 'Horacio Quiroga', level: 'PRIMARIA' as const },
    { title: 'Tradiciones peruanas', author: 'Ricardo Palma', level: 'SECUNDARIA' as const },
    { title: 'Los ríos profundos', author: 'José María Arguedas', level: 'SECUNDARIA' as const },
    { title: 'La ciudad y los perros', author: 'Mario Vargas Llosa', level: 'SECUNDARIA' as const },
    { title: 'El zorro de arriba y el zorro de abajo', author: 'José María Arguedas', level: 'SECUNDARIA' as const },
    { title: 'Patito feo', author: 'Hans Christian Andersen', level: 'INICIAL' as const },
    { title: 'Cucú', author: 'Lola Casas', level: 'INICIAL' as const },
  ];
  const books = await Promise.all(
    bookSeed.map((b) => prisma.book.create({ data: { ...b, publisher: faker.company.name(), description: faker.lorem.paragraph() } }))
  );
  for (const st of allStudents.slice(0, 60)) {
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

  /* -------------------- PSICOLOGÍA / ECARE -------------------- */
  console.log('🧠 ecare…');
  for (const st of allStudents.slice(0, 20)) {
    await prisma.psychologyCase.create({
      data: {
        studentId: st.id, title: faker.helpers.arrayElement(['Adaptación al aula', 'Rendimiento académico', 'Conducta', 'Familiar']),
        description: faker.lorem.paragraph(),
        status: faker.helpers.arrayElement(['OPEN', 'IN_FOLLOWUP', 'CLOSED']),
        notesJson: JSON.stringify([{ date: new Date(), note: faker.lorem.sentence() }]),
      },
    });
    await prisma.psychologicalTest.create({
      data: {
        studentId: st.id, testType: faker.helpers.arrayElement(['Estilos de aprendizaje', 'Autoestima', 'Inteligencias múltiples', 'Intereses vocacionales']),
        resultJson: JSON.stringify({ score: faker.number.int({ min: 60, max: 95 }), profile: faker.lorem.words(3) }),
      },
    });
  }

  /* -------------------- SALUD / ENFERMERÍA -------------------- */
  console.log('🩺 salud…');
  for (const st of allStudents.slice(0, 30)) {
    for (let i = 0; i < 2; i++) {
      await prisma.healthRecord.create({
        data: {
          studentId: st.id,
          date: faker.date.recent({ days: 60 }),
          symptoms: faker.helpers.arrayElement(['Dolor de cabeza', 'Fiebre leve', 'Caída en patio', 'Mareo']),
          treatment: faker.helpers.arrayElement(['Reposo y agua', 'Paracetamol', 'Curación con alcohol', 'Observación']),
          attendedBy: 'Tópico escolar',
        },
      });
    }
    for (const v of ['Antitetánica', 'COVID-19', 'Influenza']) {
      await prisma.vaccination.create({
        data: { studentId: st.id, vaccineName: v, dose: '1ra', appliedAt: faker.date.past({ years: 2 }), notes: 'Sin reacciones adversas' },
      });
    }
  }

  /* -------------------- HOJA DE VIDA -------------------- */
  for (const st of allStudents.slice(0, 80)) {
    for (let i = 0; i < 2; i++) {
      await prisma.studentLifeEntry.create({
        data: {
          studentId: st.id,
          type: faker.helpers.arrayElement(['ACHIEVEMENT', 'INCIDENT', 'COMMENT', 'RECOGNITION', 'CONDUCT']),
          title: faker.lorem.sentence(4),
          body: faker.lorem.paragraph(),
          date: faker.date.recent({ days: 60 }),
          authorId: faker.helpers.arrayElement(teachers).userId,
        },
      });
    }
  }

  /* -------------------- TALLERES -------------------- */
  console.log('🎨 talleres…');
  const ws = ['Fútbol', 'Vóley', 'Ajedrez', 'Coro', 'Banda escolar', 'Robótica', 'Danza folklórica', 'Teatro', 'Arte', 'Inglés conversacional'];
  for (const name of ws) {
    const w = await prisma.workshop.create({
      data: {
        name, description: `Taller de ${name}`,
        teacherId: faker.helpers.arrayElement(teachers).id,
        schedule: faker.helpers.arrayElement(['Lunes 4-6 PM', 'Miércoles 4-6 PM', 'Sábado 9-11 AM']),
        capacity: 25, level: 'PRIMARIA',
      },
    });
    const subset = faker.helpers.arrayElements(allStudents, 8);
    for (const st of subset) {
      await prisma.workshopEnrollment.create({ data: { workshopId: w.id, studentId: st.id } }).catch(() => {});
    }
  }

  /* -------------------- DOCS / DRIVE -------------------- */
  for (let i = 0; i < 12; i++) {
    await prisma.document.create({
      data: {
        ownerId: secretaria.id,
        title: faker.helpers.arrayElement([
          'Reglamento interno 2026', 'Calendario académico', 'Plan anual de trabajo',
          'Plan lector institucional', 'Manual de convivencia', 'Plan de tutoría',
        ]) + ` v${i % 3 + 1}`,
        category: faker.helpers.arrayElement(['Académico', 'Administrativo', 'Tutoría', 'Reglamentos']),
        version: i % 3 + 1,
        signedAt: i % 2 === 0 ? faker.date.recent({ days: 60 }) : null,
        signedById: i % 2 === 0 ? director.id : null,
      },
    });
  }
  for (let i = 0; i < 30; i++) {
    const u = faker.helpers.arrayElement(teachers);
    await prisma.driveFile.create({
      data: {
        uploaderId: u.userId,
        filename: faker.system.fileName(),
        mimeType: faker.helpers.arrayElement(['application/pdf', 'image/jpeg', 'application/vnd.ms-excel', 'video/mp4']),
        sizeBytes: faker.number.int({ min: 100_000, max: 50_000_000 }),
        path: `/drive/${u.userId}/${faker.string.uuid()}`,
        folder: faker.helpers.arrayElement(['Material de clase', 'Exámenes', 'Recursos', 'Multimedia']),
        isShared: Math.random() > 0.5,
      },
    });
  }

  /* -------------------- MESA DE PARTES -------------------- */
  let ticketNum = 1;
  for (const p of allParents.slice(0, 15)) {
    await prisma.ticket.create({
      data: {
        number: `MP-${String(ticketNum++).padStart(5, '0')}`,
        subject: faker.helpers.arrayElement(['Solicitud de constancia', 'Cambio de sección', 'Solicitud de boleta', 'Justificación de inasistencia']),
        body: faker.lorem.paragraph(),
        category: faker.helpers.arrayElement(['Constancias', 'Académico', 'Administrativo']),
        creatorId: p.userId,
        assigneeId: secretaria.id,
        status: faker.helpers.arrayElement(['OPEN', 'IN_REVIEW', 'ANSWERED', 'CLOSED']),
      },
    });
  }

  /* -------------------- PORTERÍA -------------------- */
  for (let i = 0; i < 60; i++) {
    const u = faker.helpers.arrayElement(allUsers);
    await prisma.gateLog.create({
      data: {
        userId: u.id,
        direction: i % 2 === 0 ? 'IN' : 'OUT',
        occurredAt: faker.date.recent({ days: 5 }),
        reason: faker.helpers.arrayElement([null, 'Recoge a su hijo', 'Reunión', 'Visita programada']),
      },
    });
  }

  /* -------------------- ENTREVISTAS -------------------- */
  for (let i = 0; i < 12; i++) {
    const t = faker.helpers.arrayElement(teachers);
    const p = faker.helpers.arrayElement(allParents);
    await prisma.interview.create({
      data: {
        teacherId: t.id, parentId: p.id,
        scheduledAt: faker.date.soon({ days: 14 }),
        topic: faker.helpers.arrayElement(['Rendimiento académico', 'Conducta', 'Apoyo familiar', 'Seguimiento mensual']),
        mode: faker.helpers.arrayElement(['IN_PERSON', 'VIRTUAL']),
        status: faker.helpers.arrayElement(['REQUESTED', 'CONFIRMED', 'COMPLETED']),
        durationMin: 30,
        meetingUrl: 'https://meet.google.com/' + faker.string.alphanumeric(10),
      },
    });
  }

  /* -------------------- ACTIVOS -------------------- */
  for (let i = 0; i < 30; i++) {
    await prisma.fixedAsset.create({
      data: {
        code: `INV-${String(i + 1).padStart(4, '0')}`,
        name: faker.helpers.arrayElement(['Proyector Epson', 'Pizarra acrílica', 'Computadora HP', 'Mesa redonda', 'Silla escolar', 'Impresora']),
        category: faker.helpers.arrayElement(['Mobiliario', 'Equipo de cómputo', 'Audiovisual']),
        location: faker.helpers.arrayElement(['Aula 1A', 'Aula 2B', 'Sala de profesores', 'Dirección', 'Sala de cómputo']),
        cost: faker.number.float({ min: 100, max: 3500, fractionDigits: 2 }),
        purchasedAt: faker.date.past({ years: 4 }),
      },
    });
  }

  console.log('✅ seed completo');
  console.log('\nCuentas demo:');
  console.log('  admin / admin123');
  console.log('  direccion / direccion123');
  console.log('  profesor.garcia / profesor123');
  console.log('  alumno / alumno123');
  console.log('  padre / padre123');
  console.log('  psicologia / psico123');
  console.log('  tesoreria / tesoreria123');
  console.log('  secretaria / secretaria123');
  console.log('  porteria / porteria123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
