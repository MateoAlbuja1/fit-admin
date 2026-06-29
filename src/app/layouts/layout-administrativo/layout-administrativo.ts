import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { MetaPagina } from '../../core/modelos/modelos-administracion';
import { AccionPaginaAdminService } from '../../core/servicios/accion-pagina-admin.service';
import { DatosGimnasioService } from '../../core/servicios/datos-gimnasio.service';

@Component({
  selector: 'app-layout-administrativo',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './layout-administrativo.html',
  styleUrl: './layout-administrativo.css',
  encapsulation: ViewEncapsulation.None
})
export class LayoutAdministrativoComponent implements OnInit, OnDestroy {
  drawerCollapsed = false;
  darkMode = true;
  showAlerts = false;
  alertasLeidas = false;
  meta: MetaPagina = { modulo: 'clientes', eyebrow: 'Administración', title: 'Clientes' };
  private navigationSub?: Subscription;

  constructor(
    private router: Router,
    public data: DatosGimnasioService,
    public pageActions: AccionPaginaAdminService
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
    this.pageActions.limpiar();
  }

  get unreadAlertCount(): number {
    return this.alertasLeidas ? 0 : this.data.alertas.length;
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
    this.alertasLeidas = true;
  }

  private updateMeta(): void {
    let snapshot = this.router.routerState.snapshot.root;
    while (snapshot.firstChild) snapshot = snapshot.firstChild;
    const meta = snapshot.data['meta'] as MetaPagina | undefined;
    if (meta) this.meta = meta;
  }
}
