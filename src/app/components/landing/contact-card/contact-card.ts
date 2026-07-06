import { Component, Input } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { DatosGimnasioService } from '../../../core/servicios/datos-gimnasio.service';

@Component({
  selector: 'app-contact-card',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './contact-card.html',
  styleUrl: './contact-card.css'
})
export class ContactCardComponent {
  @Input() gymName = 'GX GYM';
  @Input() address = 'Quito, Ecuador';
  @Input() phone = '0980674115';
  @Input() email = 'fitadmin@gmail.com';
  @Input() openingHours = 'Lunes a Viernes 08:00 - 21:00';
  @Input() whatsappUrl = 'https://wa.me/593980674115';
  @Input() mapUrl = 'https://www.google.com/maps/search/?api=1&query=GX%20GYM%20Quito';

  submitted = false;
  isSending = false;
  message = '';
  formData = {
    name: '',
    email: '',
    phone: '',
    message: ''
  };

  constructor(private data: DatosGimnasioService) {}

  submit(form: NgForm): void {
    this.submitted = true;
    this.message = '';

    if (form.invalid) {
      return;
    }

    this.isSending = true;
    this.data.enviarContacto(this.formData).subscribe({
      next: () => {
        this.message = 'Mensaje enviado correctamente. Te contactaremos pronto.';
        this.submitted = false;
        this.formData = { name: '', email: '', phone: '', message: '' };
        form.resetForm(this.formData);
      },
      error: () => {
        this.message = 'No se pudo enviar el mensaje. Intenta nuevamente.';
      },
      complete: () => {
        this.isSending = false;
      }
    });
  }
}
