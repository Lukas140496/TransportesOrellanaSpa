export interface CrearGasto {
  camionId: number;
  fecha: string;
  tipoGasto: string;
  descripcion: string;
  monto: number;
  observaciones?: string | null;
}