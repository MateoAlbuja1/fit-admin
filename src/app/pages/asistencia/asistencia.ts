import { ChangeDetectorRef, Component, NgZone, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatosGimnasioService } from '../../core/servicios/datos-gimnasio.service';

@Component({ selector: 'app-pagina-asistencia', standalone: true, imports: [FormsModule], templateUrl: './asistencia.html' })
export class PaginaAsistenciaComponent implements OnDestroy {
  code = '';
  notice = '';
  noticeType: 'success' | 'warning' | 'error' = 'success';
  isRegistering = false;
  private noticeTimer?: ReturnType<typeof setTimeout>;
  private destroyed = false;

  constructor(
    public data: DatosGimnasioService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnDestroy(): void {
    this.destroyed = true;
    this.clearNoticeTimer();
  }

  register(): void {
    if (this.isRegistering) return;

    const code = this.code.trim();
    if (!code) {
      this.showNotice('Ingresa la cedula o codigo del cliente.', 'warning');
      return;
    }

    this.updateView(() => {
      this.isRegistering = true;
    });

    this.data.registrarAsistencia(code).subscribe({
      next: record => {
        this.updateView(() => {
          this.data.asistencias.unshift(record);
          this.code = '';
        });
        this.showNotice('Asistencia registrada correctamente.', 'success');
      },
      error: error => {
        this.finishRegistering();

        if (error.status === 404) {
          this.showNotice('No existe un cliente registrado con esa cedula o codigo.', 'error');
          return;
        }

        this.showNotice(error.status === 409
          ? 'El cliente existe, pero no tiene una membresia activa.'
          : 'No se pudo registrar la asistencia. Verifica que el backend este encendido.', 'error');
      },
      complete: () => {
        this.finishRegistering();
      }
    });
  }

  clearNotice(): void {
    this.clearNoticeTimer();
    this.updateView(() => {
      this.notice = '';
    });
  }

  private showNotice(message: string, type: 'success' | 'warning' | 'error'): void {
    this.clearNoticeTimer();
    this.updateView(() => {
      this.notice = message;
      this.noticeType = type;
    });
    this.noticeTimer = setTimeout(() => this.clearNotice(), 4200);
  }

  private clearNoticeTimer(): void {
    if (this.noticeTimer) {
      clearTimeout(this.noticeTimer);
      this.noticeTimer = undefined;
    }
  }

  private finishRegistering(): void {
    this.updateView(() => {
      this.isRegistering = false;
    });
  }

  private updateView(update: () => void): void {
    if (this.destroyed) return;
    this.zone.run(() => {
      update();
      this.cdr.detectChanges();
    });
  }
}
