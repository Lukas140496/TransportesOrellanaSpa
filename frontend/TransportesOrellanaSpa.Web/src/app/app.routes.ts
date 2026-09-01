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
        path: 'viajes/:id',
        component: ViajeDetail
      }

    ]
  }

];