export interface UsuarioPerfil {
  usuarioId: number;

  rut: string;

  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;

  nombreCompleto: string;

  email: string;

  roles: string[];

  fechaCreacion: string;
  ultimoAcceso: string | null;

  activo: boolean;
}