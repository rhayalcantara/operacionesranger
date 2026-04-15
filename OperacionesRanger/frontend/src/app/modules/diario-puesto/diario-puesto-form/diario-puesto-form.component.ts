import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormControl
} from '@angular/forms';
import { Subject, takeUntil, debounceTime, switchMap, of } from 'rxjs';

// Angular Material
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

// Services
import { DiarioPuestoService, DiarioPuesto } from '../../../core/services/diario-puesto.service';
import { ClientesService, Cliente } from '../../../core/services/clientes.service';
import { UbicacionesService, Ubicacion } from '../../../core/services/ubicaciones.service';
import { PuestosService, Puesto } from '../../../core/services/puestos.service';
import { RrhhService, Guardian } from '../../../core/services/rrhh.service';

@Component({
  selector: 'app-diario-puesto-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatAutocompleteModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './diario-puesto-form.component.html',
  styleUrls: ['./diario-puesto-form.component.scss']
})
export class DiarioPuestoFormComponent implements OnInit, OnDestroy {
  diarioForm!: FormGroup;
  isLoading = false;
  isEditMode = false;

  // Datos para selectores
  clientes: Cliente[] = [];
  ubicacionesDisponibles: Ubicacion[] = [];
  puestosDisponibles: Puesto[] = [];

  // Autocomplete de empleado
  empleadoSearchControl = new FormControl('');
  empleadoOptions: Guardian[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private diarioPuestoService: DiarioPuestoService,
    private clientesService: ClientesService,
    private ubicacionesService: UbicacionesService,
    private puestosService: PuestosService,
    private rrhhService: RrhhService,
    private dialogRef: MatDialogRef<DiarioPuestoFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { registro?: DiarioPuesto; fecha?: Date },
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.isEditMode = !!this.data?.registro;
    this.buildForm();
    this.initEmpleadoSearch();
    this.cargarClientes();
    this.setupClienteUbicacionPuestoListener();

    // Si es edicion, prellenar datos jerarquicos
    if (this.isEditMode && this.data.registro) {
      this.patchFormForEdit();
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
    // Determinar fecha: del registro (edicion) o la pasada desde el padre
    let fechaInicial: Date | null = null;
    if (this.isEditMode && this.data.registro) {
      fechaInicial = new Date(this.data.registro.fecha);
    } else if (this.data?.fecha) {
      fechaInicial = this.data.fecha;
    }

    this.diarioForm = this.fb.group({
      cliente_id_selector: [null, Validators.required],
      ubicacion_id_selector: [null, Validators.required],
      puesto_id: [null, Validators.required],
      empleado_id: [null, Validators.required],
      fecha: [fechaInicial, Validators.required],
      horas: [8, [Validators.required, Validators.min(0), Validators.max(24)]],
      tipo_turno: ['DIURNO', Validators.required]
    });
  }

  /**
   * Inicializa autocomplete de empleados con debounce
   */
  initEmpleadoSearch(): void {
    this.empleadoSearchControl.valueChanges
      .pipe(
        debounceTime(300),
        switchMap((value) => {
          if (typeof value === 'string' && value.length >= 2) {
            return this.rrhhService.buscarGuardianes(value);
          }
          return of({ data: [], total: 0 });
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          this.empleadoOptions = response.data;
        },
        error: () => {
          this.empleadoOptions = [];
        }
      });
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
   * Configura listeners para selectores jerarquicos Cliente -> Ubicacion -> Puesto
   */
  setupClienteUbicacionPuestoListener(): void {
    // Listener: Cliente cambia -> limpiar ubicacion y puesto
    this.diarioForm
      .get('cliente_id_selector')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((clienteId) => {
        this.diarioForm.patchValue({
          ubicacion_id_selector: null,
          puesto_id: null
        });
        this.ubicacionesDisponibles = [];
        this.puestosDisponibles = [];

        if (clienteId) {
          this.cargarUbicacionesPorCliente(clienteId);
        }
      });

    // Listener: Ubicacion cambia -> limpiar puesto
    this.diarioForm
      .get('ubicacion_id_selector')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((ubicacionId) => {
        this.diarioForm.patchValue({ puesto_id: null });
        this.puestosDisponibles = [];

        if (ubicacionId) {
          this.cargarPuestosPorUbicacion(ubicacionId);
        }
      });
  }

  /**
   * Carga ubicaciones de un cliente especifico
   */
  cargarUbicacionesPorCliente(clienteId: number): void {
    this.ubicacionesService
      .getAll({ cliente_id: clienteId, activo: true, pageSize: 1000 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.ubicacionesDisponibles = response.data;
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
   * Carga puestos de una ubicacion especifica
   */
  cargarPuestosPorUbicacion(ubicacionId: number): void {
    this.puestosService
      .getAll({ ubicacion_id: ubicacionId, activo: true, pageSize: 1000 })
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
   * Prellena el formulario en modo edicion
   */
  patchFormForEdit(): void {
    const registro = this.data.registro!;

    // Cargar jerarquia desde el puesto
    this.puestosService
      .getById(registro.puesto_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (puesto) => {
          const clienteId = puesto.ubicacion?.cliente?.id;
          const ubicacionId = puesto.ubicacion_id;

          if (clienteId) {
            // Cargar ubicaciones del cliente
            this.ubicacionesService
              .getAll({ cliente_id: clienteId, activo: true, pageSize: 1000 })
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (response) => {
                  this.ubicacionesDisponibles = response.data;

                  // Cargar puestos de la ubicacion
                  this.puestosService
                    .getAll({ ubicacion_id: ubicacionId, activo: true, pageSize: 1000 })
                    .pipe(takeUntil(this.destroy$))
                    .subscribe({
                      next: (puestosResponse) => {
                        this.puestosDisponibles = puestosResponse.data;

                        // Patchear el formulario con todos los datos
                        this.diarioForm.patchValue({
                          cliente_id_selector: clienteId,
                          ubicacion_id_selector: ubicacionId,
                          puesto_id: registro.puesto_id,
                          empleado_id: registro.empleado_id,
                          fecha: new Date(registro.fecha),
                          horas: registro.horas,
                          tipo_turno: registro.tipo_turno
                        });

                        // Prellenar nombre del empleado en autocomplete
                        this.empleadoSearchControl.setValue(
                          registro.empleado_nombre,
                          { emitEvent: false }
                        );
                      }
                    });
                }
              });
          }
        },
        error: (error) => {
          console.error('Error al cargar datos del puesto:', error);
        }
      });
  }

  /**
   * Muestra el nombre del guardian en el autocomplete
   */
  displayGuardian(guardian: Guardian): string {
    if (!guardian) return '';
    return guardian.nombre_completo || `${guardian.nombres} ${guardian.apellidos}`;
  }

  /**
   * Maneja seleccion de un empleado en el autocomplete
   */
  onEmpleadoSelected(guardian: Guardian): void {
    this.diarioForm.patchValue({
      empleado_id: guardian.id_empleado
    });
  }

  /**
   * Limpia la asignacion de empleado
   */
  limpiarEmpleado(): void {
    this.empleadoSearchControl.setValue('');
    this.diarioForm.patchValue({ empleado_id: null });
    this.empleadoOptions = [];
  }

  /**
   * Envia el formulario
   */
  onSubmit(): void {
    if (this.diarioForm.invalid) {
      this.diarioForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    // Preparar datos (excluir campos de selector UI)
    const {
      cliente_id_selector,
      ubicacion_id_selector,
      ...formData
    } = this.diarioForm.value;

    // Formatear fecha a YYYY-MM-DD
    const fecha = formData.fecha;
    if (fecha instanceof Date) {
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, '0');
      const day = String(fecha.getDate()).padStart(2, '0');
      formData.fecha = `${year}-${month}-${day}`;
    }

    const request$ = this.isEditMode
      ? this.diarioPuestoService.update(this.data.registro!.id, formData)
      : this.diarioPuestoService.create(formData);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        const mensaje = this.isEditMode
          ? 'Registro actualizado exitosamente'
          : 'Registro creado exitosamente';

        this.snackBar.open(mensaje, 'Cerrar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Error al guardar registro:', error);
        const mensaje =
          error.error?.message || 'Error al guardar registro';

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
