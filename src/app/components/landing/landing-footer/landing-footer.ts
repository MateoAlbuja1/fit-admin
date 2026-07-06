import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-landing-footer',
  standalone: true,
  templateUrl: './landing-footer.html',
  styleUrl: './landing-footer.css'
})
export class LandingFooterComponent {
  @Input() gymName = 'GX GYM';
  @Input() gymSummary = 'Entrenamiento, musculacion y bienestar.';
  @Input() phone = '0980674115';
  @Input() email = 'fitadmin@gmail.com';
  @Input() openingHours = 'Lunes a Viernes: 08:00 a 21:00';
  @Input() whatsappUrl = 'https://wa.me/593980674115';

  @Output() navigate = new EventEmitter<string>();
}
