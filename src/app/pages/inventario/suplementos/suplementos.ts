import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DetalleRegistro, Suplemento } from '../../../core/modelos/modelos-administracion';
import { AccionPaginaAdminService } from '../../../core/servicios/accion-pagina-admin.service';
import { DatosGimnasioService } from '../../../core/servicios/datos-gimnasio.service';

type FiltroStock = 'Todos' | 'Stock bajo' | 'Disponibles' | 'Agotados';

@Component({ selector: 'app-pagina-suplementos', standalone: true, imports: [FormsModule], templateUrl: './suplementos.html' })
export class PaginaSuplementosComponent implements OnInit, OnDestroy {
  search = '';
  view: 'grid' | 'list' = 'grid';
  notice = '';
  showForm = false;
  formStep = 1;
  detail: DetalleRegistro | null = null;
  detailItem: Suplemento | null = null;
  suplementoAEliminar: Suplemento | null = null;
  editingItemId: number | null = null;
  stockFilter: FiltroStock = 'Todos';
  categoryFilter = 'Todas';
  newItem = { name: '', category: '', description: '', stock: 0, minStock: 5, price: 0, photo: '' };
  editItem = { name: '', category: '', description: '', stock: 0, minStock: 5, price: 0, photo: '' };

  readonly stockFilters: FiltroStock[] = ['Todos', 'Stock bajo', 'Disponibles', 'Agotados'];

  constructor(public data: DatosGimnasioService, private actions: AccionPaginaAdminService) {}

  ngOnInit(): void {
    this.actions.registrar('+ Nuevo suplemento', () => {
      this.formStep = 1;
      this.showForm = true;
    });
  }

  ngOnDestroy(): void {
    this.actions.limpiar();
  }

  get totalStock(): number {
    return this.data.suplementos.reduce((sum, item) => sum + item.stock, 0);
  }

  get lowStockCount(): number {
    return this.data.suplementos.filter(item => item.stock <= item.minStock).length;
  }

  get inventoryValue(): number {
    return this.data.suplementos.reduce((sum, item) => sum + item.stock * item.price, 0);
  }

  get items(): Suplemento[] {
    const q = this.search.toLowerCase().trim();
    return this.data.suplementos
      .filter(item => {
        const matchesSearch = `${item.name} ${item.category}`.toLowerCase().includes(q);
        const matchesStock =
          this.stockFilter === 'Todos'
          || (this.stockFilter === 'Stock bajo' && item.stock > 0 && item.stock <= item.minStock)
          || (this.stockFilter === 'Disponibles' && item.stock > item.minStock)
          || (this.stockFilter === 'Agotados' && item.stock === 0);
        const matchesCategory = this.categoryFilter === 'Todas' || item.category === this.categoryFilter;
        return matchesSearch && matchesStock && matchesCategory;
      })
      .sort((a, b) => Number(b.stock <= b.minStock) - Number(a.stock <= a.minStock) || a.stock - b.stock);
  }

  get categoryFilters(): string[] {
    return ['Todas', ...Array.from(new Set(this.data.suplementos.map(item => item.category)))];
  }

  setStockFilter(filter: FiltroStock): void { this.stockFilter = filter; }
  setCategoryFilter(filter: string): void { this.categoryFilter = filter; }

  changeStock(item: Suplemento, amount: number): void {
    item.stock = Math.max(0, item.stock + amount);
  }

  remove(item: Suplemento): void {
    this.suplementoAEliminar = item;
  }

  openEdit(item: Suplemento): void {
    this.editingItemId = item.id;
    this.editItem = { name: item.name, category: item.category, description: item.description, stock: item.stock, minStock: item.minStock, price: item.price, photo: item.photo };
  }

  cancelEdit(): void { this.editingItemId = null; }

  saveEdit(): void {
    const item = this.data.suplementos.find(current => current.id === this.editingItemId);
    if (!item || !this.editItem.name.trim() || !this.editItem.category.trim()) {
      this.notice = 'Completa nombre y categoría.';
      return;
    }
    Object.assign(item, {
      name: this.editItem.name.trim(),
      category: this.editItem.category.trim(),
      description: this.editItem.description.trim(),
      stock: Math.max(0, Number(this.editItem.stock) || 0),
      minStock: Math.max(0, Number(this.editItem.minStock) || 0),
      price: Math.max(0, Number(this.editItem.price) || 0),
      photo: this.editItem.photo
    });
    this.editingItemId = null;
    this.notice = 'Suplemento actualizado correctamente.';
  }

  cancelarEliminacion(): void {
    this.suplementoAEliminar = null;
  }

  confirmarEliminacion(): void {
    const item = this.suplementoAEliminar;
    if (!item) return;
    this.data.suplementos = this.data.suplementos.filter(current => current.id !== item.id);
    this.suplementoAEliminar = null;
    this.detail = null;
    this.detailItem = null;
    this.notice = `${item.name} eliminado del inventario.`;
  }

  showDetail(item: Suplemento): void {
    this.detailItem = item;
    this.detail = {
      title: item.name,
      subtitle: item.description,
      status: item.stock <= item.minStock ? 'Stock bajo' : 'Disponible',
      photo: item.photo,
      fields: [
        { label: 'Categoría', value: item.category },
        { label: 'Precio', value: `$${item.price.toFixed(2)}` },
        { label: 'Stock actual', value: `${item.stock} unidades` },
        { label: 'Stock mínimo', value: `${item.minStock} unidades` }
      ]
    };
  }

  handlePhoto(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || file.size > 4 * 1024 * 1024) {
      this.notice = 'Selecciona una imagen menor a 4 MB.';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => this.newItem.photo = String(reader.result);
    reader.readAsDataURL(file);
  }

  handleEditPhoto(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || file.size > 4 * 1024 * 1024) {
      this.notice = 'Selecciona una imagen menor a 4 MB.';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => this.editItem.photo = String(reader.result);
    reader.readAsDataURL(file);
  }

  add(): void {
    if (!this.newItem.name.trim() || !this.newItem.category.trim() || !this.newItem.description.trim()) {
      this.notice = 'Completa nombre, categoría y descripción.';
      return;
    }
    this.data.suplementos.unshift({ id: Date.now(), ...this.newItem });
    this.newItem = { name: '', category: '', description: '', stock: 0, minStock: 5, price: 0, photo: '' };
    this.showForm = false;
    this.formStep = 1;
    this.notice = 'Suplemento agregado correctamente.';
  }
}
