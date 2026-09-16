import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { timeout } from 'rxjs';
import { isApiUrl } from '../config/api.config';
import { AuthService } from './auth.service';

const API_TIMEOUT_MS = 30000;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token;

  const isApiRequest = isApiUrl(req.url);

  if (!isApiRequest) {
    return next(req);
  }

  const apiRequest = token ? req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  }) : req;

  return next(apiRequest).pipe(timeout(API_TIMEOUT_MS));
};
