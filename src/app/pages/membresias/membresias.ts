import { ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { Membresia } from '../../core/modelos/modelos-administracion';
import { DatosGimnasioService } from '../../core/servicios/datos-gimnasio.service';

type FiltroMembresiaEstado = 'Todos' | Membresia['status'];
type PlanMembresia = 'Mensual' | 'Trimestral' | 'Anual';
type FiltroMembresiaPlan = 'Todos' | PlanMembresia;

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
  editMembership = { member: '', plan: 'Mensual' as PlanMembresia, start: '', end: '', days: 30, status: 'Activa' as Membresia['status'] };
  private noticeTimer?: ReturnType<typeof setTimeout>;
  private renewingTimers = new Map<number, ReturnType<typeof setTimeout>>();
  private editingOriginalPlan: PlanMembresia = 'Mensual';
  private readonly requestTimeoutMs = 12000;

  readonly statusFilters: FiltroMembresiaEstado[] = ['Todos', 'Activa', 'Por vencer', 'Vencida'];
  readonly planFilters: FiltroMembresiaPlan[] = ['Todos', 'Mensual', 'Trimestral', 'Anual'];
  private readonly planDurations: Record<PlanMembresia, number> = {
    Mensual: 30,
    Trimestral: 90,
    Anual: 365
  };

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
    this.data.renovarMembresia(item.id).pipe(
      timeout(this.requestTimeoutMs),
      finalize(() => this.finishRenewing(item.id))
    ).subscribe({
      next: updated => {
        this.applyMembershipUpdate(item, updated);
        this.showNotice(`Membresia de ${updated.member} renovada por ${updated.days} dias.`);
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
    const plan = this.toPlanMembership(item.plan);
    this.editingOriginalPlan = plan;
    this.editMembership = {
      member: item.member,
      plan,
      start: this.toDateInputValue(item.startDate || item.start) || this.todayInputValue(),
      end: this.toDateInputValue(item.endDate || item.end),
      days: item.days,
      status: item.status
    };
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
    const startDate = this.toDateInputValue(this.editMembership.start) || this.todayInputValue();
    const endDate = this.toDateInputValue(this.editMembership.end) || this.addDays(startDate, this.planDurations[this.editMembership.plan]);
    const payload = {
      plan: this.editMembership.plan,
      startDate,
      endDate,
      status: this.editMembership.status,
      recalculateEndDate: this.editMembership.plan !== this.editingOriginalPlan
    } as Record<string, unknown>;

    this.data.actualizarMembresia(item.id, payload).pipe(
      timeout(this.requestTimeoutMs),
      finalize(() => {
        this.isSavingEdit = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: updated => {
        this.applyMembershipUpdate(item, updated);
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

  onEditPlanChange(value?: string): void {
    if (value) {
      this.editMembership.plan = this.toPlanMembership(value);
    }
    this.recalculateEditEndDate();
  }

  onEditStartChange(value?: string): void {
    if (value) {
      this.editMembership.start = value;
    }
    this.recalculateEditEndDate();
  }

  onEditEndChange(value?: string): void {
    if (value) {
      this.editMembership.end = value;
    }
    this.editMembership.end = this.toDateInputValue(this.editMembership.end);
    this.editMembership.days = this.daysUntil(this.editMembership.end);
    this.editMembership.status = this.statusFromDays(this.editMembership.days);
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

  private recalculateEditEndDate(): void {
    const startDate = this.toDateInputValue(this.editMembership.start) || this.todayInputValue();
    const duration = this.planDurations[this.editMembership.plan];
    const endDate = this.addDays(startDate, duration);
    this.editMembership.start = startDate;
    this.editMembership.end = endDate;
    this.editMembership.days = this.daysUntil(endDate);
    this.editMembership.status = this.statusFromDays(this.editMembership.days);
  }

  private toPlanMembership(value: string): PlanMembresia {
    return value === 'Trimestral' || value === 'Anual' ? value : 'Mensual';
  }

  private toDateInputValue(value?: string | null): string {
    if (!value) {
      return '';
    }

    const raw = String(value).slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      return raw;
    }

    const match = String(value).match(/^(\d{1,2})\s+([A-Za-zÁÉÍÓÚáéíóú]{3})\s+(\d{4})$/);
    if (match) {
      const months: Record<string, string> = {
        ene: '01',
        feb: '02',
        mar: '03',
        abr: '04',
        may: '05',
        jun: '06',
        jul: '07',
        ago: '08',
        sep: '09',
        oct: '10',
        nov: '11',
        dic: '12'
      };
      const month = months[match[2].toLowerCase()];
      if (month) {
        return `${match[3]}-${month}-${match[1].padStart(2, '0')}`;
      }
    }

    return '';
  }

  private todayInputValue(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private addDays(value: string, days: number): string {
    const date = new Date(`${value}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  }

  private daysUntil(value: string): number {
    if (!value) {
      return 0;
    }
    const today = new Date();
    const start = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    const endDate = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(endDate.getTime())) {
      return 0;
    }
    const end = Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate());
    return Math.max(0, Math.ceil((end - start) / 86400000));
  }

  private statusFromDays(days: number): Membresia['status'] {
    if (days <= 0) {
      return 'Vencida';
    }
    return days <= 7 ? 'Por vencer' : 'Activa';
  }
}
