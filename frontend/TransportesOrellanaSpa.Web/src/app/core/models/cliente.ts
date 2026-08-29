export interface Cliente {
    id: number;
    nombre: string;
    rut: string;
    ubicacion: string;
    tarifa: number;
    tipoCarga: string;
    activo: boolean;
    observaciones: string;
}