
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiService } from '../../../core/services/api.service';
import { Camion } from '../../../core/models/camion';
import { PermissionService } from '../../../core/services/permission.service';

@Component({
  selector: 'app-camion-list',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './camion-list.html',
  styleUrl: './camion-list.scss'
})
export class CamionList implements OnInit {

  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  readonly permissionService = inject(PermissionService);

  camiones: Camion[] = [];

  cargando = true;
  exportando = false;
  error = '';

  busqueda = '';
  filtroEstado: 'todos' | 'activos' | 'inactivos' = 'todos';

  ngOnInit(): void {

    this.api.getCamiones().subscribe({

      next: camiones => {

        this.camiones = camiones;
        this.cargando = false;

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

  get camionesFiltrados(): Camion[] {

    const texto =
      this.busqueda
        .trim()
        .toLowerCase();

    return this.camiones.filter(camion => {

      const coincideBusqueda =
        !texto ||
        camion.patente
          .toLowerCase()
          .includes(texto) ||
        camion.marca
          .toLowerCase()
          .includes(texto) ||
        camion.modelo
          .toLowerCase()
          .includes(texto);

      const coincideEstado =
        this.filtroEstado === 'todos' ||
        (
          this.filtroEstado === 'activos' &&
          camion.activo
        ) ||
        (
          this.filtroEstado === 'inactivos' &&
          !camion.activo
        );

      return coincideBusqueda && coincideEstado;

    });

  }

  get cantidadActivos(): number {

    return this.camiones.filter(
      camion => camion.activo
    ).length;

  }

  get cantidadInactivos(): number {

    return this.camiones.filter(
      camion => !camion.activo
    ).length;

  }

  get revisionesAlDia(): number {

    return this.camiones.filter(
      camion => camion.revisionTecnica.estado === 'AlDia'
    ).length;

  }

  get revisionesVencidas(): number {

    return this.camiones.filter(
      camion => camion.revisionTecnica.estado === 'Vencido'
    ).length;

  }

  textoEstadoDocumento(estado: string): string {

    switch (estado) {

      case 'AlDia':
        return 'Al día';

      case 'PorVencer':
        return 'Por vencer';

      case 'Vencido':
        return 'Vencido';

      case 'SinRegistro':
      default:
        return 'Sin registro';

    }

  }

  cambiarFiltroEstado(
    filtro: 'todos' | 'activos' | 'inactivos'
  ): void {

    this.filtroEstado = filtro;

  }

  limpiarFiltros(): void {

    this.busqueda = '';
    this.filtroEstado = 'todos';

  }

  hayFiltrosAplicados(): boolean {

    return (
      this.busqueda.trim().length > 0 ||
      this.filtroEstado !== 'todos'
    );

  }

  limpiarBusqueda(): void {

    this.busqueda = '';

  }

  verDetalle(patente: string): void {

    this.router.navigate([
      '/camiones',
      patente
    ]);

  }

  nuevoCamion(): void {

    this.router.navigate([
      '/camiones/nuevo'
    ]);

  }

  async exportarExcel(): Promise<void> {

    if (
      this.exportando ||
      this.cargando ||
      this.camionesFiltrados.length === 0
    ) {
      return;
    }

    this.exportando = true;

    try {

      const ExcelJSModule = await import('exceljs');
      const ExcelJS = ExcelJSModule.default ?? ExcelJSModule;
      const workbook = new ExcelJS.Workbook();

      workbook.creator = 'Flota360';
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet('Camiones');

      worksheet.columns = [
        { header: 'Patente', key: 'patente', width: 16 },
        { header: 'Marca', key: 'marca', width: 20 },
        { header: 'Modelo', key: 'modelo', width: 22 },
        { header: 'Año', key: 'ano', width: 12 },
        { header: 'Tipo', key: 'tipo', width: 20 },
        { header: 'Color', key: 'color', width: 16 },
        { header: 'Capacidad', key: 'capacidad', width: 16 },
        { header: 'Motor', key: 'motor', width: 20 },
        { header: 'Caballos', key: 'caballos', width: 14 },
        { header: 'Cilindrada', key: 'cilindrada', width: 16 },
        { header: 'Transmisión', key: 'transmision', width: 18 },
        { header: 'Conductores habituales', key: 'conductores', width: 24 },
        { header: 'Cantidad de conductores', key: 'cantidadConductores', width: 22 },
        { header: 'Remolques asociados', key: 'remolques', width: 24 },
        { header: 'Cantidad de remolques', key: 'cantidadRemolques', width: 22 },
        { header: 'Estado revisión técnica', key: 'estadoRevision', width: 24 },
        { header: 'Vencimiento revisión técnica', key: 'fechaRevision', width: 24 },
        { header: 'Estado certificado de gases', key: 'estadoGases', width: 26 },
        { header: 'Estado permiso circulación', key: 'estadoPermiso', width: 25 },
        { header: 'Vencimiento permiso circulación', key: 'fechaPermiso', width: 26 },
        { header: 'Estado seguro obligatorio', key: 'estadoSeguro', width: 25 },
        { header: 'Vencimiento seguro obligatorio', key: 'fechaSeguro', width: 26 },
        { header: 'Estado camión', key: 'estado', width: 16 }
      ];

      const camiones = this.camionesFiltrados;

      camiones.forEach(camion => {

        worksheet.addRow({

          patente: camion.patente,
          marca: camion.marca,
          modelo: camion.modelo,
          ano: camion.ano,
          tipo: camion.tipo,
          color: camion.color,
          capacidad: camion.capacidad,
          motor: camion.motor,
          caballos: camion.caballos,
          cilindrada: camion.cilindrada,
          transmision: camion.transmision,

          conductores: camion.conductoresHabituales
            .map(conductor =>
              `${conductor.nombres} ${conductor.apellidoPaterno} ${conductor.apellidoMaterno}`.trim()
            )
            .join(', '),

          cantidadConductores: camion.conductoresHabituales.length,

          remolques: camion.remolques
            .map(remolque => remolque.patente)
            .join(', '),

          cantidadRemolques: camion.remolques.length,

          estadoRevision: this.textoEstadoDocumento(
            camion.revisionTecnica.estado
          ),

          fechaRevision: camion.fechaRevisionTecnica
            ? new Date(`${camion.fechaRevisionTecnica.substring(0, 10)}T00:00:00`)
            : null,

          estadoGases: this.textoEstadoDocumento(
            camion.certificadoGases.estado
          ),

          estadoPermiso: this.textoEstadoDocumento(
            camion.permisoCirculacion.estado
          ),

          fechaPermiso: camion.fechaPermisoCirculacion
            ? new Date(`${camion.fechaPermisoCirculacion.substring(0, 10)}T00:00:00`)
            : null,

          estadoSeguro: this.textoEstadoDocumento(
            camion.seguroObligatorio.estado
          ),

          fechaSeguro: camion.fechaSeguroObligatorio
            ? new Date(`${camion.fechaSeguroObligatorio.substring(0, 10)}T00:00:00`)
            : null,

          estado: camion.activo ? 'Activo' : 'Inactivo'

        });

      });

      // Estilo del encabezado
      const encabezado = worksheet.getRow(1);

      encabezado.height = 28;

      encabezado.eachCell(cell => {

        cell.font = {
          bold: true,
          color: { argb: 'FFFFFFFF' },
          size: 11
        };

        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1E3A5F' }
        };

        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center',
          wrapText: true
        };

        cell.border = {
          bottom: {
            style: 'medium',
            color: { argb: 'FF16304F' }
          }
        };

      });

      // Formato de las filas
      worksheet.eachRow((row, rowNumber) => {

        if (rowNumber > 1) {

          row.height = 22;

          row.eachCell(cell => {

            cell.alignment = {
              vertical: 'middle'
            };

            if (rowNumber % 2 === 0) {

              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF1F5F9' }
              };

            }

          });

        }

      });

      // Formato de fechas
      worksheet.getColumn('fechaRevision').numFmt = 'dd/mm/yyyy';
      worksheet.getColumn('fechaPermiso').numFmt = 'dd/mm/yyyy';
      worksheet.getColumn('fechaSeguro').numFmt = 'dd/mm/yyyy';

      // Filtros y encabezado congelado
      worksheet.autoFilter = {
        from: 'A1',
        to: 'W1'
      };

      worksheet.views = [
        {
          state: 'frozen',
          ySplit: 1
        }
      ];

      // Generar archivo
      const buffer = await workbook.xlsx.writeBuffer();

      const blob = new Blob(
        [buffer],
        {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      );

      const url = window.URL.createObjectURL(blob);

      const enlace = document.createElement('a');

      const fecha = new Date()
        .toISOString()
        .slice(0, 10);

      enlace.href = url;
      enlace.download = `Camiones_Flota360_${fecha}.xlsx`;

      document.body.appendChild(enlace);
      enlace.click();

      document.body.removeChild(enlace);

      window.URL.revokeObjectURL(url);

    } catch (error) {

      console.error(
        'Error al exportar camiones:',
        error
      );

      this.error =
        'No fue posible generar el archivo Excel.';

    } finally {

      this.exportando = false;

    }

  }

}
