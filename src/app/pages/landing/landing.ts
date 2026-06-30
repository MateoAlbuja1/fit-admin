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
import { LandingService } from '../../components/landing/service-card/service-card';

interface SocialProof {
  name: string;
  initial: string;
  photo: string;
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
    ProductCardComponent
  ],
  templateUrl: './landing.html',
  styleUrl: './landing.css'
})
export class LandingComponent implements OnInit {
  private readonly whatsappPhone = '593980674115';
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
  activeServiceName = 'Musculacion';

  readonly slides: CarouselSlide[] = [
    {
      eyebrow: 'WX Fitness Gym',
      title: 'Construye tu mejor version',
      description: 'Entrena fuerza, cardio y acondicionamiento con enfoque, disciplina y maquinas listas para progresar cada semana.',
      image: '/assets/img/gym-carousel-1.jpg',
      alt: 'Area principal de entrenamiento de WX GYM'
    },
    {
      eyebrow: 'Fuerza y musculacion',
      title: 'Sube el nivel de tu rutina',
      description: 'Pesas, poleas, bancas y maquinas para entrenar con tecnica, intensidad y objetivos claros.',
      image: '/assets/img/gym-carousel-2.jpg',
      alt: 'Zona de musculacion con maquinas y pesos'
    },
    {
      eyebrow: 'Ambiente fitness',
      title: 'Concentrate en tu progreso',
      description: 'Un espacio moderno para entrenar sin distracciones, mantener constancia y superar tus marcas.',
      image: '/assets/img/gym-carousel-4.jpg',
      alt: 'Zona moderna de entrenamiento de WX GYM'
    },
    {
      eyebrow: 'Cardio y acondicionamiento',
      title: 'Resistencia para rendir mas',
      description: 'Combina cardio, fuerza y acondicionamiento para ganar energia, control y mejor condicion fisica.',
      image: '/assets/img/gym-cycling-zone.jpg',
      alt: 'Zona de cardio y bicicletas de WX GYM'
    },
    {
      eyebrow: 'Entrenamiento real',
      title: 'Haz que cada sesion cuente',
      description: 'Rutinas, seguimiento y equipo disponible para convertir la constancia en resultados visibles.',
      image: '/assets/img/gym-carousel-3.jpg',
      alt: 'Interior moderno de WX GYM'
    }
  ];

  readonly sidebarItems: SidebarSection[] = [
    { label: 'Inicio', anchor: 'inicio', icon: 'home' },
    {
      label: 'Servicios',
      anchor: 'servicios',
      icon: 'fitness_center',
      children: [
        { label: 'Musculacion', anchor: 'servicios:Musculacion' },
        { label: 'Cardio', anchor: 'servicios:Cardio' },
        { label: 'Personalizado', anchor: 'servicios:Entrenamiento personalizado' },
        { label: 'Clases grupales', anchor: 'servicios:Clases grupales' },
        { label: 'Evaluacion fisica', anchor: 'servicios:Evaluacion fisica' },
        { label: 'Principiantes', anchor: 'servicios:Rutinas para principiantes' }
      ]
    },
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
        { label: 'Barras y snacks de proteina', anchor: 'tienda:Barras y snacks de proteina' }
      ]
    },
    { label: 'Contacto', anchor: 'contacto', icon: 'call' }
  ];

  readonly services: LandingService[] = [
    {
      name: 'Musculacion',
      description: 'Entrena fuerza con maquinas, poleas y peso libre, siguiendo una progresion clara.',
      image: '/assets/img/gym-carousel-1.jpg',
      badge: 'Fuerza',
      focus: 'Hipertrofia',
      duration: 'Rutina guiada',
      bestFor: 'Ganar masa',
      intensity: 'Media / alta',
      trainingGoal: 'Fuerza, volumen y tecnica.',
      sessionFlow: ['Calentamiento guiado.', 'Trabajo por grupo muscular.', 'Progresion de cargas.'],
      tools: ['Peso libre', 'Poleas', 'Maquinas', 'Bancas'],
      includes: ['Pesas libres y maquinas.', 'Rutina por grupos musculares.', 'Correccion basica de tecnica.', 'Progresion semanal.']
    },
    {
      name: 'Cardio',
      description: 'Mejora tu resistencia, energia y condicion fisica con sesiones bien medidas.',
      image: '/assets/img/gym-carousel-5.jpg',
      badge: 'Resistencia',
      focus: 'Quema calorica',
      duration: '20 - 45 min',
      bestFor: 'Bajar grasa',
      intensity: 'Variable',
      trainingGoal: 'Resistencia y condicion fisica.',
      sessionFlow: ['Entrada progresiva.', 'Intervalos por nivel.', 'Vuelta a la calma.'],
      tools: ['Caminadora', 'Bicicleta', 'Circuitos', 'Peso corporal'],
      includes: ['Trabajo por intensidad.', 'Rutinas de resistencia.', 'Acondicionamiento progresivo.', 'Control de ritmo.']
    },
    {
      name: 'Entrenamiento personalizado',
      description: 'Acompanamiento directo segun tu objetivo, nivel y disponibilidad semanal.',
      image: '/assets/img/gym-cycling-zone.jpg',
      badge: 'Coaching',
      focus: 'Plan a medida',
      duration: 'Seguimiento',
      bestFor: 'Objetivo claro',
      intensity: 'Personalizada',
      trainingGoal: 'Rutina ajustada a tu objetivo.',
      sessionFlow: ['Revision inicial.', 'Ejercicios adecuados.', 'Ajuste de cargas.'],
      tools: ['Evaluacion', 'Rutina', 'Seguimiento', 'Tecnica'],
      includes: ['Evaluacion inicial.', 'Rutina personalizada.', 'Ajustes segun progreso.', 'Acompanamiento tecnico.']
    },
    {
      name: 'Clases grupales',
      description: 'Entrena con energia de grupo, dinamicas intensas y ambiente motivador.',
      image: '/assets/img/gym-carousel-4.jpg',
      badge: 'Equipo',
      focus: 'Motivacion',
      duration: 'Sesiones grupales',
      bestFor: 'Constancia',
      intensity: 'Media / dinamica',
      trainingGoal: 'Energia, ritmo y constancia.',
      sessionFlow: ['Calentamiento grupal.', 'Circuito por estaciones.', 'Cierre activo.'],
      tools: ['Circuitos', 'Mancuernas', 'Bandas', 'Peso corporal'],
      includes: ['Entrenamiento en equipo.', 'Circuitos dinamicos.', 'Ambiente motivador.', 'Trabajo de cuerpo completo.']
    },
    {
      name: 'Evaluacion fisica',
      description: 'Conoce tu punto de partida y recibe una ruta inicial para entrenar con sentido.',
      image: '/assets/img/gym-carousel-2.jpg',
      badge: 'Diagnostico',
      focus: 'Punto inicial',
      duration: 'Primera visita',
      bestFor: 'Empezar bien',
      intensity: 'Diagnostica',
      trainingGoal: 'Saber por donde empezar.',
      sessionFlow: ['Revision de objetivo.', 'Movilidad y condicion.', 'Rutina inicial.'],
      tools: ['Medicion', 'Movilidad', 'Tecnica', 'Plan inicial'],
      includes: ['Revision de objetivo.', 'Nivel de condicion fisica.', 'Recomendacion de rutina.', 'Orientacion de plan.']
    },
    {
      name: 'Rutinas para principiantes',
      description: 'Empieza seguro, sin improvisar, con ejercicios simples y progresivos.',
      image: '/assets/img/gym-carousel-3.jpg',
      badge: 'Inicio',
      focus: 'Base tecnica',
      duration: 'Paso a paso',
      bestFor: 'Primer mes',
      intensity: 'Progresiva',
      trainingGoal: 'Base segura para empezar.',
      sessionFlow: ['Ejercicios base.', 'Practica guiada.', 'Rutina simple.'],
      tools: ['Maquinas guiadas', 'Mancuernas', 'Bandas', 'Rutina base'],
      includes: ['Ejercicios faciles de seguir.', 'Adaptacion progresiva.', 'Tecnica basica.', 'Confianza para entrenar solo.']
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
    {
      name: 'Dragon Whey Phorm 2 lb',
      price: '$48.00',
      discount: 'Nuevo',
      rating: '4.8/5',
      image: '/assets/img/products/proteins/dragon-whey-phorm.png',
      factsImage: '/assets/img/products/proteins/dragon-whey-phorm-facts.png',
      imageFit: 'contain',
      category: 'Proteinas',
      description: 'Proteina whey de chocolate blanco y vainilla para recuperacion muscular.'
    },
    {
      name: 'ON Gold Standard Whey',
      price: '$55.00',
      rating: '4.9/5',
      image: '/assets/img/products/proteins/on-gold-standard-whey.png',
      factsImage: '/assets/img/products/proteins/on-gold-standard-facts.png',
      imageFit: 'contain',
      category: 'Proteinas',
      description: 'Whey premium de rapida mezcla, ideal para despues del entrenamiento.'
    },
    {
      name: 'RC King Whey',
      price: '$78.00',
      rating: '4.8/5',
      image: '/assets/img/products/proteins/rc-king-whey.png',
      factsImage: '/assets/img/products/proteins/rc-king-whey-facts.png',
      imageFit: 'contain',
      category: 'Proteinas',
      description: 'Formato grande con 25 g de proteina por porcion para uso constante.'
    },
    {
      name: 'BPI Hydro HD',
      price: '$82.00',
      rating: '4.8/5',
      image: '/assets/img/products/proteins/bpi-hydro-hd.png',
      factsImage: '/assets/img/products/proteins/bpi-hydro-hd-facts.png',
      imageFit: 'contain',
      category: 'Proteinas',
      description: 'Proteina hidrolizada de absorcion rapida para recuperacion exigente.'
    },
    {
      name: 'Dymatize ISO100',
      price: '$95.00',
      rating: '4.9/5',
      image: '/assets/img/products/proteins/dymatize-iso100.png',
      factsImage: '/assets/img/products/proteins/dymatize-iso100-facts.png',
      imageFit: 'contain',
      category: 'Proteinas',
      description: 'Isolate hidrolizado, bajo en grasa y carbohidratos, opcion premium.'
    },
    {
      name: 'Sascha Isolate',
      price: '$58.00',
      rating: '4.8/5',
      image: '/assets/img/products/proteins/sascha-isolate.png',
      factsImage: '/assets/img/products/proteins/sascha-isolate-facts.png',
      imageFit: 'contain',
      category: 'Proteinas',
      description: 'Whey isolate sin azucar, pensado para definicion y nutricion diaria.'
    },
    {
      name: 'Creatina Dragon Pharma',
      price: '$35.00',
      discount: 'Promo',
      rating: '4.9/5',
      image: '/assets/img/creatine-dragon-pharma.png',
      factsImage: '/assets/img/products/creatines/dragon-pharma-facts.png',
      imageFit: 'contain',
      category: 'Creatinas',
      description: 'Creatina monohidratada de 300 g para fuerza, potencia y rendimiento.'
    },
    {
      name: 'BPI Micronized Creatine 1 kg',
      price: '$75.00',
      rating: '4.9/5',
      image: '/assets/img/products/creatines/bpi-micronized-creatine.png',
      factsImage: '/assets/img/products/creatines/bpi-micronized-facts.png',
      imageFit: 'contain',
      category: 'Creatinas',
      description: 'Creatina micronizada importada, formato grande para uso prolongado.'
    },
    {
      name: 'Beverly Creapure Cherry',
      price: '$48.00',
      rating: '4.8/5',
      image: '/assets/img/products/creatines/beverly-creapure-cherry.png',
      factsImage: '/assets/img/products/creatines/beverly-creapure-facts.png',
      imageFit: 'contain',
      category: 'Creatinas',
      description: 'Creatina con Creapure y sabor cherry, opcion premium para rendimiento.'
    },
    {
      name: 'MuscleMeds Creatine Decanate',
      price: '$42.00',
      rating: '4.8/5',
      image: '/assets/img/products/creatines/musclemeds-decanate.png',
      factsImage: '/assets/img/products/creatines/musclemeds-decanate-facts.png',
      imageFit: 'contain',
      category: 'Creatinas',
      description: 'Creatina decanate de 60 servicios, enfocada en fuerza y recuperacion.'
    },
    {
      name: 'Integralmedica Creatina Hardcore',
      price: '$24.00',
      rating: '4.7/5',
      image: '/assets/img/products/creatines/integralmedica-hardcore.png',
      factsImage: '/assets/img/products/creatines/integralmedica-hardcore-facts.png',
      imageFit: 'contain',
      category: 'Creatinas',
      description: 'Creatina monohidratada de 150 g, opcion compacta y accesible.'
    },
    {
      name: 'ON Micronized Creatine',
      price: '$58.00',
      rating: '4.9/5',
      image: '/assets/img/products/creatines/on-micronized-creatine.png',
      factsImage: '/assets/img/products/creatines/on-micronized-facts.png',
      imageFit: 'contain',
      category: 'Creatinas',
      description: 'Creatina micronizada Optimum Nutrition para entrenamiento de fuerza.'
    },
    {
      name: 'RC Creatine NS',
      price: '$55.00',
      rating: '4.8/5',
      image: '/assets/img/products/creatines/rc-creatine-ns.png',
      factsImage: '/assets/img/products/creatines/rc-creatine-ns-facts.png',
      imageFit: 'contain',
      category: 'Creatinas',
      description: 'Creatina sin sabor de alto rendimiento, formato grande para constancia.'
    },
    {
      name: 'RAW Essentials Creatine',
      price: '$48.00',
      rating: '4.8/5',
      image: '/assets/img/products/creatines/raw-essentials-creatine.png',
      factsImage: '/assets/img/products/creatines/raw-essentials-facts.png',
      imageFit: 'contain',
      category: 'Creatinas',
      description: 'Creatina monohidratada 100% pura, 100 servicios aproximados.'
    },
    {
      name: 'Naturelo One Daily Women',
      price: '$32.00',
      discount: 'Nuevo',
      rating: '4.8/5',
      image: '/assets/img/products/vitamins/naturelo-one-daily-women.png',
      factsImage: '/assets/img/products/vitamins/naturelo-one-daily-women-facts.png',
      imageFit: 'contain',
      category: 'Vitaminas y minerales',
      description: 'Multivitaminico diario para energia, defensas y bienestar femenino.'
    },
    {
      name: 'Sports Research Hydrate',
      price: '$24.00',
      rating: '4.7/5',
      image: '/assets/img/products/vitamins/sports-research-hydrate.png',
      factsImage: '/assets/img/products/vitamins/sports-research-hydrate-facts.png',
      imageFit: 'contain',
      category: 'Vitaminas y minerales',
      description: 'Electrolitos con sodio, potasio y minerales para hidratacion deportiva.'
    },
    {
      name: 'Animal Pak Multivitamin',
      price: '$55.00',
      rating: '4.9/5',
      image: '/assets/img/products/vitamins/animal-pak.png',
      factsImage: '/assets/img/products/vitamins/animal-pak-facts.png',
      imageFit: 'contain',
      category: 'Vitaminas y minerales',
      description: 'Pack completo para soporte diario, rendimiento y recuperacion.'
    },
    {
      name: 'Nutra Harmony Men',
      price: '$28.00',
      rating: '4.8/5',
      image: '/assets/img/products/vitamins/nutra-harmony-men.png',
      factsImage: '/assets/img/products/vitamins/nutra-harmony-men-facts.png',
      imageFit: 'contain',
      category: 'Vitaminas y minerales',
      description: 'Multivitaminico para hombre con complejo B, D3, K2, zinc y magnesio.'
    },
    {
      name: 'Flynew 21 Vitamins',
      price: '$20.00',
      rating: '4.7/5',
      image: '/assets/img/products/vitamins/flynew-21-vitamins.png',
      factsImage: '/assets/img/products/vitamins/flynew-21-vitamins-facts.png',
      imageFit: 'contain',
      category: 'Vitaminas y minerales',
      description: 'Formula 21 en 1 para apoyo diario de huesos, musculos y energia.'
    },
    {
      name: 'Animal Fury Blue Ice',
      price: '$42.00',
      rating: '4.8/5',
      image: '/assets/img/products/preworkouts/animal-fury-blue-ice.png',
      factsImage: '/assets/img/products/preworkouts/animal-fury-blue-ice-facts.png',
      imageFit: 'contain',
      category: 'Pre-entrenos',
      description: 'Pre-entreno de alta intensidad para energia, enfoque y bombeo muscular.'
    },
    {
      name: 'Animal Fury Watermelon',
      price: '$43.00',
      discount: 'Nuevo',
      rating: '4.8/5',
      image: '/assets/img/products/preworkouts/animal-fury-watermelon.png',
      factsImage: '/assets/img/products/preworkouts/animal-fury-watermelon-facts.png',
      imageFit: 'contain',
      category: 'Pre-entrenos',
      description: 'Formula con cafeina, citrulina y beta alanina para entrenamientos intensos.'
    },
    {
      name: 'BSN Nitrix 2.0',
      price: '$44.00',
      rating: '4.7/5',
      image: '/assets/img/products/preworkouts/bsn-nitrix-2.png',
      factsImage: '/assets/img/products/preworkouts/bsn-nitrix-2-facts.png',
      imageFit: 'contain',
      category: 'Pre-entrenos',
      description: 'Soporte de oxido nitrico para bombeo, rendimiento y resistencia.'
    },
    {
      name: 'Insane Labz Psychotic',
      price: '$36.00',
      rating: '4.8/5',
      image: '/assets/img/products/preworkouts/psychotic-gold.png',
      factsImage: '/assets/img/products/preworkouts/psychotic-gold-facts.png',
      imageFit: 'contain',
      category: 'Pre-entrenos',
      description: 'Pre-entreno concentrado para energia fuerte y enfoque antes de levantar.'
    },
    {
      name: 'Mutant Madness',
      price: '$39.00',
      rating: '4.8/5',
      image: '/assets/img/products/preworkouts/mutant-madness.png',
      factsImage: '/assets/img/products/preworkouts/mutant-madness-facts.png',
      imageFit: 'contain',
      category: 'Pre-entrenos',
      description: 'Formula intensa con complejo de cafeina para sesiones pesadas.'
    },
    {
      name: 'Shaaboom Ice Pump',
      price: '$45.00',
      rating: '4.7/5',
      image: '/assets/img/products/preworkouts/shaaboom-ice-pump.png',
      factsImage: '/assets/img/products/preworkouts/shaaboom-ice-pump-facts.png',
      imageFit: 'contain',
      category: 'Pre-entrenos',
      description: 'Pre-entreno para bombeo, resistencia y efecto frio durante la rutina.'
    },
    {
      name: 'MuscleTech VaporX5',
      price: '$38.00',
      rating: '4.7/5',
      image: '/assets/img/products/preworkouts/muscletech-vaporx5.png',
      factsImage: '/assets/img/products/preworkouts/muscletech-vaporx5-facts.png',
      imageFit: 'contain',
      category: 'Pre-entrenos',
      description: 'Pre-entreno con beta alanina, creatina y citrulina para rendimiento.'
    },
    {
      name: 'BPI One More Rep',
      price: '$34.00',
      rating: '4.7/5',
      image: '/assets/img/products/preworkouts/bpi-one-more-rep.png',
      factsImage: '/assets/img/products/preworkouts/bpi-one-more-rep-facts.png',
      imageFit: 'contain',
      category: 'Pre-entrenos',
      description: 'Energia y rendimiento para completar repeticiones con mas intensidad.'
    },
    { name: 'Barra proteica chocolate', price: '$3.50', rating: '4.6/5', image: '/assets/img/gym-store-bg.jpg', category: 'Barras y snacks de proteina', description: 'Snack practico para antes o despues de entrenar, facil de llevar en la mochila.' },
    { name: 'Snack proteico WX', price: '$4.00', rating: '4.7/5', image: '/assets/img/gym-carousel-3.jpg', category: 'Barras y snacks de proteina', description: 'Opcion rapida para sumar proteina sin complicarte entre clases, trabajo o entrenamiento.' }
  ];

  readonly socialProof: SocialProof[] = [
    {
      name: 'Jeca Chusin',
      initial: 'J',
      photo: '/assets/img/reviews/jeca-chusin.png',
      result: '5.0',
      quote: 'Muy bien trato, recomendado y te ayudan con la rutina.',
      meta: '2 opiniones',
      time: 'Hace un ano'
    },
    {
      name: 'Aracely Silva',
      initial: 'A',
      photo: '/assets/img/reviews/aracely-silva.png',
      result: '5.0',
      quote: 'Buena atencion, tambien transmiten los partidos.',
      meta: '5 opiniones',
      time: 'Hace un ano'
    },
    {
      name: 'Abigail Berrones',
      initial: 'A',
      photo: '/assets/img/reviews/abigail-berrones.png',
      result: '5.0',
      quote: 'Excelente muy buenas rutinas.',
      meta: '1 opinion',
      time: 'Hace un ano'
    },
    {
      name: 'Milena Almagro',
      initial: 'M',
      photo: '/assets/img/reviews/milena-almagro.png',
      result: '5.0',
      quote: 'El mejor gimnasio del Sur de Quito.',
      meta: '1 opinion',
      time: 'Hace un ano'
    },
    {
      name: 'Pato Taco',
      initial: 'P',
      photo: '/assets/img/reviews/pato-taco.png',
      result: '5.0',
      quote: 'No es bueno... es excelente.',
      meta: '1 opinion',
      time: 'Hace un ano'
    },
    {
      name: 'Kattya Silvana',
      initial: 'K',
      photo: '/assets/img/reviews/kattya-silvana.png',
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
    { label: 'Barras y snacks de proteina', category: 'Tienda', description: 'Snacks proteicos para llevar.', anchor: 'tienda:Barras y snacks de proteina' },
    { label: 'Carrito', category: 'Tienda', description: 'Arma tu pedido de suplementos.', anchor: 'tienda' },
    { label: 'Inscripcion', category: 'Contacto', description: 'Formulario para nuevos clientes.', anchor: 'inscripcion' },
    { label: 'WhatsApp', category: 'Contacto', description: 'Contacto rapido para inscribirte.', anchor: 'contacto' }
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  ngOnInit(): void {
    this.showPromo = true;
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

  get selectedService(): LandingService {
    return this.services.find(service => service.name === this.activeServiceName) ?? this.services[0];
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

  closePromo(): void {
    this.showPromo = false;
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
    this.searchTerm = '';

    if (anchor.startsWith('tienda:')) {
      this.activeStoreCategory = anchor.replace('tienda:', '');
      anchor = 'tienda';
    }
    if (anchor.startsWith('servicios:')) {
      this.activeServiceName = anchor.replace('servicios:', '');
      anchor = 'servicios';
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
  }

  openCart(): void {
    this.cartOpen = true;
  }

  closeCart(): void {
    this.cartOpen = false;
  }

  clearCart(): void {
    this.cartItems = [];
  }

  showCart(): void {
    this.cartNotice = this.cartCount
      ? `Tienes ${this.cartCount} producto(s) en el carrito fitness.`
      : 'Tu carrito esta vacio. Agrega productos desde la tienda fitness.';
    this.navigateTo('tienda');
    this.cartOpen = true;
  }

  focusService(service: LandingService): void {
    this.activeServiceName = service.name;
    this.navigateTo('servicios');
  }

  requestService(service: LandingService): void {
    this.activeServiceName = service.name;
    this.navigateTo('contacto');
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

