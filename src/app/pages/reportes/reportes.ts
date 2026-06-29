import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatosGimnasioService } from '../../core/servicios/datos-gimnasio.service';

@Component({ selector: 'app-pagina-reportes', standalone: true, imports: [FormsModule], templateUrl: './reportes.html' })
export class PaginaReportesComponent {
  reportType = 'Resumen financiero'; from = '2026-06-01'; to = '2026-06-19'; ready = false; generatedAt = '';
  constructor(public data: DatosGimnasioService) {}
  get paidTotal(): number { return this.data.pagos.filter(item => item.status === 'Pagado').reduce((sum,item) => sum + item.amount,0); }
  get activeClients(): number { return this.data.clientes.filter(item => item.status === 'Activo').length; }
  generate(): void { this.ready = true; this.generatedAt = new Date().toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' }); }
  download(): void { const rows = [['Indicador','Valor'],['Ingresos',this.paidTotal.toFixed(2)],['Clientes activos',String(this.activeClients)],['Asistencias',String(this.data.asistencias.length + 128)],['Inventario',String(this.data.suplementos.length + this.data.maquinas.length)]]; const blob = new Blob([rows.map(row => row.join(',')).join('\n')], { type: 'text/csv' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'reporte-fit-admin.csv'; link.click(); URL.revokeObjectURL(link.href); }
}
