export interface Cliente {
    id: number;
    nombre: string;
    rut: string;
    direccion: string;
    comuna: string;
    ciudad: string;
    tarifa: number;
    tipoCarga: string;
    activo: boolean;
    observaciones: string;
}