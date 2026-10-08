import { Component, inject } from '@angular/core';

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
        RouterOutlet
    ],
    templateUrl: './main-layout.html',
    styleUrl: './main-layout.scss'
})
export class MainLayout {

    readonly authService = inject(AuthService);
    readonly permissionService = inject(PermissionService);
    private readonly router = inject(Router);

    modalCerrarSesionVisible = false;
    menuAbierto = false;
    submenuAbierto: string | null = null;
    sesionExpiradaVisible = false;

    ngOnInit(): void {

        this.authService.sesionExpirada$.subscribe(() => {
            this.sesionExpiradaVisible = true;
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