import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-landing-footer',
  standalone: true,
  templateUrl: './landing-footer.html',
  styleUrl: './landing-footer.css'
})
export class LandingFooterComponent {
  @Output() navigate = new EventEmitter<string>();
}
