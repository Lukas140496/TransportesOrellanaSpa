export interface CrearGastoRemolque {
  remolqueId: number;
  fecha: string;
  tipoGasto: string;
  descripcion: string;
  monto: number;
  observaciones?: string | null;
}