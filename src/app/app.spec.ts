import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the official WhatsApp contact', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const whatsappLink = compiled.querySelector<HTMLAnchorElement>('.global-whatsapp');
    expect(whatsappLink?.getAttribute('aria-label')).toContain('WX GYM');
    expect(whatsappLink?.href).toContain('593969953775');
    expect(whatsappLink?.href).toContain(encodeURIComponent('Hola WX GYM, deseo información sobre el gimnasio.'));
  });
});
