import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
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
import {
  PlantillasServicioService,
  PlantillaServicio,
  PlantillaConDetalle,
  PlantillaDetalle
} from '../../../core/services/plantillas-servicio.service';
import { PuestosService, Puesto } from '../../../core/services/puestos.service';
import { ServiciosPuestoService, ServicioPuesto } from '../../../core/services/servicios-puesto.service';

@Component({
  selector: 'app-plantilla-servicio-form',
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
  templateUrl: './plantilla-servicio-form.component.html',
  styleUrls: ['./plantilla-servicio-form.component.scss']
})
export class PlantillaServicioFormComponent implements OnInit, OnDestroy {
  plantillaForm!: FormGroup;
  isLoading = false;
  isEditMode = false;

  // Datos para selectores
  puestosDisponibles: Puesto[] = [];

  // Servicios por puesto filtrados por cada fila de detalle
  serviciosPorPuesto: { [rowIndex: number]: ServicioPuesto[] } = {};

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private plantillasServicioService: PlantillasServicioService,
    private puestosService: PuestosService,
    private serviciosPuestoService: ServiciosPuestoService,
    private dialogRef: MatDialogRef<PlantillaServicioFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { plantilla?: PlantillaServicio },
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.isEditMode = !!this.data?.plantilla;
    this.buildForm();
    this.cargarPuestos();

    if (this.isEditMode && this.data.plantilla) {
      this.cargarPlantillaCompleta(this.data.plantilla.id);
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
    this.plantillaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      descripcion: ['', [Validators.maxLength(255)]],
      activo: [true],
      detalles: this.fb.array([])
    });
  }

  /**
   * Getter para el FormArray de detalles
   */
  get detalles(): FormArray {
    return this.plantillaForm.get('detalles') as FormArray;
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
   * Carga la plantilla completa con detalles para modo edicion
   */
  cargarPlantillaCompleta(id: number): void {
    this.isLoading = true;

    this.plantillasServicioService
      .getById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (plantilla: PlantillaConDetalle) => {
          // Patch header fields
          this.plantillaForm.patchValue({
            nombre: plantilla.nombre,
            descripcion: plantilla.descripcion || '',
            activo: plantilla.activo
          });

          // Build detail rows
          if (plantilla.detalles && plantilla.detalles.length > 0) {
            for (const detalle of plantilla.detalles) {
              const index = this.detalles.length;
              this.agregarDetalleRow();

              // Load servicios for this puesto before patching
              if (detalle.puesto_id) {
                this.cargarServiciosPorPuesto(detalle.puesto_id, index, () => {
                  // Patch after servicios are loaded
                  this.detalles.at(index).patchValue({
                    puesto_id: detalle.puesto_id,
                    servicio_puesto_id: detalle.servicio_puesto_id
                  });
                });
              }
            }
          }

          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al cargar plantilla:', error);
          this.snackBar.open('Error al cargar datos de la plantilla', 'Cerrar', {
            duration: 3000
          });
          this.isLoading = false;
        }
      });
  }

  /**
   * Agrega una nueva fila de detalle al FormArray
   */
  agregarDetalleRow(): void {
    const detalleGroup = this.fb.group({
      puesto_id: [null, Validators.required],
      servicio_puesto_id: [null, Validators.required]
    });

    this.detalles.push(detalleGroup);
  }

  /**
   * Elimina una fila de detalle del FormArray
   */
  eliminarDetalleRow(index: number): void {
    this.detalles.removeAt(index);
    // Reindex serviciosPorPuesto
    const newMap: { [key: number]: ServicioPuesto[] } = {};
    for (let i = 0; i < this.detalles.length; i++) {
      if (i < index) {
        newMap[i] = this.serviciosPorPuesto[i] || [];
      } else {
        newMap[i] = this.serviciosPorPuesto[i + 1] || [];
      }
    }
    this.serviciosPorPuesto = newMap;
  }

  /**
   * Maneja cambio de puesto en una fila de detalle
   */
  onPuestoChange(rowIndex: number): void {
    const puestoId = this.detalles.at(rowIndex).get('puesto_id')?.value;

    // Limpiar servicio seleccionado
    this.detalles.at(rowIndex).patchValue({ servicio_puesto_id: null });
    this.serviciosPorPuesto[rowIndex] = [];

    if (puestoId) {
      this.cargarServiciosPorPuesto(puestoId, rowIndex);
    }
  }

  /**
   * Carga servicios por puesto filtrados por el puesto seleccionado
   */
  cargarServiciosPorPuesto(puestoId: number, rowIndex: number, callback?: () => void): void {
    this.serviciosPuestoService
      .getAll({ puesto_id: puestoId, activo: true, pageSize: 1000 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.serviciosPorPuesto[rowIndex] = response.data;
          if (callback) {
            callback();
          }
        },
        error: (error) => {
          console.error('Error al cargar servicios por puesto:', error);
          this.serviciosPorPuesto[rowIndex] = [];
        }
      });
  }

  /**
   * Obtiene el nombre visible del puesto para mostrar en la fila
   */
  getPuestoNombre(puestoId: number): string {
    const puesto = this.puestosDisponibles.find(p => p.id === puestoId);
    if (puesto) {
      return `${puesto.codigo} - ${puesto.nombre}`;
    }
    return '';
  }

  /**
   * Envia el formulario
   */
  onSubmit(): void {
    if (this.plantillaForm.invalid) {
      this.plantillaForm.markAllAsTouched();
      return;
    }

    if (this.detalles.length === 0) {
      this.snackBar.open('Debe agregar al menos un servicio a la plantilla', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    this.isLoading = true;

    const formValue = this.plantillaForm.value;
    const payload = {
      nombre: formValue.nombre,
      descripcion: formValue.descripcion || null,
      activo: formValue.activo,
      detalles: formValue.detalles.map((d: any) => ({
        puesto_id: d.puesto_id,
        servicio_puesto_id: d.servicio_puesto_id
      }))
    };

    const request$ = this.isEditMode
      ? this.plantillasServicioService.update(this.data.plantilla!.id, payload)
      : this.plantillasServicioService.create(payload);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        const mensaje = this.isEditMode
          ? 'Plantilla actualizada exitosamente'
          : 'Plantilla creada exitosamente';

        this.snackBar.open(mensaje, 'Cerrar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Error al guardar plantilla:', error);
        const mensaje =
          error.error?.message || 'Error al guardar plantilla';

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
