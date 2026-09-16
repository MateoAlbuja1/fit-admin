import { ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { Membresia } from '../../core/modelos/modelos-administracion';
import { DatosGimnasioService } from '../../core/servicios/datos-gimnasio.service';

type FiltroMembresiaEstado = 'Todos' | Membresia['status'];
type FiltroMembresiaPlan = 'Todos' | 'Mensual' | 'Trimestral' | 'Anual';

@Component({ selector: 'app-pagina-membresias', standalone: true, imports: [FormsModule], templateUrl: './membresias.html' })
export class PaginaMembresiasComponent implements OnDestroy {
  notice = '';
  noticeType: 'success' | 'warning' | 'error' = 'success';
  search = '';
  statusFilter: FiltroMembresiaEstado = 'Todos';
  planFilter: FiltroMembresiaPlan = 'Todos';
  editingMembershipId: number | null = null;
  isSavingEdit = false;
  renewingIds = new Set<number>();
  editMembership = { member: '', plan: 'Mensual' as FiltroMembresiaPlan, start: '', end: '', days: 30, status: 'Activa' as Membresia['status'] };
  private noticeTimer?: ReturnType<typeof setTimeout>;
  private renewingTimers = new Map<number, ReturnType<typeof setTimeout>>();
  private readonly requestTimeoutMs = 12000;

  readonly statusFilters: FiltroMembresiaEstado[] = ['Todos', 'Activa', 'Por vencer', 'Vencida'];
  readonly planFilters: FiltroMembresiaPlan[] = ['Todos', 'Mensual', 'Trimestral', 'Anual'];

  constructor(public data: DatosGimnasioService, private cdr: ChangeDetectorRef) {}

  ngOnDestroy(): void {
    this.clearNoticeTimer();
    this.renewingTimers.forEach(timer => clearTimeout(timer));
    this.renewingTimers.clear();
  }

  get filtered(): Membresia[] {
    const q = this.search.toLowerCase().trim();
    return this.data.membresias.filter(item => {
      const matchesSearch = !q || `${item.member} ${item.plan} ${item.start} ${item.end} ${item.status}`.toLowerCase().includes(q);
      const matchesStatus = this.statusFilter === 'Todos' || item.status === this.statusFilter;
      const matchesPlan = this.planFilter === 'Todos' || item.plan === this.planFilter;
      return matchesSearch && matchesStatus && matchesPlan;
    });
  }

  setStatusFilter(filter: FiltroMembresiaEstado): void {
    this.statusFilter = filter;
  }

  setPlanFilter(filter: FiltroMembresiaPlan): void {
    this.planFilter = filter;
  }

  renew(item: Membresia): void {
    if (this.renewingIds.has(item.id)) {
      return;
    }

    this.setRenewing(item.id, true);
    this.startRenewingFallback(item.id);
    this.data.renovarMembresia(item.id, 30).pipe(
      timeout(this.requestTimeoutMs),
      finalize(() => this.finishRenewing(item.id))
    ).subscribe({
      next: updated => {
        this.applyMembershipUpdate(item, updated);
        this.showNotice(`Membresia de ${item.member} renovada por 30 dias.`);
      },
      error: error => {
        this.showNotice(error.name === 'TimeoutError'
          ? 'La renovacion esta tardando demasiado. Intenta nuevamente.'
          : 'No se pudo renovar la membresia en el backend.', 'error');
      }
    });
  }

  openEdit(item: Membresia): void {
    if (this.isSavingEdit) {
      return;
    }

    this.editingMembershipId = item.id;
    this.editMembership = { member: item.member, plan: item.plan as FiltroMembresiaPlan, start: item.start, end: item.end, days: item.days, status: item.status };
  }

  cancelEdit(): void {
    if (this.isSavingEdit) {
      return;
    }

    this.editingMembershipId = null;
  }

  saveEdit(): void {
    if (this.isSavingEdit) {
      return;
    }

    const item = this.data.membresias.find(current => current.id === this.editingMembershipId);
    if (!item || !this.editMembership.member.trim()) {
      this.showNotice('Completa el nombre del cliente.', 'warning');
      return;
    }

    this.isSavingEdit = true;
    this.cdr.detectChanges();
    const payload = {
      plan: this.editMembership.plan,
      startDate: this.editMembership.start,
      endDate: this.editMembership.end,
      status: this.editMembership.status
    } as Record<string, unknown>;

    this.data.actualizarMembresia(item.id, payload).pipe(
      timeout(this.requestTimeoutMs),
      finalize(() => {
        this.isSavingEdit = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: updated => {
        Object.assign(item, updated);
        item.member = this.editMembership.member.trim();
        item.plan = this.editMembership.plan;
        item.start = this.editMembership.start;
        item.end = this.editMembership.end;
        item.days = Math.max(0, Number(this.editMembership.days) || 0);
        item.status = this.editMembership.status;
        this.editingMembershipId = null;
        this.showNotice('Membresia actualizada correctamente.');
      },
      error: error => {
        this.showNotice(error.name === 'TimeoutError'
          ? 'La actualizacion esta tardando demasiado. Intenta nuevamente.'
          : 'No se pudo actualizar la membresia en el backend.', 'error');
      }
    });
  }

  isRenewing(item: Membresia): boolean {
    return this.renewingIds.has(item.id);
  }

  clearNotice(): void {
    this.notice = '';
    this.clearNoticeTimer();
  }

  private showNotice(message: string, type: 'success' | 'warning' | 'error' = 'success'): void {
    this.notice = message;
    this.noticeType = type;
    this.clearNoticeTimer();
    this.noticeTimer = setTimeout(() => {
      this.notice = '';
      this.noticeTimer = undefined;
      this.cdr.detectChanges();
    }, 3600);
    this.cdr.detectChanges();
  }

  private clearNoticeTimer(): void {
    if (!this.noticeTimer) return;
    clearTimeout(this.noticeTimer);
    this.noticeTimer = undefined;
  }

  private setRenewing(id: number, active: boolean): void {
    const next = new Set(this.renewingIds);
    if (active) {
      next.add(id);
    } else {
      next.delete(id);
    }
    this.renewingIds = next;
    this.cdr.detectChanges();
  }

  private finishRenewing(id: number): void {
    const timer = this.renewingTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.renewingTimers.delete(id);
    }
    this.setRenewing(id, false);
  }

  private startRenewingFallback(id: number): void {
    const current = this.renewingTimers.get(id);
    if (current) {
      clearTimeout(current);
    }

    const timer = setTimeout(() => {
      if (!this.renewingIds.has(id)) {
        return;
      }
      this.renewingTimers.delete(id);
      this.setRenewing(id, false);
      this.showNotice('La renovacion tardo en responder. Recarga la lista si no ves el cambio.', 'warning');
      this.data.refrescar();
    }, 5000);
    this.renewingTimers.set(id, timer);
  }

  private applyMembershipUpdate(item: Membresia, updated: Membresia): void {
    Object.assign(item, updated);
    this.data.membresias = this.data.membresias.map(current => current.id === item.id ? { ...current, ...updated } : current);
    this.cdr.detectChanges();
  }
}
