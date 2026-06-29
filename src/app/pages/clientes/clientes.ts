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
  ngOnInit(): void { this.actions.registrar('+ Nuevo cliente', () => this.openForm()); }
  ngOnDestroy(): void { this.actions.limpiar(); }

  get activeClients(): number { return this.data.clientes.filter(client => client.status === 'Activo').length; }
  get filteredClients(): Cliente[] {
    const q = this.search.toLowerCase().trim();
    return this.data.clientes.filter(client => {
      const matchesSearch = `${client.name} ${client.document} ${client.plan}`.toLowerCase().includes(q);
      const matchesStatus = this.statusFilter === 'Todos' || client.status === this.statusFilter;
      const matchesPlan = this.planFilter === 'Todos' || client.plan === this.planFilter;
      return matchesSearch && matchesStatus && matchesPlan;
    });
  }
  get pageCount(): number { return Math.max(1, Math.ceil(this.filteredClients.length / this.pageSize)); }
  get pagedClients(): Cliente[] { return this.filteredClients.slice((this.page - 1) * this.pageSize, this.page * this.pageSize); }

  setStatusFilter(filter: FiltroClienteEstado): void { this.statusFilter = filter; this.page = 1; }
  setPlanFilter(filter: FiltroClientePlan): void { this.planFilter = filter; this.page = 1; }
  openForm(): void { this.notice = ''; this.showForm = true; }
  changePage(direction: number): void { this.page = Math.min(this.pageCount, Math.max(1, this.page + direction)); }
  toggleClient(client: Cliente): void { client.status = client.status === 'Activo' ? 'Inactivo' : 'Activo'; this.notice = `${client.name}: estado actualizado.`; }
  showDetail(client: Cliente): void { this.detail = { title: client.name, subtitle: `Cliente #${client.id}`, status: client.status, photo: '', fields: [{ label: 'Cédula', value: client.document }, { label: 'Teléfono', value: client.phone }, { label: 'Membresía', value: client.plan }, { label: 'Ingreso', value: client.joined }] }; }

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
      this.notice = 'Completa nombre y cédula para guardar.';
      return;
    }
    client.name = this.editClient.name.trim();
    client.document = this.editClient.document.trim();
    client.phone = this.editClient.phone.trim() || 'Sin teléfono';
    client.plan = this.editClient.plan;
    client.status = this.editClient.status;
    this.editingClientId = null;
    this.notice = 'Cliente actualizado correctamente.';
  }

  addClient(): void {
    if (!this.newClient.name.trim() || !this.newClient.document.trim()) { this.notice = 'Completa el nombre y la cédula.'; return; }
    this.data.clientes.unshift({ id: Math.max(...this.data.clientes.map(item => item.id)) + 1, name: this.newClient.name.trim(), document: this.newClient.document.trim(), phone: this.newClient.phone.trim() || 'Sin teléfono', plan: this.newClient.plan, joined: '19 Jun 2026', status: 'Activo' });
    this.newClient = { name: '', document: '', phone: '', plan: 'Plan mensual' };
    this.showForm = false; this.notice = 'Cliente registrado correctamente.';
  }
}
