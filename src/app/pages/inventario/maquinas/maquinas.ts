import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { DetalleRegistro, Maquina } from '../../../core/modelos/modelos-administracion';
import { AccionPaginaAdminService } from '../../../core/servicios/accion-pagina-admin.service';
import { AuthService } from '../../../core/servicios/auth.service';
import { DatosGimnasioService } from '../../../core/servicios/datos-gimnasio.service';

type PreviewKey = 'newPhotoPreview' | 'editPhotoPreview';

@Component({ selector: 'app-pagina-maquinas', standalone: true, imports: [FormsModule], templateUrl: './maquinas.html' })
export class PaginaMaquinasComponent implements OnInit, OnDestroy {
  search = '';
  view: 'grid' | 'list' = 'grid';
  notice = '';
  noticeType: 'success' | 'warning' | 'error' = 'success';
  showForm = false;
  formStep = 1;
  detail: DetalleRegistro | null = null;
  detailItem: Maquina | null = null;
  maquinaAEliminar: Maquina | null = null;
  editingItemId: number | null = null;
  isCreating = false;
  isSavingEdit = false;
  savingStatusIds = new Set<number>();
  newPhotoPreview = '';
  editPhotoPreview = '';
  imageReadsInProgress = 0;
  private noticeTimer?: ReturnType<typeof setTimeout>;
  private readonly requestTimeoutMs = 25000;
  newItem = { name: '', type: '', location: '', status: 'Operativa' as Maquina['status'], nextMaintenance: '', photo: '' };
  editItem = { name: '', type: '', location: '', status: 'Operativa' as Maquina['status'], nextMaintenance: '', photo: '' };

  constructor(
    public data: DatosGimnasioService,
    private actions: AccionPaginaAdminService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.actions.registrar('+ Nueva maquina', () => {
      this.clearNewPreview();
      this.newItem = { name: '', type: '', location: '', status: 'Operativa', nextMaintenance: '', photo: '' };
      this.formStep = 1;
      this.showForm = true;
    });
  }

  ngOnDestroy(): void {
    this.actions.limpiar();
    this.clearNoticeTimer();
    this.clearImagePreviews();
  }

  get operational(): number {
    return this.data.maquinas.filter(item => item.status === 'Operativa').length;
  }

  get attention(): number {
    return this.data.maquinas.filter(item => item.status !== 'Operativa').length;
  }

  get items(): Maquina[] {
    const q = this.search.toLowerCase().trim();
    const rank: Record<Maquina['status'], number> = { 'Fuera de servicio': 0, Mantenimiento: 1, Operativa: 2 };
    return this.data.maquinas
      .filter(item => `${item.name} ${item.type} ${item.location}`.toLowerCase().includes(q))
      .sort((a, b) => rank[a.status] - rank[b.status]);
  }

  get isPreparingImages(): boolean {
    return this.imageReadsInProgress > 0;
  }

  get canDelete(): boolean {
    return this.auth.currentUser?.apiRole === 'ADMIN';
  }

  toggleStatus(item: Maquina): void {
    if (this.savingStatusIds.has(item.id)) {
      return;
    }

    const nextStatus: Maquina['status'] = item.status === 'Mantenimiento' ? 'Operativa' : 'Mantenimiento';
    const previousStatus = item.status;
    this.updateView(() => {
      item.status = nextStatus;
      this.savingStatusIds.add(item.id);
    });

    this.data.actualizarEstadoMaquina(item.id, nextStatus).pipe(
      timeout(this.requestTimeoutMs),
      finalize(() => this.updateView(() => this.savingStatusIds.delete(item.id)))
    ).subscribe({
      next: updated => {
        this.updateView(() => Object.assign(item, updated));
        this.showNotice(`${item.name}: estado actualizado.`);
      },
      error: () => {
        this.updateView(() => item.status = previousStatus);
        this.showNotice('No se pudo actualizar la maquina. Intenta otra vez.', 'error');
      }
    });
  }

  isStatusSaving(item: Maquina): boolean {
    return this.savingStatusIds.has(item.id);
  }

  remove(item: Maquina): void {
    if (!this.canDelete) {
      this.showNotice('Solo el administrador puede eliminar maquinas.', 'warning');
      return;
    }
    this.maquinaAEliminar = item;
  }

  cancelarEliminacion(): void {
    this.maquinaAEliminar = null;
  }

  closeCreate(): void {
    if (this.isCreating) {
      return;
    }
    this.showForm = false;
    this.formStep = 1;
    this.clearNewPreview();
  }

  confirmarEliminacion(): void {
    const item = this.maquinaAEliminar;
    if (!item) return;
    if (!this.canDelete) {
      this.maquinaAEliminar = null;
      this.showNotice('Solo el administrador puede eliminar maquinas.', 'warning');
      return;
    }

    this.data.eliminarMaquina(item.id).subscribe({
      next: () => {
        this.data.maquinas = this.data.maquinas.filter(current => current.id !== item.id);
        this.maquinaAEliminar = null;
        this.detail = null;
        this.detailItem = null;
        this.showNotice(`${item.name} eliminada del inventario.`);
      },
      error: () => {
        this.showNotice('No se pudo eliminar la maquina en el backend.', 'error');
      }
    });
  }

  showDetail(item: Maquina): void {
    this.detailItem = item;
    this.detail = {
      title: item.name,
      subtitle: item.type,
      status: item.status,
      photo: item.photo,
      fields: [
        { label: 'Tipo', value: item.type },
        { label: 'Ubicacion', value: item.location },
        { label: 'Proximo mantenimiento', value: item.nextMaintenance || 'Sin programar' }
      ]
    };
  }

  openEdit(item: Maquina): void {
    this.clearEditPreview();
    this.editingItemId = item.id;
    this.editItem = {
      name: item.name,
      type: item.type,
      location: item.location,
      status: item.status,
      nextMaintenance: this.toDateInputValue(item.maintenanceDate || item.nextMaintenance),
      photo: item.photo
    };
  }

  cancelEdit(): void {
    this.clearEditPreview();
    this.editingItemId = null;
  }

  saveEdit(): void {
    if (this.isSavingEdit) {
      return;
    }

    const item = this.data.maquinas.find(current => current.id === this.editingItemId);
    if (!item || !this.editItem.name.trim() || !this.editItem.type.trim()) {
      this.showNotice('Completa el nombre y tipo de equipo.', 'warning');
      return;
    }

    this.updateView(() => this.isSavingEdit = true);
    this.data.actualizarMaquina(item.id, {
      name: this.editItem.name.trim(),
      type: this.editItem.type.trim(),
      location: this.editItem.location.trim() || 'Sin ubicacion',
      status: this.editItem.status,
      nextMaintenance: this.editItem.nextMaintenance,
      photo: this.editItem.photo
    }).pipe(
      timeout(this.requestTimeoutMs),
      finalize(() => this.updateView(() => this.isSavingEdit = false))
    ).subscribe({
      next: updated => {
        this.updateView(() => {
          Object.assign(item, updated);
          this.clearEditPreview();
          this.editingItemId = null;
        });
        this.showNotice('Ficha de máquina actualizada correctamente.');
      },
      error: () => {
        this.showNotice('No se pudo actualizar la maquina. Intenta otra vez.', 'error');
      }
    });
  }

  handlePhoto(event: Event): void {
    this.readImageFile(event, 'newPhotoPreview', value => this.newItem = { ...this.newItem, photo: value });
  }

  handleEditPhoto(event: Event): void {
    this.readImageFile(event, 'editPhotoPreview', value => this.editItem = { ...this.editItem, photo: value });
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

    if (!this.newItem.name.trim() || !this.newItem.type.trim()) {
      this.showNotice('Completa el nombre y tipo de equipo.', 'warning');
      return;
    }

    this.updateView(() => this.isCreating = true);
    this.data.crearMaquina(this.newItem).pipe(
      timeout(this.requestTimeoutMs),
      finalize(() => this.updateView(() => this.isCreating = false))
    ).subscribe({
      next: created => {
        this.updateView(() => {
          this.data.maquinas.unshift(created);
          this.newItem = { name: '', type: '', location: '', status: 'Operativa', nextMaintenance: '', photo: '' };
          this.showForm = false;
          this.formStep = 1;
          this.clearNewPreview();
        });
        this.showNotice('Máquina agregada correctamente.');
      },
      error: () => {
        this.showNotice('No se pudo crear la maquina. Intenta otra vez.', 'error');
      }
    });
  }

  clearNotice(): void {
    this.clearNoticeTimer();
    this.updateView(() => this.notice = '');
  }

  private showNotice(message: string, type: 'success' | 'warning' | 'error' = 'success'): void {
    this.updateView(() => {
      this.notice = message;
      this.noticeType = type;
    });
    this.clearNoticeTimer();
    this.noticeTimer = setTimeout(() => {
      this.updateView(() => this.notice = '');
      this.noticeTimer = undefined;
    }, 3600);
  }

  private clearNoticeTimer(): void {
    if (!this.noticeTimer) {
      return;
    }
    clearTimeout(this.noticeTimer);
    this.noticeTimer = undefined;
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

  private clearNewPreview(): void {
    this.setPreview('newPhotoPreview', '');
  }

  private clearEditPreview(): void {
    this.setPreview('editPhotoPreview', '');
  }

  private clearImagePreviews(): void {
    this.clearNewPreview();
    this.clearEditPreview();
  }

  private toDateInputValue(value: string | undefined): string {
    if (!value) {
      return '';
    }

    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      return value.slice(0, 10);
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return '';
    }
    return parsed.toISOString().slice(0, 10);
  }
}
