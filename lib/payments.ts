export type PaymentMethod =
  | 'CAJA_AREQUIPA'
  | 'BCP'
  | 'INTERBANK'
  | 'SCOTIABANK'
  | 'BBVA'
  | 'YAPE'
  | 'PLIN'
  | 'TARJETA'
  | 'EFECTIVO_TESORERIA';

export type MethodBrand = {
  id: PaymentMethod;
  label: string;
  hint: string;
  /** Color de fondo del logo */
  bg: string;
  /** Color de texto / acento */
  fg: string;
  /** Iniciales / símbolo a mostrar */
  mark: string;
};

export const PAYMENT_METHODS: MethodBrand[] = [
  { id: 'CAJA_AREQUIPA',  label: 'Caja Arequipa',         hint: 'Pago en agencia, agente o app Caja Móvil',  bg: '#E12027', fg: '#fff', mark: 'CA' },
  { id: 'BCP',            label: 'BCP',                   hint: 'Banca Móvil, web o agente',                  bg: '#002A5C', fg: '#FF7A00', mark: 'BCP' },
  { id: 'INTERBANK',      label: 'Interbank',             hint: 'App o agente Interbank',                     bg: '#00A859', fg: '#fff', mark: 'IBK' },
  { id: 'SCOTIABANK',     label: 'Scotiabank',            hint: 'App o agente Scotiabank',                    bg: '#EE3424', fg: '#fff', mark: 'SB' },
  { id: 'BBVA',           label: 'BBVA',                  hint: 'App o agente BBVA',                          bg: '#004481', fg: '#48AEE5', mark: 'BBVA' },
  { id: 'YAPE',           label: 'Yape',                  hint: 'Transferencia inmediata con celular',        bg: '#742282', fg: '#fff', mark: 'Y' },
  { id: 'PLIN',           label: 'Plin',                  hint: 'Transferencia inmediata con celular',        bg: '#00B0AC', fg: '#fff', mark: 'P' },
  { id: 'TARJETA',        label: 'Tarjeta crédito/débito', hint: 'Visa, Mastercard, Amex',                   bg: '#1E293B', fg: '#fff', mark: '💳' },
  { id: 'EFECTIVO_TESORERIA', label: 'Efectivo en tesorería', hint: 'Pago presencial en el colegio',          bg: '#1B8A4A', fg: '#fff', mark: 'S/' },
];

export function getMethodBrand(id: PaymentMethod): MethodBrand {
  return PAYMENT_METHODS.find((m) => m.id === id) ?? PAYMENT_METHODS[0];
}

export const SCHOOL_INFO = {
  shortName: 'I.E.P. El Mercedario',
  name: 'I.E.P. "El Mercedario" RVDO. P.E.A.B.',
  fullName: 'Institución Educativa Particular "El Mercedario" Reverendo Padre Eleuterio Alarcón Bejarano',
  tagline: 'Educación con Fe y Valores',
  ruc: '20454545454',
  address: 'Cayma — Arequipa, Perú',
  district: 'Cayma',
  city: 'Arequipa',
  phone: '054 - 234 567',
  emails: {
    info: 'info@elmercedariocayma.com',
    admin: 'admin@elmercedariocayma.com',
    admisiones: 'admisiones@elmercedariocayma.com',
    soporte: 'soporte@elmercedariocayma.com',
  },
  domain: 'elmercedariocayma.com',
  cajaArequipaCode: '01254',
  bcpCode: '78521',
  interbankCode: '63214',
};
