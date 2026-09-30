import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, Subject } from 'rxjs';

import { ApiService } from './api.service';
import { LoginRequest } from '../models/auth/login-request';
import { LoginResponse } from '../models/auth/login-response';
import { UsuarioPerfil } from '../models/usuario-perfil';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private readonly apiService = inject(ApiService);
    private readonly router = inject(Router);

    private readonly tokenKey = 'auth_token';
    private readonly userKey = 'auth_user';
    private sesionExpiradaEnProceso = false;
    private readonly sesionExpiradaSubject = new Subject<void>();

    readonly sesionExpirada$ = this.sesionExpiradaSubject.asObservable();

    login(request: LoginRequest): Observable<LoginResponse> {
        return this.apiService.login(request).pipe(
            tap(response => {

                this.sesionExpiradaEnProceso = false;

                localStorage.setItem(
                    this.tokenKey,
                    response.token
                );

                localStorage.setItem(
                    this.userKey,
                    JSON.stringify({
                        usuarioId: response.usuarioId,
                        nombres: response.nombres,
                        apellidoPaterno: response.apellidoPaterno,
                        apellidoMaterno: response.apellidoMaterno,
                        nombreCompleto: response.nombreCompleto,
                        email: response.email,
                        roles: response.roles,
                        expiraEn: response.expiraEn
                    })
                );
            })
        );
    }

    actualizarUsuarioLocalmente(perfil: UsuarioPerfil): void {
        const usuarioActual = this.getUsuario();
    
        if (!usuarioActual) {
            return;
        }
    
        localStorage.setItem(
            this.userKey,
            JSON.stringify({
                ...usuarioActual,
                usuarioId: perfil.usuarioId,
                nombres: perfil.nombres,
                apellidoPaterno: perfil.apellidoPaterno,
                apellidoMaterno: perfil.apellidoMaterno,
                nombreCompleto: perfil.nombreCompleto,
                email: perfil.email,
                roles: perfil.roles
            })
        );
    }

    logout(): void {
        this.sesionExpiradaEnProceso = false;

        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);

        this.router.navigate(['/login']);
    }

    manejarSesionExpirada(): void {

        if (this.sesionExpiradaEnProceso) {
            return;
        }

        this.sesionExpiradaEnProceso = true;

        this.sesionExpiradaSubject.next();
    }

    getToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    getUsuario(): LoginResponse | null {
        const usuarioGuardado = localStorage.getItem(this.userKey);

        if (!usuarioGuardado) {
            return null;
        }

        try {
            return JSON.parse(usuarioGuardado) as LoginResponse;
        } catch {
            return null;
        }
    }

    estaAutenticado(): boolean {
        return !!this.getToken();
    }
}