import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

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

  submitted = false;
  successMessage = '';

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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedPlan'] && this.selectedPlan) {
      this.formData.planType = this.selectedPlan;
    }
  }

  submit(form: NgForm): void {
    this.submitted = true;
    this.successMessage = '';

    if (form.invalid || this.formData.age === null || this.formData.age < 12) {
      return;
    }

    this.successMessage = 'Inscripcion enviada correctamente. Pronto nos pondremos en contacto contigo.';
    this.submitted = false;
    form.resetForm(this.emptyForm());
    this.formData = this.emptyForm();
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
