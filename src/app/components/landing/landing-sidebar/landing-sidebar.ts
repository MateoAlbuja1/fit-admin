import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface SidebarSection {
  label: string;
  anchor: string;
  icon: string;
  children?: Array<{ label: string; anchor: string }>;
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

  @Output() navigate = new EventEmitter<string>();

  navigateTo(anchor: string): void {
    this.navigate.emit(anchor);
  }
}
