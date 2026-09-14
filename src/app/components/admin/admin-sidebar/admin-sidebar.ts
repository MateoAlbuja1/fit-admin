import { AsyncPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Observable } from 'rxjs';
import { ApiUserRole } from '../../../core/servicios/auth.service';

export interface AdminSidebarUser {
  initials: string;
  name: string;
  subtitle: string;
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [AsyncPipe, RouterLink, RouterLinkActive],
  templateUrl: './admin-sidebar.html',
  styleUrl: './admin-sidebar.css'
})
export class AdminSidebarComponent {
  @Input({ required: true }) role$!: Observable<ApiUserRole | null>;
  @Input() navigationId = 'admin-navigation';
  @Input() drawerCollapsed = false;
  @Input() mobileNavOpen = false;
  @Input() user: AdminSidebarUser = {
    initials: 'MA',
    name: 'Mateo Admin',
    subtitle: 'Administrador'
  };

  @Output() toggleDrawer = new EventEmitter<void>();
  @Output() closeMobileNav = new EventEmitter<void>();
  @Output() logoutRequested = new EventEmitter<void>();
}
