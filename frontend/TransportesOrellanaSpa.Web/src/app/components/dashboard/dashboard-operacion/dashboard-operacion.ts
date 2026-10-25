import { CommonModule, TitleCasePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ApiService } from '../../../core/services/api.service';
import { Viaje } from '../../../core/models/viaje';
import { Conductor } from '../../../core/models/conductor';

interface PeriodoDashboard {
  year: number;
  month: number;
  nombre: string;
}

interface ResumenRuta {
  origen: string;
  destino: string;
  viajes: number;
  kilometros: number;
}

interface ResumenComuna {
  nombre: string;
  viajes: number;
}

interface ResumenConductor {
  id: number;
  nombre: string;
  viajes: number;
  kilometros: number;
  estados: string[];
}

@Component({
  selector: 'app-dashboard-operacion',
  standalone: true,
  imports: [CommonModule, TitleCasePipe],
  templateUrl: './dashboard-operacion.html',
  styleUrl: './dashboard-operacion.scss'
})
export class DashboardOperacion implements OnInit {
  private readonly api = inject(ApiService);

  private todosLosViajes: Viaje[] = [];
  conductores: Conductor[] = [];
  viajesPeriodo: Viaje[] = [];

  cargando = true;
  cambiandoPeriodo = false;
  error = '';
  selectorAbierto = false;
  periodos: PeriodoDashboard[] = [];
  periodoSeleccionado!: PeriodoDashboard;
  ultimaActualizacion: Date | null = null;

  estadoPagos = {
    viajesPagados: 0,
    montoPagado: 0,
    viajesPendientesPago: 0,
    montoPendientePago: 0
  };

  diasHabiles = {
    diasNoTrabajados: 0,
    diasHabiles: 0,
    diasTrabajados: 0
  };

  ngOnInit(): void {
    this.inicializarPeriodos();
    this.cargarDatos();
  }

  private inicializarPeriodos(): void {
    const actual = new Date();

    for (let i = 0; i < 12; i++) {
      this.periodos.push(
        this.crearPeriodo(
          new Date(actual.getFullYear(), actual.getMonth() - i, 1)
        )
      );
    }

    this.periodoSeleccionado = this.periodos[0];
  }

  private crearPeriodo(fecha: Date): PeriodoDashboard {
    return {
      year: fecha.getFullYear(),
      month: fecha.getMonth() + 1,
      nombre: fecha.toLocaleDateString('es-CL', {
        month: 'long',
        year: 'numeric'
      })
    };
  }

  toggleSelector(): void {
    this.selectorAbierto = !this.selectorAbierto;
  }

  seleccionarPeriodo(periodo: PeriodoDashboard): void {
    this.selectorAbierto = false;

    if (
      periodo.year === this.periodoSeleccionado.year &&
      periodo.month === this.periodoSeleccionado.month
    ) {
      return;
    }

    this.periodoSeleccionado = periodo;
    this.aplicarPeriodo(false);
  }

  cargarDatos(): void {
    this.cargando = true;
    this.error = '';
  
    const { year, month } = this.periodoSeleccionado;
  
    forkJoin({
      viajes: this.api.getViajes().pipe(
        catchError(err => {
          console.error('ERROR CARGANDO VIAJES PARA RESUMEN OPERACIÓN:', err);
          this.error = 'No fue posible cargar los viajes.';
          return of([] as Viaje[]);
        })
      ),
      conductores: this.api.getConductores().pipe(
        catchError(err => {
          console.error('ERROR CARGANDO CONDUCTORES PARA RESUMEN OPERACIÓN:', err);
          this.error = this.error
            ? `${this.error} Tampoco fue posible cargar los conductores.`
            : 'No fue posible cargar los conductores.';
          return of([] as Conductor[]);
        })
      ),
      // AGREGAMOS ESTADO DE PAGOS:
      estadoPagos: this.api.getEstadoPagosDashboard(year, month).pipe(
        catchError(err => {
          console.error('ERROR CARGANDO ESTADO PAGOS:', err);
          return of({ viajesPagados: 0, montoPagado: 0, viajesPendientesPago: 0, montoPendientePago: 0 });
        })
      ),
      diasHabiles: this.api.getDiasHabiles(year, month).pipe(
        catchError(err => {
          console.error('ERROR CARGANDO DÍAS HÁBILES:', err);
          return of({ diasNoTrabajados: 0, diasHabiles: 0, diasTrabajados: 0 });
        })
      )
    }).subscribe({
      next: resultado => {
        this.todosLosViajes = resultado.viajes ?? [];
        this.conductores = resultado.conductores ?? [];
        
        // ASIGNAMOS LOS DATOS REALES DE LA API
        this.estadoPagos = resultado.estadoPagos;
        if (resultado.diasHabiles) {
          this.diasHabiles = resultado.diasHabiles;
        }
  
        this.aplicarPeriodo(true);
        this.ultimaActualizacion = new Date();
        this.cargando = false;
      },
      error: err => {
        console.error('ERROR RESUMEN OPERACIÓN:', err);
        this.error = 'No fue posible cargar la información operacional.';
        this.cargando = false;
        this.cambiandoPeriodo = false;
      }
    });
  }

  private aplicarPeriodo(cargaInicial: boolean): void {
    if (cargaInicial) {
      this.cargando = true;
    } else {
      this.cambiandoPeriodo = true;
    }
  
    const { year, month } = this.periodoSeleccionado;
  
    this.viajesPeriodo = this.todosLosViajes.filter(viaje => {
      if (!viaje.fecha) return false;
      const fecha = new Date(viaje.fecha);
      return (
        !Number.isNaN(fecha.getTime()) &&
        fecha.getFullYear() === year &&
        fecha.getMonth() + 1 === month
      );
    });
  
    if (!cargaInicial) {
      this.api.getEstadoPagosDashboard(year, month).subscribe({
        next: res => {
          this.estadoPagos = res;
        }
      });
  
      if (this.api.getDiasHabiles) {
        this.api.getDiasHabiles(year, month).subscribe({
          next: res => {
            this.diasHabiles = res;
          }
        });
      }
    }
  
    this.ultimaActualizacion = new Date();
    this.cargando = false;
    this.cambiandoPeriodo = false;
  }

  get viajesTotales(): number {
    return this.viajesPeriodo.length;
  }

  get contarRutas(): number {
    const claves = new Set(
      this.viajesPeriodo.map(v => {
        const origen = this.limpiar(
          v.comunaOrigen || v.origen
        ).toLocaleLowerCase('es-CL');

        const destino = this.limpiar(
          v.comunaDestino || v.destino
        ).toLocaleLowerCase('es-CL');

        return `${origen}|${destino}`;
      })
    );

    return claves.size;
  }

  nombreDesdeViajePublico(viaje: Viaje): string {
    return this.nombreDesdeViaje(viaje);
  }

  get kilometrosTotales(): number {
    return this.viajesPeriodo.reduce(
      (total, viaje) => total + this.numero(viaje.kilometros),
      0
    );
  }

  get conductoresConActividad(): number {
    return this.conductoresResumen.filter(c => c.viajes > 0).length;
  }

  get promedioViajesConductor(): number {
    return this.conductoresConActividad > 0
      ? this.viajesTotales / this.conductoresConActividad
      : 0;
  }

  get estadosResumen(): {
    nombre: string;
    cantidad: number;
    porcentaje: number;
    clase: string;
  }[] {
    const conteo = new Map<string, number>();

    for (const viaje of this.viajesPeriodo) {
      const estado = this.limpiar(viaje.estado) || 'Sin estado';

      conteo.set(
        estado,
        (conteo.get(estado) ?? 0) + 1
      );
    }

    return [...conteo.entries()]
      .map(([nombre, cantidad]) => ({
        nombre,
        cantidad,
        porcentaje:
          this.viajesTotales > 0
            ? (cantidad / this.viajesTotales) * 100
            : 0,
        clase: this.claseEstado(nombre)
      }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }

  get conductoresResumen(): ResumenConductor[] {
    const mapa = new Map<number, ResumenConductor>();

    for (const conductor of this.conductores) {
      mapa.set(conductor.id, {
        id: conductor.id,
        nombre: this.nombreConductor(conductor),
        viajes: 0,
        kilometros: 0,
        estados: []
      });
    }

    for (const viaje of this.viajesPeriodo) {
      // Relacionamos el resumen del conductor del viaje con el registro
      // completo usando el RUT normalizado.
      const rutViaje = this.normalizarRut(viaje.conductor?.rut);

      if (!rutViaje) {
        continue;
      }

      const conductorRegistrado = this.conductores.find(
        conductor =>
          this.normalizarRut(conductor.rut) === rutViaje
      );

      const id = conductorRegistrado?.id;

      if (id == null) {
        continue;
      }

      let resumen = mapa.get(id);

      if (!resumen) {
        resumen = {
          id,
          nombre: this.nombreDesdeViaje(viaje),
          viajes: 0,
          kilometros: 0,
          estados: []
        };

        mapa.set(id, resumen);
      }

      resumen.viajes++;
      resumen.kilometros += this.numero(viaje.kilometros);

      const estado = this.limpiar(viaje.estado);

      if (estado && !resumen.estados.includes(estado)) {
        resumen.estados.push(estado);
      }
    }

    return [...mapa.values()].sort(
      (a, b) =>
        b.viajes - a.viajes ||
        b.kilometros - a.kilometros
    );
  }

  get conductoresActivos(): Conductor[] {
    return this.conductores.filter(
      conductor => conductor.activo
    );
  }

  get diasDelMes(): number {

    if (!this.periodoSeleccionado) {
      return 0;
    }

    return new Date(
      this.periodoSeleccionado.year,
      this.periodoSeleccionado.month,
      0
    ).getDate();
  }

  get rutasFrecuentes(): ResumenRuta[] {
    const mapa = new Map<string, ResumenRuta>();

    for (const viaje of this.viajesPeriodo) {
      const origen =
        this.limpiar(viaje.comunaOrigen || viaje.origen) ||
        'Origen no informado';

      const destino =
        this.limpiar(viaje.comunaDestino || viaje.destino) ||
        'Destino no informado';

      const key =
        `${origen.toLocaleLowerCase('es-CL')}|` +
        destino.toLocaleLowerCase('es-CL');

      const ruta = mapa.get(key) ?? {
        origen,
        destino,
        viajes: 0,
        kilometros: 0
      };

      ruta.viajes++;
      ruta.kilometros += this.numero(viaje.kilometros);

      mapa.set(key, ruta);
    }

    return [...mapa.values()]
      .sort(
        (a, b) =>
          b.viajes - a.viajes ||
          b.kilometros - a.kilometros
      )
      .slice(0, 8);
  }

  get origenesFrecuentes(): ResumenComuna[] {
    return this.frecuenciaComunas('origen').slice(0, 6);
  }

  get destinosFrecuentes(): ResumenComuna[] {
    return this.frecuenciaComunas('destino').slice(0, 6);
  }

  private frecuenciaComunas(
    tipo: 'origen' | 'destino'
  ): ResumenComuna[] {
    const mapa = new Map<string, ResumenComuna>();

    for (const viaje of this.viajesPeriodo) {
      const valor =
        tipo === 'origen'
          ? viaje.comunaOrigen || viaje.origen
          : viaje.comunaDestino || viaje.destino;

      const nombre =
        this.limpiar(valor) ||
        (tipo === 'origen'
          ? 'Origen no informado'
          : 'Destino no informado');

      const key = nombre.toLocaleLowerCase('es-CL');

      const item = mapa.get(key) ?? {
        nombre,
        viajes: 0
      };

      item.viajes++;
      mapa.set(key, item);
    }

    return [...mapa.values()].sort(
      (a, b) => b.viajes - a.viajes
    );
  }

  get viajesRecientes(): Viaje[] {
    return [...this.viajesPeriodo]
      .sort(
        (a, b) =>
          new Date(b.fecha).getTime() -
          new Date(a.fecha).getTime()
      )
      .slice(0, 8);
  }

  porcentajeConductor(viajes: number): number {
    return this.viajesTotales > 0
      ? (viajes / this.viajesTotales) * 100
      : 0;
  }

  porcentajeFrecuencia(
    cantidad: number,
    lista: ResumenComuna[]
  ): number {
    const maximo = Math.max(
      0,
      ...lista.map(item => item.viajes)
    );

    return maximo > 0
      ? (cantidad / maximo) * 100
      : 0;
  }

  enlaceGoogleMaps(ruta: ResumenRuta): string {
    const origen = encodeURIComponent(`${ruta.origen}, Chile`);
    const destino = encodeURIComponent(`${ruta.destino}, Chile`);

    return (
      'https://www.google.com/maps/dir/?api=1' +
      `&origin=${origen}&destination=${destino}`
    );
  }

  nombreConductor(conductor: Conductor): string {
    return [
      conductor.nombres,
      conductor.apellidoPaterno,
      conductor.apellidoMaterno
    ]
      .filter(Boolean)
      .join(' ')
      .trim() || 'Conductor sin nombre';
  }

  private nombreDesdeViaje(viaje: Viaje): string {
    const resumen = viaje.conductor;
    const rut = this.normalizarRut(resumen?.rut);

    const conductorRegistrado = rut
      ? this.conductores.find(
          conductor =>
            this.normalizarRut(conductor.rut) === rut
        )
      : undefined;

    if (conductorRegistrado) {
      return this.nombreConductor(conductorRegistrado);
    }

    const conductor = resumen as unknown as {
      nombres?: string;
      apellidoPaterno?: string;
      apellidoMaterno?: string;
      nombreCompleto?: string;
    } | undefined;

    return (
      conductor?.nombreCompleto ||
      [
        conductor?.nombres,
        conductor?.apellidoPaterno,
        conductor?.apellidoMaterno
      ]
        .filter(Boolean)
        .join(' ')
        .trim() ||
      'Conductor'
    );
  }

  private normalizarRut(rut: unknown): string {
    return String(rut ?? '')
      .replace(/[.\-\s]/g, '')
      .toUpperCase();
  }

  etiquetaEstado(estado: string): string {
    if (!estado) {
      return 'Sin estado';
    }

    const normalizado = estado.toLocaleLowerCase('es-CL');

    const etiquetas: Record<string, string> = {
      pendiente: 'Pendiente',
      encurso: 'En curso',
      'en curso': 'En curso',
      completado: 'Completado',
      cancelado: 'Cancelado',
      cancelada: 'Cancelado'
    };

    return (
      etiquetas[normalizado.replace(/[\s_-]/g, '')] ??
      etiquetas[normalizado] ??
      estado.replace(
        /([a-záéíóú])([A-ZÁÉÍÓÚ])/g,
        '$1 $2'
      )
    );
  }

  claseEstado(estado: string): string {
    const normalizado = estado
      .toLocaleLowerCase('es-CL')
      .replace(/[\s_-]/g, '');

    if (normalizado.includes('complet')) {
      return 'estado-completado';
    }

    if (normalizado.includes('curso')) {
      return 'estado-curso';
    }

    if (normalizado.includes('pend')) {
      return 'estado-pendiente';
    }

    if (normalizado.includes('cancel')) {
      return 'estado-cancelado';
    }

    return 'estado-otro';
  }

  formatoNumero(valor: number): string {
    return new Intl.NumberFormat('es-CL', {
      maximumFractionDigits: 0
    }).format(valor || 0);
  }

  formatoDecimal(valor: number): string {
    return new Intl.NumberFormat('es-CL', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(valor || 0);
  }

  formatoFecha(fecha: string): string {
    if (!fecha) {
      return '—';
    }

    const valor = new Date(fecha);

    return Number.isNaN(valor.getTime())
      ? '—'
      : valor.toLocaleDateString('es-CL', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
  }

  get fechaActualizacionTexto(): string {
    return this.ultimaActualizacion
      ? this.ultimaActualizacion.toLocaleString('es-CL', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : 'Actualizando información';
  }

  private numero(valor: unknown): number {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : 0;
  }

  private limpiar(valor: unknown): string {
    return String(valor ?? '').trim();
  }

  formatoMoneda(valor: number): string {

    return new Intl.NumberFormat(
      'es-CL',
      {
        style: 'currency',
        currency: 'CLP',
        maximumFractionDigits: 0
      }
    ).format(valor);
  }
}