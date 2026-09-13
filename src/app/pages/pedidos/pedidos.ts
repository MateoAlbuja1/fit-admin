import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PedidoTienda, Suplemento } from '../../core/modelos/modelos-administracion';
import { AccionPaginaAdminService } from '../../core/servicios/accion-pagina-admin.service';
import { DatosGimnasioService } from '../../core/servicios/datos-gimnasio.service';

type FiltroPedidoEstado = 'Todos' | PedidoTienda['status'];
type ItemPedidoManual = { supplementId: number | null; quantity: number };

@Component({ selector: 'app-pagina-pedidos', standalone: true, imports: [FormsModule], templateUrl: './pedidos.html' })
export class PaginaPedidosComponent implements OnInit, OnDestroy {
  pedidos: PedidoTienda[] = [];
  notice = '';
  search = '';
  statusFilter: FiltroPedidoEstado = 'Todos';
  page = 1;
  readonly pageSize = 5;
  readonly statusFilters: FiltroPedidoEstado[] = ['Todos', 'Nuevo', 'Contactado', 'Confirmado', 'Preparado', 'Pago pendiente', 'Pagado', 'Entregado', 'Cancelado'];
  readonly nextStatuses: PedidoTienda['status'][] = ['Nuevo', 'Contactado', 'Confirmado', 'Preparado', 'Pago pendiente', 'Pagado', 'Entregado', 'Cancelado'];
  readonly manualStatuses: PedidoTienda['status'][] = ['Nuevo', 'Confirmado', 'Pagado', 'Entregado'];
  readonly paymentMethods = ['Efectivo', 'Transferencia', 'Tarjeta', 'WhatsApp'];
  detail: PedidoTienda | null = null;
  isLoading = false;
  showManualForm = false;
  isSavingManualOrder = false;
  manualOrder = this.emptyManualOrder();
  manualItems: ItemPedidoManual[] = [this.emptyManualItem()];

  constructor(
    public data: DatosGimnasioService,
    private actions: AccionPaginaAdminService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.actions.registrar('Nuevo pedido', () => this.openManualOrder());
    this.loadOrders();
    if (this.route.snapshot.queryParamMap.get('accion') === 'nuevo') {
      this.openManualOrder();
    }
  }

  ngOnDestroy(): void {
    this.actions.limpiar();
  }

  get pendingCount(): number {
    return this.pedidos.filter(item => !['Pagado', 'Entregado', 'Cancelado'].includes(item.status)).length;
  }

  get deliveredTotal(): number {
    return this.pedidos
      .filter(item => item.status === 'Pagado' || item.status === 'Entregado')
      .reduce((sum, item) => sum + item.total, 0);
  }

  get filtered(): PedidoTienda[] {
    const q = this.search.toLowerCase().trim();
    return this.pedidos.filter(item =>
      `${item.code} ${item.customerName} ${item.customerPhone}`.toLowerCase().includes(q)
      && (this.statusFilter === 'Todos' || item.status === this.statusFilter)
    );
  }

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
  }

  get paged(): PedidoTienda[] {
    return this.filtered.slice((this.page - 1) * this.pageSize, this.page * this.pageSize);
  }

  get availableSupplements(): Suplemento[] {
    return this.data.suplementos
      .filter(item => item.stock > 0 && (item.status ?? 'Activo') === 'Activo')
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  get manualOrderTotal(): number {
    return this.manualItems.reduce((sum, item) => {
      const product = this.productById(item.supplementId);
      return sum + (product ? product.price * this.safeQuantity(item.quantity) : 0);
    }, 0);
  }

  loadOrders(): void {
    this.isLoading = true;
    this.data.listarPedidosTienda().subscribe({
      next: orders => {
        this.pedidos = orders;
      },
      error: () => {
        this.notice = 'No se pudieron cargar los pedidos de tienda.';
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  setStatusFilter(filter: FiltroPedidoEstado): void {
    this.statusFilter = filter;
    this.page = 1;
  }

  changePage(direction: number): void {
    this.page = Math.min(this.pageCount, Math.max(1, this.page + direction));
  }

  openDetail(order: PedidoTienda): void {
    this.data.obtenerPedidoTienda(order.id).subscribe({
      next: detail => {
        this.detail = detail;
      },
      error: () => {
        this.notice = 'No se pudo cargar el detalle del pedido.';
      }
    });
  }

  updateStatus(order: PedidoTienda, status: PedidoTienda['status']): void {
    if (order.status === status) return;

    const paymentMethod = status === 'Pagado' || status === 'Entregado'
      ? order.paymentMethod || 'WhatsApp'
      : undefined;
    this.data.actualizarEstadoPedidoTienda(order.id, status, paymentMethod).subscribe({
      next: updated => {
        Object.assign(order, updated);
        if (this.detail?.id === order.id) {
          this.detail = updated;
        }
        this.notice = `Pedido ${order.code} actualizado a ${status}.`;
      },
      error: () => {
        this.notice = 'No se pudo actualizar el estado del pedido.';
      }
    });
  }

  openManualOrder(): void {
    this.manualOrder = this.emptyManualOrder();
    this.manualItems = [this.emptyManualItem()];
    this.showManualForm = true;
    if (!this.data.suplementos.length) {
      this.data.refrescar();
    }
  }

  closeManualOrder(): void {
    if (this.isSavingManualOrder) return;
    this.showManualForm = false;
  }

  addManualItem(): void {
    this.manualItems = [...this.manualItems, this.emptyManualItem()];
  }

  removeManualItem(index: number): void {
    this.manualItems = this.manualItems.filter((_, itemIndex) => itemIndex !== index);
    if (!this.manualItems.length) {
      this.manualItems = [this.emptyManualItem()];
    }
  }

  productById(id: number | null): Suplemento | undefined {
    return id ? this.data.suplementos.find(item => item.id === Number(id)) : undefined;
  }

  stockLabel(item: ItemPedidoManual): string {
    const product = this.productById(item.supplementId);
    return product ? `${product.stock} disp. · $${product.price.toFixed(2)}` : 'Selecciona producto';
  }

  createManualOrder(): void {
    this.notice = '';
    const items = this.manualItems
      .map(item => ({ supplementId: Number(item.supplementId), quantity: this.safeQuantity(item.quantity) }))
      .filter(item => item.supplementId && item.quantity > 0);

    if (!this.manualOrder.customerName.trim() || !this.manualOrder.customerPhone.trim()) {
      this.notice = 'Completa nombre y telefono del cliente.';
      return;
    }
    if (!items.length) {
      this.notice = 'Agrega al menos un producto al pedido.';
      return;
    }

    const invalidStock = items.find(item => {
      const product = this.productById(item.supplementId);
      return !product || item.quantity > product.stock;
    });
    if (invalidStock) {
      const product = this.productById(invalidStock.supplementId);
      this.notice = product
        ? `${product.name} solo tiene ${product.stock} unidad(es) disponibles.`
        : 'Uno de los productos seleccionados ya no esta disponible.';
      return;
    }

    this.isSavingManualOrder = true;
    this.data.crearPedidoManualTienda({
      ...this.manualOrder,
      channel: 'presencial',
      items
    }).subscribe({
      next: order => {
        this.showManualForm = false;
        this.notice = `Pedido presencial ${order.code} registrado como ${order.status}.`;
        this.loadOrders();
        this.data.refrescar();
      },
      error: error => {
        this.notice = error.status === 409
          ? 'No hay stock suficiente para completar el pedido.'
          : 'No se pudo registrar el pedido presencial.';
      },
      complete: () => {
        this.isSavingManualOrder = false;
      }
    });
  }

  whatsappUrl(order: PedidoTienda): string {
    const lines = (order.items || [])
      .map(item => `- ${item.quantity} x ${item.productName} ($${item.unitPrice.toFixed(2)})`)
      .join('\n');
    const body = `Hola ${order.customerName}, te escribimos por tu pedido ${order.code} en WX GYM.\n${lines}\nTotal: $${order.total.toFixed(2)}.`;
    const digits = order.customerPhone.replace(/\D/g, '');
    const phone = digits.startsWith('593') ? digits : digits.startsWith('0') ? `593${digits.slice(1)}` : digits;
    return `https://wa.me/${phone}?text=${encodeURIComponent(body)}`;
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' });
  }

  private emptyManualOrder() {
    return {
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      notes: 'Venta presencial',
      status: 'Pagado' as PedidoTienda['status'],
      paymentMethod: 'Efectivo'
    };
  }

  private emptyManualItem(): ItemPedidoManual {
    return { supplementId: null, quantity: 1 };
  }

  private safeQuantity(value: number): number {
    const quantity = Math.floor(Number(value || 0));
    return Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
  }
}
