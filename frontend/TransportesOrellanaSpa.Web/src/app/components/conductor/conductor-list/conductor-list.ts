
import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiService } from '../../../core/services/api.service';
import { Conductor } from '../../../core/models/conductor';
import { PermissionService } from '../../../core/services/permission.service';

@Component({
  selector: 'app-conductor-list',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule
  ],
  templateUrl: './conductor-list.html',
  styleUrl: './conductor-list.scss'
})
export class ConductorList implements OnInit {

  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  readonly permissionService = inject(PermissionService);

  conductores: Conductor[] = [];

  cargando = true;
  exportando = false;
  error = '';

  busqueda = '';

  filtroEstado: 'todos' | 'activos' | 'inactivos' = 'todos';

  ngOnInit(): void {

    this.api.getConductores().subscribe({

      next: conductores => {

        this.conductores = conductores;
        this.cargando = false;

      },

      error: error => {

        console.error(
          'Error al cargar conductores:',
          error
        );

        this.error =
          'No fue posible cargar los conductores.';

        this.cargando = false;

      }

    });

  }

  get conductoresFiltrados(): Conductor[] {

    const texto =
      this.busqueda
        .trim()
        .toLowerCase();

    return this.conductores.filter(conductor => {

      const coincideEstado =
        this.filtroEstado === 'todos' ||
        (
          this.filtroEstado === 'activos' &&
          conductor.activo
        ) ||
        (
          this.filtroEstado === 'inactivos' &&
          !conductor.activo
        );

      if (!coincideEstado) {
        return false;
      }

      if (!texto) {
        return true;
      }

      const nombreCompleto = [
        conductor.nombres,
        conductor.apellidoPaterno,
        conductor.apellidoMaterno
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return (
        conductor.rut
          .toLowerCase()
          .includes(texto) ||

        nombreCompleto
          .includes(texto) ||

        conductor.telefono
          .toLowerCase()
          .includes(texto) ||

        conductor.tipoLicencia
          .toLowerCase()
          .includes(texto)
      );

    });

  }

  get cantidadActivos(): number {

    return this.conductores.filter(
      conductor => conductor.activo
    ).length;

  }

  get cantidadInactivos(): number {

    return this.conductores.filter(
      conductor => !conductor.activo
    ).length;

  }

  get licenciasAlDia(): number {

    return this.conductores.filter(
      conductor => conductor.licenciaAlDia
    ).length;

  }

  get licenciasVencidas(): number {

    return this.conductores.filter(
      conductor => !conductor.licenciaAlDia
    ).length;

  }

  cambiarFiltroEstado(
    filtro: 'todos' | 'activos' | 'inactivos'
  ): void {

    this.filtroEstado = filtro;

  }

  limpiarBusqueda(): void {

    this.busqueda = '';

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

  async exportarExcel(): Promise<void> {

    if (this.exportando || this.conductoresFiltrados.length === 0) {
      return;
    }

    this.exportando = true;

    try {

      const ExcelJSModule = await import('exceljs');

      const ExcelJS = ExcelJSModule.default ?? ExcelJSModule;

      const workbook = new ExcelJS.Workbook();

      workbook.creator = 'Flota360';
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet('Conductores');

      worksheet.columns = [
        { header: 'RUT', key: 'rut', width: 16 },
        { header: 'Nombres', key: 'nombres', width: 22 },
        { header: 'Apellido paterno', key: 'apellidoPaterno', width: 20 },
        { header: 'Apellido materno', key: 'apellidoMaterno', width: 20 },
        { header: 'Fecha de nacimiento', key: 'fechaNacimiento', width: 20 },
        { header: 'Edad', key: 'edad', width: 10 },
        { header: 'Fecha de ingreso', key: 'fechaIngreso', width: 18 },
        { header: 'Teléfono', key: 'telefono', width: 16 },
        { header: 'Tipo de licencia', key: 'tipoLicencia', width: 18 },
        { header: 'Fecha control licencia', key: 'fechaControlLicencia', width: 22 },
        { header: 'Control licencia', key: 'controlLicencia', width: 18 },
        { header: 'Estado licencia', key: 'estadoLicencia', width: 18 },
        { header: 'Días restantes licencia', key: 'diasRestantes', width: 22 },
        { header: 'Camiones habituales', key: 'camiones', width: 35 },
        { header: 'Cantidad de camiones', key: 'cantidadCamiones', width: 22 },
        { header: 'Estado conductor', key: 'estado', width: 18 }
      ];

      const convertirFecha = (fecha: string | null | undefined): Date | null => {

        if (!fecha) {
          return null;
        }

        const fechaTexto = fecha.substring(0, 10);

        const fechaConvertida = new Date(`${fechaTexto}T00:00:00`);

        return Number.isNaN(fechaConvertida.getTime())
          ? null
          : fechaConvertida;

      };

      this.conductoresFiltrados.forEach(conductor => {

        worksheet.addRow({

          rut: conductor.rut,
          nombres: conductor.nombres,
          apellidoPaterno: conductor.apellidoPaterno,
          apellidoMaterno: conductor.apellidoMaterno,

          fechaNacimiento: convertirFecha(conductor.fechaNacimiento),
          edad: conductor.edad,

          fechaIngreso: convertirFecha(conductor.fechaIngreso),
          telefono: conductor.telefono,

          tipoLicencia: conductor.tipoLicencia,
          fechaControlLicencia: convertirFecha(conductor.fechaControlLicencia),

          controlLicencia: conductor.licenciaAlDia
            ? 'Al día'
            : 'Vencida',

          estadoLicencia: conductor.licenciaConducir.estado,

          diasRestantes: conductor.licenciaConducir.diasRestantes,

          camiones: conductor.camionesHabituales
            .map(camion => camion.patente)
            .join(', '),

          cantidadCamiones: conductor.camionesHabituales.length,

          estado: conductor.activo
            ? 'Activo'
            : 'Inactivo'

        });

      });

      // Encabezado
      const header = worksheet.getRow(1);

      header.height = 24;

      header.eachCell(cell => {

        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1E3A5F' }
        };

        cell.font = {
          name: 'Arial',
          size: 10,
          bold: true,
          color: { argb: 'FFFFFFFF' }
        };

        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center'
        };

        cell.border = {
          bottom: {
            style: 'medium',
            color: { argb: 'FF16304F' }
          }
        };

      });

      // Filas y formatos
      worksheet.eachRow((row, rowNumber) => {

        if (rowNumber > 1) {

          row.height = 21;

          row.eachCell(cell => {

            cell.font = {
              name: 'Arial',
              size: 10,
              color: { argb: 'FF334155' }
            };

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
      [
        'E',
        'G',
        'J'
      ].forEach(columna => {

        worksheet.getColumn(columna).numFmt = 'dd/mm/yyyy';

      });

      // Filtros y encabezado fijo
      worksheet.autoFilter = 'A1:P1';

      worksheet.views = [
        {
          state: 'frozen',
          ySplit: 1
        }
      ];

      // Descargar archivo
      const buffer = await workbook.xlsx.writeBuffer();

      const blob = new Blob(
        [buffer],
        {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      );

      const url = window.URL.createObjectURL(blob);

      const enlace = document.createElement('a');

      enlace.href = url;
      enlace.download = `Conductores_Flota360_${new Date().toISOString().slice(0, 10)}.xlsx`;

      enlace.click();

      window.URL.revokeObjectURL(url);

    } catch (error) {

      console.error('Error al exportar conductores:', error);

      this.error = 'No fue posible generar el archivo Excel.';

    } finally {

      this.exportando = false;

    }

  }

  verDetalle(rut: string): void {

    this.router.navigate([
      '/conductores',
      rut
    ]);

  }

  nuevoConductor(): void {

    this.router.navigate([
      '/conductores/nuevo'
    ]);

  }

}
