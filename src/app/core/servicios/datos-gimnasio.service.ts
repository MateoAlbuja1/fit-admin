import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, forkJoin, of } from 'rxjs';
import {
  AlertaAdministrativa,
  Cliente,
  Maquina,
  Membresia,
  PedidoTienda,
  Pago,
  RegistroAsistencia,
  Suplemento
} from '../modelos/modelos-administracion';

@Injectable({ providedIn: 'root' })
export class DatosGimnasioService {
  private readonly apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {
    if (typeof window !== 'undefined') {
      this.cargarDesdeBackend();
    }
  }

  cargarDesdeBackend(): void {
    forkJoin({
      clientes: this.http.get<Cliente[]>(`${this.apiUrl}/clients`).pipe(catchError(() => of(this.clientes))),
      membresias: this.http.get<Membresia[]>(`${this.apiUrl}/memberships`).pipe(catchError(() => of(this.membresias))),
      asistencias: this.http.get<RegistroAsistencia[]>(`${this.apiUrl}/attendance`).pipe(catchError(() => of(this.asistencias))),
      pagos: this.http.get<Pago[]>(`${this.apiUrl}/payments`).pipe(catchError(() => of(this.pagos))),
      suplementos: this.http.get<Suplemento[]>(`${this.apiUrl}/inventory/supplements`).pipe(catchError(() => of(this.suplementos))),
      maquinas: this.http.get<Maquina[]>(`${this.apiUrl}/inventory/machines`).pipe(catchError(() => of(this.maquinas))),
      alertas: this.http.get<AlertaAdministrativa[]>(`${this.apiUrl}/alerts`).pipe(catchError(() => of(this.alertas)))
    }).subscribe(data => {
      this.clientes = data.clientes;
      this.membresias = data.membresias;
      this.asistencias = data.asistencias;
      this.pagos = data.pagos;
      this.suplementos = data.suplementos;
      this.maquinas = data.maquinas;
      this.alertasBackend = data.alertas;
    });
  }

  refrescar(): void {
    this.cargarDesdeBackend();
  }

  crearCliente(payload: Partial<Cliente>) {
    return this.http.post<Cliente>(`${this.apiUrl}/clients`, payload);
  }

  actualizarCliente(id: number, payload: Partial<Cliente>) {
    return this.http.put<Cliente>(`${this.apiUrl}/clients/${id}`, payload);
  }

  registrarAsistencia(code: string) {
    return this.http.post<RegistroAsistencia>(`${this.apiUrl}/attendance/check-in`, { code });
  }

  renovarMembresia(id: number, durationDays = 30) {
    return this.http.patch<Membresia>(`${this.apiUrl}/memberships/${id}/renew`, { durationDays });
  }

  actualizarMembresia(id: number, payload: Partial<Membresia>) {
    return this.http.put<Membresia>(`${this.apiUrl}/memberships/${id}`, payload);
  }

  crearPago(payload: Partial<Pago>) {
    return this.http.post<Pago>(`${this.apiUrl}/payments`, payload);
  }

  actualizarPago(id: number, payload: Partial<Pago>) {
    return this.http.put<Pago>(`${this.apiUrl}/payments/${id}`, payload);
  }

  crearSuplemento(payload: Partial<Suplemento>) {
    return this.http.post<Suplemento>(`${this.apiUrl}/inventory/supplements`, payload);
  }

  actualizarSuplemento(id: number, payload: Partial<Suplemento>) {
    return this.http.put<Suplemento>(`${this.apiUrl}/inventory/supplements/${id}`, payload);
  }

  eliminarSuplemento(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/inventory/supplements/${id}`);
  }

  actualizarStockSuplemento(id: number, delta: number) {
    return this.http.patch<Suplemento>(`${this.apiUrl}/inventory/supplements/${id}/stock`, { delta });
  }

  crearPedidoTienda(payload: Record<string, unknown>) {
    return this.http.post<PedidoTienda>(`${this.apiUrl}/public/store-orders`, payload);
  }

  listarPedidosTienda() {
    return this.http.get<PedidoTienda[]>(`${this.apiUrl}/inventory/store-orders`);
  }

  obtenerPedidoTienda(id: number | string) {
    return this.http.get<PedidoTienda>(`${this.apiUrl}/inventory/store-orders/${id}`);
  }

  actualizarEstadoPedidoTienda(id: number | string, status: PedidoTienda['status']) {
    return this.http.patch<PedidoTienda>(`${this.apiUrl}/inventory/store-orders/${id}/status`, { status });
  }

  crearMaquina(payload: Partial<Maquina>) {
    return this.http.post<Maquina>(`${this.apiUrl}/inventory/machines`, payload);
  }

  actualizarMaquina(id: number, payload: Partial<Maquina>) {
    return this.http.put<Maquina>(`${this.apiUrl}/inventory/machines/${id}`, payload);
  }

  eliminarMaquina(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/inventory/machines/${id}`);
  }

  actualizarEstadoMaquina(id: number, status: Maquina['status']) {
    return this.http.patch<Maquina>(`${this.apiUrl}/inventory/machines/${id}/status`, { status });
  }

  obtenerResumenDashboard() {
    return this.http.get<Record<string, number>>(`${this.apiUrl}/dashboard/summary`);
  }

  obtenerDashboardVentas() {
    return this.http.get<Array<Record<string, unknown>>>(`${this.apiUrl}/dashboard/sales`);
  }

  obtenerDashboardAsistencia() {
    return this.http.get<Array<Record<string, unknown>>>(`${this.apiUrl}/dashboard/attendance`);
  }

  obtenerDashboardMembresias() {
    return this.http.get<Array<Record<string, unknown>>>(`${this.apiUrl}/dashboard/memberships`);
  }

  listarReportes() {
    return this.http.get<Array<Record<string, unknown>>>(`${this.apiUrl}/reports`);
  }

  generarReporte(payload: Record<string, unknown>) {
    return this.http.post<Record<string, unknown>>(`${this.apiUrl}/reports/generate`, payload);
  }

  enviarContacto(payload: Record<string, unknown>) {
    return this.http.post<Record<string, unknown>>(`${this.apiUrl}/public/contact`, payload);
  }

  enviarSolicitudDemo(payload: Record<string, unknown>) {
    return this.http.post<Record<string, unknown>>(`${this.apiUrl}/public/demo-request`, payload);
  }

  obtenerPerfilCliente() {
    return this.http.get<Cliente>(`${this.apiUrl}/client/profile`, this.authOptions());
  }

  obtenerMembresiaCliente() {
    return this.http.get<Membresia | null>(`${this.apiUrl}/client/membership`, this.authOptions());
  }

  obtenerPagosCliente() {
    return this.http.get<Pago[]>(`${this.apiUrl}/client/payments`, this.authOptions());
  }

  obtenerAsistenciaCliente() {
    return this.http.get<RegistroAsistencia[]>(`${this.apiUrl}/client/attendance`, this.authOptions());
  }

  obtenerConfiguracionGimnasio() {
    return this.http.get<Record<string, unknown>>(`${this.apiUrl}/settings/gym`);
  }

  obtenerConfiguracionPublicaGimnasio() {
    return this.http.get<Record<string, unknown>>(`${this.apiUrl}/public/gym-settings`);
  }

  guardarConfiguracionGimnasio(payload: object) {
    return this.http.put<Record<string, unknown>>(`${this.apiUrl}/settings/gym`, payload);
  }

  obtenerConfiguracionAdmin() {
    return this.http.get<Record<string, unknown>>(`${this.apiUrl}/settings/admin`);
  }

  guardarConfiguracionAdmin(payload: object) {
    return this.http.put<Record<string, unknown>>(`${this.apiUrl}/settings/admin`, payload);
  }

  solicitarBackup() {
    return this.http.post<Record<string, unknown>>(`${this.apiUrl}/settings/backup`, {});
  }

  cambiarPassword(payload: { currentPassword: string; newPassword: string }) {
    return this.http.post<Record<string, unknown>>(`${this.apiUrl}/auth/change-password`, payload, this.authOptions());
  }

  obtenerHistorialLogin() {
    return this.http.get<Array<Record<string, unknown>>>(`${this.apiUrl}/auth/login-history`, this.authOptions());
  }

  private authOptions() {
    const token = this.readToken();
    return token ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) } : {};
  }

  private readToken(): string | null {
    if (typeof localStorage !== 'undefined') {
      const token = localStorage.getItem('fitadmin-token');
      if (token) return token;
    }

    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem('fitadmin-token');
    }

    return null;
  }

  private alertasBackend: AlertaAdministrativa[] = [];

  clientes: Cliente[] = [
    { id: 1042, name: 'Maria Gonzalez', document: '1723456789', phone: '099 452 1830', plan: 'Plan anual', joined: '08 Jun 2026', status: 'Activo' },
    { id: 1041, name: 'Carlos Mendoza', document: '1718294056', phone: '098 116 4205', plan: 'Plan mensual', joined: '04 Jun 2026', status: 'Activo' },
    { id: 1038, name: 'Andrea Perez', document: '1751839204', phone: '096 730 2241', plan: 'Plan trimestral', joined: '28 May 2026', status: 'Activo' },
    { id: 1024, name: 'Jose Rivera', document: '1709483621', phone: '099 044 7612', plan: 'Plan mensual', joined: '12 Abr 2026', status: 'Inactivo' }
  ];

  membresias: Membresia[] = [
    { id: 1, member: 'Maria Gonzalez', plan: 'Anual', start: '08 Jun 2026', end: '08 Jun 2027', days: 355, status: 'Activa' },
    { id: 2, member: 'Carlos Mendoza', plan: 'Mensual', start: '04 Jun 2026', end: '04 Jul 2026', days: 16, status: 'Por vencer' },
    { id: 3, member: 'Andrea Perez', plan: 'Trimestral', start: '28 May 2026', end: '28 Ago 2026', days: 71, status: 'Activa' },
    { id: 4, member: 'Jose Rivera', plan: 'Mensual', start: '12 Abr 2026', end: '12 May 2026', days: 0, status: 'Vencida' }
  ];

  asistencias: RegistroAsistencia[] = [
    { id: 1, member: 'Jose Rivera', time: '10:42', access: 'Acceso principal', status: 'Ingreso correcto' },
    { id: 2, member: 'Maria Silva', time: '10:18', access: 'Acceso principal', status: 'Ingreso correcto' },
    { id: 3, member: 'Andrea Perez', time: '09:56', access: 'Acceso principal', status: 'Ingreso correcto' },
    { id: 4, member: 'Carlos Mendoza', time: '09:21', access: 'Acceso principal', status: 'Ingreso correcto' }
  ];

  pagos: Pago[] = [
    { id: 2048, member: 'Andrea Perez', concept: 'Membresia trimestral', method: 'Tarjeta', date: '18 Jun 2026', amount: 85, status: 'Pagado' },
    { id: 2047, member: 'Carlos Mendoza', concept: 'Membresia mensual', method: 'Efectivo', date: '18 Jun 2026', amount: 35, status: 'Pagado' },
    { id: 2046, member: 'Maria Silva', concept: 'Whey Protein', method: 'Transferencia', date: '17 Jun 2026', amount: 45, status: 'Pagado' },
    { id: 2045, member: 'Jose Rivera', concept: 'Membresia mensual', method: 'Transferencia', date: '16 Jun 2026', amount: 35, status: 'Pendiente' }
  ];

  suplementos: Suplemento[] = [
    {
      id: 1,
      name: 'Dragon Whey Phorm 2 lb',
      category: 'Proteinas',
      description: 'Proteina whey de chocolate blanco y vainilla para recuperacion muscular.',
      stock: 14,
      minStock: 4,
      price: 48,
      photo: '/assets/img/products/proteins/dragon-whey-phorm.png',
      factsPhoto: '/assets/img/products/proteins/dragon-whey-phorm-facts.png',
      discount: 'Nuevo',
      rating: '4.8/5',
      imageFit: 'contain'
    },
    {
      id: 2,
      name: 'ON Gold Standard Whey',
      category: 'Proteinas',
      description: 'Whey premium de rapida mezcla, ideal para despues del entrenamiento.',
      stock: 9,
      minStock: 4,
      price: 55,
      photo: '/assets/img/products/proteins/on-gold-standard-whey.png',
      factsPhoto: '/assets/img/products/proteins/on-gold-standard-facts.png',
      rating: '4.9/5',
      imageFit: 'contain'
    },
    {
      id: 3,
      name: 'RC King Whey',
      category: 'Proteinas',
      description: 'Formato grande con 25 g de proteina por porcion para uso constante.',
      stock: 7,
      minStock: 3,
      price: 78,
      photo: '/assets/img/products/proteins/rc-king-whey.png',
      factsPhoto: '/assets/img/products/proteins/rc-king-whey-facts.png',
      rating: '4.8/5',
      imageFit: 'contain'
    },
    {
      id: 4,
      name: 'BPI Hydro HD',
      category: 'Proteinas',
      description: 'Proteina hidrolizada de absorcion rapida para recuperacion exigente.',
      stock: 5,
      minStock: 3,
      price: 82,
      photo: '/assets/img/products/proteins/bpi-hydro-hd.png',
      factsPhoto: '/assets/img/products/proteins/bpi-hydro-hd-facts.png',
      rating: '4.8/5',
      imageFit: 'contain'
    },
    {
      id: 5,
      name: 'Dymatize ISO100',
      category: 'Proteinas',
      description: 'Isolate hidrolizado, bajo en grasa y carbohidratos, opcion premium.',
      stock: 6,
      minStock: 3,
      price: 95,
      photo: '/assets/img/products/proteins/dymatize-iso100.png',
      factsPhoto: '/assets/img/products/proteins/dymatize-iso100-facts.png',
      rating: '4.9/5',
      imageFit: 'contain'
    },
    {
      id: 6,
      name: 'Sascha Isolate',
      category: 'Proteinas',
      description: 'Whey isolate sin azucar, pensado para definicion y nutricion diaria.',
      stock: 8,
      minStock: 4,
      price: 58,
      photo: '/assets/img/products/proteins/sascha-isolate.png',
      factsPhoto: '/assets/img/products/proteins/sascha-isolate-facts.png',
      rating: '4.8/5',
      imageFit: 'contain'
    },
    {
      id: 7,
      name: 'Creatina Dragon Pharma',
      category: 'Creatinas',
      description: 'Creatina monohidratada de 300 g para fuerza, potencia y rendimiento.',
      stock: 12,
      minStock: 4,
      price: 35,
      photo: '/assets/img/creatine-dragon-pharma.png',
      factsPhoto: '/assets/img/products/creatines/dragon-pharma-facts.png',
      discount: 'Promo',
      rating: '4.9/5',
      imageFit: 'contain'
    },
    {
      id: 8,
      name: 'BPI Micronized Creatine 1 kg',
      category: 'Creatinas',
      description: 'Creatina micronizada importada, formato grande para uso prolongado.',
      stock: 4,
      minStock: 3,
      price: 75,
      photo: '/assets/img/products/creatines/bpi-micronized-creatine.png',
      factsPhoto: '/assets/img/products/creatines/bpi-micronized-facts.png',
      rating: '4.9/5',
      imageFit: 'contain'
    },
    {
      id: 9,
      name: 'Beverly Creapure Cherry',
      category: 'Creatinas',
      description: 'Creatina con Creapure y sabor cherry, opcion premium para rendimiento.',
      stock: 6,
      minStock: 3,
      price: 48,
      photo: '/assets/img/products/creatines/beverly-creapure-cherry.png',
      factsPhoto: '/assets/img/products/creatines/beverly-creapure-facts.png',
      rating: '4.8/5',
      imageFit: 'contain'
    },
    {
      id: 10,
      name: 'MuscleMeds Creatine Decanate',
      category: 'Creatinas',
      description: 'Creatina decanate de 60 servicios, enfocada en fuerza y recuperacion.',
      stock: 8,
      minStock: 4,
      price: 42,
      photo: '/assets/img/products/creatines/musclemeds-decanate.png',
      factsPhoto: '/assets/img/products/creatines/musclemeds-decanate-facts.png',
      rating: '4.8/5',
      imageFit: 'contain'
    },
    {
      id: 11,
      name: 'Integralmedica Creatina Hardcore',
      category: 'Creatinas',
      description: 'Creatina monohidratada de 150 g, opcion compacta y accesible.',
      stock: 15,
      minStock: 5,
      price: 24,
      photo: '/assets/img/products/creatines/integralmedica-hardcore.png',
      factsPhoto: '/assets/img/products/creatines/integralmedica-hardcore-facts.png',
      rating: '4.7/5',
      imageFit: 'contain'
    },
    {
      id: 12,
      name: 'ON Micronized Creatine',
      category: 'Creatinas',
      description: 'Creatina micronizada Optimum Nutrition para entrenamiento de fuerza.',
      stock: 6,
      minStock: 3,
      price: 58,
      photo: '/assets/img/products/creatines/on-micronized-creatine.png',
      factsPhoto: '/assets/img/products/creatines/on-micronized-facts.png',
      rating: '4.9/5',
      imageFit: 'contain'
    },
    {
      id: 13,
      name: 'RC Creatine NS',
      category: 'Creatinas',
      description: 'Creatina sin sabor de alto rendimiento, formato grande para constancia.',
      stock: 5,
      minStock: 3,
      price: 55,
      photo: '/assets/img/products/creatines/rc-creatine-ns.png',
      factsPhoto: '/assets/img/products/creatines/rc-creatine-ns-facts.png',
      rating: '4.8/5',
      imageFit: 'contain'
    },
    {
      id: 14,
      name: 'RAW Essentials Creatine',
      category: 'Creatinas',
      description: 'Creatina monohidratada 100% pura, 100 servicios aproximados.',
      stock: 7,
      minStock: 3,
      price: 48,
      photo: '/assets/img/products/creatines/raw-essentials-creatine.png',
      factsPhoto: '/assets/img/products/creatines/raw-essentials-facts.png',
      rating: '4.8/5',
      imageFit: 'contain'
    },
    {
      id: 15,
      name: 'Naturelo One Daily Women',
      category: 'Vitaminas y minerales',
      description: 'Multivitaminico diario para energia, defensas y bienestar femenino.',
      stock: 10,
      minStock: 4,
      price: 32,
      photo: '/assets/img/products/vitamins/naturelo-one-daily-women.png',
      factsPhoto: '/assets/img/products/vitamins/naturelo-one-daily-women-facts.png',
      discount: 'Nuevo',
      rating: '4.8/5',
      imageFit: 'contain'
    },
    {
      id: 16,
      name: 'Sports Research Hydrate',
      category: 'Vitaminas y minerales',
      description: 'Electrolitos con sodio, potasio y minerales para hidratacion deportiva.',
      stock: 18,
      minStock: 6,
      price: 24,
      photo: '/assets/img/products/vitamins/sports-research-hydrate.png',
      factsPhoto: '/assets/img/products/vitamins/sports-research-hydrate-facts.png',
      rating: '4.7/5',
      imageFit: 'contain'
    },
    {
      id: 17,
      name: 'Animal Pak Multivitamin',
      category: 'Vitaminas y minerales',
      description: 'Pack completo para soporte diario, rendimiento y recuperacion.',
      stock: 5,
      minStock: 3,
      price: 55,
      photo: '/assets/img/products/vitamins/animal-pak.png',
      factsPhoto: '/assets/img/products/vitamins/animal-pak-facts.png',
      rating: '4.9/5',
      imageFit: 'contain'
    },
    {
      id: 18,
      name: 'Nutra Harmony Men',
      category: 'Vitaminas y minerales',
      description: 'Multivitaminico para hombre con complejo B, D3, K2, zinc y magnesio.',
      stock: 11,
      minStock: 4,
      price: 28,
      photo: '/assets/img/products/vitamins/nutra-harmony-men.png',
      factsPhoto: '/assets/img/products/vitamins/nutra-harmony-men-facts.png',
      rating: '4.8/5',
      imageFit: 'contain'
    },
    {
      id: 19,
      name: 'Flynew 21 Vitamins',
      category: 'Vitaminas y minerales',
      description: 'Formula 21 en 1 para apoyo diario de huesos, musculos y energia.',
      stock: 14,
      minStock: 5,
      price: 20,
      photo: '/assets/img/products/vitamins/flynew-21-vitamins.png',
      factsPhoto: '/assets/img/products/vitamins/flynew-21-vitamins-facts.png',
      rating: '4.7/5',
      imageFit: 'contain'
    },
    {
      id: 20,
      name: 'Animal Fury Blue Ice',
      category: 'Pre-entrenos',
      description: 'Pre-entreno de alta intensidad para energia, enfoque y bombeo muscular.',
      stock: 6,
      minStock: 3,
      price: 42,
      photo: '/assets/img/products/preworkouts/animal-fury-blue-ice.png',
      factsPhoto: '/assets/img/products/preworkouts/animal-fury-blue-ice-facts.png',
      rating: '4.8/5',
      imageFit: 'contain'
    },
    {
      id: 21,
      name: 'Animal Fury Watermelon',
      category: 'Pre-entrenos',
      description: 'Formula con cafeina, citrulina y beta alanina para entrenamientos intensos.',
      stock: 7,
      minStock: 3,
      price: 43,
      photo: '/assets/img/products/preworkouts/animal-fury-watermelon.png',
      factsPhoto: '/assets/img/products/preworkouts/animal-fury-watermelon-facts.png',
      discount: 'Nuevo',
      rating: '4.8/5',
      imageFit: 'contain'
    },
    {
      id: 22,
      name: 'BSN Nitrix 2.0',
      category: 'Pre-entrenos',
      description: 'Soporte de oxido nitrico para bombeo, rendimiento y resistencia.',
      stock: 6,
      minStock: 3,
      price: 44,
      photo: '/assets/img/products/preworkouts/bsn-nitrix-2.png',
      factsPhoto: '/assets/img/products/preworkouts/bsn-nitrix-2-facts.png',
      rating: '4.7/5',
      imageFit: 'contain'
    },
    {
      id: 23,
      name: 'Insane Labz Psychotic',
      category: 'Pre-entrenos',
      description: 'Pre-entreno concentrado para energia fuerte y enfoque antes de levantar.',
      stock: 8,
      minStock: 4,
      price: 36,
      photo: '/assets/img/products/preworkouts/psychotic-gold.png',
      factsPhoto: '/assets/img/products/preworkouts/psychotic-gold-facts.png',
      rating: '4.8/5',
      imageFit: 'contain'
    },
    {
      id: 24,
      name: 'Mutant Madness',
      category: 'Pre-entrenos',
      description: 'Formula intensa con complejo de cafeina para sesiones pesadas.',
      stock: 5,
      minStock: 3,
      price: 39,
      photo: '/assets/img/products/preworkouts/mutant-madness.png',
      factsPhoto: '/assets/img/products/preworkouts/mutant-madness-facts.png',
      rating: '4.8/5',
      imageFit: 'contain'
    },
    {
      id: 25,
      name: 'Shaaboom Ice Pump',
      category: 'Pre-entrenos',
      description: 'Pre-entreno para bombeo, resistencia y efecto frio durante la rutina.',
      stock: 4,
      minStock: 3,
      price: 45,
      photo: '/assets/img/products/preworkouts/shaaboom-ice-pump.png',
      factsPhoto: '/assets/img/products/preworkouts/shaaboom-ice-pump-facts.png',
      rating: '4.7/5',
      imageFit: 'contain'
    },
    {
      id: 26,
      name: 'MuscleTech VaporX5',
      category: 'Pre-entrenos',
      description: 'Pre-entreno con beta alanina, creatina y citrulina para rendimiento.',
      stock: 7,
      minStock: 3,
      price: 38,
      photo: '/assets/img/products/preworkouts/muscletech-vaporx5.png',
      factsPhoto: '/assets/img/products/preworkouts/muscletech-vaporx5-facts.png',
      rating: '4.7/5',
      imageFit: 'contain'
    },
    {
      id: 27,
      name: 'BPI One More Rep',
      category: 'Pre-entrenos',
      description: 'Energia y rendimiento para completar repeticiones con mas intensidad.',
      stock: 9,
      minStock: 4,
      price: 34,
      photo: '/assets/img/products/preworkouts/bpi-one-more-rep.png',
      factsPhoto: '/assets/img/products/preworkouts/bpi-one-more-rep-facts.png',
      rating: '4.7/5',
      imageFit: 'contain'
    },
    {
      id: 28,
      name: 'Promix Protein Puff Mint',
      category: 'Barras y snacks de proteina',
      description: 'Caja de 12 barras proteicas mint chocolate, 15 g de proteina por barra.',
      stock: 12,
      minStock: 4,
      price: 38,
      photo: '/assets/img/products/bars-snacks/promix-protein-puff-mint.png',
      factsPhoto: '/assets/img/products/bars-snacks/promix-protein-puff-mint-facts.png',
      rating: '4.8/5',
      imageFit: 'contain'
    },
    {
      id: 29,
      name: 'Gatorade Protein Bar Chocolate',
      category: 'Barras y snacks de proteina',
      description: 'Caja de 12 barras con 20 g de proteina, ideal para recuperar energia.',
      stock: 10,
      minStock: 4,
      price: 34,
      photo: '/assets/img/products/bars-snacks/gatorade-protein-bar-chocolate.png',
      factsPhoto: '/assets/img/products/bars-snacks/gatorade-protein-bar-chocolate-facts.png',
      rating: '4.7/5',
      imageFit: 'contain'
    },
    {
      id: 30,
      name: 'Jocko Protein Shake Coffee',
      category: 'Barras y snacks de proteina',
      description: 'Pack de 12 bebidas listas, 30 g de proteina y sabor sweet cream coffee.',
      stock: 8,
      minStock: 3,
      price: 46,
      photo: '/assets/img/products/bars-snacks/jocko-protein-shake-coffee.png',
      factsPhoto: '/assets/img/products/bars-snacks/jocko-protein-shake-coffee-facts.png',
      discount: 'Nuevo',
      rating: '4.8/5',
      imageFit: 'contain'
    },
    {
      id: 31,
      name: 'Quaker Chocolate Rice Cakes',
      category: 'Barras y snacks de proteina',
      description: 'Pack de rice cakes de chocolate, snack liviano para antes del entrenamiento.',
      stock: 16,
      minStock: 6,
      price: 14,
      photo: '/assets/img/products/bars-snacks/quaker-rice-cakes-chocolate.png',
      factsPhoto: '/assets/img/products/bars-snacks/quaker-rice-cakes-chocolate-facts.png',
      rating: '4.6/5',
      imageFit: 'contain'
    },
    {
      id: 32,
      name: 'Lean Body Protein Shake',
      category: 'Barras y snacks de proteina',
      description: 'Pack de 12 shakes orange creamsicle con 40 g de proteina y 0 g de azucar.',
      stock: 6,
      minStock: 3,
      price: 52,
      photo: '/assets/img/products/bars-snacks/lean-body-protein-shake-orange.png',
      factsPhoto: '/assets/img/products/bars-snacks/lean-body-protein-shake-orange-facts.png',
      rating: '4.8/5',
      imageFit: 'contain'
    }
  ];

  maquinas: Maquina[] = [
    { id: 1, name: 'Prensa inclinada', type: 'Maquina de fuerza', location: 'Zona inferior', status: 'Operativa', nextMaintenance: '15 Jul 2026', photo: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1000&q=80' },
    { id: 2, name: 'Polea crossover', type: 'Multiestacion', location: 'Zona funcional', status: 'Operativa', nextMaintenance: '28 Jun 2026', photo: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1000&q=80' },
    { id: 3, name: 'Caminadora profesional', type: 'Cardio', location: 'Zona cardio', status: 'Mantenimiento', nextMaintenance: '20 Jun 2026', photo: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&w=1000&q=80' },
    { id: 4, name: 'Bicicleta de spinning', type: 'Cardio indoor', location: 'Sala de cycling', status: 'Operativa', nextMaintenance: '22 Jul 2026', photo: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=1000&q=80' },
    { id: 5, name: 'Maquina Smith', type: 'Fuerza guiada', location: 'Zona de peso libre', status: 'Operativa', nextMaintenance: '05 Ago 2026', photo: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1000&q=80' },
    { id: 6, name: 'Extension de cuadriceps', type: 'Fuerza selectorizada', location: 'Zona inferior', status: 'Operativa', nextMaintenance: '30 Jul 2026', photo: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1000&q=80' },
    { id: 7, name: 'Remo sentado', type: 'Fuerza selectorizada', location: 'Zona superior', status: 'Fuera de servicio', nextMaintenance: '19 Jun 2026', photo: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1000&q=80' }
  ];

  get alertas(): AlertaAdministrativa[] {
    if (this.alertasBackend.length) {
      return this.alertasBackend;
    }

    const alertasMembresias: AlertaAdministrativa[] = this.membresias
      .filter(item => item.status !== 'Activa')
      .map(item => ({
        type: item.status === 'Vencida' ? 'danger' : 'warning',
        title: item.status === 'Vencida' ? `Membresia vencida · ${item.member}` : `Vence pronto · ${item.member}`,
        detail: item.status === 'Vencida' ? `Vencio el ${item.end}` : `${item.days} dias restantes · vence el ${item.end}`,
        route: '/membresias'
      }));

    const alertasStock: AlertaAdministrativa[] = this.suplementos
      .filter(item => item.stock <= item.minStock)
      .map(item => ({
        type: 'stock',
        title: `Stock bajo · ${item.name}`,
        detail: `${item.stock} unidades · minimo ${item.minStock}`,
        route: '/inventario/suplementos'
      }));

    return [...alertasMembresias, ...alertasStock];
  }
}
