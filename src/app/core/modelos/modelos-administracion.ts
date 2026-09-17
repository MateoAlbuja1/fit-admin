export type ModuloAdministrativo =
  | 'usuarios'
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

export interface UsuarioRegistrado {
  id: number;
  username: string;
  email: string | null;
  fullName: string;
  phone: string | null;
  role: 'ADMIN' | 'RECEPCION' | 'CLIENTE';
  clientId: number | null;
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface Cliente {
  id: number;
  name: string;
  document: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  birthDate?: string | null;
  plan: string;
  joined: string;
  status: 'Activo' | 'Inactivo';
  notes?: string | null;
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
  status?: 'Activo' | 'Inactivo';
  visibleEnTienda?: boolean;
  visibleInStore?: boolean;
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
  status: 'Nuevo' | 'Contactado' | 'Confirmado' | 'Preparado' | 'Pago pendiente' | 'Pagado' | 'Entregado' | 'Cancelado';
  channel: string;
  total: number;
  paymentMethod?: string;
  paypalOrderId?: string;
  paypalCaptureId?: string;
  paidAt?: string | null;
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
  maintenanceDate?: string;
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
  id?: string;
  type: 'warning' | 'danger' | 'stock';
  category?: string;
  title: string;
  detail: string;
  route: string;
  read?: boolean;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
