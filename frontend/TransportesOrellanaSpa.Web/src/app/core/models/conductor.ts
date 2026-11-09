import { CamionResumen } from './camion-resumen';
import { EstadoDocumento } from './estado-documento';

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
  licenciaConducir: EstadoDocumento;
  activo: boolean;
  camionesHabituales: CamionResumen[];
}