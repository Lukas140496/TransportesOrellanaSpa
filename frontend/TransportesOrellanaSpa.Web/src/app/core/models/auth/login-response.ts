export interface LoginResponse {
  token: string;
  expiraEn: string;
  usuarioId: number;
  nombre: string;
  email: string;
  roles: string[];
}