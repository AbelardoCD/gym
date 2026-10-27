import { Chip } from '@mui/material';
import type { MembershipStatus } from '../api/types';

/** Moneda en la que cobra el gimnasio. */
const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

export const fmtMoney = (n: number) => money.format(n);

/** Fecha sin hora (yyyy-mm-dd) en formato corto; se fija al mediodía para que la zona horaria no la mueva de día. */
export const fmtDay = (iso: string) => new Date(`${iso}T12:00`).toLocaleDateString([], { dateStyle: 'medium' });

/** Fecha local en formato yyyy-mm-dd. */
export const isoDay = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

/** Etiqueta con la vigencia de la membresía de un socio. */
export function MembershipChip({ status }: { status?: MembershipStatus }) {
  if (!status || status.state === 'SIN_PAGOS') return <Chip size="small" variant="outlined" label="Sin pagos" />;
  const until = fmtDay(status.paidUntil!);
  const days = status.daysLeft ?? 0;
  switch (status.state) {
    case 'VIGENTE':
      return <Chip size="small" variant="outlined" color="success" label={`Vigente al ${until}`} />;
    case 'POR_VENCER':
      return <Chip size="small" variant="outlined" color="warning" label={days === 0 ? 'Vence hoy' : `Vence en ${days} ${days === 1 ? 'día' : 'días'}`} />;
    default:
      return <Chip size="small" variant="outlined" color="error" label={`Vencida desde ${until}`} />;
  }
}
