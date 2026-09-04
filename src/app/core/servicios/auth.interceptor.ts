import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { isApiUrl } from '../config/api.config';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token;

  const isApiRequest = isApiUrl(req.url);

  if (!token || !isApiRequest) {
    return next(req);
  }

  return next(req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  }));
};
