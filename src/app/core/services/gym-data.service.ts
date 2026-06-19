import { Injectable } from '@angular/core';
import {
  AdminAlert,
  AttendanceRecord,
  Client,
  Machine,
  Membership,
  Payment,
  Supplement
} from '../models/admin.models';

@Injectable({ providedIn: 'root' })
export class GymDataService {
  clients: Client[] = [
    { id: 1042, name: 'María González', document: '1723456789', phone: '099 452 1830', plan: 'Plan anual', joined: '08 Jun 2026', status: 'Activo' },
    { id: 1041, name: 'Carlos Mendoza', document: '1718294056', phone: '098 116 4205', plan: 'Plan mensual', joined: '04 Jun 2026', status: 'Activo' },
    { id: 1038, name: 'Andrea Pérez', document: '1751839204', phone: '096 730 2241', plan: 'Plan trimestral', joined: '28 May 2026', status: 'Activo' },
    { id: 1024, name: 'José Rivera', document: '1709483621', phone: '099 044 7612', plan: 'Plan mensual', joined: '12 Abr 2026', status: 'Inactivo' }
  ];

  memberships: Membership[] = [
    { id: 1, member: 'María González', plan: 'Anual', start: '08 Jun 2026', end: '08 Jun 2027', days: 355, status: 'Activa' },
    { id: 2, member: 'Carlos Mendoza', plan: 'Mensual', start: '04 Jun 2026', end: '04 Jul 2026', days: 16, status: 'Por vencer' },
    { id: 3, member: 'Andrea Pérez', plan: 'Trimestral', start: '28 May 2026', end: '28 Ago 2026', days: 71, status: 'Activa' },
    { id: 4, member: 'José Rivera', plan: 'Mensual', start: '12 Abr 2026', end: '12 May 2026', days: 0, status: 'Vencida' }
  ];

  attendance: AttendanceRecord[] = [
    { id: 1, member: 'José Rivera', time: '10:42', access: 'Acceso principal', status: 'Ingreso correcto' },
    { id: 2, member: 'María Silva', time: '10:18', access: 'Acceso principal', status: 'Ingreso correcto' },
    { id: 3, member: 'Andrea Pérez', time: '09:56', access: 'Acceso principal', status: 'Ingreso correcto' },
    { id: 4, member: 'Carlos Mendoza', time: '09:21', access: 'Acceso principal', status: 'Ingreso correcto' }
  ];

  payments: Payment[] = [
    { id: 2048, member: 'Andrea Pérez', concept: 'Membresía trimestral', method: 'Tarjeta', date: '18 Jun 2026', amount: 85, status: 'Pagado' },
    { id: 2047, member: 'Carlos Mendoza', concept: 'Membresía mensual', method: 'Efectivo', date: '18 Jun 2026', amount: 35, status: 'Pagado' },
    { id: 2046, member: 'María Silva', concept: 'Whey Protein', method: 'Transferencia', date: '17 Jun 2026', amount: 45, status: 'Pagado' },
    { id: 2045, member: 'José Rivera', concept: 'Membresía mensual', method: 'Transferencia', date: '16 Jun 2026', amount: 35, status: 'Pendiente' }
  ];

  supplements: Supplement[] = [
    { id: 1, name: 'Whey Protein 2 lb', category: 'Proteína', description: 'Proteína de suero para recuperación y crecimiento muscular.', stock: 24, minStock: 8, price: 45, photo: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=900&q=80' },
    { id: 2, name: 'Creatina 300 g', category: 'Rendimiento', description: 'Monohidrato de creatina para fuerza y rendimiento físico.', stock: 18, minStock: 6, price: 29, photo: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=900&q=80' },
    { id: 3, name: 'Pre-entreno', category: 'Energía', description: 'Fórmula energética para mejorar intensidad y concentración.', stock: 5, minStock: 7, price: 32, photo: 'https://images.unsplash.com/photo-1594882645126-14020914d58d?auto=format&fit=crop&w=900&q=80' },
    { id: 4, name: 'BCAA 2:1:1', category: 'Aminoácidos', description: 'Aminoácidos para recuperación durante entrenamientos intensos.', stock: 14, minStock: 5, price: 27.5, photo: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=900&q=80' },
    { id: 5, name: 'Omega 3', category: 'Bienestar', description: 'Ácidos grasos esenciales para salud cardiovascular.', stock: 9, minStock: 5, price: 18, photo: 'https://images.unsplash.com/photo-1550572017-edd951b55104?auto=format&fit=crop&w=900&q=80' },
    { id: 6, name: 'Multivitamínico', category: 'Vitaminas', description: 'Complejo diario de vitaminas y minerales.', stock: 4, minStock: 6, price: 21, photo: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=900&q=80' },
    { id: 7, name: 'Barra proteica', category: 'Snack deportivo', description: 'Snack alto en proteína para después del entrenamiento.', stock: 31, minStock: 10, price: 3.5, photo: 'https://images.unsplash.com/photo-1622484212850-eb596d769edc?auto=format&fit=crop&w=900&q=80' }
  ];

  machines: Machine[] = [
    { id: 1, name: 'Prensa inclinada', type: 'Máquina de fuerza', location: 'Zona inferior', status: 'Operativa', nextMaintenance: '15 Jul 2026', photo: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1000&q=80' },
    { id: 2, name: 'Polea crossover', type: 'Multiestación', location: 'Zona funcional', status: 'Operativa', nextMaintenance: '28 Jun 2026', photo: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1000&q=80' },
    { id: 3, name: 'Caminadora profesional', type: 'Cardio', location: 'Zona cardio', status: 'Mantenimiento', nextMaintenance: '20 Jun 2026', photo: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&w=1000&q=80' },
    { id: 4, name: 'Bicicleta de spinning', type: 'Cardio indoor', location: 'Sala de cycling', status: 'Operativa', nextMaintenance: '22 Jul 2026', photo: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=1000&q=80' },
    { id: 5, name: 'Máquina Smith', type: 'Fuerza guiada', location: 'Zona de peso libre', status: 'Operativa', nextMaintenance: '05 Ago 2026', photo: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1000&q=80' },
    { id: 6, name: 'Extensión de cuádriceps', type: 'Fuerza selectorizada', location: 'Zona inferior', status: 'Operativa', nextMaintenance: '30 Jul 2026', photo: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1000&q=80' },
    { id: 7, name: 'Remo sentado', type: 'Fuerza selectorizada', location: 'Zona superior', status: 'Fuera de servicio', nextMaintenance: '19 Jun 2026', photo: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1000&q=80' }
  ];

  get alerts(): AdminAlert[] {
    const memberships: AdminAlert[] = this.memberships
      .filter(item => item.status !== 'Activa')
      .map(item => ({
        type: item.status === 'Vencida' ? 'danger' : 'warning',
        title: item.status === 'Vencida' ? `Membresía vencida · ${item.member}` : `Vence pronto · ${item.member}`,
        detail: item.status === 'Vencida' ? `Venció el ${item.end}` : `${item.days} días restantes · vence el ${item.end}`,
        route: '/membresias'
      }));
    const stock: AdminAlert[] = this.supplements
      .filter(item => item.stock <= item.minStock)
      .map(item => ({ type: 'stock', title: `Stock bajo · ${item.name}`, detail: `${item.stock} unidades · mínimo ${item.minStock}`, route: '/inventario/suplementos' }));
    return [...memberships, ...stock];
  }
}
