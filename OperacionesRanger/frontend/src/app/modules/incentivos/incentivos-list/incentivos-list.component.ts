import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

// Angular Material Imports
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

// Services
import { IncentivosService, Incentivo } from '../../../core/services/incentivos.service';
import { PuestosService, Puesto } from '../../../core/services/puestos.service';

// Components
import { IncentivoFormComponent } from '../incentivo-form/incentivo-form.component';

@Component({
  selector: 'app-incentivos-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    MatCardModule,
    MatAutocompleteModule
  ],
  templateUrl: './incentivos-list.component.html',
  styleUrls: ['./incentivos-list.component.scss']
})
export class IncentivosListComponent implements OnInit, OnDestroy {
  displayedColumns = [
    'puesto',
    'monto',
    'valor_hora',
    'concepto',
    'activo',
    'acciones'
  ];
  dataSource: Incentivo[] = [];
  totalIncentivos = 0;
  pageSize = 10;
  pageIndex = 0;
  isLoading = signal(false);

  // Form Controls para filtros
  puestoFilterControl = new FormControl('');

  // Autocomplete de puestos
  puestosFiltrados: Puesto[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private incentivosService: IncentivosService,
    private puestosService: PuestosService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarIncentivos();
    this.setupPuestoAutocomplete();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setupPuestoAutocomplete(): void {
    this.puestoFilterControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((search) => {
        if (search && typeof search === 'string' && search.length >= 2) {
          this.buscarPuestos(search);
        } else if (!search) {
          this.puestosFiltrados = [];
          this.pageIndex = 0;
          this.cargarIncentivos();
        }
      });
  }

  buscarPuestos(search: string): void {
    this.puestosService
      .getAll({ search, pageSize: 10 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.puestosFiltrados = response.data;
        },
        error: (error) => {
          console.error('Error al buscar puestos:', error);
        }
      });
  }

  displayPuesto(puesto: Puesto | string): string {
    if (typeof puesto === 'string') {
      return puesto;
    }
    return puesto ? `${puesto.codigo} - ${puesto.nombre}` : '';
  }

  onPuestoSeleccionado(puesto: Puesto): void {
    this.pageIndex = 0;
    this.cargarIncentivos();
  }

  limpiarFiltroPuesto(): void {
    this.puestoFilterControl.setValue('');
    this.puestosFiltrados = [];
    this.pageIndex = 0;
    this.cargarIncentivos();
  }

  cargarIncentivos(): void {
    this.isLoading.set(true);

    const puestoSeleccionado = this.puestoFilterControl.value;
    const puestoId = typeof puestoSeleccionado === 'object' && puestoSeleccionado !== null
      ? (puestoSeleccionado as Puesto).id
      : undefined;

    const filters = {
      page: this.pageIndex + 1,
      pageSize: this.pageSize,
      puesto_id: puestoId
    };

    this.incentivosService
      .getAll(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          this.totalIncentivos = response.total;
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error al cargar incentivos:', error);
          this.snackBar.open('Error al cargar incentivos', 'Cerrar', {
            duration: 3000
          });
          this.isLoading.set(false);
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarIncentivos();
  }

  abrirFormularioCrear(): void {
    const dialogRef = this.dialog.open(IncentivoFormComponent, {
      width: '900px',
      maxHeight: '90vh',
      disableClose: true,
      data: {}
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.cargarIncentivos();
      }
    });
  }

  abrirFormularioEditar(incentivo: Incentivo): void {
    const dialogRef = this.dialog.open(IncentivoFormComponent, {
      width: '900px',
      maxHeight: '90vh',
      disableClose: true,
      data: { incentivo }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.cargarIncentivos();
      }
    });
  }

  eliminarIncentivo(incentivo: Incentivo): void {
    const puestoNombre = incentivo.puesto?.nombre || 'desconocido';

    if (
      confirm(
        `¿Está seguro que desea eliminar el incentivo del puesto "${puestoNombre}"?\n\nEsta acción desactivará el incentivo.`
      )
    ) {
      this.incentivosService
        .delete(incentivo.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.snackBar.open('Incentivo eliminado exitosamente', 'Cerrar', {
              duration: 3000
            });
            this.cargarIncentivos();
          },
          error: (error) => {
            console.error('Error al eliminar incentivo:', error);
            const mensaje =
              error.error?.message || 'Error al eliminar incentivo';
            this.snackBar.open(mensaje, 'Cerrar', { duration: 5000 });
          }
        });
    }
  }

  obtenerNombreCompletoPuesto(incentivo: Incentivo): string {
    if (!incentivo.puesto) {
      return 'Puesto desconocido';
    }

    const cliente = incentivo.puesto.ubicacion?.cliente?.nombre || '';
    const ubicacion = incentivo.puesto.ubicacion?.nombre || '';
    const puesto = incentivo.puesto.nombre;

    return `${cliente} - ${ubicacion} - ${puesto}`;
  }
}
