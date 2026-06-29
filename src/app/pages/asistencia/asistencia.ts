import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatosGimnasioService } from '../../core/servicios/datos-gimnasio.service';

@Component({ selector: 'app-pagina-asistencia', standalone: true, imports: [FormsModule], templateUrl: './asistencia.html' })
export class PaginaAsistenciaComponent {
  code = '';
  notice = '';
  constructor(public data: DatosGimnasioService) {}
  register(): void { if (!this.code.trim()) { this.notice = 'Ingresa la cédula o código del cliente.'; return; } this.data.asistencias.unshift({ id: Date.now(), member: `Cliente ${this.code.trim()}`, time: new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }), access: 'Acceso principal', status: 'Ingreso correcto' }); this.code = ''; this.notice = 'Asistencia registrada correctamente.'; }
}
