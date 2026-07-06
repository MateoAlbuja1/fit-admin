import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PedidoTienda } from '../../core/modelos/modelos-administracion';
import { AccionPaginaAdminService } from '../../core/servicios/accion-pagina-admin.service';
import { DatosGimnasioService } from '../../core/servicios/datos-gimnasio.service';

type FiltroPedidoEstado = 'Todos' | PedidoTienda['status'];

@Component({ selector: 'app-pagina-pedidos', standalone: true, imports: [FormsModule], templateUrl: './pedidos.html' })
export class PaginaPedidosComponent implements OnInit, OnDestroy {
  pedidos: PedidoTienda[] = [];
  notice = '';
  search = '';
  statusFilter: FiltroPedidoEstado = 'Todos';
  page = 1;
  readonly pageSize = 5;
  readonly statusFilters: FiltroPedidoEstado[] = ['Todos', 'Nuevo', 'Contactado', 'Confirmado', 'Preparado', 'Entregado', 'Cancelado'];
  readonly nextStatuses: PedidoTienda['status'][] = ['Nuevo', 'Contactado', 'Confirmado', 'Preparado', 'Entregado', 'Cancelado'];
  detail: PedidoTienda | null = null;
  isLoading = false;

  constructor(
    private data: DatosGimnasioService,
    private actions: AccionPaginaAdminService
  ) {}

  ngOnInit(): void {
    this.actions.registrar('Actualizar pedidos', () => this.loadOrders());
    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.actions.limpiar();
  }

  get pendingCount(): number {
    return this.pedidos.filter(item => !['Entregado', 'Cancelado'].includes(item.status)).length;
  }

  get deliveredTotal(): number {
    return this.pedidos
      .filter(item => item.status === 'Entregado')
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

    this.data.actualizarEstadoPedidoTienda(order.id, status).subscribe({
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

  whatsappUrl(order: PedidoTienda): string {
    const lines = (order.items || [])
      .map(item => `- ${item.quantity} x ${item.productName} ($${item.unitPrice.toFixed(2)})`)
      .join('\n');
    const body = `Hola ${order.customerName}, te escribimos por tu pedido ${order.code} en GX GYM.\n${lines}\nTotal: $${order.total.toFixed(2)}.`;
    const digits = order.customerPhone.replace(/\D/g, '');
    const phone = digits.startsWith('593') ? digits : digits.startsWith('0') ? `593${digits.slice(1)}` : digits;
    return `https://wa.me/${phone}?text=${encodeURIComponent(body)}`;
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' });
  }
}
