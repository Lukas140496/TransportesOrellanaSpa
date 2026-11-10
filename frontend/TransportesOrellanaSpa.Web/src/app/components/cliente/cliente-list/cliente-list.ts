
import { Component, OnInit, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiService } from '../../../core/services/api.service';
import { PermissionService } from '../../../core/services/permission.service';
import { Cliente } from '../../../core/models/cliente';

@Component({
  selector: 'app-cliente-list',
  standalone: true,
  imports: [
    DecimalPipe,
    FormsModule
  ],
  templateUrl: './cliente-list.html',
  styleUrl: './cliente-list.scss'
})
export class ClienteList implements OnInit {

  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  readonly permissionService = inject(PermissionService);

  clientes: Cliente[] = [];

  cargando = true;
  exportando = false;
  error = '';

  busqueda = '';
  filtroEstado: 'todos' | 'activos' | 'inactivos' = 'todos';

  ngOnInit(): void {

    this.api.getClientes().subscribe({

      next: clientes => {

        this.clientes = clientes;
        this.cargando = false;

      },

      error: error => {

        console.error(
          'Error al cargar clientes:',
          error
        );

        this.error =
          'No fue posible cargar los clientes.';

        this.cargando = false;

      }

    });

  }

  get clientesFiltrados(): Cliente[] {

    const texto =
      this.busqueda
        .trim()
        .toLowerCase();

    return this.clientes.filter(cliente => {

      const coincideBusqueda =
        !texto ||
        cliente.nombre
          .toLowerCase()
          .includes(texto) ||
        cliente.rut
          .toLowerCase()
          .includes(texto) ||
        cliente.comuna
          .toLowerCase()
          .includes(texto) ||
        cliente.ciudad
          .toLowerCase()
          .includes(texto) ||
        cliente.tipoCarga
          .toLowerCase()
          .includes(texto);

      const coincideEstado =
        this.filtroEstado === 'todos' ||
        (
          this.filtroEstado === 'activos' &&
          cliente.activo
        ) ||
        (
          this.filtroEstado === 'inactivos' &&
          !cliente.activo
        );

      return (
        coincideBusqueda &&
        coincideEstado
      );

    });

  }

  get cantidadActivos(): number {

    return this.clientes.filter(
      cliente => cliente.activo
    ).length;

  }

  get cantidadInactivos(): number {

    return this.clientes.filter(
      cliente => !cliente.activo
    ).length;

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

  nuevoCliente(): void {

    this.router.navigate([
      '/clientes/nuevo'
    ]);

  }

  verDetalle(id: number): void {

    this.router.navigate([
      '/clientes',
      id
    ]);

  }

  async exportarExcel(): Promise<void> {

    if (
      this.exportando ||
      this.cargando ||
      this.clientesFiltrados.length === 0
    ) {
      return;
    }

    this.exportando = true;

    try {

      const ExcelJS = await import('exceljs');

      const workbook = new ExcelJS.Workbook();

      workbook.creator = 'Flota360';
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet('Clientes');

      worksheet.columns = [
        { header: 'Nombre / Razón social', key: 'nombre', width: 32 },
        { header: 'RUT', key: 'rut', width: 18 },
        { header: 'Dirección', key: 'direccion', width: 38 },
        { header: 'Comuna', key: 'comuna', width: 22 },
        { header: 'Ciudad', key: 'ciudad', width: 22 },
        { header: 'Tarifa', key: 'tarifa', width: 18 },
        { header: 'Tipo de carga', key: 'tipoCarga', width: 24 },
        { header: 'Estado', key: 'estado', width: 16 },
        { header: 'Observaciones', key: 'observaciones', width: 40 }
      ];

      const clientes = this.clientesFiltrados;

      clientes.forEach(cliente => {

        worksheet.addRow({
          nombre: cliente.nombre,
          rut: cliente.rut,
          direccion: cliente.direccion || '',
          comuna: cliente.comuna,
          ciudad: cliente.ciudad,
          tarifa: cliente.tarifa,
          tipoCarga: cliente.tipoCarga,
          estado: cliente.activo ? 'Activo' : 'Inactivo',
          observaciones: cliente.observaciones || ''
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
          horizontal: 'center'
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

      // Formato de tarifa
      worksheet.getColumn('tarifa').numFmt = '$#,##0';

      // Filtros y encabezado congelado
      worksheet.autoFilter = {
        from: 'A1',
        to: 'I1'
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
      enlace.download = `Clientes_Flota360_${fecha}.xlsx`;

      document.body.appendChild(enlace);
      enlace.click();

      document.body.removeChild(enlace);

      window.URL.revokeObjectURL(url);

    } catch (error) {

      console.error(
        'Error al exportar clientes:',
        error
      );

      this.error =
        'No fue posible generar el archivo Excel.';

    } finally {

      this.exportando = false;

    }

  }

}
