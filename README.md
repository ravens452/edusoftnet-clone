# edusoftnet-clone

Clon de demostración de la plataforma educativa peruana **edusoftnet**, con todos sus módulos principales y soporte multi-rol.

> Stack: Next.js 16 (App Router) · React 19 · TypeScript · TailwindCSS v4 · Prisma 7 + SQLite · Auth basada en sesión + bcrypt.

## Cuentas demo

Todas usan estas contraseñas (botones de "Cuentas demo" en el login también las llenan):

| Rol | Usuario | Contraseña |
|---|---|---|
| Administrador | `admin` | `admin123` |
| Dirección | `direccion` | `direccion123` |
| Docente | `profesor.garcia` | `profesor123` |
| Alumno | `alumno` | `alumno123` |
| Padre / Apoderado | `padre` | `padre123` |
| Psicología | `psicologia` | `psico123` |
| Tesorería | `tesoreria` | `tesoreria123` |
| Secretaría | `secretaria` | `secretaria123` |
| Portería | `porteria` | `porteria123` |

(Hay 8 docentes adicionales: `profesor.torres`, `profesor.silva`, etc., todos con `profesor123`).

## Módulos implementados

**Académico**
- Calificaciones (evaluación por competencias, capacidades e indicadores)
- Asistencia (onTime) — registro diario por sección, vista calendario para alumno/padre
- eclass — tareas, entregas, lecciones, libreta por sección
- emonitor — planificación curricular (Anual / Unidad / Sesión)
- elibrary — plan lector con evaluaciones (literal / inferencial / crítica)
- Talleres — extracurriculares con inscripción
- Horario — cronograma semanal por estudiante / docente

**Comunicación**
- echat — mensajería 1:1 con persistencia
- Comunicados — feed institucional con audiencia segmentada
- Entrevistas — agenda docente-familia con modalidad presencial/virtual

**Familia / Estudiante**
- Mis hijos / Hijo detalle (resumen 360 con notas, asistencia, pagos, hoja de vida)
- Hoja de vida estudiantil (logros, incidencias, reconocimientos)
- ecare — psicología (casos socio-emocionales + tests)
- Salud / Enfermería — atenciones y vacunación
- Notificaciones

**Operaciones**
- efamily — admisión (CRM kanban: Lead → Contactado → Entrevista → Evaluación → Pre-matrícula → Matriculado)
- Matrículas
- Tesorería — boletas, facturas, pagos (SUNAT-like), recaudación mensual
- Mis pagos (vista padre/alumno)
- Mesa de partes — tickets de trámites
- Portería — registro de entradas/salidas
- edocuments — repositorio con versiones y firma
- edrive — almacenamiento institucional

**Administración**
- Admin · Usuarios
- Admin · Configuración del sistema

## Datos sembrados

- 1 año escolar (2026) con 4 bimestres
- 14 grados (3 inicial + 6 primaria + 5 secundaria) × 2 secciones cada uno = 28 secciones
- 24 cursos con competencias / capacidades / indicadores
- 9 docentes + tutores asignados a secciones
- 280 alumnos + 280 padres
- ~14 000 calificaciones, ~4 000 asistencias diarias, cientos de tareas y entregas
- Comunicados, chats, prospectos de admisión, facturas, pagos, libros del plan lector, casos de psicología, atenciones de enfermería, talleres con inscripciones, archivos de drive, tickets de mesa de partes, entradas/salidas de portería, entrevistas, hoja de vida.

## Cómo correr

```bash
cd /Users/mini/edusoftnet-clone

# Migrar y sembrar (ya hecho)
npx prisma migrate dev
npx tsx prisma/seed.ts

# Dev server
npm run dev
# abre http://localhost:3000
```

## Smoke test

```bash
npx tsx scripts/smoke-test.ts
# 95 pass, 0 fail
```

Recorre las páginas para los 9 roles confirmando 200 OK.

## Estructura

```
app/
  layout.tsx                root layout
  page.tsx                  redirige a /login o /dashboard
  login/                    pantalla de login + server action
  (app)/                    rutas autenticadas (sidebar+topbar layout)
    layout.tsx
    dashboard/              vista por rol
    notas/ asistencia/ eclass/ echat/ comunicados/
    efamily/ tesoreria/ pagos/ elibrary/ ecare/ emonitor/
    edocuments/ edrive/ talleres/ porteria/ mesa-partes/
    salud/ entrevistas/ hijos/ hoja-vida/ horario/
    notificaciones/ matriculas/ admin/
components/
  ui/                       componentes base (button, card, input, table, ...)
  layout/                   sidebar + topbar
lib/
  db.ts                     PrismaClient singleton (better-sqlite3 adapter)
  auth.ts                   sesiones + bcrypt + cookies
  navigation.ts             menú dinámico por rol
  utils.ts                  cn, formatCurrency, formatDate
  generated/prisma/         cliente generado por Prisma
prisma/
  schema.prisma             schema completo (37 modelos, 14 enums)
  seed.ts                   datos ficticios
  migrations/
scripts/
  smoke-test.ts             prueba de humo de todas las rutas
```

## Notas técnicas

- Auth simple por cookie (`edusoftnet_session`) + tabla `Session`. Sin NextAuth.
- Prisma 7 usa el generador `prisma-client` y driver adapter `@prisma/adapter-better-sqlite3`. El URL ya no va en `schema.prisma`.
- Los iconos en el sidebar se pasan como nombres (`IconName`) y se resuelven en el cliente, porque Server Components no pueden serializar componentes React a un Client Component.
- Server Actions reales se usan para login / logout / enviar mensaje en echat / publicar comunicado.

## Diferencias con la plataforma real

- Sin integraciones externas reales (SUNAT, SIAGIE, Google Classroom, WhatsApp/eboot, pasarelas de pago, Zoom).
- Sin app móvil ni notificaciones push.
- Sin marca de asistencia por QR / geolocalización (solo el modelo de datos lo soporta).
- La firma digital en edocuments es solo un flag.
