import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/login/login').then(m => m.LoginComponent),
    data: { mode: 'welcome' },
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
      import('./layouts/admin-layout/admin-layout').then(m => m.AdminLayoutComponent),
    children: [
      {
        path: 'clientes',
        loadComponent: () => import('./pages/clients/clients').then(m => m.ClientsPageComponent),
        data: { meta: { module: 'clients', eyebrow: 'Administración de usuarios', title: 'Clientes' } }
      },
      {
        path: 'membresias',
        loadComponent: () => import('./pages/memberships/memberships').then(m => m.MembershipsPageComponent),
        data: { meta: { module: 'memberships', eyebrow: 'Planes y vigencias', title: 'Membresías' } }
      },
      {
        path: 'asistencia',
        loadComponent: () => import('./pages/attendance/attendance').then(m => m.AttendancePageComponent),
        data: { meta: { module: 'attendance', eyebrow: 'Acceso al gimnasio', title: 'Control de asistencia' } }
      },
      {
        path: 'pagos',
        loadComponent: () => import('./pages/payments/payments').then(m => m.PaymentsPageComponent),
        data: { meta: { module: 'payments', eyebrow: 'Gestión financiera', title: 'Pagos' } }
      },
      {
        path: 'inventario/suplementos',
        loadComponent: () => import('./pages/inventory/supplements/supplements').then(m => m.SupplementsPageComponent),
        data: { meta: { module: 'supplements', eyebrow: 'Stock comercial', title: 'Inventario de suplementos' } }
      },
      {
        path: 'inventario/maquinas',
        loadComponent: () => import('./pages/inventory/machines/machines').then(m => m.MachinesPageComponent),
        data: { meta: { module: 'machines', eyebrow: 'Activos del gimnasio', title: 'Inventario de máquinas' } }
      },
      {
        path: 'reportes',
        loadComponent: () => import('./pages/reports/reports').then(m => m.ReportsPageComponent),
        data: { meta: { module: 'reports', eyebrow: 'Análisis administrativo', title: 'Reportes' } }
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
