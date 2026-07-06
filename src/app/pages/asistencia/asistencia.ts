import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatosGimnasioService } from '../../core/servicios/datos-gimnasio.service';

@Component({ selector: 'app-pagina-asistencia', standalone: true, imports: [FormsModule], templateUrl: './asistencia.html' })
export class PaginaAsistenciaComponent {
  code = '';
  notice = '';

  constructor(public data: DatosGimnasioService) {}

  register(): void {
    const code = this.code.trim();
    if (!code) {
      this.notice = 'Ingresa la cedula o codigo del cliente.';
      return;
    }

    this.data.registrarAsistencia(code).subscribe({
      next: record => {
        this.data.asistencias.unshift(record);
        this.code = '';
        this.notice = 'Asistencia registrada correctamente.';
      },
      error: error => {
        this.notice = error.status === 409
          ? 'El cliente no tiene membresia activa.'
          : 'No se pudo registrar la asistencia en el backend.';
      }
    });
  }
}
