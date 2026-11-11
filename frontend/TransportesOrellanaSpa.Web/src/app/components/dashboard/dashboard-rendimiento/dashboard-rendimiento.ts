
import { Component, OnInit, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { forkJoin } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';

import { Cliente } from '../../../core/models/cliente';
import { Conductor } from '../../../core/models/conductor';
import { Viaje } from '../../../core/models/viaje';

interface RendimientoItem {
  nombre: string;
  rut: string;
  totalViajes: number;
  diasActivos: number;
  promedioDiario: number;

  diasConUnViaje: number;
  diasConDosViajes: number;
  diasConTresOMasViajes: number;
  diasConDosOMasViajes: number;
  porcentajeDiasDosOMas: number;

  evaluacion: string;
  claseEstado: string;
}

interface ResumenRendimiento {
  totalEvaluados: number;
  cumplenMeta: number;
  bajoMeta: number;
  promedioGeneral: number;
}

@Component({
  selector: 'app-dashboard-rendimiento',
  standalone: true,
  imports: [NgClass],
  templateUrl: './dashboard-rendimiento.html',
  styleUrl: './dashboard-rendimiento.scss'
})
export class DashboardRendimiento implements OnInit {

  private readonly apiService = inject(ApiService);

  // =========================
  // FILTROS
  // =========================

  mesSeleccionado = new Date().getMonth() + 1;
  anioSeleccionado = new Date().getFullYear();

  clienteSeleccionado: number | null = null;
  conductorSeleccionado = '';

  readonly metaDiaria = 1.5;

  readonly meses = [
    { valor: 1, nombre: 'Enero' },
    { valor: 2, nombre: 'Febrero' },
    { valor: 3, nombre: 'Marzo' },
    { valor: 4, nombre: 'Abril' },
    { valor: 5, nombre: 'Mayo' },
    { valor: 6, nombre: 'Junio' },
    { valor: 7, nombre: 'Julio' },
    { valor: 8, nombre: 'Agosto' },
    { valor: 9, nombre: 'Septiembre' },
    { valor: 10, nombre: 'Octubre' },
    { valor: 11, nombre: 'Noviembre' },
    { valor: 12, nombre: 'Diciembre' }
  ];

  readonly aniosDisponibles = Array.from(
    { length: 6 },
    (_, i) => new Date().getFullYear() - i
  );

  // =========================
  // DATOS
  // =========================

  clientes: Cliente[] = [];
  conductores: Conductor[] = [];
  viajes: Viaje[] = [];

  rendimientoConductores: RendimientoItem[] = [];
  rendimientoClientes: RendimientoItem[] = [];

  resumenConductores: ResumenRendimiento = {
    totalEvaluados: 0,
    cumplenMeta: 0,
    bajoMeta: 0,
    promedioGeneral: 0
  };

  resumenClientes: ResumenRendimiento = {
    totalEvaluados: 0,
    cumplenMeta: 0,
    bajoMeta: 0,
    promedioGeneral: 0
  };

  // =========================
  // ESTADOS
  // =========================

  cargando = false;
  error = '';

  ngOnInit(): void {
    this.cargarListasIniciales();
  }

  // =========================
  // CARGAR LISTAS
  // =========================

  private cargarListasIniciales(): void {

    forkJoin({
      clientes: this.apiService.getClientes(),
      conductores: this.apiService.getConductores()
    }).subscribe({
      next: ({ clientes, conductores }) => {

        this.clientes = clientes;
        this.conductores = conductores;

        this.cargarRendimiento();
      },
      error: () => {
        this.error =
          'No fue posible cargar los clientes y conductores.';
      }
    });
  }

  // =========================
  // CARGAR RENDIMIENTO
  // =========================

  cargarRendimiento(): void {

    this.cargando = true;
    this.error = '';

    const fechaDesde = this.obtenerFechaDesde();
    const fechaHasta = this.obtenerFechaHasta();

    this.apiService.getViajes(
      undefined,
      fechaDesde,
      fechaHasta,
      this.clienteSeleccionado ?? undefined
    ).subscribe({
      next: viajes => {

        this.viajes = viajes.filter(viaje =>
          viaje.estado === 'Completado'
        );

        this.calcularRendimiento();

        this.cargando = false;
      },
      error: () => {

        this.error =
          'No fue posible cargar la información de rendimiento.';

        this.cargando = false;
      }
    });
  }

  // =========================
  // APLICAR FILTROS
  // =========================

  aplicarFiltros(): void {
    this.cargarRendimiento();
  }

  // =========================
  // FECHAS DEL PERIODO
  // =========================

  private obtenerFechaDesde(): string {

    const mes = String(this.mesSeleccionado).padStart(2, '0');

    return `${this.anioSeleccionado}-${mes}-01`;
  }

  private obtenerFechaHasta(): string {

    const ultimoDia = new Date(
      this.anioSeleccionado,
      this.mesSeleccionado,
      0
    ).getDate();

    const mes = String(this.mesSeleccionado).padStart(2, '0');
    const dia = String(ultimoDia).padStart(2, '0');

    return `${this.anioSeleccionado}-${mes}-${dia}`;
  }

  // =========================
  // CALCULAR RENDIMIENTO
  // =========================

  private calcularRendimiento(): void {

    const viajesFiltrados = this.conductorSeleccionado
      ? this.viajes.filter(viaje =>
          viaje.conductor.rut === this.conductorSeleccionado
        )
      : this.viajes;

    this.rendimientoConductores =
      this.calcularPorEntidad(
        viajesFiltrados,
        viaje => viaje.conductor.rut,
        viaje => this.obtenerNombreConductor(viaje)
      );

    this.rendimientoClientes =
      this.calcularPorEntidad(
        this.viajes,
        viaje => viaje.cliente.rut,
        viaje => viaje.cliente.nombre
      );

    this.resumenConductores =
      this.calcularResumen(this.rendimientoConductores);

    this.resumenClientes =
      this.calcularResumen(this.rendimientoClientes);
  }

  // =========================
  // AGRUPAR POR ENTIDAD
  // =========================

  private calcularPorEntidad(
    viajes: Viaje[],
    obtenerClave: (viaje: Viaje) => string,
    obtenerNombre: (viaje: Viaje) => string
  ): RendimientoItem[] {
  
    const grupos = new Map<
      string,
      {
        nombre: string;
        rut: string;
        viajesPorFecha: Map<string, number>;
        totalViajes: number;
      }
    >();
  
    for (const viaje of viajes) {
  
      const rut = obtenerClave(viaje);
  
      if (!rut) {
        continue;
      }
  
      if (!grupos.has(rut)) {
  
        grupos.set(rut, {
          nombre: obtenerNombre(viaje),
          rut,
          viajesPorFecha: new Map<string, number>(),
          totalViajes: 0
        });
      }
  
      const grupo = grupos.get(rut)!;
  
      grupo.totalViajes++;
  
      const fecha = this.obtenerClaveFecha(viaje.fecha);
  
      const viajesDelDia =
        grupo.viajesPorFecha.get(fecha) ?? 0;
  
      grupo.viajesPorFecha.set(
        fecha,
        viajesDelDia + 1
      );
    }
  
    return Array.from(grupos.values())
      .map(grupo => {
  
        const cantidadesPorDia =
          Array.from(grupo.viajesPorFecha.values());
  
        const diasActivos = cantidadesPorDia.length;
  
        const promedioDiario = diasActivos > 0
          ? grupo.totalViajes / diasActivos
          : 0;
  
        const diasConUnViaje =
          cantidadesPorDia.filter(cantidad => cantidad === 1).length;
  
        const diasConDosViajes =
          cantidadesPorDia.filter(cantidad => cantidad === 2).length;
  
        const diasConTresOMasViajes =
          cantidadesPorDia.filter(cantidad => cantidad >= 3).length;
  
        const diasConDosOMasViajes =
          diasConDosViajes + diasConTresOMasViajes;
  
        const porcentajeDiasDosOMas = diasActivos > 0
          ? (diasConDosOMasViajes / diasActivos) * 100
          : 0;
  
        const evaluacion =
          this.obtenerEvaluacion(promedioDiario);
  
        return {
          nombre: grupo.nombre,
          rut: grupo.rut,
          totalViajes: grupo.totalViajes,
          diasActivos,
          promedioDiario,
  
          diasConUnViaje,
          diasConDosViajes,
          diasConTresOMasViajes,
          diasConDosOMasViajes,
          porcentajeDiasDosOMas,
  
          evaluacion: evaluacion.texto,
          claseEstado: evaluacion.clase
        };
      })
      .sort((a, b) =>
        b.promedioDiario - a.promedioDiario
      );
  }

  // =========================
  // FECHA ÚNICA
  // =========================

  private obtenerClaveFecha(fecha: string): string {

    const fechaViaje = new Date(fecha);

    const anio = fechaViaje.getFullYear();
    const mes = String(
      fechaViaje.getMonth() + 1
    ).padStart(2, '0');

    const dia = String(
      fechaViaje.getDate()
    ).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }

  // =========================
  // NOMBRE CONDUCTOR
  // =========================

  private obtenerNombreConductor(viaje: Viaje): string {

    const conductor = viaje.conductor;

    return [
      conductor.nombres,
      conductor.apellidoPaterno,
      conductor.apellidoMaterno
    ]
      .filter(Boolean)
      .join(' ');
  }

  // =========================
  // EVALUACIÓN
  // =========================

  private obtenerEvaluacion(promedio: number): {
    texto: string;
    clase: string;
  } {
  
    if (promedio >= 3) {
      return {
        texto: 'Sobre la meta',
        clase: 'sobre-meta'
      };
    }
  
    if (promedio >= this.metaDiaria) {
      return {
        texto: 'Meta cumplida',
        clase: 'meta-cumplida'
      };
    }
  
    return {
      texto: 'Bajo la meta',
      clase: 'bajo-meta'
    };
  }

  // =========================
  // RESUMEN KPI
  // =========================

  private calcularResumen(
    rendimiento: RendimientoItem[]
  ): ResumenRendimiento {

    const totalEvaluados = rendimiento.length;

    const cumplenMeta = rendimiento.filter(item =>
      item.promedioDiario >= this.metaDiaria
    ).length;

    const bajoMeta = rendimiento.filter(item =>
      item.promedioDiario < this.metaDiaria
    ).length;

    const totalViajes = rendimiento.reduce(
      (total, item) => total + item.totalViajes,
      0
    );

    const totalDiasActivos = rendimiento.reduce(
      (total, item) => total + item.diasActivos,
      0
    );

    const promedioGeneral = totalDiasActivos > 0
      ? totalViajes / totalDiasActivos
      : 0;

    return {
      totalEvaluados,
      cumplenMeta,
      bajoMeta,
      promedioGeneral
    };
  }
}
