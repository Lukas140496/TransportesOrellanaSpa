
export interface GastoConductor {
  id: number;
  conductorId: number;
  nombreConductor: string;
  fecha: string;
  tipoGasto: string;
  descripcion: string;
  monto: number;
  observaciones: string | null;
}
