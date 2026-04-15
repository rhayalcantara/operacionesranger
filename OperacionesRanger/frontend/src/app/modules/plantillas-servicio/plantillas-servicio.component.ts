import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

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

// Services
import { PlantillasServicioService, PlantillaServicio } from '../../core/services/plantillas-servicio.service';

// Components
import { PlantillaServicioFormComponent } from './plantilla-servicio-form/plantilla-servicio-form.component';

@Component({
  selector: 'app-plantillas-servicio',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
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
    MatCardModule
  ],
  templateUrl: './plantillas-servicio.component.html',
  styleUrls: ['./plantillas-servicio.component.scss']
})
export class PlantillasServicioComponent implements OnInit, OnDestroy {
  displayedColumns = ['nombre', 'descripcion', 'cantidad_detalles', 'activo', 'acciones'];
  dataSource: PlantillaServicio[] = [];
  totalPlantillas = 0;
  pageSize = 10;
  pageIndex = 0;
  isLoading = signal(false);

  // Form Controls para filtros
  searchControl = new FormControl('');

  private destroy$ = new Subject<void>();

  constructor(
    private plantillasServicioService: PlantillasServicioService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.cargarPlantillas();
    this.setupSearchDebounce();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Configura debounce para busqueda
   */
  setupSearchDebounce(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageIndex = 0;
        this.cargarPlantillas();
      });
  }

  /**
   * Limpia el campo de busqueda
   */
  limpiarBusqueda(): void {
    this.searchControl.setValue('');
  }

  /**
   * Carga la lista de plantillas con filtros aplicados
   */
  cargarPlantillas(): void {
    this.isLoading.set(true);

    const filters = {
      page: this.pageIndex + 1,
      pageSize: this.pageSize,
      search: this.searchControl.value || undefined
    };

    this.plantillasServicioService
      .getAll(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          this.totalPlantillas = response.total;
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error al cargar plantillas de servicio:', error);
          this.snackBar.open('Error al cargar plantillas de servicio', 'Cerrar', {
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
    this.cargarPlantillas();
  }

  /**
   * Abre dialog para crear nueva plantilla
   */
  abrirFormularioCrear(): void {
    const dialogRef = this.dialog.open(PlantillaServicioFormComponent, {
      width: '900px',
      maxHeight: '90vh',
      disableClose: true,
      data: {}
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.cargarPlantillas();
      }
    });
  }

  /**
   * Abre dialog para editar plantilla existente
   */
  abrirFormularioEditar(plantilla: PlantillaServicio): void {
    const dialogRef = this.dialog.open(PlantillaServicioFormComponent, {
      width: '900px',
      maxHeight: '90vh',
      disableClose: true,
      data: { plantilla }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.cargarPlantillas();
      }
    });
  }

  /**
   * Elimina una plantilla con confirmacion
   */
  eliminarPlantilla(plantilla: PlantillaServicio): void {
    if (
      confirm(
        `¿Está seguro que desea eliminar la plantilla "${plantilla.nombre}"?\n\nEsta acción no se puede deshacer.`
      )
    ) {
      this.plantillasServicioService
        .delete(plantilla.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.snackBar.open('Plantilla eliminada exitosamente', 'Cerrar', {
              duration: 3000
            });
            this.cargarPlantillas();
          },
          error: (error) => {
            console.error('Error al eliminar plantilla:', error);
            const mensaje =
              error.error?.message || 'Error al eliminar plantilla';
            this.snackBar.open(mensaje, 'Cerrar', { duration: 5000 });
          }
        });
    }
  }
}
