import { Component } from '@angular/core';
import { Membership } from '../../core/models/admin.models';
import { GymDataService } from '../../core/services/gym-data.service';

@Component({ selector: 'app-memberships-page', standalone: true, templateUrl: './memberships.html' })
export class MembershipsPageComponent {
  notice = '';
  constructor(public data: GymDataService) {}
  renew(item: Membership): void { item.status = 'Activa'; item.days = 30; item.end = '19 Jul 2026'; this.notice = `Membresía de ${item.member} renovada por 30 días.`; }
}
