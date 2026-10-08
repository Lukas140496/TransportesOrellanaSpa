import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';

import { Usuario } from '../models/usuario/usuario';
import { CrearUsuario } from '../models/usuario/crear-usuario';
import { EditarUsuario } from '../models/usuario/editar-usuario';
import { Rol } from '../models/usuario/rol';
import { CambiarPasswordUsuario } from '../models/usuario/cambiar-password-usuario';
import { CambiarMiPassword } from '../models/usuario/cambiar-mi-password';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private readonly api = inject(ApiService);

  getUsuarios(): Observable<Usuario[]> {
    return this.api.getUsuarios();
  }

  getRoles(): Observable<Rol[]> {
    return this.api.getRoles();
  }

  crearUsuario(
    usuario: CrearUsuario
  ): Observable<{
    mensaje: string;
    usuarioId: number;
  }> {
    return this.api.crearUsuario(usuario);
  }

  editarUsuario(
    id: number,
    usuario: EditarUsuario
  ): Observable<{
    mensaje: string;
  }> {
    return this.api.editarUsuario(id, usuario);
  }

  cambiarEstadoUsuario(
    id: number,
    activo: boolean
  ): Observable<{
    mensaje: string;
  }> {
    return this.api.cambiarEstadoUsuario(id, activo);
  }

  eliminarUsuario(
    id: number
  ): Observable<{
    mensaje: string;
  }> {
    return this.api.eliminarUsuario(id);
  }

  cambiarPasswordUsuario(
    id: number,
    datos: CambiarPasswordUsuario
  ): Observable<{
    mensaje: string;
  }> {
    return this.api.cambiarPasswordUsuario(id, datos);
  }

  cambiarMiPassword(
    datos: CambiarMiPassword
  ): Observable<{ mensaje: string }> {
    return this.api.cambiarMiPassword(datos);
  }
}