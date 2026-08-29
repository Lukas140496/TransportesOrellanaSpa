import { ConductorResumen } from './conductor-resumen';
import { RemolqueResumen } from './remolque-resumen';

export interface Camion {
  id: number;
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
  fechaRevisionTecnica: string;
  fechaPermisoCirculacion: string;
  fechaSeguroObligatorio: string;
  revisionAlDia: boolean;
  permisoAlDia: boolean;
  seguroAlDia: boolean;
  conductoresHabituales: ConductorResumen[];
  remolques: RemolqueResumen[];
}