/**
 * Enriquece los datos del clon para una demo a Dirección.
 * NO borra nada. Solo agrega registros adicionales sobre lo ya importado.
 *
 * Uso: npx tsx prisma/enrich-data.ts
 */

import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../lib/generated/prisma/client';
import { faker } from '@faker-js/faker';

faker.seed(20260501);
const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

const PAYMENT_METHODS = ['CAJA_AREQUIPA', 'BCP', 'INTERBANK', 'YAPE', 'PLIN', 'TARJETA', 'EFECTIVO_TESORERIA'] as const;

/* ============================================================
 *  COMUNICADOS REALISTAS — temas reales del año escolar
 * ============================================================ */
const COMUNICADOS = [
  {
    title: 'Comunicado Nº 12/04 — Reunión General de Apoderados',
    body:
`Estimados padres de familia:

Les invitamos a la Reunión General de Apoderados que se realizará el sábado 10 de mayo a las 9:00 a.m. en el auditorio principal del colegio.

Agenda:
• Informe del primer bimestre por la Dirección
• Presentación de logros académicos y formativos
• Proyección de actividades del segundo bimestre
• Espacios formativos por aula con el tutor

Su asistencia es de carácter obligatorio. La asistencia será registrada por los tutores y se informará oportunamente a los apoderados ausentes.

Contamos con su valiosa participación. ¡Que San Pedro Nolasco bendiga a nuestras familias!

Dirección
I.E.P. "El Mercedario" RVDO. P.E.A.B.`,
    audience: 'PARENTS', pinned: true,
  },
  {
    title: 'Comunicado Nº 13/04 — Cronograma de Evaluaciones del I Bimestre',
    body:
`Estimados estudiantes y apoderados:

Se publica el cronograma oficial de evaluaciones de cierre del I Bimestre:

INICIAL Y PRIMARIA
• Lunes 12 de mayo: Comunicación
• Martes 13 de mayo: Matemática
• Miércoles 14 de mayo: Personal Social y Ciencia y Tecnología
• Jueves 15 de mayo: Inglés y Religión
• Viernes 16 de mayo: Recuperación

SECUNDARIA
• Lunes 12 de mayo: Comunicación / Matemática (alternados)
• Martes 13 de mayo: CCSS / DPCC
• Miércoles 14 de mayo: CTA / Física
• Jueves 15 de mayo: Inglés / EPT
• Viernes 16 de mayo: Arte / Religión / Ed. Física

Los estudiantes deben llegar 15 minutos antes con su uniforme completo y materiales solicitados por cada docente.

Coordinación Académica`,
    audience: 'ALL', pinned: true,
  },
  {
    title: 'Comunicado Nº 14/04 — Día de la Madre',
    body:
`Estimada comunidad mercedaria:

Con profundo cariño les invitamos a la celebración del Día de la Madre, el viernes 9 de mayo desde las 10:00 a.m. en el patio central.

Programa:
• 10:00 — Saludo de bienvenida
• 10:15 — Número artístico de Inicial
• 10:45 — Coro escolar y banda de la institución
• 11:15 — Presentaciones de Primaria y Secundaria
• 12:00 — Compartir y agasajo a las madres asistentes

Las madres están exoneradas de cualquier costo. Los apoderados varones son bienvenidos. ¡Las esperamos!

Comité Organizador`,
    audience: 'ALL',
  },
  {
    title: 'Comunicado Nº 15/04 — Actualización del Plan Lector',
    body:
`Estimados padres de familia:

Recordamos que la lectura del segundo libro del Plan Lector institucional debe completarse antes del 20 de mayo. Los libros asignados por nivel son:

• Inicial: "Patito Feo" (lectura compartida)
• Primaria 1°-3°: "Cuentos de la selva" — Horacio Quiroga
• Primaria 4°-6°: "El principito" — Antoine de Saint-Exupéry
• Secundaria 1°-2°: "Tradiciones peruanas" (selección) — Ricardo Palma
• Secundaria 3°-5°: "Los ríos profundos" — José María Arguedas

La evaluación se realizará en tres dimensiones: literal, inferencial y crítica. Los estudiantes podrán acceder a las preguntas guía a través de elibrary.

Plan Lector Institucional`,
    audience: 'ALL',
  },
  {
    title: 'Comunicado Nº 16/04 — Vacunación Escolar de Refuerzo',
    body:
`Estimados padres de familia:

En coordinación con el Centro de Salud Cayma, se realizará la jornada de vacunación de refuerzo el martes 13 de mayo de 8:30 a.m. a 12:30 p.m. en el tópico escolar.

Vacunas a aplicarse:
• Refuerzo de DPT (Difteria, Tos ferina, Tétanos)
• Influenza estacional
• HPV (mujeres de 9 años en adelante con autorización firmada)

Quienes deseen que sus hijos sean vacunados deben firmar el consentimiento informado adjunto y devolverlo a través del tutor de aula antes del lunes 12.

Departamento de Salud Escolar`,
    audience: 'PARENTS',
  },
  {
    title: 'Comunicado Nº 17/04 — Inicio de Talleres Extracurriculares',
    body:
`Apreciados estudiantes y familias:

Los talleres extracurriculares 2026 inician el sábado 17 de mayo. Talleres disponibles:

DEPORTIVOS — Fútbol, Vóley, Ajedrez (S/. 80 mensuales)
ARTÍSTICOS — Coro, Banda escolar, Danza folklórica, Teatro, Arte (S/. 80 mensuales)
ACADÉMICOS — Robótica, Inglés conversacional (S/. 100 mensuales)

Inscripciones abiertas en secretaría hasta el viernes 15 de mayo. Cupos limitados. La inscripción incluye uniforme deportivo y material.

Coordinación de Talleres`,
    audience: 'STUDENTS',
  },
  {
    title: 'Comunicado Nº 18/04 — Brigadas Pastorales 2026',
    body:
`A toda la comunidad mercedaria:

Conforme nuestro carisma religioso, este año reactivamos las Brigadas Pastorales con cuatro líneas de acción:

1. Brigada de Liturgia y Música — apoyo en celebraciones eucarísticas escolares
2. Brigada de Solidaridad — visitas y donaciones a hogares de adultos mayores
3. Brigada Misionera — campañas en comunidades aledañas durante vacaciones
4. Brigada Vocacional — encuentros con jóvenes religiosos mercedarios

Estudiantes de 4° y 5° de secundaria pueden inscribirse con la profesora de Religión hasta el viernes 16 de mayo.

¡Por la libertad de los cautivos del Reino de Dios!

Departamento Pastoral`,
    audience: 'STUDENTS',
  },
  {
    title: 'Comunicado Nº 19/04 — Olimpiada Nacional de Matemática (ONEM 2026)',
    body:
`Estimados padres y estudiantes de Secundaria:

Nuestro colegio participará en la Olimpiada Nacional Escolar de Matemática (ONEM) 2026 organizada por el MINEDU. La primera fase clasificatoria será el sábado 24 de mayo.

Estudiantes interesados pueden anotarse con sus profesores de Matemática hasta el viernes 17 de mayo. El colegio cubre la inscripción, uniforme y traslado para los participantes.

¡Confiamos en su talento y esfuerzo!

Coordinación Académica de Secundaria`,
    audience: 'STUDENTS',
  },
  {
    title: 'Comunicado Nº 20/04 — Simulacro Multipeligro INDECI',
    body:
`Estimados padres de familia:

El miércoles 14 de mayo a las 10:00 a.m. realizaremos el Simulacro Nacional Multipeligro coordinado con INDECI.

Procedimiento:
• 10:00 a.m. sonará la sirena institucional
• Los estudiantes evacuarán siguiendo a su tutor a las zonas seguras del patio
• Se simularán situaciones de sismo y posterior incendio
• La actividad concluye con un balance pedagógico en cada aula

El simulacro está calificado por la Comisión de Defensa Civil del colegio. Pedimos enviar a los estudiantes con calzado cómodo ese día.

Comisión de Gestión de Riesgo`,
    audience: 'ALL',
  },
  {
    title: 'Comunicado Nº 21/04 — Cobranza de Pensiones del Mes de Mayo',
    body:
`Estimados padres de familia:

Recordamos que la pensión correspondiente al mes de mayo 2026 vence el viernes 20 de mayo. Monto: S/. 480.00 por estudiante.

Medios de pago disponibles:
• Caja Arequipa (agencia, agente o app Caja Móvil) — código 01254
• BCP (Banca Móvil o agencia) — código 78521
• Interbank — código 63214
• Yape o Plin al 054-234567 (a nombre del colegio)
• Efectivo en tesorería del colegio (lunes a viernes 7:30 a.m. – 1:00 p.m.)

Los pagos efectuados después del vencimiento generan mora del 5% sobre el monto.

Para consultas: tesorería al 054-234567 o admin@elmercedariocayma.com

Oficina de Tesorería`,
    audience: 'PARENTS', pinned: true,
  },
  {
    title: 'Comunicado Nº 22/04 — Concurso de Oratoria por la Madre Mercedaria',
    body:
`Apreciados estudiantes:

Con motivo del Día de la Madre Mercedaria celebramos el VII Concurso Interno de Oratoria. Tema: "El amor de María, modelo de toda madre".

Categorías:
• Primaria 4°-6°: hasta 3 minutos
• Secundaria 1°-3°: hasta 4 minutos
• Secundaria 4°-5°: hasta 5 minutos

Inscripciones con la profesora de Comunicación de tu nivel hasta el martes 13 de mayo. Premios: medallas, libros y reconocimiento institucional.

Departamento de Comunicación`,
    audience: 'STUDENTS',
  },
  {
    title: 'Comunicado Nº 23/04 — Reunión de Tutoría — 1ro Secundaria',
    body:
`Apreciados padres de 1° A y B de Secundaria:

Los citamos a una reunión de tutoría exclusivamente para padres de 1° de Secundaria el martes 13 de mayo a las 5:30 p.m. en el aula 1° A.

Agenda:
• Adaptación al nivel secundario
• Presentación del equipo docente
• Acompañamiento académico y socioemocional
• Compromisos del hogar para el II Bimestre

Su presencia es muy importante. La reunión durará aproximadamente 1 hora.

Tutora 1° A — Prof. Evelyn Anccori`,
    audience: 'PARENTS',
  },
];

const LIBROS = [
  { title: 'El principito', author: 'Antoine de Saint-Exupéry', publisher: 'Salamandra', level: 'PRIMARIA' as const, description: 'Una obra universal sobre la amistad, el amor y los valores esenciales.' },
  { title: 'Cuentos de la selva', author: 'Horacio Quiroga', publisher: 'Editorial Bruño', level: 'PRIMARIA' as const, description: 'Relatos de la selva misionera con animales como protagonistas.' },
  { title: 'Tradiciones peruanas', author: 'Ricardo Palma', publisher: 'Peisa', level: 'SECUNDARIA' as const, description: 'Compendio de relatos costumbristas del Perú colonial y republicano.' },
  { title: 'Los ríos profundos', author: 'José María Arguedas', publisher: 'Horizonte', level: 'SECUNDARIA' as const, description: 'Novela sobre la identidad andina y la formación del adolescente.' },
  { title: 'La ciudad y los perros', author: 'Mario Vargas Llosa', publisher: 'Alfaguara', level: 'SECUNDARIA' as const, description: 'Crítica social a través de la vida en el colegio militar Leoncio Prado.' },
  { title: 'El zorro de arriba y el zorro de abajo', author: 'José María Arguedas', publisher: 'Horizonte', level: 'SECUNDARIA' as const, description: 'Última novela de Arguedas sobre los cambios en el Perú.' },
  { title: 'Patito feo', author: 'Hans Christian Andersen', publisher: 'Mirador', level: 'INICIAL' as const, description: 'Cuento clásico sobre la aceptación y el descubrimiento de uno mismo.' },
  { title: 'Cucú', author: 'Lola Casas', publisher: 'SM', level: 'INICIAL' as const, description: 'Libro álbum para los más pequeños.' },
  { title: 'El reino de la fantasía', author: 'Geronimo Stilton', publisher: 'Planeta', level: 'PRIMARIA' as const, description: 'Aventuras del ratón más famoso de la literatura infantil.' },
  { title: 'Matilda', author: 'Roald Dahl', publisher: 'Alfaguara', level: 'PRIMARIA' as const, description: 'Una niña genial enfrenta a una directora abusiva con valentía.' },
  { title: 'Las crónicas de Narnia: El león, la bruja y el armario', author: 'C.S. Lewis', publisher: 'Destino', level: 'PRIMARIA' as const, description: 'Cuatro hermanos descubren un mundo mágico al cruzar un armario.' },
  { title: 'El diario de Ana Frank', author: 'Ana Frank', publisher: 'Plaza & Janés', level: 'SECUNDARIA' as const, description: 'Testimonio íntimo de una adolescente durante la Segunda Guerra Mundial.' },
  { title: 'Crónica de una muerte anunciada', author: 'Gabriel García Márquez', publisher: 'Sudamericana', level: 'SECUNDARIA' as const, description: 'Investigación sobre el asesinato de Santiago Nasar.' },
  { title: 'Don Quijote de la Mancha (adaptación)', author: 'Miguel de Cervantes', publisher: 'Vicens Vives', level: 'SECUNDARIA' as const, description: 'La versión adaptada de la obra cumbre del Siglo de Oro.' },
  { title: 'Las aventuras de Pinocho', author: 'Carlo Collodi', publisher: 'Anaya', level: 'PRIMARIA' as const, description: 'El muñeco de madera que aprende sobre la verdad.' },
  { title: 'Charlie y la fábrica de chocolate', author: 'Roald Dahl', publisher: 'Alfaguara', level: 'PRIMARIA' as const, description: 'Cinco niños visitan una fábrica de chocolate llena de sorpresas.' },
  { title: 'María', author: 'Jorge Isaacs', publisher: 'Cátedra', level: 'SECUNDARIA' as const, description: 'Novela romántica del siglo XIX en el Valle del Cauca.' },
  { title: 'Aves sin nido', author: 'Clorinda Matto de Turner', publisher: 'Horizonte', level: 'SECUNDARIA' as const, description: 'Pionera novela indigenista peruana.' },
  { title: 'Conversación en La Catedral', author: 'Mario Vargas Llosa', publisher: 'Alfaguara', level: 'SECUNDARIA' as const, description: '¿En qué momento se había jodido el Perú?' },
  { title: 'Cuentos del tío Tigre y el tío Conejo', author: 'Tradición popular', publisher: 'Norma', level: 'PRIMARIA' as const, description: 'Cuentos populares latinoamericanos.' },
];

/* ============================================================
 *  CONVERSACIONES — plantillas en español, contexto educativo real
 * ============================================================ */
const CHAT_TEMPLATES = [
  [
    { role: 'parent', text: 'Buenas tardes profesora, ¿cómo está? Quería consultarle sobre el avance de mi hijo en matemáticas.' },
    { role: 'teacher', text: 'Buenas tardes señora, gracias por escribir. Su hijo viene mejorando notablemente. La semana pasada obtuvo 16 en la práctica.' },
    { role: 'parent', text: 'Qué alegría escuchar eso. ¿Hay algún tema específico que deberíamos reforzar en casa?' },
    { role: 'teacher', text: 'Sí, le sugiero practicar problemas con fracciones. Le envío un par de ejercicios por edrive.' },
    { role: 'parent', text: 'Mil gracias profesora, los revisamos esta noche.' },
    { role: 'teacher', text: 'Cualquier duda no dude en escribirme. Buen fin de semana.' },
  ],
  [
    { role: 'parent', text: 'Profesor, mi hija no podrá asistir mañana porque tiene cita médica.' },
    { role: 'teacher', text: 'Tomo nota. Por favor presenten el justificativo médico al regresar para registrarlo como inasistencia justificada.' },
    { role: 'parent', text: 'Perfecto, lo entregamos el viernes. ¿Podría enviarle las tareas pendientes?' },
    { role: 'teacher', text: 'Por supuesto. Subiré la guía de la próxima sesión a eclass esta tarde para que pueda repasarla.' },
    { role: 'parent', text: 'Muchas gracias profesor. Que tenga buena tarde.' },
  ],
  [
    { role: 'parent', text: 'Profesora, gracias por la atención del día de hoy en la entrevista. Conversamos en casa con mi esposo y nos comprometemos a apoyar más con las lecturas.' },
    { role: 'teacher', text: 'Me alegra mucho su disposición. Como conversamos, los avances son progresivos. Le envío el plan de lectura semanal.' },
    { role: 'parent', text: 'Lo recibimos. Empezamos esta misma noche. ¿Hay algún libro que recomiende para reforzar comprensión lectora?' },
    { role: 'teacher', text: 'Sí, "Cuentos de la selva" es excelente para esta edad. Lo encuentra en elibrary o también en Crisol Cayma.' },
    { role: 'parent', text: 'Perfecto, lo conseguimos. Mil gracias por su acompañamiento.' },
  ],
  [
    { role: 'parent', text: 'Buenos días profesora. Mi hijo ayer me comentó que se sintió incómodo con un compañero. ¿Podríamos conversar?' },
    { role: 'teacher', text: 'Buenos días. Por supuesto, agradezco que me comparta esto. Hablo con tutoría y agendamos una reunión.' },
    { role: 'parent', text: 'Le agradezco mucho. Lo importante es que mi hijo se sienta seguro en el colegio.' },
    { role: 'teacher', text: 'Es nuestra prioridad. Le confirmo cita para mañana 4:00 p.m. con tutoría y conmigo. ¿Le viene bien?' },
    { role: 'parent', text: 'Perfecto, ahí estaremos. Gracias por la pronta atención.' },
  ],
  [
    { role: 'teacher', text: 'Estimada señora, le comparto que su hijo tuvo una excelente participación hoy en la presentación grupal sobre las regiones del Perú.' },
    { role: 'parent', text: '¡Qué alegría! Ha estado practicando mucho en casa. ¿Cómo le fue en la nota?' },
    { role: 'teacher', text: 'Obtuvo 18 sobre 20. Su exposición fue clara y demostró buen dominio del tema. Lo felicité delante del grupo.' },
    { role: 'parent', text: 'Gracias por compartirlo profesora. Eso lo motiva muchísimo.' },
    { role: 'teacher', text: 'Es una alegría compartir buenas noticias. Saludos a la familia.' },
  ],
];

/* ============================================================
 *  HOJA DE VIDA — entradas formativas
 * ============================================================ */
const LIFE_ENTRIES = [
  { type: 'ACHIEVEMENT', title: 'Excelente desempeño en el área de Matemática', body: 'El estudiante demostró razonamiento lógico y resolución autónoma de problemas durante el bimestre. Se destacó en la presentación grupal con liderazgo y claridad.' },
  { type: 'ACHIEVEMENT', title: 'Reconocimiento por puntualidad y asistencia', body: 'La estudiante mantuvo asistencia perfecta y puntualidad ejemplar durante todo el bimestre. Se le entrega medalla institucional.' },
  { type: 'ACHIEVEMENT', title: 'Primer puesto en concurso interno de oratoria', body: 'Obtuvo el primer lugar en la categoría correspondiente con la disertación "El amor de María, modelo de toda madre". Demostró expresión oral fluida y manejo del público.' },
  { type: 'RECOGNITION', title: 'Mención honrosa en Olimpiada de Matemática', body: 'Clasificó a la fase regional de la ONEM 2026. Se le entrega diploma y será reconocido en el acto cívico del lunes.' },
  { type: 'RECOGNITION', title: 'Comportamiento solidario destacado', body: 'Apoyó voluntariamente a un compañero con dificultades académicas durante todo el bimestre. Su actitud refleja los valores mercedarios.' },
  { type: 'RECOGNITION', title: 'Participación destacada en Brigada Pastoral', body: 'Como integrante de la Brigada de Solidaridad, participó activamente en la visita al hogar de adultos mayores Cayma.' },
  { type: 'COMMENT', title: 'Necesita reforzar comprensión lectora', body: 'Se observa avance, pero conviene continuar con lecturas en casa. Se recomienda al apoderado dedicar 20 minutos diarios de lectura compartida.' },
  { type: 'COMMENT', title: 'Buen desempeño grupal', body: 'Se integra muy bien con sus compañeros y aporta ideas creativas. Felicitamos su disposición.' },
  { type: 'COMMENT', title: 'Avance significativo en producción de textos', body: 'Su redacción ha mejorado notablemente. Continúa fortaleciendo coherencia y cohesión.' },
  { type: 'CONDUCT', title: 'Llamada de atención por uso del celular en clase', body: 'Se le retiró el celular siguiendo el protocolo del reglamento interno. Será devuelto al apoderado al finalizar la jornada.' },
  { type: 'CONDUCT', title: 'Compromiso de mejora en presentación personal', body: 'Se conversó con la estudiante sobre el uso correcto del uniforme. Asume el compromiso de mejorar.' },
  { type: 'INCIDENT', title: 'Incidencia en hora de recreo', body: 'Pequeña discusión con un compañero, mediada por tutoría. Ambos estudiantes pidieron disculpas y firmaron acuerdo de respeto.' },
];

/* ============================================================
 *  PAGOS: conceptos diversos, cuotas extraordinarias
 * ============================================================ */
const EXTRA_INVOICE_TYPES: { concept: string; amount: number }[] = [
  { concept: 'Matrícula 2026',                   amount: 350 },
  { concept: 'Cuota de ingreso 2026',            amount: 850 },
  { concept: 'Plan lector — 6 libros',           amount: 180 },
  { concept: 'Material didáctico — Inicial',     amount: 220 },
  { concept: 'Material didáctico — Primaria',    amount: 250 },
  { concept: 'Material didáctico — Secundaria',  amount: 280 },
  { concept: 'Uniforme escolar oficial',         amount: 240 },
  { concept: 'Buzo deportivo',                   amount: 120 },
  { concept: 'Carnet escolar 2026',              amount: 25 },
  { concept: 'Salida pedagógica — Ciudad',       amount: 60 },
  { concept: 'Visita guiada — Museo Santuarios', amount: 35 },
  { concept: 'Taller de Robótica — mensual',     amount: 100 },
  { concept: 'Taller de Inglés — mensual',       amount: 100 },
  { concept: 'Taller de Vóley — mensual',        amount: 80 },
  { concept: 'Examen de admisión 2027',          amount: 80 },
  { concept: 'Cuota APAFA',                      amount: 90 },
];

/* ============================================================
 *  EVENTOS DEL CALENDARIO — agendados como entrevistas / comunicados
 * ============================================================ */
const EVENTS_CALENDAR = [
  { title: 'Aniversario del colegio', date: '2026-09-24', type: 'CIVIL' },
  { title: 'Día del logro — I Etapa', date: '2026-07-25', type: 'ACADEMIC' },
  { title: 'Día del logro — II Etapa', date: '2026-12-12', type: 'ACADEMIC' },
  { title: 'Fiestas Patrias — Acto cívico', date: '2026-07-26', type: 'CIVIL' },
  { title: 'Día del Maestro', date: '2026-07-06', type: 'CIVIL' },
  { title: 'Misa por San Pedro Nolasco', date: '2026-08-06', type: 'PASTORAL' },
  { title: 'Olimpiada deportiva interna', date: '2026-09-12', type: 'DEPORTIVO' },
  { title: 'Festival de talentos', date: '2026-10-17', type: 'CULTURAL' },
  { title: 'Clausura del año escolar', date: '2026-12-19', type: 'ACADEMIC' },
];

/* ============================================================
 *  TICKETS RESPONDIDOS
 * ============================================================ */
const TICKETS = [
  { subject: 'Solicitud de constancia de estudios', body: 'Solicito constancia de matrícula vigente para trámite ante el banco.', category: 'Constancias', status: 'ANSWERED' },
  { subject: 'Solicitud de boleta de notas firmada', body: 'Necesito boleta del I Bimestre con sello para presentar en otra institución.', category: 'Académico', status: 'ANSWERED' },
  { subject: 'Justificación de inasistencia', body: 'Mi hijo faltó tres días por cuadro respiratorio. Adjunto certificado médico.', category: 'Académico', status: 'ANSWERED' },
  { subject: 'Cambio de número de contacto', body: 'Por favor actualicen mi número telefónico en el sistema.', category: 'Administrativo', status: 'CLOSED' },
  { subject: 'Solicitud de fraccionamiento de pensión', body: 'Solicito fraccionar la pensión de junio en dos cuotas por motivos económicos.', category: 'Tesorería', status: 'IN_REVIEW' },
  { subject: 'Reporte de objeto perdido', body: 'Mi hijo perdió su lonchera azul el martes en el patio. Por favor avisar si aparece.', category: 'Otros', status: 'OPEN' },
  { subject: 'Cambio de apoderado autorizado', body: 'Solicito agregar a la abuela como apoderado autorizado para recoger al alumno.', category: 'Administrativo', status: 'ANSWERED' },
  { subject: 'Solicitud de traslado interno', body: 'Quisiera consultar la posibilidad de cambio de sección al inicio del II Bimestre.', category: 'Académico', status: 'IN_REVIEW' },
  { subject: 'Permiso de salida temprana', body: 'Mi hija debe salir 11:30 a.m. el viernes 16 por cita médica.', category: 'Administrativo', status: 'ANSWERED' },
  { subject: 'Reclamo por nota ingresada', body: 'Hay una diferencia entre la nota de la práctica y la registrada en el sistema.', category: 'Académico', status: 'IN_REVIEW' },
  { subject: 'Solicitud de copia de boleta de pago', body: 'Necesito copia de boleta de marzo para reembolso del trabajo.', category: 'Tesorería', status: 'ANSWERED' },
  { subject: 'Inscripción en taller extracurricular', body: 'Quiero inscribir a mi hijo en el taller de Robótica.', category: 'Talleres', status: 'CLOSED' },
];

/* ============================================================
 *  MAIN
 * ============================================================ */

async function main() {
  console.log('🌟 Enriqueciendo datos sobre la base existente…\n');

  /* ----------------------- USUARIOS BASE ----------------------- */
  const director = await prisma.user.findFirst({ where: { role: 'DIRECTION' } });
  const secretaria = await prisma.user.findFirst({ where: { role: 'SECRETARY' } });
  const tesorera = await prisma.user.findFirst({ where: { role: 'TREASURY' } });
  const psico = await prisma.user.findFirst({ where: { role: 'PSYCHOLOGY' } });
  if (!director || !secretaria || !tesorera) throw new Error('Faltan usuarios base. Corre prisma/import-real.ts primero.');

  const teachers = await prisma.teacher.findMany({ include: { user: true } });
  const parents = await prisma.parent.findMany({ select: { id: true, userId: true } });
  const students = await prisma.student.findMany({ select: { id: true } });
  const allUsers = await prisma.user.findMany({ select: { id: true, role: true } });

  /* ----------------------- COMUNICADOS ----------------------- */
  console.log('📣 comunicados realistas…');
  let i = 0;
  for (const c of COMUNICADOS) {
    await prisma.announcement.create({
      data: {
        title: c.title,
        body: c.body,
        authorId: director.id,
        audience: c.audience,
        publishedAt: new Date(Date.now() - i * 1000 * 60 * 60 * 12),
        pinned: !!c.pinned,
      },
    });
    i++;
  }
  console.log(`   +${COMUNICADOS.length} comunicados`);

  /* ----------------------- LIBROS ----------------------- */
  console.log('📖 catálogo de libros del plan lector…');
  const existingTitles = new Set((await prisma.book.findMany({ select: { title: true } })).map((b) => b.title));
  for (const b of LIBROS) {
    if (existingTitles.has(b.title)) continue;
    await prisma.book.create({ data: b });
  }
  console.log(`   +${LIBROS.length - existingTitles.size} libros`);

  /* ----------------------- READING PROGRESS para todos los alumnos ----------------------- */
  console.log('📚 progreso de lectura para todos los alumnos…');
  const allBooks = await prisma.book.findMany();
  const booksPrim = allBooks.filter((b) => b.level === 'PRIMARIA');
  const booksSec = allBooks.filter((b) => b.level === 'SECUNDARIA');
  const booksIni = allBooks.filter((b) => b.level === 'INICIAL');

  const studentsWithLevel = await prisma.student.findMany({
    select: {
      id: true,
      enrollments: {
        select: { section: { select: { grade: { select: { level: true } } } } },
      },
    },
  });

  let readingsAdded = 0;
  for (const st of studentsWithLevel) {
    const lvl = st.enrollments[0]?.section.grade.level;
    if (!lvl) continue;
    const pool = lvl === 'INICIAL' ? booksIni : lvl === 'PRIMARIA' ? booksPrim : booksSec;
    if (!pool.length) continue;
    // 2-3 libros por alumno
    const picks = faker.helpers.arrayElements(pool, faker.number.int({ min: 1, max: 3 }));
    for (const b of picks) {
      const r = await prisma.readingProgress.upsert({
        where: { studentId_bookId: { studentId: st.id, bookId: b.id } },
        create: {
          studentId: st.id, bookId: b.id,
          state: faker.helpers.arrayElement(['ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'EVALUATED']),
          progress: faker.number.int({ min: 0, max: 100 }),
          literalScore: faker.number.float({ min: 12, max: 20, fractionDigits: 1 }),
          inferentialScore: faker.number.float({ min: 11, max: 20, fractionDigits: 1 }),
          criticalScore: faker.number.float({ min: 10, max: 20, fractionDigits: 1 }),
        },
        update: {},
      });
      if (r) readingsAdded++;
    }
  }
  console.log(`   ~${readingsAdded} lecturas asignadas`);

  /* ----------------------- HOJA DE VIDA — 3 entradas por alumno ----------------------- */
  console.log('📋 hoja de vida (3 entradas por alumno)…');
  let lifeAdded = 0;
  for (const st of students) {
    for (let k = 0; k < 3; k++) {
      const tmpl = faker.helpers.arrayElement(LIFE_ENTRIES);
      await prisma.studentLifeEntry.create({
        data: {
          studentId: st.id,
          type: tmpl.type as 'ACHIEVEMENT' | 'INCIDENT' | 'COMMENT' | 'RECOGNITION' | 'CONDUCT',
          title: tmpl.title,
          body: tmpl.body,
          date: faker.date.recent({ days: 60 }),
          authorId: faker.helpers.arrayElement(teachers).user.id,
        },
      });
      lifeAdded++;
    }
  }
  console.log(`   +${lifeAdded} entradas hoja-vida`);

  /* ----------------------- CHATS REALISTAS ----------------------- */
  console.log('💬 conversaciones realistas docente-padre…');
  const existingThreads = await prisma.chatThread.findMany({
    include: { messages: true, participants: true },
  });
  // Reemplazar mensajes de hilos existentes con conversaciones reales
  for (const t of existingThreads) {
    if (t.messages.length > 0 && t.messages.length < 7) {
      await prisma.chatMessage.deleteMany({ where: { threadId: t.id } });
      const tmpl = faker.helpers.arrayElement(CHAT_TEMPLATES);
      const teacherP = t.participants.find((p) => allUsers.find((u) => u.id === p.userId)?.role === 'TEACHER');
      const parentP = t.participants.find((p) => allUsers.find((u) => u.id === p.userId)?.role === 'PARENT');
      if (!teacherP || !parentP) continue;
      const baseTime = Date.now() - faker.number.int({ min: 1, max: 14 }) * 24 * 60 * 60 * 1000;
      for (let m = 0; m < tmpl.length; m++) {
        await prisma.chatMessage.create({
          data: {
            threadId: t.id,
            senderId: tmpl[m].role === 'parent' ? parentP.userId : teacherP.userId,
            body: tmpl[m].text,
            createdAt: new Date(baseTime + m * 1000 * 60 * faker.number.int({ min: 5, max: 90 })),
          },
        });
      }
    }
  }
  // Crear 15 hilos nuevos
  for (let h = 0; h < 15; h++) {
    const t = teachers[h % teachers.length];
    const p = parents[h % parents.length];
    if (!t || !p) break;
    const thread = await prisma.chatThread.create({ data: { isGroup: false } });
    await prisma.chatParticipant.createMany({
      data: [
        { threadId: thread.id, userId: t.user.id },
        { threadId: thread.id, userId: p.userId },
      ],
    });
    const tmpl = faker.helpers.arrayElement(CHAT_TEMPLATES);
    const baseTime = Date.now() - faker.number.int({ min: 1, max: 14 }) * 24 * 60 * 60 * 1000;
    for (let m = 0; m < tmpl.length; m++) {
      await prisma.chatMessage.create({
        data: {
          threadId: thread.id,
          senderId: tmpl[m].role === 'parent' ? p.userId : t.user.id,
          body: tmpl[m].text,
          createdAt: new Date(baseTime + m * 1000 * 60 * faker.number.int({ min: 5, max: 90 })),
        },
      });
    }
  }
  console.log(`   +15 hilos nuevos · todos los hilos con conversación real`);

  /* ----------------------- ENTREVISTAS ----------------------- */
  console.log('📅 entrevistas docente-familia…');
  const interviewTopics = [
    'Rendimiento académico del estudiante',
    'Apoyo familiar en lecturas y tareas',
    'Conducta y disciplina en aula',
    'Acompañamiento socioemocional',
    'Plan de mejora académica',
    'Reconocimiento por buen desempeño',
    'Justificación de inasistencias reiteradas',
    'Coordinación de actividades extracurriculares',
    'Avance del Plan Lector',
    'Proceso de admisión/permanencia',
  ];
  const interviewNotes = [
    'Se acordaron 30 minutos diarios de lectura en casa, con seguimiento semanal del tutor.',
    'La familia se compromete a apoyar con la organización del cuaderno y entrega puntual de tareas.',
    'Se llegó al acuerdo de evitar el uso de pantallas durante días lectivos.',
    'El estudiante se compromete a respetar normas del aula y se asignó un compañero tutor.',
    'Se reconoció el esfuerzo del estudiante. La familia se siente acompañada.',
    'Se sugirió apoyo psicopedagógico en horario alternativo. Familia acepta agendar evaluación.',
    'Se programó nueva reunión en 3 semanas para evaluar avances.',
  ];
  let interviewAdded = 0;
  for (let h = 0; h < 30; h++) {
    const t = teachers[h % teachers.length];
    const p = parents[(h * 3) % parents.length];
    if (!t || !p) break;
    const past = faker.datatype.boolean();
    await prisma.interview.create({
      data: {
        teacherId: t.id,
        parentId: p.id,
        scheduledAt: past ? faker.date.recent({ days: 30 }) : faker.date.soon({ days: 14 }),
        topic: faker.helpers.arrayElement(interviewTopics),
        durationMin: faker.helpers.arrayElement([30, 45, 60]),
        mode: faker.helpers.arrayElement(['IN_PERSON', 'VIRTUAL']),
        status: past
          ? faker.helpers.arrayElement(['COMPLETED', 'COMPLETED', 'CONFIRMED'])
          : faker.helpers.arrayElement(['REQUESTED', 'CONFIRMED']),
        notes: past ? faker.helpers.arrayElement(interviewNotes) : null,
        meetingUrl: 'https://meet.google.com/' + faker.string.alphanumeric(10),
        agreementsJson: past ? JSON.stringify({
          acuerdos: [
            'Reforzar comprensión lectora 30 min diarios',
            'Coordinar reunión de seguimiento en 3 semanas',
          ],
        }) : null,
      },
    });
    interviewAdded++;
  }
  console.log(`   +${interviewAdded} entrevistas`);

  /* ----------------------- TICKETS — mesa de partes con respuestas ----------------------- */
  console.log('📂 tickets de mesa de partes…');
  let ticketCount = await prisma.ticket.count();
  for (const tk of TICKETS) {
    ticketCount++;
    const p = parents[ticketCount % parents.length];
    if (!p) break;
    await prisma.ticket.create({
      data: {
        number: `MP-${String(ticketCount).padStart(5, '0')}`,
        subject: tk.subject, body: tk.body, category: tk.category,
        creatorId: p.userId,
        assigneeId: secretaria.id,
        status: tk.status as 'OPEN' | 'IN_REVIEW' | 'ANSWERED' | 'CLOSED' | 'REJECTED',
        createdAt: faker.date.recent({ days: 30 }),
      },
    });
  }
  console.log(`   +${TICKETS.length} tickets`);

  /* ----------------------- FACTURAS DE OTROS CONCEPTOS ----------------------- */
  console.log('💵 facturas de matrícula, materiales, talleres y uniformes…');
  const allInvoiceCount = await prisma.invoice.count();
  let nextInvNum = allInvoiceCount + 1000;
  let extraInvAdded = 0;
  for (const st of students) {
    // Matrícula 2026 (paga)
    {
      const inv = await prisma.invoice.create({
        data: {
          number: `B001-${String(nextInvNum++).padStart(6, '0')}`,
          studentId: st.id,
          concept: 'Matrícula 2026',
          amount: 350,
          dueDate: new Date('2026-03-01'),
          issuedAt: new Date('2026-02-15'),
          status: 'PAID',
          documentType: 'BOLETA',
          sunatCode: `SUNAT-${faker.string.alphanumeric(10)}`,
        },
      });
      await prisma.payment.create({
        data: {
          invoiceId: inv.id, studentId: st.id,
          amount: 350,
          method: faker.helpers.arrayElement([...PAYMENT_METHODS]),
          reference: faker.string.alphanumeric(12),
          paidAt: new Date('2026-02-20'),
        },
      });
      extraInvAdded++;
    }
    // 1-3 conceptos extras aleatorios
    const extras = faker.helpers.arrayElements(EXTRA_INVOICE_TYPES, faker.number.int({ min: 1, max: 3 }));
    for (const e of extras) {
      const isPaid = faker.datatype.boolean({ probability: 0.7 });
      const issuedAt = faker.date.recent({ days: 60 });
      const dueDate = new Date(issuedAt.getTime() + 14 * 24 * 60 * 60 * 1000);
      const status: 'PAID' | 'PENDING' | 'OVERDUE' = isPaid ? 'PAID' : (dueDate < new Date() ? 'OVERDUE' : 'PENDING');
      const inv = await prisma.invoice.create({
        data: {
          number: `B001-${String(nextInvNum++).padStart(6, '0')}`,
          studentId: st.id, concept: e.concept, amount: e.amount,
          dueDate, issuedAt, status, documentType: 'BOLETA',
          sunatCode: status === 'PAID' ? `SUNAT-${faker.string.alphanumeric(10)}` : null,
        },
      });
      if (isPaid) {
        await prisma.payment.create({
          data: {
            invoiceId: inv.id, studentId: st.id, amount: e.amount,
            method: faker.helpers.arrayElement([...PAYMENT_METHODS]),
            reference: faker.string.alphanumeric(12),
            paidAt: new Date(issuedAt.getTime() + faker.number.int({ min: 1, max: 14 }) * 24 * 60 * 60 * 1000),
          },
        });
      }
      extraInvAdded++;
    }
  }
  console.log(`   +${extraInvAdded} facturas extras (matrículas, materiales, talleres, uniformes)`);

  /* ----------------------- PAGOS PARCIALES ----------------------- */
  console.log('💸 algunos pagos parciales (cuotas)…');
  const pendingInvoices = await prisma.invoice.findMany({
    where: { status: { in: ['PENDING', 'OVERDUE'] } },
    take: 60,
  });
  let partialAdded = 0;
  for (const inv of faker.helpers.arrayElements(pendingInvoices, 30)) {
    const partialAmount = Math.round(inv.amount * faker.number.float({ min: 0.3, max: 0.7 }));
    await prisma.payment.create({
      data: {
        invoiceId: inv.id, studentId: inv.studentId,
        amount: partialAmount,
        method: faker.helpers.arrayElement([...PAYMENT_METHODS]),
        reference: faker.string.alphanumeric(12),
        paidAt: faker.date.recent({ days: 14 }),
      },
    });
    partialAdded++;
  }
  console.log(`   +${partialAdded} pagos parciales`);

  /* ----------------------- MÁS PROSPECTOS ADMISIÓN ----------------------- */
  console.log('🎓 más prospectos de admisión…');
  const sources = ['Web', 'Referido', 'Feria educativa', 'Redes sociales', 'Visita guiada', 'Recomendación familiar'];
  for (let p = 0; p < 35; p++) {
    await prisma.prospect.create({
      data: {
        childName: faker.person.fullName(),
        childBirthDate: faker.date.between({ from: '2010-01-01', to: '2022-12-31' }),
        desiredGrade: faker.helpers.arrayElement([
          '3 años Inicial', '4 años Inicial', '5 años Inicial',
          '1° Primaria', '2° Primaria', '3° Primaria', '4° Primaria', '5° Primaria', '6° Primaria',
          '1° Secundaria', '2° Secundaria', '3° Secundaria', '4° Secundaria', '5° Secundaria',
        ]),
        contactPhone: '9' + faker.string.numeric(8),
        contactEmail: faker.internet.email().toLowerCase(),
        source: faker.helpers.arrayElement(sources),
        stage: faker.helpers.arrayElement(['LEAD', 'CONTACTED', 'INTERVIEW', 'EVALUATION', 'PRE_ENROLLMENT', 'ENROLLED']),
        notes: faker.helpers.arrayElement([
          'Hermana mayor egresó del colegio en 2024.',
          'Familia interesada en valores católicos.',
          'Llamó a admisión para preguntar por descuento de hermanos.',
          'Visitó las instalaciones el sábado pasado.',
          'Solicita información de la metodología de Inicial.',
          'Padres separados — registrar ambos como contactos.',
          'Estudiante con buen perfil académico.',
        ]),
        createdAt: faker.date.recent({ days: 60 }),
      },
    });
  }
  console.log(`   +35 prospectos`);

  /* ----------------------- DOCUMENTOS INSTITUCIONALES ----------------------- */
  console.log('📄 más documentos institucionales…');
  const moreDocs = [
    'PAT 2026 — Plan Anual de Trabajo', 'PEI 2025-2030 — Proyecto Educativo Institucional',
    'PCI 2026 — Proyecto Curricular Institucional', 'Reglamento Interno 2026',
    'Reglamento de Evaluación 2026', 'Manual de Convivencia Escolar 2026',
    'Plan de Tutoría y Orientación Educativa', 'Plan Lector Institucional 2026',
    'Plan de Gestión de Riesgo de Desastres', 'Plan de Salud Escolar',
    'Plan Pastoral 2026', 'Calendario Cívico Escolar',
    'Cronograma General de Actividades 2026', 'Resolución de aprobación de matrícula',
    'Acta de inicio del año escolar', 'Cuadro de horas 2026',
  ];
  for (const t of moreDocs) {
    await prisma.document.create({
      data: {
        ownerId: secretaria.id,
        title: t,
        category: faker.helpers.arrayElement(['Académico', 'Administrativo', 'Tutoría', 'Reglamentos', 'Pastoral', 'Salud']),
        version: 1,
        signedAt: faker.datatype.boolean() ? faker.date.recent({ days: 90 }) : null,
        signedById: director.id,
      },
    });
  }
  console.log(`   +${moreDocs.length} documentos`);

  /* ----------------------- PSICOLOGÍA Y SALUD ----------------------- */
  console.log('🧠 más casos psicología y atenciones de salud…');
  const psychTitles = [
    'Adaptación al aula nueva', 'Manejo emocional', 'Ansiedad ante evaluaciones',
    'Conducta disruptiva', 'Apoyo familiar (separación)', 'Dificultades en relaciones interpersonales',
    'Bajo rendimiento académico', 'Autoestima y motivación', 'Acompañamiento por duelo',
  ];
  const psychDescs = [
    'Estudiante refiere sentirse incómodo con cambio de sección. Se acompañará durante 4 sesiones.',
    'Se observan signos de ansiedad antes de evaluaciones. Plan: técnicas de respiración y manejo del estrés.',
    'Conductas reiteradas de interrupción en aula. Coordinación con tutor y apoderado para plan formativo.',
    'Familia atravesando proceso de separación. Estudiante recibe acompañamiento individual semanal.',
    'Bajo rendimiento ligado a falta de motivación. Se trabaja proyecto de vida y metas a corto plazo.',
  ];
  let psychAdded = 0;
  for (const st of faker.helpers.arrayElements(students, 35)) {
    await prisma.psychologyCase.create({
      data: {
        studentId: st.id,
        title: faker.helpers.arrayElement(psychTitles),
        description: faker.helpers.arrayElement(psychDescs),
        status: faker.helpers.arrayElement(['OPEN', 'IN_FOLLOWUP', 'CLOSED']),
        openedAt: faker.date.recent({ days: 60 }),
        notesJson: JSON.stringify([
          { date: faker.date.recent({ days: 30 }), note: 'Sesión inicial — entrevista con estudiante.' },
          { date: faker.date.recent({ days: 14 }), note: 'Seguimiento. Mejoría observada.' },
        ]),
      },
    });
    psychAdded++;
  }
  for (const st of faker.helpers.arrayElements(students, 50)) {
    await prisma.psychologicalTest.create({
      data: {
        studentId: st.id,
        testType: faker.helpers.arrayElement(['Estilos de aprendizaje', 'Autoestima — Coopersmith', 'Inteligencias múltiples', 'Intereses vocacionales — CASM-83']),
        resultJson: JSON.stringify({
          score: faker.number.int({ min: 60, max: 95 }),
          profile: faker.helpers.arrayElement(['Visual', 'Auditivo', 'Kinestésico', 'Lógico-matemático', 'Lingüístico']),
        }),
        takenAt: faker.date.recent({ days: 90 }),
      },
    });
  }
  const healthSymptoms = [
    'Dolor de cabeza leve', 'Fiebre 38°C', 'Dolor estomacal', 'Mareo en formación',
    'Caída en patio — abrasión en codo', 'Tos seca', 'Resfrío común',
    'Dolor de muela', 'Tobillo inflamado en Ed. Física', 'Picadura de insecto', 'Sangrado nasal',
  ];
  const treatments = [
    'Reposo en tópico, agua e ibuprofeno (con autorización del apoderado)',
    'Medición de temperatura, paños fríos. Se llamó al apoderado para retiro.',
    'Reposo. Se coordinó retiro con apoderado.',
    'Curación con suero fisiológico y gasa estéril. Sin necesidad de derivación.',
    'Limpieza con alcohol y curita. Se notificó al apoderado.',
    'Hielo sobre área afectada por 15 minutos. Sin signos de fractura.',
  ];
  let healthAdded = 0;
  for (const st of faker.helpers.arrayElements(students, 80)) {
    await prisma.healthRecord.create({
      data: {
        studentId: st.id,
        date: faker.date.recent({ days: 60 }),
        symptoms: faker.helpers.arrayElement(healthSymptoms),
        treatment: faker.helpers.arrayElement(treatments),
        attendedBy: 'Tópico escolar — Lic. Enfermería',
      },
    });
    healthAdded++;
  }
  console.log(`   +${psychAdded} casos psicología · +${healthAdded} atenciones salud`);

  /* ----------------------- VACUNAS COMPLETAS ----------------------- */
  console.log('💉 cartilla de vacunación…');
  const vaccines = [
    { name: 'BCG', dose: 'Única', notes: 'Aplicada al nacer' },
    { name: 'Hepatitis B', dose: 'Refuerzo', notes: 'Sin reacciones' },
    { name: 'DPT', dose: '4ta', notes: 'Sin reacciones' },
    { name: 'Antipolio (IPV)', dose: 'Refuerzo', notes: 'Sin reacciones' },
    { name: 'Triple Viral (SPR)', dose: 'Refuerzo', notes: 'Sin reacciones' },
    { name: 'Influenza estacional', dose: 'Anual 2026', notes: 'Aplicada en jornada escolar' },
    { name: 'COVID-19', dose: '3ra', notes: 'Pediátrica' },
    { name: 'HPV', dose: '1ra', notes: 'Aplicada en jornada escolar (mujeres ≥9 años)' },
  ];
  let vaccAdded = 0;
  for (const st of students) {
    const picks = faker.helpers.arrayElements(vaccines, faker.number.int({ min: 4, max: 6 }));
    for (const v of picks) {
      await prisma.vaccination.create({
        data: {
          studentId: st.id, vaccineName: v.name, dose: v.dose,
          appliedAt: faker.date.past({ years: 3 }),
          notes: v.notes,
        },
      }).catch(() => {});
      vaccAdded++;
    }
  }
  console.log(`   +${vaccAdded} registros de vacunación`);

  /* ----------------------- PORTERÍA ----------------------- */
  console.log('🚪 más logs de portería…');
  let gateAdded = 0;
  for (let g = 0; g < 100; g++) {
    const u = faker.helpers.arrayElement(allUsers);
    await prisma.gateLog.create({
      data: {
        userId: u.id,
        direction: g % 2 === 0 ? 'IN' : 'OUT',
        occurredAt: faker.date.recent({ days: 14 }),
        reason: faker.helpers.arrayElement([
          null, 'Recoge a su hijo', 'Reunión con docente',
          'Trámite en secretaría', 'Pago de pensión', 'Visita programada',
          'Salida temprana — cita médica', 'Visita pastoral',
        ]),
      },
    });
    gateAdded++;
  }
  console.log(`   +${gateAdded} entradas/salidas`);

  /* ----------------------- NOTIFICACIONES CON CONTENIDO ESPECÍFICO ----------------------- */
  console.log('🔔 notificaciones con contenido específico…');
  const NOTIFS = [
    { type: 'PAYMENT', title: 'Pago registrado', body: 'Su pago de S/. 480.00 por pensión de mayo fue registrado correctamente.' },
    { type: 'PAYMENT', title: 'Recordatorio de pago', body: 'La pensión de mayo vence el 20 de mayo. Monto: S/. 480.00.' },
    { type: 'GRADE', title: 'Nueva nota registrada', body: 'Se registró una nueva nota en el curso de Comunicación.' },
    { type: 'ATTENDANCE', title: 'Inasistencia registrada', body: 'Su hijo registró una inasistencia el día de hoy. Por favor envíe la justificación.' },
    { type: 'ASSIGNMENT', title: 'Nueva tarea asignada', body: 'Tiene una nueva tarea de Matemática con fecha de entrega esta semana.' },
    { type: 'ANNOUNCEMENT', title: 'Nuevo comunicado', body: 'Se publicó un comunicado importante. Revise la bandeja de comunicados.' },
    { type: 'INTERVIEW', title: 'Entrevista confirmada', body: 'Su entrevista con el tutor está confirmada para mañana a las 4:00 p.m.' },
  ];
  let notifAdded = 0;
  for (const u of allUsers.slice(0, 300)) {
    const picks = faker.helpers.arrayElements(NOTIFS, faker.number.int({ min: 1, max: 3 }));
    for (const n of picks) {
      await prisma.notification.create({
        data: {
          userId: u.id, type: n.type,
          title: n.title, body: n.body,
          createdAt: faker.date.recent({ days: 14 }),
          readAt: Math.random() > 0.55 ? faker.date.recent({ days: 5 }) : null,
        },
      });
      notifAdded++;
    }
  }
  console.log(`   +${notifAdded} notificaciones`);

  /* ----------------------- EVENTOS COMO COMUNICADOS PINNED ----------------------- */
  console.log('🗓️ eventos del calendario escolar…');
  for (const ev of EVENTS_CALENDAR) {
    await prisma.announcement.create({
      data: {
        title: `Calendario: ${ev.title}`,
        body:
`Recordatorio del calendario escolar institucional:

📅 ${ev.title}
📆 Fecha: ${new Date(ev.date).toLocaleDateString('es-PE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
🏷️ Tipo: ${ev.type}

Este evento forma parte del cronograma oficial 2026 aprobado por la Dirección. Más detalles serán comunicados oportunamente.

Coordinación General`,
        authorId: director.id,
        audience: 'ALL',
        publishedAt: new Date(),
        expiresAt: new Date(ev.date),
      },
    });
  }
  console.log(`   +${EVENTS_CALENDAR.length} eventos`);

  /* ----------------------- RESUMEN FINAL ----------------------- */
  console.log('\n📊 resumen final:');
  const finalCounts = {
    students: await prisma.student.count(),
    parents: await prisma.parent.count(),
    teachers: await prisma.teacher.count(),
    invoices: await prisma.invoice.count(),
    payments: await prisma.payment.count(),
    announcements: await prisma.announcement.count(),
    chats: await prisma.chatThread.count(),
    chatMessages: await prisma.chatMessage.count(),
    interviews: await prisma.interview.count(),
    books: await prisma.book.count(),
    readings: await prisma.readingProgress.count(),
    psychCases: await prisma.psychologyCase.count(),
    psychTests: await prisma.psychologicalTest.count(),
    healthRecords: await prisma.healthRecord.count(),
    vaccinations: await prisma.vaccination.count(),
    workshops: await prisma.workshop.count(),
    documents: await prisma.document.count(),
    tickets: await prisma.ticket.count(),
    gateLogs: await prisma.gateLog.count(),
    lifeEntries: await prisma.studentLifeEntry.count(),
    plans: await prisma.curriculumPlan.count(),
    notifications: await prisma.notification.count(),
    prospects: await prisma.prospect.count(),
    fixedAssets: await prisma.fixedAsset.count(),
  };
  console.table(finalCounts);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
