
export interface CrearGastoConductor {
  conductorId: number;
  fecha: string;
  tipoGasto: string;
  descripcion: string;
  monto: number;
  observaciones: string | null;
}
