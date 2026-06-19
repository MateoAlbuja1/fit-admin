import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DetailRecord, Machine } from '../../../core/models/admin.models';
import { AdminPageActionService } from '../../../core/services/admin-page-action.service';
import { GymDataService } from '../../../core/services/gym-data.service';

@Component({ selector: 'app-machines-page', standalone: true, imports: [FormsModule], templateUrl: './machines.html' })
export class MachinesPageComponent implements OnInit, OnDestroy {
  search = ''; view: 'grid' | 'list' = 'grid'; notice = ''; showForm = false; formStep = 1; detail: DetailRecord | null = null;
  newItem = { name: '', type: '', location: '', status: 'Operativa' as Machine['status'], nextMaintenance: '', photo: '' };
  constructor(public data: GymDataService, private actions: AdminPageActionService) {}
  ngOnInit(): void { this.actions.register('+ Nueva máquina', () => { this.formStep = 1; this.showForm = true; }); }
  ngOnDestroy(): void { this.actions.clear(); }
  get operational(): number { return this.data.machines.filter(item => item.status === 'Operativa').length; }
  get attention(): number { return this.data.machines.filter(item => item.status !== 'Operativa').length; }
  get items(): Machine[] { const q = this.search.toLowerCase().trim(); const rank: Record<Machine['status'],number> = { 'Fuera de servicio':0, 'Mantenimiento':1, 'Operativa':2 }; return this.data.machines.filter(item => `${item.name} ${item.type} ${item.location}`.toLowerCase().includes(q)).sort((a,b) => rank[a.status] - rank[b.status]); }
  toggleStatus(item: Machine): void { item.status = item.status === 'Mantenimiento' ? 'Operativa' : 'Mantenimiento'; this.notice = `${item.name}: estado actualizado.`; }
  showDetail(item: Machine): void { this.detail = { title: item.name, subtitle: item.type, status: item.status, photo: item.photo, fields: [{ label: 'Tipo', value: item.type }, { label: 'Ubicación', value: item.location }, { label: 'Próximo mantenimiento', value: item.nextMaintenance || 'Sin programar' }] }; }
  handlePhoto(event: Event): void { const file = (event.target as HTMLInputElement).files?.[0]; if (!file || file.size > 4 * 1024 * 1024) { this.notice = 'Selecciona una imagen menor a 4 MB.'; return; } const reader = new FileReader(); reader.onload = () => this.newItem.photo = String(reader.result); reader.readAsDataURL(file); }
  add(): void { if (!this.newItem.name.trim() || !this.newItem.type.trim()) { this.notice = 'Completa el nombre y tipo de equipo.'; return; } this.data.machines.unshift({ id: Date.now(), ...this.newItem }); this.newItem = { name: '', type: '', location: '', status: 'Operativa', nextMaintenance: '', photo: '' }; this.showForm = false; this.formStep = 1; this.notice = 'Máquina agregada correctamente.'; }
}
