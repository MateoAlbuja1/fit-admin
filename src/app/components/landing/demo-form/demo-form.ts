import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { DatosGimnasioService } from '../../../core/servicios/datos-gimnasio.service';

interface RegistrationForm {
  fullName: string;
  age: number | null;
  phone: string;
  email: string;
  planType: string;
  goal: string;
  schedule: string;
  message: string;
}

@Component({
  selector: 'app-demo-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './demo-form.html',
  styleUrl: './demo-form.css'
})
export class DemoFormComponent implements OnChanges {
  @Input() selectedPlan = '';
  @Input() gymName = 'GX GYM';

  submitted = false;
  isSending = false;
  successMessage = '';
  errorMessage = '';

  readonly planOptions = ['Plan diario', 'Plan mensual', 'Plan trimestral', 'Plan semestral', 'Plan anual'];
  readonly goalOptions = [
    'Bajar de peso',
    'Ganar masa muscular',
    'Mejorar condicion fisica',
    'Entrenamiento funcional',
    'Salud y bienestar',
    'Otro'
  ];
  readonly scheduleOptions = ['Manana', 'Mediodia', 'Tarde', 'Noche', 'Fin de semana'];

  formData: RegistrationForm = this.emptyForm();

  constructor(private data: DatosGimnasioService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedPlan'] && this.selectedPlan) {
      this.formData.planType = this.selectedPlan;
    }
  }

  submit(form: NgForm): void {
    this.submitted = true;
    this.successMessage = '';
    this.errorMessage = '';

    if (form.invalid || this.formData.age === null || this.formData.age < 12) {
      return;
    }

    this.isSending = true;
    this.data.enviarSolicitudDemo({
      name: this.formData.fullName.trim(),
      email: this.formData.email.trim(),
      phone: this.formData.phone.trim(),
      message: this.buildMessage()
    }).subscribe({
      next: () => {
        this.successMessage = 'Inscripcion enviada correctamente. Pronto nos pondremos en contacto contigo.';
        this.submitted = false;
        this.formData = this.emptyForm();
        form.resetForm(this.formData);
      },
      error: () => {
        this.errorMessage = 'No se pudo enviar la inscripcion. Intenta nuevamente.';
      },
      complete: () => {
        this.isSending = false;
      }
    });
  }

  private buildMessage(): string {
    return [
      `Edad: ${this.formData.age}`,
      `Plan: ${this.formData.planType}`,
      `Objetivo: ${this.formData.goal}`,
      `Horario: ${this.formData.schedule}`,
      this.formData.message.trim() ? `Mensaje: ${this.formData.message.trim()}` : ''
    ].filter(Boolean).join('\n');
  }

  private emptyForm(): RegistrationForm {
    return {
      fullName: '',
      age: null,
      phone: '',
      email: '',
      planType: '',
      goal: '',
      schedule: '',
      message: ''
    };
  }
}
