import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AccionPaginaAdminService } from '../../core/servicios/accion-pagina-admin.service';

interface HorarioAtencion {
  dia: string;
  apertura: string;
  cierre: string;
  activo: boolean;
}

type PanelConfiguracion = 'gimnasio' | 'administrador' | 'seguridad';

@Component({
  selector: 'app-pagina-configuracion',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.css'
})
export class PaginaConfiguracionComponent implements OnInit, OnDestroy {
  notice = '';
  activePanel: PanelConfiguracion = 'gimnasio';

  readonly panels: Array<{ id: PanelConfiguracion; label: string; description: string; icon: string }> = [
    { id: 'gimnasio', label: 'Datos del gimnasio', description: 'Sede, contacto y horarios', icon: 'M' },
    { id: 'administrador', label: 'Administrador', description: 'Cuenta y permisos', icon: 'A' },
    { id: 'seguridad', label: 'Acceso y respaldo', description: 'Seguridad y copias', icon: 'S' }
  ];

  gimnasio = {
    nombre: 'WX GYM',
    sede: 'Caupicho',
    ciudad: 'Quito',
    telefono: '0980674115',
    email: 'fitadmin@gmail.com',
    direccion: 'Quito, Ecuador - Caupicho'
  };

  cuenta = {
    administrador: 'Mateo Admin',
    rol: 'Administrador',
    usuario: 'admin',
    correo: 'fitadmin@gmail.com'
  };

  seguridad = {
    dobleFactor: false,
    bloqueoSesion: true,
    copiasAutomaticas: true,
    alertasCriticas: true
  };

  password = {
    actual: '',
    nueva: '',
    confirmar: ''
  };

  horarios: HorarioAtencion[] = [
    { dia: 'Lunes', apertura: '06:00', cierre: '22:00', activo: true },
    { dia: 'Martes', apertura: '06:00', cierre: '22:00', activo: true },
    { dia: 'Miércoles', apertura: '06:00', cierre: '22:00', activo: true },
    { dia: 'Jueves', apertura: '06:00', cierre: '22:00', activo: true },
    { dia: 'Viernes', apertura: '06:00', cierre: '22:00', activo: true },
    { dia: 'Sábado', apertura: '08:00', cierre: '16:00', activo: true },
    { dia: 'Domingo', apertura: '08:00', cierre: '13:00', activo: false }
  ];

  readonly loginHistory = [
    { date: '02/07/2026, 09:22', user: 'admin', device: 'Chrome en Windows', ip: '192.168.1.24', status: 'Exitoso' },
    { date: '01/07/2026, 18:40', user: 'admin', device: 'Edge en Windows', ip: '192.168.1.24', status: 'Exitoso' },
    { date: '29/06/2026, 22:11', user: 'admin', device: 'Firefox en Linux', ip: '181.198.12.44', status: 'Bloqueado' }
  ];

  constructor(private actions: AccionPaginaAdminService) {}

  ngOnInit(): void {
    this.actions.registrar('Guardar cambios', () => this.saveSettings());
  }

  ngOnDestroy(): void {
    this.actions.limpiar();
  }

  setPanel(panel: PanelConfiguracion): void {
    this.activePanel = panel;
    this.notice = '';
  }

  saveSettings(): void {
    this.notice = 'Configuración guardada correctamente.';
  }

  resetNotice(): void {
    this.notice = '';
  }
}
