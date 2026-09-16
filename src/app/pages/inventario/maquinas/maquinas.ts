import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { DetalleRegistro, Maquina } from '../../../core/modelos/modelos-administracion';
import { AccionPaginaAdminService } from '../../../core/servicios/accion-pagina-admin.service';
import { DatosGimnasioService } from '../../../core/servicios/datos-gimnasio.service';

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
  private noticeTimer?: ReturnType<typeof setTimeout>;
  private readonly requestTimeoutMs = 12000;
  newItem = { name: '', type: '', location: '', status: 'Operativa' as Maquina['status'], nextMaintenance: '', photo: '' };
  editItem = { name: '', type: '', location: '', status: 'Operativa' as Maquina['status'], nextMaintenance: '', photo: '' };

  constructor(
    public data: DatosGimnasioService,
    private actions: AccionPaginaAdminService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.actions.registrar('+ Nueva maquina', () => {
      this.formStep = 1;
      this.showForm = true;
    });
  }

  ngOnDestroy(): void {
    this.actions.limpiar();
    this.clearNoticeTimer();
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
    this.maquinaAEliminar = item;
  }

  cancelarEliminacion(): void {
    this.maquinaAEliminar = null;
  }

  confirmarEliminacion(): void {
    const item = this.maquinaAEliminar;
    if (!item) return;

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
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || file.size > 4 * 1024 * 1024) {
      this.showNotice('Selecciona una imagen menor a 4 MB.', 'warning');
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => this.updateView(() => {
      this.newItem.photo = String(reader.result);
      input.value = '';
    });
    reader.onerror = () => this.showNotice('No se pudo cargar la imagen.', 'error');
    reader.readAsDataURL(file);
  }

  handleEditPhoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || file.size > 4 * 1024 * 1024) {
      this.showNotice('Selecciona una imagen menor a 4 MB.', 'warning');
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => this.updateView(() => {
      this.editItem.photo = String(reader.result);
      input.value = '';
    });
    reader.onerror = () => this.showNotice('No se pudo cargar la imagen.', 'error');
    reader.readAsDataURL(file);
  }

  add(): void {
    if (this.isCreating) {
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
