
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DatePipe } from '@angular/common';

import { ApiService } from '../../../core/services/api.service';
import { Remolque } from '../../../core/models/remolque';
import { PermissionService } from '../../../core/services/permission.service';
import {
  DocumentoRemolque,
  TipoDocumentoRemolque
} from '../../../core/models/documento-remolque';

@Component({
  selector: 'app-remolque-detail',
  imports: [DatePipe],
  templateUrl: './remolque-detail.html',
  styleUrl: './remolque-detail.scss'
})
export class RemolqueDetail implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);

  readonly permissionService = inject(PermissionService);

  remolque: Remolque | null = null;

  cargando = true;
  error = '';

  modalEstadoVisible = false;
  modalExitoVisible = false;
  modalErrorVisible = false;

  modalExitoTitulo = '';
  modalExitoMensaje = '';

  modalErrorTitulo = '';
  modalErrorMensaje = '';

  procesandoEstado = false;

  // Documentos del remolque
  readonly tiposDocumentos: {
    tipo: TipoDocumentoRemolque;
    titulo: string;
    descripcion: string;
  }[] = [
    {
      tipo: 'PermisoCirculacion',
      titulo: 'Permiso de circulación',
      descripcion: 'Documento que acredita el permiso de circulación del remolque.'
    },
    {
      tipo: 'Seguro',
      titulo: 'Seguro Obligatorio (SOAP)',
      descripcion: 'Póliza o certificado del seguro obligatorio vigente.'
    },
    {
      tipo: 'RevisionTecnica',
      titulo: 'Revisión técnica',
      descripcion: 'Certificado de revisión técnica del remolque.'
    }
  ];

  documentos: DocumentoRemolque[] = [];
  cargandoDocumentos = false;
  errorDocumentos = '';
  documentoSubiendo: TipoDocumentoRemolque | null = null;
  documentoEliminando: number | null = null;

  // Vista previa
  modalVistaPreviaVisible = false;
  cargandoVistaPrevia = false;
  errorVistaPrevia = '';
  documentoVistaPrevia: DocumentoRemolque | null = null;
  urlVistaPrevia = '';
  urlPdfSegura: SafeResourceUrl | null = null;

  private objectUrlActual: string | null = null;

  ngOnInit(): void {
    const patente = this.route.snapshot.paramMap.get('patente');

    if (!patente) {
      this.error = 'No se especificó una patente.';
      this.cargando = false;
      return;
    }

    this.api.getRemolqueByPatente(patente).subscribe({
      next: remolque => {
        this.remolque = remolque;
        this.cargando = false;
        this.cargarDocumentos();
      },
      error: error => {
        console.error('Error al cargar remolque:', error);
        this.error = 'No fue posible cargar la información del remolque.';
        this.cargando = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.liberarObjectUrl();
  }

  volver(): void {
    this.router.navigate(['/remolques']);
  }

  abrirSelectorArchivo(tipo: TipoDocumentoRemolque): void {
    const inputs = document.querySelectorAll<HTMLInputElement>(
      '.input-archivo-oculto'
    );
  
    const indice = this.tiposDocumentos.findIndex(
      documento => documento.tipo === tipo
    );
  
    inputs[indice]?.click();
  }

  editarRemolque(): void {
    if (!this.remolque) {
      return;
    }

    this.router.navigate([
      '/remolques/modificar',
      this.remolque.patente
    ]);
  }

  abrirModalEstado(): void {
    if (!this.remolque || this.procesandoEstado) {
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
    if (!this.remolque || this.procesandoEstado) {
      return;
    }

    this.procesandoEstado = true;

    const estabaActivo = this.remolque.activa;
    const patente = this.remolque.patente;

    const operacion = estabaActivo
      ? this.api.desactivarRemolque(patente)
      : this.api.activarRemolque(patente);

    operacion.subscribe({
      next: resultado => {
        console.log(
          estabaActivo
            ? 'Remolque desactivado correctamente:'
            : 'Remolque activado correctamente:',
          resultado
        );

        this.procesandoEstado = false;
        this.modalEstadoVisible = false;

        if (this.remolque) {
          this.remolque = {
            ...this.remolque,
            activa: !estabaActivo
          };
        }

        this.mostrarExito(
          estabaActivo ? 'Remolque desactivado' : 'Remolque activado',
          estabaActivo
            ? `El remolque ${patente} fue desactivado correctamente y ya no podrá utilizarse para nuevos viajes.`
            : `El remolque ${patente} fue activado correctamente y podrá utilizarse para nuevos viajes.`
        );
      },
      error: error => {
        console.error('Error al cambiar estado del remolque:', error);

        this.procesandoEstado = false;
        this.modalEstadoVisible = false;

        if (error?.status === 409) {
          this.mostrarError(
            estabaActivo ? 'Remolque ya desactivado' : 'Remolque ya activo',
            estabaActivo
              ? 'El remolque seleccionado ya se encuentra inactivo.'
              : 'El remolque seleccionado ya se encuentra activo.'
          );
          return;
        }

        if (error?.status === 404) {
          this.mostrarError(
            'Remolque no encontrado',
            'El remolque seleccionado ya no existe.'
          );
          return;
        }

        this.mostrarError(
          estabaActivo
            ? 'No se pudo desactivar el remolque'
            : 'No se pudo activar el remolque',
          error?.error ||
            'Ocurrió un error al intentar cambiar el estado del remolque.'
        );
      }
    });
  }

  // =========================
  // DOCUMENTOS
  // =========================

  cargarDocumentos(): void {
    if (!this.remolque) {
      return;
    }

    this.cargandoDocumentos = true;
    this.errorDocumentos = '';

    this.api.getDocumentosRemolque(this.remolque.id).subscribe({
      next: documentos => {
        this.documentos = documentos ?? [];
        this.cargandoDocumentos = false;
      },
      error: error => {
        console.error('Error al cargar documentos del remolque:', error);
        this.errorDocumentos =
          'No fue posible cargar los documentos del remolque.';
        this.cargandoDocumentos = false;
      }
    });
  }

  obtenerDocumento(
    tipo: TipoDocumentoRemolque
  ): DocumentoRemolque | undefined {
    return this.documentos.find(
      documento => documento.tipoDocumento === tipo
    );
  }

  seleccionarArchivo(
    tipo: TipoDocumentoRemolque,
    evento: Event
  ): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];

    if (!archivo) {
      return;
    }

    // Permite seleccionar nuevamente el mismo archivo.
    input.value = '';

    const extensionesPermitidas = ['pdf', 'jpg', 'jpeg', 'png'];
    const extension = archivo.name.split('.').pop()?.toLowerCase() ?? '';

    if (!extensionesPermitidas.includes(extension)) {
      this.mostrarError(
        'Formato no permitido',
        'Solo puedes subir archivos PDF, JPG, JPEG o PNG.'
      );
      return;
    }

    if (archivo.size > 10 * 1024 * 1024) {
      this.mostrarError(
        'Archivo demasiado grande',
        'El tamaño máximo permitido por documento es de 10 MB.'
      );
      return;
    }

    if (!this.remolque || this.documentoSubiendo) {
      return;
    }

    const documentoExistente = this.obtenerDocumento(tipo);
    const mensaje = documentoExistente
      ? `Ya existe un documento para "${this.nombreTipoDocumento(tipo)}". ¿Quieres reemplazarlo por el archivo seleccionado?`
      : `¿Quieres subir el archivo como "${this.nombreTipoDocumento(tipo)}"?`;

    if (!window.confirm(mensaje)) {
      return;
    }

    this.documentoSubiendo = tipo;

    this.api.subirDocumentoRemolque(
      this.remolque.id,
      tipo,
      archivo
    ).subscribe({
      next: () => {
        this.documentoSubiendo = null;
        this.cargarDocumentos();

        this.mostrarExito(
          documentoExistente ? 'Documento reemplazado' : 'Documento cargado',
          documentoExistente
            ? `El documento "${this.nombreTipoDocumento(tipo)}" fue reemplazado correctamente.`
            : `El documento "${this.nombreTipoDocumento(tipo)}" fue cargado correctamente.`
        );
      },
      error: error => {
        console.error('Error al subir documento del remolque:', error);
        this.documentoSubiendo = null;

        this.mostrarError(
          'No se pudo subir el documento',
          error?.error?.message ||
            error?.error ||
            'Ocurrió un error al subir el documento. Inténtalo nuevamente.'
        );
      }
    });
  }

  abrirVistaPrevia(documento: DocumentoRemolque): void {
    if (!this.remolque) {
      return;
    }

    this.cerrarVistaPrevia();

    this.documentoVistaPrevia = documento;
    this.modalVistaPreviaVisible = true;
    this.cargandoVistaPrevia = true;
    this.errorVistaPrevia = '';

    this.api.descargarDocumentoRemolque(
      this.remolque.id,
      documento.id
    ).subscribe({
      next: blob => {
        this.liberarObjectUrl();

        this.objectUrlActual = URL.createObjectURL(blob);
        this.urlVistaPrevia = this.objectUrlActual;

        if (this.esPdf(documento)) {
          this.urlPdfSegura =
            this.sanitizer.bypassSecurityTrustResourceUrl(
              this.objectUrlActual
            );
        }

        this.cargandoVistaPrevia = false;
      },
      error: error => {
        console.error('Error al abrir documento del remolque:', error);
        this.cargandoVistaPrevia = false;
        this.errorVistaPrevia =
          'No fue posible visualizar el documento. Puedes intentar descargarlo.';
      }
    });
  }

  cerrarVistaPrevia(): void {
    this.modalVistaPreviaVisible = false;
    this.documentoVistaPrevia = null;
    this.urlVistaPrevia = '';
    this.urlPdfSegura = null;
    this.cargandoVistaPrevia = false;
    this.errorVistaPrevia = '';
    this.liberarObjectUrl();
  }

  descargarDocumento(documento: DocumentoRemolque): void {
    if (!this.remolque) {
      return;
    }

    this.api.descargarDocumentoRemolque(
      this.remolque.id,
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
          'No se pudo descargar el documento',
          'Ocurrió un error al descargar el archivo. Inténtalo nuevamente.'
        );
      }
    });
  }

  eliminarDocumento(documento: DocumentoRemolque): void {
    if (!this.remolque || this.documentoEliminando !== null) {
      return;
    }

    if (!this.permissionService.tienePermiso('REMOLQUES_EDITAR')) {
      this.mostrarError(
        'Acceso denegado',
        'No tienes permiso para eliminar documentos de remolques.'
      );
      return;
    }

    if (!window.confirm(
      `¿Estás seguro de eliminar "${documento.nombreArchivo}"? Esta acción no se puede deshacer.`
    )) {
      return;
    }

    this.documentoEliminando = documento.id;

    this.api.eliminarDocumentoRemolque(
      this.remolque.id,
      documento.id
    ).subscribe({
      next: () => {
        this.documentoEliminando = null;
        this.documentos = this.documentos.filter(
          item => item.id !== documento.id
        );

        if (
          this.documentoVistaPrevia?.id === documento.id
        ) {
          this.cerrarVistaPrevia();
        }

        this.mostrarExito(
          'Documento eliminado',
          `El documento "${documento.nombreArchivo}" fue eliminado correctamente.`
        );
      },
      error: error => {
        console.error('Error al eliminar documento:', error);
        this.documentoEliminando = null;

        this.mostrarError(
          'No se pudo eliminar el documento',
          error?.error?.message ||
            error?.error ||
            'Ocurrió un error al eliminar el documento. Inténtalo nuevamente.'
        );
      }
    });
  }

  nombreTipoDocumento(tipo: TipoDocumentoRemolque): string {
    return this.tiposDocumentos.find(
      item => item.tipo === tipo
    )?.titulo ?? tipo;
  }

  esPdf(documento: DocumentoRemolque): boolean {
    return documento.contentType?.toLowerCase() === 'application/pdf' ||
      documento.nombreArchivo.toLowerCase().endsWith('.pdf');
  }

  esImagen(documento: DocumentoRemolque): boolean {
    return documento.contentType?.toLowerCase().startsWith('image/') ||
      /\.(jpg|jpeg|png)$/i.test(documento.nombreArchivo);
  }

  private liberarObjectUrl(): void {
    if (this.objectUrlActual) {
      URL.revokeObjectURL(this.objectUrlActual);
      this.objectUrlActual = null;
    }
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
    this.modalErrorMensaje = typeof mensaje === 'string'
      ? mensaje
      : 'Ocurrió un error inesperado.';
    this.modalErrorVisible = true;
  }

  cerrarModalError(): void {
    this.modalErrorVisible = false;
  }
}
