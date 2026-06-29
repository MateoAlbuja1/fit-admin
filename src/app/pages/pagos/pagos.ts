import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Pago } from '../../core/modelos/modelos-administracion';
import { AccionPaginaAdminService } from '../../core/servicios/accion-pagina-admin.service';
import { DatosGimnasioService } from '../../core/servicios/datos-gimnasio.service';

type FiltroPagoEstado = 'Todos' | Pago['status'];
type FiltroPagoMetodo = 'Todos' | 'Efectivo' | 'Transferencia' | 'Tarjeta';
type FiltroPagoConcepto = 'Todos' | 'Membresía' | 'Suplemento';

@Component({ selector: 'app-pagina-pagos', standalone: true, imports: [FormsModule], templateUrl: './pagos.html' })
export class PaginaPagosComponent implements OnInit, OnDestroy {
  search = '';
  notice = '';
  showForm = false;
  page = 1;
  readonly pageSize = 3;
  statusFilter: FiltroPagoEstado = 'Todos';
  methodFilter: FiltroPagoMetodo = 'Todos';
  conceptFilter: FiltroPagoConcepto = 'Todos';
  editingPaymentId: number | null = null;
  newPayment = { member: '', concept: 'Membresía mensual', method: 'Efectivo', amount: 35 };
  editPayment = { member: '', concept: '', method: 'Efectivo' as FiltroPagoMetodo, amount: 0, status: 'Pagado' as Pago['status'] };

  readonly statusFilters: FiltroPagoEstado[] = ['Todos', 'Pagado', 'Pendiente'];
  readonly methodFilters: FiltroPagoMetodo[] = ['Todos', 'Efectivo', 'Transferencia', 'Tarjeta'];
  readonly conceptFilters: FiltroPagoConcepto[] = ['Todos', 'Membresía', 'Suplemento'];

  constructor(public data: DatosGimnasioService, private actions: AccionPaginaAdminService) {}
  ngOnInit(): void { this.actions.registrar('+ Registrar pago', () => this.showForm = true); }
  ngOnDestroy(): void { this.actions.limpiar(); }

  get paidTotal(): number { return this.data.pagos.filter(item => item.status === 'Pagado').reduce((sum, item) => sum + item.amount, 0); }
  get pendingTotal(): number { return this.data.pagos.filter(item => item.status === 'Pendiente').reduce((sum, item) => sum + item.amount, 0); }
  get filtered(): Pago[] {
    const q = this.search.toLowerCase().trim();
    return this.data.pagos.filter(item => {
      const conceptGroup = item.concept.toLowerCase().includes('membres') ? 'Membresía' : 'Suplemento';
      return `${item.member} ${item.concept} ${item.method}`.toLowerCase().includes(q)
        && (this.statusFilter === 'Todos' || item.status === this.statusFilter)
        && (this.methodFilter === 'Todos' || item.method === this.methodFilter)
        && (this.conceptFilter === 'Todos' || conceptGroup === this.conceptFilter);
    });
  }
  get pageCount(): number { return Math.max(1, Math.ceil(this.filtered.length / this.pageSize)); }
  get paged(): Pago[] { return this.filtered.slice((this.page - 1) * this.pageSize, this.page * this.pageSize); }

  setStatusFilter(filter: FiltroPagoEstado): void { this.statusFilter = filter; this.page = 1; }
  setMethodFilter(filter: FiltroPagoMetodo): void { this.methodFilter = filter; this.page = 1; }
  setConceptFilter(filter: FiltroPagoConcepto): void { this.conceptFilter = filter; this.page = 1; }
  changePage(direction: number): void { this.page = Math.min(this.pageCount, Math.max(1, this.page + direction)); }

  openEdit(payment: Pago): void {
    this.editingPaymentId = payment.id;
    this.editPayment = { member: payment.member, concept: payment.concept, method: payment.method as FiltroPagoMetodo, amount: payment.amount, status: payment.status };
  }

  cancelEdit(): void { this.editingPaymentId = null; }

  saveEdit(): void {
    const payment = this.data.pagos.find(item => item.id === this.editingPaymentId);
    if (!payment || !this.editPayment.member.trim() || this.editPayment.amount <= 0) {
      this.notice = 'Completa el cliente y un monto válido.';
      return;
    }
    payment.member = this.editPayment.member.trim();
    payment.concept = this.editPayment.concept.trim() || 'Otro';
    payment.method = this.editPayment.method as Pago['method'];
    payment.amount = this.editPayment.amount;
    payment.status = this.editPayment.status;
    this.editingPaymentId = null;
    this.notice = 'Pago actualizado correctamente.';
  }

  addPayment(): void {
    if (!this.newPayment.member.trim() || this.newPayment.amount <= 0) { this.notice = 'Completa el cliente y un monto válido.'; return; }
    this.data.pagos.unshift({ id: Math.max(...this.data.pagos.map(item => item.id)) + 1, ...this.newPayment, date: '19 Jun 2026', status: 'Pagado' });
    this.newPayment = { member: '', concept: 'Membresía mensual', method: 'Efectivo', amount: 35 };
    this.showForm = false; this.notice = 'Pago registrado correctamente.';
  }
}
