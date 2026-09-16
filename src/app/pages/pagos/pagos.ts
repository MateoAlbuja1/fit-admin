import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { Pago, PedidoTienda, Suplemento } from '../../core/modelos/modelos-administracion';
import { AccionPaginaAdminService } from '../../core/servicios/accion-pagina-admin.service';
import { DatosGimnasioService } from '../../core/servicios/datos-gimnasio.service';

type FiltroPagoEstado = 'Todos' | Pago['status'];
type FiltroPagoMetodo = 'Todos' | 'Efectivo' | 'Transferencia' | 'Tarjeta';
type FiltroPagoConcepto = 'Todos' | 'Membresia' | 'Suplemento' | 'Tienda';
type ItemVentaSuplemento = { supplementId: number | null; quantity: number };

@Component({ selector: 'app-pagina-pagos', standalone: true, imports: [FormsModule], templateUrl: './pagos.html' })
export class PaginaPagosComponent implements OnInit, OnDestroy {
  search = '';
  notice = '';
  noticeType: 'success' | 'warning' | 'error' = 'success';
  showForm = false;
  page = 1;
  readonly pageSize = 3;
  statusFilter: FiltroPagoEstado = 'Todos';
  methodFilter: FiltroPagoMetodo = 'Todos';
  conceptFilter: FiltroPagoConcepto = 'Todos';
  editingPaymentId: number | null = null;
  isSavingPayment = false;
  isSavingEdit = false;
  isSavingSupplementSale = false;
  supplementProductSearch = '';
  newPayment = this.emptyPaymentForm();
  editPayment = { member: '', concept: '', method: 'Efectivo' as FiltroPagoMetodo, amount: 0, status: 'Pagado' as Pago['status'] };
  supplementSaleItems: ItemVentaSuplemento[] = [this.emptySupplementSaleItem()];
  private noticeTimer?: ReturnType<typeof setTimeout>;
  private readonly requestTimeoutMs = 12000;

  readonly statusFilters: FiltroPagoEstado[] = ['Todos', 'Pagado', 'Pendiente', 'Anulado'];
  readonly methodFilters: FiltroPagoMetodo[] = ['Todos', 'Efectivo', 'Transferencia', 'Tarjeta'];
  readonly conceptFilters: FiltroPagoConcepto[] = ['Todos', 'Membresia', 'Suplemento', 'Tienda'];
  readonly salePaymentMethods: Array<Exclude<FiltroPagoMetodo, 'Todos'>> = ['Efectivo', 'Transferencia', 'Tarjeta'];

  constructor(
    public data: DatosGimnasioService,
    private actions: AccionPaginaAdminService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.actions.registrar('+ Registrar pago', () => this.openPaymentForm());
    if (this.route.snapshot.queryParamMap.get('accion') === 'venta-suplementos') {
      this.openPaymentForm('Venta de suplemento');
    }
  }

  ngOnDestroy(): void {
    this.actions.limpiar();
    this.clearNoticeTimer();
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

  get availableSupplements(): Suplemento[] {
    return this.data.suplementos
      .filter(item => item.stock > 0 && (item.status ?? 'Activo') === 'Activo')
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  get filteredAvailableSupplements(): Suplemento[] {
    const q = this.supplementProductSearch.toLowerCase().trim();
    if (!q) return this.availableSupplements;
    return this.availableSupplements.filter(item =>
      `${item.name} ${item.category} ${item.description}`.toLowerCase().includes(q)
    );
  }

  get supplementSaleTotal(): number {
    return this.supplementSaleItems.reduce((sum, item) => {
      const product = this.productById(item.supplementId);
      return sum + (product ? this.supplementSalePrice(product) * this.boundedQuantity(item) : 0);
    }, 0);
  }

  get isSupplementSale(): boolean {
    return this.newPayment.concept === 'Venta de suplemento';
  }

  get showSupplementSearchResults(): boolean {
    return this.isSupplementSale && this.supplementProductSearch.trim().length > 0;
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

  openPaymentForm(concept = 'Membresia mensual'): void {
    this.newPayment = this.emptyPaymentForm(concept);
    this.supplementProductSearch = '';
    this.supplementSaleItems = [this.emptySupplementSaleItem()];
    this.showForm = true;
    if (concept === 'Venta de suplemento') {
      this.data.refrescar();
    }
  }

  closePaymentForm(): void {
    if (this.isSavingSupplementSale) return;
    this.showForm = false;
  }

  onPaymentConceptChange(): void {
    this.clearNotice();
    if (this.isSupplementSale) {
      this.data.refrescar();
    }
  }

  saveEdit(): void {
    if (this.isSavingEdit) return;

    const payment = this.data.pagos.find(item => item.id === this.editingPaymentId);
    if (!payment || !this.editPayment.member.trim() || this.editPayment.amount <= 0) {
      this.showNotice('Completa el cliente y un monto valido.', 'warning');
      return;
    }

    this.isSavingEdit = true;
    const request$ = this.data.actualizarPago(payment.id, {
      member: this.editPayment.member.trim(),
      concept: this.editPayment.concept.trim() || 'Otro',
      method: this.editPayment.method as Pago['method'],
      amount: this.editPayment.amount,
      status: this.editPayment.status
    }).pipe(
      timeout(this.requestTimeoutMs),
      finalize(() => this.isSavingEdit = false)
    );

    request$.subscribe({
      next: updated => {
        Object.assign(payment, updated);
        payment.member = this.editPayment.member.trim();
        this.editingPaymentId = null;
        this.showNotice('Pago actualizado correctamente.');
        this.data.refrescar();
      },
      error: error => {
        this.showNotice(error.name === 'TimeoutError'
          ? 'La actualizacion esta tardando demasiado. Intenta nuevamente.'
          : 'No se pudo actualizar el pago en el backend.', 'error');
      }
    });
  }

  addPayment(): void {
    if (this.isSupplementSale) {
      this.registerSupplementSale();
      return;
    }

    if (this.isSavingPayment) return;

    if (!this.newPayment.member.trim() || this.newPayment.amount <= 0) {
      this.showNotice('Completa el cliente y un monto valido.', 'warning');
      return;
    }

    this.isSavingPayment = true;
    const request$ = this.data.crearPago({
      member: this.newPayment.member.trim(),
      concept: this.newPayment.concept,
      method: this.newPayment.method,
      amount: this.newPayment.amount,
      status: 'Pagado'
    }).pipe(
      timeout(this.requestTimeoutMs),
      finalize(() => this.isSavingPayment = false)
    );

    request$.subscribe({
      next: created => {
        created.member = this.newPayment.member.trim();
        this.data.pagos.unshift(created);
        this.newPayment = this.emptyPaymentForm();
        this.showForm = false;
        this.showNotice('Pago registrado correctamente.');
        this.data.refrescar();
      },
      error: error => {
        this.showNotice(error.name === 'TimeoutError'
          ? 'El registro esta tardando demasiado. Intenta nuevamente.'
          : 'No se pudo registrar el pago en el backend.', 'error');
      }
    });
  }

  addSupplementSaleItem(): void {
    this.supplementSaleItems = [...this.supplementSaleItems, this.emptySupplementSaleItem()];
  }

  selectSupplementFromSearch(product: Suplemento): void {
    const emptyIndex = this.supplementSaleItems.findIndex(item => !item.supplementId);
    if (emptyIndex >= 0) {
      this.supplementSaleItems = this.supplementSaleItems.map((item, index) =>
        index === emptyIndex ? { ...item, supplementId: product.id, quantity: this.clampQuantity(item.quantity, product.stock) } : item
      );
    } else {
      this.supplementSaleItems = [
        ...this.supplementSaleItems,
        { supplementId: product.id, quantity: 1 }
      ];
    }
    this.supplementProductSearch = '';
  }

  removeSupplementSaleItem(index: number): void {
    this.supplementSaleItems = this.supplementSaleItems.filter((_, itemIndex) => itemIndex !== index);
    if (!this.supplementSaleItems.length) {
      this.supplementSaleItems = [this.emptySupplementSaleItem()];
    }
  }

  productById(id: number | null): Suplemento | undefined {
    return id ? this.data.suplementos.find(item => item.id === Number(id)) : undefined;
  }

  stockLabel(item: ItemVentaSuplemento): string {
    const product = this.productById(item.supplementId);
    return product ? `${product.stock} disp. · $${this.supplementSalePrice(product).toFixed(2)}` : 'Selecciona producto';
  }

  supplementSalePrice(product: Suplemento): number {
    return this.data.precioConIvaTemporal(product.price);
  }

  maxQuantityForItem(item: ItemVentaSuplemento): number {
    return Math.max(1, this.productById(item.supplementId)?.stock ?? 1);
  }

  normalizeSupplementSaleItem(index: number): void {
    const current = this.supplementSaleItems[index];
    if (!current) return;
    this.supplementSaleItems = this.supplementSaleItems.map((item, itemIndex) =>
      itemIndex === index ? { ...item, quantity: this.boundedQuantity(item) || 1 } : item
    );
  }

  supplementsForItem(item: ItemVentaSuplemento): Suplemento[] {
    const selected = this.productById(item.supplementId);
    const filtered = this.filteredAvailableSupplements;
    if (!selected || filtered.some(product => product.id === selected.id)) {
      return filtered;
    }
    return [selected, ...filtered];
  }

  registerSupplementSale(): void {
    if (this.isSavingSupplementSale) return;

    this.clearNotice();
    const items = this.supplementSaleItems
      .map(item => ({ supplementId: Number(item.supplementId), quantity: this.boundedQuantity(item) }))
      .filter(item => item.supplementId && item.quantity > 0);

    if (!this.newPayment.member.trim() || !this.newPayment.customerPhone.trim()) {
      this.showNotice('Completa nombre y telefono del cliente.', 'warning');
      return;
    }
    if (!items.length) {
      this.showNotice('Selecciona al menos un suplemento.', 'warning');
      return;
    }

    const invalidStock = items.find(item => {
      const product = this.productById(item.supplementId);
      return !product || item.quantity > product.stock;
    });
    if (invalidStock) {
      const product = this.productById(invalidStock.supplementId);
      this.showNotice(product
        ? `${product.name} solo tiene ${product.stock} unidad(es) disponibles.`
        : 'Uno de los productos seleccionados ya no esta disponible.', 'warning');
      return;
    }

    this.isSavingSupplementSale = true;
    const request$ = this.data.crearPedidoManualTienda({
      customerName: this.newPayment.member.trim(),
      customerPhone: this.newPayment.customerPhone.trim(),
      customerEmail: this.newPayment.customerEmail.trim(),
      notes: this.newPayment.notes.trim() || 'Venta presencial de suplementos',
      paymentMethod: this.newPayment.method,
      channel: 'presencial',
      status: 'Pagado' as PedidoTienda['status'],
      items
    }).pipe(
      timeout(this.requestTimeoutMs),
      finalize(() => this.isSavingSupplementSale = false)
    );

    request$.subscribe({
      next: order => {
        this.showForm = false;
        this.newPayment = this.emptyPaymentForm();
        this.supplementSaleItems = [this.emptySupplementSaleItem()];
        this.supplementProductSearch = '';
        this.showNotice(`Venta de suplementos ${order.code} registrada y stock descontado.`);
        this.data.refrescar();
      },
      error: error => {
        this.showNotice(error.name === 'TimeoutError'
          ? 'La venta esta tardando demasiado. Intenta nuevamente.'
          : error.status === 409
          ? 'No hay stock suficiente para completar la venta.'
          : 'No se pudo registrar la venta de suplementos.', error.status === 409 ? 'warning' : 'error');
      }
    });
  }

  clearNotice(): void {
    this.notice = '';
    this.clearNoticeTimer();
  }

  private emptyPaymentForm(concept = 'Membresia mensual') {
    return {
      member: '',
      concept,
      method: 'Efectivo',
      amount: concept === 'Venta de suplemento' ? 0 : 35,
      customerPhone: '',
      customerEmail: '',
      notes: concept === 'Venta de suplemento' ? 'Venta presencial de suplementos' : ''
    };
  }

  private emptySupplementSaleItem(): ItemVentaSuplemento {
    return { supplementId: null, quantity: 1 };
  }

  private safeQuantity(value: number): number {
    const quantity = Math.floor(Number(value || 0));
    return Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
  }

  private boundedQuantity(item: ItemVentaSuplemento): number {
    return this.clampQuantity(item.quantity, this.maxQuantityForItem(item));
  }

  private clampQuantity(value: number, max: number): number {
    const quantity = this.safeQuantity(value) || 1;
    return Math.min(quantity, Math.max(1, max));
  }

  private showNotice(message: string, type: 'success' | 'warning' | 'error' = 'success'): void {
    this.notice = message;
    this.noticeType = type;
    this.clearNoticeTimer();
    this.noticeTimer = setTimeout(() => {
      this.notice = '';
      this.noticeTimer = undefined;
    }, 3600);
  }

  private clearNoticeTimer(): void {
    if (!this.noticeTimer) return;
    clearTimeout(this.noticeTimer);
    this.noticeTimer = undefined;
  }
}
