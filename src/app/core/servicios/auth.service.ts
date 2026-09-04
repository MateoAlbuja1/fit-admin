import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, map, Observable } from 'rxjs';
import { apiBaseUrl } from '../config/api.config';

export type ApiUserRole = 'ADMIN' | 'RECEPCION' | 'CLIENTE';
export type AppUserRole = 'admin' | 'member';

export interface AuthSession {
  role: AppUserRole;
  apiRole: ApiUserRole;
  username: string;
  name: string;
  initials: string;
  subtitle: string;
}

interface AuthResponse {
  token: string;
  user: {
    username: string;
    fullName: string;
    role: ApiUserRole;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = apiBaseUrl();
  private readonly currentUserSubject = new BehaviorSubject<AuthSession | null>(
    this.readStoredSession()
  );

  readonly currentUser$ = this.currentUserSubject.asObservable();
  readonly role$ = this.currentUser$.pipe(
    map(user => user?.apiRole ?? null),
    distinctUntilChanged()
  );
  readonly isAdmin$ = this.role$.pipe(
    map(role => role === 'ADMIN'),
    distinctUntilChanged()
  );

  constructor(private http: HttpClient) {}

  get currentUser(): AuthSession | null {
    return this.currentUserSubject.value;
  }

  get token(): string | null {
    return this.readStorageValue('fitadmin-token');
  }

  login(email: string, password: string, remember: boolean): Observable<AuthSession> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      map(response => {
        const session = this.createSession(response.user);
        this.persistSession(session, response.token, remember);
        this.currentUserSubject.next(session);
        return session;
      })
    );
  }

  logout(): void {
    this.clearStorage();
    this.currentUserSubject.next(null);
  }

  private createSession(user: AuthResponse['user']): AuthSession {
    const role: AppUserRole = user.role === 'CLIENTE' ? 'member' : 'admin';
    const name = user.fullName || user.username;

    return {
      role,
      apiRole: user.role,
      username: user.username,
      name,
      initials: this.initials(name),
      subtitle: user.role === 'ADMIN'
        ? 'Administrador'
        : user.role === 'RECEPCION'
          ? 'Recepción'
          : 'Miembro activo'
    };
  }

  private persistSession(session: AuthSession, token: string, remember: boolean): void {
    this.clearStorage();
    const payload = JSON.stringify(session);

    if (remember && typeof localStorage !== 'undefined') {
      this.writeSession(localStorage, payload, token, session.role === 'admin');
    }

    if (typeof sessionStorage !== 'undefined') {
      this.writeSession(sessionStorage, payload, token, session.role === 'admin');
    }
  }

  private writeSession(storage: Storage, payload: string, token: string, adminPanel: boolean): void {
    storage.setItem('fitadmin-session', payload);
    storage.setItem('fitadmin-auth', 'true');
    storage.setItem('fitadmin-token', token);

    if (adminPanel) {
      storage.setItem('fitadmin-admin-session', payload);
    }
  }

  private clearStorage(): void {
    const keys = [
      'fitadmin-session',
      'fitadmin-auth',
      'fitadmin-token',
      'fitadmin-admin-session'
    ];

    if (typeof localStorage !== 'undefined') {
      keys.forEach(key => localStorage.removeItem(key));
    }

    if (typeof sessionStorage !== 'undefined') {
      keys.forEach(key => sessionStorage.removeItem(key));
    }
  }

  private readStoredSession(): AuthSession | null {
    const raw = this.readStorageValue('fitadmin-session');
    if (!raw) return null;

    try {
      const session = JSON.parse(raw) as Partial<AuthSession>;
      if (!session.username || !session.name || !session.role) return null;

      return {
        role: session.role,
        apiRole: this.validApiRole(session.apiRole)
          ? session.apiRole
          : session.role === 'admin' ? 'ADMIN' : 'CLIENTE',
        username: session.username,
        name: session.name,
        initials: session.initials || this.initials(session.name),
        subtitle: session.subtitle || (session.role === 'admin' ? 'Administrador' : 'Miembro activo')
      };
    } catch {
      return null;
    }
  }

  private readStorageValue(key: string): string | null {
    if (typeof localStorage !== 'undefined') {
      const value = localStorage.getItem(key);
      if (value) return value;
    }

    return typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(key) : null;
  }

  private validApiRole(role: unknown): role is ApiUserRole {
    return role === 'ADMIN' || role === 'RECEPCION' || role === 'CLIENTE';
  }

  private initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('') || 'U';
  }
}
