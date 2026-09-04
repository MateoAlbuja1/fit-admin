import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-landing-footer',
  standalone: true,
  templateUrl: './landing-footer.html',
  styleUrl: './landing-footer.css'
})
export class LandingFooterComponent {
  @Input() gymName = 'WX GYM';
  @Input() gymSummary = 'Entrenamiento, musculacion y bienestar.';
  @Input() phone = '0969953775';
  @Input() email = 'contacto@wxgym.local';
  @Input() openingHours = 'Lunes a Viernes: 08:00 a 21:00';
  @Input() whatsappUrl = 'https://wa.me/593969953775?text=Hola%20WX%20GYM%2C%20deseo%20informaci%C3%B3n%20sobre%20el%20gimnasio.';

  @Output() navigate = new EventEmitter<string>();
}
