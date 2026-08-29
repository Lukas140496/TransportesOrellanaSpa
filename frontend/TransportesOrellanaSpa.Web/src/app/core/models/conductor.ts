import { CamionResumen } from './camion-resumen';

export interface Conductor {
  id: number;
  rut: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNacimiento: string;
  edad: number;
  fechaIngreso: string;
  telefono: string;
  tipoLicencia: string;
  fechaControlLicencia: string;
  licenciaAlDia: boolean;
  camionesHabituales: CamionResumen[];
}