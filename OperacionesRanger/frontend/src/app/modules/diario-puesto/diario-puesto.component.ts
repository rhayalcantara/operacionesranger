import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

// Angular Material Imports
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

// Services
import { DiarioPuestoService, DiarioPuesto } from '../../core/services/diario-puesto.service';

// Components
import { DiarioPuestoFormComponent } from './diario-puesto-form/diario-puesto-form.component';
import { PoblarPlantillaDialogComponent } from './poblar-plantilla-dialog/poblar-plantilla-dialog.component';

@Component({
  selector: 'app-diario-puesto',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './diario-puesto.component.html',
  styleUrls: ['./diario-puesto.component.scss']
})
export class DiarioPuestoComponent implements OnInit, OnDestroy {
  displayedColumns = [
    'puesto',
    'empleado',
    'horas',
    'tipo_turno',
    'origen',
    'acciones'
  ];
  dataSource: DiarioPuesto[] = [];
  totalRegistros = 0;
  pageSize = 10;
  pageIndex = 0;
  isLoading = signal(false);

  // Form Control para el date picker
  fechaControl = new FormControl<Date | null>(null);

  private destroy$ = new Subject<void>();

  constructor(
    private diarioPuestoService: DiarioPuestoService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Escuchar cambios en la fecha para recargar la tabla
    this.fechaControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageIndex = 0;
        this.cargarRegistros();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Retorna true si hay una fecha seleccionada
   */
  get fechaSeleccionada(): boolean {
    return !!this.fechaControl.value;
  }

  /**
   * Formatea la fecha seleccionada a YYYY-MM-DD para enviar al backend
   */
  get fechaFormateada(): string | null {
    const fecha = this.fechaControl.value;
    if (!fecha) return null;
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Carga los registros del diario de puesto para la fecha seleccionada
   */
  cargarRegistros(): void {
    if (!this.fechaFormateada) {
      this.dataSource = [];
      this.totalRegistros = 0;
      return;
    }

    this.isLoading.set(true);

    const filters = {
      page: this.pageIndex + 1,
      pageSize: this.pageSize,
      fecha: this.fechaFormateada
    };

    this.diarioPuestoService
      .getAll(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          this.totalRegistros = response.total;
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error al cargar diario de puesto:', error);
          this.snackBar.open('Error al cargar diario de puesto', 'Cerrar', {
            duration: 3000
          });
          this.isLoading.set(false);
        }
      });
  }

  /**
   * Maneja cambio de pagina en el paginador
   */
  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarRegistros();
  }

  /**
   * Abre dialog para crear nuevo registro de diario
   */
  abrirFormularioCrear(): void {
    const dialogRef = this.dialog.open(DiarioPuestoFormComponent, {
      width: '700px',
      maxHeight: '90vh',
      disableClose: true,
      data: { fecha: this.fechaControl.value }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.cargarRegistros();
      }
    });
  }

  /**
   * Abre dialog para editar registro de diario existente
   */
  abrirFormularioEditar(registro: DiarioPuesto): void {
    const dialogRef = this.dialog.open(DiarioPuestoFormComponent, {
      width: '700px',
      maxHeight: '90vh',
      disableClose: true,
      data: { registro, fecha: this.fechaControl.value }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.cargarRegistros();
      }
    });
  }

  /**
   * Elimina un registro del diario con confirmacion
   */
  eliminarRegistro(registro: DiarioPuesto): void {
    if (
      confirm(
        `¿Está seguro que desea eliminar el registro del puesto "${registro.puesto_nombre}" - ${registro.empleado_nombre}?\n\nEsta acción no se puede deshacer.`
      )
    ) {
      this.diarioPuestoService
        .delete(registro.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.snackBar.open('Registro eliminado exitosamente', 'Cerrar', {
              duration: 3000
            });
            this.cargarRegistros();
          },
          error: (error) => {
            console.error('Error al eliminar registro:', error);
            const mensaje =
              error.error?.message || 'Error al eliminar registro';
            this.snackBar.open(mensaje, 'Cerrar', { duration: 5000 });
          }
        });
    }
  }

  /**
   * Abre dialog para poblar desde plantilla
   */
  abrirPoblarPlantilla(): void {
    const dialogRef = this.dialog.open(PoblarPlantillaDialogComponent, {
      width: '500px',
      disableClose: true,
      data: { fecha: this.fechaControl.value }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.cargarRegistros();
      }
    });
  }

  /**
   * Poblar desde servicios por puesto activos directamente
   */
  poblarDesdeServicios(): void {
    if (!this.fechaFormateada) return;

    this.isLoading.set(true);

    this.diarioPuestoService
      .poblarDesdeServicios(this.fechaFormateada)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.snackBar.open(
            `${result.insertados} registros creados, ${result.omitidos} omitidos`,
            'OK',
            { duration: 5000 }
          );
          this.isLoading.set(false);
          this.cargarRegistros();
        },
        error: (error) => {
          console.error('Error al poblar desde servicios:', error);
          this.snackBar.open(
            error.error?.message || 'Error al poblar desde servicios',
            'Cerrar',
            { duration: 5000 }
          );
          this.isLoading.set(false);
        }
      });
  }
}
