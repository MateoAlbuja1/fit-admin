import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';

type AuthMode = 'welcome' | 'login';
type UserRole = 'admin' | 'member';

interface GymSlide {
  image: string;
}

interface TrailPoint {
  x: number;
  y: number;
  createdAt: number;
}

interface AuthResponse {
  token: string;
  user: {
    username: string;
    fullName: string;
    role: 'ADMIN' | 'RECEPCION' | 'CLIENTE';
  };
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  mode: AuthMode = 'login';

  email = '';
  password = '';
  remember = true;
  message = '';
  isLoading = false;

  private readonly apiUrl = 'http://localhost:3000';

  private routeSub?: Subscription;
  private lastTrailTime = 0;
  private lastTrailPosition?: { x: number; y: number };
  private trailCanvas?: HTMLCanvasElement;
  private trailFrame?: number;
  private readonly trailPoints: TrailPoint[] = [];
  private readonly trailLifetime = 650;

  gymSlides: GymSlide[] = [
    {
      image: '/assets/img/logo1.avif'
    },
    {
      image: '/assets/img/logo2.avif'
    },
    {
      image: '/assets/img/logo3.avif'
    },
    {
      image: '/assets/img/logo4.avif'
    }
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.data.subscribe(data => {
      this.mode = data['mode'] === 'welcome' ? 'welcome' : 'login';
      this.message = '';

      if (this.mode !== 'welcome') {
        this.clearTrail();
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.clearTrail();
  }

  createTrail(event: MouseEvent): void {
    if (this.mode !== 'welcome') {
      return;
    }

    const now = performance.now();
    if (now - this.lastTrailTime < 8) {
      return;
    }

    const screen = event.currentTarget as HTMLElement;
    const canvas = screen.querySelector<HTMLCanvasElement>('.cursor-trail');
    if (!canvas) {
      return;
    }

    this.trailCanvas = canvas;
    this.prepareTrailCanvas(canvas);

    const previous = this.lastTrailPosition ?? { x: event.clientX, y: event.clientY };
    const distance = Math.hypot(event.clientX - previous.x, event.clientY - previous.y);
    const steps = Math.min(24, Math.max(1, Math.ceil(distance / 4)));

    for (let step = 1; step <= steps; step++) {
      const progress = step / steps;
      this.trailPoints.push({
        x: previous.x + (event.clientX - previous.x) * progress,
        y: previous.y + (event.clientY - previous.y) * progress,
        createdAt: now - (steps - step) * 1.5
      });
    }

    if (this.trailPoints.length > 320) {
      this.trailPoints.splice(0, this.trailPoints.length - 320);
    }

    if (this.trailFrame === undefined) {
      this.trailFrame = requestAnimationFrame(() => this.renderTrail(canvas));
    }

    this.lastTrailPosition = { x: event.clientX, y: event.clientY };
    this.lastTrailTime = now;
  }

  resetTrailPosition(): void {
    this.lastTrailPosition = undefined;
  }

  private prepareTrailCanvas(canvas: HTMLCanvasElement): void {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(canvas.clientWidth * ratio);
    const height = Math.round(canvas.clientHeight * ratio);

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')?.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
  }

  private renderTrail(canvas: HTMLCanvasElement): void {
    const context = canvas.getContext('2d');
    if (!context) {
      this.trailFrame = undefined;
      return;
    }

    const now = performance.now();
    while (this.trailPoints.length && now - this.trailPoints[0].createdAt > this.trailLifetime) {
      this.trailPoints.shift();
    }

    context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.globalCompositeOperation = 'lighter';

    for (let index = 1; index < this.trailPoints.length; index++) {
      const start = this.trailPoints[index - 1];
      const end = this.trailPoints[index];
      const opacity = Math.max(0, 1 - (now - end.createdAt) / this.trailLifetime);

      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
      context.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.34})`;
      context.lineWidth = 5 * opacity + 1;
      context.shadowColor = 'rgba(255, 255, 255, 0.8)';
      context.shadowBlur = 8;
      context.stroke();

      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
      context.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
      context.lineWidth = 1.25;
      context.shadowBlur = 0;
      context.stroke();
    }

    if (this.lastTrailPosition && this.trailPoints.length > 1) {
      context.beginPath();
      context.arc(this.lastTrailPosition.x, this.lastTrailPosition.y, 1.4, 0, Math.PI * 2);
      context.fillStyle = '#fff';
      context.shadowColor = '#fff';
      context.shadowBlur = 6;
      context.fill();
      context.shadowBlur = 0;
    }

    context.globalCompositeOperation = 'source-over';

    if (this.trailPoints.length > 1) {
      this.trailFrame = requestAnimationFrame(() => this.renderTrail(canvas));
    } else {
      context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      this.trailPoints.length = 0;
      this.trailFrame = undefined;
    }
  }

  private clearTrail(): void {
    this.lastTrailPosition = undefined;
    this.lastTrailTime = 0;
    this.trailPoints.length = 0;

    if (this.trailFrame !== undefined) {
      cancelAnimationFrame(this.trailFrame);
      this.trailFrame = undefined;
    }

    const context = this.trailCanvas?.getContext('2d');
    if (context && this.trailCanvas) {
      context.clearRect(0, 0, this.trailCanvas.clientWidth, this.trailCanvas.clientHeight);
    }

    this.trailCanvas = undefined;
  }

  switchMode(mode: AuthMode): void {
    this.message = '';
    this.clearTrail();
    const target = mode === 'login' ? '/login' : '/';
    this.router.navigate([target]);
  }

  goToRegister(): void {
    this.message = '';
    this.router.navigate(['/registro']);
  }

  goHome(): void {
    this.message = '';
    this.clearTrail();
    this.router.navigate(['/']);
  }

  handleSubmit(): void {
    this.message = '';
    const email = this.email.trim().toLowerCase();

    if (!email || !this.password) {
      this.message = 'Ingresa tu correo y contrasena.';
      return;
    }

    this.isLoading = true;
    this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, {
      email,
      password: this.password
    }).subscribe({
      next: response => {
        const role: UserRole = response.user.role === 'CLIENTE' ? 'member' : 'admin';
        const name = response.user.fullName || response.user.username;
        this.saveSession({
          role,
          username: response.user.username,
          name,
          initials: this.initials(name),
          subtitle: role === 'admin' ? 'Administrador' : 'Miembro activo'
        }, response.token);
        this.router.navigate([role === 'admin' ? '/dashboard' : '/']);
      },
      error: error => {
        this.message = error.status === 0
          ? 'No se pudo conectar con el backend. Levanta Docker y vuelve a intentar.'
          : 'Credenciales invalidas.';
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  private saveSession(session: { role: UserRole; username: string; name: string; initials: string; subtitle: string }, token: string): void {
    const payload = JSON.stringify(session);

    if (typeof localStorage !== 'undefined') {
      if (this.remember) {
        localStorage.setItem('fitadmin-session', payload);
        localStorage.setItem('fitadmin-auth', 'true');
        localStorage.setItem('fitadmin-token', token);
      } else {
        localStorage.removeItem('fitadmin-session');
        localStorage.removeItem('fitadmin-auth');
        localStorage.removeItem('fitadmin-token');
      }

      if (session.role === 'admin') {
        localStorage.setItem('fitadmin-admin-session', payload);
      } else {
        localStorage.removeItem('fitadmin-admin-session');
      }
    }

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('fitadmin-session', payload);
      sessionStorage.setItem('fitadmin-auth', 'true');
      sessionStorage.setItem('fitadmin-token', token);

      if (session.role === 'admin') {
        sessionStorage.setItem('fitadmin-admin-session', payload);
      } else {
        sessionStorage.removeItem('fitadmin-admin-session');
      }
    }
  }

  private initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('') || 'U';
  }
}
