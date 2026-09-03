import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { apiBaseUrl } from '../../core/config/api.config';

interface GymSlide {
  image: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent implements OnInit, OnDestroy {
  firstName = '';
  lastName = '';
  email = '';
  phone = '';
  registerPassword = '';
  confirmPassword = '';
  acceptTerms = false;
  message = '';
  messageType: 'success' | 'error' | 'info' = 'error';
  isLoading = false;

  private readonly apiUrl = apiBaseUrl();
  private loadingFallback?: ReturnType<typeof setTimeout>;

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
    private http: HttpClient,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('reason') === 'compra') {
      this.messageType = 'info';
      this.message = 'Para comprar productos primero crea una cuenta. Luego inicia sesion con tu correo.';
    }
  }

  ngOnDestroy(): void {
    this.clearLoadingFallback();
  }

  goToLogin(): void {
    this.message = '';
    this.router.navigate(['/login']);
  }

  handleRegister(): void {
    this.message = '';
    this.messageType = 'error';

    if (!this.firstName.trim() || !this.lastName.trim() || !this.email.trim() || !this.registerPassword) {
      this.message = 'Completa los datos obligatorios.';
      return;
    }

    if (this.registerPassword !== this.confirmPassword) {
      this.message = 'Las contrasenas no coinciden.';
      return;
    }

    if (this.registerPassword.length < 8) {
      this.message = 'La contrasena debe tener al menos 8 caracteres.';
      return;
    }

    if (!this.acceptTerms) {
      this.message = 'Debes aceptar los terminos para crear la cuenta.';
      return;
    }

    this.startLoadingFallback();
    this.http.post(`${this.apiUrl}/auth/register`, {
      username: this.email.trim().toLowerCase(),
      email: this.email.trim().toLowerCase(),
      password: this.registerPassword,
      fullName: `${this.firstName.trim()} ${this.lastName.trim()}`,
      phone: this.phone.trim()
    }).pipe(
      timeout(10000),
      finalize(() => {
        this.updateView(() => {
          this.clearLoadingFallback();
          this.isLoading = false;
        });
      })
    ).subscribe({
      next: () => {
        this.updateView(() => {
          this.messageType = 'success';
          this.message = 'Registro creado correctamente. Ya puedes iniciar sesion con tu correo.';
          this.firstName = '';
          this.lastName = '';
          this.email = '';
          this.phone = '';
          this.registerPassword = '';
          this.confirmPassword = '';
          this.acceptTerms = false;
        });
      },
      error: error => {
        this.updateView(() => {
          this.messageType = 'error';
          this.message = this.registerErrorMessage(error);
        });
      }
    });
  }

  private startLoadingFallback(): void {
    this.clearLoadingFallback();
    this.isLoading = true;

    this.loadingFallback = setTimeout(() => {
      this.updateView(() => {
        if (!this.isLoading) {
          return;
        }

        this.isLoading = false;
        this.messageType = 'error';
        this.message = 'No se recibio confirmacion del registro. Intenta iniciar sesion con tu correo o vuelve a probar.';
      });
    }, 12000);
  }

  private clearLoadingFallback(): void {
    if (this.loadingFallback) {
      clearTimeout(this.loadingFallback);
      this.loadingFallback = undefined;
    }
  }

  private updateView(update: () => void): void {
    this.zone.run(() => {
      update();
      this.cdr.markForCheck();
    });
  }

  private registerErrorMessage(error: { status?: number; name?: string }): string {
    if (error.name === 'TimeoutError') {
      return 'El backend tardo demasiado en responder. Revisa que Docker este levantado e intenta de nuevo.';
    }
    if (error.status === 0) {
      return 'No se pudo conectar con el backend. Levanta Docker y vuelve a intentar.';
    }
    if (error.status === 409) {
      return 'Ese correo ya esta registrado. Inicia sesion con tu correo.';
    }
    if (error.status === 400) {
      return 'No se pudo crear el registro. Revisa correo, telefono y contrasena.';
    }
    return 'No se pudo crear el registro. Intenta nuevamente.';
  }
}
