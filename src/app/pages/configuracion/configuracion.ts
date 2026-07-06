import { Component, OnDestroy, OnInit } from '@angular/core';
import { catchError, forkJoin, of } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { AccionPaginaAdminService } from '../../core/servicios/accion-pagina-admin.service';
import { DatosGimnasioService } from '../../core/servicios/datos-gimnasio.service';

interface HorarioAtencion {
  dia: string;
  apertura: string;
  cierre: string;
  activo: boolean;
}

interface GymSettingsPayload {
  name?: string;
  sector?: string;
  city?: string;
  phone?: string;
  email?: string;
  address?: string;
  openingHours?: string;
  schedules?: HorarioAtencion[];
  currency?: string;
}

interface AdminSettingsPayload {
  name?: string;
  role?: string;
  username?: string;
  email?: string;
  security?: {
    twoFactor?: boolean;
    sessionLock?: boolean;
    automaticBackups?: boolean;
    criticalAlerts?: boolean;
  };
  backupEnabled?: boolean;
  alertasCriticas?: boolean;
}

type PanelConfiguracion = 'gimnasio' | 'administrador' | 'seguridad';

interface LoginHistoryEntry {
  date: string;
  user: string;
  device: string;
  ip: string;
  status: string;
}

@Component({
  selector: 'app-pagina-configuracion',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.css'
})
export class PaginaConfiguracionComponent implements OnInit, OnDestroy {
  notice = '';
  activePanel: PanelConfiguracion = 'gimnasio';
  isSaving = false;

  readonly panels: Array<{ id: PanelConfiguracion; label: string; description: string; icon: string }> = [
    { id: 'gimnasio', label: 'Datos del gimnasio', description: 'Sede, contacto y horarios', icon: 'M' },
    { id: 'administrador', label: 'Administrador', description: 'Cuenta y permisos', icon: 'A' },
    { id: 'seguridad', label: 'Acceso y respaldo', description: 'Seguridad y copias', icon: 'S' }
  ];

  gimnasio = {
    nombre: 'GX GYM',
    sede: '',
    ciudad: 'Quito',
    telefono: '0980674115',
    email: 'fitadmin@gmail.com',
    direccion: 'Quito, Ecuador'
  };

  cuenta = {
    administrador: 'Mateo Admin',
    rol: 'Administrador',
    usuario: 'admin',
    correo: 'fitadmin@gmail.com'
  };

  seguridad = {
    dobleFactor: false,
    bloqueoSesion: true,
    copiasAutomaticas: true,
    alertasCriticas: true
  };

  password = {
    actual: '',
    nueva: '',
    confirmar: ''
  };

  horarios: HorarioAtencion[] = this.defaultSchedules();

  loginHistory: LoginHistoryEntry[] = [
    { date: '02/07/2026, 09:22', user: 'admin', device: 'Chrome en Windows', ip: '192.168.1.24', status: 'Exitoso' },
    { date: '01/07/2026, 18:40', user: 'admin', device: 'Edge en Windows', ip: '192.168.1.24', status: 'Exitoso' },
    { date: '29/06/2026, 22:11', user: 'admin', device: 'Firefox en Linux', ip: '181.198.12.44', status: 'Bloqueado' }
  ];

  constructor(
    private actions: AccionPaginaAdminService,
    private data: DatosGimnasioService
  ) {}

  ngOnInit(): void {
    this.actions.registrar('Guardar cambios', () => this.saveSettings());
    this.loadSettings();
  }

  ngOnDestroy(): void {
    this.actions.limpiar();
  }

  setPanel(panel: PanelConfiguracion): void {
    this.activePanel = panel;
    this.notice = '';
  }

  loadSettings(): void {
    forkJoin({
      gym: this.data.obtenerConfiguracionGimnasio(),
      admin: this.data.obtenerConfiguracionAdmin(),
      logins: this.data.obtenerHistorialLogin().pipe(catchError(() => of([])))
    }).subscribe({
      next: settings => {
        this.applyGymSettings(settings.gym as GymSettingsPayload);
        this.applyAdminSettings(settings.admin as AdminSettingsPayload);
        this.loginHistory = this.mapLoginHistory(settings.logins);
      },
      error: () => {
        this.notice = 'No se pudo cargar la configuracion guardada. Se muestran valores locales.';
      }
    });
  }

  saveSettings(): void {
    if (this.password.actual || this.password.nueva || this.password.confirmar) {
      this.saveWithPasswordChange();
      return;
    }

    this.persistSettings('Configuracion guardada correctamente.');
  }

  resetFromBackend(): void {
    this.notice = '';
    this.loadSettings();
  }

  requestBackup(): void {
    this.isSaving = true;
    this.data.solicitarBackup().subscribe({
      next: response => {
        const fileName = typeof response['fileName'] === 'string' ? response['fileName'] : '';
        this.notice = fileName ? `Respaldo generado: ${fileName}` : 'Respaldo generado correctamente.';
      },
      error: () => this.notice = 'No se pudo generar el respaldo en el backend.',
      complete: () => {
        this.isSaving = false;
      }
    });
  }

  resetNotice(): void {
    this.notice = '';
  }

  private saveWithPasswordChange(): void {
    if (!this.password.actual || !this.password.nueva || !this.password.confirmar) {
      this.notice = 'Completa los tres campos de contrasena para cambiarla.';
      return;
    }

    if (this.password.nueva !== this.password.confirmar) {
      this.notice = 'La nueva contrasena no coincide con la confirmacion.';
      return;
    }

    if (this.password.nueva.length < 5) {
      this.notice = 'La nueva contrasena debe tener al menos 5 caracteres.';
      return;
    }

    this.isSaving = true;
    this.data.cambiarPassword({
      currentPassword: this.password.actual,
      newPassword: this.password.nueva
    }).subscribe({
      next: () => {
        this.password = { actual: '', nueva: '', confirmar: '' };
        this.persistSettings('Configuracion y contrasena guardadas correctamente.');
      },
      error: error => {
        this.isSaving = false;
        this.notice = error.status === 401
          ? 'La contrasena actual no es correcta.'
          : 'No se pudo cambiar la contrasena. Inicia sesion de nuevo e intenta otra vez.';
      }
    });
  }

  private persistSettings(successMessage: string): void {
    this.isSaving = true;
    forkJoin({
      gym: this.data.guardarConfiguracionGimnasio(this.buildGymPayload()),
      admin: this.data.guardarConfiguracionAdmin(this.buildAdminPayload())
    }).subscribe({
      next: settings => {
        this.applyGymSettings(settings.gym as GymSettingsPayload);
        this.applyAdminSettings(settings.admin as AdminSettingsPayload);
        this.notice = successMessage;
      },
      error: () => {
        this.notice = 'No se pudo guardar la configuracion en el backend.';
      },
      complete: () => {
        this.isSaving = false;
      }
    });
  }

  private buildGymPayload(): GymSettingsPayload {
    return {
      name: this.gimnasio.nombre.trim(),
      sector: this.gimnasio.sede.trim(),
      city: this.gimnasio.ciudad.trim(),
      phone: this.gimnasio.telefono.trim(),
      email: this.gimnasio.email.trim(),
      address: this.gimnasio.direccion.trim(),
      openingHours: this.schedulesSummary(),
      schedules: this.horarios,
      currency: 'USD'
    };
  }

  private buildAdminPayload(): AdminSettingsPayload {
    return {
      name: this.cuenta.administrador.trim(),
      role: this.cuenta.rol,
      username: this.cuenta.usuario.trim(),
      email: this.cuenta.correo.trim(),
      security: {
        twoFactor: this.seguridad.dobleFactor,
        sessionLock: this.seguridad.bloqueoSesion,
        automaticBackups: this.seguridad.copiasAutomaticas,
        criticalAlerts: this.seguridad.alertasCriticas
      },
      backupEnabled: this.seguridad.copiasAutomaticas,
      alertasCriticas: this.seguridad.alertasCriticas
    };
  }

  private applyGymSettings(settings: GymSettingsPayload = {}): void {
    this.gimnasio = {
      nombre: this.text(settings.name, this.gimnasio.nombre),
      sede: this.text(settings.sector, this.gimnasio.sede),
      ciudad: this.text(settings.city, this.gimnasio.ciudad),
      telefono: this.text(settings.phone, this.gimnasio.telefono),
      email: this.text(settings.email, this.gimnasio.email),
      direccion: this.text(settings.address, this.gimnasio.direccion)
    };

    if (Array.isArray(settings.schedules) && settings.schedules.length) {
      this.horarios = settings.schedules.map(item => ({
        dia: this.text(item.dia, ''),
        apertura: this.text(item.apertura, '06:00'),
        cierre: this.text(item.cierre, '22:00'),
        activo: Boolean(item.activo)
      })).filter(item => item.dia);
    }
  }

  private applyAdminSettings(settings: AdminSettingsPayload = {}): void {
    const security = settings.security || {};
    this.cuenta = {
      administrador: this.text(settings.name, this.cuenta.administrador),
      rol: this.text(settings.role, this.cuenta.rol),
      usuario: this.text(settings.username, this.cuenta.usuario),
      correo: this.text(settings.email, this.cuenta.correo)
    };
    this.seguridad = {
      dobleFactor: Boolean(security.twoFactor ?? this.seguridad.dobleFactor),
      bloqueoSesion: Boolean(security.sessionLock ?? this.seguridad.bloqueoSesion),
      copiasAutomaticas: Boolean(security.automaticBackups ?? settings.backupEnabled ?? this.seguridad.copiasAutomaticas),
      alertasCriticas: Boolean(security.criticalAlerts ?? settings.alertasCriticas ?? this.seguridad.alertasCriticas)
    };
  }

  private mapLoginHistory(entries: Array<Record<string, unknown>>): LoginHistoryEntry[] {
    if (!entries.length) {
      return this.loginHistory;
    }

    return entries.map(entry => ({
      date: this.formatDateTime(entry['date'] ?? entry['createdAt']),
      user: this.text(entry['user'] ?? entry['username'], 'admin'),
      device: this.text(entry['device'], 'Navegador web'),
      ip: this.text(entry['ip'], 'Local'),
      status: this.text(entry['status'], 'Exitoso')
    }));
  }

  private formatDateTime(value: unknown): string {
    const date = value ? new Date(String(value)) : new Date();
    if (Number.isNaN(date.getTime())) {
      return this.text(value, 'Ahora');
    }
    return date.toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' });
  }

  private schedulesSummary(): string {
    const active = this.horarios.filter(item => item.activo);
    if (!active.length) return 'Sin horarios activos';

    const [first] = active;
    const [last] = active.slice(-1);
    return `${first.dia} a ${last.dia} ${first.apertura} - ${first.cierre}`;
  }

  private text(value: unknown, fallback: string): string {
    return typeof value === 'string' && value.trim() ? value : fallback;
  }

  private defaultSchedules(): HorarioAtencion[] {
    return [
      { dia: 'Lunes', apertura: '06:00', cierre: '22:00', activo: true },
      { dia: 'Martes', apertura: '06:00', cierre: '22:00', activo: true },
      { dia: 'Miercoles', apertura: '06:00', cierre: '22:00', activo: true },
      { dia: 'Jueves', apertura: '06:00', cierre: '22:00', activo: true },
      { dia: 'Viernes', apertura: '06:00', cierre: '22:00', activo: true },
      { dia: 'Sabado', apertura: '08:00', cierre: '16:00', activo: true },
      { dia: 'Domingo', apertura: '08:00', cierre: '13:00', activo: false }
    ];
  }
}
