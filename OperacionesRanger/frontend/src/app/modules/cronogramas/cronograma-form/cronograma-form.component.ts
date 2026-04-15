import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';

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
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

// Services
import { CronogramasService, Cronograma, CronogramaDetalle } from '../../../core/services/cronogramas.service';
import { PuestosService, Puesto } from '../../../core/services/puestos.service';
import { RrhhService, Guardian } from '../../../core/services/rrhh.service';

/** Nombres de los dias de la semana */
const DIAS_SEMANA = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' }
];

@Component({
  selector: 'app-cronograma-form',
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
    MatSnackBarModule,
    MatAutocompleteModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './cronograma-form.component.html',
  styleUrls: ['./cronograma-form.component.scss']
})
export class CronogramaFormComponent implements OnInit, OnDestroy {
  cronogramaForm!: FormGroup;
  isLoading = false;
  isEditMode = false;

  diasSemana = DIAS_SEMANA;
  tiposTurno = ['DIURNO', 'NOCTURNO'];

  puestosDisponibles: Puesto[] = [];

  /** Guardianes filtrados por cada fila de detalle (para autocomplete) */
  guardianSuggestions: Map<number, Guardian[]> = new Map();

  /** Texto de busqueda por fila para el autocomplete */
  guardianSearchInputs: Map<number, string> = new Map();

  /** Error de validacion: empleado en 7 dias */
  empleadoExcesoError: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private cronogramasService: CronogramasService,
    private puestosService: PuestosService,
    private rrhhService: RrhhService,
    private dialogRef: MatDialogRef<CronogramaFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { cronograma?: Cronograma },
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.isEditMode = !!this.data?.cronograma;
    this.cargarPuestos();
    this.buildForm();

    if (this.isEditMode && this.data.cronograma) {
      this.cargarDetallesCronograma(this.data.cronograma.id);
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
    this.cronogramaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(150)]],
      descripcion: ['', Validators.maxLength(500)],
      activo: [true],
      detalles: this.fb.array([], [this.validarMaxDiasPorEmpleado.bind(this)])
    });

    // Prellenar datos si es edicion
    if (this.isEditMode && this.data.cronograma) {
      this.cronogramaForm.patchValue({
        nombre: this.data.cronograma.nombre,
        descripcion: this.data.cronograma.descripcion,
        activo: this.data.cronograma.activo
      });
    }
  }

  /**
   * Carga lista de puestos activos
   */
  cargarPuestos(): void {
    this.puestosService
      .getAll({ activo: true, pageSize: 1000 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.puestosDisponibles = response.data;
        },
        error: (error) => {
          console.error('Error al cargar puestos:', error);
          this.snackBar.open('Error al cargar puestos', 'Cerrar', {
            duration: 3000
          });
        }
      });
  }

  /**
   * Carga los detalles de un cronograma existente para edicion
   */
  cargarDetallesCronograma(cronogramaId: number): void {
    this.isLoading = true;
    this.cronogramasService
      .getById(cronogramaId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cronograma) => {
          // Limpiar detalles existentes
          this.detalles.clear();

          // Agregar cada detalle al FormArray
          if (cronograma.detalles && cronograma.detalles.length > 0) {
            cronograma.detalles.forEach((detalle) => {
              this.agregarDetalleConDatos(detalle);
            });
          }

          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al cargar detalles:', error);
          this.snackBar.open('Error al cargar detalles del cronograma', 'Cerrar', {
            duration: 3000
          });
          this.isLoading = false;
        }
      });
  }

  /**
   * Getter para el FormArray de detalles
   */
  get detalles(): FormArray {
    return this.cronogramaForm.get('detalles') as FormArray;
  }

  /**
   * Agrega una nueva fila de detalle vacia
   */
  agregarDetalle(): void {
    const index = this.detalles.length;
    const detalleGroup = this.fb.group({
      dia_semana: [1, Validators.required],
      puesto_id: [null, Validators.required],
      empleado_id: [null, Validators.required],
      tipo_turno: ['DIURNO', Validators.required],
      _empleado_display: [''] // Campo auxiliar para mostrar nombre en autocomplete
    });

    this.detalles.push(detalleGroup);
    this.guardianSuggestions.set(index, []);
    this.guardianSearchInputs.set(index, '');
  }

  /**
   * Agrega una fila de detalle con datos prellenados (para edicion)
   */
  agregarDetalleConDatos(detalle: CronogramaDetalle): void {
    const index = this.detalles.length;
    const detalleGroup = this.fb.group({
      dia_semana: [detalle.dia_semana, Validators.required],
      puesto_id: [detalle.puesto_id, Validators.required],
      empleado_id: [detalle.empleado_id, Validators.required],
      tipo_turno: [detalle.tipo_turno, Validators.required],
      _empleado_display: [detalle.empleado_nombre || '']
    });

    this.detalles.push(detalleGroup);
    this.guardianSuggestions.set(index, []);
    this.guardianSearchInputs.set(index, detalle.empleado_nombre || '');
  }

  /**
   * Elimina una fila de detalle
   */
  eliminarDetalle(index: number): void {
    this.detalles.removeAt(index);
    // Reconstruir mapas de sugerencias
    const newSuggestions = new Map<number, Guardian[]>();
    const newInputs = new Map<number, string>();
    for (let i = 0; i < this.detalles.length; i++) {
      newSuggestions.set(i, this.guardianSuggestions.get(i >= index ? i + 1 : i) || []);
      newInputs.set(i, this.guardianSearchInputs.get(i >= index ? i + 1 : i) || '');
    }
    this.guardianSuggestions = newSuggestions;
    this.guardianSearchInputs = newInputs;

    // Re-validar
    this.validarEmpleadosDias();
  }

  /**
   * Busca guardianes para el autocomplete de una fila especifica
   */
  buscarGuardian(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const searchTerm = input.value;
    this.guardianSearchInputs.set(index, searchTerm);

    if (searchTerm.length < 2) {
      this.guardianSuggestions.set(index, []);
      return;
    }

    this.rrhhService
      .buscarGuardianes(searchTerm)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.guardianSuggestions.set(index, response.data);
        },
        error: () => {
          this.guardianSuggestions.set(index, []);
        }
      });
  }

  /**
   * Selecciona un guardian del autocomplete
   */
  seleccionarGuardian(index: number, guardian: Guardian): void {
    const detalleGroup = this.detalles.at(index) as FormGroup;
    detalleGroup.patchValue({
      empleado_id: guardian.id_empleado,
      _empleado_display: guardian.nombre_completo || `${guardian.nombres} ${guardian.apellidos}`
    });
    this.guardianSearchInputs.set(
      index,
      guardian.nombre_completo || `${guardian.nombres} ${guardian.apellidos}`
    );

    // Re-validar despues de seleccionar
    this.validarEmpleadosDias();
  }

  /**
   * Obtiene el nombre a mostrar para un guardian en el autocomplete
   */
  displayGuardian(guardian: Guardian): string {
    return guardian
      ? guardian.nombre_completo || `${guardian.nombres} ${guardian.apellidos}`
      : '';
  }

  /**
   * Obtiene el label del dia de la semana
   */
  getDiaSemanaLabel(value: number): string {
    return DIAS_SEMANA.find(d => d.value === value)?.label || '';
  }

  /**
   * Validador de FormArray: ningun empleado puede aparecer en los 7 dias
   */
  validarMaxDiasPorEmpleado(control: AbstractControl): ValidationErrors | null {
    const formArray = control as FormArray;
    if (!formArray || formArray.length === 0) {
      return null;
    }

    // Contar dias por empleado
    const diasPorEmpleado = new Map<number, Set<number>>();

    for (let i = 0; i < formArray.length; i++) {
      const group = formArray.at(i) as FormGroup;
      const empleadoId = group.get('empleado_id')?.value;
      const diaSemana = group.get('dia_semana')?.value;

      if (empleadoId && diaSemana !== null && diaSemana !== undefined) {
        if (!diasPorEmpleado.has(empleadoId)) {
          diasPorEmpleado.set(empleadoId, new Set());
        }
        diasPorEmpleado.get(empleadoId)!.add(diaSemana);
      }
    }

    // Verificar si algun empleado tiene 7 dias
    for (const [empleadoId, dias] of diasPorEmpleado) {
      if (dias.size >= 7) {
        return { empleadoExcesoDias: { empleadoId, dias: dias.size } };
      }
    }

    return null;
  }

  /**
   * Ejecuta la validacion y actualiza el mensaje de error
   */
  validarEmpleadosDias(): void {
    this.detalles.updateValueAndValidity();
    const error = this.detalles.errors;

    if (error && error['empleadoExcesoDias']) {
      const empleadoId = error['empleadoExcesoDias'].empleadoId;
      // Buscar nombre del empleado en los detalles
      let nombreEmpleado = `ID ${empleadoId}`;
      for (let i = 0; i < this.detalles.length; i++) {
        const group = this.detalles.at(i) as FormGroup;
        if (group.get('empleado_id')?.value === empleadoId) {
          const display = group.get('_empleado_display')?.value;
          if (display) {
            nombreEmpleado = display;
          }
          break;
        }
      }
      this.empleadoExcesoError = `El empleado "${nombreEmpleado}" está asignado a 7 días. Máximo permitido: 6 días por semana.`;
    } else {
      this.empleadoExcesoError = null;
    }
  }

  /**
   * Envia el formulario
   */
  onSubmit(): void {
    // Re-validar
    this.validarEmpleadosDias();

    if (this.cronogramaForm.invalid) {
      this.cronogramaForm.markAllAsTouched();
      return;
    }

    if (this.empleadoExcesoError) {
      this.snackBar.open(this.empleadoExcesoError, 'Cerrar', { duration: 5000 });
      return;
    }

    this.isLoading = true;

    // Preparar datos (excluir _empleado_display de cada detalle)
    const formValue = this.cronogramaForm.value;
    const payload = {
      nombre: formValue.nombre,
      descripcion: formValue.descripcion,
      activo: formValue.activo,
      detalles: formValue.detalles.map((d: any) => ({
        dia_semana: d.dia_semana,
        puesto_id: d.puesto_id,
        empleado_id: d.empleado_id,
        tipo_turno: d.tipo_turno
      }))
    };

    const request$ = this.isEditMode
      ? this.cronogramasService.update(this.data.cronograma!.id, payload)
      : this.cronogramasService.create(payload);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        const mensaje = this.isEditMode
          ? 'Cronograma actualizado exitosamente'
          : 'Cronograma creado exitosamente';

        this.snackBar.open(mensaje, 'Cerrar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Error al guardar cronograma:', error);
        const mensaje =
          error.error?.message || 'Error al guardar cronograma';

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
