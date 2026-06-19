import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Client, DetailRecord } from '../../core/models/admin.models';
import { AdminPageActionService } from '../../core/services/admin-page-action.service';
import { GymDataService } from '../../core/services/gym-data.service';

@Component({ selector: 'app-clients-page', standalone: true, imports: [FormsModule], templateUrl: './clients.html' })
export class ClientsPageComponent implements OnInit, OnDestroy {
  search = '';
  notice = '';
  showForm = false;
  detail: DetailRecord | null = null;
  page = 1;
  readonly pageSize = 3;
  newClient = { name: '', document: '', phone: '', plan: 'Plan mensual' };

  constructor(public data: GymDataService, private actions: AdminPageActionService) {}
  ngOnInit(): void { this.actions.register('+ Nuevo cliente', () => this.openForm()); }
  ngOnDestroy(): void { this.actions.clear(); }

  get activeClients(): number { return this.data.clients.filter(client => client.status === 'Activo').length; }
  get filteredClients(): Client[] { const q = this.search.toLowerCase().trim(); return this.data.clients.filter(client => `${client.name} ${client.document} ${client.plan}`.toLowerCase().includes(q)); }
  get pageCount(): number { return Math.max(1, Math.ceil(this.filteredClients.length / this.pageSize)); }
  get pagedClients(): Client[] { return this.filteredClients.slice((this.page - 1) * this.pageSize, this.page * this.pageSize); }
  openForm(): void { this.notice = ''; this.showForm = true; }
  changePage(direction: number): void { this.page = Math.min(this.pageCount, Math.max(1, this.page + direction)); }
  toggleClient(client: Client): void { client.status = client.status === 'Activo' ? 'Inactivo' : 'Activo'; this.notice = `${client.name}: estado actualizado.`; }
  showDetail(client: Client): void { this.detail = { title: client.name, subtitle: `Cliente #${client.id}`, status: client.status, photo: '', fields: [{ label: 'Cédula', value: client.document }, { label: 'Teléfono', value: client.phone }, { label: 'Membresía', value: client.plan }, { label: 'Ingreso', value: client.joined }] }; }
  addClient(): void {
    if (!this.newClient.name.trim() || !this.newClient.document.trim()) { this.notice = 'Completa el nombre y la cédula.'; return; }
    this.data.clients.unshift({ id: Math.max(...this.data.clients.map(item => item.id)) + 1, name: this.newClient.name.trim(), document: this.newClient.document.trim(), phone: this.newClient.phone.trim() || 'Sin teléfono', plan: this.newClient.plan, joined: '19 Jun 2026', status: 'Activo' });
    this.newClient = { name: '', document: '', phone: '', plan: 'Plan mensual' };
    this.showForm = false; this.notice = 'Cliente registrado correctamente.';
  }
}
