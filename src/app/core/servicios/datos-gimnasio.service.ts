import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, forkJoin, Observable, of, tap } from 'rxjs';
import {
  AlertaAdministrativa,
  Cliente,
  Maquina,
  Membresia,
  PedidoTienda,
  Pago,
  RegistroAsistencia,
  Suplemento,
  UsuarioRegistrado
} from '../modelos/modelos-administracion';
import { apiBaseUrl } from '../config/api.config';

export interface TemporaryVatSettings {
  enabled: boolean;
  rate: number;
  startsAt: string;
  endsAt: string;
  reason: string;
}

const ECUADOR_STANDARD_VAT_RATE = 15;

@Injectable({ providedIn: 'root' })
export class DatosGimnasioService {
  private readonly apiUrl = apiBaseUrl();
  temporaryVat: TemporaryVatSettings = {
    enabled: false,
    rate: ECUADOR_STANDARD_VAT_RATE,
    startsAt: '',
    endsAt: '',
    reason: 'Feriado nacional'
  };

  constructor(private http: HttpClient) {
    if (typeof window !== 'undefined') {
      this.cargarDesdeBackend();
    }
  }

  cargarDesdeBackend(): void {
    const hasToken = Boolean(this.readToken());
    const suplementosUrl = hasToken
      ? `${this.apiUrl}/inventory/supplements`
      : `${this.apiUrl}/public/supplements`;

    forkJoin({
      clientes: hasToken ? this.http.get<Cliente[]>(`${this.apiUrl}/clients`).pipe(catchError(() => of(this.clientes))) : of(this.clientes),
      membresias: hasToken ? this.http.get<Membresia[]>(`${this.apiUrl}/memberships`).pipe(catchError(() => of(this.membresias))) : of(this.membresias),
      asistencias: hasToken ? this.http.get<RegistroAsistencia[]>(`${this.apiUrl}/attendance`).pipe(catchError(() => of(this.asistencias))) : of(this.asistencias),
      pagos: hasToken ? this.http.get<Pago[]>(`${this.apiUrl}/payments`).pipe(catchError(() => of(this.pagos))) : of(this.pagos),
      pedidos: hasToken ? this.http.get<PedidoTienda[]>(`${this.apiUrl}/inventory/store-orders`, this.authOptions()).pipe(catchError(() => of(this.pedidosTienda))) : of(this.pedidosTienda),
      suplementos: this.http.get<Suplemento[]>(suplementosUrl).pipe(catchError(() => of(this.suplementos))),
      maquinas: hasToken ? this.http.get<Maquina[]>(`${this.apiUrl}/inventory/machines`).pipe(catchError(() => of(this.maquinas))) : of(this.maquinas),
      alertas: hasToken ? this.http.get<AlertaAdministrativa[]>(`${this.apiUrl}/alerts`).pipe(catchError(() => of(this.alertas))) : of(this.alertas),
      settings: this.http.get<Record<string, unknown>>(`${this.apiUrl}/public/gym-settings`).pipe(catchError(() => of({} as Record<string, unknown>)))
    }).subscribe(data => {
      this.clientes = data.clientes;
      this.membresias = data.membresias;
      this.asistencias = data.asistencias;
      this.pagos = data.pagos;
      this.pedidosTienda = data.pedidos;
      this.suplementos = data.suplementos;
      this.maquinas = data.maquinas;
      this.alertasBackend = data.alertas;
      this.temporaryVat = this.normalizeTemporaryVat(data.settings['temporaryVat']);
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

  crearPedidoManualTienda(payload: Record<string, unknown>) {
    return this.http.post<PedidoTienda>(`${this.apiUrl}/inventory/store-orders`, payload, this.authOptions());
  }

  obtenerConfiguracionPaypal() {
    return this.http.get<{ enabled: boolean; clientId: string; currency: string; mode: string }>(`${this.apiUrl}/public/paypal/config`);
  }

  crearOrdenPaypal(payload: Record<string, unknown>) {
    return this.http.post<{ paypalOrderId: string; order: PedidoTienda }>(`${this.apiUrl}/public/paypal/orders`, payload);
  }

  capturarOrdenPaypal(paypalOrderId: string) {
    return this.http.post<PedidoTienda>(`${this.apiUrl}/public/paypal/orders/${paypalOrderId}/capture`, {});
  }

  listarPedidosTienda() {
    return this.http.get<PedidoTienda[]>(`${this.apiUrl}/inventory/store-orders`, this.authOptions()).pipe(
      tap(pedidos => {
        this.pedidosTienda = pedidos;
      })
    );
  }

  obtenerPedidoTienda(id: number | string) {
    return this.http.get<PedidoTienda>(`${this.apiUrl}/inventory/store-orders/${id}`, this.authOptions());
  }

  actualizarEstadoPedidoTienda(id: number | string, status: PedidoTienda['status'], paymentMethod?: string) {
    return this.http.patch<PedidoTienda>(`${this.apiUrl}/inventory/store-orders/${id}/status`, { status, paymentMethod }, this.authOptions()).pipe(
      tap(updated => {
        this.pedidosTienda = this.pedidosTienda.map(order => order.id === updated.id ? updated : order);
      })
    );
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

  refrescarAlertas(): Observable<AlertaAdministrativa[]> {
    return this.http.get<AlertaAdministrativa[]>(`${this.apiUrl}/alerts`).pipe(
      tap(alertas => {
        this.alertasBackend = alertas;
      })
    );
  }

  marcarAlertasLeidas(ids: string[]): Observable<AlertaAdministrativa[]> {
    const uniqueIds = [...new Set(ids.filter(Boolean))];
    if (!uniqueIds.length) {
      return of([]);
    }

    return forkJoin(
      uniqueIds.map(id => this.http.patch<AlertaAdministrativa>(`${this.apiUrl}/alerts/${id}/read`, {}))
    ).pipe(
      tap(updatedAlerts => {
        const updatedById = new Map(updatedAlerts.map(alert => [alert.id, alert]));
        this.alertasBackend = this.alertasBackend.map(alert => updatedById.get(alert.id) ?? alert);
      })
    );
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
    return this.http.put<Record<string, unknown>>(`${this.apiUrl}/settings/gym`, payload).pipe(
      tap(settings => {
        this.temporaryVat = this.normalizeTemporaryVat(settings['temporaryVat']);
      })
    );
  }

  obtenerConfiguracionAdmin() {
    return this.http.get<Record<string, unknown>>(`${this.apiUrl}/settings/admin`);
  }

  guardarConfiguracionAdmin(payload: object) {
    return this.http.put<Record<string, unknown>>(`${this.apiUrl}/settings/admin`, payload);
  }

  solicitarBackup() {
    return this.http.post<Record<string, unknown>>(`${this.apiUrl}/settings/backup`, {}, this.authOptions());
  }

  restaurarBackup(snapshot: Record<string, unknown>) {
    return this.http.post<Record<string, unknown>>(`${this.apiUrl}/settings/restore`, { snapshot }, this.authOptions());
  }

  obtenerEstadoSistema() {
    return this.http.get<Record<string, unknown>>(`${this.apiUrl}/settings/system-status`, this.authOptions());
  }

  cambiarPassword(payload: { currentPassword: string; newPassword: string }) {
    return this.http.post<Record<string, unknown>>(`${this.apiUrl}/auth/change-password`, payload, this.authOptions());
  }

  obtenerHistorialLogin() {
    return this.http.get<Array<Record<string, unknown>>>(`${this.apiUrl}/auth/login-history`, this.authOptions());
  }

  obtenerUsuariosRegistrados(): Observable<UsuarioRegistrado[]> {
    return this.http.get<UsuarioRegistrado[]>(`${this.apiUrl}/auth/users`, this.authOptions());
  }

  crearUsuarioRecepcion(payload: {
    fullName: string;
    username: string;
    email: string;
    phone?: string;
    password: string;
  }): Observable<UsuarioRegistrado> {
    return this.http.post<UsuarioRegistrado>(`${this.apiUrl}/auth/reception-users`, payload, this.authOptions());
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

  get ivaTemporalActivo(): boolean {
    const vat = this.temporaryVat;
    if (!vat.enabled || vat.rate <= 0) {
      return false;
    }

    const today = this.todayKey();
    return (!vat.startsAt || today >= vat.startsAt) && (!vat.endsAt || today <= vat.endsAt);
  }

  get etiquetaIvaTemporal(): string {
    if (!this.ivaTemporalActivo) {
      return '';
    }
    return `IVA temporal ${this.temporaryVat.rate}%`;
  }

  precioConIvaTemporal(price: number): number {
    const basePrice = Number(price) || 0;
    if (!this.ivaTemporalActivo) {
      return Number(basePrice.toFixed(2));
    }

    const priceBeforeVat = basePrice / (1 + ECUADOR_STANDARD_VAT_RATE / 100);
    return Number((priceBeforeVat * (1 + this.temporaryVat.rate / 100)).toFixed(2));
  }

  private normalizeTemporaryVat(value: unknown): TemporaryVatSettings {
    const settings = typeof value === 'object' && value !== null ? value as Partial<TemporaryVatSettings> : {};
    const rate = Number(settings.rate ?? ECUADOR_STANDARD_VAT_RATE);
    return {
      enabled: Boolean(settings.enabled),
      rate: Number.isFinite(rate) ? Math.min(100, Math.max(0, Number(rate.toFixed(2)))) : ECUADOR_STANDARD_VAT_RATE,
      startsAt: typeof settings.startsAt === 'string' ? settings.startsAt : '',
      endsAt: typeof settings.endsAt === 'string' ? settings.endsAt : '',
      reason: typeof settings.reason === 'string' && settings.reason.trim() ? settings.reason.trim() : 'Feriado nacional'
    };
  }

  private todayKey(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
    { id: 1, name: 'Extension de piernas', type: 'Fuerza de tren inferior', location: 'Zona de piernas', status: 'Operativa', nextMaintenance: '10 Oct 2026', photo: '/assets/img/machines/extension-piernas.png' },
    { id: 2, name: 'Remo sentado', type: 'Fuerza selectorizada', location: 'Zona de espalda', status: 'Operativa', nextMaintenance: '12 Oct 2026', photo: '/assets/img/machines/remo-sentado.png' },
    { id: 3, name: 'Jalon al pecho', type: 'Polea alta', location: 'Zona de espalda', status: 'Operativa', nextMaintenance: '14 Oct 2026', photo: '/assets/img/machines/jalon-al-pecho.png' },
    { id: 4, name: 'Estacion de poleas', type: 'Multiestacion', location: 'Zona funcional', status: 'Operativa', nextMaintenance: '16 Oct 2026', photo: '/assets/img/machines/estacion-poleas.png' },
    { id: 5, name: 'Polea alta', type: 'Fuerza guiada', location: 'Zona de espalda', status: 'Operativa', nextMaintenance: '18 Oct 2026', photo: '/assets/img/machines/polea-alta.png' },
    { id: 6, name: 'Banco Scott', type: 'Peso libre asistido', location: 'Zona de brazos', status: 'Operativa', nextMaintenance: '20 Oct 2026', photo: '/assets/img/machines/banco-scott.png' },
    { id: 7, name: 'Press de pecho', type: 'Fuerza selectorizada', location: 'Zona superior', status: 'Operativa', nextMaintenance: '22 Oct 2026', photo: '/assets/img/machines/press-pecho.png' }
  ];

  pedidosTienda: PedidoTienda[] = [];

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
