export interface GastoRemolque {
  id: number;
  remolqueId: number;
  patenteRemolque: string;
  fecha: string;
  tipoGasto: string;
  descripcion: string;
  monto: number;
  observaciones: string | null;
}