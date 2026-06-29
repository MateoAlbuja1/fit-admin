import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface TrainerProfile {
  name: string;
  specialty: string;
  experience: string;
  image: string;
}

@Component({
  selector: 'app-trainer-card',
  standalone: true,
  templateUrl: './trainer-card.html',
  styleUrl: './trainer-card.css'
})
export class TrainerCardComponent {
  @Input({ required: true }) trainer!: TrainerProfile;
  @Output() viewProfile = new EventEmitter<TrainerProfile>();
}
