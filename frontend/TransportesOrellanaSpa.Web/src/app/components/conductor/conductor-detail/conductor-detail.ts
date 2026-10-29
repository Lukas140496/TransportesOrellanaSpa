
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../../core/services/api.service';
import { Conductor } from '../../../core/models/conductor';
import { DocumentoConductor, TipoDocumentoConductor } from '../../../core/models/documento-conductor';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PermissionService } from '../../../core/services/permission.service';

@Component({
  selector: 'app-conductor-detail',
  imports: [DatePipe, FormsModule, NgClass],
  templateUrl: './conductor-detail.html',
  styleUrl: './conductor-detail.scss'
})
export class ConductorDetail implements OnInit {

  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  readonly permissionService = inject(PermissionService);

  conductor: Conductor | null = null;

  cargando = true;
  error = '';

  // Documentos
  documentos: DocumentoConductor[] = [];
  cargandoDocumentos = false;
  procesandoDocumento = false;
  errorDocumentos = '';

  modalPrevisualizacionVisible = false;
  cargandoPrevisualizacion = false;

  documentoSeleccionadoUrl: SafeResourceUrl | null = null;
  documentoSeleccionadoUrlImagen: string | null = null;
  documentoSeleccionadoTitulo = '';
  documentoSeleccionadoActual: DocumentoConductor | null = null;
  mostrarFormularioCargaConductor = false;

  esPdf = false;
  private urlPrevisualizacionCruda: string | null = null;

  tipoDocumentoSeleccionado: TipoDocumentoConductor =
    'CedulaIdentidad';

  archivoSeleccionado: File | null = null;
  periodoLiquidacion = '';

  readonly tiposDocumento: {
    valor: TipoDocumentoConductor;
    etiqueta: string;
  }[] = [
      { valor: 'CedulaIdentidad', etiqueta: 'Cédula de identidad' },
      { valor: 'LicenciaConducir', etiqueta: 'Licencia de conducir' },
      { valor: 'HojaVidaConductor', etiqueta: 'Hoja de vida del conductor' },
      { valor: 'ContratoTrabajo', etiqueta: 'Contrato de trabajo' },
      { valor: 'LiquidacionSueldo', etiqueta: 'Liquidación de sueldo' },
      { valor: 'Finiquito', etiqueta: 'Finiquito' }
    ];

  get documentosVisibles(): DocumentoConductor[] {
    return this.documentos.filter(documento => {
      if (
        documento.tipoDocumento === 'LiquidacionSueldo' &&
        !this.conductor?.activo
      ) {
        return false;
      }

      return true;
    });
  }

  get tiposDocumentoDisponibles(): {
    valor: TipoDocumentoConductor;
    etiqueta: string;
  }[] {
    return this.tiposDocumento.filter(tipo => {
      if (
        tipo.valor === 'LiquidacionSueldo' &&
        !this.conductor?.activo
      ) {
        return false;
      }

      if (
        tipo.valor === 'Finiquito' &&
        this.conductor?.activo
      ) {
        return false;
      }

      return true;
    });
  }

  modalEstadoVisible = false;
  modalExitoVisible = false;
  modalErrorVisible = false;

  modalExitoTitulo = '';
  modalExitoMensaje = '';

  modalErrorTitulo = '';
  modalErrorMensaje = '';

  procesandoEstado = false;

  ngOnInit(): void {
    const rut = this.route.snapshot.paramMap.get('rut');

    if (!rut) {
      this.error = 'No se especificó un RUT.';
      this.cargando = false;
      return;
    }

    this.api.getConductorByRut(rut).subscribe({
      next: conductor => {
        this.conductor = conductor;
        this.cargando = false;
        this.cargarDocumentos();
      },
      error: error => {
        console.error('Error al cargar conductor:', error);
        this.error =
          'No fue posible cargar la información del conductor.';
        this.cargando = false;
      }
    });
  }

  // =========================
  // DOCUMENTOS
  // =========================

  cargarDocumentos(): void {
    if (!this.conductor) {
      return;
    }

    this.cargandoDocumentos = true;
    this.errorDocumentos = '';

    this.api.getDocumentosConductor(this.conductor.id).subscribe({
      next: documentos => {
        this.documentos = documentos;
        this.cargandoDocumentos = false;
        this.mostrarFormularioCargaConductor = false;
      },
      error: error => {
        console.error('Error al cargar documentos:', error);
        this.errorDocumentos =
          'No fue posible cargar los documentos del conductor.';
        this.cargandoDocumentos = false;
      }
    });
  }

  seleccionarArchivo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;

    this.archivoSeleccionado = null;

    if (!archivo) {
      return;
    }

    const tiposPermitidos = [
      'application/pdf',
      'image/jpeg',
      'image/png'
    ];

    const extensionValida = /\.(pdf|jpe?g|png)$/i.test(archivo.name);
    const tipoValido =
      tiposPermitidos.includes(archivo.type) || extensionValida;

    if (!tipoValido) {
      input.value = '';
      this.mostrarError(
        'Formato no permitido',
        'Selecciona un archivo PDF, JPG, JPEG o PNG.'
      );
      return;
    }

    if (archivo.size > 10 * 1024 * 1024) {
      input.value = '';
      this.mostrarError(
        'Archivo demasiado grande',
        'El tamaño máximo permitido es de 10 MB.'
      );
      return;
    }

    this.archivoSeleccionado = archivo;
  }

  cambiarTipoDocumento(): void {
    this.archivoSeleccionado = null;
    this.periodoLiquidacion = '';
  }

  subirDocumento(): void {
    if (!this.conductor || !this.archivoSeleccionado) {
      this.mostrarError(
        'Falta seleccionar un archivo',
        'Selecciona el documento que deseas cargar.'
      );
      return;
    }

    if (
      this.tipoDocumentoSeleccionado === 'LiquidacionSueldo' &&
      !this.periodoLiquidacion
    ) {
      this.mostrarError(
        'Falta el período',
        'Selecciona el mes y año de la liquidación.'
      );
      return;
    }

    if (
      this.tipoDocumentoSeleccionado === 'LiquidacionSueldo' &&
      !this.conductor.activo
    ) {
      this.mostrarError(
        'Conductor inactivo',
        'No se pueden cargar liquidaciones nuevas a un conductor inactivo.'
      );
      return;
    }

    if (
      this.tipoDocumentoSeleccionado === 'Finiquito' &&
      this.conductor.activo
    ) {
      this.mostrarError(
        'Conductor activo',
        'Para cargar un finiquito, primero debes desactivar al conductor.'
      );
      return;
    }

    this.procesandoDocumento = true;
    this.errorDocumentos = '';

    const periodo =
      this.tipoDocumentoSeleccionado === 'LiquidacionSueldo'
        ? this.periodoLiquidacion
        : undefined;

    this.api.subirDocumentoConductor(
      this.conductor.id,
      this.tipoDocumentoSeleccionado,
      this.archivoSeleccionado,
      periodo
    ).subscribe({
      next: documento => {
        this.procesandoDocumento = false;
        this.archivoSeleccionado = null;
        this.periodoLiquidacion = '';

        const input = document.getElementById(
          'archivo-conductor'
        ) as HTMLInputElement | null;

        if (input) {
          input.value = '';
        }

        this.cargarDocumentos();

        this.mostrarExito(
          'Documento cargado',
          `El archivo "${documento.nombreArchivo}" se guardó correctamente.`
        );
      },
      error: error => {
        console.error('Error al subir documento:', error);
        this.procesandoDocumento = false;

        const mensaje =
          typeof error?.error === 'string'
            ? error.error
            : error?.error?.mensaje ||
            'No fue posible cargar el documento.';

        this.mostrarError('Error al cargar documento', mensaje);
      }
    });
  }

  descargarDocumento(documento: DocumentoConductor): void {
    if (!this.conductor) {
      return;
    }

    this.api.descargarDocumentoConductor(
      this.conductor.id,
      documento.id
    ).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement('a');

        enlace.href = url;
        enlace.download = documento.nombreArchivo;
        enlace.click();

        URL.revokeObjectURL(url);
      },
      error: error => {
        console.error('Error al descargar documento:', error);
        this.mostrarError(
          'Error al descargar',
          'No fue posible descargar el documento seleccionado.'
        );
      }
    });
  }

  eliminarDocumento(documento: DocumentoConductor): void {
    if (
      !this.conductor ||
      this.procesandoDocumento
    ) {
      return;
    }

    const confirmar = window.confirm(
      `¿Deseas eliminar el documento "${documento.nombreArchivo}"?`
    );

    if (!confirmar) {
      return;
    }

    this.procesandoDocumento = true;

    this.api.eliminarDocumentoConductor(
      this.conductor.id,
      documento.id
    ).subscribe({
      next: () => {
        this.procesandoDocumento = false;
        this.documentos = this.documentos.filter(
          item => item.id !== documento.id
        );

        this.mostrarExito(
          'Documento eliminado',
          'El documento fue eliminado correctamente.'
        );
      },
      error: error => {
        console.error('Error al eliminar documento:', error);
        this.procesandoDocumento = false;
        this.mostrarError(
          'Error al eliminar',
          'No fue posible eliminar el documento seleccionado.'
        );
      }
    });
  }

  quitarArchivoSeleccionado(): void {
    this.archivoSeleccionado = null;
    
    const inputElement = document.getElementById('archivo-conductor') as HTMLInputElement;
    if (inputElement) {
      inputElement.value = '';
    }
  }

  obtenerFormatoArchivo(nombreArchivo: string | undefined): string {
    if (!nombreArchivo) return 'DOC';
    
    const ext = nombreArchivo.split('.').pop()?.toUpperCase() || '';
    if (['PDF'].includes(ext)) return 'PDF';
    if (['JPG', 'JPEG'].includes(ext)) return 'JPG';
    if (['PNG'].includes(ext)) return 'PNG';
    
    return ext.substring(0, 4) || 'DOC';
  }

  nombreTipoDocumento(tipo: TipoDocumentoConductor): string {
    return this.tiposDocumento.find(
      item => item.valor === tipo
    )?.etiqueta ?? tipo;
  }


  previsualizarDocumentoConductor(documento: DocumentoConductor): void {
    if (!this.conductor || this.cargandoPrevisualizacion) {
      return;
    }

    this.liberarUrlPrevisualizacion();

    this.documentoSeleccionadoTitulo = documento.nombreArchivo;
    this.documentoSeleccionadoActual = documento;

    const contentType = documento.contentType?.toLowerCase() ?? '';

    this.esPdf =
      contentType === 'application/pdf' ||
      documento.nombreArchivo.toLowerCase().endsWith('.pdf');

    this.cargandoPrevisualizacion = true;
    this.modalPrevisualizacionVisible = true;

    this.api.descargarDocumentoConductor(
      this.conductor.id,
      documento.id
    ).subscribe({
      next: blob => {
        const blobVisualizacion = new Blob(
          [blob],
          { type: contentType || blob.type || 'application/octet-stream' }
        );

        const url = URL.createObjectURL(blobVisualizacion);

        this.urlPrevisualizacionCruda = url;

        if (this.esPdf) {
          // Los PDF se muestran dentro de un iframe.
          this.documentoSeleccionadoUrl =
            this.sanitizer.bypassSecurityTrustResourceUrl(url);
        } else if (
          contentType.startsWith('image/') ||
          /\.(jpe?g|png)$/i.test(documento.nombreArchivo)
        ) {
          // Las imágenes se muestran con una URL normal.
          this.documentoSeleccionadoUrlImagen = url;
        } else {
          this.mostrarError(
            'Formato no compatible',
            'Este archivo no se puede previsualizar. Puedes descargarlo para abrirlo.'
          );
          this.cerrarModalPrevisualizacion();
          return;
        }

        this.cargandoPrevisualizacion = false;
      },
      error: error => {
        console.error('Error al previsualizar documento:', error);

        this.cargandoPrevisualizacion = false;
        this.cerrarModalPrevisualizacion();

        this.mostrarError(
          'Error al previsualizar',
          'No fue posible cargar el documento. Intenta descargarlo.'
        );
      }
    });
  }

  toggleFormularioCargaConductor(): void {
    this.mostrarFormularioCargaConductor = !this.mostrarFormularioCargaConductor;
  }

  cerrarModalPrevisualizacion(): void {
    this.modalPrevisualizacionVisible = false;
    this.cargandoPrevisualizacion = false;

    this.liberarUrlPrevisualizacion();

    this.documentoSeleccionadoUrl = null;
    this.documentoSeleccionadoUrlImagen = null;
    this.documentoSeleccionadoActual = null;
    this.documentoSeleccionadoTitulo = '';
    this.esPdf = false;
  }

  descargarDesdeModal(): void {
    if (this.documentoSeleccionadoActual) {
      this.descargarDocumento(this.documentoSeleccionadoActual);
    }
  }

  private liberarUrlPrevisualizacion(): void {
    if (this.urlPrevisualizacionCruda) {
      URL.revokeObjectURL(this.urlPrevisualizacionCruda);
      this.urlPrevisualizacionCruda = null;
    }

    this.documentoSeleccionadoUrl = null;
    this.documentoSeleccionadoUrlImagen = null;
  }

  // =========================
  // CONDUCTOR
  // =========================

  editarConductor(): void {
    if (!this.conductor) {
      return;
    }

    this.router.navigate([
      '/conductores/modificar',
      this.conductor.rut
    ]);
  }

  volver(): void {
    this.router.navigate(['/conductores']);
  }

  abrirModalEstado(): void {
    if (!this.conductor || this.procesandoEstado) {
      return;
    }

    this.modalEstadoVisible = true;
  }

  cerrarModalEstado(): void {
    if (this.procesandoEstado) {
      return;
    }

    this.modalEstadoVisible = false;
  }

  confirmarCambioEstado(): void {
    if (!this.conductor || this.procesandoEstado) {
      return;
    }

    this.procesandoEstado = true;

    const estabaActivo = this.conductor.activo;
    const rut = this.conductor.rut;

    const operacion = estabaActivo
      ? this.api.desactivarConductor(rut)
      : this.api.activarConductor(rut);

    operacion.subscribe({
      next: resultado => {
        console.log(
          estabaActivo
            ? 'Conductor desactivado correctamente:'
            : 'Conductor activado correctamente:',
          resultado
        );

        this.procesandoEstado = false;
        this.modalEstadoVisible = false;

        if (this.conductor) {
          this.conductor = {
            ...this.conductor,
            activo: !estabaActivo
          };
        }

        this.cargarDocumentos();

        this.mostrarExito(
          estabaActivo
            ? 'Conductor desactivado'
            : 'Conductor activado',
          estabaActivo
            ? `El conductor ${rut} fue desactivado correctamente y ya no podrá utilizarse para nuevos viajes.`
            : `El conductor ${rut} fue activado correctamente y podrá utilizarse para nuevos viajes.`
        );
      },
      error: error => {
        console.error('Error al cambiar estado del conductor:', error);

        this.procesandoEstado = false;
        this.modalEstadoVisible = false;

        if (error?.status === 409) {
          this.mostrarError(
            estabaActivo
              ? 'Conductor ya desactivado'
              : 'Conductor ya activo',
            estabaActivo
              ? 'El conductor seleccionado ya se encuentra inactivo.'
              : 'El conductor seleccionado ya se encuentra activo.'
          );
          return;
        }

        if (error?.status === 404) {
          this.mostrarError(
            'Conductor no encontrado',
            'El conductor seleccionado ya no existe.'
          );
          return;
        }

        this.mostrarError(
          estabaActivo
            ? 'No se pudo desactivar el conductor'
            : 'No se pudo activar el conductor',
          error?.error ||
          'Ocurrió un error al intentar cambiar el estado del conductor.'
        );
      }
    });
  }

  private mostrarExito(titulo: string, mensaje: string): void {
    this.modalExitoTitulo = titulo;
    this.modalExitoMensaje = mensaje;
    this.modalExitoVisible = true;
  }

  cerrarModalExito(): void {
    this.modalExitoVisible = false;
  }

  private mostrarError(titulo: string, mensaje: string): void {
    this.modalErrorTitulo = titulo;
    this.modalErrorMensaje = mensaje;
    this.modalErrorVisible = true;
  }

  cerrarModalError(): void {
    this.modalErrorVisible = false;
  }
}
