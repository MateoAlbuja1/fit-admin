import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface FitnessProduct {
  id?: number;
  name: string;
  price: string;
  stock?: number;
  discount?: string;
  rating: string;
  image: string;
  factsImage?: string;
  factsAlt?: string;
  imageFit?: 'cover' | 'contain';
  category: string;
  description: string;
}

@Component({
  selector: 'app-product-card',
  standalone: true,
  templateUrl: './product-card.html',
  styleUrl: './product-card.css'
})
export class ProductCardComponent {
  @Input({ required: true }) product!: FitnessProduct;

  @Output() add = new EventEmitter<FitnessProduct>();
}
