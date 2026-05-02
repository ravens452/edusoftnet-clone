# Edusoftnet Clone — Especificación

Clon completo de la plataforma de gestión educativa edusoftnet (https://www.edusoftnet.pe), basado en investigación pública del sitio oficial, App Store y Google Play.

## Roles del sistema

1. **Alumno** (estudiante)
2. **Padre / Apoderado** (puede tener varios hijos vinculados)
3. **Docente** (profesor de aula / asignatura / tutor)
4. **Dirección** (director, subdirector, coordinador)
5. **Administrativo** (secretaría, mesa de partes)
6. **Tesorería**
7. **Psicología / ecare**
8. **Portería**
9. **Admin del sistema** (super-admin)

## Módulos a implementar

### Académicos / Formativos
- **Calificaciones** — evaluación por competencias, capacidades, indicadores de desempeño, rúbricas
- **eclass** — LMS: tareas, evaluaciones en línea, rúbricas, gamificación, libreta de notas
- **emonitor** — planificación anual, unidades de aprendizaje, sesiones, monitoreo curricular, plantillas SIAGIE
- **Evaluaciones en línea** — quizzes, foros, actividades
- **Asistencia (onTime)** — marcaje QR, autopresencia, eventos, control por horario, timbre virtual
- **Talleres** — extracurriculares con auto-inscripción
- **elibrary** — plan lector con evaluaciones de comprensión (literal, inferencial, crítica)

### Comunicación
- **echat** — mensajería instantánea con archivos
- **eboot** — bot de WhatsApp para notificaciones (simulado)
- **Mensajería interna** — comunicados oficiales
- **Entrevistas** — agendamiento docente-familia con registro de acuerdos

### Estudiante 360
- **Hoja de Vida Estudiantil** — documentación formativa continua
- **ecare / Psicología** — seguimiento socio-emocional, casos, tests automáticos (estilos de aprendizaje, autoestima, inteligencias múltiples, intereses vocacionales)
- **Salud / Enfermería** — vacunas, síntomas, atenciones, emergencias

### Administración
- **Matrícula en línea** — proceso digital con documentos y firmas
- **efamily** — CRM admisión: prospectos → preinscripción → matrícula
- **Tesorería** — pagos, facturación electrónica SUNAT, comprobantes, conexión bancos/pasarelas (simulado)
- **Mesa de partes virtual** — solicitudes electrónicas con tracking de estado
- **Activos fijos** — inventario con códigos de barras
- **Control de recursos** — impresión, disponibilidad de aulas/equipos
- **Portería** — registro de entrada/salida

### Documentos
- **edocuments** — repositorio con control de versiones y firma digital
- **edrive** — almacenamiento en la nube con compartición

## Stack técnico

- **Framework**: Next.js 15 (App Router) + TypeScript
- **UI**: TailwindCSS + shadcn/ui + Lucide icons
- **DB**: SQLite + Prisma (cambiable a PostgreSQL en producción)
- **Auth**: NextAuth.js (credentials) con roles
- **Validación**: Zod
- **Tablas/datos**: TanStack Table
- **Charts**: Recharts
- **Forms**: React Hook Form
- **Datos seed**: Faker + datos en español/Perú

## Estructura

```
edusoftnet-clone/
  prisma/
    schema.prisma
    seed.ts
  src/
    app/
      (auth)/login/
      (app)/
        dashboard/
        notas/
        asistencia/
        eclass/
        echat/
        efamily/
        tesoreria/
        elibrary/
        ecare/
        emonitor/
        edocuments/
        edrive/
        talleres/
        porteria/
        mesa-partes/
        salud/
        entrevistas/
        admin/
      api/
    components/
      ui/         (shadcn)
      layout/     (sidebars por rol)
      dashboard/
    lib/
      auth.ts
      db.ts
      permissions.ts
      utils.ts
    types/
  public/
```
