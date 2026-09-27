import { Component, inject } from '@angular/core';

import {
    RouterLink,
    RouterLinkActive,
    RouterOutlet
} from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

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

    private readonly authService = inject(AuthService);

    modalCerrarSesionVisible = false;
    menuAbierto = false;
    submenuAbierto: string | null = null;
    sesionExpiradaVisible = false;

    ngOnInit(): void {

        this.authService.sesionExpirada$.subscribe(() => {
            this.sesionExpiradaVisible = true;
        });

    }

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

    confirmarSesionExpirada(): void {
        this.sesionExpiradaVisible = false;
        this.authService.logout();
    }

}