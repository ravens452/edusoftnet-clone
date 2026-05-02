import type { Role } from './generated/prisma/enums';

export type IconName =
  | 'dashboard' | 'grade' | 'attendance' | 'book' | 'message' | 'megaphone'
  | 'users' | 'wallet' | 'library' | 'heart' | 'brain' | 'clipboard'
  | 'folder' | 'drive' | 'sparkles' | 'shield' | 'file' | 'calendar'
  | 'settings' | 'userPlus' | 'school' | 'stethoscope' | 'receipt'
  | 'bell' | 'list' | 'building';

export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

const ITEM = {
  dashboard:    { href: '/dashboard', label: 'Inicio', icon: 'dashboard' as const },
  notas:        { href: '/notas', label: 'Calificaciones', icon: 'grade' as const },
  asistencia:   { href: '/asistencia', label: 'Asistencia', icon: 'attendance' as const },
  eclass:       { href: '/eclass', label: 'eclass', icon: 'book' as const },
  echat:        { href: '/echat', label: 'echat', icon: 'message' as const },
  comunicados:  { href: '/comunicados', label: 'Comunicados', icon: 'megaphone' as const },
  efamily:      { href: '/efamily', label: 'efamily — Admisión', icon: 'userPlus' as const },
  tesoreria:    { href: '/tesoreria', label: 'Tesorería', icon: 'wallet' as const },
  elibrary:     { href: '/elibrary', label: 'elibrary', icon: 'library' as const },
  ecare:        { href: '/ecare', label: 'ecare — Psicología', icon: 'brain' as const },
  emonitor:     { href: '/emonitor', label: 'emonitor — Currículo', icon: 'clipboard' as const },
  edocuments:   { href: '/edocuments', label: 'edocuments', icon: 'file' as const },
  edrive:       { href: '/edrive', label: 'edrive', icon: 'drive' as const },
  talleres:     { href: '/talleres', label: 'Talleres', icon: 'sparkles' as const },
  porteria:     { href: '/porteria', label: 'Portería', icon: 'shield' as const },
  mesaPartes:   { href: '/mesa-partes', label: 'Mesa de partes', icon: 'folder' as const },
  salud:        { href: '/salud', label: 'Salud', icon: 'heart' as const },
  entrevistas:  { href: '/entrevistas', label: 'Entrevistas', icon: 'calendar' as const },
  hijos:        { href: '/hijos', label: 'Mis hijos', icon: 'users' as const },
  pagos:        { href: '/pagos', label: 'Mis pagos', icon: 'receipt' as const },
  notifs:       { href: '/notificaciones', label: 'Notificaciones', icon: 'bell' as const },
  tareas:       { href: '/tareas', label: 'Mis tareas', icon: 'list' as const },
  hojaVida:     { href: '/hoja-vida', label: 'Hoja de vida', icon: 'file' as const },
  horario:      { href: '/horario', label: 'Horario', icon: 'calendar' as const },
  matriculas:   { href: '/matriculas', label: 'Matrículas', icon: 'school' as const },
  usuarios:     { href: '/admin/usuarios', label: 'Usuarios', icon: 'users' as const },
  config:       { href: '/admin/configuracion', label: 'Configuración', icon: 'settings' as const },
  siagie:       { href: '/siagie', label: 'SIAGIE / UGEL', icon: 'building' as const },
};

export function navFor(role: Role): NavGroup[] {
  switch (role) {
    case 'STUDENT':
      return [
        { title: 'General', items: [ITEM.dashboard, ITEM.horario, ITEM.notifs] },
        { title: 'Académico', items: [ITEM.notas, ITEM.asistencia, ITEM.eclass, ITEM.tareas, ITEM.elibrary, ITEM.talleres] },
        { title: 'Comunicación', items: [ITEM.echat, ITEM.comunicados] },
        { title: 'Yo', items: [ITEM.hojaVida, ITEM.salud] },
      ];
    case 'PARENT':
      return [
        { title: 'General', items: [ITEM.dashboard, ITEM.notifs] },
        { title: 'Mis hijos', items: [ITEM.hijos, ITEM.notas, ITEM.asistencia, ITEM.tareas] },
        { title: 'Pagos', items: [ITEM.pagos] },
        { title: 'Comunicación', items: [ITEM.echat, ITEM.comunicados, ITEM.entrevistas, ITEM.mesaPartes] },
      ];
    case 'TEACHER':
      return [
        { title: 'General', items: [ITEM.dashboard, ITEM.horario, ITEM.notifs] },
        { title: 'Mi aula', items: [ITEM.eclass, ITEM.notas, ITEM.asistencia, ITEM.emonitor] },
        { title: 'Estudiantes', items: [ITEM.hojaVida, ITEM.entrevistas] },
        { title: 'Comunicación', items: [ITEM.echat, ITEM.comunicados] },
        { title: 'Recursos', items: [ITEM.edrive, ITEM.elibrary, ITEM.talleres] },
      ];
    case 'DIRECTION':
      return [
        { title: 'General', items: [ITEM.dashboard] },
        { title: 'Académico', items: [ITEM.notas, ITEM.asistencia, ITEM.emonitor, ITEM.eclass] },
        { title: 'Comunidad', items: [ITEM.comunicados, ITEM.entrevistas, ITEM.echat] },
        { title: 'Admisión', items: [ITEM.efamily, ITEM.matriculas] },
        { title: 'Operaciones', items: [ITEM.mesaPartes, ITEM.porteria, ITEM.tesoreria] },
        { title: 'Recursos', items: [ITEM.edocuments, ITEM.edrive, ITEM.elibrary, ITEM.talleres, ITEM.salud, ITEM.ecare] },
        { title: 'Reportes oficiales', items: [ITEM.siagie] },
      ];
    case 'PSYCHOLOGY':
      return [
        { title: 'General', items: [ITEM.dashboard, ITEM.notifs] },
        { title: 'Casos', items: [ITEM.ecare, ITEM.entrevistas, ITEM.hojaVida] },
        { title: 'Comunicación', items: [ITEM.echat, ITEM.comunicados] },
      ];
    case 'TREASURY':
      return [
        { title: 'General', items: [ITEM.dashboard] },
        { title: 'Finanzas', items: [ITEM.tesoreria, ITEM.matriculas] },
        { title: 'Comunicación', items: [ITEM.echat, ITEM.comunicados] },
      ];
    case 'GATEKEEPER':
      return [
        { title: 'General', items: [ITEM.dashboard] },
        { title: 'Acceso', items: [ITEM.porteria] },
      ];
    case 'SECRETARY':
      return [
        { title: 'General', items: [ITEM.dashboard, ITEM.notifs] },
        { title: 'Atención', items: [ITEM.mesaPartes, ITEM.efamily, ITEM.matriculas, ITEM.entrevistas] },
        { title: 'Comunicación', items: [ITEM.echat, ITEM.comunicados] },
        { title: 'Documentos', items: [ITEM.edocuments, ITEM.edrive] },
        { title: 'Reportes oficiales', items: [ITEM.siagie] },
      ];
    case 'ADMIN':
      return [
        { title: 'General', items: [ITEM.dashboard] },
        { title: 'Académico', items: [ITEM.notas, ITEM.asistencia, ITEM.eclass, ITEM.emonitor, ITEM.elibrary, ITEM.talleres] },
        { title: 'Comunidad', items: [ITEM.comunicados, ITEM.echat, ITEM.entrevistas, ITEM.efamily, ITEM.matriculas] },
        { title: 'Operaciones', items: [ITEM.tesoreria, ITEM.mesaPartes, ITEM.porteria, ITEM.salud, ITEM.ecare] },
        { title: 'Recursos', items: [ITEM.edocuments, ITEM.edrive] },
        { title: 'Reportes oficiales', items: [ITEM.siagie] },
        { title: 'Sistema', items: [ITEM.usuarios, ITEM.config] },
      ];
    default:
      return [{ title: 'General', items: [ITEM.dashboard] }];
  }
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrador',
  DIRECTION: 'Dirección',
  TEACHER: 'Docente',
  PARENT: 'Padre / Apoderado',
  STUDENT: 'Estudiante',
  PSYCHOLOGY: 'Psicología',
  TREASURY: 'Tesorería',
  GATEKEEPER: 'Portería',
  SECRETARY: 'Secretaría',
};
