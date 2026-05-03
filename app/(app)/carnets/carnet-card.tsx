import { initials } from '@/lib/utils';

export type CarnetData = {
  id: string;
  firstName: string;
  lastName: string;
  studentCode: string;
  level: string;       // ej: Primaria
  grade: string;       // ej: 3°
  section: string;     // ej: A
  birthDate?: string;  // ISO
  bloodType?: string | null;
  emergencyContact?: string | null;
  photoUrl?: string | null;
};

const YEAR = new Date().getFullYear();

/**
 * Carnet visual estilo tarjeta institucional. Diseño orientado a impresión:
 * - Aspect 1.586 (ID-1, ISO/IEC 7810) — mismo de tarjetas bancarias
 * - Header azul institucional + naranja
 * - Foto a la izquierda, datos a la derecha
 */
export function CarnetCard({ s }: { s: CarnetData }) {
  return (
    <div className="carnet print:break-inside-avoid">
      <div className="carnet-inner">
        <div className="carnet-header">
          <div className="carnet-school">
            <div className="carnet-school-name">I.E.P. EL MERCEDARIO</div>
            <div className="carnet-school-sub">RVDO. P.E.A.B. · Cayma · Arequipa</div>
          </div>
          <div className="carnet-year">{YEAR}</div>
        </div>
        <div className="carnet-body">
          <div className="carnet-photo">
            {s.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.photoUrl} alt="" />
            ) : (
              <span>{initials(s.firstName, s.lastName)}</span>
            )}
          </div>
          <div className="carnet-info">
            <div className="carnet-name">{s.firstName} {s.lastName}</div>
            <div className="carnet-row"><span>Grado</span><strong>{s.level} · {s.grade} "{s.section}"</strong></div>
            <div className="carnet-row"><span>Código</span><strong>{s.studentCode}</strong></div>
            {s.bloodType && <div className="carnet-row"><span>Grupo sanguíneo</span><strong>{s.bloodType}</strong></div>}
            {s.emergencyContact && <div className="carnet-row"><span>Emergencia</span><strong>{s.emergencyContact}</strong></div>}
          </div>
        </div>
        <div className="carnet-footer">
          <span>Vence: Diciembre {YEAR}</span>
          <span className="carnet-validation">Válido únicamente con firma del director</span>
        </div>
      </div>
    </div>
  );
}
