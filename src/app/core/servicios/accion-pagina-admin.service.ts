import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AccionPaginaAdminService {
  readonly etiqueta = signal<string | null>(null);
  private manejador: (() => void) | null = null;

  registrar(etiqueta: string, manejador: () => void): void {
    this.etiqueta.set(etiqueta);
    this.manejador = manejador;
  }

  limpiar(): void {
    this.etiqueta.set(null);
    this.manejador = null;
  }

  ejecutar(): void {
    this.manejador?.();
  }
}
