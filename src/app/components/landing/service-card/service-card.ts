import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface LandingService {
  name: string;
  description: string;
  image: string;
  badge: string;
}

@Component({
  selector: 'app-service-card',
  standalone: true,
  templateUrl: './service-card.html',
  styleUrl: './service-card.css'
})
export class ServiceCardComponent {
  @Input({ required: true }) service!: LandingService;
  @Output() viewMore = new EventEmitter<LandingService>();
}
