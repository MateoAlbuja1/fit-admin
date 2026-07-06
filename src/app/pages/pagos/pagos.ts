import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Pago } from '../../core/modelos/modelos-administracion';
import { AccionPaginaAdminService } from '../../core/servicios/accion-pagina-admin.service';
import { DatosGimnasioService } from '../../core/servicios/datos-gimnasio.service';

type FiltroPagoEstado = 'Todos' | Pago['status'];
type FiltroPagoMetodo = 'Todos' | 'Efectivo' | 'Transferencia' | 'Tarjeta';
type FiltroPagoConcepto = 'Todos' | 'Membresia' | 'Suplemento' | 'Tienda';

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
  newPayment = { member: '', concept: 'Membresia mensual', method: 'Efectivo', amount: 35 };
  editPayment = { member: '', concept: '', method: 'Efectivo' as FiltroPagoMetodo, amount: 0, status: 'Pagado' as Pago['status'] };

  readonly statusFilters: FiltroPagoEstado[] = ['Todos', 'Pagado', 'Pendiente', 'Anulado'];
  readonly methodFilters: FiltroPagoMetodo[] = ['Todos', 'Efectivo', 'Transferencia', 'Tarjeta'];
  readonly conceptFilters: FiltroPagoConcepto[] = ['Todos', 'Membresia', 'Suplemento', 'Tienda'];

  constructor(public data: DatosGimnasioService, private actions: AccionPaginaAdminService) {}

  ngOnInit(): void {
    this.actions.registrar('+ Registrar pago', () => this.showForm = true);
  }

  ngOnDestroy(): void {
    this.actions.limpiar();
  }

  get paidTotal(): number {
    return this.data.pagos.filter(item => item.status === 'Pagado').reduce((sum, item) => sum + item.amount, 0);
  }

  get paidCount(): number {
    return this.data.pagos.filter(item => item.status === 'Pagado').length;
  }

  get pendingTotal(): number {
    return this.data.pagos.filter(item => item.status === 'Pendiente').reduce((sum, item) => sum + item.amount, 0);
  }

  get filtered(): Pago[] {
    const q = this.search.toLowerCase().trim();
    return this.data.pagos.filter(item => {
      const conceptText = item.concept.toLowerCase();
      const conceptGroup = conceptText.includes('membres') ? 'Membresia' : conceptText.includes('tienda') ? 'Tienda' : 'Suplemento';
      return `${item.member} ${item.concept} ${item.method}`.toLowerCase().includes(q)
        && (this.statusFilter === 'Todos' || item.status === this.statusFilter)
        && (this.methodFilter === 'Todos' || item.method === this.methodFilter)
        && (this.conceptFilter === 'Todos' || conceptGroup === this.conceptFilter);
    });
  }

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
  }

  get paged(): Pago[] {
    return this.filtered.slice((this.page - 1) * this.pageSize, this.page * this.pageSize);
  }

  setStatusFilter(filter: FiltroPagoEstado): void {
    this.statusFilter = filter;
    this.page = 1;
  }

  setMethodFilter(filter: FiltroPagoMetodo): void {
    this.methodFilter = filter;
    this.page = 1;
  }

  setConceptFilter(filter: FiltroPagoConcepto): void {
    this.conceptFilter = filter;
    this.page = 1;
  }

  changePage(direction: number): void {
    this.page = Math.min(this.pageCount, Math.max(1, this.page + direction));
  }

  openEdit(payment: Pago): void {
    this.editingPaymentId = payment.id;
    this.editPayment = { member: payment.member, concept: payment.concept, method: payment.method as FiltroPagoMetodo, amount: payment.amount, status: payment.status };
  }

  cancelEdit(): void {
    this.editingPaymentId = null;
  }

  saveEdit(): void {
    const payment = this.data.pagos.find(item => item.id === this.editingPaymentId);
    if (!payment || !this.editPayment.member.trim() || this.editPayment.amount <= 0) {
      this.notice = 'Completa el cliente y un monto valido.';
      return;
    }

    this.data.actualizarPago(payment.id, {
      member: this.editPayment.member.trim(),
      concept: this.editPayment.concept.trim() || 'Otro',
      method: this.editPayment.method as Pago['method'],
      amount: this.editPayment.amount,
      status: this.editPayment.status
    }).subscribe({
      next: updated => {
        Object.assign(payment, updated);
        payment.member = this.editPayment.member.trim();
        this.editingPaymentId = null;
        this.notice = 'Pago actualizado correctamente.';
      },
      error: () => {
        this.notice = 'No se pudo actualizar el pago en el backend.';
      }
    });
  }

  addPayment(): void {
    if (!this.newPayment.member.trim() || this.newPayment.amount <= 0) {
      this.notice = 'Completa el cliente y un monto valido.';
      return;
    }

    this.data.crearPago({
      member: this.newPayment.member.trim(),
      concept: this.newPayment.concept,
      method: this.newPayment.method,
      amount: this.newPayment.amount,
      status: 'Pagado'
    }).subscribe({
      next: created => {
        created.member = this.newPayment.member.trim();
        this.data.pagos.unshift(created);
        this.newPayment = { member: '', concept: 'Membresia mensual', method: 'Efectivo', amount: 35 };
        this.showForm = false;
        this.notice = 'Pago registrado correctamente.';
      },
      error: () => {
        this.notice = 'No se pudo registrar el pago en el backend.';
      }
    });
  }
}
