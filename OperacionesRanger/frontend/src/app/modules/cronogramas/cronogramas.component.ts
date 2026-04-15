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
import { CronogramasService, Cronograma } from '../../core/services/cronogramas.service';

// Components
import { CronogramaFormComponent } from './cronograma-form/cronograma-form.component';

@Component({
  selector: 'app-cronogramas',
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
  templateUrl: './cronogramas.component.html',
  styleUrls: ['./cronogramas.component.scss']
})
export class CronogramasComponent implements OnInit, OnDestroy {
  displayedColumns = [
    'nombre',
    'descripcion',
    'detalles_count',
    'activo',
    'acciones'
  ];
  dataSource: Cronograma[] = [];
  totalCronogramas = 0;
  pageSize = 10;
  pageIndex = 0;
  isLoading = signal(false);

  // Form Controls
  searchControl = new FormControl('');

  private destroy$ = new Subject<void>();

  constructor(
    private cronogramasService: CronogramasService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.cargarCronogramas();
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
        this.cargarCronogramas();
      });
  }

  /**
   * Limpia el campo de busqueda
   */
  limpiarBusqueda(): void {
    this.searchControl.setValue('');
  }

  /**
   * Carga la lista de cronogramas con filtros aplicados
   */
  cargarCronogramas(): void {
    this.isLoading.set(true);

    const filters = {
      page: this.pageIndex + 1,
      pageSize: this.pageSize,
      search: this.searchControl.value || undefined
    };

    this.cronogramasService
      .getAll(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          this.totalCronogramas = response.total;
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error al cargar cronogramas:', error);
          this.snackBar.open('Error al cargar cronogramas', 'Cerrar', {
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
    this.cargarCronogramas();
  }

  /**
   * Abre dialog para crear nuevo cronograma
   */
  abrirFormularioCrear(): void {
    const dialogRef = this.dialog.open(CronogramaFormComponent, {
      width: '950px',
      maxHeight: '90vh',
      disableClose: true,
      data: {}
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.cargarCronogramas();
      }
    });
  }

  /**
   * Abre dialog para editar cronograma existente
   */
  abrirFormularioEditar(cronograma: Cronograma): void {
    const dialogRef = this.dialog.open(CronogramaFormComponent, {
      width: '950px',
      maxHeight: '90vh',
      disableClose: true,
      data: { cronograma }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.cargarCronogramas();
      }
    });
  }

  /**
   * Elimina un cronograma con confirmacion
   */
  eliminarCronograma(cronograma: Cronograma): void {
    if (
      confirm(
        `¿Está seguro que desea eliminar el cronograma "${cronograma.nombre}"?\n\nEsta acción no se puede deshacer.`
      )
    ) {
      this.cronogramasService
        .delete(cronograma.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.snackBar.open('Cronograma eliminado exitosamente', 'Cerrar', {
              duration: 3000
            });
            this.cargarCronogramas();
          },
          error: (error) => {
            console.error('Error al eliminar cronograma:', error);
            const mensaje =
              error.error?.message || 'Error al eliminar cronograma';
            this.snackBar.open(mensaje, 'Cerrar', { duration: 5000 });
          }
        });
    }
  }
}
