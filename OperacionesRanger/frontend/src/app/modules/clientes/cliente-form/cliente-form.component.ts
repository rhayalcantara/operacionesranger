import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, AsyncValidatorFn } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ClientesService, Cliente } from '../../../core/services/clientes.service';
import { Observable, of } from 'rxjs';
import { map, catchError, debounceTime, distinctUntilChanged, switchMap, first } from 'rxjs/operators';

@Component({
  selector: 'app-cliente-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './cliente-form.component.html',
  styleUrls: ['./cliente-form.component.scss']
})
export class ClienteFormComponent implements OnInit {
  clienteForm!: FormGroup;
  isLoading = false;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private clientesService: ClientesService,
    private dialogRef: MatDialogRef<ClienteFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { cliente?: Cliente },
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.isEditMode = !!this.data?.cliente;
    this.buildForm();
  }

  buildForm(): void {
    this.clienteForm = this.fb.group({
      codigo: [{ value: '', disabled: this.isEditMode }],
      nombre: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100)
        ]
      ],
      ruc: [
        '',
        [
          Validators.required,
          Validators.pattern(/^\d{9}$/)
        ],
        [this.rucUnicoValidator()]
      ],
      direccion: ['', Validators.maxLength(255)],
      telefono: ['', Validators.pattern(/^\(\d{3}\) \d{3}-\d{4}$/)],
      email: ['', Validators.email],
      contacto_nombre: ['', Validators.maxLength(100)],
      activo: [true]
    });

    if (this.isEditMode && this.data.cliente) {
      this.clienteForm.patchValue(this.data.cliente);
    }
  }

  /**
   * Validador asíncrono para RUC único
   */
  rucUnicoValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }

      const excludeId = this.data?.cliente?.id;

      return of(control.value).pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(ruc =>
          this.clientesService.validarRucUnico(ruc, excludeId).pipe(
            map(esUnico => esUnico ? null : { rucDuplicado: true }),
            catchError(() => of(null))
          )
        ),
        first()
      );
    };
  }

  /**
   * Obtiene mensaje de error para campo
   */
  getErrorMessage(fieldName: string): string {
    const field = this.clienteForm.get(fieldName);

    if (!field || !field.errors || !field.touched) {
      return '';
    }

    if (field.errors['required']) {
      return 'Este campo es requerido';
    }

    if (field.errors['minlength']) {
      const minLength = field.errors['minlength'].requiredLength;
      return `Mínimo ${minLength} caracteres`;
    }

    if (field.errors['maxlength']) {
      const maxLength = field.errors['maxlength'].requiredLength;
      return `Máximo ${maxLength} caracteres`;
    }

    if (field.errors['pattern']) {
      if (fieldName === 'ruc') {
        return 'El RUC debe tener 9 dígitos';
      }
      if (fieldName === 'telefono') {
        return 'Formato: (809) 123-4567';
      }
    }

    if (field.errors['email']) {
      return 'Email inválido';
    }

    if (field.errors['rucDuplicado']) {
      return 'Este RUC ya está registrado';
    }

    return 'Error de validación';
  }

  onSubmit(): void {
    if (this.clienteForm.invalid) {
      this.clienteForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const formValue = this.clienteForm.getRawValue();

    const observable = this.isEditMode
      ? this.clientesService.update(this.data.cliente!.id, formValue)
      : this.clientesService.create(formValue);

    observable.subscribe({
      next: (cliente) => {
        const mensaje = this.isEditMode
          ? 'Cliente actualizado exitosamente'
          : 'Cliente creado exitosamente';

        this.snackBar.open(mensaje, 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });

        this.dialogRef.close(cliente);
      },
      error: (error) => {
        console.error('Error al guardar cliente:', error);

        let mensaje = 'Error al guardar cliente';
        if (error.error?.message) {
          mensaje += ': ' + error.error.message;
        }

        this.snackBar.open(mensaje, 'Cerrar', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });

        this.isLoading = false;
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
