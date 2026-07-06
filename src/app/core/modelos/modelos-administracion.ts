export type ModuloAdministrativo =
  | 'clientes'
  | 'membresias'
  | 'asistencia'
  | 'pagos'
  | 'pedidos'
  | 'suplementos'
  | 'maquinas'
  | 'reportes'
  | 'configuracion';

export interface MetaPagina {
  modulo: ModuloAdministrativo;
  eyebrow: string;
  title: string;
}

export interface Cliente {
  id: number;
  name: string;
  document: string;
  phone: string;
  plan: string;
  joined: string;
  status: 'Activo' | 'Inactivo';
}

export interface Membresia {
  id: number;
  member: string;
  plan: string;
  start: string;
  end: string;
  days: number;
  status: 'Activa' | 'Por vencer' | 'Vencida';
}

export interface RegistroAsistencia {
  id: number;
  member: string;
  time: string;
  access: string;
  status: string;
}

export interface Pago {
  id: number;
  member: string;
  concept: string;
  method: string;
  date: string;
  amount: number;
  status: 'Pagado' | 'Pendiente' | 'Anulado';
}

export interface Suplemento {
  id: number;
  name: string;
  category: string;
  description: string;
  stock: number;
  minStock: number;
  price: number;
  photo: string;
  discount?: string;
  rating?: string;
  factsPhoto?: string;
  imageFit?: 'cover' | 'contain';
}

export interface PedidoTiendaItem {
  id: number;
  orderId: number;
  supplementId: number | null;
  productName: string;
  category: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface PedidoTienda {
  id: number;
  code: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes: string;
  status: 'Nuevo' | 'Contactado' | 'Confirmado' | 'Preparado' | 'Entregado' | 'Cancelado';
  channel: string;
  total: number;
  stockDeductedAt?: string | null;
  paymentId?: number | null;
  createdAt: string;
  updatedAt: string;
  items: PedidoTiendaItem[];
}

export interface Maquina {
  id: number;
  name: string;
  type: string;
  location: string;
  status: 'Operativa' | 'Mantenimiento' | 'Fuera de servicio';
  nextMaintenance: string;
  photo: string;
}

export interface DetalleRegistro {
  title: string;
  subtitle: string;
  status: string;
  photo: string;
  fields: Array<{ label: string; value: string }>;
}

export interface AlertaAdministrativa {
  type: 'warning' | 'danger' | 'stock';
  title: string;
  detail: string;
  route: string;
}
