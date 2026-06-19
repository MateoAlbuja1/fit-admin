import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AdminPageActionService {
  readonly label = signal<string | null>(null);
  private handler: (() => void) | null = null;

  register(label: string, handler: () => void): void {
    this.label.set(label);
    this.handler = handler;
  }

  clear(): void {
    this.label.set(null);
    this.handler = null;
  }

  run(): void {
    this.handler?.();
  }
}
