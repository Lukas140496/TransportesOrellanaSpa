import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';

  mostrarPassword = false;
  cargando = false;
  error = '';

  iniciarSesion(): void {

    this.error = '';

    if (!this.email.trim() || !this.password) {
      this.error = 'Ingresa tu correo y contraseña.';
      return;
    }

    this.cargando = true;

    this.authService.login({
      email: this.email.trim(),
      password: this.password
    }).subscribe({
      next: () => {
        this.cargando = false;
        this.router.navigate(['/dashboard']);
      },
      error: error => {
        this.cargando = false;

        if (error.status === 401) {
          this.error = 'Correo o contraseña incorrectos.';
          return;
        }

        this.error = 'No fue posible iniciar sesión. Inténtalo nuevamente.';
      }
    });
  }

  alternarPassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }
}