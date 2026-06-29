import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DetalleRegistro, Maquina } from '../../../core/modelos/modelos-administracion';
import { AccionPaginaAdminService } from '../../../core/servicios/accion-pagina-admin.service';
import { DatosGimnasioService } from '../../../core/servicios/datos-gimnasio.service';

@Component({ selector: 'app-pagina-maquinas', standalone: true, imports: [FormsModule], templateUrl: './maquinas.html' })
export class PaginaMaquinasComponent implements OnInit, OnDestroy {
  search = '';
  view: 'grid' | 'list' = 'grid';
  notice = '';
  showForm = false;
  formStep = 1;
  detail: DetalleRegistro | null = null;
  maquinaAEliminar: Maquina | null = null;
  newItem = { name: '', type: '', location: '', status: 'Operativa' as Maquina['status'], nextMaintenance: '', photo: '' };

  constructor(public data: DatosGimnasioService, private actions: AccionPaginaAdminService) {}

  ngOnInit(): void {
    this.actions.registrar('+ Nueva máquina', () => {
      this.formStep = 1;
      this.showForm = true;
    });
  }

  ngOnDestroy(): void {
    this.actions.limpiar();
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
    item.status = item.status === 'Mantenimiento' ? 'Operativa' : 'Mantenimiento';
    this.notice = `${item.name}: estado actualizado.`;
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
    this.data.maquinas = this.data.maquinas.filter(current => current.id !== item.id);
    this.maquinaAEliminar = null;
    this.detail = null;
    this.notice = `${item.name} eliminada del inventario.`;
  }

  showDetail(item: Maquina): void {
    this.detail = {
      title: item.name,
      subtitle: item.type,
      status: item.status,
      photo: item.photo,
      fields: [
        { label: 'Tipo', value: item.type },
        { label: 'Ubicación', value: item.location },
        { label: 'Próximo mantenimiento', value: item.nextMaintenance || 'Sin programar' }
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

  add(): void {
    if (!this.newItem.name.trim() || !this.newItem.type.trim()) {
      this.notice = 'Completa el nombre y tipo de equipo.';
      return;
    }
    this.data.maquinas.unshift({ id: Date.now(), ...this.newItem });
    this.newItem = { name: '', type: '', location: '', status: 'Operativa', nextMaintenance: '', photo: '' };
    this.showForm = false;
    this.formStep = 1;
    this.notice = 'Máquina agregada correctamente.';
  }
}
