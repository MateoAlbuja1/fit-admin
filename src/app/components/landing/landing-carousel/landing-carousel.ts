import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Inject, Input, OnChanges, OnDestroy, OnInit, Output, PLATFORM_ID, SimpleChanges } from '@angular/core';

export interface CarouselSlide {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  alt: string;
}

@Component({
  selector: 'app-landing-carousel',
  standalone: true,
  templateUrl: './landing-carousel.html',
  styleUrl: './landing-carousel.css'
})
export class LandingCarouselComponent implements OnInit, OnChanges, OnDestroy {
  @Input() slides: CarouselSlide[] = [];

  @Output() signup = new EventEmitter<void>();
  @Output() viewPlans = new EventEmitter<void>();

  activeIndex = 0;
  private intervalId?: ReturnType<typeof setInterval>;
  private readonly autoplayDelay = 2600;

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.startAutoplay();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['slides']) {
      this.activeIndex = 0;
      this.startAutoplay();
    }
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  get activeSlide(): CarouselSlide | undefined {
    return this.slides[this.activeIndex] ?? this.slides[0];
  }

  previous(): void {
    if (!this.slides.length) return;
    this.goToIndex(this.activeIndex - 1);
  }

  next(): void {
    if (!this.slides.length) return;
    this.goToIndex(this.activeIndex + 1);
  }

  goTo(index: number): void {
    this.goToIndex(index);
  }

  private startAutoplay(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    if (!isPlatformBrowser(this.platformId) || this.slides.length <= 1) return;

    this.intervalId = setInterval(() => {
      this.goToIndex(this.activeIndex + 1);
      this.cdr.detectChanges();
    }, this.autoplayDelay);
  }

  private goToIndex(index: number): void {
    const total = this.slides.length;
    if (!total) return;
    this.activeIndex = (index + total) % total;
  }
}
