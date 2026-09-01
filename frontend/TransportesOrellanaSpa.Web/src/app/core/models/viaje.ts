import { CamionResumen } from './camion-resumen';
import { ConductorResumen } from './conductor-resumen';
import { RemolqueResumen } from './remolque-resumen';

export interface Viaje {

  id: number;

  numeroGuiaDespacho: string;

  fecha: string;

  cliente: {

    nombre: string;

    rut: string;

  };

  camion: CamionResumen;

  conductor: ConductorResumen;

  remolque: RemolqueResumen;

  origen: string;

  destino: string;

  comunaOrigen: string;

  comunaDestino: string;

  tipoCarga: string;

  kilometros: number;

  tarifa: number;

  observaciones: string;

  estado: string;

  estadoPago: string;

  fechaPago: string | null;

}