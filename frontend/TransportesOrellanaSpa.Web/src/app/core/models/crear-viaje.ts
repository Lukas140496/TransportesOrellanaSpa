export interface CrearViaje {

  numeroGuiaDespacho: string;

  fecha: string;

  clienteId: number;

  camionId: number;

  conductorId: number;

  remolqueId: number;

  origen: string;

  destino: string;

  comunaOrigen: string;

  comunaDestino: string;

  tipoCarga: string;

  kilometros: number | null;

  litrosCombustible: number;

  costoCombustible: number;

  tarifa: number;

  observaciones: string;

}