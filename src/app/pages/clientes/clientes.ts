import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Cliente, DetalleRegistro } from '../../core/modelos/modelos-administracion';
import { AccionPaginaAdminService } from '../../core/servicios/accion-pagina-admin.service';
import { DatosGimnasioService } from '../../core/servicios/datos-gimnasio.service';

type FiltroClienteEstado = 'Todos' | Cliente['status'];
type FiltroClientePlan = 'Todos' | 'Plan mensual' | 'Plan trimestral' | 'Plan anual';

@Component({ selector: 'app-pagina-clientes', standalone: true, imports: [FormsModule], templateUrl: './clientes.html' })
export class PaginaClientesComponent implements OnInit, OnDestroy {
  search = '';
  notice = '';
  showForm = false;
  detail: DetalleRegistro | null = null;
  page = 1;
  readonly pageSize = 3;
  statusFilter: FiltroClienteEstado = 'Todos';
  planFilter: FiltroClientePlan = 'Todos';
  editingClientId: number | null = null;
  newClient = { name: '', document: '', phone: '', plan: 'Plan mensual' };
  editClient = { name: '', document: '', phone: '', plan: 'Plan mensual' as FiltroClientePlan, status: 'Activo' as Cliente['status'] };

  readonly statusFilters: FiltroClienteEstado[] = ['Todos', 'Activo', 'Inactivo'];
  readonly planFilters: FiltroClientePlan[] = ['Todos', 'Plan mensual', 'Plan trimestral', 'Plan anual'];

  constructor(public data: DatosGimnasioService, private actions: AccionPaginaAdminService) {}

  ngOnInit(): void {
    this.actions.registrar('+ Nuevo cliente', () => this.openForm());
  }

  ngOnDestroy(): void {
    this.actions.limpiar();
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
    this.notice = '';
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
        this.notice = `${client.name}: estado actualizado.`;
      },
      error: () => {
        this.notice = 'No se pudo actualizar el estado en el backend.';
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
    this.editClient = { name: client.name, document: client.document, phone: client.phone, plan: client.plan as FiltroClientePlan, status: client.status };
  }

  cancelEdit(): void {
    this.editingClientId = null;
  }

  saveEdit(): void {
    const client = this.data.clientes.find(item => item.id === this.editingClientId);
    if (!client || !this.editClient.name.trim() || !this.editClient.document.trim()) {
      this.notice = 'Completa nombre y cedula para guardar.';
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
        client.plan = this.editClient.plan;
        this.editingClientId = null;
        this.notice = 'Cliente actualizado correctamente.';
      },
      error: () => {
        this.notice = 'No se pudo guardar el cliente en el backend.';
      }
    });
  }

  addClient(): void {
    if (!this.newClient.name.trim() || !this.newClient.document.trim()) {
      this.notice = 'Completa el nombre y la cedula.';
      return;
    }

    this.data.crearCliente({
      name: this.newClient.name.trim(),
      document: this.newClient.document.trim(),
      phone: this.newClient.phone.trim() || 'Sin telefono',
      status: 'Activo'
    }).subscribe({
      next: created => {
        created.plan = this.newClient.plan;
        this.data.clientes.unshift(created);
        this.newClient = { name: '', document: '', phone: '', plan: 'Plan mensual' };
        this.showForm = false;
        this.notice = 'Cliente registrado correctamente.';
      },
      error: () => {
        this.notice = 'No se pudo registrar el cliente en el backend.';
      }
    });
  }
}
