import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface MembershipPlan {
  name: string;
  price: string;
  duration: string;
  description: string;
  benefits: string[];
  bestFor: string;
  featured?: boolean;
  formValue: string;
}

@Component({
  selector: 'app-membership-card',
  standalone: true,
  templateUrl: './membership-card.html',
  styleUrl: './membership-card.css'
})
export class MembershipCardComponent {
  @Input({ required: true }) plan!: MembershipPlan;
  @Output() choose = new EventEmitter<MembershipPlan>();
  @Output() whatsapp = new EventEmitter<MembershipPlan>();
}
