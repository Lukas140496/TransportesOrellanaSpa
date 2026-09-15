import { Routes } from '@angular/router';

import { MainLayout } from './layout/main-layout/main-layout';

import { Dashboard } from './components/dashboard/dashboard';

import { CamionList } from './components/camion/camion-list/camion-list';
import { CamionDetail } from './components/camion/camion-detail/camion-detail';

import { ConductorList } from './components/conductor/conductor-list/conductor-list';
import { ConductorDetail } from './components/conductor/conductor-detail/conductor-detail';

import { RemolqueList } from './components/remolque/remolque-list/remolque-list';
import { RemolqueDetail } from './components/remolque/remolque-detail/remolque-detail';

import { ClienteList } from './components/cliente/cliente-list/cliente-list';
import { ClienteDetail } from './components/cliente/cliente-detail/cliente-detail';

import { ViajeList } from './components/viaje/viaje-list/viaje-list';
import { ViajeDetail } from './components/viaje/viaje-detail/viaje-detail';
import { ClienteForm } from './components/cliente/cliente-form/cliente-form';
import { ClienteModificar } from './components/cliente/cliente-modificar/cliente-modificar';
import { ClienteDesactivar } from './components/cliente/cliente-desactivar/cliente-desactivar';
import { ViajeForm } from './components/viaje/viaje-form/viaje-form';
import { CamionAsignarRemolque } from './components/camion/camion-asignar-remolque/camion-asignar-remolque';
import { CamionAsignarConductor } from './components/camion/camion-asignar-conductor/camion-asignar-conductor';
import { RemolqueAsignarCamion } from './components/remolque/remolque-asignar-camion/remolque-asignar-camion';
import { ViajeModificar } from './components/viaje/viaje-modificar/viaje-modificar';
import { ViajeEliminar } from './components/viaje/viaje-eliminar/viaje-eliminar';
import { CamionForm } from './components/camion/camion-form/camion-form';
import { CamionModificar } from './components/camion/camion-modificar/camion-modificar';

import { Pagos } from './components/pagos/pagos';


export const routes: Routes = [

  {
    path: '',
    component: MainLayout,

    children: [

      // =========================
      // DASHBOARD
      // =========================

      {
        path: '',
        component: Dashboard
      },


      // =========================
      // CAMIONES
      // =========================

      {
        path: 'camiones',
        component: CamionList
      },

      {
        path: 'camiones/nuevo',
        component: CamionForm
      },

      {
        path: 'camiones/modificar',
        component: CamionModificar
      },

      {
        path: 'camiones/modificar/:patente',
        component: CamionModificar
      },

      {
        path: 'camiones/asignar-remolque',
        component: CamionAsignarRemolque
      },

      {
        path: 'camiones/asignar-conductor',
        component: CamionAsignarConductor
      },

      {
        path: 'camiones/:patente',
        component: CamionDetail
      },


      // =========================
      // CONDUCTORES
      // =========================

      {
        path: 'conductores',
        component: ConductorList
      },

      {
        path: 'conductores/:rut',
        component: ConductorDetail
      },


      // =========================
      // REMOLQUES
      // =========================

      {
        path: 'remolques',
        component: RemolqueList
      },

      {
        path: 'remolques/asignar-camion',
        component: RemolqueAsignarCamion
      },

      {
        path: 'remolques/:patente',
        component: RemolqueDetail
      },


      // =========================
      // CLIENTES
      // =========================

      {
        path: 'clientes',
        component: ClienteList
      },

      {
        path: 'clientes/nuevo',
        component: ClienteForm
      },

      {
        path: 'clientes/modificar',
        component: ClienteModificar
      },

      {
        path: 'clientes/desactivar',
        component: ClienteDesactivar
      },

      {
        path: 'clientes/:id/editar',
        component: ClienteForm
      },

      {
        path: 'clientes/:id',
        component: ClienteDetail
      },


      // =========================
      // VIAJES
      // =========================

      {
        path: 'viajes',
        component: ViajeList
      },

      {
        path: 'viajes/nuevo',
        component: ViajeForm
      },

      {
        path: 'viajes/modificar',
        component: ViajeModificar
      },

      {
        path: 'viajes/eliminar',
        component: ViajeEliminar
      },

      {
        path: 'viajes/:id',
        component: ViajeDetail
      },


      // =========================
      // PAGOS
      // =========================

      {
        path: 'pagos',
        component: Pagos
      }

    ]
  }

];