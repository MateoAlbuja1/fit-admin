import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatosGimnasioService } from '../../core/servicios/datos-gimnasio.service';

@Component({ selector: 'app-pagina-asistencia', standalone: true, imports: [FormsModule], templateUrl: './asistencia.html' })
export class PaginaAsistenciaComponent {
  code = '';
  notice = '';
  noticeType: 'success' | 'warning' | 'error' = 'success';

  constructor(public data: DatosGimnasioService) {}

  register(): void {
    const code = this.code.trim();
    if (!code) {
      this.showNotice('Ingresa la cedula o codigo del cliente.', 'warning');
      return;
    }

    this.data.registrarAsistencia(code).subscribe({
      next: record => {
        this.data.asistencias.unshift(record);
        this.code = '';
        this.showNotice('Asistencia registrada correctamente.', 'success');
      },
      error: error => {
        if (error.status === 404) {
          this.showNotice('No existe un cliente registrado con esa cedula o codigo.', 'error');
          return;
        }

        this.showNotice(error.status === 409
          ? 'El cliente existe, pero no tiene una membresia activa.'
          : 'No se pudo registrar la asistencia. Verifica que el backend este encendido.', 'error');
      }
    });
  }

  clearNotice(): void {
    this.notice = '';
  }

  private showNotice(message: string, type: 'success' | 'warning' | 'error'): void {
    this.notice = message;
    this.noticeType = type;
  }
}
