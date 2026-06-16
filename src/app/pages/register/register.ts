import { Component } from '@angular/core';
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

  constructor(private router: Router) {}

  goToLogin(): void {
    this.message = '';
    this.router.navigate(['/login']);
  }

  handleRegister(): void {
    if (this.registerPassword !== this.confirmPassword) {
      this.message = 'Las contraseñas no coinciden.';
      return;
    }

    if (!this.acceptTerms) {
      this.message = 'Debes aceptar los términos para crear la cuenta.';
      return;
    }

    this.message = 'Registro creado correctamente. Ya puedes iniciar sesión.';
  }
}
