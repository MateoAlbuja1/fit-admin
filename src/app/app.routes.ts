import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/landing/landing').then(m => m.LandingComponent),
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login').then(m => m.LoginComponent),
    data: { mode: 'login' }
  },
  {
    path: 'registro',
    loadComponent: () =>
      import('./pages/register/register').then(m => m.RegisterComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard').then(m => m.DashboardComponent)
  },
  {
    path: '',
    loadComponent: () =>
      import('./layouts/layout-administrativo/layout-administrativo').then(m => m.LayoutAdministrativoComponent),
    children: [
      {
        path: 'clientes',
        loadComponent: () => import('./pages/clientes/clientes').then(m => m.PaginaClientesComponent),
        data: { meta: { modulo: 'clientes', eyebrow: 'Administración de usuarios', title: 'Clientes' } }
      },
      {
        path: 'membresias',
        loadComponent: () => import('./pages/membresias/membresias').then(m => m.PaginaMembresiasComponent),
        data: { meta: { modulo: 'membresias', eyebrow: 'Planes y vigencias', title: 'Membresías' } }
      },
      {
        path: 'asistencia',
        loadComponent: () => import('./pages/asistencia/asistencia').then(m => m.PaginaAsistenciaComponent),
        data: { meta: { modulo: 'asistencia', eyebrow: 'Acceso al gimnasio', title: 'Control de asistencia' } }
      },
      {
        path: 'pagos',
        loadComponent: () => import('./pages/pagos/pagos').then(m => m.PaginaPagosComponent),
        data: { meta: { modulo: 'pagos', eyebrow: 'Gestión financiera', title: 'Pagos' } }
      },
      {
        path: 'inventario/suplementos',
        loadComponent: () => import('./pages/inventario/suplementos/suplementos').then(m => m.PaginaSuplementosComponent),
        data: { meta: { modulo: 'suplementos', eyebrow: 'Stock comercial', title: 'Inventario de suplementos' } }
      },
      {
        path: 'inventario/maquinas',
        loadComponent: () => import('./pages/inventario/maquinas/maquinas').then(m => m.PaginaMaquinasComponent),
        data: { meta: { modulo: 'maquinas', eyebrow: 'Activos del gimnasio', title: 'Inventario de máquinas' } }
      },
      {
        path: 'reportes',
        loadComponent: () => import('./pages/reportes/reportes').then(m => m.PaginaReportesComponent),
        data: { meta: { modulo: 'reportes', eyebrow: 'Análisis administrativo', title: 'Reportes' } }
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
