
import { ConductorResumen } from './conductor-resumen';
import { RemolqueResumen } from './remolque-resumen';

export interface EstadoDocumento {
  estado: 'SinRegistro' | 'AlDia' | 'PorVencer' | 'Vencido';
  diasRestantes: number | null;
}

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

  fechaRevisionTecnica: string | null;
  fechaPermisoCirculacion: string | null;
  fechaSeguroObligatorio: string | null;

  revisionTecnica: EstadoDocumento;
  certificadoGases: EstadoDocumento;
  permisoCirculacion: EstadoDocumento;
  seguroObligatorio: EstadoDocumento;

  activo: boolean;

  conductoresHabituales: ConductorResumen[];
  remolques: RemolqueResumen[];
}
