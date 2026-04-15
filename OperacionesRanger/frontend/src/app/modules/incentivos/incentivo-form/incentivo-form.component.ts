import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

// Services
import { IncentivosService, Incentivo } from '../../../core/services/incentivos.service';
import { PuestosService, Puesto } from '../../../core/services/puestos.service';
import { ClientesService, Cliente } from '../../../core/services/clientes.service';
import { UbicacionesService, Ubicacion } from '../../../core/services/ubicaciones.service';

@Component({
  selector: 'app-incentivo-form',
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
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './incentivo-form.component.html',
  styleUrls: ['./incentivo-form.component.scss']
})
export class IncentivoFormComponent implements OnInit, OnDestroy {
  incentivoForm!: FormGroup;
  isLoading = false;
  isEditMode = false;

  // Selector jerárquico
  clientes: Cliente[] = [];
  ubicacionesDisponibles: Ubicacion[] = [];
  puestosDisponibles: Puesto[] = [];

  // Valor hora calculado
  valorHoraCalculado = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private incentivosService: IncentivosService,
    private puestosService: PuestosService,
    private clientesService: ClientesService,
    private ubicacionesService: UbicacionesService,
    private dialogRef: MatDialogRef<IncentivoFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { incentivo?: Incentivo },
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.isEditMode = !!this.data?.incentivo;
    this.cargarClientes();
    this.buildForm();
    this.setupSelectorJerarquico();
    this.setupCalculoValorHora();

    // Si es edición, prellenar datos del selector jerárquico
    if (this.isEditMode && this.data.incentivo?.puesto) {
      const clienteId = this.data.incentivo.puesto.ubicacion.cliente.id;
      const ubicacionId = this.data.incentivo.puesto.ubicacion.id;

      this.incentivoForm.patchValue({ cliente_id_selector: clienteId });
      this.cargarUbicacionesPorCliente(clienteId);

      // Esperar a que se carguen ubicaciones antes de cargar puestos
      setTimeout(() => {
        this.incentivoForm.patchValue({ ubicacion_id_selector: ubicacionId });
        this.cargarPuestosPorUbicacion(ubicacionId);
      }, 500);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  buildForm(): void {
    this.incentivoForm = this.fb.group({
      // Selector jerárquico (solo para UI)
      cliente_id_selector: [null, Validators.required],
      ubicacion_id_selector: [null, Validators.required],

      // Campos reales del incentivo
      puesto_id: [null, Validators.required],
      monto: [null, [Validators.required, Validators.min(0.01)]],
      concepto: ['', Validators.maxLength(255)],
      activo: [true]
    });

    // Prellenar datos si es edición
    if (this.isEditMode && this.data.incentivo) {
      this.incentivoForm.patchValue({
        ...this.data.incentivo,
        cliente_id_selector: this.data.incentivo.puesto?.ubicacion.cliente.id,
        ubicacion_id_selector: this.data.incentivo.puesto?.ubicacion.id
      });

      // Calcular valor hora inicial
      this.calcularValorHora();
    }
  }

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

  setupSelectorJerarquico(): void {
    this.incentivoForm
      .get('cliente_id_selector')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((clienteId) => {
        this.incentivoForm.patchValue({
          ubicacion_id_selector: null,
          puesto_id: null
        });
        this.ubicacionesDisponibles = [];
        this.puestosDisponibles = [];

        if (clienteId) {
          this.cargarUbicacionesPorCliente(clienteId);
        }
      });

    this.incentivoForm
      .get('ubicacion_id_selector')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((ubicacionId) => {
        this.incentivoForm.patchValue({ puesto_id: null });
        this.puestosDisponibles = [];

        if (ubicacionId) {
          this.cargarPuestosPorUbicacion(ubicacionId);
        }
      });
  }

  setupCalculoValorHora(): void {
    this.incentivoForm
      .get('monto')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.calcularValorHora();
      });
  }

  calcularValorHora(): void {
    const monto = this.incentivoForm.get('monto')?.value;
    if (monto && monto > 0) {
      this.valorHoraCalculado = this.incentivosService.calcularValorHora(monto);
    } else {
      this.valorHoraCalculado = 0;
    }
  }

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

  cargarPuestosPorUbicacion(ubicacionId: number): void {
    this.puestosService
      .getAll({ ubicacion_id: ubicacionId, activo: true, pageSize: 1000 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.puestosDisponibles = response.data;

          if (this.isEditMode && this.data.incentivo) {
            this.incentivoForm.patchValue({
              puesto_id: this.data.incentivo.puesto_id
            });
          }
        },
        error: (error) => {
          console.error('Error al cargar puestos:', error);
          this.snackBar.open('Error al cargar puestos', 'Cerrar', {
            duration: 3000
          });
        }
      });
  }

  onSubmit(): void {
    if (this.incentivoForm.invalid) {
      this.incentivoForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    // Preparar datos (excluir selectores que son solo para UI, convertir tipos)
    const { cliente_id_selector, ubicacion_id_selector, ...rawData } = this.incentivoForm.value;
    const incentivoData = {
      ...rawData,
      monto: Number(rawData.monto),
      activo: rawData.activo ? 1 : 0
    };

    const request$ = this.isEditMode
      ? this.incentivosService.update(this.data.incentivo!.id, incentivoData)
      : this.incentivosService.create(incentivoData);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        const mensaje = this.isEditMode
          ? 'Incentivo actualizado exitosamente'
          : 'Incentivo creado exitosamente';

        this.snackBar.open(mensaje, 'Cerrar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Error al guardar incentivo:', error);
        const mensaje =
          error.error?.message || 'Error al guardar incentivo';

        this.snackBar.open(mensaje, 'Cerrar', { duration: 5000 });
        this.isLoading = false;
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
