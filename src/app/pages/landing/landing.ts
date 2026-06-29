import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { ContactCardComponent } from '../../components/landing/contact-card/contact-card';
import { DemoFormComponent } from '../../components/landing/demo-form/demo-form';
import { LandingCarouselComponent, CarouselSlide } from '../../components/landing/landing-carousel/landing-carousel';
import { LandingFooterComponent } from '../../components/landing/landing-footer/landing-footer';
import { LandingHeaderComponent, SearchResult } from '../../components/landing/landing-header/landing-header';
import { LandingSidebarComponent, SidebarSection } from '../../components/landing/landing-sidebar/landing-sidebar';
import { MembershipCardComponent, MembershipPlan } from '../../components/landing/membership-card/membership-card';
import { ProductCardComponent, FitnessProduct } from '../../components/landing/product-card/product-card';
import { ServiceCardComponent, LandingService } from '../../components/landing/service-card/service-card';

interface SocialProof {
  name: string;
  initial: string;
  result: string;
  quote: string;
  meta: string;
  time: string;
}

interface ResultCard {
  value: string;
  label: string;
  detail: string;
}

interface CartItem {
  product: FitnessProduct;
  quantity: number;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    ContactCardComponent,
    DemoFormComponent,
    LandingCarouselComponent,
    LandingFooterComponent,
    LandingHeaderComponent,
    LandingSidebarComponent,
    MembershipCardComponent,
    ProductCardComponent,
    ServiceCardComponent
  ],
  templateUrl: './landing.html',
  styleUrl: './landing.css'
})
export class LandingComponent implements OnInit {
  private readonly whatsappPhone = '593980674115';
  private readonly promoStorageKey = 'wxGymCreatinePromoDismissed';
  private readonly trackedAnchors = ['inicio', 'servicios', 'planes', 'tienda', 'contacto'];

  sidebarOpen = false;
  showPromo = true;
  searchTerm = '';
  activeAnchor = 'inicio';
  cartNotice = '';
  cartOpen = false;
  cartItems: CartItem[] = [];
  selectedPlan = '';
  activeStoreCategory = 'Todos';

  readonly slides: CarouselSlide[] = [
    {
      eyebrow: 'WX GYM / Quito - Caupicho',
      title: 'Entrena fuerte en Caupicho',
      description: 'Entrena fuerza, cardio y acondicionamiento en un espacio real de Caupicho, con maquinas listas y ambiente profesional.',
      image: '/assets/img/gym-carousel-1.jpg',
      alt: 'Area principal de entrenamiento de WX GYM'
    },
    {
      eyebrow: 'Area de musculacion',
      title: 'Zona de fuerza equipada',
      description: 'Maquinas, bancas, poleas y pesas para entrenar con progresion, buena tecnica y rutinas claras.',
      image: '/assets/img/gym-carousel-2.jpg',
      alt: 'Zona de musculacion con maquinas y pesos'
    },
    {
      eyebrow: 'Vista y ambiente',
      title: 'Entrena con vista a Quito',
      description: 'Un gimnasio oscuro, moderno y amplio para concentrarte en tu rutina sin distracciones.',
      image: '/assets/img/gym-carousel-4.jpg',
      alt: 'Zona de entrenamiento con vista a Quito'
    },
    {
      eyebrow: 'Cardio y acondicionamiento',
      title: 'Ritmo, fuerza y constancia',
      description: 'Combina musculacion, cardio y clases para mejorar tu condicion fisica semana a semana.',
      image: '/assets/img/gym-cycling-zone.jpg',
      alt: 'Zona de cardio y bicicletas de WX GYM'
    },
    {
      eyebrow: 'WX GYM real',
      title: 'Espacio moderno para progresar',
      description: 'Fotos reales del gimnasio, equipos disponibles y una experiencia pensada para entrenar mejor.',
      image: '/assets/img/gym-carousel-3.jpg',
      alt: 'Interior moderno de WX GYM'
    }
  ];

  readonly sidebarItems: SidebarSection[] = [
    { label: 'Inicio', anchor: 'inicio', icon: 'home' },
    { label: 'Servicios', anchor: 'servicios', icon: 'fitness_center' },
    { label: 'Planes', anchor: 'planes', icon: 'workspace_premium' },
    {
      label: 'Tienda',
      anchor: 'tienda',
      icon: 'shopping_bag',
      children: [
        { label: 'Proteinas', anchor: 'tienda:Proteinas' },
        { label: 'Creatinas', anchor: 'tienda:Creatinas' },
        { label: 'Vitaminas y minerales', anchor: 'tienda:Vitaminas y minerales' },
        { label: 'Pre-entrenos', anchor: 'tienda:Pre-entrenos' },
        { label: 'Barras y snacks', anchor: 'tienda:Barras y snacks de proteina' }
      ]
    },
    { label: 'Contacto', anchor: 'contacto', icon: 'call' }
  ];

  readonly services: LandingService[] = [
    {
      name: 'Musculacion',
      description: 'Rutinas de fuerza, maquinas y peso libre para avanzar con tecnica, orden y progresion.',
      image: '/assets/img/gym-carousel-1.jpg',
      badge: 'Fuerza'
    },
    {
      name: 'Cardio',
      description: 'Entrenamientos de resistencia para quemar calorias, mejorar tu aire y sostener el ritmo.',
      image: '/assets/img/gym-carousel-5.jpg',
      badge: 'Resistencia'
    },
    {
      name: 'Entrenamiento personalizado',
      description: 'Acompanamiento segun tu objetivo, condicion fisica, historial y disponibilidad semanal.',
      image: '/assets/img/gym-cycling-zone.jpg',
      badge: 'Coaching'
    },
    {
      name: 'Clases grupales',
      description: 'Participa en sesiones motivadoras para entrenar en equipo y mantener la constancia.',
      image: '/assets/img/gym-carousel-4.jpg',
      badge: 'Equipo'
    },
    {
      name: 'Evaluacion fisica',
      description: 'Conoce tu estado actual y recibe recomendaciones para mejorar tu rendimiento.',
      image: '/assets/img/gym-carousel-2.jpg',
      badge: 'Diagnostico'
    },
    {
      name: 'Rutinas para principiantes',
      description: 'Empieza de forma segura con ejercicios guiados y progresivos.',
      image: '/assets/img/gym-carousel-3.jpg',
      badge: 'Inicio'
    }
  ];

  readonly plans: MembershipPlan[] = [
    {
      name: 'Plan Mensual',
      price: '$25.00',
      duration: '30 dias de acceso completo.',
      description: 'Para empezar sin vueltas: fuerza, cardio y rutina inicial.',
      benefits: ['Rutina basica incluida.', 'Acceso a musculacion y cardio.', 'Soporte de recepcion para empezar.'],
      bestFor: 'Ideal para comenzar esta semana',
      formValue: 'Plan mensual'
    },
    {
      name: 'Plan Trimestral',
      price: '$65.00',
      duration: '90 dias para crear constancia.',
      description: 'La mejor relacion entre precio, seguimiento y progreso.',
      benefits: ['Evaluacion fisica incluida.', 'Rutina personalizada.', 'Seguimiento de avances.'],
      bestFor: 'Mas elegido para resultados visibles',
      featured: true,
      formValue: 'Plan trimestral'
    },
    {
      name: 'Plan Anual',
      price: '$220.00',
      duration: '12 meses de entrenamiento.',
      description: 'Para entrenar todo el ano con prioridad y beneficios.',
      benefits: ['Evaluaciones periodicas.', 'Asesoria preferencial.', 'Descuento frente al pago mensual.', 'Prioridad en promociones.'],
      bestFor: 'Para compromiso total',
      formValue: 'Plan anual'
    }
  ];

  readonly products: FitnessProduct[] = [
    { name: 'Proteina Whey', price: '$38.00', discount: '10% OFF', rating: '4.8/5', image: '/assets/img/gym-store-bg.jpg', category: 'Proteinas', description: 'Proteina para recuperacion muscular despues de entrenamientos de fuerza.' },
    { name: 'Proteina Isolate', price: '$46.00', rating: '4.9/5', image: '/assets/img/gym-carousel-1.jpg', category: 'Proteinas', description: 'Opcion ligera y de rapida absorcion para completar tu consumo diario de proteina.' },
    { name: 'Creatina Dragon Pharma', price: '$24.00', discount: 'Promo', rating: '4.9/5', image: '/assets/img/creatine-dragon-pharma.png', imageFit: 'contain', category: 'Creatinas', description: 'Creatina monohidratada de 300 g, 60 servicios de 5 g para fuerza, potencia y rendimiento.' },
    { name: 'Creatina micronizada', price: '$22.00', rating: '4.8/5', image: '/assets/img/gym-carousel-2.jpg', category: 'Creatinas', description: 'Apoyo para progresar en fuerza y sostener mejor el volumen de entrenamiento.' },
    { name: 'Multivitaminico diario', price: '$18.00', rating: '4.7/5', image: '/assets/img/gym-carousel-3.jpg', category: 'Vitaminas y minerales', description: 'Vitaminas y minerales para complementar alimentacion, energia y bienestar general.' },
    { name: 'Magnesio + zinc', price: '$16.00', discount: 'Nuevo', rating: '4.7/5', image: '/assets/img/gym-carousel-4.jpg', category: 'Vitaminas y minerales', description: 'Minerales de apoyo para descanso, recuperacion y rendimiento diario.' },
    { name: 'Pre entreno energia', price: '$26.00', rating: '4.7/5', image: '/assets/img/gym-cycling-zone.jpg', category: 'Pre-entrenos', description: 'Formula para entrenar con mas enfoque, intensidad y resistencia en sesiones exigentes.' },
    { name: 'Pre entreno intenso', price: '$30.00', rating: '4.8/5', image: '/assets/img/gym-carousel-5.jpg', category: 'Pre-entrenos', description: 'Para dias pesados de pierna, fuerza o acondicionamiento con energia sostenida.' },
    { name: 'Barra proteica chocolate', price: '$3.50', rating: '4.6/5', image: '/assets/img/gym-store-bg.jpg', category: 'Barras y snacks de proteina', description: 'Snack practico para antes o despues de entrenar, facil de llevar en la mochila.' },
    { name: 'Snack proteico WX', price: '$4.00', rating: '4.7/5', image: '/assets/img/gym-carousel-3.jpg', category: 'Barras y snacks de proteina', description: 'Opcion rapida para sumar proteina sin complicarte entre clases, trabajo o entrenamiento.' }
  ];

  readonly socialProof: SocialProof[] = [
    {
      name: 'Jeca Chusin',
      initial: 'J',
      result: '5.0',
      quote: 'Muy bien trato, recomendado y te ayudan con la rutina.',
      meta: '2 opiniones',
      time: 'Hace un ano'
    },
    {
      name: 'Aracely Silva',
      initial: 'A',
      result: '5.0',
      quote: 'Buena atencion, tambien transmiten los partidos.',
      meta: '5 opiniones',
      time: 'Hace un ano'
    },
    {
      name: 'Abigail Berrones',
      initial: 'A',
      result: '5.0',
      quote: 'Excelente muy buenas rutinas.',
      meta: '1 opinion',
      time: 'Hace un ano'
    },
    {
      name: 'Milena Almagro',
      initial: 'M',
      result: '5.0',
      quote: 'El mejor gimnasio del Sur de Quito.',
      meta: '1 opinion',
      time: 'Hace un ano'
    },
    {
      name: 'Pato Taco',
      initial: 'P',
      result: '5.0',
      quote: 'No es bueno... es excelente.',
      meta: '1 opinion',
      time: 'Hace un ano'
    },
    {
      name: 'Kattya Silvana',
      initial: 'K',
      result: '5.0',
      quote: 'Excelente servicio.',
      meta: '1 opinion - 3 fotos',
      time: '3 semanas atras'
    }
  ];

  readonly resultCards: ResultCard[] = [
    { value: '5.0', label: 'resenas', detail: 'Opiniones reales de clientes.' },
    { value: 'Caupicho3', label: 'ubicacion', detail: 'Sur de Quito.' },
    { value: 'WX', label: 'fitness gym', detail: 'Rutinas, fuerza y bienestar.' }
  ];

  private readonly searchIndex: SearchResult[] = [
    { label: 'Musculacion', category: 'Servicio', description: 'Fuerza, pesas libres y maquinas.', anchor: 'servicios' },
    { label: 'Cardio', category: 'Servicio', description: 'Resistencia fisica y equipos dinamicos.', anchor: 'servicios' },
    { label: 'Plan mensual', category: 'Membresia', description: 'Acceso completo durante 30 dias.', anchor: 'planes' },
    { label: 'Plan trimestral', category: 'Membresia', description: 'Evaluacion fisica y rutina personalizada.', anchor: 'planes' },
    { label: 'Plan anual', category: 'Membresia', description: 'Acceso completo todo el ano.', anchor: 'planes' },
    { label: 'Proteinas', category: 'Tienda', description: 'Whey e isolate para recuperacion.', anchor: 'tienda:Proteinas' },
    { label: 'Creatinas', category: 'Tienda', description: 'Suplementos para fuerza y rendimiento.', anchor: 'tienda:Creatinas' },
    { label: 'Vitaminas y minerales', category: 'Tienda', description: 'Soporte diario para bienestar.', anchor: 'tienda:Vitaminas y minerales' },
    { label: 'Pre-entrenos', category: 'Tienda', description: 'Energia y enfoque antes de entrenar.', anchor: 'tienda:Pre-entrenos' },
    { label: 'Barras y snacks', category: 'Tienda', description: 'Snacks de proteina listos para llevar.', anchor: 'tienda:Barras y snacks de proteina' },
    { label: 'Carrito', category: 'Tienda', description: 'Arma tu pedido de suplementos.', anchor: 'tienda' },
    { label: 'Inscripcion', category: 'Contacto', description: 'Formulario para nuevos clientes.', anchor: 'inscripcion' },
    { label: 'WhatsApp', category: 'Contacto', description: 'Contacto rapido para inscribirte.', anchor: 'contacto' }
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.showPromo = sessionStorage.getItem(this.promoStorageKey) !== 'true';
  }

  get searchResults(): SearchResult[] {
    const term = this.normalize(this.searchTerm);
    if (!term) return [];
    return this.searchIndex
      .filter(item => this.normalize(`${item.label} ${item.category} ${item.description}`).includes(term))
      .slice(0, 6);
  }

  get cartCount(): number {
    return this.cartItems.reduce((total, item) => total + item.quantity, 0);
  }

  get cartSubtotal(): number {
    return this.cartItems.reduce((total, item) => total + this.priceToNumber(item.product.price) * item.quantity, 0);
  }

  get filteredProducts(): FitnessProduct[] {
    if (this.activeStoreCategory === 'Todos') {
      return this.products;
    }

    return this.products.filter(product => product.category === this.activeStoreCategory);
  }

  get whatsappSignupUrl(): string {
    return this.buildWhatsappUrl('Hola WX GYM, quiero informacion para inscribirme y reservar mi evaluacion fisica.');
  }

  get cartWhatsappUrl(): string {
    if (!this.cartItems.length) {
      return this.buildWhatsappUrl('Hola WX GYM, quiero informacion sobre productos de la tienda fitness.');
    }

    const lines = this.cartItems
      .map(item => `- ${item.quantity} x ${item.product.name} (${item.product.price})`)
      .join('\n');

    return this.buildWhatsappUrl(`Hola WX GYM, quiero comprar estos productos:\n${lines}\nTotal aproximado: ${this.formatCurrency(this.cartSubtotal)}.`);
  }

  updateSearch(query: string): void {
    this.searchTerm = query;
  }

  closePromo(rememberSession = false): void {
    this.showPromo = false;
    if (rememberSession && isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem(this.promoStorageKey, 'true');
    }
  }

  acceptPromo(): void {
    this.closePromo();
    this.navigateTo('tienda:Creatinas');
    const creatine = this.products.find(product => product.name === 'Creatina Dragon Pharma');
    if (creatine) {
      this.addToCart(creatine);
    }
  }

  navigateTo(anchor: string): void {
    this.sidebarOpen = false;
    this.cartOpen = false;
    if (anchor.startsWith('tienda:')) {
      this.activeStoreCategory = anchor.replace('tienda:', '');
      anchor = 'tienda';
    }
    const sectionAnchor = anchor === 'inscripcion' ? 'contacto' : anchor;

    if (this.trackedAnchors.includes(sectionAnchor)) {
      this.activeAnchor = sectionAnchor;
    }
    if (!isPlatformBrowser(this.platformId)) return;

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  choosePlan(plan: MembershipPlan): void {
    this.selectedPlan = plan.formValue;
    this.navigateTo('contacto');
  }

  contactPlanByWhatsapp(plan: MembershipPlan): void {
    if (!isPlatformBrowser(this.platformId)) return;

    window.open(
      this.buildWhatsappUrl(`Hola WX GYM, me interesa el ${plan.name} (${plan.price}). Quiero inscribirme.`),
      '_blank',
      'noopener,noreferrer'
    );
  }

  addToCart(product: FitnessProduct): void {
    const item = this.cartItems.find(cartItem => cartItem.product.name === product.name);
    if (item) {
      item.quantity += 1;
    } else {
      this.cartItems = [...this.cartItems, { product, quantity: 1 }];
    }
    this.cartOpen = true;
    this.cartNotice = `${product.name} agregado al carrito. Total: ${this.cartCount}.`;
    this.flashNotice();
  }

  increaseCartItem(item: CartItem): void {
    item.quantity += 1;
  }

  decreaseCartItem(item: CartItem): void {
    if (item.quantity > 1) {
      item.quantity -= 1;
      return;
    }

    this.removeCartItem(item);
  }

  removeCartItem(item: CartItem): void {
    this.cartItems = this.cartItems.filter(cartItem => cartItem.product.name !== item.product.name);
    if (!this.cartItems.length) {
      this.cartOpen = false;
    }
  }

  openCart(): void {
    this.cartOpen = true;
  }

  closeCart(): void {
    this.cartOpen = false;
  }

  clearCart(): void {
    this.cartItems = [];
    this.cartOpen = false;
  }

  showCart(): void {
    this.cartNotice = this.cartCount
      ? `Tienes ${this.cartCount} producto(s) en el carrito fitness.`
      : 'Tu carrito esta vacio. Agrega productos desde la tienda fitness.';
    this.navigateTo('tienda');
    this.cartOpen = true;
  }

  focusService(service: LandingService): void {
    this.searchTerm = service.name;
    this.navigateTo('servicios');
  }

  private flashNotice(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.setTimeout(() => {
        this.cartNotice = '';
      }, 3600);
    }
  }

  formatCurrency(value: number): string {
    return `$${value.toFixed(2)}`;
  }

  private priceToNumber(price: string): number {
    return Number(price.replace(/[^0-9.]/g, '')) || 0;
  }

  private buildWhatsappUrl(message: string): string {
    return `https://wa.me/${this.whatsappPhone}?text=${encodeURIComponent(message)}`;
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}

