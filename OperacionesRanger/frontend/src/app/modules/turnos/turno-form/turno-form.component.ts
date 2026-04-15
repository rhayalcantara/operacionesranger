import { Component, Inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  ValidatorFn,
  AbstractControl,
  ValidationErrors,
  AsyncValidatorFn
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';

import { Observable, Subject, combineLatest, of } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  first,
  map,
  startWith,
  switchMap,
  takeUntil
} from 'rxjs/operators';

import { Turno, TurnoCreateRequest, TurnosService } from '../../../core/services/turnos.service';
import { RrhhService, Guardian } from '../../../core/services/rrhh.service';
import { ClientesService, Cliente } from '../../../core/services/clientes.service';
import { UbicacionesService, Ubicacion } from '../../../core/services/ubicaciones.service';
import { PuestosService, Puesto } from '../../../core/services/puestos.service';

@Component({
  selector: 'app-turno-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatChipsModule,
    MatCardModule
  ],
  templateUrl: './turno-form.component.html',
  styleUrls: ['./turno-form.component.scss']
})
export class TurnoFormComponent implements OnInit, OnDestroy {
  // Form
  turnoForm!: FormGroup;
  isLoading = signal(false);
  isEditMode = false;

  // Cascading selector data
  clientes: Cliente[] = [];
  ubicacionesDisponibles: Ubicacion[] = [];
  puestosDisponibles: Puesto[] = [];

  // Autocomplete data
  guardianesFiltered!: Observable<Guardian[]>;
  searchControl = new FormControl('');

  // Result display
  turnoCreado?: Turno;

  // Flag to prevent cascade reset during edit patch
  private isPatching = false;

  // Unsubscribe
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private turnosService: TurnosService,
    private rrhhService: RrhhService,
    private clientesService: ClientesService,
    private ubicacionesService: UbicacionesService,
    private puestosService: PuestosService,
    private dialogRef: MatDialogRef<TurnoFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { turno?: Turno },
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.isEditMode = !!this.data?.turno;
    this.cargarClientes();
    this.buildForm();
    this.setupAutocomplete();
    this.setupCascadingSelectors();
    this.setupHorasCalculation();
  }

  /**
   * Build reactive form with validators
   */
  buildForm(): void {
    this.turnoForm = this.fb.group({
      // Guardian (autocomplete)
      empleado_id: [null, [Validators.required]],

      // Cascading selectors (separate controls)
      cliente_id_selector: [null, [Validators.required]],
      ubicacion_id_selector: [null, [Validators.required]],
      puesto_id: [null, [Validators.required]],

      // Date and time
      fecha: [null, [Validators.required, this.fechaMaximaValidator()]],
      hora_entrada: ['', [Validators.required]],
      hora_salida: ['', [Validators.required]],

      // Hours
      horas_normales: [0, [Validators.required, Validators.min(0), Validators.max(12)]],
      horas_extras: [0, [Validators.min(0), Validators.max(4)]],

      // Optional
      observaciones: ['', [Validators.maxLength(500)]]
    }, {
      validators: [this.horasTotalesValidator()],
      asyncValidators: [this.duplicadoValidator()]
    });

    if (this.isEditMode && this.data.turno) {
      this.patchFormForEdit();
    }
  }

  /**
   * Patch form for edit mode
   */
  patchFormForEdit(): void {
    const turno = this.data.turno!;

    // Patch basic fields
    this.turnoForm.patchValue({
      empleado_id: turno.empleado_id,
      puesto_id: turno.puesto_id,
      fecha: new Date(turno.fecha),
      hora_entrada: this.turnosService.formatTimeForForm(turno.hora_entrada),
      hora_salida: this.turnosService.formatTimeForForm(turno.hora_salida),
      horas_normales: turno.horas_normales,
      horas_extras: turno.horas_extras,
      observaciones: turno.observaciones
    });

    // Set autocomplete display
    if (turno.empleado) {
      const guardianDisplay = `${turno.empleado.nombre} (${turno.empleado.cedula})`;
      this.searchControl.setValue(guardianDisplay);
    }

    // Load cascading selectors for edit mode
    this.loadCascadingSelectorsForEdit(turno);
  }

  /**
   * Load cascading selectors (Cliente → Ubicación → Puesto) for edit mode.
   * Uses flat joined fields from the backend response, falls back to fetching puesto by ID.
   */
  private loadCascadingSelectorsForEdit(turno: Turno): void {
    if (turno.cliente_id && turno.ubicacion_id) {
      this.populateCascadeFromIds(turno.cliente_id, turno.ubicacion_id, turno.puesto_id);
    } else {
      // Fallback: fetch puesto by ID to get ubicacion.cliente
      this.puestosService.getById(turno.puesto_id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (puesto) => {
            if (puesto.ubicacion?.cliente?.id && puesto.ubicacion_id) {
              this.populateCascadeFromIds(
                puesto.ubicacion.cliente.id,
                puesto.ubicacion_id,
                turno.puesto_id
              );
            }
          },
          error: (error) => {
            console.error('Error cargando puesto para edición:', error);
          }
        });
    }
  }

  /**
   * Populate cascade selectors from known IDs without triggering resets
   */
  private populateCascadeFromIds(clienteId: number, ubicacionId: number, puestoId: number): void {
    this.isPatching = true;

    // Set cliente selector (triggers ubicaciones load via valueChanges)
    this.turnoForm.patchValue({ cliente_id_selector: clienteId });

    // Load ubicaciones, then set ubicacion and load puestos
    this.ubicacionesService.getAll({ cliente_id: clienteId, activo: true, pageSize: 1000 })
      .pipe(takeUntil(this.destroy$), first())
      .subscribe({
        next: (response) => {
          this.ubicacionesDisponibles = response.data;
          this.turnoForm.patchValue({ ubicacion_id_selector: ubicacionId });

          // Load puestos for the ubicacion
          this.puestosService.getAll({ ubicacion_id: ubicacionId, activo: true, pageSize: 1000 })
            .pipe(takeUntil(this.destroy$), first())
            .subscribe({
              next: (pResponse) => {
                this.puestosDisponibles = pResponse.data;
                this.turnoForm.patchValue({ puesto_id: puestoId });
                this.isPatching = false;
              },
              error: () => { this.isPatching = false; }
            });
        },
        error: () => { this.isPatching = false; }
      });
  }

  /**
   * Setup guardian autocomplete
   */
  setupAutocomplete(): void {
    this.guardianesFiltered = this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        if (typeof value === 'string' && value.length >= 2) {
          return this.rrhhService.buscarGuardianes(value).pipe(
            map(response => response.data || []),
            catchError(() => of([]))
          );
        }
        return of([]);
      })
    );
  }

  /**
   * Display function for autocomplete
   */
  displayGuardian(guardian: Guardian | null): string {
    if (!guardian) return '';
    return `${guardian.nombres} ${guardian.apellidos} (${guardian.cedula_empleado})`;
  }

  /**
   * Handle guardian selection
   */
  onGuardianSelected(guardian: Guardian): void {
    this.turnoForm.patchValue({ empleado_id: guardian.id_empleado });
  }

  /**
   * Clear guardian selection
   */
  onGuardianCleared(): void {
    this.searchControl.setValue('');
    this.turnoForm.patchValue({ empleado_id: null });
  }

  /**
   * Load clientes
   */
  cargarClientes(): void {
    this.clientesService.getAll({ activo: true, pageSize: 1000 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.clientes = response.data;
        },
        error: (error) => {
          console.error('Error cargando clientes:', error);
        }
      });
  }

  /**
   * Setup cascading selectors
   */
  setupCascadingSelectors(): void {
    // Cliente → Ubicación
    this.turnoForm.get('cliente_id_selector')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((clienteId) => {
        if (!this.isPatching) {
          this.turnoForm.patchValue({
            ubicacion_id_selector: null,
            puesto_id: null
          });
          this.ubicacionesDisponibles = [];
          this.puestosDisponibles = [];
        }

        if (clienteId) {
          this.cargarUbicacionesPorCliente(clienteId);
        }
      });

    // Ubicación → Puesto
    this.turnoForm.get('ubicacion_id_selector')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((ubicacionId) => {
        if (!this.isPatching) {
          this.turnoForm.patchValue({ puesto_id: null });
          this.puestosDisponibles = [];
        }

        if (ubicacionId) {
          this.cargarPuestosPorUbicacion(ubicacionId);
        }
      });
  }

  /**
   * Load ubicaciones by cliente
   */
  cargarUbicacionesPorCliente(clienteId: number): void {
    this.ubicacionesService.getAll({ cliente_id: clienteId, activo: true, pageSize: 1000 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.ubicacionesDisponibles = response.data;
        },
        error: (error) => {
          console.error('Error cargando ubicaciones:', error);
        }
      });
  }

  /**
   * Load puestos by ubicacion
   */
  cargarPuestosPorUbicacion(ubicacionId: number): void {
    this.puestosService.getAll({ ubicacion_id: ubicacionId, activo: true, pageSize: 1000 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.puestosDisponibles = response.data;
        },
        error: (error) => {
          console.error('Error cargando puestos:', error);
        }
      });
  }

  /**
   * Setup automatic hours calculation
   */
  setupHorasCalculation(): void {
    combineLatest([
      this.turnoForm.get('hora_entrada')!.valueChanges,
      this.turnoForm.get('hora_salida')!.valueChanges
    ])
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(500)
      )
      .subscribe(([entrada, salida]) => {
        if (entrada && salida) {
          const horasCalculadas = this.turnosService.calcularHorasNormales(entrada, salida);
          this.turnoForm.patchValue({ horas_normales: horasCalculadas }, { emitEvent: false });
        }
      });
  }

  /**
   * Custom validator: fecha maxima (max 7 days in future)
   */
  fechaMaximaValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const fecha = new Date(control.value);
      const hoy = new Date();
      const maxFecha = new Date(hoy);
      maxFecha.setDate(hoy.getDate() + 7);

      return fecha > maxFecha ? { fechaFutura: true } : null;
    };
  }

  /**
   * Custom validator: total hours cannot exceed 16
   */
  horasTotalesValidator(): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const normales = formGroup.get('horas_normales')?.value || 0;
      const extras = formGroup.get('horas_extras')?.value || 0;
      const total = normales + extras;

      return total > 16 ? { horasExcedidas: true } : null;
    };
  }

  /**
   * Async validator: check for duplicate shift
   */
  duplicadoValidator(): AsyncValidatorFn {
    return (formGroup: AbstractControl): Observable<ValidationErrors | null> => {
      const empleadoId = formGroup.get('empleado_id')?.value;
      const puestoId = formGroup.get('puesto_id')?.value;
      const fecha = formGroup.get('fecha')?.value;

      if (!empleadoId || !puestoId || !fecha) {
        return of(null);
      }

      const fechaStr = fecha instanceof Date
        ? fecha.toISOString().split('T')[0]
        : fecha;

      const excludeId = this.data?.turno?.id;

      return of({ empleadoId, puestoId, fechaStr }).pipe(
        debounceTime(500),
        switchMap(({ empleadoId, puestoId, fechaStr }) =>
          this.turnosService.validarDuplicado(empleadoId, puestoId, fechaStr, excludeId).pipe(
            map(esUnico => esUnico ? null : { turnoDuplicado: true }),
            catchError(() => of(null))
          )
        ),
        first()
      );
    };
  }

  /**
   * Get error message for a field
   */
  getErrorMessage(fieldName: string): string {
    const control = this.turnoForm.get(fieldName);
    if (!control || !control.errors) return '';

    if (control.hasError('required')) return 'Este campo es requerido';
    if (control.hasError('min')) return `Valor mínimo: ${control.errors['min'].min}`;
    if (control.hasError('max')) return `Valor máximo: ${control.errors['max'].max}`;
    if (control.hasError('maxlength')) return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    if (control.hasError('fechaFutura')) return 'No puede registrar turnos con más de 7 días de anticipación';

    return '';
  }

  /**
   * Submit form
   */
  onSubmit(): void {
    if (this.turnoForm.invalid) {
      this.turnoForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const formValue = this.turnoForm.getRawValue();

    // Format data for backend
    const turnoData: TurnoCreateRequest = {
      empleado_id: formValue.empleado_id,
      puesto_id: formValue.puesto_id,
      fecha: formValue.fecha instanceof Date
        ? formValue.fecha.toISOString().split('T')[0]
        : formValue.fecha,
      hora_entrada: this.turnosService.formatTimeForBackend(formValue.hora_entrada),
      hora_salida: this.turnosService.formatTimeForBackend(formValue.hora_salida),
      horas_normales: formValue.horas_normales,
      horas_extras: formValue.horas_extras,
      observaciones: formValue.observaciones || undefined
    };

    const observable = this.isEditMode
      ? this.turnosService.update(this.data.turno!.id, turnoData)
      : this.turnosService.create(turnoData);

    observable.subscribe({
      next: (turnoCreado) => {
        this.turnoCreado = turnoCreado;
        this.isLoading.set(false);

        const mensaje = this.isEditMode
          ? 'Turno actualizado exitosamente'
          : 'Turno registrado exitosamente';

        this.snackBar.open(mensaje, 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      },
      error: (error) => {
        console.error('Error guardando turno:', error);

        let mensaje = 'Error al guardar el turno';
        if (error.error?.message) {
          mensaje += ': ' + error.error.message;
        }

        this.snackBar.open(mensaje, 'Cerrar', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });

        this.isLoading.set(false);
      }
    });
  }

  /**
   * Close dialog and return to list
   */
  cerrarYVolverLista(): void {
    this.dialogRef.close(this.turnoCreado);
  }

  /**
   * Reset form to create another shift
   */
  crearOtroTurno(): void {
    this.turnoCreado = undefined;
    this.turnoForm.reset();
    this.searchControl.reset();
  }

  /**
   * Cancel and close dialog
   */
  onCancel(): void {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
