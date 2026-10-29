
export type TipoDocumentoViaje =
  | 'GuiaDespacho'
  | 'RendicionGuias';

export interface DocumentoViaje {
  id: number;
  viajeId: number;
  tipoDocumento: TipoDocumentoViaje;
  nombreArchivo: string;
  contentType: string;
  fechaCarga: string;
}
