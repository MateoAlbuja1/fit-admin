import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent {
  drawerCollapsed = false;
  showAlerts = false;
  alertsRead = false;
  darkMode = true;

  readonly alerts = [
    { type: 'warning', title: 'Vence pronto · Carlos Mendoza', detail: '16 días restantes · vence el 04 Jul 2026', route: '/membresias' },
    { type: 'danger', title: 'Membresía vencida · José Rivera', detail: 'Venció el 12 May 2026', route: '/membresias' },
    { type: 'stock', title: 'Stock bajo · Pre-entreno', detail: '5 unidades disponibles · mínimo 7', route: '/inventario/suplementos' },
    { type: 'stock', title: 'Stock bajo · Multivitamínico', detail: '4 unidades disponibles · mínimo 6', route: '/inventario/suplementos' }
  ];

  constructor() {
    if (typeof localStorage !== 'undefined') {
      this.darkMode = localStorage.getItem('fitadmin-theme-v2') !== 'light';
    }
  }

  get unreadAlertCount(): number {
    return this.alertsRead ? 0 : this.alerts.length;
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

  readonly weekDays = [
    { day: 'Lun', value: 64 },
    { day: 'Mar', value: 78 },
    { day: 'Mié', value: 58 },
    { day: 'Jue', value: 91 },
    { day: 'Vie', value: 72 },
    { day: 'Sáb', value: 52 },
    { day: 'Dom', value: 38 }
  ];

  readonly activities = [
    { initials: 'CM', title: 'Nueva membresía registrada', detail: 'Carlos Mendoza · Plan anual', time: 'Hace 8 min' },
    { initials: 'AP', title: 'Pago recibido', detail: 'Andrea Pérez · $35,00', time: 'Hace 24 min' },
    { initials: 'JR', title: 'Ingreso al gimnasio', detail: 'José Rivera · Acceso principal', time: 'Hace 41 min' },
    { initials: 'MS', title: 'Venta de suplemento', detail: 'María Silva · Whey Protein', time: 'Hace 1 h' }
  ];

  readonly products = [
    { name: 'Whey Protein', category: 'Proteína', units: 24, amount: '$1.080' },
    { name: 'Creatina 300 g', category: 'Rendimiento', units: 18, amount: '$522' },
    { name: 'Pre-entreno', category: 'Energía', units: 12, amount: '$384' }
  ];
}
