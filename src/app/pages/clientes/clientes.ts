import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { Cliente, DetalleRegistro } from '../../core/modelos/modelos-administracion';
import { AccionPaginaAdminService } from '../../core/servicios/accion-pagina-admin.service';
import { DatosGimnasioService } from '../../core/servicios/datos-gimnasio.service';

type FiltroClienteEstado = 'Todos' | Cliente['status'];
type FiltroClientePlan = 'Todos' | 'Plan mensual' | 'Plan trimestral' | 'Plan anual';

@Component({ selector: 'app-pagina-clientes', standalone: true, imports: [FormsModule], templateUrl: './clientes.html' })
export class PaginaClientesComponent implements OnInit, OnDestroy {
  search = '';
  notice = '';
  noticeType: 'success' | 'warning' | 'error' = 'success';
  showForm = false;
  detail: DetalleRegistro | null = null;
  page = 1;
  readonly pageSize = 3;
  statusFilter: FiltroClienteEstado = 'Todos';
  planFilter: FiltroClientePlan = 'Todos';
  editingClientId: number | null = null;
  isSavingClient = false;
  newClient = { name: '', document: '', phone: '', plan: 'Plan mensual' };
  editClient = { name: '', document: '', phone: '', status: 'Activo' as Cliente['status'] };
  private noticeTimer?: ReturnType<typeof setTimeout>;

  readonly statusFilters: FiltroClienteEstado[] = ['Todos', 'Activo', 'Inactivo'];
  readonly planFilters: FiltroClientePlan[] = ['Todos', 'Plan mensual', 'Plan trimestral', 'Plan anual'];

  constructor(
    public data: DatosGimnasioService,
    private actions: AccionPaginaAdminService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.actions.registrar('+ Nuevo cliente', () => this.openForm());
  }

  ngOnDestroy(): void {
    this.actions.limpiar();
    this.clearNoticeTimer();
  }

  get activeClients(): number {
    return this.data.clientes.filter(client => client.status === 'Activo').length;
  }

  get filteredClients(): Cliente[] {
    const q = this.search.toLowerCase().trim();
    return this.data.clientes.filter(client => {
      const matchesSearch = `${client.name} ${client.document} ${client.plan}`.toLowerCase().includes(q);
      const matchesStatus = this.statusFilter === 'Todos' || client.status === this.statusFilter;
      const matchesPlan = this.planFilter === 'Todos' || client.plan === this.planFilter;
      return matchesSearch && matchesStatus && matchesPlan;
    });
  }

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.filteredClients.length / this.pageSize));
  }

  get pagedClients(): Cliente[] {
    return this.filteredClients.slice((this.page - 1) * this.pageSize, this.page * this.pageSize);
  }

  setStatusFilter(filter: FiltroClienteEstado): void {
    this.statusFilter = filter;
    this.page = 1;
  }

  setPlanFilter(filter: FiltroClientePlan): void {
    this.planFilter = filter;
    this.page = 1;
  }

  openForm(): void {
    this.clearNotice();
    this.showForm = true;
  }

  changePage(direction: number): void {
    this.page = Math.min(this.pageCount, Math.max(1, this.page + direction));
  }

  toggleClient(client: Cliente): void {
    const nextStatus: Cliente['status'] = client.status === 'Activo' ? 'Inactivo' : 'Activo';
    this.data.actualizarCliente(client.id, { status: nextStatus }).subscribe({
      next: updated => {
        Object.assign(client, updated);
        this.showNotice(`${client.name}: estado actualizado.`);
      },
      error: () => {
        this.showNotice('No se pudo actualizar el estado en el backend.', 'error');
      }
    });
  }

  showDetail(client: Cliente): void {
    this.detail = {
      title: client.name,
      subtitle: `Cliente #${client.id}`,
      status: client.status,
      photo: '',
      fields: [
        { label: 'Cedula', value: client.document },
        { label: 'Telefono', value: client.phone },
        { label: 'Membresia', value: client.plan },
        { label: 'Ingreso', value: client.joined }
      ]
    };
  }

  openEdit(client: Cliente): void {
    this.editingClientId = client.id;
    this.editClient = { name: client.name, document: client.document, phone: client.phone, status: client.status };
  }

  cancelEdit(): void {
    this.editingClientId = null;
  }

  saveEdit(): void {
    const client = this.data.clientes.find(item => item.id === this.editingClientId);
    if (!client || !this.editClient.name.trim() || !this.editClient.document.trim()) {
      this.showNotice('Completa nombre y cedula para guardar.', 'warning');
      return;
    }

    this.data.actualizarCliente(client.id, {
      name: this.editClient.name.trim(),
      document: this.editClient.document.trim(),
      phone: this.editClient.phone.trim() || 'Sin telefono',
      status: this.editClient.status
    }).subscribe({
      next: updated => {
        Object.assign(client, updated);
        this.editingClientId = null;
        this.showNotice('Cliente actualizado correctamente.');
      },
      error: () => {
        this.showNotice('No se pudo guardar el cliente en el backend.', 'error');
      }
    });
  }

  addClient(): void {
    if (this.isSavingClient) {
      return;
    }

    this.clearNotice();
    if (!this.newClient.name.trim() || !this.newClient.document.trim()) {
      this.showNotice('Completa el nombre y la cedula.', 'warning');
      return;
    }

    const draft = { ...this.newClient };
    const payload = {
      name: draft.name.trim(),
      document: draft.document.trim(),
      phone: draft.phone.trim() || 'Sin telefono',
      status: 'Activo' as Cliente['status'],
      plan: draft.plan
    };

    this.isSavingClient = true;
    this.showForm = false;
    this.statusFilter = 'Todos';
    this.planFilter = 'Todos';
    this.search = '';
    this.page = 1;
    const tempClient = this.optimisticClient(payload);
    this.data.clientes = [tempClient, ...this.data.clientes];
    this.cdr.detectChanges();

    this.data.crearCliente(payload).pipe(
      timeout(10000),
      finalize(() => {
        this.isSavingClient = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: created => {
        this.data.clientes = [
          created,
          ...this.data.clientes.filter(client => client.id !== created.id && client.id !== tempClient.id)
        ];
        this.newClient = { name: '', document: '', phone: '', plan: 'Plan mensual' };
        this.showForm = false;
        this.showNotice('Cliente creado correctamente.');
        this.cdr.detectChanges();
      },
      error: error => {
        this.data.clientes = this.data.clientes.filter(client => client.id !== tempClient.id);
        this.newClient = draft;
        this.showForm = true;
        this.showNotice(error.name === 'TimeoutError'
          ? 'El registro esta tardando demasiado. Revisa la conexion e intenta nuevamente.'
          : 'No se pudo registrar el cliente en el backend.', 'error');
      }
    });
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
    }, 3800);
    this.cdr.detectChanges();
  }

  private clearNoticeTimer(): void {
    if (!this.noticeTimer) return;
    clearTimeout(this.noticeTimer);
    this.noticeTimer = undefined;
  }

  private optimisticClient(payload: { name: string; document: string; phone: string; plan: string; status: Cliente['status'] }): Cliente {
    return {
      id: -Date.now(),
      name: payload.name,
      document: payload.document,
      phone: payload.phone,
      plan: payload.plan,
      joined: this.todayLabel(),
      status: payload.status
    };
  }

  private todayLabel(): string {
    return new Date()
      .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      .replace(',', '');
  }
}
