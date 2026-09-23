import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService } from '../../../core/services/api.service';
import { Camion } from '../../../core/models/camion';

@Component({
  selector: 'app-camion-modificar',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './camion-modificar.html',
  styleUrl: './camion-modificar.scss'
})
export class CamionModificar implements OnInit {

  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  camiones: Camion[] = [];
  camionesFiltrados: Camion[] = [];

  camionSeleccionado: Camion | null = null;

  camionConfirmado = {
    patente: '',
    marca: '',
    modelo: ''
  };

  cargando = true;
  guardando = false;

  error = '';

  busqueda = '';

  modalExitoVisible = false;
  modalErrorVisible = false;

  modalErrorTitulo = '';
  modalErrorMensaje = '';
  mostrarErrores = false;

  ngOnInit(): void {

    const patente =
      this.route.snapshot.paramMap.get('patente');

    this.cargarCamiones(patente);

  }

  cargarCamiones(patente?: string | null): void {

    this.cargando = true;
    this.error = '';

    this.api.getCamiones().subscribe({

      next: camiones => {

        this.camiones = camiones;
        this.camionesFiltrados = camiones;

        this.cargando = false;

        if (patente) {

          const camion =
            camiones.find(
              camion =>
                camion.patente.toLowerCase() ===
                patente.toLowerCase()
            );

          if (camion) {

            this.seleccionarCamion(camion);

          } else {

            this.error =
              'No se encontró el camión solicitado.';

          }

        }

      },

      error: error => {

        console.error(
          'Error al cargar camiones:',
          error
        );

        this.error =
          'No fue posible cargar los camiones.';

        this.cargando = false;

      }

    });

  }

  buscarCamiones(): void {

    const texto =
      this.busqueda
        .trim()
        .toLowerCase();

    if (!texto) {

      this.camionesFiltrados =
        this.camiones;

      return;

    }

    this.camionesFiltrados =
      this.camiones.filter(camion => {

        return (
          camion.patente
            .toLowerCase()
            .includes(texto) ||

          camion.marca
            .toLowerCase()
            .includes(texto) ||

          camion.modelo
            .toLowerCase()
            .includes(texto)
        );

      });

  }

  seleccionarCamion(camion: Camion): void {

    this.mostrarErrores = false;

    this.camionSeleccionado = {
      ...camion,

      fechaRevisionTecnica:
        this.convertirFechaParaInput(
          camion.fechaRevisionTecnica
        ),

      fechaPermisoCirculacion:
        this.convertirFechaParaInput(
          camion.fechaPermisoCirculacion
        ),

      fechaSeguroObligatorio:
        this.convertirFechaParaInput(
          camion.fechaSeguroObligatorio
        )
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

    this.camionSeleccionado = null;

  }

  formularioValido(): boolean {

    if (!this.camionSeleccionado) {
      return false;
    }

    const camion =
      this.camionSeleccionado;

    const anoValido =
      camion.ano !== null &&
      camion.ano !== undefined &&
      camion.ano >= 1950 &&
      camion.ano <= 2100;

    return (
      camion.marca.trim().length > 0 &&
      camion.modelo.trim().length > 0 &&
      anoValido &&
      camion.tipo.trim().length > 0 &&
      camion.color.trim().length > 0 &&
      camion.capacidad.trim().length > 0 &&
      camion.motor.trim().length > 0 &&
      camion.caballos.trim().length > 0 &&
      camion.cilindrada.trim().length > 0 &&
      camion.transmision.trim().length > 0 &&
      !!camion.fechaRevisionTecnica &&
      !!camion.fechaPermisoCirculacion &&
      !!camion.fechaSeguroObligatorio
    );

  }

  convertirFechaParaInput(
    fecha: string | null | undefined
  ): string {

    if (!fecha) {
      return '';
    }

    return fecha.substring(0, 10);

  }

  campoTieneError(campo: string): boolean {

    if (!this.mostrarErrores || !this.camionSeleccionado) {
      return false;
    }

    const camion = this.camionSeleccionado;

    switch (campo) {

      case 'marca':
        return !camion.marca.trim();

      case 'modelo':
        return !camion.modelo.trim();

      case 'ano':
        return (
          camion.ano === null ||
          camion.ano === undefined ||
          camion.ano < 1950 ||
          camion.ano > 2100
        );

      case 'tipo':
        return !camion.tipo.trim();

      case 'color':
        return !camion.color.trim();

      case 'capacidad':
        return !camion.capacidad.trim();

      case 'motor':
        return !camion.motor.trim();

      case 'caballos':
        return !camion.caballos.trim();

      case 'cilindrada':
        return !camion.cilindrada.trim();

      case 'transmision':
        return !camion.transmision.trim();

      case 'fechaRevisionTecnica':
        return !camion.fechaRevisionTecnica;

      case 'fechaPermisoCirculacion':
        return !camion.fechaPermisoCirculacion;

      case 'fechaSeguroObligatorio':
        return !camion.fechaSeguroObligatorio;

      default:
        return false;

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
        nombre: 'color',
        id: 'color'
      },
      {
        nombre: 'capacidad',
        id: 'capacidad'
      },
      {
        nombre: 'motor',
        id: 'motor'
      },
      {
        nombre: 'caballos',
        id: 'caballos'
      },
      {
        nombre: 'cilindrada',
        id: 'cilindrada'
      },
      {
        nombre: 'transmision',
        id: 'transmision'
      },
      {
        nombre: 'fechaRevisionTecnica',
        id: 'revisionTecnica'
      },
      {
        nombre: 'fechaPermisoCirculacion',
        id: 'permisoCirculacion'
      },
      {
        nombre: 'fechaSeguroObligatorio',
        id: 'seguroObligatorio'
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

    if (!this.camionSeleccionado || this.guardando) {
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

    const camion = this.camionSeleccionado;

    this.camionConfirmado = {
      patente: camion.patente,
      marca: camion.marca,
      modelo: camion.modelo
    };

    this.api
      .actualizarCamion(
        camion.patente,
        camion
      )
      .subscribe({

        next: () => {

          this.guardando = false;

          /*
           * El backend del PUT actualiza correctamente
           * el camión, pero responde 204 No Content.
           *
           * Por lo tanto, no debemos intentar leer
           * propiedades de una respuesta que viene null.
           *
           * El objeto "camion" ya contiene los valores
           * que acabamos de guardar.
           */

          this.camionSeleccionado = {
            ...camion,

            fechaRevisionTecnica:
              this.convertirFechaParaInput(
                camion.fechaRevisionTecnica
              ),

            fechaPermisoCirculacion:
              this.convertirFechaParaInput(
                camion.fechaPermisoCirculacion
              ),

            fechaSeguroObligatorio:
              this.convertirFechaParaInput(
                camion.fechaSeguroObligatorio
              )
          };

          this.modalExitoVisible = true;

        },

        error: error => {

          console.error(
            'Error al modificar camión:',
            error
          );

          this.guardando = false;

          this.modalErrorTitulo =
            'No fue posible guardar los cambios';

          if (error.status === 404) {

            this.modalErrorMensaje =
              'El camión no existe o ya no está disponible.';

          } else if (error.status === 409) {

            this.modalErrorMensaje =
              error.error ||
              'No fue posible modificar el camión.';

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
      '/camiones'
    ]);

  }

  cerrarModalExito(): void {

    this.modalExitoVisible = false;

    this.router.navigate([
      '/camiones'
    ]);

  }

  cerrarModalError(): void {

    this.modalErrorVisible = false;

    this.desplazarAlPrimerCampoInvalido();

  }

}