import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService } from '../../../core/services/api.service';
import { Remolque } from '../../../core/models/remolque';
import { Camion } from '../../../core/models/camion';

@Component({
  selector: 'app-remolque-modificar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './remolque-modificar.html',
  styleUrl: './remolque-modificar.scss'
})
export class RemolqueModificar implements OnInit {

  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly anoMaximo =
    new Date().getFullYear() + 1;

  remolques: Remolque[] = [];
  remolquesFiltrados: Remolque[] = [];

  camiones: Camion[] = [];

  remolqueSeleccionado: Remolque | null = null;

  remolqueConfirmado = {
    patente: '',
    marca: '',
    modelo: ''
  };

  cargando = true;
  cargandoCamiones = false;
  guardando = false;

  error = '';

  busqueda = '';

  mostrarErrores = false;

  modalExitoVisible = false;
  modalErrorVisible = false;

  modalErrorTitulo = '';
  modalErrorMensaje = '';

  ngOnInit(): void {

    const patente =
      this.route.snapshot.paramMap.get('patente');

    this.cargarDatos(patente);
  }

  cargarDatos(patente?: string | null): void {

    this.cargando = true;
    this.error = '';

    this.api.getRemolques().subscribe({

      next: remolques => {

        this.remolques = remolques;
        this.remolquesFiltrados = remolques;

        this.cargando = false;

        this.cargarCamiones();

        if (patente) {

          const remolque =
            remolques.find(
              remolque =>
                remolque.patente.toLowerCase() ===
                patente.toLowerCase()
            );

          if (remolque) {

            this.seleccionarRemolque(remolque);

          } else {

            this.error =
              'No se encontró el remolque solicitado.';
          }
        }
      },

      error: error => {

        console.error(
          'Error al cargar remolques:',
          error
        );

        this.error =
          'No fue posible cargar los remolques.';

        this.cargando = false;
      }

    });
  }

  cargarCamiones(): void {

    this.cargandoCamiones = true;

    this.api.getCamiones().subscribe({

      next: camiones => {

        this.camiones = camiones
          .filter(camion => camion.activo);

        this.cargandoCamiones = false;
      },

      error: error => {

        console.error(
          'Error al cargar camiones:',
          error
        );

        this.camiones = [];
        this.cargandoCamiones = false;
      }

    });
  }

  buscarRemolques(): void {

    const texto =
      this.busqueda
        .trim()
        .toLowerCase();

    if (!texto) {

      this.remolquesFiltrados =
        this.remolques;

      return;
    }

    this.remolquesFiltrados =
      this.remolques.filter(remolque => {

        return (
          remolque.patente
            .toLowerCase()
            .includes(texto) ||

          remolque.marca
            .toLowerCase()
            .includes(texto) ||

          remolque.modelo
            .toLowerCase()
            .includes(texto) ||

          remolque.tipo
            .toLowerCase()
            .includes(texto)
        );

      });
  }

  seleccionarRemolque(remolque: Remolque): void {

    this.mostrarErrores = false;

    this.remolqueSeleccionado = {
      ...remolque,

      camionHabitualId:
        remolque.camionHabitualId ?? null
    };

    setTimeout(() => {

      document
        .querySelector('.form-card')
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });

    }, 100);
  }

  limpiarSeleccion(): void {

    if (this.guardando) {
      return;
    }

    this.remolqueSeleccionado = null;
    this.mostrarErrores = false;
  }

  formularioValido(): boolean {

    if (!this.remolqueSeleccionado) {
      return false;
    }

    const remolque =
      this.remolqueSeleccionado;

    const anoValido =
      remolque.ano !== null &&
      remolque.ano !== undefined &&
      remolque.ano >= 1950 &&
      remolque.ano <= this.anoMaximo;

    const capacidadValida =
      remolque.capacidadToneladas !== null &&
      remolque.capacidadToneladas !== undefined &&
      remolque.capacidadToneladas >= 0.1;

    return (
      remolque.marca.trim().length > 0 &&
      remolque.modelo.trim().length > 0 &&
      anoValido &&
      remolque.tipo.trim().length > 0 &&
      capacidadValida
    );
  }

  campoTieneError(campo: string): boolean {

    if (
      !this.mostrarErrores ||
      !this.remolqueSeleccionado
    ) {
      return false;
    }

    const remolque =
      this.remolqueSeleccionado;

    switch (campo) {

      case 'marca':
        return !remolque.marca.trim();

      case 'modelo':
        return !remolque.modelo.trim();

      case 'ano':
        return (
          remolque.ano === null ||
          remolque.ano === undefined ||
          remolque.ano < 1950 ||
          remolque.ano > this.anoMaximo
        );

      case 'tipo':
        return !remolque.tipo.trim();

      case 'capacidadToneladas':
        return (
          remolque.capacidadToneladas === null ||
          remolque.capacidadToneladas === undefined ||
          remolque.capacidadToneladas < 0.1
        );

      default:
        return false;
    }
  }

  obtenerMensajeError(campo: string): string {

    if (!this.campoTieneError(campo)) {
      return '';
    }

    switch (campo) {

      case 'marca':
        return 'La marca es obligatoria.';

      case 'modelo':
        return 'El modelo es obligatorio.';

      case 'ano':
        return 'Ingresa un año válido.';

      case 'tipo':
        return 'El tipo de remolque es obligatorio.';

      case 'capacidadToneladas':
        return 'La capacidad debe ser mayor a 0.';

      default:
        return '';
    }
  }

  desplazarAlPrimerCampoInvalido(): void {

    const campos = [
      {
        nombre: 'marca',
        id: 'marca'
      },
      {
        nombre: 'modelo',
        id: 'modelo'
      },
      {
        nombre: 'ano',
        id: 'ano'
      },
      {
        nombre: 'tipo',
        id: 'tipo'
      },
      {
        nombre: 'capacidadToneladas',
        id: 'capacidadToneladas'
      }
    ];

    const primerCampo =
      campos.find(
        campo =>
          this.campoTieneError(campo.nombre)
      );

    if (!primerCampo) {
      return;
    }

    setTimeout(() => {

      const elemento =
        document.getElementById(
          primerCampo.id
        ) as HTMLInputElement | null;

      if (!elemento) {
        return;
      }

      elemento.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });

      setTimeout(() => {
        elemento.focus();
      }, 250);

    }, 150);
  }

  guardarCambios(): void {

    if (
      !this.remolqueSeleccionado ||
      this.guardando
    ) {
      return;
    }

    this.mostrarErrores = true;

    if (!this.formularioValido()) {

      this.modalErrorTitulo =
        'Formulario incompleto';

      this.modalErrorMensaje =
        'Debes completar correctamente todos los campos obligatorios antes de guardar los cambios.';

      this.modalErrorVisible = true;

      return;
    }

    this.error = '';
    this.guardando = true;

    const remolque =
      this.remolqueSeleccionado;

    this.remolqueConfirmado = {
      patente: remolque.patente,
      marca: remolque.marca,
      modelo: remolque.modelo
    };

    const datosActualizar = {
      marca: remolque.marca.trim(),
      modelo: remolque.modelo.trim(),
      ano: Number(remolque.ano),
      tipo: remolque.tipo.trim(),
      capacidadToneladas:
        Number(remolque.capacidadToneladas),
      activa: Boolean(remolque.activa),
      camionHabitualId:
        remolque.camionHabitualId === null ||
        remolque.camionHabitualId === undefined
          ? null
          : Number(remolque.camionHabitualId)
    };

    this.api
      .actualizarRemolque(
        remolque.patente,
        datosActualizar
      )
      .subscribe({

        next: remolqueActualizado => {

          this.guardando = false;

          if (!remolqueActualizado) {

            console.error(
              'El servidor respondió correctamente, pero no devolvió el remolque actualizado.'
            );

            this.modalErrorTitulo =
              'Respuesta inesperada';

            this.modalErrorMensaje =
              'Los cambios fueron enviados, pero el servidor no devolvió la información actualizada del remolque.';

            this.modalErrorVisible = true;

            return;
          }

          this.remolqueSeleccionado = {
            ...remolqueActualizado,

            camionHabitualId:
              remolqueActualizado.camionHabitualId ?? null
          };

          this.modalExitoVisible = true;
        },

        error: error => {

          console.error(
            'Error al modificar remolque:',
            error
          );

          this.guardando = false;

          this.modalErrorTitulo =
            'No fue posible guardar los cambios';

          if (error.status === 404) {

            this.modalErrorMensaje =
              'El remolque no existe o ya no está disponible.';

          } else if (error.status === 409) {

            this.modalErrorMensaje =
              error.error ||
              'No fue posible modificar el remolque.';

          } else if (error.status === 400) {

            this.modalErrorMensaje =
              error.error ||
              'Los datos ingresados no son válidos.';

          } else {

            this.modalErrorMensaje =
              'Ocurrió un error al intentar guardar los cambios.';
          }

          this.modalErrorVisible = true;
        }

      });
  }

  cancelar(): void {

    if (this.guardando) {
      return;
    }

    this.router.navigate([
      '/remolques'
    ]);
  }

  cerrarModalExito(): void {

    this.modalExitoVisible = false;

    this.router.navigate([
      '/remolques'
    ]);
  }

  cerrarModalError(): void {

    this.modalErrorVisible = false;

    this.desplazarAlPrimerCampoInvalido();
  }
}