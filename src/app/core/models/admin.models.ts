export type AdminModule =
  | 'clients'
  | 'memberships'
  | 'attendance'
  | 'payments'
  | 'supplements'
  | 'machines'
  | 'reports';

export interface PageMeta {
  module: AdminModule;
  eyebrow: string;
  title: string;
}

export interface Client {
  id: number;
  name: string;
  document: string;
  phone: string;
  plan: string;
  joined: string;
  status: 'Activo' | 'Inactivo';
}

export interface Membership {
  id: number;
  member: string;
  plan: string;
  start: string;
  end: string;
  days: number;
  status: 'Activa' | 'Por vencer' | 'Vencida';
}

export interface AttendanceRecord {
  id: number;
  member: string;
  time: string;
  access: string;
  status: string;
}

export interface Payment {
  id: number;
  member: string;
  concept: string;
  method: string;
  date: string;
  amount: number;
  status: 'Pagado' | 'Pendiente';
}

export interface Supplement {
  id: number;
  name: string;
  category: string;
  description: string;
  stock: number;
  minStock: number;
  price: number;
  photo: string;
}

export interface Machine {
  id: number;
  name: string;
  type: string;
  location: string;
  status: 'Operativa' | 'Mantenimiento' | 'Fuera de servicio';
  nextMaintenance: string;
  photo: string;
}

export interface DetailRecord {
  title: string;
  subtitle: string;
  status: string;
  photo: string;
  fields: Array<{ label: string; value: string }>;
}

export interface AdminAlert {
  type: 'warning' | 'danger' | 'stock';
  title: string;
  detail: string;
  route: string;
}
