import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ClienteFormComponent } from './cliente-form.component';

describe('ClienteFormComponent', () => {
  // Create mode tests
  describe('create mode', () => {
    let component: ClienteFormComponent;
    let fixture: ComponentFixture<ClienteFormComponent>;
    let dialogRef: { close: ReturnType<typeof vi.fn> };

    beforeEach(async () => {
      dialogRef = { close: vi.fn() };
      await TestBed.configureTestingModule({
        imports: [ClienteFormComponent],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          provideNoopAnimations(),
          { provide: MatDialogRef, useValue: dialogRef },
          { provide: MAT_DIALOG_DATA, useValue: {} },
        ],
      }).compileComponents();
      fixture = TestBed.createComponent(ClienteFormComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create in create mode', () => {
      expect(component).toBeTruthy();
      expect(component.isEditMode).toBe(false);
    });

    it('should have required validator on nombre', () => {
      const nombre = component.clienteForm.get('nombre');
      nombre?.setValue('');
      expect(nombre?.hasError('required')).toBe(true);
    });

    it('should validate nombre minLength of 3', () => {
      const nombre = component.clienteForm.get('nombre');
      nombre?.setValue('ab');
      expect(nombre?.hasError('minlength')).toBe(true);
      nombre?.setValue('abc');
      expect(nombre?.hasError('minlength')).toBe(false);
    });

    it('should validate ruc pattern (9 digits)', () => {
      const ruc = component.clienteForm.get('ruc');
      ruc?.setValue('abc');
      expect(ruc?.hasError('pattern')).toBe(true);
      ruc?.setValue('123456789');
      expect(ruc?.hasError('pattern')).toBe(false);
    });

    it('should close dialog on cancel', () => {
      component.onCancel();
      expect(dialogRef.close).toHaveBeenCalledWith();
    });

    it('should return correct error messages', () => {
      const nombre = component.clienteForm.get('nombre');
      nombre?.setValue('');
      nombre?.markAsTouched();
      expect(component.getErrorMessage('nombre')).toContain('requerido');
    });

    it('should not submit when form is invalid', () => {
      component.clienteForm.get('nombre')?.setValue('');
      component.onSubmit();
      expect(component.isLoading).toBe(false);
    });
  });

  // Edit mode tests
  describe('edit mode', () => {
    let component: ClienteFormComponent;
    let fixture: ComponentFixture<ClienteFormComponent>;
    const mockCliente = {
      id: 1,
      codigo: 'CLI-001',
      nombre: 'Existing Client',
      ruc: '123456789',
      activo: true
    };

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [ClienteFormComponent],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          provideNoopAnimations(),
          { provide: MatDialogRef, useValue: { close: vi.fn() } },
          { provide: MAT_DIALOG_DATA, useValue: { cliente: mockCliente } },
        ],
      }).compileComponents();
      fixture = TestBed.createComponent(ClienteFormComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create in edit mode', () => {
      expect(component.isEditMode).toBe(true);
    });

    it('should populate form with client data', () => {
      expect(component.clienteForm.get('nombre')?.value).toBe('Existing Client');
      expect(component.clienteForm.get('ruc')?.value).toBe('123456789');
    });

    it('should disable codigo field in edit mode', () => {
      expect(component.clienteForm.get('codigo')?.disabled).toBe(true);
    });
  });
});
