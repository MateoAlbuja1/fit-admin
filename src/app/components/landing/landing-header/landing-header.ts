import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

export interface SearchResult {
  label: string;
  category: string;
  description: string;
  anchor: string;
}

@Component({
  selector: 'app-landing-header',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './landing-header.html',
  styleUrl: './landing-header.css'
})
export class LandingHeaderComponent {
  @Input() searchQuery = '';
  @Input() searchResults: SearchResult[] = [];
  @Input() cartCount = 0;
  @Input() gymName = 'GX GYM';

  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() navigate = new EventEmitter<string>();
  @Output() cartClick = new EventEmitter<void>();

  updateSearch(value: string): void {
    this.searchQueryChange.emit(value);
  }

  selectResult(result: SearchResult): void {
    this.searchQueryChange.emit('');
    this.navigate.emit(result.anchor);
  }

  submitSearch(event: Event): void {
    event.preventDefault();
    const firstResult = this.searchResults[0];
    if (firstResult) {
      this.selectResult(firstResult);
    }
  }
}
