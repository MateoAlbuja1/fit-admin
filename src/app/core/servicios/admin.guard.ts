import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const auth = inject(AuthService);

  if (auth.token && auth.currentUser?.role === 'admin') {
    return true;
  }

  return router.createUrlTree(['/login']);
};

export const adminOnlyGuard: CanActivateFn = () => {
  const router = inject(Router);
  const auth = inject(AuthService);

  if (auth.token && auth.currentUser?.apiRole === 'ADMIN') {
    return true;
  }

  return router.createUrlTree(auth.token ? ['/dashboard'] : ['/login']);
};
