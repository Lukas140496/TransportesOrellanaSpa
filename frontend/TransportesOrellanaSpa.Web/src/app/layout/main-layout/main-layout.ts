import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, switchMap, timer } from 'rxjs';
import { CurrencyPipe, DatePipe } from '@angular/common';

import { ApiService } from '../../core/services/api.service';
import { PrecioDieselActual } from '../../core/models/precio-diesel-actual';

import {
    Router,
    RouterLink,
    RouterLinkActive,
    RouterOutlet
} from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { PermissionService } from '../../core/services/permission.service';

@Component({
    selector: 'app-main-layout',
    standalone: true,
    imports: [
        RouterLink,
        RouterLinkActive,
        RouterOutlet,
        CurrencyPipe,
        DatePipe
    ],
    templateUrl: './main-layout.html',
    styleUrl: './main-layout.scss'
})
export class MainLayout {

    readonly authService = inject(AuthService);
    readonly permissionService = inject(PermissionService);
    private readonly router = inject(Router);

    private readonly apiService = inject(ApiService);
    private readonly destroyRef = inject(DestroyRef);

    precioDieselActual: PrecioDieselActual | null = null;

    modalCerrarSesionVisible = false;
    menuAbierto = false;
    submenuAbierto: string | null = null;
    sesionExpiradaVisible = false;


    ngOnInit(): void {

        // =========================
        // SESIÓN EXPIRADA
        // =========================
    
        this.authService.sesionExpirada$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(expirada => {
                this.sesionExpiradaVisible = expirada;
            });
    
        // =========================
        // PRECIO ACTUAL DEL DIÉSEL
        // =========================
    
        timer(0, 30 * 60 * 1000)
            .pipe(
                switchMap(() =>
                    this.apiService.getPrecioDieselActual().pipe(
                        catchError(error => {
                            console.error(
                                'Error al obtener el precio del diésel:',
                                error
                            );
    
                            return EMPTY;
                        })
                    )
                ),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe(precio => {
    
                if (precio.precio !== null && precio.precio > 0) {
                    this.precioDieselActual = precio;
                }
    
            });
    }


    // =========================
    // USUARIO ACTUAL
    // =========================

    get nombreUsuario(): string {
        return this.authService.getUsuario()?.nombreCompleto ?? '';
    }

    get rolUsuario(): string {
        return this.authService.getUsuario()?.roles?.[0] ?? '';
    }

    get inicialesUsuario(): string {
        const usuario = this.authService.getUsuario();

        if (!usuario) {
            return '';
        }

        const nombres = usuario.nombres
            ?.trim()
            .split(/\s+/)
            .filter(Boolean) ?? [];

        const apellidoPaterno = usuario.apellidoPaterno?.trim() ?? '';

        const primeraInicial = nombres[0]?.charAt(0) ?? '';
        const apellidoInicial = apellidoPaterno.charAt(0);

        return `${primeraInicial}${apellidoInicial}`.toUpperCase();
    }

    // =========================
    // MENÚ
    // =========================

    toggleMenu(): void {
        this.menuAbierto = !this.menuAbierto;
    }

    cerrarMenu(): void {
        this.menuAbierto = false;
    }

    toggleSubmenu(menu: string): void {
        this.submenuAbierto =
            this.submenuAbierto === menu
                ? null
                : menu;
    }

    irAMiPerfil(): void {
        this.router.navigate(['/mi-perfil']);
    }

    // =========================
    // CERRAR SESIÓN
    // =========================

    cerrarSesion(): void {
        this.modalCerrarSesionVisible = true;
    }

    cancelarCerrarSesion(): void {
        this.modalCerrarSesionVisible = false;
    }

    confirmarCerrarSesion(): void {
        this.modalCerrarSesionVisible = false;
        this.authService.logout();
    }

    // =========================
    // SESIÓN EXPIRADA
    // =========================

    confirmarSesionExpirada(): void {
        this.sesionExpiradaVisible = false;
        this.authService.logout();
    }

}