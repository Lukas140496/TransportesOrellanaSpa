import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService } from '../../../core/services/api.service';
import { Camion } from '../../../core/models/camion';
import { PermissionService } from '../../../core/services/permission.service';
import { DocumentoCamion, TipoDocumentoCamion } from '../../../core/models/documento-camion';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-camion-detail',
  imports: [DatePipe],
  templateUrl: './camion-detail.html',
  styleUrl: './camion-detail.scss'
})
export class CamionDetail implements OnInit {

  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly permissionService = inject(PermissionService);
  private readonly sanitizer = inject(DomSanitizer);

  documentos: DocumentoCamion[] = [];
  cargandoDocumentos = false;
  subiendoDocumento = false;
  eliminandoDocumento = false;

  readonly tiposDocumentos: {
    tipo: TipoDocumentoCamion;
    nombre: string;
  }[] = [
      { tipo: 'PermisoCirculacion', nombre: 'Permiso de circulación' },
      { tipo: 'SeguroObligatorio', nombre: 'Seguro obligatorio (SOAP)' },
      { tipo: 'RevisionTecnica', nombre: 'Revisión técnica' },
      { tipo: 'RevisionGases', nombre: 'Certificado de gases' }
    ];

  camion: Camion | null = null;

  cargando = true;

  error = '';

  modalConfirmacionVisible = false;
  modalErrorVisible = false;
  modalErrorTitulo = '';
  modalErrorMensaje = '';
  modalExitoVisible = false;
  modalExitoTitulo = '';
  modalExitoMensaje = '';
  procesandoEstado = false;

  // =======================================
  // MODAL DE PREVISUALIZACIÓN DE DOCUMENTOS
  // =======================================

  modalPrevisualizacionVisible = false;
  documentoSeleccionadoUrl: string | SafeResourceUrl | null = null;
  documentoSeleccionadoTitulo = '';
  documentoSeleccionadoTipoActual: string | null = null;
  esPdf = false;
  urlPrevisualizacion: string | null = null;

  ngOnInit(): void {

    const patente =
      this.route.snapshot.paramMap.get('patente');

    if (!patente) {
      this.error =
        'No se indicó la patente del camión.';

      this.cargando = false;

      return;
    }

    this.api.getCamiones().subscribe({

      next: camiones => {

        this.camion =
          camiones.find(
            camion =>
              camion.patente.toUpperCase() ===
              patente.toUpperCase()
          ) ?? null;

        if (this.camion) {
          this.cargarDocumentos();
        }

        if (!this.camion) {

          this.error =
            'No se encontró el camión solicitado.';

        }

        this.cargando = false;

      },

      error: error => {

        console.error(
          'Error al cargar el detalle del camión:',
          error
        );

        this.error =
          'No fue posible cargar la información del camión.';

        this.cargando = false;

      }

    });
  }

  cargarDocumentos(): void {
    if (!this.camion) return;

    this.cargandoDocumentos = true;

    this.api.getDocumentosCamion(this.camion.id).subscribe({
      next: (documentos) => {
        this.documentos = documentos;
        this.cargandoDocumentos = false;
      },
      error: () => {
        this.documentos = [];
        this.cargandoDocumentos = false;
        this.mostrarError(
          'Error al cargar documentos',
          'No fue posible cargar los documentos del camión.'
        );
      }
    });
  }

  obtenerDocumento(
    tipo: TipoDocumentoCamion
  ): DocumentoCamion | undefined {
    return this.documentos.find(
      documento => documento.tipoDocumento === tipo
    );
  }

  seleccionarArchivo(
    evento: Event,
    tipo: TipoDocumentoCamion
  ): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];

    if (!archivo || !this.camion) return;

    const extensionesPermitidas = ['pdf', 'jpg', 'jpeg', 'png'];
    const extension = archivo.name.split('.').pop()?.toLowerCase();

    if (!extension || !extensionesPermitidas.includes(extension)) {
      this.mostrarError(
        'Formato no permitido',
        'Selecciona un archivo PDF, JPG o PNG.'
      );
      input.value = '';
      return;
    }

    if (archivo.size > 10 * 1024 * 1024) {
      this.mostrarError(
        'Archivo demasiado grande',
        'El archivo no puede superar los 10 MB.'
      );
      input.value = '';
      return;
    }

    this.subirArchivo(tipo, archivo, input);
  }

  private subirArchivo(
    tipo: TipoDocumentoCamion,
    archivo: File,
    input: HTMLInputElement
  ): void {
    if (!this.camion) return;

    this.subiendoDocumento = true;

    this.api.subirDocumentoCamion(
      this.camion.id,
      tipo,
      archivo
    ).subscribe({
      next: () => {
        this.subiendoDocumento = false;
        input.value = '';

        this.cargarDocumentos();
        this.mostrarExito(
          'Documento cargado',
          'El documento se ha cargado correctamente.'
        );
      },
      error: (error) => {
        this.subiendoDocumento = false;
        input.value = '';

        const mensaje =
          typeof error.error === 'string'
            ? error.error
            : 'No fue posible cargar el documento.';

        this.mostrarError(
          'Error al cargar documento',
          mensaje
        );
      }
    });
  }

  descargarDocumento(
    tipo: TipoDocumentoCamion
  ): void {
    if (!this.camion) return;

    const documento = this.obtenerDocumento(tipo);

    if (!documento) {
      this.mostrarError(
        'Documento no disponible',
        'No existe un archivo para descargar.'
      );
      return;
    }

    this.api.descargarDocumentoCamion(
      this.camion.id,
      tipo
    ).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement('a');

        enlace.href = url;
        enlace.download = documento.nombreArchivo;
        enlace.style.display = 'none';

        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();

        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
      error: () => {
        this.mostrarError(
          'Error al descargar documento',
          'No fue posible descargar el documento.'
        );
      }
    });
  }

  eliminarDocumento(
    tipo: TipoDocumentoCamion
  ): void {
    if (!this.camion) return;

    const documento = this.obtenerDocumento(tipo);

    if (!documento) return;

    const confirmar = window.confirm(
      `¿Estás seguro de eliminar "${documento.nombreArchivo}"?`
    );

    if (!confirmar) return;

    this.eliminandoDocumento = true;

    this.api.eliminarDocumentoCamion(
      this.camion.id,
      tipo
    ).subscribe({
      next: () => {
        this.eliminandoDocumento = false;
        this.documentos = this.documentos.filter(
          item => item.tipoDocumento !== tipo
        );

        this.mostrarExito(
          'Documento eliminado',
          'El documento se ha eliminado correctamente.'
        );
      },
      error: () => {
        this.eliminandoDocumento = false;
        this.mostrarError(
          'Error al eliminar documento',
          'No fue posible eliminar el documento.'
        );
      }
    });
  }

  previsualizarDocumento(
    tipo: TipoDocumentoCamion,
    archivo: DocumentoCamion
  ): void {
    if (!this.camion || this.subiendoDocumento || this.eliminandoDocumento) {
      return;
    }

    this.documentoSeleccionadoTitulo =
      archivo.nombreArchivo || 'Documento';

    this.documentoSeleccionadoTipoActual = tipo;
    this.documentoSeleccionadoUrl = null;

    const nombre = (archivo.nombreArchivo || '').toLowerCase();
    const contenido = (archivo as any).tipoContenido?.toLowerCase() || '';

    this.esPdf =
      nombre.endsWith('.pdf') ||
      contenido.includes('application/pdf');

    // Abrimos el modal inmediatamente.
    this.modalPrevisualizacionVisible = true;

    // Obtenemos el archivo real desde la API.
    this.api.descargarDocumentoCamion(
      this.camion.id,
      tipo
    ).subscribe({
      next: (blob: Blob) => {
        if (!blob || blob.size === 0) {
          this.mostrarError(
            'Documento vacío',
            'El archivo descargado no contiene información.'
          );
          this.cerrarModalPrevisualizacion();
          return;
        }

        // Determinamos el formato usando también el contenido recibido.
        if (
          blob.type === 'application/pdf' ||
          blob.type === 'image/jpeg' ||
          blob.type === 'image/png'
        ) {
          this.esPdf = blob.type === 'application/pdf';
        }

        // Liberamos cualquier URL anterior.
        this.liberarUrlPrevisualizacion();

        // Generamos una URL local para visualizar el archivo.
        this.urlPrevisualizacion = URL.createObjectURL(blob);

        if (this.esPdf) {
          this.documentoSeleccionadoUrl =
            this.sanitizer.bypassSecurityTrustResourceUrl(
              this.urlPrevisualizacion
            );
        } else {
          this.documentoSeleccionadoUrl =
            this.urlPrevisualizacion;
        }
      },
      error: (error) => {
        console.error('Error al previsualizar documento:', error);

        this.mostrarError(
          'Error al visualizar documento',
          'No fue posible obtener el archivo. Intenta descargarlo para comprobar si está disponible.'
        );

        this.cerrarModalPrevisualizacion();
      }
    });
  }

  private liberarUrlPrevisualizacion(): void {
    if (this.urlPrevisualizacion) {
      URL.revokeObjectURL(this.urlPrevisualizacion);
      this.urlPrevisualizacion = null;
    }
  }

  cerrarModalPrevisualizacion(): void {
    this.modalPrevisualizacionVisible = false;
  
    this.liberarUrlPrevisualizacion();
  
    this.documentoSeleccionadoUrl = null;
    this.documentoSeleccionadoTipoActual = null;
    this.documentoSeleccionadoTitulo = '';
    this.esPdf = false;
  }

  descargarDocumentoDesdeModal(): void {
    if (this.documentoSeleccionadoTipoActual) {
      this.descargarDocumento(this.documentoSeleccionadoTipoActual as any);
    }
  }

  editarCamion(): void {

    if (!this.camion) {
      return;
    }

    this.router.navigate([
      '/camiones/modificar',
      this.camion.patente
    ]);

  }

  // =========================
  // CAMBIO DE ESTADO
  // =========================

  mostrarConfirmacionEstado(): void {

    if (!this.camion || this.procesandoEstado) {
      return;
    }

    this.modalConfirmacionVisible = true;
  }


  cerrarModalConfirmacion(): void {

    if (this.procesandoEstado) {
      return;
    }

    this.modalConfirmacionVisible = false;
  }


  confirmarCambioEstado(): void {

    if (!this.camion || this.procesandoEstado) {
      return;
    }

    this.procesandoEstado = true;

    const estabaActivo = this.camion.activo;

    const operacion = estabaActivo
      ? this.api.desactivarCamion(this.camion.patente)
      : this.api.activarCamion(this.camion.patente);

    operacion.subscribe({

      next: resultado => {

        console.log(
          estabaActivo
            ? 'Camión desactivado correctamente:'
            : 'Camión activado correctamente:',
          resultado
        );

        this.procesandoEstado = false;

        this.modalConfirmacionVisible = false;

        this.camion = resultado;

        if (estabaActivo) {

          this.mostrarExito(
            'Camión desactivado correctamente',
            `El camión ${resultado.patente} fue desactivado y ya no podrá utilizarse para nuevos viajes.`
          );

        } else {

          this.mostrarExito(
            'Camión activado correctamente',
            `El camión ${resultado.patente} fue activado nuevamente y podrá utilizarse para nuevos viajes.`
          );

        }

      },

      error: error => {

        console.error(
          'Error al cambiar estado del camión:',
          error
        );

        this.procesandoEstado = false;

        this.modalConfirmacionVisible = false;

        this.mostrarError(
          estabaActivo
            ? 'No se pudo desactivar el camión'
            : 'No se pudo activar el camión',
          error.error ||
          'Ocurrió un error al intentar cambiar el estado del camión.'
        );

      }

    });

  }

  volver(): void {

    this.router.navigate([
      '/camiones'
    ]);

  }

  // =========================
  // MODAL DE ERROR
  // =========================

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


  // =========================
  // MODAL DE ÉXITO
  // =========================

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

  }

}