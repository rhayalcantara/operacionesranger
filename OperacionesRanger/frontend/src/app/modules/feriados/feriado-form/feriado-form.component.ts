import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
  AsyncValidatorFn
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { Observable, of } from 'rxjs';
import {
  map,
  catchError,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  first
} from 'rxjs/operators';

import {
  FeriadosService,
  Feriado,
  TipoFeriado
} from '../../../core/services/feriados.service';

/**
 * Componente de formulario para crear/editar feriados
 * Se abre como dialog modal
 */
@Component({
  selector: 'app-feriado-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule
  ],
  templateUrl: './feriado-form.component.html',
  styleUrls: ['./feriado-form.component.scss']
})
export class FeriadoFormComponent implements OnInit {
  feriadoForm!: FormGroup;
  isLoading = false;
  isEditMode = false;

  // Opciones de tipo de feriado
  tiposFeriado = [
    { value: TipoFeriado.NACIONAL, label: 'Nacional (Recurrente)' },
    { value: TipoFeriado.DECRETO, label: 'Decreto (Especial)' }
  ];

  constructor(
    private fb: FormBuilder,
    private feriadosService: FeriadosService,
    private dialogRef: MatDialogRef<FeriadoFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { feriado?: Feriado; fecha?: string },
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.isEditMode = !!this.data?.feriado;
    this.buildForm();
  }

  /**
   * Construir formulario reactivo
   */
  buildForm(): void {
    this.feriadoForm = this.fb.group({
      fecha: [
        '',
        [Validators.required],
        [this.fechaUnicaValidator()]
      ],
      nombre: [
        '',
        [Validators.required, Validators.minLength(3), Validators.maxLength(100)]
      ],
      tipo: [
        TipoFeriado.NACIONAL,
        [Validators.required]
      ],
      descripcion: [
        '',
        [Validators.maxLength(500)]
      ]
    });

    // Si es edición, cargar datos del feriado
    if (this.isEditMode && this.data.feriado) {
      const feriado = this.data.feriado;
      this.feriadoForm.patchValue({
        fecha: new Date(feriado.fecha), // Convertir string a Date para datepicker
        nombre: feriado.nombre,
        tipo: feriado.tipo,
        descripcion: feriado.descripcion || ''
      });
    } else if (this.data.fecha) {
      // Si se proporciona una fecha inicial (desde calendario)
      this.feriadoForm.patchValue({
        fecha: new Date(this.data.fecha)
      });
    }

    // Observar cambio de tipo para sugerir valores
    this.feriadoForm.get('tipo')?.valueChanges.subscribe(tipo => {
      // Esto podría usarse para autocompletar descripción en el futuro
    });
  }

  /**
   * Validador asíncrono para fecha única
   */
  fechaUnicaValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }

      // Convertir Date a string ISO (YYYY-MM-DD)
      const fecha = control.value instanceof Date
        ? control.value.toISOString().split('T')[0]
        : control.value;

      const excludeId = this.data?.feriado?.id;

      return of(fecha).pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(fechaStr =>
          this.feriadosService.validarFechaUnica(fechaStr, excludeId).pipe(
            map(esUnico => esUnico ? null : { fechaDuplicada: true }),
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
    const field = this.feriadoForm.get(fieldName);

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

    if (field.errors['fechaDuplicada']) {
      return 'Ya existe un feriado en esta fecha';
    }

    return 'Error de validación';
  }

  /**
   * Enviar formulario
   */
  onSubmit(): void {
    if (this.feriadoForm.invalid) {
      this.feriadoForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const formValue = this.feriadoForm.value;

    // Convertir Date a string ISO (YYYY-MM-DD)
    const feriadoData = {
      ...formValue,
      fecha: formValue.fecha instanceof Date
        ? formValue.fecha.toISOString().split('T')[0]
        : formValue.fecha,
      descripcion: formValue.descripcion || null
    };

    const observable = this.isEditMode
      ? this.feriadosService.update(this.data.feriado!.id, feriadoData)
      : this.feriadosService.create(feriadoData);

    observable.subscribe({
      next: (feriado) => {
        const mensaje = this.isEditMode
          ? 'Feriado actualizado exitosamente'
          : 'Feriado creado exitosamente';

        this.snackBar.open(mensaje, 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });

        this.dialogRef.close(feriado);
      },
      error: (error) => {
        console.error('Error al guardar feriado:', error);

        let mensaje = 'Error al guardar feriado';
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

  /**
   * Cancelar y cerrar dialog
   */
  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * Obtiene el título del dialog
   */
  getTitle(): string {
    return this.isEditMode ? 'Editar Feriado' : 'Nuevo Feriado';
  }

  /**
   * Obtiene texto del helper para tipo de feriado
   */
  getTipoHelperText(): string {
    const tipo = this.feriadoForm.get('tipo')?.value;
    if (tipo === TipoFeriado.NACIONAL) {
      return 'Los feriados nacionales se repiten cada año en la misma fecha';
    } else if (tipo === TipoFeriado.DECRETO) {
      return 'Los feriados por decreto son especiales y no recurrentes';
    }
    return '';
  }
}
