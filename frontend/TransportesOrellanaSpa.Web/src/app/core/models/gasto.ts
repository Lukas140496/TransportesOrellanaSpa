export interface Gasto {
  id: number;
  camionId: number;
  patenteCamion: string;
  viajeId: number | null;
  numeroGuiaDespacho: string | null;
  fecha: string;
  tipoGasto: string;
  descripcion: string;
  monto: number;
  observaciones: string | null;
}