
export interface CrearCamion {
  patente: string;
  marca: string;
  modelo: string;
  ano: number;
  tipo: string;
  color: string;
  capacidad: string;
  motor: string;
  caballos: string;
  cilindrada: string;
  transmision: string;

  fechaRevisionTecnica: string | null;
  fechaPermisoCirculacion: string | null;
  fechaSeguroObligatorio: string | null;
}
