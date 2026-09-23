import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';

import { ApiService } from '../../../core/services/api.service';
import { Camion } from '../../../core/models/camion';

@Component({
  selector: 'app-remolque-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './remolque-form.html',
  styleUrl: './remolque-form.scss'
})
export class RemolqueForm implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);

  formulario!: FormGroup;

  camiones: Camion[] = [];

  cargandoCamiones = false;
  guardando = false;

  mostrarModalExito = false;
  mostrarModalError = false;
  mostrarModalIncompleto = false;

  mensajeError = '';

  remolqueCreado = {
    patente: '',
    marca: '',
    modelo: ''
  };

  ngOnInit(): void {

    this.formulario = this.fb.group({

      patente: [
        '',
        [
          Validators.required,
          Validators.maxLength(10)
        ]
      ],

      marca: [
        '',
        [
          Validators.required,
          Validators.maxLength(100)
        ]
      ],

      modelo: [
        '',
        [
          Validators.required,
          Validators.maxLength(100)
        ]
      ],

      ano: [
        new Date().getFullYear(),
        [
          Validators.required,
          Validators.min(1950),
          Validators.max(new Date().getFullYear() + 1)
        ]
      ],

      tipo: [
        '',
        [
          Validators.required,
          Validators.maxLength(100)
        ]
      ],

      capacidadToneladas: [
        null,
        [
          Validators.required,
          Validators.min(0.1)
        ]
      ],

      camionHabitualId: [
        null
      ],

      activa: [
        true
      ]

    });

    this.cargarCamiones();
  }

  cargarCamiones(): void {

    this.cargandoCamiones = true;

    this.apiService.getCamiones().subscribe({

      next: (camiones) => {

        this.camiones = camiones
          .filter(camion => camion.activo);

        this.cargandoCamiones = false;
      },

      error: () => {

        this.camiones = [];
        this.cargandoCamiones = false;
      }

    });
  }

  guardar(): void {

    if (this.formulario.invalid) {

      this.formulario.markAllAsTouched();

      this.mostrarModalIncompleto = true;

      return;
    }

    this.guardando = true;

    this.mensajeError = '';
    this.mostrarModalError = false;

    const valor = this.formulario.value;

    const remolque = {
      patente: valor.patente.trim().toUpperCase(),
      marca: valor.marca.trim(),
      modelo: valor.modelo.trim(),
      ano: Number(valor.ano),
      tipo: valor.tipo.trim(),
      capacidadToneladas: Number(valor.capacidadToneladas),
      activa: Boolean(valor.activa),
      camionHabitualId:
        valor.camionHabitualId === null ||
        valor.camionHabitualId === '' ||
        valor.camionHabitualId === undefined
          ? null
          : Number(valor.camionHabitualId)
    };

    this.apiService.crearRemolque(remolque).subscribe({

      next: (resultado) => {

        this.guardando = false;

        this.remolqueCreado = {
          patente: resultado.patente,
          marca: resultado.marca,
          modelo: resultado.modelo
        };

        this.mostrarModalExito = true;
      },

      error: (error) => {

        this.guardando = false;

        if (error.status === 409) {

          this.mensajeError =
            `Ya existe un remolque con la patente ${remolque.patente}.`;

        } else if (error.status === 400) {

          this.mensajeError =
            error.error || 'Los datos ingresados no son válidos.';

        } else {

          this.mensajeError =
            'No fue posible guardar el remolque. Inténtalo nuevamente.';
        }

        this.mostrarModalError = true;
      }

    });
  }

  cancelar(): void {
    this.router.navigate(['/remolques']);
  }

  cerrarModalExito(): void {
    this.mostrarModalExito = false;
    this.router.navigate(['/remolques']);
  }

  cerrarModalError(): void {
    this.mostrarModalError = false;
  }

  cerrarModalIncompleto(): void {
    this.mostrarModalIncompleto = false;
  }

  volverAlFormulario(): void {
    this.mostrarModalExito = false;
  }

  campoInvalido(nombre: string): boolean {

    const campo = this.formulario.get(nombre);

    return !!campo &&
      campo.invalid &&
      (campo.touched || campo.dirty);
  }

}