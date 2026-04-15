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

// Services
import { PuestosService, Puesto } from '../../core/services/puestos.service';
import { ClientesService, Cliente } from '../../core/services/clientes.service';
import { UbicacionesService, Ubicacion } from '../../core/services/ubicaciones.service';

// Components
import { PuestoFormComponent } from './puesto-form/puesto-form.component';

@Component({
  selector: 'app-puestos',
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
    MatCardModule
  ],
  templateUrl: './puestos.component.html',
  styleUrls: ['./puestos.component.scss']
})
export class PuestosComponent implements OnInit, OnDestroy {
  displayedColumns = [
    'codigo',
    'nombre',
    'ubicacion',
    'cliente',
    'cantidad_guardianes',
    'turnos_requeridos',
    'activo',
    'acciones'
  ];
  dataSource: Puesto[] = [];
  totalPuestos = 0;
  pageSize = 10;
  pageIndex = 0;
  isLoading = signal(false);

  // Form Controls
  searchControl = new FormControl('');
  clienteFilterControl = new FormControl<number | null>(null);
  ubicacionFilterControl = new FormControl<number | null>(null);

  // Data for filters
  clientesDisponibles: Cliente[] = [];
  ubicacionesDisponibles: Ubicacion[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private puestosService: PuestosService,
    private clientesService: ClientesService,
    private ubicacionesService: UbicacionesService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarClientes();
    this.cargarPuestos();
    this.setupSearchDebounce();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga la lista de clientes activos para el filtro
   */
  cargarClientes(): void {
    this.clientesService
      .getAll({ activo: true, pageSize: 1000 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.clientesDisponibles = response.data;
        },
        error: (error) => {
          console.error('Error al cargar clientes:', error);
          this.snackBar.open('Error al cargar lista de clientes', 'Cerrar', {
            duration: 3000
          });
        }
      });
  }

  /**
   * Carga ubicaciones cuando se selecciona un cliente
   */
  onClienteChange(): void {
    const clienteId = this.clienteFilterControl.value;

    // Limpiar filtro de ubicación
    this.ubicacionFilterControl.setValue(null);
    this.ubicacionesDisponibles = [];

    // Cargar ubicaciones del cliente seleccionado
    if (clienteId) {
      this.cargarUbicacionesPorCliente(clienteId);
    }

    // Recargar puestos
    this.pageIndex = 0;
    this.cargarPuestos();
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
   * Maneja cambio en filtro de ubicación
   */
  onUbicacionChange(): void {
    this.pageIndex = 0;
    this.cargarPuestos();
  }

  /**
   * Configura debounce para búsqueda
   */
  setupSearchDebounce(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageIndex = 0;
        this.cargarPuestos();
      });
  }

  /**
   * Limpia el campo de búsqueda
   */
  limpiarBusqueda(): void {
    this.searchControl.setValue('');
  }

  /**
   * Carga la lista de puestos con filtros aplicados
   */
  cargarPuestos(): void {
    this.isLoading.set(true);

    const filters = {
      page: this.pageIndex + 1,
      pageSize: this.pageSize,
      search: this.searchControl.value || undefined,
      cliente_id: this.clienteFilterControl.value || undefined,
      ubicacion_id: this.ubicacionFilterControl.value || undefined
    };

    this.puestosService
      .getAll(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          this.totalPuestos = response.total;
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error al cargar puestos:', error);
          this.snackBar.open('Error al cargar puestos', 'Cerrar', {
            duration: 3000
          });
          this.isLoading.set(false);
        }
      });
  }

  /**
   * Maneja cambio de página en el paginador
   */
  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarPuestos();
  }

  /**
   * Abre dialog para crear nuevo puesto
   */
  abrirFormularioCrear(): void {
    const dialogRef = this.dialog.open(PuestoFormComponent, {
      width: '800px',
      disableClose: true,
      data: {}
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.cargarPuestos();
      }
    });
  }

  /**
   * Abre dialog para editar puesto existente
   */
  abrirFormularioEditar(puesto: Puesto): void {
    const dialogRef = this.dialog.open(PuestoFormComponent, {
      width: '800px',
      disableClose: true,
      data: { puesto }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.cargarPuestos();
      }
    });
  }

  /**
   * Elimina un puesto con confirmación
   */
  eliminarPuesto(puesto: Puesto): void {
    if (
      confirm(
        `¿Está seguro que desea eliminar el puesto "${puesto.nombre}"?\n\nEsta acción no se puede deshacer.`
      )
    ) {
      this.puestosService
        .delete(puesto.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.snackBar.open('Puesto eliminado exitosamente', 'Cerrar', {
              duration: 3000
            });
            this.cargarPuestos();
          },
          error: (error) => {
            console.error('Error al eliminar puesto:', error);
            const mensaje =
              error.error?.message || 'Error al eliminar puesto';
            this.snackBar.open(mensaje, 'Cerrar', { duration: 5000 });
          }
        });
    }
  }

  /**
   * Navega a la lista de turnos filtrada por este puesto
   */
  verTurnosPuesto(puesto: Puesto): void {
    this.router.navigate(['/turnos'], {
      queryParams: {
        puesto_id: puesto.id,
        puesto_nombre: puesto.nombre
      }
    });
  }
}
