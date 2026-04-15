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
import { ServiciosPuestoService, ServicioPuesto } from '../../core/services/servicios-puesto.service';
import { ClientesService, Cliente } from '../../core/services/clientes.service';
import { UbicacionesService, Ubicacion } from '../../core/services/ubicaciones.service';
import { PuestosService, Puesto } from '../../core/services/puestos.service';

// Components
import { ServicioPuestoFormComponent } from './servicio-puesto-form/servicio-puesto-form.component';

@Component({
  selector: 'app-servicios-puesto',
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
  templateUrl: './servicios-puesto.component.html',
  styleUrls: ['./servicios-puesto.component.scss']
})
export class ServiciosPuestoComponent implements OnInit, OnDestroy {
  displayedColumns = [
    'puesto',
    'tipo_turno',
    'domingo',
    'lunes',
    'martes',
    'miercoles',
    'jueves',
    'viernes',
    'sabado',
    'cobrada',
    'acciones'
  ];
  dataSource: ServicioPuesto[] = [];
  totalServicios = 0;
  pageSize = 10;
  pageIndex = 0;
  isLoading = signal(false);

  // Form Controls para filtros
  searchControl = new FormControl('');
  clienteFilterControl = new FormControl<number | null>(null);
  ubicacionFilterControl = new FormControl<number | null>(null);
  puestoFilterControl = new FormControl<number | null>(null);

  // Data para filtros
  clientesDisponibles: Cliente[] = [];
  ubicacionesDisponibles: Ubicacion[] = [];
  puestosDisponibles: Puesto[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private serviciosPuestoService: ServiciosPuestoService,
    private clientesService: ClientesService,
    private ubicacionesService: UbicacionesService,
    private puestosService: PuestosService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.cargarClientes();
    this.cargarServicios();
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

    // Limpiar filtros dependientes
    this.ubicacionFilterControl.setValue(null);
    this.puestoFilterControl.setValue(null);
    this.ubicacionesDisponibles = [];
    this.puestosDisponibles = [];

    if (clienteId) {
      this.cargarUbicacionesPorCliente(clienteId);
    }

    this.pageIndex = 0;
    this.cargarServicios();
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
    const ubicacionId = this.ubicacionFilterControl.value;

    // Limpiar filtro de puesto
    this.puestoFilterControl.setValue(null);
    this.puestosDisponibles = [];

    if (ubicacionId) {
      this.cargarPuestosPorUbicacion(ubicacionId);
    }

    this.pageIndex = 0;
    this.cargarServicios();
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
   * Maneja cambio en filtro de puesto
   */
  onPuestoChange(): void {
    this.pageIndex = 0;
    this.cargarServicios();
  }

  /**
   * Configura debounce para búsqueda
   */
  setupSearchDebounce(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageIndex = 0;
        this.cargarServicios();
      });
  }

  /**
   * Limpia el campo de búsqueda
   */
  limpiarBusqueda(): void {
    this.searchControl.setValue('');
  }

  /**
   * Carga la lista de servicios por puesto con filtros aplicados
   */
  cargarServicios(): void {
    this.isLoading.set(true);

    const filters = {
      page: this.pageIndex + 1,
      pageSize: this.pageSize,
      search: this.searchControl.value || undefined,
      cliente_id: this.clienteFilterControl.value || undefined,
      ubicacion_id: this.ubicacionFilterControl.value || undefined,
      puesto_id: this.puestoFilterControl.value || undefined
    };

    this.serviciosPuestoService
      .getAll(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          this.totalServicios = response.total;
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error al cargar servicios por puesto:', error);
          this.snackBar.open('Error al cargar servicios por puesto', 'Cerrar', {
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
    this.cargarServicios();
  }

  /**
   * Abre dialog para crear nuevo servicio por puesto
   */
  abrirFormularioCrear(): void {
    const dialogRef = this.dialog.open(ServicioPuestoFormComponent, {
      width: '900px',
      maxHeight: '90vh',
      disableClose: true,
      data: {}
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.cargarServicios();
      }
    });
  }

  /**
   * Abre dialog para editar servicio por puesto existente
   */
  abrirFormularioEditar(servicio: ServicioPuesto): void {
    const dialogRef = this.dialog.open(ServicioPuestoFormComponent, {
      width: '900px',
      maxHeight: '90vh',
      disableClose: true,
      data: { servicio }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.cargarServicios();
      }
    });
  }

  /**
   * Elimina un servicio por puesto con confirmación
   */
  eliminarServicio(servicio: ServicioPuesto): void {
    if (
      confirm(
        `¿Está seguro que desea eliminar el servicio del puesto "${servicio.puesto_nombre}" (${servicio.tipo_turno})?\n\nEsta acción no se puede deshacer.`
      )
    ) {
      this.serviciosPuestoService
        .delete(servicio.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.snackBar.open('Servicio eliminado exitosamente', 'Cerrar', {
              duration: 3000
            });
            this.cargarServicios();
          },
          error: (error) => {
            console.error('Error al eliminar servicio:', error);
            const mensaje =
              error.error?.message || 'Error al eliminar servicio';
            this.snackBar.open(mensaje, 'Cerrar', { duration: 5000 });
          }
        });
    }
  }
}
