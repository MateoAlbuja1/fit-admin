import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Membresia } from '../../core/modelos/modelos-administracion';
import { DatosGimnasioService } from '../../core/servicios/datos-gimnasio.service';

type FiltroMembresiaEstado = 'Todos' | Membresia['status'];
type FiltroMembresiaPlan = 'Todos' | 'Mensual' | 'Trimestral' | 'Anual';

@Component({ selector: 'app-pagina-membresias', standalone: true, imports: [FormsModule], templateUrl: './membresias.html' })
export class PaginaMembresiasComponent {
  notice = '';
  statusFilter: FiltroMembresiaEstado = 'Todos';
  planFilter: FiltroMembresiaPlan = 'Todos';
  editingMembershipId: number | null = null;
  editMembership = { member: '', plan: 'Mensual' as FiltroMembresiaPlan, start: '', end: '', days: 30, status: 'Activa' as Membresia['status'] };

  readonly statusFilters: FiltroMembresiaEstado[] = ['Todos', 'Activa', 'Por vencer', 'Vencida'];
  readonly planFilters: FiltroMembresiaPlan[] = ['Todos', 'Mensual', 'Trimestral', 'Anual'];

  constructor(public data: DatosGimnasioService) {}

  get filtered(): Membresia[] {
    return this.data.membresias.filter(item =>
      (this.statusFilter === 'Todos' || item.status === this.statusFilter)
      && (this.planFilter === 'Todos' || item.plan === this.planFilter)
    );
  }

  setStatusFilter(filter: FiltroMembresiaEstado): void {
    this.statusFilter = filter;
  }

  setPlanFilter(filter: FiltroMembresiaPlan): void {
    this.planFilter = filter;
  }

  renew(item: Membresia): void {
    this.data.renovarMembresia(item.id, 30).subscribe({
      next: updated => {
        Object.assign(item, updated);
        this.notice = `Membresia de ${item.member} renovada por 30 dias.`;
      },
      error: () => {
        this.notice = 'No se pudo renovar la membresia en el backend.';
      }
    });
  }

  openEdit(item: Membresia): void {
    this.editingMembershipId = item.id;
    this.editMembership = { member: item.member, plan: item.plan as FiltroMembresiaPlan, start: item.start, end: item.end, days: item.days, status: item.status };
  }

  cancelEdit(): void {
    this.editingMembershipId = null;
  }

  saveEdit(): void {
    const item = this.data.membresias.find(current => current.id === this.editingMembershipId);
    if (!item || !this.editMembership.member.trim()) {
      this.notice = 'Completa el nombre del cliente.';
      return;
    }

    this.data.actualizarMembresia(item.id, { status: this.editMembership.status }).subscribe({
      next: updated => {
        Object.assign(item, updated);
        item.member = this.editMembership.member.trim();
        item.plan = this.editMembership.plan;
        item.start = this.editMembership.start;
        item.end = this.editMembership.end;
        item.days = Math.max(0, Number(this.editMembership.days) || 0);
        item.status = this.editMembership.status;
        this.editingMembershipId = null;
        this.notice = 'Membresia actualizada correctamente.';
      },
      error: () => {
        this.notice = 'No se pudo actualizar la membresia en el backend.';
      }
    });
  }
}
