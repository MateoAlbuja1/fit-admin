import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = readToken();

  if (!token || !req.url.startsWith('http://localhost:3000')) {
    return next(req);
  }

  return next(req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  }));
};

function readToken(): string | null {
  if (typeof localStorage !== 'undefined') {
    const token = localStorage.getItem('fitadmin-token');
    if (token) return token;
  }

  if (typeof sessionStorage !== 'undefined') {
    return sessionStorage.getItem('fitadmin-token');
  }

  return null;
}
