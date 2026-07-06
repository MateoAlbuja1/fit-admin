import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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
export class RegisterComponent {
  firstName = '';
  lastName = '';
  email = '';
  phone = '';
  registerPassword = '';
  confirmPassword = '';
  acceptTerms = false;
  message = '';
  isLoading = false;

  private readonly apiUrl = 'http://localhost:3000';

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
    private http: HttpClient
  ) {}

  goToLogin(): void {
    this.message = '';
    this.router.navigate(['/login']);
  }

  handleRegister(): void {
    this.message = '';

    if (!this.firstName.trim() || !this.lastName.trim() || !this.email.trim() || !this.registerPassword) {
      this.message = 'Completa los datos obligatorios.';
      return;
    }

    if (this.registerPassword !== this.confirmPassword) {
      this.message = 'Las contrasenas no coinciden.';
      return;
    }

    if (!this.acceptTerms) {
      this.message = 'Debes aceptar los terminos para crear la cuenta.';
      return;
    }

    this.isLoading = true;
    this.http.post(`${this.apiUrl}/auth/register`, {
      username: this.email.trim().toLowerCase(),
      email: this.email.trim().toLowerCase(),
      password: this.registerPassword,
      fullName: `${this.firstName.trim()} ${this.lastName.trim()}`,
      phone: this.phone.trim()
    }).subscribe({
      next: () => {
        this.message = 'Registro creado correctamente. Ya puedes iniciar sesion con tu correo.';
        this.firstName = '';
        this.lastName = '';
        this.email = '';
        this.phone = '';
        this.registerPassword = '';
        this.confirmPassword = '';
        this.acceptTerms = false;
      },
      error: error => {
        this.isLoading = false;
        this.message = error.status === 0
          ? 'No se pudo conectar con el backend. Levanta Docker y vuelve a intentar.'
          : error.status === 409
            ? 'Ese correo ya esta registrado. Inicia sesion con tu correo.'
            : 'No se pudo crear el registro. Revisa los datos e intenta de nuevo.';
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
}
