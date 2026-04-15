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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';

// Services
import { ServiciosPuestoService, ServicioPuesto } from '../../../core/services/servicios-puesto.service';
import { ClientesService, Cliente } from '../../../core/services/clientes.service';
import { UbicacionesService, Ubicacion } from '../../../core/services/ubicaciones.service';
import { PuestosService, Puesto } from '../../../core/services/puestos.service';
import { RrhhService, Guardian } from '../../../core/services/rrhh.service';

/**
 * Nombre de los días de la semana para iterar
 */
const DIAS_SEMANA = [
  { key: 'domingo', label: 'Domingo' },
  { key: 'lunes', label: 'Lunes' },
  { key: 'martes', label: 'Martes' },
  { key: 'miercoles', label: 'Miércoles' },
  { key: 'jueves', label: 'Jueves' },
  { key: 'viernes', label: 'Viernes' },
  { key: 'sabado', label: 'Sábado' }
];

@Component({
  selector: 'app-servicio-puesto-form',
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
    MatTooltipModule
  ],
  templateUrl: './servicio-puesto-form.component.html',
  styleUrls: ['./servicio-puesto-form.component.scss']
})
export class ServicioPuestoFormComponent implements OnInit, OnDestroy {
  servicioForm!: FormGroup;
  isLoading = false;
  isEditMode = false;

  // Datos para selectores
  clientes: Cliente[] = [];
  ubicacionesDisponibles: Ubicacion[] = [];
  puestosDisponibles: Puesto[] = [];

  // Autocomplete de guardianes por día
  diasSemana = DIAS_SEMANA;
  guardianSearchControls: { [key: string]: FormControl } = {};
  guardianOptions: { [key: string]: Guardian[] } = {};

  // Asignación rápida a todos los días
  guardianTodosControl = new FormControl('');
  guardianTodosOptions: Guardian[] = [];
  guardianTodosSeleccionado: Guardian | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private serviciosPuestoService: ServiciosPuestoService,
    private clientesService: ClientesService,
    private ubicacionesService: UbicacionesService,
    private puestosService: PuestosService,
    private rrhhService: RrhhService,
    private dialogRef: MatDialogRef<ServicioPuestoFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { servicio?: ServicioPuesto },
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.isEditMode = !!this.data?.servicio;
    this.buildForm();
    this.initGuardianSearchControls();
    this.initGuardianTodosControl();
    this.cargarClientes();
    this.setupClienteUbicacionPuestoListener();

    // Si es edición, prellenar datos jerárquicos
    if (this.isEditMode && this.data.servicio) {
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
    this.servicioForm = this.fb.group({
      cliente_id_selector: [null, Validators.required],
      ubicacion_id_selector: [null, Validators.required],
      puesto_id: [null, Validators.required],
      tipo_turno: ['DIURNO', Validators.required],
      domingo_empleado_id: [null],
      lunes_empleado_id: [null],
      martes_empleado_id: [null],
      miercoles_empleado_id: [null],
      jueves_empleado_id: [null],
      viernes_empleado_id: [null],
      sabado_empleado_id: [null],
      cobrada: [false],
      activo: [true]
    });
  }

  /**
   * Inicializa controles de búsqueda para autocomplete de guardianes
   */
  initGuardianSearchControls(): void {
    for (const dia of this.diasSemana) {
      this.guardianSearchControls[dia.key] = new FormControl('');
      this.guardianOptions[dia.key] = [];

      // Setup autocomplete search con debounce
      this.guardianSearchControls[dia.key].valueChanges
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
            this.guardianOptions[dia.key] = response.data;
          },
          error: () => {
            this.guardianOptions[dia.key] = [];
          }
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
   * Configura listeners para selectores jerárquicos Cliente -> Ubicación -> Puesto
   */
  setupClienteUbicacionPuestoListener(): void {
    // Listener: Cliente cambia -> limpiar ubicación y puesto
    this.servicioForm
      .get('cliente_id_selector')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((clienteId) => {
        this.servicioForm.patchValue({
          ubicacion_id_selector: null,
          puesto_id: null
        });
        this.ubicacionesDisponibles = [];
        this.puestosDisponibles = [];

        if (clienteId) {
          this.cargarUbicacionesPorCliente(clienteId);
        }
      });

    // Listener: Ubicación cambia -> limpiar puesto
    this.servicioForm
      .get('ubicacion_id_selector')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((ubicacionId) => {
        this.servicioForm.patchValue({ puesto_id: null });
        this.puestosDisponibles = [];

        if (ubicacionId) {
          this.cargarPuestosPorUbicacion(ubicacionId);
        }
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
   * Carga puestos de una ubicación específica
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
   * Prellena el formulario en modo edición
   */
  patchFormForEdit(): void {
    const servicio = this.data.servicio!;

    // Necesitamos cargar la jerarquía: obtener el puesto para saber ubicación y cliente
    this.puestosService
      .getById(servicio.puesto_id)
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

                  // Cargar puestos de la ubicación
                  this.puestosService
                    .getAll({ ubicacion_id: ubicacionId, activo: true, pageSize: 1000 })
                    .pipe(takeUntil(this.destroy$))
                    .subscribe({
                      next: (puestosResponse) => {
                        this.puestosDisponibles = puestosResponse.data;

                        // Ahora patchear el formulario con todos los datos
                        this.servicioForm.patchValue({
                          cliente_id_selector: clienteId,
                          ubicacion_id_selector: ubicacionId,
                          puesto_id: servicio.puesto_id,
                          tipo_turno: servicio.tipo_turno,
                          domingo_empleado_id: servicio.domingo_empleado_id,
                          lunes_empleado_id: servicio.lunes_empleado_id,
                          martes_empleado_id: servicio.martes_empleado_id,
                          miercoles_empleado_id: servicio.miercoles_empleado_id,
                          jueves_empleado_id: servicio.jueves_empleado_id,
                          viernes_empleado_id: servicio.viernes_empleado_id,
                          sabado_empleado_id: servicio.sabado_empleado_id,
                          cobrada: servicio.cobrada,
                          activo: servicio.activo
                        });

                        // Prellenar nombres en los autocomplete
                        this.patchGuardianNames(servicio);
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
   * Prellena los nombres de guardianes en los autocomplete
   */
  patchGuardianNames(servicio: ServicioPuesto): void {
    for (const dia of this.diasSemana) {
      const nombreKey = `${dia.key}_empleado_nombre` as keyof ServicioPuesto;
      const nombre = servicio[nombreKey] as string | null;
      if (nombre) {
        this.guardianSearchControls[dia.key].setValue(nombre, { emitEvent: false });
      }
    }
  }

  /**
   * Muestra el nombre del guardián en el autocomplete
   */
  displayGuardian(guardian: Guardian): string {
    if (!guardian) return '';
    return guardian.nombre_completo || `${guardian.nombres} ${guardian.apellidos}`;
  }

  /**
   * Maneja selección de un guardián en el autocomplete
   */
  onGuardianSelected(dia: string, guardian: Guardian): void {
    const formControlKey = `${dia}_empleado_id`;
    this.servicioForm.patchValue({
      [formControlKey]: guardian.id_empleado
    });
  }

  /**
   * Limpia la asignación de guardián para un día
   */
  limpiarGuardian(dia: string): void {
    this.guardianSearchControls[dia].setValue('');
    this.servicioForm.patchValue({
      [`${dia}_empleado_id`]: null
    });
    this.guardianOptions[dia] = [];
  }

  /**
   * Inicializa el autocomplete para asignar guardián a todos los días
   */
  initGuardianTodosControl(): void {
    this.guardianTodosControl.valueChanges
      .pipe(
        debounceTime(300),
        switchMap((value) => {
          // Reset selección si el usuario escribe después de seleccionar
          if (typeof value === 'string') {
            this.guardianTodosSeleccionado = null;
          }
          if (typeof value === 'string' && value.length >= 2) {
            return this.rrhhService.buscarGuardianes(value);
          }
          return of({ data: [], total: 0 });
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          this.guardianTodosOptions = response.data;
        },
        error: () => {
          this.guardianTodosOptions = [];
        }
      });
  }

  /**
   * Asigna el guardián seleccionado a todos los días de la semana
   */
  asignarATodos(): void {
    if (!this.guardianTodosSeleccionado) return;

    const guardian = this.guardianTodosSeleccionado;
    const nombreCompleto = this.displayGuardian(guardian);

    for (const dia of this.diasSemana) {
      this.servicioForm.patchValue({
        [`${dia.key}_empleado_id`]: guardian.id_empleado
      });
      // Setear el objeto guardian completo para que displayWith lo muestre correctamente
      this.guardianSearchControls[dia.key].setValue(guardian, { emitEvent: false });
    }

    this.snackBar.open(
      `${nombreCompleto.trim()} asignado a todos los días`,
      'OK',
      { duration: 3000 }
    );
  }

  /**
   * Limpia la asignación de guardián en todos los días
   */
  limpiarTodos(): void {
    for (const dia of this.diasSemana) {
      this.limpiarGuardian(dia.key);
    }
    this.guardianTodosControl.setValue('');
    this.guardianTodosSeleccionado = null;
  }

  /**
   * Envía el formulario
   */
  onSubmit(): void {
    if (this.servicioForm.invalid) {
      this.servicioForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    // Preparar datos (excluir campos de selector UI)
    const {
      cliente_id_selector,
      ubicacion_id_selector,
      ...servicioData
    } = this.servicioForm.value;

    const request$ = this.isEditMode
      ? this.serviciosPuestoService.update(this.data.servicio!.id, servicioData)
      : this.serviciosPuestoService.create(servicioData);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        const mensaje = this.isEditMode
          ? 'Servicio actualizado exitosamente'
          : 'Servicio creado exitosamente';

        this.snackBar.open(mensaje, 'Cerrar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Error al guardar servicio:', error);
        const mensaje =
          error.error?.message || 'Error al guardar servicio';

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
