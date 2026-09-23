import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';

import { ApiService } from '../../../core/services/api.service';

import { Cliente } from '../../../core/models/cliente';
import { Camion } from '../../../core/models/camion';
import { Conductor } from '../../../core/models/conductor';
import { Remolque } from '../../../core/models/remolque';
import { Viaje } from '../../../core/models/viaje';
import { ActualizarViaje } from '../../../core/models/actualizar-viaje';

@Component({
  selector: 'app-viaje-modificar',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
  ],
  templateUrl: './viaje-modificar.html',
  styleUrl: './viaje-modificar.scss'
})
export class ViajeModificar implements OnInit {

  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  viajes: Viaje[] = [];

  clientes: Cliente[] = [];
  camiones: Camion[] = [];
  conductores: Conductor[] = [];
  remolques: Remolque[] = [];

  viajeSeleccionado: Viaje | null = null;

  viaje = {
    numeroGuiaDespacho: '',
    fecha: '',
    estado: '',
    clienteId: 0,
    camionId: 0,
    conductorId: 0,
    remolqueId: 0,
    origen: '',
    destino: '',
    comunaOrigen: '',
    comunaDestino: '',
    tipoCarga: '',
    kilometros: null as number | null,
    litrosCombustible: 0,
    costoCombustible: 0,
    tarifa: 0,
    observaciones: ''
  };

  busqueda = '';

  cargando = true;
  cargandoViaje = false;
  guardando = false;
  eliminando = false;

  error = '';

  camposTocados: Record<string, boolean> = {};

  modalEliminarVisible = false;

  modalExitoVisible = false;
  modalExitoTitulo = '';
  modalExitoMensaje = '';

  modalErrorVisible = false;
  modalErrorTitulo = '';
  modalErrorMensaje = '';

  ngOnInit(): void {
    this.cargarDatos();
  }

  private cargarDatos(): void {

    this.cargando = true;
    this.error = '';

    let viajesCargados = false;
    let clientesCargados = false;
    let camionesCargados = false;
    let conductoresCargados = false;
    let remolquesCargados = false;

    const comprobarCarga = (): void => {

      if (
        viajesCargados &&
        clientesCargados &&
        camionesCargados &&
        conductoresCargados &&
        remolquesCargados
      ) {
        this.cargando = false;
      }

    };

    this.api.getViajes().subscribe({

      next: viajes => {
        this.viajes = viajes;
        viajesCargados = true;
        comprobarCarga();
      },

      error: error => {
        console.error('Error al cargar viajes:', error);

        this.error =
          'No fue posible cargar los viajes.';

        viajesCargados = true;
        comprobarCarga();
      }

    });

    this.api.getClientes().subscribe({

      next: clientes => {
        this.clientes = clientes;
        clientesCargados = true;
        comprobarCarga();
      },

      error: error => {
        console.error('Error al cargar clientes:', error);
        clientesCargados = true;
        comprobarCarga();
      }

    });

    this.api.getCamiones().subscribe({

      next: camiones => {
        this.camiones = camiones;
        camionesCargados = true;
        comprobarCarga();
      },

      error: error => {
        console.error('Error al cargar camiones:', error);
        camionesCargados = true;
        comprobarCarga();
      }

    });

    this.api.getConductores().subscribe({

      next: conductores => {
        this.conductores = conductores;
        conductoresCargados = true;
        comprobarCarga();
      },

      error: error => {
        console.error('Error al cargar conductores:', error);
        conductoresCargados = true;
        comprobarCarga();
      }

    });

    this.api.getRemolques().subscribe({

      next: remolques => {
        this.remolques = remolques;
        remolquesCargados = true;
        comprobarCarga();
      },

      error: error => {
        console.error('Error al cargar remolques:', error);
        remolquesCargados = true;
        comprobarCarga();
      }

    });

  }

  get viajesFiltrados(): Viaje[] {

    const texto = this.busqueda.trim().toLowerCase();

    if (!texto) {
      return this.viajes;
    }

    return this.viajes.filter(viaje =>
      viaje.numeroGuiaDespacho
        .toLowerCase()
        .includes(texto) ||

      viaje.cliente.nombre
        .toLowerCase()
        .includes(texto) ||

      viaje.cliente.rut
        .toLowerCase()
        .includes(texto) ||

      viaje.estado
        .toLowerCase()
        .includes(texto) ||

      viaje.estadoPago
        .toLowerCase()
        .includes(texto)
    );

  }

  seleccionarViaje(viaje: Viaje): void {

    if (
      this.cargandoViaje ||
      this.guardando ||
      this.eliminando
    ) {
      return;
    }

    /*
     * Si ya está seleccionado este mismo viaje,
     * lo deseleccionamos.
     */
    if (
      this.viajeSeleccionado &&
      this.viajeSeleccionado.id === viaje.id
    ) {
      this.deseleccionarViaje();
      return;
    }

    this.cargandoViaje = true;
    this.error = '';

    this.api.getViajeById(viaje.id).subscribe({

      next: viajeCompleto => {

        this.viajeSeleccionado = viajeCompleto;

        this.viaje = {
          numeroGuiaDespacho:
            viajeCompleto.numeroGuiaDespacho,

          fecha:
            this.formatearFechaInput(
              viajeCompleto.fecha
            ),

          estado:
            viajeCompleto.estado,

          clienteId:
            this.obtenerIdCliente(viajeCompleto),

          camionId:
            this.camiones.find(
              camion =>
                camion.patente ===
                viajeCompleto.camion?.patente
            )?.id ?? 0,

          conductorId:
            this.obtenerIdConductor(viajeCompleto),

          remolqueId:
            this.remolques.find(
              remolque =>
                remolque.patente ===
                viajeCompleto.remolque?.patente
            )?.id ?? 0,

          origen:
            viajeCompleto.origen,

          destino:
            viajeCompleto.destino,

          comunaOrigen:
            viajeCompleto.comunaOrigen,

          comunaDestino:
            viajeCompleto.comunaDestino,

          tipoCarga:
            viajeCompleto.tipoCarga,

          kilometros:
            viajeCompleto.kilometros,

          litrosCombustible:
            viajeCompleto.litrosCombustible,

          costoCombustible:
            viajeCompleto.costoCombustible,

          tarifa:
            viajeCompleto.tarifa,

          observaciones:
            viajeCompleto.observaciones
        };

        this.camposTocados = {};
        this.cargandoViaje = false;

        setTimeout(() => {
          document.querySelector('.selected-summary')
            ?.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
        }, 100);
      },

      error: error => {

        console.error(
          'Error al cargar viaje:',
          error
        );

        this.cargandoViaje = false;

        this.mostrarError(
          'No se pudo cargar el viaje',
          'Ocurrió un error al intentar cargar la información del viaje.'
        );
      }

    });

  }

  deseleccionarViaje(): void {

    if (
      this.guardando ||
      this.eliminando ||
      this.cargandoViaje
    ) {
      return;
    }

    this.viajeSeleccionado = null;

    this.viaje = {
      numeroGuiaDespacho: '',
      fecha: '',
      estado: '',
      clienteId: 0,
      camionId: 0,
      conductorId: 0,
      remolqueId: 0,
      origen: '',
      destino: '',
      comunaOrigen: '',
      comunaDestino: '',
      tipoCarga: '',
      kilometros: null,
      litrosCombustible: 0,
      costoCombustible: 0,
      tarifa: 0,
      observaciones: ''
    };

    this.camposTocados = {};
    this.error = '';
  }

  private formatearFechaInput(fecha: string): string {

    const fechaObj = new Date(fecha);

    if (Number.isNaN(fechaObj.getTime())) {
      return '';
    }

    const year = fechaObj.getFullYear();

    const month =
      String(fechaObj.getMonth() + 1)
        .padStart(2, '0');

    const day =
      String(fechaObj.getDate())
        .padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private obtenerIdCliente(viaje: Viaje): number {

    const clienteEncontrado =
      this.clientes.find(
        cliente =>
          cliente.nombre === viaje.cliente?.nombre &&
          cliente.rut === viaje.cliente?.rut
      );

    return clienteEncontrado?.id ?? 0;
  }

  private obtenerIdConductor(viaje: Viaje): number {

    const conductorEncontrado =
      this.conductores.find(
        conductor =>
          conductor.rut === viaje.conductor?.rut
      );

    return conductorEncontrado?.id ?? 0;
  }

  campoTocado(campo: string): void {
    this.camposTocados[campo] = true;
  }

  campoTieneError(campo: string): boolean {

    if (!this.camposTocados[campo]) {
      return false;
    }

    switch (campo) {

      case 'numeroGuiaDespacho':
        return !this.viaje.numeroGuiaDespacho.trim();

      case 'fecha':
        return !this.viaje.fecha;

      case 'estado':
        return !this.viaje.estado;

      case 'clienteId':
        return this.viaje.clienteId <= 0;

      case 'camionId':
        return this.viaje.camionId <= 0;

      case 'conductorId':
        return this.viaje.conductorId <= 0;

      case 'remolqueId':
        return this.viaje.remolqueId <= 0;

      case 'origen':
        return !this.viaje.origen.trim();

      case 'destino':
        return !this.viaje.destino.trim();

      case 'comunaOrigen':
        return !this.viaje.comunaOrigen.trim();

      case 'comunaDestino':
        return !this.viaje.comunaDestino.trim();

      case 'tipoCarga':
        return !this.viaje.tipoCarga.trim();

      case 'kilometros':
        return (
          this.viaje.kilometros !== null &&
          this.viaje.kilometros < 0
        );

      case 'litrosCombustible':
        return this.viaje.litrosCombustible < 0;

      case 'costoCombustible':
        return this.viaje.costoCombustible < 0;

      case 'tarifa':
        return this.viaje.tarifa < 0;

      case 'observaciones':
        return this.viaje.observaciones.length > 500;

      default:
        return false;
    }

  }

  private formularioValido(): boolean {

    const camposObligatorios = [
      'numeroGuiaDespacho',
      'fecha',
      'estado',
      'clienteId',
      'camionId',
      'conductorId',
      'remolqueId',
      'origen',
      'destino',
      'comunaOrigen',
      'comunaDestino',
      'tipoCarga',
      'litrosCombustible',
      'costoCombustible',
      'tarifa'
    ];

    camposObligatorios.forEach(campo => {
      this.camposTocados[campo] = true;
    });

    if (
      !this.viaje.numeroGuiaDespacho.trim() ||
      !this.viaje.fecha ||
      !this.viaje.estado ||
      this.viaje.clienteId <= 0 ||
      this.viaje.camionId <= 0 ||
      this.viaje.conductorId <= 0 ||
      this.viaje.remolqueId <= 0 ||
      !this.viaje.origen.trim() ||
      !this.viaje.destino.trim() ||
      !this.viaje.comunaOrigen.trim() ||
      !this.viaje.comunaDestino.trim() ||
      !this.viaje.tipoCarga.trim()
    ) {
      return false;
    }

    if (
      this.viaje.kilometros !== null &&
      this.viaje.kilometros < 0
    ) {
      this.camposTocados['kilometros'] = true;
      return false;
    }

    if (this.viaje.litrosCombustible < 0) {
      this.camposTocados['litrosCombustible'] = true;
      return false;
    }

    if (this.viaje.costoCombustible < 0) {
      this.camposTocados['costoCombustible'] = true;
      return false;
    }

    if (this.viaje.tarifa < 0) {
      this.camposTocados['tarifa'] = true;
      return false;
    }

    if (this.viaje.observaciones.length > 500) {
      this.camposTocados['observaciones'] = true;
      return false;
    }

    return true;
  }

  guardar(): void {

    if (
      this.guardando ||
      this.eliminando ||
      this.cargandoViaje ||
      !this.viajeSeleccionado
    ) {
      return;
    }

    if (!this.formularioValido()) {

      this.mostrarError(
        'Formulario incompleto',
        'Debes completar correctamente todos los campos obligatorios antes de guardar el viaje.'
      );

      return;
    }

    this.guardando = true;

    const viajeActualizado: ActualizarViaje = {

      numeroGuiaDespacho:
        this.viaje.numeroGuiaDespacho.trim(),

      fecha:
        `${this.viaje.fecha}T00:00:00`,

      clienteId:
        this.viaje.clienteId,

      camionId:
        this.viaje.camionId,

      conductorId:
        this.viaje.conductorId,

      remolqueId:
        this.viaje.remolqueId,

      origen:
        this.viaje.origen.trim(),

      destino:
        this.viaje.destino.trim(),

      comunaOrigen:
        this.viaje.comunaOrigen.trim(),

      comunaDestino:
        this.viaje.comunaDestino.trim(),

      tipoCarga:
        this.viaje.tipoCarga.trim(),

      kilometros:
        this.viaje.kilometros,

      litrosCombustible:
        this.viaje.litrosCombustible,

      costoCombustible:
        this.viaje.costoCombustible,

      tarifa:
        this.viaje.tarifa,

      observaciones:
        this.viaje.observaciones.trim(),

      estado:
        this.viaje.estado
    };

    this.api.actualizarViaje(
      this.viajeSeleccionado.id,
      viajeActualizado
    ).subscribe({

      next: resultado => {

        this.guardando = false;

        this.viajeSeleccionado = resultado;

        const indice =
          this.viajes.findIndex(
            viaje =>
              viaje.id === resultado.id
          );

        if (indice >= 0) {
          this.viajes[indice] = resultado;
          this.viajes = [...this.viajes];
        }

        this.mostrarExito(
          'Viaje actualizado correctamente',
          `El viaje con guía ${resultado.numeroGuiaDespacho} fue modificado exitosamente.`
        );
      },

      error: error => {

        console.error(
          'Error al actualizar viaje:',
          error
        );

        this.guardando = false;

        if (error.status === 409) {

          this.mostrarError(
            'No se pudo actualizar el viaje',
            error.error ||
            'Ya existe un viaje registrado con ese número de guía de despacho.'
          );

        } else {

          this.mostrarError(
            'No se pudo actualizar el viaje',
            'Ocurrió un error al intentar modificar el viaje.'
          );

        }

      }

    });

  }

  mostrarConfirmacionEliminar(): void {

    if (
      !this.viajeSeleccionado ||
      this.guardando ||
      this.eliminando
    ) {
      return;
    }

    if (
      this.viajeSeleccionado.estadoPago ===
      'Pagado'
    ) {

      this.mostrarError(
        'No se puede eliminar el viaje',
        'Este viaje ya fue pagado y está protegido para mantener la integridad de los registros financieros.'
      );

      return;
    }

    this.modalEliminarVisible = true;
  }

  cerrarModalEliminar(): void {

    if (this.eliminando) {
      return;
    }

    this.modalEliminarVisible = false;
  }

  confirmarEliminar(): void {

    if (
      !this.viajeSeleccionado ||
      this.eliminando
    ) {
      return;
    }

    this.eliminando = true;

    this.api.eliminarViaje(
      this.viajeSeleccionado.id
    ).subscribe({

      next: () => {

        this.eliminando = false;
        this.modalEliminarVisible = false;

        const guia =
          this.viajeSeleccionado
            ?.numeroGuiaDespacho ?? '';

        this.viajes =
          this.viajes.filter(
            viaje =>
              viaje.id !==
              this.viajeSeleccionado?.id
          );

        this.viajeSeleccionado = null;

        this.viaje = {
          numeroGuiaDespacho: '',
          fecha: '',
          estado: '',
          clienteId: 0,
          camionId: 0,
          conductorId: 0,
          remolqueId: 0,
          origen: '',
          destino: '',
          comunaOrigen: '',
          comunaDestino: '',
          tipoCarga: '',
          kilometros: null,
          litrosCombustible: 0,
          costoCombustible: 0,
          tarifa: 0,
          observaciones: ''
        };

        this.mostrarExito(
          'Viaje eliminado correctamente',
          `El viaje con guía ${guia} fue eliminado del sistema.`
        );
      },

      error: error => {

        console.error(
          'Error al eliminar viaje:',
          error
        );

        this.eliminando = false;
        this.modalEliminarVisible = false;

        if (error.status === 409) {

          this.mostrarError(
            'No se puede eliminar el viaje',
            error.error ||
            'El viaje ya fue pagado y no puede eliminarse.'
          );

        } else if (error.status === 404) {

          this.mostrarError(
            'El viaje no existe',
            'El viaje que intentas eliminar ya no existe en el sistema.'
          );

        } else {

          this.mostrarError(
            'No se pudo eliminar el viaje',
            'Ocurrió un error al intentar eliminar el viaje.'
          );

        }

      }

    });

  }

  cerrarModalExito(): void {

    this.modalExitoVisible = false;

    /*
     * Después de aceptar el mensaje de éxito,
     * volvemos al listado de viajes.
     */
    this.router.navigate(['/viajes']);
  }

  cerrarModalError(): void {
    this.modalErrorVisible = false;
  }

  volver(): void {

    if (
      this.guardando ||
      this.eliminando
    ) {
      return;
    }

    this.router.navigate(['/viajes']);
  }

  private mostrarError(
    titulo: string,
    mensaje: string
  ): void {

    this.modalErrorTitulo = titulo;
    this.modalErrorMensaje = mensaje;
    this.modalErrorVisible = true;
  }

  private mostrarExito(
    titulo: string,
    mensaje: string
  ): void {

    this.modalExitoTitulo = titulo;
    this.modalExitoMensaje = mensaje;
    this.modalExitoVisible = true;
  }

  formatoEstadoViaje(estado: string): string {
    switch (estado) {
      case 'EnCurso':
        return 'En Curso';
  
      default:
        return estado;
    }
  }

}