import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { catchError, finalize, forkJoin, of, timeout } from 'rxjs';
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
  temporaryVat?: TemporaryVatSettings;
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

type PanelConfiguracion = 'gimnasio' | 'tributacion' | 'administrador' | 'seguridad';

interface TemporaryVatSettings {
  enabled: boolean;
  rate: number;
  startsAt: string;
  endsAt: string;
  reason: string;
}

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
  private noticeTimer?: ReturnType<typeof setTimeout>;
  private savingFallbackTimer?: ReturnType<typeof setTimeout>;
  private scheduleSaveTimer?: ReturnType<typeof setTimeout>;

  readonly panels: Array<{ id: PanelConfiguracion; label: string; description: string; icon: string }> = [
    { id: 'gimnasio', label: 'Datos del gimnasio', description: 'Sede, contacto y horarios', icon: 'M' },
    { id: 'tributacion', label: 'IVA temporal', description: 'Feriados y rangos especiales', icon: '%' },
    { id: 'administrador', label: 'Administrador', description: 'Cuenta y permisos', icon: 'A' },
    { id: 'seguridad', label: 'Acceso y respaldo', description: 'Seguridad y copias', icon: 'S' }
  ];

  readonly timeOptions = [
    '05:00', '05:30',
    '06:00', '06:30',
    '07:00', '07:30',
    '08:00', '08:30',
    '09:00', '09:30',
    '10:00', '10:30',
    '11:00', '11:30',
    '12:00', '12:30',
    '13:00', '13:30',
    '14:00', '14:30',
    '15:00', '15:30',
    '16:00', '16:30',
    '17:00', '17:30',
    '18:00', '18:30',
    '19:00', '19:30',
    '20:00', '20:30',
    '21:00', '21:30',
    '22:00', '22:30',
    '23:00'
  ];

  gimnasio = {
    nombre: 'WX GYM',
    sede: '',
    ciudad: 'Quito',
    telefono: '0969953775',
    email: 'contacto@wxgym.local',
    direccion: 'Quito, Ecuador'
  };

  cuenta = {
    administrador: 'Mateo Admin',
    rol: 'Administrador',
    usuario: 'admin',
    correo: 'admin@wxgym.local'
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

  ivaTemporal: TemporaryVatSettings = {
    enabled: false,
    rate: 15,
    startsAt: '',
    endsAt: '',
    reason: 'Feriado nacional'
  };

  loginHistory: LoginHistoryEntry[] = [
    { date: '02/07/2026, 09:22', user: 'admin', device: 'Chrome en Windows', ip: '192.168.1.24', status: 'Exitoso' },
    { date: '01/07/2026, 18:40', user: 'admin', device: 'Edge en Windows', ip: '192.168.1.24', status: 'Exitoso' },
    { date: '29/06/2026, 22:11', user: 'admin', device: 'Firefox en Linux', ip: '181.198.12.44', status: 'Bloqueado' }
  ];

  constructor(
    private actions: AccionPaginaAdminService,
    private data: DatosGimnasioService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.actions.registrar('Guardar cambios', () => this.saveSettings());
    this.loadSettings();
  }

  ngOnDestroy(): void {
    this.actions.limpiar();
    this.clearNoticeTimer();
    this.clearSavingFallbackTimer();
    this.clearScheduleSaveTimer();
  }

  setPanel(panel: PanelConfiguracion): void {
    this.activePanel = panel;
    this.notice = '';
    this.clearNoticeTimer();
  }

  loadSettings(): void {
    forkJoin({
      gym: this.data.obtenerConfiguracionGimnasio().pipe(
        catchError(() => this.data.obtenerConfiguracionPublicaGimnasio().pipe(catchError(() => of(null))))
      ),
      admin: this.data.obtenerConfiguracionAdmin().pipe(catchError(() => of(null))),
      logins: this.data.obtenerHistorialLogin().pipe(catchError(() => of([])))
    }).subscribe({
      next: settings => {
        if (settings.gym) {
          this.applyGymSettings(settings.gym as GymSettingsPayload);
        }
        if (settings.admin) {
          this.applyAdminSettings(settings.admin as AdminSettingsPayload);
        }
        this.loginHistory = this.mapLoginHistory(settings.logins);
        this.cdr.detectChanges();
      },
      error: () => {
        this.showNotice('No se pudo cargar la configuracion guardada. Se muestran valores locales.');
      }
    });
  }

  saveSettings(): void {
    if (!this.validateTemporaryVat()) {
      return;
    }

    this.clearScheduleSaveTimer();

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
    this.startSaving();
    this.data.solicitarBackup().pipe(
      timeout(12000),
      finalize(() => {
        this.finishSaving();
      })
    ).subscribe({
      next: response => {
        const fileName = typeof response['fileName'] === 'string' ? response['fileName'] : '';
        const downloaded = this.downloadBackup(response, fileName);
        this.showNotice(downloaded
          ? `Backup descargado: ${fileName || 'fitadmin-backup.json'}`
          : 'Backup generado en el backend, pero no se pudo descargar el archivo.');
      },
      error: () => this.showNotice('No se pudo generar el backup en el backend.')
    });
  }

  resetNotice(): void {
    this.notice = '';
    this.clearNoticeTimer();
  }

  updateScheduleActive(horario: HorarioAtencion, active: boolean): void {
    horario.activo = active;
    this.scheduleGymAutoSave();
  }

  updateScheduleTime(horario: HorarioAtencion, field: 'apertura' | 'cierre', value: string): void {
    horario[field] = value;
    this.scheduleGymAutoSave();
  }

  get ivaTemporalResumen(): string {
    if (!this.ivaTemporal.enabled) {
      return 'Inactivo: la tienda usa los precios base del inventario.';
    }

    if (!this.ivaTemporal.startsAt || !this.ivaTemporal.endsAt) {
      return 'Activo, pero falta definir el rango completo de fechas.';
    }

    return `Activo: aplica ${this.ivaTemporal.rate}% desde ${this.ivaTemporal.startsAt} hasta ${this.ivaTemporal.endsAt}.`;
  }

  private saveWithPasswordChange(): void {
    if (!this.validateTemporaryVat()) {
      return;
    }

    if (!this.password.actual || !this.password.nueva || !this.password.confirmar) {
      this.showNotice('Completa los tres campos de contrasena para cambiarla.');
      return;
    }

    if (this.password.nueva !== this.password.confirmar) {
      this.showNotice('La nueva contrasena no coincide con la confirmacion.');
      return;
    }

    if (this.password.nueva.length < 5) {
      this.showNotice('La nueva contrasena debe tener al menos 5 caracteres.');
      return;
    }

    this.startSaving();
    this.data.cambiarPassword({
      currentPassword: this.password.actual,
      newPassword: this.password.nueva
    }).pipe(
      timeout(12000)
    ).subscribe({
      next: () => {
        this.password = { actual: '', nueva: '', confirmar: '' };
        this.persistSettings('Configuracion y contrasena guardadas correctamente.');
      },
      error: error => {
        this.finishSaving();
        this.showNotice(error.status === 401
          ? 'La contrasena actual no es correcta.'
          : 'No se pudo cambiar la contrasena. Inicia sesion de nuevo e intenta otra vez.');
      }
    });
  }

  private persistSettings(successMessage: string): void {
    const shouldSaveGym = this.activePanel === 'gimnasio' || this.activePanel === 'tributacion';
    const shouldSaveAdmin = this.activePanel === 'administrador' || this.activePanel === 'seguridad';

    this.startSaving();
    forkJoin({
      gym: shouldSaveGym ? this.data.guardarConfiguracionGimnasio(this.buildGymPayload()) : of(null),
      admin: shouldSaveAdmin ? this.data.guardarConfiguracionAdmin(this.buildAdminPayload()) : of(null)
    }).pipe(
      timeout(12000),
      finalize(() => {
        this.finishSaving();
      })
    ).subscribe({
      next: settings => {
        if (settings.gym) {
          this.applyGymSettings(settings.gym as GymSettingsPayload);
        }
        if (settings.admin) {
          this.applyAdminSettings(settings.admin as AdminSettingsPayload);
        }
        this.showNotice(successMessage);
      },
      error: () => {
        this.showNotice('No se pudo guardar la configuracion. Revisa si la sesion sigue activa.');
      }
    });
  }

  private persistGymSettings(successMessage: string, showButtonSaving = false): void {
    if (showButtonSaving) {
      this.startSaving();
    }

    this.data.guardarConfiguracionGimnasio(this.buildGymPayload()).pipe(
      timeout(12000),
      finalize(() => {
        if (showButtonSaving) {
          this.finishSaving();
        }
      })
    ).subscribe({
      next: settings => {
        this.applyGymSettings(settings as GymSettingsPayload);
        this.showNotice(successMessage);
      },
      error: () => {
        this.showNotice('No se pudo guardar el horario. Revisa si la sesion sigue activa.');
      }
    });
  }

  private buildGymPayload(): GymSettingsPayload {
    return {
      name: 'WX GYM',
      sector: this.gimnasio.sede.trim(),
      city: this.gimnasio.ciudad.trim(),
      phone: '0969953775',
      email: 'contacto@wxgym.local',
      address: this.gimnasio.direccion.trim(),
      openingHours: this.schedulesSummary(),
      schedules: this.horarios,
      currency: 'USD',
      temporaryVat: {
        enabled: Boolean(this.ivaTemporal.enabled),
        rate: this.clampVatRate(this.ivaTemporal.rate),
        startsAt: this.ivaTemporal.startsAt,
        endsAt: this.ivaTemporal.endsAt,
        reason: this.ivaTemporal.reason.trim() || 'Feriado nacional'
      }
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
      nombre: 'WX GYM',
      sede: this.text(settings.sector, this.gimnasio.sede),
      ciudad: this.text(settings.city, this.gimnasio.ciudad),
      telefono: '0969953775',
      email: 'contacto@wxgym.local',
      direccion: this.text(settings.address, this.gimnasio.direccion)
    };

    this.horarios = this.normalizeSchedules(settings.schedules);

    this.ivaTemporal = this.normalizeTemporaryVat(settings.temporaryVat);
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

  private normalizeTemporaryVat(value: unknown): TemporaryVatSettings {
    const settings = typeof value === 'object' && value !== null ? value as Partial<TemporaryVatSettings> : {};
    return {
      enabled: Boolean(settings.enabled),
      rate: this.clampVatRate(Number(settings.rate ?? 15)),
      startsAt: this.text(settings.startsAt, ''),
      endsAt: this.text(settings.endsAt, ''),
      reason: this.text(settings.reason, 'Feriado nacional')
    };
  }

  private validateTemporaryVat(): boolean {
    if (!this.ivaTemporal.enabled) {
      return true;
    }

    if (this.clampVatRate(this.ivaTemporal.rate) <= 0) {
      this.showNotice('El porcentaje de IVA temporal debe ser mayor a 0.');
      return false;
    }

    if (!this.ivaTemporal.startsAt || !this.ivaTemporal.endsAt) {
      this.showNotice('Define fecha de inicio y fecha de fin para el IVA temporal.');
      return false;
    }

    if (this.ivaTemporal.startsAt > this.ivaTemporal.endsAt) {
      this.showNotice('La fecha de inicio del IVA temporal no puede ser mayor a la fecha de fin.');
      return false;
    }

    return true;
  }

  private showNotice(message: string): void {
    this.notice = message;
    this.clearNoticeTimer();
    this.noticeTimer = setTimeout(() => {
      this.notice = '';
      this.noticeTimer = undefined;
      this.cdr.detectChanges();
    }, 3600);
    this.cdr.detectChanges();
  }

  private clearNoticeTimer(): void {
    if (!this.noticeTimer) {
      return;
    }
    clearTimeout(this.noticeTimer);
    this.noticeTimer = undefined;
  }

  private startSaving(): void {
    this.isSaving = true;
    this.clearSavingFallbackTimer();
    this.savingFallbackTimer = setTimeout(() => {
      if (!this.isSaving) {
        return;
      }
      this.isSaving = false;
      this.showNotice('La respuesta esta tardando demasiado. Revisa conexion o inicia sesion nuevamente.');
      this.cdr.detectChanges();
    }, 14000);
    this.cdr.detectChanges();
  }

  private finishSaving(): void {
    this.isSaving = false;
    this.clearSavingFallbackTimer();
    this.cdr.detectChanges();
  }

  private clearSavingFallbackTimer(): void {
    if (!this.savingFallbackTimer) {
      return;
    }
    clearTimeout(this.savingFallbackTimer);
    this.savingFallbackTimer = undefined;
  }

  private scheduleGymAutoSave(): void {
    this.clearScheduleSaveTimer();
    this.scheduleSaveTimer = setTimeout(() => {
      this.scheduleSaveTimer = undefined;
      this.persistGymSettings('Horario actualizado correctamente.');
    }, 650);
  }

  private clearScheduleSaveTimer(): void {
    if (!this.scheduleSaveTimer) {
      return;
    }
    clearTimeout(this.scheduleSaveTimer);
    this.scheduleSaveTimer = undefined;
  }

  private downloadBackup(response: Record<string, unknown>, fileName: string): boolean {
    const snapshot = response['snapshot'];
    if (!snapshot || typeof document === 'undefined') {
      return false;
    }

    const safeFileName = fileName || `fitadmin-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = safeFileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return true;
  }

  private normalizeSchedules(value: unknown): HorarioAtencion[] {
    const defaults = this.defaultSchedules();
    if (!Array.isArray(value) || !value.length) {
      return defaults;
    }

    const savedByDay = new Map<string, Partial<HorarioAtencion>>();
    value.forEach(item => {
      if (!item || typeof item !== 'object') {
        return;
      }
      const schedule = item as Partial<HorarioAtencion>;
      const key = this.scheduleDayKey(schedule.dia);
      if (!key) {
        return;
      }
      savedByDay.set(key, schedule);
    });

    return defaults.map(defaultSchedule => {
      const saved = savedByDay.get(this.scheduleDayKey(defaultSchedule.dia));
      if (!saved) {
        return { ...defaultSchedule };
      }
      return {
        dia: defaultSchedule.dia,
        apertura: this.validTime(saved.apertura, defaultSchedule.apertura),
        cierre: this.validTime(saved.cierre, defaultSchedule.cierre),
        activo: typeof saved.activo === 'boolean' ? saved.activo : defaultSchedule.activo
      };
    });
  }

  private scheduleDayKey(value: unknown): string {
    return this.text(value, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  private validTime(value: unknown, fallback: string): string {
    const time = this.text(value, fallback);
    return this.timeOptions.includes(time) ? time : fallback;
  }

  private clampVatRate(value: number): number {
    if (!Number.isFinite(value)) {
      return 15;
    }
    return Math.min(100, Math.max(0, Number(value.toFixed(2))));
  }

  private defaultSchedules(): HorarioAtencion[] {
    return [
      { dia: 'Lunes', apertura: '06:00', cierre: '22:00', activo: true },
      { dia: 'Martes', apertura: '06:00', cierre: '22:00', activo: true },
      { dia: 'Miércoles', apertura: '06:00', cierre: '22:00', activo: true },
      { dia: 'Jueves', apertura: '06:00', cierre: '22:00', activo: true },
      { dia: 'Viernes', apertura: '06:00', cierre: '22:00', activo: true },
      { dia: 'Sábado', apertura: '08:00', cierre: '16:00', activo: true },
      { dia: 'Domingo', apertura: '08:00', cierre: '13:00', activo: false }
    ];
  }
}
