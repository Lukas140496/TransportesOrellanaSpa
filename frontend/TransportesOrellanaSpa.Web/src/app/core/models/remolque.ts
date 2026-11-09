import { CamionResumen } from './camion-resumen';

export interface EstadoDocumentoRemolque {
  estado: 'AlDia' | 'PorVencer' | 'Vencido' | 'SinRegistro';
  diasRestantes: number | null;
}

export interface Remolque {
  id: number;
  patente: string;
  marca: string;
  modelo: string;
  ano: number;
  tipo: string;
  capacidadToneladas: number;
  activa: boolean;
  fechaPermisoCirculacion: string | null;
  fechaSeguro: string | null;
  fechaRevisionTecnica: string | null;
  permisoCirculacion: EstadoDocumentoRemolque;
  seguro: EstadoDocumentoRemolque;
  revisionTecnica: EstadoDocumentoRemolque;
  camionHabitualId: number | null;
  camionHabitual: CamionResumen | null;
}