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
  noticeType: 'success' | 'warning' | 'error' = 'success';
  reportId = '';
  reportMetrics: ReportMetric[] = [];
  reportData: Record<string, unknown> = {};
  private readonly apiUrl = apiBaseUrl();
  private reportAbort?: AbortController;
  private generationTimer?: ReturnType<typeof setTimeout>;
  private noticeTimer?: ReturnType<typeof setTimeout>;

  constructor(public data: DatosGimnasioService, private cdr: ChangeDetectorRef) {}

  ngOnDestroy(): void {
    this.reportAbort?.abort();
    this.clearGenerationTimer();
    this.clearNoticeTimer();
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

    this.clearNotice();

    if (this.from && this.to && this.from > this.to) {
      this.showNotice('La fecha inicial no puede ser mayor que la fecha final.', 'warning');
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
      this.reportData = (report['data'] || {}) as Record<string, unknown>;
      this.reportMetrics = this.buildMetrics(this.reportData);
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

  downloadSummary(): void {
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
    this.downloadBlob(blob, `resumen-${this.reportCode()}-fit-admin.csv`);
  }

  downloadDetailedCsv(): void {
    const rows = this.reportRows();
    if (!rows.length) {
      this.showNotice('Este reporte no tiene filas detalladas para exportar.', 'warning');
      return;
    }

    const headers = Array.from(new Set(rows.flatMap(row => Object.keys(row))));
    const csvRows = [
      ['Reporte', this.reportType],
      ['Desde', this.from],
      ['Hasta', this.to],
      ['Generado', this.generatedAt],
      [],
      headers,
      ...rows.map(row => headers.map(header => row[header] ?? ''))
    ];
    const blob = new Blob([csvRows.map(row => row.map(cell => this.csvCell(cell)).join(',')).join('\n')], { type: 'text/csv' });
    this.downloadBlob(blob, `detalle-${this.reportCode()}-fit-admin.csv`);
  }

  downloadJson(): void {
    if (!Object.keys(this.reportData).length) {
      return;
    }

    const blob = new Blob([JSON.stringify({
      reportType: this.reportType,
      from: this.from,
      to: this.to,
      generatedAt: this.generatedAt,
      id: this.reportId,
      data: this.reportData
    }, null, 2)], { type: 'application/json' });
    this.downloadBlob(blob, `reporte-${this.reportCode()}-fit-admin.json`);
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
    const lowStockCount = lowStock.length || this.numberValue(data['lowStock']);
    if (lowStockCount) metrics.push({ label: 'Stock bajo', value: String(lowStockCount), numeric: lowStockCount });
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

  private reportRows(): Array<Record<string, unknown>> {
    const rows = this.asRows(this.reportData['rows']);
    if (rows.length) {
      return rows;
    }

    const possibleRows = ['totals', 'byStatus', 'byPlan', 'byDate', 'supplements', 'machines', 'lowStock'];
    return possibleRows.flatMap(key => this.asRows(this.reportData[key]).map(row => ({ seccion: key, ...row })));
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

  private downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
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
      this.showNotice('El reporte esta tardando demasiado. Verifica el backend e intenta de nuevo.', 'error');
      this.reportAbort?.abort();
      this.generationTimer = undefined;
      this.cdr.detectChanges();
    }, 14000);
  }

  private finishGenerating(message = ''): void {
    this.isGenerating = false;
    this.clearGenerationTimer();
    if (message) {
      this.showNotice(message, 'error');
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

  private showNotice(message: string, type: 'success' | 'warning' | 'error' = 'success'): void {
    this.notice = message;
    this.noticeType = type;
    this.clearNoticeTimer();
    this.noticeTimer = setTimeout(() => {
      this.notice = '';
      this.noticeTimer = undefined;
      this.cdr.detectChanges();
    }, 4200);
    this.cdr.detectChanges();
  }

  private clearNotice(): void {
    this.notice = '';
    this.clearNoticeTimer();
  }

  private clearNoticeTimer(): void {
    if (!this.noticeTimer) {
      return;
    }
    clearTimeout(this.noticeTimer);
    this.noticeTimer = undefined;
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
