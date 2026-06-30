import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DatosGimnasioService } from '../../core/servicios/datos-gimnasio.service';

type PeriodoDashboard = 'dia' | 'semana' | 'mes';

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

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent {
  drawerCollapsed = false;
  showAlerts = false;
  alertsRead = false;
  darkMode = true;
  searchTerm = '';
  selectedPeriod: PeriodoDashboard = 'mes';
  selectedDay = 'Jue';
  lastUpdated = new Date();
  notice = '';

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

  private readonly monthlyBaseIncome = 18255;
  private readonly membershipBase = { Mensual: 236, Trimestral: 145, Anual: 101 };

  constructor(
    public data: DatosGimnasioService,
    private router: Router
  ) {
    if (typeof localStorage !== 'undefined') {
      this.darkMode = localStorage.getItem('fitadmin-theme-v2') !== 'light';
    }
    this.selectedDay = this.weekDays[this.weekDays.length - 4]?.day ?? 'Jue';
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
    return this.monthlyBaseIncome + this.paidIncome;
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
    const activeFromData = this.data.membresias.filter(item => item.status !== 'Vencida').length;
    return 483 + activeFromData;
  }

  get membershipCapacity(): number {
    return Math.min(100, Math.round((this.activeMemberships / 600) * 100));
  }

  get attendanceToday(): number {
    return 128 + this.data.asistencias.length;
  }

  get supplementRevenue(): number {
    const supplementPayments = this.data.pagos
      .filter(payment => !payment.concept.toLowerCase().includes('membres'))
      .reduce((sum, payment) => sum + payment.amount, 0);
    return 2801 + supplementPayments;
  }

  get quickStats() {
    return {
      clientesActivos: this.data.clientes.filter(client => client.status === 'Activo').length,
      pagosPendientes: this.data.pagos.filter(payment => payment.status === 'Pendiente').length,
      stockBajo: this.data.suplementos.filter(item => item.stock <= item.minStock).length,
      maquinasAtencion: this.data.maquinas.filter(item => item.status !== 'Operativa').length
    };
  }

  get membershipDistribution() {
    const plans = {
      Mensual: this.membershipBase.Mensual + this.data.membresias.filter(item => item.plan === 'Mensual' && item.status !== 'Vencida').length,
      Trimestral: this.membershipBase.Trimestral + this.data.membresias.filter(item => item.plan === 'Trimestral' && item.status !== 'Vencida').length,
      Anual: this.membershipBase.Anual + this.data.membresias.filter(item => item.plan === 'Anual' && item.status !== 'Vencida').length
    };
    const total = plans.Mensual + plans.Trimestral + plans.Anual;
    return [
      { label: 'Plan mensual', value: plans.Mensual, percent: Math.round((plans.Mensual / total) * 100), className: 'dot--black' },
      { label: 'Plan trimestral', value: plans.Trimestral, percent: Math.round((plans.Trimestral / total) * 100), className: 'dot--gray' },
      { label: 'Plan anual', value: plans.Anual, percent: Math.round((plans.Anual / total) * 100), className: 'dot--light' }
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
      localStorage.removeItem('fitadmin-admin-session');
    }

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('fitadmin-session');
      sessionStorage.removeItem('fitadmin-auth');
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
    const [first] = this.searchResults;
    if (first) this.goTo(first.ruta);
  }

  quickCheckIn(): void {
    const member = this.data.membresias.find(item => item.status !== 'Vencida')?.member ?? 'Cliente invitado';
    const now = new Date();
    this.data.asistencias.unshift({
      id: Date.now(),
      member,
      time: now.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
      access: 'Acceso principal',
      status: 'Ingreso correcto'
    });
    this.refreshDashboard(`Asistencia registrada para ${member}.`);
  }

  quickSale(): void {
    const product = this.data.suplementos.find(item => item.stock > 0);
    if (!product) {
      this.notice = 'No hay suplementos disponibles para vender.';
      return;
    }

    product.stock -= 1;
    this.data.pagos.unshift({
      id: Date.now(),
      member: 'Venta mostrador',
      concept: product.name,
      method: 'Efectivo',
      date: this.todayShort(),
      amount: product.price,
      status: 'Pagado'
    });
    this.alertsRead = false;
    this.refreshDashboard(`Venta rápida registrada: ${product.name}.`);
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

  private revenueSeries() {
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

  private initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('');
  }

  private todayShort(): string {
    return new Date().toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '');
  }
}
