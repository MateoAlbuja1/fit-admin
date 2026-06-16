import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/login/login').then(m => m.LoginComponent),
    data: { mode: 'welcome' }
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
    path: '**',
    redirectTo: 'login'
  }
];
