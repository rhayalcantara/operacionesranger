import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

// Angular Material
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';

// Services
import { DiarioPuestoService } from '../../../core/services/diario-puesto.service';
import { PlantillasServicioService, PlantillaServicio } from '../../../core/services/plantillas-servicio.service';

@Component({
  selector: 'app-poblar-plantilla-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule
  ],
  templateUrl: './poblar-plantilla-dialog.component.html',
  styleUrls: ['./poblar-plantilla-dialog.component.scss']
})
export class PoblarPlantillaDialogComponent implements OnInit, OnDestroy {
  plantillaControl = new FormControl<number | null>(null, Validators.required);
  fechaControl = new FormControl<Date | null>(null, Validators.required);

  plantillasDisponibles: PlantillaServicio[] = [];
  isLoading = false;
  isLoadingPlantillas = false;

  private destroy$ = new Subject<void>();

  constructor(
    private diarioPuestoService: DiarioPuestoService,
    private plantillasServicioService: PlantillasServicioService,
    private dialogRef: MatDialogRef<PoblarPlantillaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { fecha?: Date },
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Prellenar fecha si viene del padre
    if (this.data?.fecha) {
      this.fechaControl.setValue(this.data.fecha);
    }

    this.cargarPlantillas();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga las plantillas de servicio activas
   */
  cargarPlantillas(): void {
    this.isLoadingPlantillas = true;

    this.plantillasServicioService
      .getAll({ activo: true, pageSize: 1000 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.plantillasDisponibles = response.data;
          this.isLoadingPlantillas = false;
        },
        error: (error) => {
          console.error('Error al cargar plantillas:', error);
          this.snackBar.open('Error al cargar plantillas de servicio', 'Cerrar', {
            duration: 3000
          });
          this.isLoadingPlantillas = false;
        }
      });
  }

  /**
   * Formatea la fecha a YYYY-MM-DD
   */
  private formatearFecha(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Valida si el formulario es valido
   */
  get isFormValid(): boolean {
    return !!this.plantillaControl.value && !!this.fechaControl.value;
  }

  /**
   * Ejecuta la accion de poblar desde plantilla
   */
  onConfirmar(): void {
    if (!this.isFormValid) return;

    this.isLoading = true;

    const plantillaId = this.plantillaControl.value!;
    const fecha = this.formatearFecha(this.fechaControl.value!);

    this.diarioPuestoService
      .poblarDesdePlantilla(plantillaId, fecha)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          const mensaje = `Plantilla aplicada: ${result.insertados} registros insertados, ${result.omitidos} omitidos`;
          this.snackBar.open(mensaje, 'Cerrar', { duration: 5000 });
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Error al poblar desde plantilla:', error);
          const mensaje =
            error.error?.message || 'Error al poblar desde plantilla';
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
