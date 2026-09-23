import {
  Component,
  OnInit,
  inject
} from '@angular/core';

import {
  FormsModule
} from '@angular/forms';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  ApiService
} from '../../../core/services/api.service';

import {
  Conductor
} from '../../../core/models/conductor';

@Component({
  selector: 'app-conductor-modificar',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './conductor-modificar.html',
  styleUrl: './conductor-modificar.scss'
})
export class ConductorModificar implements OnInit {

  private readonly apiService = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  conductores: Conductor[] = [];

  conductoresFiltrados: Conductor[] = [];

  conductorSeleccionado: Conductor | null = null;

  conductorConfirmado: Conductor = {
    id: 0,
    rut: '',
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    fechaNacimiento: '',
    edad: 0,
    fechaIngreso: '',
    telefono: '',
    tipoLicencia: '',
    fechaControlLicencia: '',
    licenciaAlDia: false,
    activo: true,
    camionesHabituales: []
  };

  cargando = false;

  guardando = false;

  desactivando = false;

  activando = false;

  error = '';

  busqueda = '';

  modalExitoVisible = false;

  modalErrorVisible = false;

  modalIncompletoVisible = false;

  modalDesactivarVisible = false;

  modalActivarVisible = false;

  modalErrorTitulo = '';

  modalErrorMensaje = '';

  operacionExito: 'modificar' | 'desactivar' | 'activar' | null = null;

  camposTocados: Record<string, boolean> = {};


  // =========================================================
  // INICIO
  // =========================================================

  ngOnInit(): void {

    this.cargarConductores();

  }


  // =========================================================
  // CARGAR CONDUCTORES
  // =========================================================

  cargarConductores(): void {

    this.cargando = true;

    this.error = '';

    this.apiService.getConductores().subscribe({

      next: (conductores) => {

        this.conductores = conductores;

        this.conductoresFiltrados = [...conductores];

        this.cargando = false;

        const rut = this.route.snapshot.paramMap.get('rut');

        if (rut) {

          const conductor = this.conductores.find(
            c => c.rut === rut
          );

          if (conductor) {

            this.seleccionarConductor(conductor);

          }

        }

      },

      error: (err) => {

        console.error(
          'Error al cargar conductores:',
          err
        );

        this.error =
          err?.error?.message ??
          err?.error ??
          'Ocurrió un error al cargar los conductores.';

        this.cargando = false;

      }

    });

  }


  // =========================================================
  // BÚSQUEDA
  // =========================================================

  buscarConductores(): void {

    const termino = this.busqueda
      .trim()
      .toLowerCase();

    if (!termino) {

      this.conductoresFiltrados = [
        ...this.conductores
      ];

      return;

    }

    this.conductoresFiltrados =
      this.conductores.filter(conductor => {

        const nombreCompleto = `
          ${conductor.nombres}
          ${conductor.apellidoPaterno}
          ${conductor.apellidoMaterno}
        `.toLowerCase();

        return (

          conductor.rut
            .toLowerCase()
            .includes(termino)

          ||

          nombreCompleto
            .includes(termino)

          ||

          conductor.telefono
            .toLowerCase()
            .includes(termino)

          ||

          conductor.tipoLicencia
            .toLowerCase()
            .includes(termino)

        );

      });

  }


  // =========================================================
  // SELECCIONAR CONDUCTOR
  // =========================================================

  seleccionarConductor(
    conductor: Conductor
  ): void {

    this.conductorSeleccionado = {
      ...conductor,
      fechaNacimiento:
        this.convertirFechaParaInput(
          conductor.fechaNacimiento
        ),
      fechaIngreso:
        this.convertirFechaParaInput(
          conductor.fechaIngreso
        ),
      fechaControlLicencia:
        this.convertirFechaParaInput(
          conductor.fechaControlLicencia
        )
    };

    this.camposTocados = {};

    setTimeout(() => {

      const formulario =
        document.querySelector('.form-card');

      if (formulario) {

        formulario.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });

      }

    }, 100);

  }


  // =========================================================
  // LIMPIAR SELECCIÓN
  // =========================================================

  limpiarSeleccion(): void {

    this.conductorSeleccionado = null;

    this.camposTocados = {};

    this.busqueda = '';

    this.conductoresFiltrados = [
      ...this.conductores
    ];

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

  }


  // =========================================================
  // VALIDACIÓN
  // =========================================================

  campoTocado(campo: string): void {

    this.camposTocados[campo] = true;

  }


  campoTieneError(campo: string): boolean {

    if (!this.camposTocados[campo]) {

      return false;

    }

    if (!this.conductorSeleccionado) {

      return false;

    }

    switch (campo) {

      case 'nombres':

        return !this.conductorSeleccionado.nombres.trim();

      case 'apellidoPaterno':

        return !this.conductorSeleccionado.apellidoPaterno.trim();

      case 'apellidoMaterno':

        return !this.conductorSeleccionado.apellidoMaterno.trim();

      case 'fechaNacimiento':

        return !this.conductorSeleccionado.fechaNacimiento;

      case 'fechaIngreso':

        return !this.conductorSeleccionado.fechaIngreso;

      case 'telefono':

        return !this.conductorSeleccionado.telefono.trim();

      case 'tipoLicencia':

        return !this.conductorSeleccionado.tipoLicencia.trim();

      case 'fechaControlLicencia':

        return !this.conductorSeleccionado.fechaControlLicencia;

      default:

        return false;

    }

  }


  formularioValido(): boolean {

    if (!this.conductorSeleccionado) {

      return false;

    }

    const camposObligatorios = [

      'nombres',
      'apellidoPaterno',
      'apellidoMaterno',
      'fechaNacimiento',
      'fechaIngreso',
      'telefono',
      'tipoLicencia',
      'fechaControlLicencia'

    ];

    camposObligatorios.forEach(
      campo => this.campoTocado(campo)
    );

    return !camposObligatorios.some(
      campo => this.campoTieneError(campo)
    );

  }


  // =========================================================
  // EDAD
  // =========================================================

  calcularEdad(): void {

    if (!this.conductorSeleccionado?.fechaNacimiento) {

      return;

    }

    const nacimiento =
      new Date(
        this.conductorSeleccionado.fechaNacimiento
      );

    const hoy = new Date();

    let edad =
      hoy.getFullYear() -
      nacimiento.getFullYear();

    const mes =
      hoy.getMonth() -
      nacimiento.getMonth();

    if (
      mes < 0 ||
      (
        mes === 0 &&
        hoy.getDate() < nacimiento.getDate()
      )
    ) {

      edad--;

    }

    this.conductorSeleccionado.edad =
      edad;

  }


  // =========================================================
  // GUARDAR CAMBIOS
  // =========================================================

  guardarCambios(): void {

    if (!this.conductorSeleccionado) {

      return;

    }

    if (!this.formularioValido()) {

      this.modalIncompletoVisible = true;

      return;

    }

    this.guardando = true;

    const rut =
      this.conductorSeleccionado.rut;

    const conductorActualizado = {
      ...this.conductorSeleccionado,
      fechaNacimiento:
        this.convertirFechaParaApi(
          this.conductorSeleccionado.fechaNacimiento
        ),
      fechaIngreso:
        this.convertirFechaParaApi(
          this.conductorSeleccionado.fechaIngreso
        ),
      fechaControlLicencia:
        this.convertirFechaParaApi(
          this.conductorSeleccionado.fechaControlLicencia
        )
    };

    this.apiService
      .actualizarConductor(
        rut,
        conductorActualizado
      )
      .subscribe({

        next: () => {

          this.guardando = false;

          this.actualizarConductorEnLista(
            this.conductorSeleccionado!
          );

          this.conductorConfirmado = {
            ...this.conductorSeleccionado!
          };

          this.operacionExito =
            'modificar';

          this.modalExitoVisible = true;

        },

        error: (err) => {

          console.error(
            'Error al modificar conductor:',
            err
          );

          this.guardando = false;

          this.mostrarError(
            'Error al modificar conductor',
            this.obtenerMensajeError(
              err,
              'No fue posible guardar los cambios del conductor.'
            )
          );

        }

      });

  }


  // =========================================================
  // DESACTIVAR
  // =========================================================

  abrirModalDesactivar(): void {

    if (
      !this.conductorSeleccionado ||
      !this.conductorSeleccionado.activo
    ) {

      return;

    }

    this.modalDesactivarVisible = true;

  }


  cerrarModalDesactivar(): void {

    if (this.desactivando) {

      return;

    }

    this.modalDesactivarVisible = false;

  }


  confirmarDesactivacion(): void {

    if (
      !this.conductorSeleccionado ||
      !this.conductorSeleccionado.activo
    ) {

      return;

    }

    this.desactivando = true;

    const rut =
      this.conductorSeleccionado.rut;

    this.apiService
      .desactivarConductor(rut)
      .subscribe({

        next: () => {

          this.desactivando = false;

          this.modalDesactivarVisible =
            false;

          this.conductorSeleccionado = {
            ...this.conductorSeleccionado!,
            activo: false
          };

          this.actualizarEstadoConductor(
            rut,
            false
          );

          this.conductorConfirmado = {
            ...this.conductorSeleccionado
          };

          this.operacionExito =
            'desactivar';

          this.modalExitoVisible = true;

        },

        error: (err) => {

          console.error(
            'Error al desactivar conductor:',
            err
          );

          this.desactivando = false;

          this.modalDesactivarVisible =
            false;

          this.mostrarError(
            'Error al desactivar conductor',
            this.obtenerMensajeError(
              err,
              'No fue posible desactivar el conductor.'
            )
          );

        }

      });

  }


  // =========================================================
  // ACTIVAR
  // =========================================================

  abrirModalActivar(): void {

    if (
      !this.conductorSeleccionado ||
      this.conductorSeleccionado.activo
    ) {

      return;

    }

    this.modalActivarVisible = true;

  }


  cerrarModalActivar(): void {

    if (this.activando) {

      return;

    }

    this.modalActivarVisible = false;

  }


  confirmarActivacion(): void {

    if (
      !this.conductorSeleccionado ||
      this.conductorSeleccionado.activo
    ) {

      return;

    }

    this.activando = true;

    const rut =
      this.conductorSeleccionado.rut;

    this.apiService
      .activarConductor(rut)
      .subscribe({

        next: () => {

          this.activando = false;

          this.modalActivarVisible =
            false;

          this.conductorSeleccionado = {
            ...this.conductorSeleccionado!,
            activo: true
          };

          this.actualizarEstadoConductor(
            rut,
            true
          );

          this.conductorConfirmado = {
            ...this.conductorSeleccionado
          };

          this.operacionExito =
            'activar';

          this.modalExitoVisible = true;

        },

        error: (err) => {

          console.error(
            'Error al activar conductor:',
            err
          );

          this.activando = false;

          this.modalActivarVisible =
            false;

          this.mostrarError(
            'Error al activar conductor',
            this.obtenerMensajeError(
              err,
              'No fue posible activar el conductor.'
            )
          );

        }

      });

  }


  // =========================================================
  // ACTUALIZAR ESTADO EN MEMORIA
  // =========================================================

  actualizarEstadoConductor(
    rut: string,
    activo: boolean
  ): void {

    this.conductores =
      this.conductores.map(conductor => {

        if (conductor.rut !== rut) {

          return conductor;

        }

        return {
          ...conductor,
          activo
        };

      });

    this.conductoresFiltrados =
      this.conductoresFiltrados.map(
        conductor => {

          if (conductor.rut !== rut) {

            return conductor;

          }

          return {
            ...conductor,
            activo
          };

        }
      );

  }


  // =========================================================
  // ACTUALIZAR CONDUCTOR EN LISTA
  // =========================================================

  actualizarConductorEnLista(
    conductor: Conductor
  ): void {

    this.conductores =
      this.conductores.map(item => {

        if (item.rut !== conductor.rut) {

          return item;

        }

        return {
          ...conductor
        };

      });

    this.conductoresFiltrados =
      this.conductoresFiltrados.map(item => {

        if (item.rut !== conductor.rut) {

          return item;

        }

        return {
          ...conductor
        };

      });

  }


  // =========================================================
  // MODALES
  // =========================================================

  mostrarError(
    titulo: string,
    mensaje: string
  ): void {

    this.modalErrorTitulo = titulo;

    this.modalErrorMensaje = mensaje;

    this.modalErrorVisible = true;

  }


  cerrarModalError(): void {

    this.modalErrorVisible = false;

  }


  cerrarModalIncompleto(): void {

    this.modalIncompletoVisible = false;

    setTimeout(() => {

      const primerCampoInvalido =
        document.querySelector(
          '.error-message'
        );

      if (primerCampoInvalido) {

        const contenedor =
          primerCampoInvalido.parentElement;

        if (contenedor) {

          contenedor.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });

          const input =
            contenedor.querySelector(
              'input, select, textarea'
            ) as
              | HTMLInputElement
              | HTMLSelectElement
              | HTMLTextAreaElement
              | null;

          input?.focus();

        }

      }

    }, 100);

  }


  cerrarModalExito(): void {

    this.modalExitoVisible = false;

    this.operacionExito = null;

    this.limpiarSeleccion();

  }


  // =========================================================
  // CANCELAR
  // =========================================================

  cancelar(): void {

    this.router.navigate([
      '/conductores'
    ]);

  }


  // =========================================================
  // CONVERSIÓN DE FECHAS
  // =========================================================

  convertirFechaParaInput(
    fecha: string
  ): string {

    if (!fecha) {

      return '';

    }

    return fecha.substring(
      0,
      10
    );

  }


  convertirFechaParaApi(
    fecha: string
  ): string {

    if (!fecha) {

      return '';

    }

    return `${fecha}T00:00:00`;

  }


  // =========================================================
  // MENSAJE DE ERROR
  // =========================================================

  private obtenerMensajeError(
    err: any,
    mensajePorDefecto: string
  ): string {

    if (
      typeof err?.error === 'string' &&
      err.error.trim()
    ) {

      return err.error;

    }

    if (
      typeof err?.error?.message === 'string' &&
      err.error.message.trim()
    ) {

      return err.error.message;

    }

    if (
      typeof err?.message === 'string' &&
      err.message.trim()
    ) {

      return err.message;

    }

    if (err?.status === 404) {

      return 'No se encontró el conductor solicitado.';

    }

    if (err?.status === 409) {

      return 'El estado actual del conductor no permite realizar esta operación.';

    }

    return mensajePorDefecto;

  }

}