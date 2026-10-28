
export interface DocumentoCamion {
  id: number;
  camionId: number;
  tipoDocumento: string;
  nombreArchivo: string;
  contentType: string;
  fechaCarga: string;
}

export type TipoDocumentoCamion =
  | 'PermisoCirculacion'
  | 'SeguroObligatorio'
  | 'RevisionTecnica'
  | 'RevisionGases';
