
import { CommonModule, TitleCasePipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';

import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import * as L from 'leaflet';

import { ApiService } from '../../../core/services/api.service';
import { Viaje } from '../../../core/models/viaje';
import { Conductor } from '../../../core/models/conductor';

import * as clientesData from '../../../core/assets/json/clientes-frecuentes.json';

interface PeriodoDashboard {
  year: number;
  month: number;
  nombre: string;
}

interface ResumenRuta {
  origen: string;
  destino: string;
  comunaOrigen: string;
  comunaDestino: string;
  cliente: string;
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

interface Coordenada {
  lat: number;
  lng: number;
}

@Component({
  selector: 'app-dashboard-operacion',
  standalone: true,
  imports: [CommonModule, TitleCasePipe],
  templateUrl: './dashboard-operacion.html',
  styleUrl: './dashboard-operacion.scss'
})
export class DashboardOperacion
  implements OnInit, AfterViewInit, OnDestroy {

  private readonly api = inject(ApiService);

  // =========================================================
  // MAPA
  // =========================================================

  private mapa: L.Map | null = null;
  private capaMapa: L.FeatureGroup = L.featureGroup();
  private vistaInicializada = false;

  rutasMapa: ResumenRuta[] = [];
  comunasMapa: ResumenComuna[] = [];

  // =========================================================
  // MODAL MAPA DE RUTA
  // =========================================================

  mostrarModalRuta = false;
  rutaSeleccionada: ResumenRuta | null = null;
  kilometrosRutaModal: number | null = null;

  mapaRutaCargando = false;
  errorMapaRuta = '';

  private mapaRutaModal: L.Map | null = null;
  private capaRutaModal: L.FeatureGroup = L.featureGroup();

  // =========================================================
  // DATOS
  // =========================================================

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

  // =========================================================
  // PAGOS
  // =========================================================

  estadoPagos = {
    viajesPagados: 0,
    montoPagado: 0,
    viajesPendientesPago: 0,
    montoPendientePago: 0
  };

  // =========================================================
  // DÍAS HÁBILES
  // =========================================================

  diasHabiles = {
    diasNoTrabajados: 0,
    diasHabiles: 0,
    diasTrabajados: 0
  };

  // =========================================================
  // COORDENADAS APROXIMADAS DE COMUNAS
  // =========================================================

  private readonly coordenadasComunas: Record<string, Coordenada> = {

    // Santiago y alrededores
    'santiago': {
      lat: -33.4489,
      lng: -70.6693
    },

    'maipu': {
      lat: -33.5108,
      lng: -70.7572
    },

    'quilicura': {
      lat: -33.3650,
      lng: -70.7290
    },

    'lampa': {
      lat: -33.2860,
      lng: -70.8750
    },

    'colina': {
      lat: -33.2030,
      lng: -70.6750
    },

    'tiltil': {
      lat: -33.0830,
      lng: -70.9300
    },

    'pudahuel': {
      lat: -33.4430,
      lng: -70.7350
    },

    'renca': {
      lat: -33.4040,
      lng: -70.7250
    },

    'independencia': {
      lat: -33.4150,
      lng: -70.6650
    },

    'conchali': {
      lat: -33.3830,
      lng: -70.6750
    },

    'huechuraba': {
      lat: -33.3730,
      lng: -70.6500
    },

    'las condes': {
      lat: -33.4100,
      lng: -70.5670
    },

    'providencia': {
      lat: -33.4250,
      lng: -70.6100
    },

    'vitacura': {
      lat: -33.3900,
      lng: -70.5700
    },

    'lo barnechea': {
      lat: -33.3500,
      lng: -70.5170
    },

    'la florida': {
      lat: -33.5300,
      lng: -70.5800
    },

    'puente alto': {
      lat: -33.6100,
      lng: -70.5750
    },

    'san bernardo': {
      lat: -33.5920,
      lng: -70.6990
    },

    'buin': {
      lat: -33.7320,
      lng: -70.7420
    },

    'paine': {
      lat: -33.8100,
      lng: -70.7500
    },

    'talagante': {
      lat: -33.6630,
      lng: -70.9270
    },

    'padre hurtado': {
      lat: -33.5700,
      lng: -70.8150
    },

    'cerrillos': {
      lat: -33.5000,
      lng: -70.7170
    },

    'estacion central': {
      lat: -33.4630,
      lng: -70.7030
    },

    'la cisterna': {
      lat: -33.5270,
      lng: -70.6610
    },

    'lo espejo': {
      lat: -33.5200,
      lng: -70.6880
    },

    'penalolen': {
      lat: -33.4860,
      lng: -70.5350
    },

    'san miguel': {
      lat: -33.4950,
      lng: -70.6510
    },

    'la reina': {
      lat: -33.4500,
      lng: -70.5500
    },

    'macul': {
      lat: -33.4860,
      lng: -70.5980
    },

    'el bosque': {
      lat: -33.5650,
      lng: -70.6750
    },

    'recoleta': {
      lat: -33.4060,
      lng: -70.6410
    },

    'lo prado': {
      lat: -33.4450,
      lng: -70.7250
    },

    'cerro navia': {
      lat: -33.4250,
      lng: -70.7400
    },

    // Región de O'Higgins y Maule
    'melipilla': {
      lat: -33.6890,
      lng: -71.2160
    },

    'curacavi': {
      lat: -33.4000,
      lng: -71.1400
    },

    'rancagua': {
      lat: -34.1700,
      lng: -70.7400
    },

    'san fernando': {
      lat: -34.5850,
      lng: -70.9900
    },

    'curico': {
      lat: -34.9820,
      lng: -71.2390
    },

    'talca': {
      lat: -35.4264,
      lng: -71.6554
    },

    'constitucion': {
      lat: -35.3333,
      lng: -72.4167
    },

    // Región de Valparaíso
    'vina del mar': {
      lat: -33.0153,
      lng: -71.5500
    },

    'valparaiso': {
      lat: -33.0472,
      lng: -71.6127
    },

    'san antonio': {
      lat: -33.5930,
      lng: -71.6210
    },

    // Otras regiones
    'chillan': {
      lat: -36.6066,
      lng: -72.1034
    },

    'concepcion': {
      lat: -36.8201,
      lng: -73.0444
    },

    'temuco': {
      lat: -38.7359,
      lng: -72.5904
    }
  };

  private configurarIconosLeaflet(): void {
    const iconosLeaflet =
      L.Icon.Default.prototype as any;

    delete iconosLeaflet._getIconUrl;

    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/leaflet/marker-icon-2x.png',
      iconUrl: '/leaflet/marker-icon.png',
      shadowUrl: '/leaflet/marker-shadow.png'
    });
  }

  // =========================================================
  // CICLO DE VIDA
  // =========================================================

  ngOnInit(): void {
    this.configurarIconosLeaflet();
    this.inicializarPeriodos();
    this.cargarDatos();
  }

  ngAfterViewInit(): void {
    this.vistaInicializada = true;

    setTimeout(() => {
      this.prepararMapa();
    }, 0);
  }

  ngOnDestroy(): void {
    if (this.mapa) {
      this.mapa.remove();
      this.mapa = null;
    }

    this.capaMapa.clearLayers();

    this.destruirMapaRutaModal();
  }

  // =========================================================
  // PERIODOS
  // =========================================================

  private inicializarPeriodos(): void {
    const actual = new Date();

    for (let i = 0; i < 12; i++) {
      this.periodos.push(
        this.crearPeriodo(
          new Date(
            actual.getFullYear(),
            actual.getMonth() - i,
            1
          )
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

  // =========================================================
  // CARGA DE DATOS
  // =========================================================

  cargarDatos(): void {
    this.cargando = true;
    this.error = '';

    const { year, month } = this.periodoSeleccionado;

    forkJoin({
      viajes: this.api.getViajes().pipe(
        catchError(err => {
          console.error(
            'ERROR CARGANDO VIAJES PARA RESUMEN OPERACIÓN:',
            err
          );

          this.error =
            'No fue posible cargar los viajes.';

          return of([] as Viaje[]);
        })
      ),

      conductores: this.api.getConductores().pipe(
        catchError(err => {
          console.error(
            'ERROR CARGANDO CONDUCTORES PARA RESUMEN OPERACIÓN:',
            err
          );

          this.error = this.error
            ? `${this.error} Tampoco fue posible cargar los conductores.`
            : 'No fue posible cargar los conductores.';

          return of([] as Conductor[]);
        })
      ),

      estadoPagos:
        this.api.getEstadoPagosDashboard(year, month).pipe(
          catchError(err => {
            console.error(
              'ERROR CARGANDO ESTADO PAGOS:',
              err
            );

            return of({
              viajesPagados: 0,
              montoPagado: 0,
              viajesPendientesPago: 0,
              montoPendientePago: 0
            });
          })
        ),

      diasHabiles:
        this.api.getDiasHabiles(year, month).pipe(
          catchError(err => {
            console.error(
              'ERROR CARGANDO DÍAS HÁBILES:',
              err
            );

            return of({
              diasNoTrabajados: 0,
              diasHabiles: 0,
              diasTrabajados: 0
            });
          })
        )
    }).subscribe({
      next: resultado => {
        this.todosLosViajes =
          resultado.viajes ?? [];

        this.conductores =
          resultado.conductores ?? [];

        this.estadoPagos =
          resultado.estadoPagos;

        this.diasHabiles =
          resultado.diasHabiles;

        this.aplicarPeriodo(true);

        this.ultimaActualizacion =
          new Date();

        this.cargando = false;

        this.prepararMapa();
      },

      error: err => {
        console.error(
          'ERROR RESUMEN OPERACIÓN:',
          err
        );

        this.error =
          'No fue posible cargar la información operacional.';

        this.cargando = false;
        this.cambiandoPeriodo = false;
      }
    });
  }

  // =========================================================
  // APLICAR PERIODO
  // =========================================================

  private aplicarPeriodo(
    cargaInicial: boolean
  ): void {
    if (cargaInicial) {
      this.cargando = true;
    } else {
      this.cambiandoPeriodo = true;
    }

    const {
      year,
      month
    } = this.periodoSeleccionado;

    this.viajesPeriodo =
      this.todosLosViajes.filter(viaje => {
        if (!viaje.fecha) {
          return false;
        }

        const fecha =
          new Date(viaje.fecha);

        return (
          !Number.isNaN(fecha.getTime()) &&
          fecha.getFullYear() === year &&
          fecha.getMonth() + 1 === month
        );
      });

    this.rutasMapa =
      this.rutasFrecuentes;

    this.comunasMapa =
      this.comunasFrecuentes;

    if (!cargaInicial) {
      this.api
        .getEstadoPagosDashboard(year, month)
        .subscribe({
          next: res => {
            this.estadoPagos = res;
          }
        });

      this.api
        .getDiasHabiles(year, month)
        .subscribe({
          next: res => {
            this.diasHabiles = res;
          }
        });
    }

    this.ultimaActualizacion =
      new Date();

    this.cargando = false;
    this.cambiandoPeriodo = false;

    this.prepararMapa();
  }

  // =========================================================
  // MAPA: COMUNAS MÁS FRECUENTES, SIN CONEXIONES
  // =========================================================

  private prepararMapa(): void {
    if (!this.vistaInicializada) {
      return;
    }

    setTimeout(() => {
      const contenedor =
        document.getElementById('mapa-operacion');

      if (!contenedor) {
        return;
      }

      if (!this.mapa) {
        this.mapa = L.map(contenedor, {
          center: [-33.4489, -70.6693],
          zoom: 6,
          scrollWheelZoom: false
        });

        L.tileLayer(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
          }
        ).addTo(this.mapa);

        this.capaMapa.addTo(this.mapa);
      }

      // Quitamos los marcadores anteriores.
      this.capaMapa.clearLayers();

      // Actualizamos las frecuencias del período seleccionado.
      this.comunasMapa =
        this.comunasFrecuentes;

      const puntos: L.LatLng[] = [];

      for (const comuna of this.comunasMapa) {
        const coordenadas =
          this.obtenerCoordenadas(comuna.nombre);

        // No dibujamos comunas que no tengan coordenadas conocidas.
        if (!coordenadas) {
          continue;
        }

        const marcador = L.marker([
          coordenadas.lat,
          coordenadas.lng
        ]);

        marcador.bindPopup(
          `<strong>${this.escaparHtml(comuna.nombre)}</strong><br>` +
          `<span>Frecuencia: ${comuna.viajes} ` +
          `${comuna.viajes === 1 ? 'aparición' : 'apariciones'}</span>`
        );

        marcador.addTo(this.capaMapa);

        puntos.push(
          L.latLng(
            coordenadas.lat,
            coordenadas.lng
          )
        );
      }

      this.mapa.invalidateSize();

      if (puntos.length > 0) {
        const bounds =
          L.latLngBounds(puntos);

        this.mapa.fitBounds(bounds, {
          padding: [40, 40],
          maxZoom: 11
        });
      } else {
        this.mapa.setView(
          [-33.4489, -70.6693],
          6
        );
      }
    }, 100);
  }

  private obtenerCoordenadas(
    nombre: string
  ): Coordenada | null {
    const normalizado =
      this.normalizarNombreComuna(nombre);

    return this.coordenadasComunas[normalizado] ?? null;
  }

  private obtenerCoordenadasCliente(
    nombreEmpresa: string
  ): Coordenada | null {
    const mapaClientes: Record<string, string> =
      (clientesData as any).default || clientesData;

    const normalizar = (valor: string): string =>
      valor
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('es-CL')
        .trim();

    const nombreNormalizado = normalizar(nombreEmpresa);

    const entrada = Object.entries(mapaClientes).find(
      ([empresa]) => normalizar(empresa) === nombreNormalizado
    );

    if (!entrada) {
      return null;
    }

    const valor = entrada[1].trim();

    // Si el JSON contiene coordenadas, las usamos directamente.
    const coincidencia = valor.match(
      /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/
    );

    if (coincidencia) {
      return {
        lat: Number(coincidencia[1]),
        lng: Number(coincidencia[2])
      };
    }

    // Si contiene una dirección, se geocodifica.
    return null;
  }

  private normalizarNombreComuna(
    nombre: string
  ): string {
    return String(nombre ?? '')
      .trim()
      .toLocaleLowerCase('es-CL')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private escaparHtml(valor: string): string {
    return valor
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // =========================================================
  // KPIs
  // =========================================================

  get viajesTotales(): number {
    return this.viajesPeriodo.length;
  }

  get contarRutas(): number {
    const claves =
      new Set(
        this.viajesPeriodo.map(v => {
          const origen =
            this.limpiar(
              v.comunaOrigen || v.origen
            ).toLocaleLowerCase('es-CL');

          const destino =
            this.limpiar(
              v.comunaDestino || v.destino
            ).toLocaleLowerCase('es-CL');

          const cliente =
            this.limpiar(
              v.cliente?.nombre || 'Sin cliente'
            );

          return `${origen}|${destino}`;
        })
      );

    return claves.size;
  }

  nombreDesdeViajePublico(
    viaje: Viaje
  ): string {
    return this.nombreDesdeViaje(viaje);
  }

  get kilometrosTotales(): number {
    return this.viajesPeriodo.reduce(
      (total, viaje) =>
        total + this.numero(viaje.kilometros),
      0
    );
  }

  get conductoresConActividad(): number {
    return this.conductoresResumen
      .filter(c => c.viajes > 0)
      .length;
  }

  get promedioViajesConductor(): number {
    return this.conductoresConActividad > 0
      ? this.viajesTotales / this.conductoresConActividad
      : 0;
  }

  // =========================================================
  // ESTADOS
  // =========================================================

  get estadosResumen(): {
    nombre: string;
    cantidad: number;
    porcentaje: number;
    clase: string;
  }[] {
    const conteo =
      new Map<string, number>();

    for (const viaje of this.viajesPeriodo) {
      const estado =
        this.limpiar(viaje.estado) || 'Sin estado';

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

  // =========================================================
  // CONDUCTORES
  // =========================================================

  get conductoresResumen(): ResumenConductor[] {
    const mapa =
      new Map<number, ResumenConductor>();

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
      const rutViaje =
        this.normalizarRut(viaje.conductor?.rut);

      if (!rutViaje) {
        continue;
      }

      const conductorRegistrado =
        this.conductores.find(
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

      resumen.kilometros +=
        this.numero(viaje.kilometros);

      const estado =
        this.limpiar(viaje.estado);

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

  // =========================================================
  // DÍAS
  // =========================================================

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

  // =========================================================
  // RUTAS FRECUENTES
  // Se conserva para los demás indicadores del dashboard.
  // El mapa ya no dibuja estas rutas.
  // =========================================================

  get rutasFrecuentes(): ResumenRuta[] {
    const mapa = new Map<string, ResumenRuta>();

    for (const viaje of this.viajesPeriodo) {
      const origen =
        this.limpiar(viaje.origen) || 'Origen no informado';

      const destino =
        this.limpiar(viaje.destino) || 'Destino no informado';

      const comunaOrigen =
        this.limpiar(viaje.comunaOrigen) || 'Comuna no informada';

      const comunaDestino =
        this.limpiar(viaje.comunaDestino) || 'Comuna no informada';

      const cliente = `${comunaOrigen} → ${comunaDestino}`;

      const key =
        `${origen.toLocaleLowerCase('es-CL')}|` +
        `${destino.toLocaleLowerCase('es-CL')}`;

      const ruta: ResumenRuta = mapa.get(key) ?? {
        origen,
        destino,
        comunaOrigen,
        comunaDestino,
        cliente,
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

  verRuta(ruta: ResumenRuta): void {
    this.destruirMapaRutaModal();

    this.rutaSeleccionada = ruta;
    this.mostrarModalRuta = true;
    this.mapaRutaCargando = true;
    this.errorMapaRuta = '';
    this.kilometrosRutaModal = null;

    setTimeout(() => {
      if (this.mostrarModalRuta && this.rutaSeleccionada === ruta) {
        void this.inicializarMapaRutaModal(ruta);
      }
    }, 100);
  }

  private destruirMapaRutaModal(): void {
    if (this.mapaRutaModal) {
      this.mapaRutaModal.remove();
      this.mapaRutaModal = null;
    }

    this.capaRutaModal.clearLayers();
  }

  cerrarModalRuta(): void {
    this.mostrarModalRuta = false;
    this.mapaRutaCargando = false;
    this.errorMapaRuta = '';
    this.rutaSeleccionada = null;

    this.destruirMapaRutaModal();
  }

  private extraerDireccionObservaciones(
    observaciones: string | null | undefined
  ): string | null {
    if (!observaciones) {
      return null;
    }

    const regex =
      /(?:^|\s)direcci[oó]n\s*:\s*(.+?)(?=\s+(?:carga|peso|nota\s+de\s+venta|orden\s+de\s+compra|tarifa(?:\s+de)?\s+combustible(?:\s+actual)?)\s*:|$)/i;

    const coincidencia = observaciones.match(regex);

    if (!coincidencia?.[1]) {
      return null;
    }

    const direccion = coincidencia[1]
      .trim()
      .replace(/[.,;]+$/, '')
      .trim();

    return direccion || null;
  }

  private obtenerDireccionConocida(
    nombreEmpresa: string
  ): string | null {
    if (!nombreEmpresa) {
      return null;
    }

    const normalizar = (valor: string): string =>
      valor
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .trim();

    const mapaClientes: Record<string, string> =
      (clientesData as any).default || clientesData;

    const nombreNormalizado = normalizar(nombreEmpresa);

    for (const [empresa, direccion] of Object.entries(mapaClientes)) {
      const claveNormalizada = normalizar(empresa);

      if (nombreNormalizado.includes(claveNormalizada)) {
        return direccion;
      }
    }

    return null;
  }

  private async geocodificarRutaModal(
    nombreEmpresa: string,
    comuna?: string,
    direccionObservacion?: string | null
  ): Promise<Coordenada | null> {
    const consultas: string[] = [];

    const empresa = nombreEmpresa?.trim();
    const coordenadasCliente =
      this.obtenerCoordenadasCliente(nombreEmpresa);

    if (coordenadasCliente) {
      return coordenadasCliente;
    }
    const nombreComuna = comuna?.trim();
    const direccion = direccionObservacion?.trim();

    const direccionConocida =
      this.obtenerDireccionConocida(empresa || '');

    if (direccionConocida) {
      consultas.push(`${direccionConocida}, Chile`);
    } else {
      if (direccion && nombreComuna) {
        consultas.push(`${direccion}, ${nombreComuna}, Chile`);
      }

      if (empresa && direccion && nombreComuna) {
        consultas.push(
          `${empresa}, ${direccion}, ${nombreComuna}, Chile`
        );
      }

      if (empresa && nombreComuna) {
        consultas.push(`${empresa}, ${nombreComuna}, Chile`);
      }

      if (empresa) {
        consultas.push(`${empresa}, Chile`);
      }
    }

    for (const consulta of [...new Set(consultas)]) {
      try {
        const parametros = new URLSearchParams({
          q: consulta,
          format: 'jsonv2',
          limit: '1',
          countrycodes: 'cl'
        });

        const respuesta = await fetch(
          'https://nominatim.openstreetmap.org/search?' +
          parametros.toString()
        );

        if (!respuesta.ok) {
          continue;
        }

        const resultados = await respuesta.json();

        if (!resultados?.length) {
          continue;
        }

        const lat = Number(resultados[0].lat);
        const lng = Number(resultados[0].lon);

        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          return { lat, lng };
        }
      } catch (error) {
        console.error(
          `Error geocodificando "${consulta}":`,
          error
        );
      }
    }

    return null;
  }

  private async inicializarMapaRutaModal(
    ruta: ResumenRuta
  ): Promise<void> {
    const contenedor = document.getElementById('mapa-ruta-modal');

    if (!contenedor || !this.mostrarModalRuta) {
      this.mapaRutaCargando = false;
      return;
    }

    this.destruirMapaRutaModal();

    this.errorMapaRuta = '';
    this.mapaRutaCargando = true;

    const mapa = L.map(contenedor, {
      center: [-33.4489, -70.6693],
      zoom: 6,
      scrollWheelZoom: true
    });

    this.mapaRutaModal = mapa;

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }
    ).addTo(mapa);

    this.capaRutaModal = L.featureGroup().addTo(mapa);

    requestAnimationFrame(() => {
      if (this.mapaRutaModal === mapa) {
        mapa.invalidateSize();
      }
    });

    try {
      // Geocodificar directamente los nombres de las empresas
      // y sus respectivas comunas.
      const origen = await this.geocodificarRutaModal(
        ruta.origen,
        ruta.comunaOrigen
      );

      if (this.mapaRutaModal !== mapa) {
        return;
      }

      if (!origen) {
        throw new Error(
          `No se encontró el origen "${ruta.origen}" en ${ruta.comunaOrigen}.`
        );
      }

      const destino = await this.geocodificarRutaModal(
        ruta.destino,
        ruta.comunaDestino
      );

      if (this.mapaRutaModal !== mapa) {
        return;
      }

      if (!destino) {
        throw new Error(
          `No se encontró el destino "${ruta.destino}" en ${ruta.comunaDestino}.`
        );
      }

      // Marcador de origen.
      L.marker([origen.lat, origen.lng])
        .bindPopup(
          `<strong>Origen: ${this.escaparHtml(ruta.origen)}</strong><br>` +
          `${this.escaparHtml(ruta.comunaOrigen)}`
        )
        .addTo(this.capaRutaModal);

      // Marcador de destino.
      L.marker([destino.lat, destino.lng])
        .bindPopup(
          `<strong>Destino: ${this.escaparHtml(ruta.destino)}</strong><br>` +
          `${this.escaparHtml(ruta.comunaDestino)}`
        )
        .addTo(this.capaRutaModal);

      // Calcular recorrido vial con OSRM.
      const urlRuta =
        'https://router.project-osrm.org/route/v1/driving/' +
        `${origen.lng},${origen.lat};${destino.lng},${destino.lat}` +
        '?overview=full&geometries=geojson&steps=false';

      const respuesta = await fetch(urlRuta);

      if (this.mapaRutaModal !== mapa) {
        return;
      }

      if (!respuesta.ok) {
        throw new Error(
          'No fue posible calcular el recorrido vial.'
        );
      }

      const datos = await respuesta.json();

      if (datos.code !== 'Ok' || !datos.routes?.length) {
        throw new Error(
          'No se encontró una ruta vial entre las ubicaciones.'
        );
      }

      const distanciaMetros = datos.routes[0].distance;
      this.kilometrosRutaModal = distanciaMetros / 1000;

      const coordenadas = datos.routes[0].geometry.coordinates.map(
        (coordenada: [number, number]) =>
          L.latLng(coordenada[1], coordenada[0])
      );

      L.polyline(coordenadas, {
        color: '#2563eb',
        weight: 5,
        opacity: 0.85
      }).addTo(this.capaRutaModal);

      mapa.fitBounds(this.capaRutaModal.getBounds(), {
        padding: [35, 35]
      });

    } catch (error) {
      console.error(
        'Error al mostrar la ruta en el modal:',
        error
      );

      if (this.mapaRutaModal !== mapa) {
        return;
      }

      this.errorMapaRuta =
        error instanceof Error
          ? error.message
          : 'No fue posible mostrar el recorrido.';

      mapa.setView([-33.4489, -70.6693], 6);

    } finally {
      if (this.mapaRutaModal === mapa) {
        this.mapaRutaCargando = false;

        requestAnimationFrame(() => {
          mapa.invalidateSize();
        });
      }
    }
  }

  /**
   * Frecuencia total de comunas para el mapa.
   *
   * Cada viaje aporta una aparición a su comuna de origen
   * y otra a su comuna de destino.
   *
   * Si origen y destino son la misma comuna, se contabilizan
   * ambas apariciones.
   */
  get comunasFrecuentes(): ResumenComuna[] {
    const mapa =
      new Map<string, ResumenComuna>();

    for (const viaje of this.viajesPeriodo) {
      const valores = [
        viaje.comunaOrigen || viaje.origen,
        viaje.comunaDestino || viaje.destino
      ];

      for (const valor of valores) {
        const nombre =
          this.limpiar(valor);

        if (!nombre) {
          continue;
        }

        const key =
          this.normalizarNombreComuna(nombre);

        const item =
          mapa.get(key) ?? {
            nombre,
            viajes: 0
          };

        item.viajes++;

        mapa.set(key, item);
      }
    }

    return [...mapa.values()]
      .sort(
        (a, b) =>
          b.viajes - a.viajes ||
          a.nombre.localeCompare(b.nombre, 'es-CL')
      );
  }

  private frecuenciaComunas(
    tipo: 'origen' | 'destino'
  ): ResumenComuna[] {
    const mapa =
      new Map<string, ResumenComuna>();

    for (const viaje of this.viajesPeriodo) {
      const valor =
        tipo === 'origen'
          ? viaje.comunaOrigen || viaje.origen
          : viaje.comunaDestino || viaje.destino;

      const nombre =
        this.limpiar(valor) ||
        (
          tipo === 'origen'
            ? 'Origen no informado'
            : 'Destino no informado'
        );

      const key =
        nombre.toLocaleLowerCase('es-CL');

      const item =
        mapa.get(key) ?? {
          nombre,
          viajes: 0
        };

      item.viajes++;

      mapa.set(key, item);
    }

    return [...mapa.values()]
      .sort((a, b) => b.viajes - a.viajes);
  }

  // =========================================================
  // VIAJES RECIENTES
  // =========================================================

  get viajesRecientes(): Viaje[] {
    return [...this.viajesPeriodo]
      .sort(
        (a, b) =>
          new Date(b.fecha).getTime() -
          new Date(a.fecha).getTime()
      )
      .slice(0, 8);
  }

  // =========================================================
  // PORCENTAJES
  // =========================================================

  porcentajeConductor(viajes: number): number {
    return this.viajesTotales > 0
      ? (viajes / this.viajesTotales) * 100
      : 0;
  }

  porcentajeFrecuencia(
    cantidad: number,
    lista: ResumenComuna[]
  ): number {
    const maximo =
      Math.max(
        0,
        ...lista.map(item => item.viajes)
      );

    return maximo > 0
      ? (cantidad / maximo) * 100
      : 0;
  }

  // =========================================================
  // GOOGLE MAPS
  // =========================================================

  enlaceGoogleMaps(ruta: ResumenRuta): string {
    const origen =
      encodeURIComponent(`${ruta.origen}, Chile`);

    const destino =
      encodeURIComponent(`${ruta.destino}, Chile`);

    return (
      'https://www.google.com/maps/dir/?api=1' +
      `&origin=${origen}` +
      `&destination=${destino}`
    );
  }

  // =========================================================
  // CONDUCTORES
  // =========================================================

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

    const rut =
      this.normalizarRut(resumen?.rut);

    const conductorRegistrado =
      rut
        ? this.conductores.find(
          conductor =>
            this.normalizarRut(conductor.rut) === rut
        )
        : undefined;

    if (conductorRegistrado) {
      return this.nombreConductor(conductorRegistrado);
    }

    const conductor =
      resumen as unknown as {
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

  // =========================================================
  // RUT
  // =========================================================

  private normalizarRut(rut: unknown): string {
    return String(rut ?? '')
      .replace(/[.\-\s]/g, '')
      .toUpperCase();
  }

  // =========================================================
  // ESTADOS
  // =========================================================

  etiquetaEstado(estado: string): string {
    if (!estado) {
      return 'Sin estado';
    }

    const normalizado =
      estado.toLocaleLowerCase('es-CL');

    const etiquetas: Record<string, string> = {
      pendiente: 'Pendiente',
      encurso: 'En curso',
      'en curso': 'En curso',
      completado: 'Completado',
      cancelado: 'Cancelado',
      cancelada: 'Cancelado'
    };

    return (
      etiquetas[
      normalizado.replace(/[\s_-]/g, '')
      ] ??
      etiquetas[normalizado] ??
      estado.replace(
        /([a-záéíóú])([A-ZÁÉÍÓÚ])/g,
        '$1 $2'
      )
    );
  }

  claseEstado(estado: string): string {
    const normalizado =
      estado
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

  // =========================================================
  // FORMATEOS
  // =========================================================

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

  formatoMoneda(valor: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    }).format(valor);
  }

  // =========================================================
  // FECHA ACTUALIZACIÓN
  // =========================================================

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

  // =========================================================
  // UTILIDADES
  // =========================================================

  private numero(valor: unknown): number {
    const numero = Number(valor);

    return Number.isFinite(numero)
      ? numero
      : 0;
  }

  private limpiar(valor: unknown): string {
    return String(valor ?? '').trim();
  }
}
