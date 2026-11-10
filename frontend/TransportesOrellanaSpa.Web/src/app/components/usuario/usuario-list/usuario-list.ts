
import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { UsuarioService } from '../../../core/services/usuario.service';
import { Usuario } from '../../../core/models/usuario/usuario';

@Component({
  selector: 'app-usuario-list',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule
  ],
  templateUrl: './usuario-list.html',
  styleUrl: './usuario-list.scss'
})
export class UsuarioList implements OnInit {

  private readonly usuarioService = inject(UsuarioService);
  private readonly router = inject(Router);

  usuarios: Usuario[] = [];

  cargando = true;
  exportando = false;
  error = '';

  busqueda = '';

  filtroEstado: 'todos' | 'activos' | 'inactivos' = 'todos';

  ngOnInit(): void {

    this.cargarUsuarios();

  }

  cargarUsuarios(): void {

    this.cargando = true;
    this.error = '';

    this.usuarioService.getUsuarios().subscribe({

      next: usuarios => {

        this.usuarios = usuarios;
        this.cargando = false;

      },

      error: error => {

        console.error(
          'Error al cargar usuarios:',
          error
        );

        this.error =
          'No fue posible cargar los usuarios.';

        this.cargando = false;

      }

    });

  }

  get usuariosFiltrados(): Usuario[] {

    const texto =
      this.busqueda
        .trim()
        .toLowerCase();

    return this.usuarios.filter(usuario => {

      const coincideEstado =
        this.filtroEstado === 'todos' ||
        (
          this.filtroEstado === 'activos' &&
          usuario.activo
        ) ||
        (
          this.filtroEstado === 'inactivos' &&
          !usuario.activo
        );

      if (!coincideEstado) {
        return false;
      }

      if (!texto) {
        return true;
      }

      const roles =
        usuario.roles
          .join(' ')
          .toLowerCase();

      return (
        usuario.rut
          .toLowerCase()
          .includes(texto) ||

        usuario.nombreCompleto
          .toLowerCase()
          .includes(texto) ||

        usuario.email
          .toLowerCase()
          .includes(texto) ||

        roles.includes(texto)
      );

    });

  }

  get cantidadActivos(): number {

    return this.usuarios.filter(
      usuario => usuario.activo
    ).length;

  }

  get cantidadInactivos(): number {

    return this.usuarios.filter(
      usuario => !usuario.activo
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

    if (this.exportando || this.usuariosFiltrados.length === 0) {
      return;
    }

    this.exportando = true;

    try {

      const ExcelJSModule = await import('exceljs');

      const ExcelJS = ExcelJSModule.default ?? ExcelJSModule;

      const workbook = new ExcelJS.Workbook();

      workbook.creator = 'Flota360';
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet('Usuarios');

      worksheet.columns = [
        { header: 'RUT', key: 'rut', width: 16 },
        { header: 'Nombres', key: 'nombres', width: 22 },
        { header: 'Apellido paterno', key: 'apellidoPaterno', width: 20 },
        { header: 'Apellido materno', key: 'apellidoMaterno', width: 20 },
        { header: 'Nombre completo', key: 'nombreCompleto', width: 32 },
        { header: 'Correo electrónico', key: 'email', width: 32 },
        { header: 'Roles asignados', key: 'roles', width: 30 },
        { header: 'Fecha creación', key: 'fechaCreacion', width: 20 },
        { header: 'Último acceso', key: 'ultimoAcceso', width: 22 },
        { header: 'Estado', key: 'estado', width: 18 }
      ];

      const convertirFecha = (fecha: string | null): Date | null => {

        if (!fecha) {
          return null;
        }

        const fechaConvertida = new Date(fecha);

        return Number.isNaN(fechaConvertida.getTime())
          ? null
          : fechaConvertida;

      };

      this.usuariosFiltrados.forEach(usuario => {

        worksheet.addRow({

          rut: usuario.rut,
          nombres: usuario.nombres,
          apellidoPaterno: usuario.apellidoPaterno,
          apellidoMaterno: usuario.apellidoMaterno,
          nombreCompleto: usuario.nombreCompleto,
          email: usuario.email,

          roles: usuario.roles.join(', '),

          fechaCreacion: convertirFecha(usuario.fechaCreacion),

          ultimoAcceso: usuario.ultimoAcceso
            ? convertirFecha(usuario.ultimoAcceso)
            : 'Nunca',

          estado: usuario.activo
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
      worksheet.getColumn('H').numFmt = 'dd/mm/yyyy';
      worksheet.getColumn('I').numFmt = 'dd/mm/yyyy hh:mm';

      // Filtros y encabezado fijo
      worksheet.autoFilter = 'A1:J1';

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
      enlace.download = `Usuarios_Flota360_${new Date().toISOString().slice(0, 10)}.xlsx`;

      enlace.click();

      window.URL.revokeObjectURL(url);

    } catch (error) {

      console.error('Error al exportar usuarios:', error);

    } finally {

      this.exportando = false;

    }

  }

  nuevoUsuario(): void {

    this.router.navigate([
      '/usuarios/nuevo'
    ]);

  }

  gestionarUsuario(id: number): void {

    this.router.navigate([
      '/usuarios/modificar',
      id
    ]);

  }

}
