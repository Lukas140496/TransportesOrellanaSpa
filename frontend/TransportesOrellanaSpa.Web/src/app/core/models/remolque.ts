import { CamionResumen } from './camion-resumen';

export interface Remolque {
  id: number;
  patente: string;
  marca: string;
  modelo: string;
  ano: number;
  tipo: string;
  capacidadToneladas: number;
  activa: boolean;
  camionHabitualId: number | null;
  camionHabitual: CamionResumen | null;
}