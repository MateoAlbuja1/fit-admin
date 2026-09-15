import { ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { apiBaseUrl } from '../../core/config/api.config';
import { DatosGimnasioService } from '../../core/servicios/datos-gimnasio.service';

interface ReportMetric {
  label: string;
  value: string;
  numeric: number;
}

@Component({ selector: 'app-pagina-reportes', standalone: true, imports: [FormsModule], templateUrl: './reportes.html' })
export class PaginaReportesComponent implements OnDestroy {
  reportType = 'Resumen financiero';
  from = '2026-06-01';
  to = '2026-07-04';
  ready = false;
  isGenerating = false;
  generatedAt = '';
  notice = '';
  reportId = '';
  reportMetrics: ReportMetric[] = [];
  private readonly apiUrl = apiBaseUrl();
  private reportAbort?: AbortController;
  private generationTimer?: ReturnType<typeof setTimeout>;

  constructor(public data: DatosGimnasioService, private cdr: ChangeDetectorRef) {}

  ngOnDestroy(): void {
    this.reportAbort?.abort();
    this.clearGenerationTimer();
  }

  get bars(): number[] {
    const values = this.reportMetrics.map(item => item.numeric).filter(value => value > 0);
    const max = Math.max(...values, 1);
    const normalized = values.slice(0, 6).map(value => Math.max(12, Math.round((value / max) * 88)));
    return normalized.length ? normalized : [48, 62, 55, 78, 69, 88];
  }

  async generate(): Promise<void> {
    if (this.isGenerating) {
      return;
    }

    this.notice = '';

    if (this.from && this.to && this.from > this.to) {
      this.notice = 'La fecha inicial no puede ser mayor que la fecha final.';
      return;
    }

    this.isGenerating = true;
    const controller = new AbortController();
    this.reportAbort = controller;
    this.armGenerationTimer();

    try {
      const response = await fetch(`${this.apiUrl}/reports/generate`, {
        method: 'POST',
        headers: this.reportHeaders(),
        body: JSON.stringify({
          type: this.reportCode(),
          from: this.from,
          to: this.to,
          generatedBy: 'fit-admin-dashboard'
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Report request failed: ${response.status}`);
      }

      const report = await response.json() as Record<string, unknown>;
      this.finishGenerating();
      this.ready = true;
      this.reportId = String(report['id'] || '');
      this.generatedAt = this.formatDateTime(report['createdAt']);
      this.reportMetrics = this.buildMetrics((report['data'] || {}) as Record<string, unknown>);
      this.cdr.detectChanges();
    } catch {
      if (this.isGenerating) {
        this.finishGenerating('No se pudo generar el reporte. Revisa que el backend este activo e intenta otra vez.');
      }
    } finally {
      if (this.reportAbort === controller) {
        this.reportAbort = undefined;
      }
    }
  }

  download(): void {
    if (!this.reportMetrics.length) {
      return;
    }

    const rows = [
      ['Reporte', this.reportType],
      ['Desde', this.from],
      ['Hasta', this.to],
      ['Generado', this.generatedAt],
      ['ID', this.reportId],
      [],
      ['Indicador', 'Valor'],
      ...this.reportMetrics.map(item => [item.label, item.value])
    ];
    const blob = new Blob([rows.map(row => row.map(cell => this.csvCell(cell)).join(',')).join('\n')], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reporte-${this.reportCode()}-fit-admin.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  private reportCode(): string {
    const value = this.normalize(this.reportType);
    if (value.includes('cliente') || value.includes('membres')) return 'memberships';
    if (value.includes('asistencia')) return 'attendance';
    if (value.includes('inventario')) return 'inventory';
    if (value.includes('venta')) return 'sales';
    return 'summary';
  }

  private buildMetrics(data: Record<string, unknown>): ReportMetric[] {
    const totals = this.asRows(data['totals']);
    const byDate = this.asRows(data['byDate']);
    const byPlan = this.asRows(data['byPlan']);
    const byStatus = this.asRows(data['byStatus']);
    const supplements = this.asRows(data['supplements']);
    const machines = this.asRows(data['machines']);
    const lowStock = this.asRows(data['lowStock']);

    const paidTotal = this.numberValue(data['paidTotal'] ?? data['total'] ?? totals.reduce((sum, row) => sum + this.numberValue(row['total']), 0));
    const activeClients = this.numberValue(data['activeClients']);
    const attendanceTotal = this.numberValue(data['attendanceTotal'] ?? byDate.reduce((sum, row) => sum + this.numberValue(row['count']), 0));
    const memberships = byPlan.reduce((sum, row) => sum + this.numberValue(row['count']), 0);
    const inventoryTotal = supplements.length + machines.length;
    const pendingTotal = byStatus.reduce((sum, row) => sum + this.numberValue(row['count']), 0);

    const metrics: ReportMetric[] = [];
    if (paidTotal) metrics.push({ label: 'Ingresos', value: this.currency(paidTotal), numeric: paidTotal });
    if (activeClients) metrics.push({ label: 'Clientes activos', value: String(activeClients), numeric: activeClients });
    if (memberships) metrics.push({ label: 'Membresias', value: String(memberships), numeric: memberships });
    if (attendanceTotal) metrics.push({ label: 'Asistencias', value: String(attendanceTotal), numeric: attendanceTotal });
    if (inventoryTotal) metrics.push({ label: 'Inventario', value: `${inventoryTotal} items`, numeric: inventoryTotal });
    if (lowStock.length) metrics.push({ label: 'Stock bajo', value: String(lowStock.length), numeric: lowStock.length });
    if (pendingTotal) metrics.push({ label: 'Pagos por estado', value: String(pendingTotal), numeric: pendingTotal });

    return metrics.length ? metrics : [
      { label: 'Clientes activos', value: String(this.data.clientes.filter(item => item.status === 'Activo').length), numeric: this.data.clientes.length },
      { label: 'Pagos registrados', value: String(this.data.pagos.length), numeric: this.data.pagos.length },
      { label: 'Asistencias', value: String(this.data.asistencias.length), numeric: this.data.asistencias.length },
      { label: 'Inventario', value: String(this.data.suplementos.length + this.data.maquinas.length), numeric: this.data.suplementos.length + this.data.maquinas.length }
    ];
  }

  private asRows(value: unknown): Array<Record<string, unknown>> {
    return Array.isArray(value) ? value.filter(item => item && typeof item === 'object') as Array<Record<string, unknown>> : [];
  }

  private numberValue(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private currency(value: number): string {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(value);
  }

  private formatDateTime(value: unknown): string {
    const date = value ? new Date(String(value)) : new Date();
    return date.toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' });
  }

  private csvCell(value: unknown): string {
    const text = String(value ?? '');
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  private normalize(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  private armGenerationTimer(): void {
    this.clearGenerationTimer();
    this.generationTimer = setTimeout(() => {
      if (!this.isGenerating) {
        return;
      }
      this.isGenerating = false;
      this.notice = 'El reporte esta tardando demasiado. Verifica el backend e intenta de nuevo.';
      this.reportAbort?.abort();
      this.generationTimer = undefined;
      this.cdr.detectChanges();
    }, 14000);
  }

  private finishGenerating(message = ''): void {
    this.isGenerating = false;
    this.clearGenerationTimer();
    if (message) {
      this.notice = message;
    }
    this.cdr.detectChanges();
  }

  private clearGenerationTimer(): void {
    if (!this.generationTimer) {
      return;
    }
    clearTimeout(this.generationTimer);
    this.generationTimer = undefined;
  }

  private reportHeaders(): HeadersInit {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    const token = this.readToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private readToken(): string | null {
    if (typeof localStorage !== 'undefined') {
      const token = localStorage.getItem('fitadmin-token');
      if (token) return token;
    }
    return typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('fitadmin-token') : null;
  }
}
