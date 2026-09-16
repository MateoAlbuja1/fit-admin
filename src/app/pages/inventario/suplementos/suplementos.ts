import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { DetalleRegistro, Suplemento } from '../../../core/modelos/modelos-administracion';
import { AccionPaginaAdminService } from '../../../core/servicios/accion-pagina-admin.service';
import { AuthService } from '../../../core/servicios/auth.service';
import { DatosGimnasioService } from '../../../core/servicios/datos-gimnasio.service';

type FiltroStock = 'Todos' | 'Stock bajo' | 'Disponibles' | 'Agotados';
type PreviewKey = 'newPhotoPreview' | 'newFactsPhotoPreview' | 'editPhotoPreview' | 'editFactsPhotoPreview';

@Component({ selector: 'app-pagina-suplementos', standalone: true, imports: [FormsModule], templateUrl: './suplementos.html' })
export class PaginaSuplementosComponent implements OnInit, OnDestroy {
  search = '';
  view: 'grid' | 'list' = 'grid';
  notice = '';
  noticeType: 'success' | 'warning' | 'error' = 'success';
  showForm = false;
  formStep = 1;
  detail: DetalleRegistro | null = null;
  detailItem: Suplemento | null = null;
  suplementoAEliminar: Suplemento | null = null;
  editingItemId: number | null = null;
  isCreating = false;
  isSavingEdit = false;
  isDeletingSupplement = false;
  stockFilter: FiltroStock = 'Todos';
  categoryFilter = 'Todas';
  readonly newCategoryOption = '__new_category__';
  newCategorySelection = '';
  newCategoryText = '';
  editCategorySelection = '';
  editCategoryText = '';
  newPhotoPreview = '';
  newFactsPhotoPreview = '';
  editPhotoPreview = '';
  editFactsPhotoPreview = '';
  imageReadsInProgress = 0;
  newItem = this.emptySupplementForm();
  editItem = this.emptySupplementForm();
  private noticeTimer?: ReturnType<typeof setTimeout>;
  private stockRequestVersions = new Map<number, number>();
  private stockDrafts = new Map<number, number | null>();
  private readonly requestTimeoutMs = 25000;

  readonly stockFilters: FiltroStock[] = ['Todos', 'Stock bajo', 'Disponibles', 'Agotados'];

  constructor(
    public data: DatosGimnasioService,
    private actions: AccionPaginaAdminService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.actions.registrar('+ Nuevo suplemento', () => this.openCreate());
  }

  ngOnDestroy(): void {
    if (this.noticeTimer) {
      clearTimeout(this.noticeTimer);
    }
    this.clearImagePreviews();
    this.actions.limpiar();
  }

  get totalStock(): number {
    return this.data.suplementos.reduce((sum, item) => sum + item.stock, 0);
  }

  get lowStockCount(): number {
    return this.data.suplementos.filter(item => item.stock <= item.minStock).length;
  }

  get inventoryValue(): number {
    return this.data.suplementos.reduce((sum, item) => sum + item.stock * this.displayPrice(item), 0);
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
    return ['Todas', ...this.categoryOptions];
  }

  get categoryOptions(): string[] {
    return Array.from(new Set(this.data.suplementos.map(item => item.category.trim()).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b));
  }

  get ivaTemporalLabel(): string {
    return this.data.etiquetaIvaTemporal;
  }

  get isPreparingImages(): boolean {
    return this.imageReadsInProgress > 0;
  }

  get canDelete(): boolean {
    return this.auth.currentUser?.apiRole === 'ADMIN';
  }

  displayPrice(item: Suplemento): number {
    return this.data.precioConIvaTemporal(item.price);
  }

  setStockFilter(filter: FiltroStock): void {
    this.stockFilter = filter;
  }

  setCategoryFilter(filter: string): void {
    this.categoryFilter = filter;
  }

  stockDraftValue(item: Suplemento): number | null {
    return this.stockDrafts.has(item.id) ? this.stockDrafts.get(item.id) ?? null : item.stock;
  }

  setStockDraft(item: Suplemento, value: number | string | null): void {
    const parsed = value === null || value === '' ? null : Math.floor(Number(value));
    this.stockDrafts.set(item.id, Number.isFinite(parsed) && parsed !== null ? Math.max(0, parsed) : null);
  }

  applyStockDraft(item: Suplemento): void {
    const draft = this.stockDraftValue(item);
    if (draft === null) {
      this.showNotice('Ingresa una cantidad de stock valida.', 'warning');
      return;
    }

    this.changeStock(item, draft - item.stock);
  }

  changeStock(item: Suplemento, amount: number): void {
    const previousStock = item.stock;
    const nextStock = Math.max(0, previousStock + amount);
    if (nextStock === previousStock) {
      this.stockDrafts.set(item.id, nextStock);
      return;
    }
    const requestVersion = (this.stockRequestVersions.get(item.id) ?? 0) + 1;
    this.stockRequestVersions.set(item.id, requestVersion);

    this.updateView(() => {
      item.stock = nextStock;
      this.stockDrafts.set(item.id, nextStock);
    });

    this.data.actualizarStockSuplemento(item.id, amount).pipe(
      timeout(this.requestTimeoutMs)
    ).subscribe({
      next: updated => {
        if (this.stockRequestVersions.get(item.id) !== requestVersion) {
          return;
        }
        this.updateView(() => {
          const current = this.data.suplementos.find(product => product.id === updated.id);
          if (current) {
            Object.assign(current, updated);
            this.stockDrafts.set(current.id, current.stock);
          }
        });
      },
      error: () => {
        if (this.stockRequestVersions.get(item.id) === requestVersion) {
          this.data.refrescar();
          this.showNotice('No se pudo confirmar el stock. Se actualizara desde el backend.', 'error');
        }
      }
    });
  }

  openCreate(): void {
    this.clearNewPreviews();
    this.newItem = this.emptySupplementForm();
    this.newCategorySelection = '';
    this.newCategoryText = '';
    this.formStep = 1;
    this.showForm = true;
  }

  closeCreate(): void {
    if (this.isCreating) {
      return;
    }
    this.showForm = false;
    this.formStep = 1;
    this.newCategorySelection = '';
    this.newCategoryText = '';
    this.clearNewPreviews();
  }

  remove(item: Suplemento): void {
    if (!this.canDelete) {
      this.showNotice('Solo el administrador puede eliminar suplementos.', 'warning');
      return;
    }
    this.suplementoAEliminar = item;
  }

  openEdit(item: Suplemento): void {
    this.clearEditPreviews();
    this.editingItemId = item.id;
    this.editCategorySelection = this.categoryOptions.includes(item.category) ? item.category : this.newCategoryOption;
    this.editCategoryText = this.editCategorySelection === this.newCategoryOption ? item.category : '';
    this.editItem = {
      name: item.name,
      category: item.category,
      description: item.description,
      stock: item.stock,
      minStock: item.minStock,
      price: item.price,
      photo: item.photo,
      factsPhoto: item.factsPhoto ?? ''
    };
  }

  cancelEdit(): void {
    if (this.isSavingEdit) {
      return;
    }
    this.clearEditPreviews();
    this.editingItemId = null;
  }

  saveEdit(): void {
    if (this.isSavingEdit) {
      return;
    }

    const item = this.data.suplementos.find(current => current.id === this.editingItemId);
    if (!item || !this.editItem.name.trim() || !this.editItem.category.trim()) {
      this.showNotice('Completa nombre y categoria.', 'warning');
      return;
    }

    this.updateView(() => this.isSavingEdit = true);
    const request$ = this.data.actualizarSuplemento(item.id, {
      name: this.editItem.name.trim(),
      category: this.editItem.category.trim(),
      description: this.editItem.description.trim(),
      stock: Math.max(0, Number(this.editItem.stock) || 0),
      minStock: Math.max(0, Number(this.editItem.minStock) || 0),
      price: Math.max(0, Number(this.editItem.price) || 0),
      photo: this.editItem.photo,
      factsPhoto: this.editItem.factsPhoto
    }).pipe(
      timeout(this.requestTimeoutMs),
      finalize(() => this.updateView(() => this.isSavingEdit = false))
    );

    request$.subscribe({
      next: updated => {
        this.updateView(() => {
          Object.assign(item, updated);
          this.stockDrafts.set(item.id, item.stock);
          this.clearEditPreviews();
          this.editingItemId = null;
        });
        this.showNotice('Suplemento actualizado correctamente.');
      },
      error: error => {
        this.showNotice(error.name === 'TimeoutError'
          ? 'La actualizacion esta tardando demasiado. Intenta nuevamente.'
          : 'No se pudo actualizar el suplemento en el backend.', 'error');
      }
    });
  }

  cancelarEliminacion(): void {
    if (this.isDeletingSupplement) {
      return;
    }
    this.suplementoAEliminar = null;
  }

  confirmarEliminacion(): void {
    if (this.isDeletingSupplement) {
      return;
    }

    const item = this.suplementoAEliminar;
    if (!item) return;
    if (!this.canDelete) {
      this.suplementoAEliminar = null;
      this.showNotice('Solo el administrador puede eliminar suplementos.', 'warning');
      return;
    }

    this.isDeletingSupplement = true;
    const request$ = this.data.eliminarSuplemento(item.id).pipe(
      timeout(this.requestTimeoutMs),
      finalize(() => this.updateView(() => this.isDeletingSupplement = false))
    );

    request$.subscribe({
      next: () => {
        this.updateView(() => {
          this.data.suplementos = this.data.suplementos.filter(current => current.id !== item.id);
          this.stockDrafts.delete(item.id);
          this.suplementoAEliminar = null;
          this.detail = null;
          this.detailItem = null;
        });
        this.showNotice(`${item.name} eliminado del inventario.`);
      },
      error: error => {
        this.showNotice(error.name === 'TimeoutError'
          ? 'La eliminacion esta tardando demasiado. Intenta nuevamente.'
          : 'No se pudo eliminar el suplemento en el backend.', 'error');
      }
    });
  }

  showDetail(item: Suplemento): void {
    this.detailItem = item;
    this.detail = {
      title: item.name,
      subtitle: item.description,
      status: item.stock <= item.minStock ? 'Stock bajo' : 'Disponible',
      photo: item.photo,
      fields: [
        { label: 'Categoria', value: item.category },
        { label: this.data.ivaTemporalActivo ? 'Precio con IVA' : 'Precio', value: `$${this.displayPrice(item).toFixed(2)}` },
        { label: 'Stock actual', value: `${item.stock} unidades` },
        { label: 'Stock minimo', value: `${item.minStock} unidades` }
      ]
    };
  }

  handlePhoto(event: Event): void {
    this.readImageFile(event, 'newPhotoPreview', value => this.newItem = { ...this.newItem, photo: value });
  }

  handleFactsPhoto(event: Event): void {
    this.readImageFile(event, 'newFactsPhotoPreview', value => this.newItem = { ...this.newItem, factsPhoto: value });
  }

  handleEditPhoto(event: Event): void {
    this.readImageFile(event, 'editPhotoPreview', value => this.editItem = { ...this.editItem, photo: value });
  }

  handleEditFactsPhoto(event: Event): void {
    this.readImageFile(event, 'editFactsPhotoPreview', value => this.editItem = { ...this.editItem, factsPhoto: value });
  }

  setNewCategorySelection(value: string): void {
    this.newCategorySelection = value;
    this.newItem.category = value === this.newCategoryOption ? this.newCategoryText.trim() : value;
  }

  setNewCategoryText(value: string): void {
    this.newCategoryText = value;
    if (this.newCategorySelection === this.newCategoryOption) {
      this.newItem.category = value.trim();
    }
  }

  setEditCategorySelection(value: string): void {
    this.editCategorySelection = value;
    this.editItem.category = value === this.newCategoryOption ? this.editCategoryText.trim() : value;
  }

  setEditCategoryText(value: string): void {
    this.editCategoryText = value;
    if (this.editCategorySelection === this.newCategoryOption) {
      this.editItem.category = value.trim();
    }
  }

  private readImageFile(event: Event, previewKey: PreviewKey, onLoad: (value: string) => void): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || file.size > 4 * 1024 * 1024) {
      this.showNotice('Selecciona una imagen menor a 4 MB.', 'warning');
      input.value = '';
      return;
    }
    this.setPreview(previewKey, URL.createObjectURL(file));
    this.imageReadsInProgress += 1;
    this.cdr.detectChanges();

    this.compressImageFile(file).then(value => {
      this.updateView(() => {
        onLoad(value);
        input.value = '';
      });
    }).catch(() => {
      this.showNotice('No se pudo cargar la imagen.', 'error');
      input.value = '';
    }).finally(() => {
      this.updateView(() => {
        this.imageReadsInProgress = Math.max(0, this.imageReadsInProgress - 1);
      });
    });
  }

  add(): void {
    if (this.isCreating || this.isPreparingImages) {
      return;
    }

    if (!this.newItem.name.trim() || !this.newItem.category.trim() || !this.newItem.description.trim()) {
      this.showNotice('Completa nombre, categoria y descripcion.', 'warning');
      return;
    }

    this.updateView(() => this.isCreating = true);
    const request$ = this.data.crearSuplemento(this.newItem).pipe(
      timeout(this.requestTimeoutMs),
      finalize(() => this.updateView(() => this.isCreating = false))
    );

    request$.subscribe({
      next: created => {
        this.updateView(() => {
          this.data.suplementos.unshift(created);
          this.stockDrafts.set(created.id, created.stock);
          this.newItem = this.emptySupplementForm();
          this.showForm = false;
          this.formStep = 1;
          this.newCategorySelection = '';
          this.newCategoryText = '';
          this.clearNewPreviews();
        });
        this.showNotice('Suplemento agregado correctamente.');
      },
      error: error => {
        this.showNotice(error.name === 'TimeoutError'
          ? 'El registro esta tardando demasiado. Intenta nuevamente.'
          : 'No se pudo crear el suplemento en el backend.', 'error');
      }
    });
  }

  clearNotice(): void {
    if (this.noticeTimer) {
      clearTimeout(this.noticeTimer);
      this.noticeTimer = undefined;
    }
    this.notice = '';
  }

  private showNotice(message: string, type: 'success' | 'warning' | 'error' = 'success'): void {
    if (this.noticeTimer) {
      clearTimeout(this.noticeTimer);
    }
    this.updateView(() => {
      this.notice = message;
      this.noticeType = type;
    });
    this.noticeTimer = setTimeout(() => {
      this.updateView(() => this.notice = '');
      this.noticeTimer = undefined;
    }, 4200);
  }

  private updateView(update: () => void): void {
    this.zone.run(() => {
      update();
      this.cdr.detectChanges();
    });
  }

  private compressImageFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);
      image.onload = () => {
        try {
          const maxSize = 1280;
          const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
          const width = Math.max(1, Math.round(image.width * scale));
          const height = Math.max(1, Math.round(image.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext('2d');
          if (!context) {
            reject(new Error('Canvas not available'));
            return;
          }
          context.drawImage(image, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        } catch (error) {
          reject(error);
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
      };
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Image load failed'));
      };
      image.src = objectUrl;
    });
  }

  private setPreview(key: PreviewKey, value: string): void {
    const current = this[key];
    if (current?.startsWith('blob:')) {
      URL.revokeObjectURL(current);
    }
    this.updateView(() => {
      this[key] = value;
    });
  }

  private clearNewPreviews(): void {
    this.setPreview('newPhotoPreview', '');
    this.setPreview('newFactsPhotoPreview', '');
  }

  private clearEditPreviews(): void {
    this.setPreview('editPhotoPreview', '');
    this.setPreview('editFactsPhotoPreview', '');
  }

  private clearImagePreviews(): void {
    this.clearNewPreviews();
    this.clearEditPreviews();
  }

  private emptySupplementForm() {
    return { name: '', category: '', description: '', stock: 0, minStock: 5, price: 0, photo: '', factsPhoto: '' };
  }
}
