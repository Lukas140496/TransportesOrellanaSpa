import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import * as L from 'leaflet';

import { ApiService } from '../../../core/services/api.service';
import { Viaje } from '../../../core/models/viaje';
import { PermissionService } from '../../../core/services/permission.service';
import { PrecioDieselHistorico } from '../../../core//models/precio-diesel-historico';

// Importación del JSON de clientes frecuentes
import * as clientesData from '../../../core/assets/json/clientes-frecuentes.json';

@Component({
  selector: 'app-viaje-detail',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './viaje-detail.html',
  styleUrl: './viaje-detail.scss'
})
export class ViajeDetail implements OnInit, OnDestroy {

  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly permissionService = inject(PermissionService);

  cargandoPrecioDiesel = false;
  precioDieselHistorico: PrecioDieselHistorico | null = null;

  // =========================
  // MODALES
  // =========================

  modalConfirmacionVisible = false;
  modalPagoVisible = false;

  modalExitoVisible = false;
  modalExitoTitulo = '';
  modalExitoMensaje = '';

  modalErrorVisible = false;
  modalErrorTitulo = '';
  modalErrorMensaje = '';

  completando = false;
  pagando = false;

  // =========================
  // VIAJE
  // =========================

  viaje: Viaje | null = null;

  cargando = true;
  error = '';

  // =========================
  // MAPA DEL RECORRIDO
  // =========================

  private mapaRecorrido: L.Map | null = null;
  private capaRecorrido: L.FeatureGroup = L.featureGroup();

  mapaCargando = false;
  errorMapa = '';
  kilometrosRuta: number | null = null;

  // =========================
  // INICIALIZACIÓN
  // =========================

  ngOnInit(): void {

    const idParam = this.route.snapshot.paramMap.get('id');

    if (!idParam) {
      this.error = 'No se especificó un viaje.';
      this.cargando = false;
      return;
    }

    const id = Number(idParam);

    if (Number.isNaN(id)) {
      this.error = 'El identificador del viaje no es válido.';
      this.cargando = false;
      return;
    }

    this.api.getViajeById(id).subscribe({

      next: viaje => {
        this.viaje = viaje;
        this.cargarPrecioDieselHistorico(viaje.fecha);
        this.cargando = false;

        this.configurarIconosLeaflet();

        setTimeout(() => {
          void this.inicializarMapaRecorrido(viaje);
        }, 100);
      },

      error: error => {
        console.error('Error al cargar viaje:', error);

        this.error = 'No fue posible cargar la información del viaje.';
        this.cargando = false;
      }

    });

  }

  // =========================
  // DESTRUIR MAPA
  // =========================

  ngOnDestroy(): void {

    if (this.mapaRecorrido) {
      this.mapaRecorrido.remove();
      this.mapaRecorrido = null;
    }

    this.capaRecorrido.clearLayers();
  }

  // =========================
  // ICONOS LEAFLET
  // =========================

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

  // =========================
  // EXTRAER DIRECCIÓN
  // DESDE OBSERVACIONES
  // =========================

  private extraerDireccionObservaciones(
    observaciones: string | null | undefined
  ): string | null {

    if (!observaciones) {
      return null;
    }

    const regex =
      /(?:^|\s)direcci[oó]n\s*:\s*(.+?)(?=\s+(?:carga|peso|nota\s+de\s+venta|orden\s+de\s+compra|tarifa(?:\s+de)?\s+combustible(?:\s+actual)?)\s*:|$)/i;

    const coincidencia = observaciones.match(regex);

    if (!coincidencia || !coincidencia[1]) {
      return null;
    }

    const direccion = coincidencia[1]
      .trim()
      .replace(/[.,;]+$/, '')
      .trim();

    return direccion.length > 0 ? direccion : null;
  }

  // =========================
  // DIRECTORIO DE CLIENTES / PLANTAS FRECUENTES
  // (Carga dinámica desde clientes-frecuentes.json)
  // =========================

  private obtenerDireccionConocida(nombreEmpresa: string): string | null {
    if (!nombreEmpresa) {
      return null;
    }

    const normalizada = nombreEmpresa
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .trim();

    // Compatibilidad para módulos de importación JSON en TypeScript/Angular
    const mapaClientes: Record<string, string> =
      (clientesData as any).default || clientesData;

    for (const [key, direccion] of Object.entries(mapaClientes)) {
      const keyNormalizada = key
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .trim();

      if (normalizada.includes(keyNormalizada)) {
        return direccion;
      }
    }

    return null;
  }

  // =========================
  // INICIALIZAR MAPA
  // =========================

  private async inicializarMapaRecorrido(
    viaje: Viaje
  ): Promise<void> {

    const contenedor = document.getElementById(
      'mapa-recorrido-viaje'
    );

    if (!contenedor) {
      return;
    }

    if (this.mapaRecorrido) {
      this.mapaRecorrido.remove();
      this.mapaRecorrido = null;
    }

    this.errorMapa = '';
    this.mapaCargando = true;

    this.mapaRecorrido = L.map(contenedor);

    requestAnimationFrame(() => {
      this.mapaRecorrido?.invalidateSize({
        pan: false,
        animate: false
      });
    });

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }
    ).addTo(this.mapaRecorrido);

    this.capaRecorrido = L.featureGroup().addTo(
      this.mapaRecorrido
    );

    try {

      const direccionObservaciones =
        this.extraerDireccionObservaciones(
          viaje.observaciones
        );

      // -------------------------
      // BUSCAR ORIGEN
      // -------------------------

      const origen = await this.geocodificarDireccion(
        viaje.origen,
        viaje.comunaOrigen,
        direccionObservaciones
      );

      if (!origen) {
        throw new Error(
          `No se encontró la ubicación de origen "${viaje.origen}" en ${viaje.comunaOrigen}.`
        );
      }

      // -------------------------
      // BUSCAR DESTINO
      // -------------------------

      const destino = await this.geocodificarDireccion(
        viaje.destino,
        viaje.comunaDestino,
        direccionObservaciones
      );

      if (!destino) {
        throw new Error(
          `No se encontró la ubicación de destino "${viaje.destino}" en ${viaje.comunaDestino}.`
        );
      }

      if (!this.mapaRecorrido) {
        return;
      }

      // -------------------------
      // MARCADOR DE ORIGEN
      // -------------------------

      const nombreOrigen = this.escaparHtml(
        viaje.origen || 'Origen'
      );

      const comunaOrigen = this.escaparHtml(
        viaje.comunaOrigen || ''
      );

      L.marker([origen.lat, origen.lng])
        .bindPopup(
          `<strong>Origen: ${nombreOrigen}</strong><br>${comunaOrigen}`
        )
        .addTo(this.capaRecorrido);

      // -------------------------
      // MARCADOR DE DESTINO
      // -------------------------

      const nombreDestino = this.escaparHtml(
        viaje.destino || 'Destino'
      );

      const comunaDestino = this.escaparHtml(
        viaje.comunaDestino || ''
      );

      L.marker([destino.lat, destino.lng])
        .bindPopup(
          `<strong>Destino: ${nombreDestino}</strong><br>${comunaDestino}`
        )
        .addTo(this.capaRecorrido);

      // -------------------------
      // CALCULAR RUTA VIAL
      // -------------------------

      const urlRuta =
        'https://router.project-osrm.org/route/v1/driving/' +
        `${origen.lng},${origen.lat};${destino.lng},${destino.lat}` +
        '?overview=full&geometries=geojson&steps=false';

      const respuesta = await fetch(urlRuta);

      if (!respuesta.ok) {
        throw new Error(
          'No fue posible calcular el recorrido vial.'
        );
      }

      const datos = await respuesta.json();

      if (
        datos.code !== 'Ok' ||
        !datos.routes ||
        datos.routes.length === 0
      ) {
        throw new Error(
          'No se encontró una ruta vial entre las ubicaciones.'
        );
      }

      const distanciaMetros = datos.routes[0].distance;
      this.kilometrosRuta = distanciaMetros / 1000;

      const coordenadas = datos.routes[0].geometry.coordinates.map(
        (coordenada: [number, number]) =>
          L.latLng(coordenada[1], coordenada[0])
      );

      L.polyline(coordenadas, {
        color: '#2563eb',
        weight: 5,
        opacity: 0.85
      }).addTo(this.capaRecorrido);

      this.mapaRecorrido.invalidateSize({
        pan: false,
        animate: false
      });

      this.mapaRecorrido.fitBounds(
        this.capaRecorrido.getBounds(),
        { padding: [30, 30] }
      );

    } catch (error) {

      console.error(
        'Error al cargar el recorrido del viaje:',
        error
      );

      this.errorMapa =
        error instanceof Error
          ? error.message
          : 'No fue posible mostrar el recorrido del viaje.';

      if (
        this.mapaRecorrido &&
        this.capaRecorrido.getLayers().length > 0
      ) {
        this.mapaRecorrido.fitBounds(
          this.capaRecorrido.getBounds(),
          { padding: [30, 30] }
        );
      } else if (this.mapaRecorrido) {
        this.mapaRecorrido.setView(
          [-33.4489, -70.6693],
          6
        );
      }

    } finally {
      this.mapaCargando = false;
    }

  }

  // =========================
  // GEOCODIFICAR EMPRESA
  // Y DIRECCIÓN
  // =========================

  // =========================
  // GEOCODIFICAR EMPRESA
  // Y DIRECCIÓN
  // =========================

  private async geocodificarDireccion(
    nombreEmpresa: string,
    comuna?: string,
    direccionObservacion?: string | null
  ): Promise<{
    lat: number;
    lng: number;
    nombre: string;
  } | null> {

    const consultas: string[] = [];

    const empresa = nombreEmpresa?.trim();
    const nombreComuna = comuna?.trim();
    const direccionLimpia = direccionObservacion?.trim();

    // 1. REGLA PRINCIPAL: Si la empresa está en el JSON, usamos EXCLUSIVAMENTE esa dirección
    const direccionConocida = this.obtenerDireccionConocida(empresa);
    if (direccionConocida) {
      consultas.push(direccionConocida);
    } else {
      // 2. Si NO está en el JSON, recién intentamos con las observaciones o búsquedas generales
      if (direccionLimpia && nombreComuna) {
        consultas.push(
          `${direccionLimpia}, ${nombreComuna}, Chile`
        );
      }

      if (empresa && direccionLimpia && nombreComuna) {
        consultas.push(
          `${empresa}, ${direccionLimpia}, ${nombreComuna}, Chile`
        );
      }

      if (empresa && nombreComuna) {
        consultas.push(
          `${empresa}, ${nombreComuna}, Chile`
        );
      }

      if (empresa) {
        consultas.push(`${empresa}, Chile`);
      }
    }

    const consultasUnicas = [...new Set(consultas)];

    for (const consulta of consultasUnicas) {
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

        if (!resultados || resultados.length === 0) {
          continue;
        }

        const resultado = resultados[0];
        const lat = Number(resultado.lat);
        const lng = Number(resultado.lon);

        if (
          !Number.isFinite(lat) ||
          !Number.isFinite(lng)
        ) {
          continue;
        }

        return {
          lat,
          lng,
          nombre: resultado.display_name || consulta
        };

      } catch (error) {
        console.error(
          `Error al buscar la ubicación "${consulta}":`,
          error
        );
      }
    }

    return null;
  }

  // =========================
  // ESCAPAR TEXTO DE POPUPS
  // =========================

  private escaparHtml(texto: string): string {

    return texto
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // =========================
  // COMPLETAR VIAJE
  // =========================

  mostrarConfirmacionCompletar(): void {

    if (!this.viaje) {
      return;
    }

    if (
      this.viaje.estado !== 'Pendiente' &&
      this.viaje.estado !== 'EnCurso'
    ) {
      return;
    }

    this.modalConfirmacionVisible = true;
  }

  cerrarModalConfirmacion(): void {

    if (this.completando) {
      return;
    }

    this.modalConfirmacionVisible = false;
  }

  confirmarCompletar(): void {

    if (!this.viaje || this.completando) {
      return;
    }

    this.completando = true;

    this.api.completarViaje(
      this.viaje.id
    ).subscribe({

      next: viajeActualizado => {

        this.viaje = viajeActualizado;

        this.completando = false;
        this.modalConfirmacionVisible = false;

        this.modalExitoTitulo =
          'Viaje completado correctamente';

        this.modalExitoMensaje =
          `El viaje con guía ${viajeActualizado.numeroGuiaDespacho} fue marcado como completado.`;

        this.modalExitoVisible = true;
      },

      error: error => {

        console.error(
          'Error al completar viaje:',
          error
        );

        this.completando = false;
        this.modalConfirmacionVisible = false;

        this.modalErrorTitulo =
          'No se pudo completar el viaje';

        this.modalErrorMensaje =
          error.error ||
          'Ocurrió un error al intentar marcar el viaje como completado.';

        this.modalErrorVisible = true;
      }

    });
  }

  // =========================
  // REGISTRAR PAGO
  // =========================

  mostrarConfirmacionPago(): void {

    if (!this.viaje) {
      return;
    }

    if (this.viaje.estadoPago === 'Pagado') {
      return;
    }

    this.modalPagoVisible = true;
  }

  cerrarModalPago(): void {

    if (this.pagando) {
      return;
    }

    this.modalPagoVisible = false;
  }

  confirmarPago(): void {

    if (!this.viaje || this.pagando) {
      return;
    }

    this.pagando = true;

    this.api.pagarViaje(
      this.viaje.id
    ).subscribe({

      next: viajeActualizado => {

        this.viaje = viajeActualizado;

        this.pagando = false;
        this.modalPagoVisible = false;

        this.modalExitoTitulo =
          'Pago registrado correctamente';

        this.modalExitoMensaje =
          `El viaje con guía ${viajeActualizado.numeroGuiaDespacho} fue marcado como pagado.`;

        this.modalExitoVisible = true;
      },

      error: error => {

        console.error(
          'Error al registrar pago:',
          error
        );

        this.pagando = false;
        this.modalPagoVisible = false;

        this.modalErrorTitulo =
          'No se pudo registrar el pago';

        this.modalErrorMensaje =
          error.error ||
          'Ocurrió un error al intentar registrar el pago.';

        this.modalErrorVisible = true;
      }

    });
  }


  private cargarPrecioDieselHistorico(fechaViaje: string | Date): void {
    this.cargandoPrecioDiesel = true;

    const fecha = typeof fechaViaje === 'string'
      ? fechaViaje.substring(0, 10)
      : `${fechaViaje.getFullYear()}-${String(
        fechaViaje.getMonth() + 1
      ).padStart(2, '0')}-${String(
        fechaViaje.getDate()
      ).padStart(2, '0')}`;

    this.api.getPrecioDieselHistorico(fecha).subscribe({
      next: (resultado) => {
        this.precioDieselHistorico = resultado;
        this.cargandoPrecioDiesel = false;
      },
      error: (error) => {
        console.error('Error al consultar el precio histórico del diésel:', error);
        this.precioDieselHistorico = null;
        this.cargandoPrecioDiesel = false;
      }
    });
  }

  nombreMesPrecioDiesel(mes: number): string {
    const meses = [
      'enero', 'febrero', 'marzo', 'abril',
      'mayo', 'junio', 'julio', 'agosto',
      'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];

    return meses[mes - 1] ?? '';
  }

  // =========================
  // CERRAR MODALES
  // =========================

  cerrarModalExito(): void {
    this.modalExitoVisible = false;
  }

  cerrarModalError(): void {
    this.modalErrorVisible = false;
  }

  obtenerLineasObservaciones(
    observaciones: string
  ): { titulo: string | null; contenido: string }[] {
  
    const titulos = [
      'Nota de venta',
      'Orden de compra',
      'Dirección',
      'Direccion',
      'Carga',
      'Peso',
      'Precio combustible',
      'Este servicio incluye la guía',
      'Este servicio incluye la guia'
    ];
  
    const lineas = observaciones
      .split(/\r?\n/)
      .map(linea => linea.trim())
      .filter(linea => linea.length > 0);
  
    return lineas.map(linea => {
  
      // Buscar si la línea comienza con alguno de los títulos conocidos
      const tituloEncontrado = titulos.find(titulo => {
  
        const regex = new RegExp(
          `^${titulo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*: ?`,
          'i'
        );
  
        return regex.test(linea);
      });
  
      if (tituloEncontrado) {
  
        const regex = new RegExp(
          `^${tituloEncontrado.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*: ?`,
          'i'
        );
  
        const contenido = linea
          .replace(regex, '')
          .trim();
  
        return {
          titulo: tituloEncontrado,
          contenido
        };
      }
  
      // Compatibilidad con cualquier otro texto que venga como "Título: contenido"
      const coincidencia = linea.match(
        /^([^:]+):\s*(.*)$/
      );
  
      if (coincidencia) {
  
        return {
          titulo: coincidencia[1].trim(),
          contenido: coincidencia[2].trim()
        };
  
      }
  
      // Línea sin título
      return {
        titulo: null,
        contenido: linea
      };
  
    });
  }

  // =========================
  // VOLVER
  // =========================

  volver(): void {
    this.router.navigate(['/viajes']);
  }

}