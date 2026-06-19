import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DetailRecord, Supplement } from '../../../core/models/admin.models';
import { AdminPageActionService } from '../../../core/services/admin-page-action.service';
import { GymDataService } from '../../../core/services/gym-data.service';

@Component({ selector: 'app-supplements-page', standalone: true, imports: [FormsModule], templateUrl: './supplements.html' })
export class SupplementsPageComponent implements OnInit, OnDestroy {
  search = ''; view: 'grid' | 'list' = 'grid'; notice = ''; showForm = false; formStep = 1; detail: DetailRecord | null = null;
  newItem = { name: '', category: '', description: '', stock: 0, minStock: 5, price: 0, photo: '' };
  constructor(public data: GymDataService, private actions: AdminPageActionService) {}
  ngOnInit(): void { this.actions.register('+ Nuevo suplemento', () => { this.formStep = 1; this.showForm = true; }); }
  ngOnDestroy(): void { this.actions.clear(); }
  get totalStock(): number { return this.data.supplements.reduce((sum, item) => sum + item.stock, 0); }
  get lowStockCount(): number { return this.data.supplements.filter(item => item.stock <= item.minStock).length; }
  get inventoryValue(): number { return this.data.supplements.reduce((sum, item) => sum + item.stock * item.price, 0); }
  get items(): Supplement[] { const q = this.search.toLowerCase().trim(); return this.data.supplements.filter(item => `${item.name} ${item.category}`.toLowerCase().includes(q)).sort((a,b) => Number(b.stock <= b.minStock) - Number(a.stock <= a.minStock) || a.stock - b.stock); }
  changeStock(item: Supplement, amount: number): void { item.stock = Math.max(0, item.stock + amount); }
  remove(item: Supplement): void { this.data.supplements = this.data.supplements.filter(current => current.id !== item.id); this.notice = `${item.name} retirado del inventario.`; }
  showDetail(item: Supplement): void { this.detail = { title: item.name, subtitle: item.description, status: item.stock <= item.minStock ? 'Stock bajo' : 'Disponible', photo: item.photo, fields: [{ label: 'Categoría', value: item.category }, { label: 'Precio', value: `$${item.price.toFixed(2)}` }, { label: 'Stock actual', value: `${item.stock} unidades` }, { label: 'Stock mínimo', value: `${item.minStock} unidades` }] }; }
  handlePhoto(event: Event): void { const file = (event.target as HTMLInputElement).files?.[0]; if (!file || file.size > 4 * 1024 * 1024) { this.notice = 'Selecciona una imagen menor a 4 MB.'; return; } const reader = new FileReader(); reader.onload = () => this.newItem.photo = String(reader.result); reader.readAsDataURL(file); }
  add(): void { if (!this.newItem.name.trim() || !this.newItem.category.trim() || !this.newItem.description.trim()) { this.notice = 'Completa nombre, categoría y descripción.'; return; } this.data.supplements.unshift({ id: Date.now(), ...this.newItem }); this.newItem = { name: '', category: '', description: '', stock: 0, minStock: 5, price: 0, photo: '' }; this.showForm = false; this.formStep = 1; this.notice = 'Suplemento agregado correctamente.'; }
}
