import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangeDetectorRef, Component, DestroyRef, inject, NgZone, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { UsuarioRegistrado } from '../../core/modelos/modelos-administracion';
import { AccionPaginaAdminService } from '../../core/servicios/accion-pagina-admin.service';
import { DatosGimnasioService } from '../../core/servicios/datos-gimnasio.service';

type FiltroRol = 'Todos' | UsuarioRegistrado['role'];

interface ReceptionUserForm {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-pagina-usuarios',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css'
})
export class PaginaUsuariosComponent implements OnInit, OnDestroy {
  usuarios: UsuarioRegistrado[] = [];
  search = '';
  roleFilter: FiltroRol = 'Todos';
  loading = true;
  error = '';
  sessionExpired = false;
  showCreateReceptionForm = false;
  isCreatingReception = false;
  notice = '';
  noticeType: 'success' | 'warning' | 'error' = 'success';
  newReceptionUser: ReceptionUserForm = this.emptyReceptionUserForm();
  readonly roleFilters: FiltroRol[] = ['Todos', 'ADMIN', 'RECEPCION', 'CLIENTE'];
  private readonly destroyRef = inject(DestroyRef);
  private noticeTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private data: DatosGimnasioService,
    private actions: AccionPaginaAdminService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.actions.registrar('+ Recepción', () => this.openCreateReceptionForm());
    this.cargarUsuarios();
  }

  ngOnDestroy(): void {
    this.actions.limpiar();
    this.clearNoticeTimer();
  }

  cargarUsuarios(): void {
    this.loading = true;
    this.error = '';
    this.sessionExpired = false;

    this.data.obtenerUsuariosRegistrados()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        timeout(10000),
        finalize(() => this.updateView(() => this.loading = false))
      )
      .subscribe({
        next: usuarios => this.updateView(() => this.usuarios = usuarios),
        error: error => this.updateView(() => this.procesarError(error))
      });
  }

  get usuariosFiltrados(): UsuarioRegistrado[] {
    const query = this.search.toLowerCase().trim();

    return this.usuarios.filter(usuario => {
      const coincideBusqueda = `${usuario.fullName} ${usuario.username} ${usuario.email ?? ''}`
        .toLowerCase()
        .includes(query);
      const coincideRol = this.roleFilter === 'Todos' || usuario.role === this.roleFilter;
      return coincideBusqueda && coincideRol;
    });
  }

  get usuariosActivos(): number {
    return this.usuarios.filter(usuario => usuario.active).length;
  }

  get administradores(): number {
    return this.usuarios.filter(usuario => usuario.role === 'ADMIN').length;
  }

  get recepcionistas(): number {
    return this.usuarios.filter(usuario => usuario.role === 'RECEPCION').length;
  }

  get clientesVinculados(): number {
    return this.usuarios.filter(usuario => usuario.clientId !== null).length;
  }

  etiquetaRol(role: UsuarioRegistrado['role']): string {
    const etiquetas: Record<UsuarioRegistrado['role'], string> = {
      ADMIN: 'Administrador',
      RECEPCION: 'Recepción',
      CLIENTE: 'Cliente'
    };

    return etiquetas[role];
  }

  etiquetaFiltroRol(role: FiltroRol): string {
    return role === 'Todos' ? role : this.etiquetaRol(role);
  }

  openCreateReceptionForm(): void {
    this.updateView(() => {
      this.newReceptionUser = this.emptyReceptionUserForm();
      this.showCreateReceptionForm = true;
    });
  }

  closeCreateReceptionForm(): void {
    if (this.isCreatingReception) {
      return;
    }
    this.updateView(() => {
      this.showCreateReceptionForm = false;
      this.newReceptionUser = this.emptyReceptionUserForm();
    });
  }

  createReceptionUser(): void {
    if (this.isCreatingReception) {
      return;
    }

    const form = this.newReceptionUser;
    const fullName = form.fullName.trim();
    const username = form.username.trim().toLowerCase();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();
    const password = form.password;

    if (!fullName || !username || !email || !password) {
      this.showNotice('Completa nombre, usuario, correo y contraseña.', 'warning');
      return;
    }
    if (password.length < 6) {
      this.showNotice('La contraseña debe tener al menos 6 caracteres.', 'warning');
      return;
    }
    if (password !== form.confirmPassword) {
      this.showNotice('Las contraseñas no coinciden.', 'warning');
      return;
    }

    this.updateView(() => this.isCreatingReception = true);
    this.data.crearUsuarioRecepcion({ fullName, username, email, phone, password }).pipe(
      takeUntilDestroyed(this.destroyRef),
      timeout(10000),
      finalize(() => this.updateView(() => this.isCreatingReception = false))
    ).subscribe({
      next: usuario => {
        this.updateView(() => {
          this.usuarios = [usuario, ...this.usuarios.filter(current => current.id !== usuario.id)];
          this.roleFilter = 'RECEPCION';
          this.search = '';
          this.showCreateReceptionForm = false;
          this.newReceptionUser = this.emptyReceptionUserForm();
        });
        this.showNotice('Usuario de recepción creado correctamente.', 'success');
      },
      error: error => {
        this.showNotice(this.createReceptionErrorMessage(error), 'error');
      }
    });
  }

  clearNotice(): void {
    this.clearNoticeTimer();
    this.updateView(() => this.notice = '');
  }

  iniciales(nombre: string): string {
    return nombre
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(parte => parte[0])
      .join('')
      .toUpperCase() || 'US';
  }

  private procesarError(error: HttpErrorResponse | Error): void {
    if (error.name === 'TimeoutError') {
      this.error = 'El servidor tardó demasiado en responder. Revisa Docker e intenta nuevamente.';
      return;
    }

    if (!(error instanceof HttpErrorResponse)) {
      this.error = 'No se pudo cargar la lista de usuarios. Intenta nuevamente.';
      return;
    }

    if (error.status === 401) {
      this.sessionExpired = true;
      this.error = 'Tu sesión expiró o el token ya no es válido. Inicia sesión nuevamente.';
      return;
    }

    if (error.status === 403) {
      this.error = 'No tienes permisos de administrador para consultar los usuarios.';
      return;
    }

    if (error.status === 0) {
      this.error = 'No se pudo conectar con el servidor. Revisa tu conexión e intenta otra vez.';
      return;
    }

    this.error = 'No se pudo cargar la lista de usuarios. Intenta nuevamente.';
  }

  private createReceptionErrorMessage(error: HttpErrorResponse | Error): string {
    if (error.name === 'TimeoutError') {
      return 'El servidor tardó demasiado en crear el usuario. Intenta nuevamente.';
    }
    if (error instanceof HttpErrorResponse && error.status === 409) {
      return 'Ya existe un usuario o correo registrado con esos datos.';
    }
    if (error instanceof HttpErrorResponse && error.status === 403) {
      return 'Solo el administrador puede crear usuarios de recepción.';
    }
    if (error instanceof HttpErrorResponse && error.status === 0) {
      return 'No se pudo conectar con el servidor. Revisa Docker e intenta otra vez.';
    }
    return 'No se pudo crear el usuario de recepción. Intenta nuevamente.';
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
    if (!this.noticeTimer) {
      return;
    }
    clearTimeout(this.noticeTimer);
    this.noticeTimer = undefined;
  }

  private emptyReceptionUserForm(): ReceptionUserForm {
    return {
      fullName: '',
      username: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: ''
    };
  }

  private updateView(update: () => void): void {
    this.zone.run(() => {
      update();
      this.cdr.markForCheck();
    });
  }
}
