import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { PedidoTienda } from '../../core/modelos/modelos-administracion';
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
  readonly statusFilters: FiltroPedidoEstado[] = ['Todos', 'Nuevo', 'Contactado', 'Confirmado', 'Preparado', 'Pago pendiente', 'Pagado', 'Entregado', 'Cancelado'];
  readonly nextStatuses: PedidoTienda['status'][] = ['Nuevo', 'Contactado', 'Confirmado', 'Preparado', 'Pago pendiente', 'Pagado', 'Entregado', 'Cancelado'];
  detail: PedidoTienda | null = null;
  isLoading = false;
  private routeSub?: Subscription;
  private destroyed = false;

  constructor(
    public data: DatosGimnasioService,
    private route: ActivatedRoute,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.url.subscribe(() => {
      this.loadOrders();
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.routeSub?.unsubscribe();
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

  loadOrders(): void {
    this.isLoading = true;
    this.data.listarPedidosTienda().subscribe({
      next: orders => {
        this.updateView(() => {
          this.pedidos = orders;
          this.page = 1;
        });
      },
      error: () => {
        this.updateView(() => {
          this.notice = 'No se pudieron cargar los pedidos de tienda.';
        });
      },
      complete: () => {
        this.updateView(() => {
          this.isLoading = false;
        });
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
        this.updateView(() => {
          this.detail = detail;
        });
      },
      error: () => {
        this.updateView(() => {
          this.notice = 'No se pudo cargar el detalle del pedido.';
        });
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
        this.updateView(() => {
          Object.assign(order, updated);
          if (this.detail?.id === order.id) {
            this.detail = updated;
          }
          this.notice = `Pedido ${order.code} actualizado a ${status}.`;
        });
      },
      error: () => {
        this.updateView(() => {
          this.notice = 'No se pudo actualizar el estado del pedido.';
        });
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

  private updateView(update: () => void): void {
    if (this.destroyed) return;
    this.zone.run(() => {
      update();
      this.cdr.detectChanges();
    });
  }

}
