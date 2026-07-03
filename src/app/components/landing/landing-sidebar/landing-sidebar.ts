import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface SidebarSection {
  label: string;
  anchor: string;
  icon: string;
  eyebrow?: string;
  children?: Array<{ label: string; anchor: string; badge?: string; badgeTone?: 'sale' | 'new' | 'hot' }>;
}

export interface SidebarMemberProfile {
  name: string;
  initials: string;
  subtitle: string;
  weight?: string;
  progress?: string;
  renewal?: string;
  plan?: string;
}

@Component({
  selector: 'app-landing-sidebar',
  standalone: true,
  templateUrl: './landing-sidebar.html',
  styleUrl: './landing-sidebar.css'
})
export class LandingSidebarComponent {
  @Input() items: SidebarSection[] = [];
  @Input() activeAnchor = 'inicio';
  @Input() memberProfile: SidebarMemberProfile | null = null;

  @Output() navigate = new EventEmitter<string>();
  @Output() logoutMember = new EventEmitter<void>();
  @Output() openMemberProfile = new EventEmitter<void>();

  expandedAnchor = 'tienda';

  handleItemClick(item: SidebarSection): void {
    if (item.children?.length) {
      const isOpen = this.expandedAnchor === item.anchor;
      this.expandedAnchor = isOpen ? '' : item.anchor;

      if (!isOpen) {
        this.navigate.emit(item.anchor);
      }
      return;
    }

    this.expandedAnchor = '';
    this.navigate.emit(item.anchor);
  }

  navigateTo(anchor: string): void {
    if (anchor.startsWith('servicios:')) {
      this.expandedAnchor = 'servicios';
    }
    if (anchor.startsWith('tienda:')) {
      this.expandedAnchor = 'tienda';
    }
    this.navigate.emit(anchor);
  }

  isExpanded(item: SidebarSection): boolean {
    return this.expandedAnchor === item.anchor;
  }

  showMemberProfile(): void {
    this.expandedAnchor = '';
    this.openMemberProfile.emit();
  }
}
