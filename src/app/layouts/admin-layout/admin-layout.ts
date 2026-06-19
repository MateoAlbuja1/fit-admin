import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { PageMeta } from '../../core/models/admin.models';
import { AdminPageActionService } from '../../core/services/admin-page-action.service';
import { GymDataService } from '../../core/services/gym-data.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
  encapsulation: ViewEncapsulation.None
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  drawerCollapsed = false;
  darkMode = true;
  showAlerts = false;
  alertsRead = false;
  meta: PageMeta = { module: 'clients', eyebrow: 'Administración', title: 'Clientes' };
  private navigationSub?: Subscription;

  constructor(
    private router: Router,
    public data: GymDataService,
    public pageActions: AdminPageActionService
  ) {
    if (typeof localStorage !== 'undefined') {
      this.darkMode = localStorage.getItem('fitadmin-theme-v2') !== 'light';
    }
  }

  ngOnInit(): void {
    this.updateMeta();
    this.navigationSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.showAlerts = false;
        this.updateMeta();
      });
  }

  ngOnDestroy(): void {
    this.navigationSub?.unsubscribe();
    this.pageActions.clear();
  }

  get unreadAlertCount(): number {
    return this.alertsRead ? 0 : this.data.alerts.length;
  }

  toggleDrawer(): void {
    this.drawerCollapsed = !this.drawerCollapsed;
  }

  toggleTheme(): void {
    this.darkMode = !this.darkMode;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('fitadmin-theme-v2', this.darkMode ? 'dark' : 'light');
    }
  }

  toggleAlerts(): void {
    this.showAlerts = !this.showAlerts;
  }

  markAlertsRead(): void {
    this.alertsRead = true;
  }

  private updateMeta(): void {
    let snapshot = this.router.routerState.snapshot.root;
    while (snapshot.firstChild) snapshot = snapshot.firstChild;
    const meta = snapshot.data['meta'] as PageMeta | undefined;
    if (meta) this.meta = meta;
  }
}
