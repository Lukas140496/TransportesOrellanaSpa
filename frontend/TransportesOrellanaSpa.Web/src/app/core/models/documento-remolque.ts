
export type TipoDocumentoRemolque =
  | 'PermisoCirculacion'
  | 'Seguro'
  | 'RevisionTecnica';

export interface DocumentoRemolque {
  id: number;
  remolqueId: number;
  tipoDocumento: TipoDocumentoRemolque;
  nombreArchivo: string;
  contentType: string;
  fechaCarga: string;
}
