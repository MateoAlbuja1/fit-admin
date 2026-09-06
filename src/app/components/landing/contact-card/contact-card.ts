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
  @Input() gymName = 'WX GYM';
  @Input() address = 'Quito, Ecuador';
  @Input() phone = '0969953775';
  @Input() email = 'contacto@wxgym.local';
  @Input() openingHours = 'Lunes a Viernes 08:00 - 21:00 · Sábado 08:00 - 16:00';
  @Input() whatsappUrl = 'https://wa.me/593969953775?text=Hola%20WX%20GYM%2C%20deseo%20informaci%C3%B3n%20sobre%20el%20gimnasio.';
  @Input() mapUrl = 'https://www.google.com/maps/search/?api=1&query=WX%20GYM%20Quito';

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
