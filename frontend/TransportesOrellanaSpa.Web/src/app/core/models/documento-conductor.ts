
export type TipoDocumentoConductor =
  | 'LicenciaConducir'
  | 'CedulaIdentidad'
  | 'HojaVidaConductor'
  | 'ContratoTrabajo'
  | 'LiquidacionSueldo'
  | 'Finiquito';

export interface DocumentoConductor {
  id: number;
  conductorId: number;
  tipoDocumento: TipoDocumentoConductor;
  nombreArchivo: string;
  contentType: string;
  periodo: string | null;
  fechaCarga: string;
}
