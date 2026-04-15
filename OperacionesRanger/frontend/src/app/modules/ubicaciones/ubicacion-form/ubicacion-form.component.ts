import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, AsyncValidatorFn } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Observable, of } from 'rxjs';
import { map, catchError, debounceTime, switchMap } from 'rxjs/operators';

import { UbicacionesService, Ubicacion } from '../../../core/services/ubicaciones.service';
import { ClientesService, Cliente } from '../../../core/services/clientes.service';
import { PROVINCIAS_RD, MUNICIPIOS_POR_PROVINCIA, ProvinciaOption } from '../../../core/constants/provincias-municipios';

@Component({
  selector: 'app-ubicacion-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './ubicacion-form.component.html',
  styleUrls: ['./ubicacion-form.component.scss']
})
export class UbicacionFormComponent implements OnInit {
  ubicacionForm!: FormGroup;
  isLoading = false;
  isEditMode = false;

  clientes: Cliente[] = [];
  provincias: ProvinciaOption[] = PROVINCIAS_RD;
  municipiosDisponibles: string[] = [];

  constructor(
    private fb: FormBuilder,
    private ubicacionesService: UbicacionesService,
    private clientesService: ClientesService,
    private dialogRef: MatDialogRef<UbicacionFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { ubicacion?: Ubicacion },
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.isEditMode = !!this.data?.ubicacion;
    this.cargarClientes();
    this.buildForm();
    this.setupProvinciaMunicipioListener();
  }

  /**
   * Carga la lista de clientes activos
   */
  cargarClientes(): void {
    this.clientesService.getAll({ activo: true, pageSize: 1000 })
      .subscribe({
        next: (response) => {
          this.clientes = response.data;
          // Re-aplicar cliente_id después de cargar la lista de clientes
          if (this.isEditMode && this.data.ubicacion?.cliente_id) {
            this.ubicacionForm.patchValue({ cliente_id: this.data.ubicacion.cliente_id });
          }
        },
        error: (error) => {
          console.error('Error al cargar clientes:', error);
          this.snackBar.open('Error al cargar la lista de clientes', 'Cerrar', { duration: 3000 });
        }
      });
  }

  /**
   * Construye el formulario reactivo con validaciones
   */
  buildForm(): void {
    this.ubicacionForm = this.fb.group({
      cliente_id: [null, Validators.required],
      codigo: ['', null, [this.codigoUnicoValidator()]],
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      direccion: ['', Validators.maxLength(255)],
      provincia: [null],
      municipio: [null],
      coordenadas_gps: ['', [this.coordenadasGpsValidator()]],
      activo: [true]
    });

    if (this.isEditMode && this.data.ubicacion) {
      const ubicacion = this.data.ubicacion as any;
      this.ubicacionForm.patchValue(ubicacion);

      // Reconstruir coordenadas_gps desde latitud/longitud si existen
      if (ubicacion.latitud && ubicacion.longitud) {
        this.ubicacionForm.patchValue({
          coordenadas_gps: `${ubicacion.latitud},${ubicacion.longitud}`
        });
      }

      // Cargar municipios de la provincia prellenada
      if (ubicacion.provincia) {
        this.municipiosDisponibles = MUNICIPIOS_POR_PROVINCIA[ubicacion.provincia] || [];
      }
    }
  }

  /**
   * Configura el listener para el selector en cascada Provincia → Municipio
   */
  setupProvinciaMunicipioListener(): void {
    this.ubicacionForm.get('provincia')?.valueChanges.subscribe(provincia => {
      // Limpiar municipio al cambiar provincia
      this.ubicacionForm.patchValue({ municipio: null });

      // Actualizar lista de municipios
      this.municipiosDisponibles = provincia
        ? MUNICIPIOS_POR_PROVINCIA[provincia] || []
        : [];
    });
  }

  /**
   * Validador de formato de coordenadas GPS
   * Formato esperado: "lat,lng" (ej: "18.4861,-69.9312")
   */
  coordenadasGpsValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const pattern = /^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/;
      return pattern.test(control.value.trim()) ? null : { formatoInvalido: true };
    };
  }

  /**
   * Validador asíncrono para verificar unicidad del código dentro del cliente
   */
  codigoUnicoValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const clienteId = this.ubicacionForm?.get('cliente_id')?.value;

      if (!clienteId || !control.value) {
        return of(null);
      }

      const excludeId = this.data?.ubicacion?.id;

      return of(control.value).pipe(
        debounceTime(500),
        switchMap(codigo =>
          this.ubicacionesService.validarCodigoUnico(clienteId, codigo, excludeId)
        ),
        map(esUnico => esUnico ? null : { codigoDuplicado: true }),
        catchError(() => of(null))
      );
    };
  }

  /**
   * Obtiene el mensaje de error para un campo específico
   */
  getErrorMessage(fieldName: string): string {
    const field = this.ubicacionForm.get(fieldName);

    if (!field || !field.errors) return '';

    if (field.errors['required']) {
      return 'Este campo es requerido';
    }
    if (field.errors['minlength']) {
      return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
    }
    if (field.errors['maxlength']) {
      return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
    }
    if (field.errors['formatoInvalido']) {
      return 'Formato inválido (use: lat,lng)';
    }
    if (field.errors['codigoDuplicado']) {
      return 'El código ya existe para este cliente';
    }

    return 'Campo inválido';
  }

  /**
   * Maneja el envío del formulario
   */
  onSubmit(): void {
    if (this.ubicacionForm.invalid) {
      this.ubicacionForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const ubicacionData = { ...this.ubicacionForm.value };
    // Convertir 1/0 a boolean para el backend
    ubicacionData.activo = !!ubicacionData.activo;
    // Convertir string vacío a null para campos opcionales
    if (!ubicacionData.coordenadas_gps) ubicacionData.coordenadas_gps = null;
    if (!ubicacionData.direccion) ubicacionData.direccion = null;

    const operation = this.isEditMode
      ? this.ubicacionesService.update(this.data.ubicacion!.id, ubicacionData)
      : this.ubicacionesService.create(ubicacionData);

    operation.subscribe({
      next: (ubicacion) => {
        const mensaje = this.isEditMode
          ? 'Ubicación actualizada exitosamente'
          : 'Ubicación creada exitosamente';

        this.snackBar.open(mensaje, 'Cerrar', { duration: 3000 });
        this.dialogRef.close(ubicacion);
      },
      error: (error) => {
        console.error('Error al guardar ubicación:', error);
        const mensajeError = error.error?.message || 'Error al guardar ubicación';
        this.snackBar.open(`Error: ${mensajeError}`, 'Cerrar', { duration: 5000 });
        this.isLoading = false;
      }
    });
  }

  /**
   * Cierra el diálogo sin guardar
   */
  onCancel(): void {
    this.dialogRef.close();
  }
}
