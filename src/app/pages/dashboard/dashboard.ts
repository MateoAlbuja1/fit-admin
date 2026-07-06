import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, of, switchMap } from 'rxjs';
import { DatosGimnasioService } from '../../core/servicios/datos-gimnasio.service';

type PeriodoDashboard = 'dia' | 'semana' | 'mes';
type UserRole = 'admin' | 'member';

interface ResultadoBusqueda {
  tipo: string;
  titulo: string;
  detalle: string;
  ruta: string;
}

interface ActividadDashboard {
  initials: string;
  title: string;
  detail: string;
  time: string;
}

interface DiaAsistencia {
  day: string;
  value: number;
  peak: string;
}

interface DashboardUser {
  role: UserRole;
  username: string;
  name: string;
  initials: string;
  subtitle: string;
}

interface DashboardSummary {
  clientesActivos?: number;
  membresiasActivas?: number;
  ventas?: number;
  pagosPendientes?: number;
  asistenciasHoy?: number;
  stockBajo?: number;
  maquinasOperativas?: number;
  alertas?: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  drawerCollapsed = false;
  showAlerts = false;
  alertsRead = false;
  darkMode = true;
  searchTerm = '';
  selectedPeriod: PeriodoDashboard = 'mes';
  selectedDay = 'Jue';
  lastUpdated = new Date();
  notice = '';
  dashboardSummary: DashboardSummary | null = null;
  dashboardSales: Array<Record<string, unknown>> = [];
  dashboardAttendance: Array<Record<string, unknown>> = [];
  dashboardMemberships: Array<Record<string, unknown>> = [];

  readonly adminUser: DashboardUser = {
    role: 'admin',
    username: 'admin',
    name: 'Mateo Admin',
    initials: 'MA',
    subtitle: 'Administrador'
  };

  readonly memberUser: DashboardUser = {
    role: 'member',
    username: 'miembro',
    name: 'Miembro',
    initials: 'M',
    subtitle: 'Miembro activo'
  };

  currentUser: DashboardUser = this.adminUser;

  readonly memberStats = {
    weight: 'Activo',
    goalWeight: 'Plan vigente',
    progress: 0,
    renewalDate: 'Pendiente',
    daysLeft: 0,
    plan: 'Sin plan',
    routine: 'Rutina pendiente',
    nextCheck: 'Sin evaluacion'
  };

  readonly periodOptions: Array<{ label: string; value: PeriodoDashboard }> = [
    { label: 'Hoy', value: 'dia' },
    { label: 'Semana', value: 'semana' },
    { label: 'Mes', value: 'mes' }
  ];

  readonly weekDays: DiaAsistencia[] = [
    { day: 'Lun', value: 64, peak: '18:00 — 20:00' },
    { day: 'Mar', value: 78, peak: '17:30 — 19:30' },
    { day: 'Mié', value: 58, peak: '19:00 — 21:00' },
    { day: 'Jue', value: 91, peak: '18:00 — 20:00' },
    { day: 'Vie', value: 72, peak: '18:30 — 20:30' },
    { day: 'Sáb', value: 52, peak: '09:00 — 11:00' },
    { day: 'Dom', value: 38, peak: '08:00 — 10:00' }
  ];

  constructor(
    public data: DatosGimnasioService,
    private router: Router
  ) {
    if (typeof localStorage !== 'undefined') {
      this.darkMode = localStorage.getItem('fitadmin-theme-v2') !== 'light';
    }
    this.currentUser = this.loadCurrentUser();
    if (this.currentUser.role === 'member') {
      this.router.navigate(['/']);
      return;
    }
    this.selectedDay = this.weekDays[this.weekDays.length - 4]?.day ?? 'Jue';
  }

  ngOnInit(): void {
    if (!this.isMember) {
      this.loadDashboardData();
    }
  }

  get isMember(): boolean {
    return this.currentUser.role === 'member';
  }

  get topbarEyebrow(): string {
    return this.isMember ? 'Panel de miembro' : 'Panel administrativo';
  }

  get topbarTitle(): string {
    return this.isMember ? 'Mi progreso' : 'Dashboard';
  }

  get welcomeTitle(): string {
    return this.isMember ? `Bienvenido, ${this.currentUser.name}` : 'Buenos dias, Mateo';
  }

  get welcomeSubtitle(): string {
    return this.isMember
      ? 'Tu resumen de entrenamiento, progreso y membresia.'
      : 'Rendimiento operativo de GX GYM en tiempo real.';
  }

  get alerts() {
    return this.data.alertas;
  }

  get unreadAlertCount(): number {
    return this.alertsRead ? 0 : this.alerts.length;
  }

  get paidIncome(): number {
    return this.data.pagos
      .filter(payment => payment.status === 'Pagado')
      .reduce((sum, payment) => sum + payment.amount, 0);
  }

  get monthlyIncome(): number {
    return this.dashboardSummary?.ventas ?? this.paidIncome;
  }

  get selectedRevenueTotal(): number {
    if (this.selectedPeriod === 'dia') return Math.round(this.monthlyIncome / 30);
    if (this.selectedPeriod === 'semana') return Math.round(this.monthlyIncome / 4);
    return this.monthlyIncome;
  }

  get previousRevenueTotal(): number {
    return Math.round(this.selectedRevenueTotal * 0.889);
  }

  get revenueGrowth(): number {
    if (!this.previousRevenueTotal) return 0;
    return ((this.selectedRevenueTotal - this.previousRevenueTotal) / this.previousRevenueTotal) * 100;
  }

  get activeMemberships(): number {
    return this.dashboardSummary?.membresiasActivas ?? this.data.membresias.filter(item => item.status !== 'Vencida').length;
  }

  get membershipCapacity(): number {
    return Math.min(100, Math.round((this.activeMemberships / 600) * 100));
  }

  get attendanceToday(): number {
    return this.dashboardSummary?.asistenciasHoy ?? this.data.asistencias.length;
  }

  get supplementRevenue(): number {
    const supplementPayments = this.data.pagos
      .filter(payment => !payment.concept.toLowerCase().includes('membres'))
      .reduce((sum, payment) => sum + payment.amount, 0);
    return 2801 + supplementPayments;
  }

  get quickStats() {
    return {
      clientesActivos: this.dashboardSummary?.clientesActivos ?? this.data.clientes.filter(client => client.status === 'Activo').length,
      pagosPendientes: this.dashboardSummary?.pagosPendientes ?? this.data.pagos.filter(payment => payment.status === 'Pendiente').length,
      stockBajo: this.dashboardSummary?.stockBajo ?? this.data.suplementos.filter(item => item.stock <= item.minStock).length,
      maquinasAtencion: this.dashboardSummary?.maquinasOperativas === undefined
        ? this.data.maquinas.filter(item => item.status !== 'Operativa').length
        : Math.max(0, this.data.maquinas.length - this.dashboardSummary.maquinasOperativas)
    };
  }

  get membershipDistribution() {
    const plans = this.dashboardMemberships.length
      ? this.membershipCountsFromBackend()
      : {
          Mensual: this.data.membresias.filter(item => item.plan === 'Mensual' && item.status !== 'Vencida').length,
          Trimestral: this.data.membresias.filter(item => item.plan === 'Trimestral' && item.status !== 'Vencida').length,
          Anual: this.data.membresias.filter(item => item.plan === 'Anual' && item.status !== 'Vencida').length
        };
    const total = plans.Mensual + plans.Trimestral + plans.Anual;
    const divisor = Math.max(total, 1);
    return [
      { label: 'Plan mensual', value: plans.Mensual, percent: Math.round((plans.Mensual / divisor) * 100), className: 'dot--black' },
      { label: 'Plan trimestral', value: plans.Trimestral, percent: Math.round((plans.Trimestral / divisor) * 100), className: 'dot--gray' },
      { label: 'Plan anual', value: plans.Anual, percent: Math.round((plans.Anual / divisor) * 100), className: 'dot--light' }
    ];
  }

  get membershipDonutStyle(): string {
    const [monthly, quarterly] = this.membershipDistribution;
    const secondStop = monthly.percent + quarterly.percent;
    return `conic-gradient(var(--accent) 0 ${monthly.percent}%, #4e4e4e ${monthly.percent}% ${secondStop}%, #d7d7d7 ${secondStop}% 100%)`;
  }

  get selectedDayData(): DiaAsistencia {
    return this.weekDays.find(item => item.day === this.selectedDay) ?? this.weekDays[0];
  }

  get weeklyAttendance(): number {
    if (this.dashboardAttendance.length) {
      return this.dashboardAttendance.slice(0, 7).reduce((sum, item) => sum + this.numberValue(item['count']), 0);
    }
    return this.weekDays.reduce((sum, item) => sum + item.value, 0) + this.data.asistencias.length;
  }

  get products() {
    return this.data.suplementos
      .map(item => {
        const sold = Math.max(3, Math.round((item.minStock + 26 - item.stock) / 2));
        return {
          name: item.name,
          category: item.category,
          units: sold,
          amount: sold * item.price
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);
  }

  get activities(): ActividadDashboard[] {
    const payments = this.data.pagos.slice(0, 2).map(payment => ({
      initials: this.initials(payment.member),
      title: payment.status === 'Pagado' ? 'Pago recibido' : 'Pago pendiente',
      detail: `${payment.member} · ${this.formatCurrency(payment.amount)}`,
      time: payment.date
    }));
    const attendance = this.data.asistencias.slice(0, 2).map(record => ({
      initials: this.initials(record.member),
      title: 'Ingreso al gimnasio',
      detail: `${record.member} · ${record.access}`,
      time: record.time
    }));
    const stock = this.data.suplementos
      .filter(item => item.stock <= item.minStock)
      .slice(0, 1)
      .map(item => ({
        initials: 'ST',
        title: 'Stock bajo detectado',
        detail: `${item.name} · ${item.stock} unidades`,
        time: 'Ahora'
      }));
    return [...payments, ...attendance, ...stock].slice(0, 5);
  }

  get searchResults(): ResultadoBusqueda[] {
    const q = this.searchTerm.trim().toLowerCase();
    if (q.length < 2) return [];
    const results: ResultadoBusqueda[] = [];

    this.data.clientes.forEach(client => {
      if (`${client.name} ${client.document} ${client.plan}`.toLowerCase().includes(q)) {
        results.push({ tipo: 'Cliente', titulo: client.name, detalle: `${client.plan} · ${client.status}`, ruta: '/clientes' });
      }
    });
    this.data.membresias.forEach(membership => {
      if (`${membership.member} ${membership.plan} ${membership.status}`.toLowerCase().includes(q)) {
        results.push({ tipo: 'Membresía', titulo: membership.member, detalle: `${membership.plan} · ${membership.status}`, ruta: '/membresias' });
      }
    });
    this.data.suplementos.forEach(product => {
      if (`${product.name} ${product.category}`.toLowerCase().includes(q)) {
        results.push({ tipo: 'Suplemento', titulo: product.name, detalle: `${product.stock} unidades · ${product.category}`, ruta: '/inventario/suplementos' });
      }
    });
    this.data.maquinas.forEach(machine => {
      if (`${machine.name} ${machine.type} ${machine.location}`.toLowerCase().includes(q)) {
        results.push({ tipo: 'Máquina', titulo: machine.name, detalle: `${machine.status} · ${machine.location}`, ruta: '/inventario/maquinas' });
      }
    });

    return results.slice(0, 6);
  }

  get chartBars() {
    const series = this.revenueSeries();
    const max = Math.max(...series.current, ...series.previous, 1);
    return series.labels.map((label, index) => ({
      label,
      current: Math.round((series.current[index] / max) * 100),
      previous: Math.round((series.previous[index] / max) * 100),
      amount: series.current[index]
    }));
  }

  get periodLabel(): string {
    return this.periodOptions.find(item => item.value === this.selectedPeriod)?.label ?? 'Mes';
  }

  get currentDay(): string {
    return new Date().toLocaleDateString('es-EC', { day: '2-digit' });
  }

  get currentMonth(): string {
    return new Date().toLocaleDateString('es-EC', { month: 'short' }).replace('.', '').toUpperCase();
  }

  get currentYear(): number {
    return new Date().getFullYear();
  }

  get lastUpdatedText(): string {
    return this.lastUpdated.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
  }

  toggleDrawer(): void {
    this.drawerCollapsed = !this.drawerCollapsed;
  }

  toggleAlerts(): void {
    this.showAlerts = !this.showAlerts;
  }

  toggleTheme(): void {
    this.darkMode = !this.darkMode;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('fitadmin-theme-v2', this.darkMode ? 'dark' : 'light');
    }
  }

  closeAlerts(): void {
    this.showAlerts = false;
  }

  markAlertsRead(): void {
    this.alertsRead = true;
  }

  logout(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('fitadmin-session');
      localStorage.removeItem('fitadmin-auth');
      localStorage.removeItem('fitadmin-token');
      localStorage.removeItem('fitadmin-admin-session');
    }

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('fitadmin-session');
      sessionStorage.removeItem('fitadmin-auth');
      sessionStorage.removeItem('fitadmin-token');
      sessionStorage.removeItem('fitadmin-admin-session');
    }

    this.router.navigate(['/login']);
  }

  setPeriod(period: PeriodoDashboard): void {
    this.selectedPeriod = period;
    this.refreshDashboard(`Vista actualizada: ${this.periodLabel.toLowerCase()}.`);
  }

  selectDay(day: string): void {
    this.selectedDay = day;
  }

  goTo(route: string): void {
    this.router.navigateByUrl(route);
  }

  openFirstSearchResult(): void {
    if (this.isMember) return;
    const [first] = this.searchResults;
    if (first) this.goTo(first.ruta);
  }

  quickCheckIn(): void {
    const client = this.data.clientes.find(item => item.status === 'Activo');
    if (!client) {
      this.notice = 'No hay clientes activos para registrar asistencia rapida.';
      return;
    }

    this.data.registrarAsistencia(client.document || String(client.id)).subscribe({
      next: record => {
        this.data.asistencias.unshift(record);
        this.loadDashboardData();
        this.refreshDashboard(`Asistencia registrada para ${record.member}.`);
      },
      error: () => {
        this.notice = 'No se pudo registrar la asistencia rapida en el backend.';
      }
    });
  }

  quickSale(): void {
    const product = this.data.suplementos.find(item => item.stock > 0);
    if (!product) {
      this.notice = 'No hay suplementos disponibles para vender.';
      return;
    }

    this.data.actualizarStockSuplemento(product.id, -1).pipe(
      switchMap(updatedProduct => {
        Object.assign(product, updatedProduct);
        return this.data.crearPago({
          member: 'Venta mostrador',
          concept: product.name,
          method: 'Efectivo',
          amount: product.price,
          status: 'Pagado'
        });
      })
    ).subscribe({
      next: payment => {
        this.data.pagos.unshift(payment);
        this.alertsRead = false;
        this.loadDashboardData();
        this.refreshDashboard(`Venta rapida registrada: ${product.name}.`);
      },
      error: () => {
        this.notice = 'No se pudo registrar la venta rapida en el backend.';
      }
    });
  }

  refreshDashboard(message = 'Dashboard actualizado con los datos más recientes.'): void {
    this.lastUpdated = new Date();
    this.notice = message;
    window.setTimeout(() => {
      if (this.notice === message) this.notice = '';
    }, 3200);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  }

  private loadDashboardData(): void {
    forkJoin({
      summary: this.data.obtenerResumenDashboard().pipe(catchError(() => of(null))),
      sales: this.data.obtenerDashboardVentas().pipe(catchError(() => of([]))),
      attendance: this.data.obtenerDashboardAsistencia().pipe(catchError(() => of([]))),
      memberships: this.data.obtenerDashboardMembresias().pipe(catchError(() => of([])))
    }).subscribe(result => {
      this.dashboardSummary = result.summary as DashboardSummary | null;
      this.dashboardSales = result.sales;
      this.dashboardAttendance = result.attendance;
      this.dashboardMemberships = result.memberships;
      this.lastUpdated = new Date();
    });
  }

  private membershipCountsFromBackend(): { Mensual: number; Trimestral: number; Anual: number } {
    const counts = { Mensual: 0, Trimestral: 0, Anual: 0 };
    this.dashboardMemberships.forEach(item => {
      const plan = String(item['plan'] || '').toLowerCase();
      const count = this.numberValue(item['count']);
      if (plan.includes('mensual')) counts.Mensual += count;
      if (plan.includes('trimestral')) counts.Trimestral += count;
      if (plan.includes('anual')) counts.Anual += count;
    });
    return counts;
  }

  private revenueSeries() {
    const backendSeries = this.backendRevenueSeries();
    if (backendSeries) {
      return backendSeries;
    }

    if (this.selectedPeriod === 'dia') {
      return {
        labels: ['06h', '09h', '12h', '15h', '18h', '21h'],
        current: [90, 145, 210, 260, Math.round(this.selectedRevenueTotal * 0.72), this.selectedRevenueTotal],
        previous: [76, 120, 170, 218, Math.round(this.previousRevenueTotal * 0.7), this.previousRevenueTotal]
      };
    }
    if (this.selectedPeriod === 'semana') {
      return {
        labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
        current: [720, 860, 790, 1120, 980, this.selectedRevenueTotal],
        previous: [640, 740, 710, 920, 870, this.previousRevenueTotal]
      };
    }
    return {
      labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
      current: [11200, 12900, 14280, 15100, 16380, this.selectedRevenueTotal],
      previous: [9700, 11100, 12650, 13340, 14520, this.previousRevenueTotal]
    };
  }

  private backendRevenueSeries() {
    if (!this.dashboardSales.length) {
      return null;
    }

    const rows = [...this.dashboardSales]
      .reverse()
      .slice(-6)
      .map(item => ({
        label: this.shortSeriesLabel(item['label'] ?? item['date']),
        total: this.numberValue(item['total'])
      }));

    if (!rows.length) {
      return null;
    }

    return {
      labels: rows.map(item => item.label),
      current: rows.map(item => item.total),
      previous: rows.map(item => Math.round(item.total * 0.889))
    };
  }

  private numberValue(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private shortSeriesLabel(value: unknown): string {
    const text = String(value || '');
    if (!text) return 'Dia';
    const date = new Date(text);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short' }).replace('.', '');
    }
    return text.slice(0, 6);
  }

  private initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('');
  }

  private loadCurrentUser(): DashboardUser {
    const session = this.readSession();

    if (session?.role === 'member') {
      return {
        ...this.memberUser,
        name: this.safeText(session.name, this.memberUser.name),
        initials: this.safeText(session.initials, this.memberUser.initials),
        subtitle: this.safeText(session.subtitle, this.memberUser.subtitle),
        username: this.safeText(session.username, this.memberUser.username)
      };
    }

    if (session?.role === 'admin') {
      return {
        ...this.adminUser,
        name: this.safeText(session.name, this.adminUser.name),
        initials: this.safeText(session.initials, this.adminUser.initials),
        subtitle: this.safeText(session.subtitle, this.adminUser.subtitle),
        username: this.safeText(session.username, this.adminUser.username)
      };
    }

    return this.adminUser;
  }

  private readSession(): Partial<DashboardUser> | null {
    const raw = this.readStorage('local') ?? this.readStorage('session');
    if (!raw) return null;

    try {
      return JSON.parse(raw) as Partial<DashboardUser>;
    } catch {
      return null;
    }
  }

  private readStorage(type: 'local' | 'session'): string | null {
    if (type === 'local' && typeof localStorage !== 'undefined') {
      return localStorage.getItem('fitadmin-session');
    }
    if (type === 'session' && typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem('fitadmin-session');
    }
    return null;
  }

  private safeText(value: unknown, fallback: string): string {
    return typeof value === 'string' && value.trim() ? value : fallback;
  }
}
