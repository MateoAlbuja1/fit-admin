import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Payment } from '../../core/models/admin.models';
import { AdminPageActionService } from '../../core/services/admin-page-action.service';
import { GymDataService } from '../../core/services/gym-data.service';

@Component({ selector: 'app-payments-page', standalone: true, imports: [FormsModule], templateUrl: './payments.html' })
export class PaymentsPageComponent implements OnInit, OnDestroy {
  search = ''; notice = ''; showForm = false; page = 1; readonly pageSize = 3;
  newPayment = { member: '', concept: 'Membresía mensual', method: 'Efectivo', amount: 35 };
  constructor(public data: GymDataService, private actions: AdminPageActionService) {}
  ngOnInit(): void { this.actions.register('+ Registrar pago', () => this.showForm = true); }
  ngOnDestroy(): void { this.actions.clear(); }
  get paidTotal(): number { return this.data.payments.filter(item => item.status === 'Pagado').reduce((sum, item) => sum + item.amount, 0); }
  get filtered(): Payment[] { const q = this.search.toLowerCase().trim(); return this.data.payments.filter(item => `${item.member} ${item.concept} ${item.method}`.toLowerCase().includes(q)); }
  get pageCount(): number { return Math.max(1, Math.ceil(this.filtered.length / this.pageSize)); }
  get paged(): Payment[] { return this.filtered.slice((this.page - 1) * this.pageSize, this.page * this.pageSize); }
  changePage(direction: number): void { this.page = Math.min(this.pageCount, Math.max(1, this.page + direction)); }
  addPayment(): void { if (!this.newPayment.member.trim() || this.newPayment.amount <= 0) { this.notice = 'Completa el cliente y un monto válido.'; return; } this.data.payments.unshift({ id: Math.max(...this.data.payments.map(item => item.id)) + 1, ...this.newPayment, date: '19 Jun 2026', status: 'Pagado' }); this.newPayment = { member: '', concept: 'Membresía mensual', method: 'Efectivo', amount: 35 }; this.showForm = false; this.notice = 'Pago registrado correctamente.'; }
}
