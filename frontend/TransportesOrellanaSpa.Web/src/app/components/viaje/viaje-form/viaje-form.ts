import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiService } from '../../../core/services/api.service';

import { Cliente } from '../../../core/models/cliente';
import { Camion } from '../../../core/models/camion';
import { Conductor } from '../../../core/models/conductor';
import { Remolque } from '../../../core/models/remolque';

@Component({
  selector: 'app-viaje-form',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './viaje-form.html',
  styleUrl: './viaje-form.scss'
})
export class ViajeForm implements OnInit {

  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  clientes: Cliente[] = [];
  camiones: Camion[] = [];
  conductores: Conductor[] = [];
  remolques: Remolque[] = [];

  cargando = true;
  guardando = false;

  error = '';

  viaje = {
    numeroGuiaDespacho: '',
    fecha: '',
    estado: 'Completado',
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

  // Control de campos tocados
  camposTocados: Record<string, boolean> = {};

  // Modal de error
  modalErrorVisible = false;
  modalErrorTitulo = '';
  modalErrorMensaje = '';

  // Modal de éxito
  modalExitoVisible = false;
  modalExitoTitulo = '';
  modalExitoMensaje = '';

  ngOnInit(): void {
    this.cargarDatos();
  }

  private cargarDatos(): void {

    this.cargando = true;
    this.error = '';

    let clientesCargados = false;
    let camionesCargados = false;
    let conductoresCargados = false;
    let remolquesCargados = false;

    const comprobarCarga = (): void => {

      if (
        clientesCargados &&
        camionesCargados &&
        conductoresCargados &&
        remolquesCargados
      ) {
        this.cargando = false;
      }

    };

    this.api.getClientes().subscribe({
      next: clientes => {
        this.clientes = clientes;
        clientesCargados = true;
        comprobarCarga();
      },
      error: error => {
        console.error(
          'Error al cargar clientes:',
          error
        );

        this.error =
          'No fue posible cargar los clientes.';

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
        console.error(
          'Error al cargar camiones:',
          error
        );

        this.error =
          'No fue posible cargar los camiones.';

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
        console.error(
          'Error al cargar conductores:',
          error
        );

        this.error =
          'No fue posible cargar los conductores.';

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
        console.error(
          'Error al cargar remolques:',
          error
        );

        this.error =
          'No fue posible cargar los remolques.';

        remolquesCargados = true;
        comprobarCarga();
      }
    });

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

    if (this.guardando || this.cargando) {
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

    const viaje = {

      numeroGuiaDespacho:
        this.viaje.numeroGuiaDespacho.trim(),

      fecha:
        `${this.viaje.fecha}T00:00:00`,

      estado:
        this.viaje.estado,

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
        this.viaje.observaciones.trim()
    };

    console.log(
      'Creando viaje:',
      viaje
    );

    this.api.crearViaje(viaje).subscribe({

      next: resultado => {

        console.log(
          'Viaje creado correctamente:',
          resultado
        );

        this.guardando = false;

        this.mostrarExito(
          'Viaje creado correctamente',
          `El viaje con guía ${resultado.numeroGuiaDespacho} fue registrado exitosamente.`
        );

      },

      error: error => {

        console.error(
          'Error al crear viaje:',
          error
        );

        this.guardando = false;

        if (error.status === 409) {

          this.mostrarError(
            'No se pudo crear el viaje',
            error.error ||
            'Ya existe un viaje registrado con ese número de guía de despacho.'
          );

        } else {

          this.mostrarError(
            'No se pudo crear el viaje',
            'Ocurrió un error al intentar guardar el viaje. Inténtalo nuevamente.'
          );

        }

      }

    });

  }

  volver(): void {

    if (this.guardando) {
      return;
    }

    this.router.navigate([
      '/viajes'
    ]);

  }

  private mostrarError(
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

  private mostrarExito(
    titulo: string,
    mensaje: string
  ): void {

    this.modalExitoTitulo = titulo;
    this.modalExitoMensaje = mensaje;
    this.modalExitoVisible = true;

  }

  cerrarModalExito(): void {

    this.modalExitoVisible = false;

    this.router.navigate([
      '/viajes'
    ]);

  }

}