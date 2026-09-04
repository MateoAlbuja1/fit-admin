import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { UsuarioRegistrado } from '../../core/modelos/modelos-administracion';
import { DatosGimnasioService } from '../../core/servicios/datos-gimnasio.service';

type FiltroRol = 'Todos' | UsuarioRegistrado['role'];

@Component({
  selector: 'app-pagina-usuarios',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css'
})
export class PaginaUsuariosComponent implements OnInit {
  usuarios: UsuarioRegistrado[] = [];
  search = '';
  roleFilter: FiltroRol = 'Todos';
  loading = true;
  error = '';
  sessionExpired = false;
  readonly roleFilters: FiltroRol[] = ['Todos', 'ADMIN', 'RECEPCION', 'CLIENTE'];
  private readonly destroyRef = inject(DestroyRef);

  constructor(private data: DatosGimnasioService) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.loading = true;
    this.error = '';
    this.sessionExpired = false;

    this.data.obtenerUsuariosRegistrados()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: usuarios => this.usuarios = usuarios,
        error: (error: HttpErrorResponse) => this.procesarError(error)
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

  iniciales(nombre: string): string {
    return nombre
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(parte => parte[0])
      .join('')
      .toUpperCase() || 'US';
  }

  private procesarError(error: HttpErrorResponse): void {
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
}
