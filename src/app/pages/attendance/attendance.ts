import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GymDataService } from '../../core/services/gym-data.service';

@Component({ selector: 'app-attendance-page', standalone: true, imports: [FormsModule], templateUrl: './attendance.html' })
export class AttendancePageComponent {
  code = '';
  notice = '';
  constructor(public data: GymDataService) {}
  register(): void { if (!this.code.trim()) { this.notice = 'Ingresa la cédula o código del cliente.'; return; } this.data.attendance.unshift({ id: Date.now(), member: `Cliente ${this.code.trim()}`, time: new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }), access: 'Acceso principal', status: 'Ingreso correcto' }); this.code = ''; this.notice = 'Asistencia registrada correctamente.'; }
}
