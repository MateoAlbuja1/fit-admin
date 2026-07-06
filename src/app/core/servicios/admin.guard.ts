import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

interface StoredSession {
  role?: 'admin' | 'member';
}

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);

  if (isAdminSession()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

function isAdminSession(): boolean {
  const session = readSession();
  const token = readToken();
  return Boolean(token && session?.role === 'admin');
}

function readSession(): StoredSession | null {
  const raw = readStorage('fitadmin-session');
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

function readToken(): string | null {
  return readStorage('fitadmin-token');
}

function readStorage(key: string): string | null {
  if (typeof localStorage !== 'undefined') {
    const value = localStorage.getItem(key);
    if (value) return value;
  }

  if (typeof sessionStorage !== 'undefined') {
    return sessionStorage.getItem(key);
  }

  return null;
}
