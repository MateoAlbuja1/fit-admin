import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface LandingService {
  name: string;
  description: string;
  image: string;
  badge: string;
  focus: string;
  duration: string;
  bestFor: string;
  intensity: string;
  trainingGoal: string;
  sessionFlow: string[];
  tools: string[];
  includes: string[];
}

@Component({
  selector: 'app-service-card',
  standalone: true,
  templateUrl: './service-card.html',
  styleUrl: './service-card.css'
})
export class ServiceCardComponent {
  @Input({ required: true }) service!: LandingService;
  @Input() active = false;
  @Output() viewMore = new EventEmitter<LandingService>();

  open(event?: Event): void {
    event?.stopPropagation();
    this.viewMore.emit(this.service);
  }

  handleKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.open(event);
    }
  }
}
