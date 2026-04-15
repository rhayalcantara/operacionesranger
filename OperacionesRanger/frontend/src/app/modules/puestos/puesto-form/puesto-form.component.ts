import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
  AsyncValidatorFn
} from '@angular/forms';
import { Subject, takeUntil, Observable, of, map, catchError, debounceTime, switchMap } from 'rxjs';

// Angular Material
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Services
import { PuestosService, Puesto } from '../../../core/services/puestos.service';
import { ClientesService, Cliente } from '../../../core/services/clientes.service';
import { UbicacionesService, Ubicacion } from '../../../core/services/ubicaciones.service';

@Component({
  selector: 'app-puesto-form',
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
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './puesto-form.component.html',
  styleUrls: ['./puesto-form.component.scss']
})
export class PuestoFormComponent implements OnInit, OnDestroy {
  puestoForm!: FormGroup;
  isLoading = false;
  isEditMode = false;

  clientes: Cliente[] = [];
  ubicacionesDisponibles: Ubicacion[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private puestosService: PuestosService,
    private clientesService: ClientesService,
    private ubicacionesService: UbicacionesService,
    private dialogRef: MatDialogRef<PuestoFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { puesto?: Puesto },
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.isEditMode = !!this.data?.puesto;
    this.cargarClientes();
    this.buildForm();
    this.setupClienteUbicacionListener();

    // Si es edición, prellenar cliente y cargar ubicaciones
    const clienteIdEdit = (this.data.puesto as any)?.cliente_id || this.data.puesto?.ubicacion?.cliente?.id;
    if (this.isEditMode && clienteIdEdit) {
      this.puestoForm.patchValue({ cliente_id_selector: clienteIdEdit });
      this.cargarUbicacionesPorCliente(clienteIdEdit);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Construye el formulario con validaciones
   */
  buildForm(): void {
    this.puestoForm = this.fb.group({
      cliente_id_selector: [null, Validators.required],
      ubicacion_id: [null, Validators.required],
      codigo: [
        '',
        [Validators.required],
        [this.codigoUnicoValidator()]
      ],
      nombre: [
        '',
        [Validators.required, Validators.minLength(1), Validators.maxLength(150)]
      ],
      descripcion: ['', Validators.maxLength(1000)],
      cantidad_guardianes: [1, [Validators.min(1), Validators.max(10)]],
      requiere_turno_diurno: [true],
      requiere_turno_nocturno: [true],
      activo: [true]
    });

    // Prellenar datos si es edición
    if (this.isEditMode && this.data.puesto) {
      const puesto = this.data.puesto as any;
      this.puestoForm.patchValue({
        ...this.data.puesto,
        cliente_id_selector: puesto.cliente_id || this.data.puesto.ubicacion?.cliente?.id
      });
    }
  }

  /**
   * Carga lista de clientes activos
   */
  cargarClientes(): void {
    this.clientesService
      .getAll({ activo: true, pageSize: 1000 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.clientes = response.data;
          // Re-aplicar cliente_id después de cargar lista
          if (this.isEditMode && this.data.puesto) {
            const clienteId = (this.data.puesto as any).cliente_id || this.data.puesto.ubicacion?.cliente?.id;
            if (clienteId) {
              this.puestoForm.patchValue({ cliente_id_selector: clienteId });
              this.cargarUbicacionesPorCliente(clienteId);
            }
          }
        },
        error: (error) => {
          console.error('Error al cargar clientes:', error);
          this.snackBar.open('Error al cargar clientes', 'Cerrar', {
            duration: 3000
          });
        }
      });
  }

  /**
   * Configura listener para el selector jerárquico Cliente → Ubicación
   */
  setupClienteUbicacionListener(): void {
    this.puestoForm
      .get('cliente_id_selector')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((clienteId) => {
        // Limpiar ubicación al cambiar cliente
        this.puestoForm.patchValue({ ubicacion_id: null });
        this.ubicacionesDisponibles = [];

        // Cargar ubicaciones del cliente
        if (clienteId) {
          this.cargarUbicacionesPorCliente(clienteId);
        }

        // Re-validar código cuando cambie la ubicación
        this.puestoForm.get('codigo')?.updateValueAndValidity();
      });

    // Re-validar código cuando cambie la ubicación
    this.puestoForm
      .get('ubicacion_id')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.puestoForm.get('codigo')?.updateValueAndValidity();
      });
  }

  /**
   * Carga ubicaciones de un cliente específico
   */
  cargarUbicacionesPorCliente(clienteId: number): void {
    this.ubicacionesService
      .getAll({ cliente_id: clienteId, activo: true, pageSize: 1000 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.ubicacionesDisponibles = response.data;

          // Si es edición, seleccionar la ubicación correspondiente
          if (this.isEditMode && this.data.puesto) {
            this.puestoForm.patchValue({
              ubicacion_id: this.data.puesto.ubicacion_id
            });
          }
        },
        error: (error) => {
          console.error('Error al cargar ubicaciones:', error);
          this.snackBar.open('Error al cargar ubicaciones', 'Cerrar', {
            duration: 3000
          });
        }
      });
  }

  /**
   * Maneja cambio de cliente
   */
  onClienteChange(): void {
    // La lógica está en setupClienteUbicacionListener
  }

  /**
   * Validador asíncrono para código único por ubicación
   */
  codigoUnicoValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const ubicacionId = this.puestoForm?.get('ubicacion_id')?.value;
      const codigo = control.value;

      if (!ubicacionId || !codigo) {
        return of(null);
      }

      const excludeId = this.data?.puesto?.id;

      return control.valueChanges.pipe(
        debounceTime(500),
        switchMap(() =>
          this.puestosService
            .validarCodigoUnico(ubicacionId, codigo, excludeId)
            .pipe(
              map((esUnico) => (esUnico ? null : { codigoDuplicado: true })),
              catchError(() => of(null))
            )
        )
      );
    };
  }


  /**
   * Envía el formulario
   */
  onSubmit(): void {
    if (this.puestoForm.invalid) {
      this.puestoForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    // Preparar datos (excluir cliente_id_selector que es solo para UI)
    const { cliente_id_selector, ...puestoData } = this.puestoForm.value;

    // Convertir 1/0 a boolean para campos que el backend espera como boolean
    puestoData.requiere_turno_diurno = !!puestoData.requiere_turno_diurno;
    puestoData.requiere_turno_nocturno = !!puestoData.requiere_turno_nocturno;
    puestoData.activo = !!puestoData.activo;

    const request$ = this.isEditMode
      ? this.puestosService.update(this.data.puesto!.id, puestoData)
      : this.puestosService.create(puestoData);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        const mensaje = this.isEditMode
          ? 'Puesto actualizado exitosamente'
          : 'Puesto creado exitosamente';

        this.snackBar.open(mensaje, 'Cerrar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Error al guardar puesto:', error);
        const mensaje =
          error.error?.message || 'Error al guardar puesto';

        this.snackBar.open(mensaje, 'Cerrar', { duration: 5000 });
        this.isLoading = false;
      }
    });
  }

  /**
   * Cancela y cierra el dialog
   */
  onCancel(): void {
    this.dialogRef.close(false);
  }
}
