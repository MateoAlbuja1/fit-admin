import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

type AuthMode = 'welcome' | 'login';

interface GymSlide {
  image: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  mode: AuthMode = 'welcome';

  username = '';
  password = '';
  remember = true;
  message = '';

  private routeSub?: Subscription;

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
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.data.subscribe(data => {
      this.mode = data['mode'] === 'login' ? 'login' : 'welcome';
      this.message = '';
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  switchMode(mode: AuthMode): void {
    this.message = '';
    const target = mode === 'login' ? '/login' : '/';
    this.router.navigate([target]);
  }

  goToRegister(): void {
    this.message = '';
    this.router.navigate(['/registro']);
  }

  handleSubmit(): void {
    this.message = 'Acceso validado. Listo para conectar con el dashboard.';
  }
}
