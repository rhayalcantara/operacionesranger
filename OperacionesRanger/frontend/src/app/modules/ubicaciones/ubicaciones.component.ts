import { Component, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { debounceTime } from 'rxjs/operators';

import { UbicacionesService, Ubicacion } from '../../core/services/ubicaciones.service';
import { ClientesService, Cliente } from '../../core/services/clientes.service';
import { UbicacionFormComponent } from './ubicacion-form/ubicacion-form.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-ubicaciones',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
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
    MatChipsModule
  ],
  templateUrl: './ubicaciones.component.html',
  styleUrls: ['./ubicaciones.component.scss']
})
export class UbicacionesComponent implements OnInit {
  displayedColumns: string[] = [
    'codigo',
    'nombre',
    'cliente',
    'provincia',
    'municipio',
    'direccion',
    'coordenadas_gps',
    'activo',
    'acciones'
  ];

  dataSource: Ubicacion[] = [];
  totalUbicaciones = 0;
  pageSize = 10;
  pageIndex = 0;
  isLoading = signal(false);

  searchControl = new FormControl('');
  clienteFilterControl = new FormControl<number | null>(null);
  clientesDisponibles: Cliente[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private ubicacionesService: UbicacionesService,
    private clientesService: ClientesService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.cargarClientesParaFiltro();
    this.cargarUbicaciones();
    this.setupSearchDebounce();
    this.setupClienteFilterListener();
  }

  /**
   * Carga la lista de clientes activos para el filtro
   */
  cargarClientesParaFiltro(): void {
    this.clientesService.getAll({ activo: true, pageSize: 1000 })
      .subscribe({
        next: (response) => {
          this.clientesDisponibles = response.data;
        },
        error: (error) => {
          console.error('Error al cargar clientes:', error);
          this.snackBar.open('Error al cargar clientes', 'Cerrar', { duration: 3000 });
        }
      });
  }

  /**
   * Configura el debounce para la búsqueda
   */
  setupSearchDebounce(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(500))
      .subscribe(() => {
        this.pageIndex = 0;
        this.cargarUbicaciones();
      });
  }

  /**
   * Configura el listener para el filtro de cliente
   */
  setupClienteFilterListener(): void {
    this.clienteFilterControl.valueChanges.subscribe(() => {
      this.pageIndex = 0;
      this.cargarUbicaciones();
    });
  }

  /**
   * Carga las ubicaciones con filtros y paginación
   */
  cargarUbicaciones(): void {
    this.isLoading.set(true);

    const filters = {
      page: this.pageIndex + 1,
      pageSize: this.pageSize,
      search: this.searchControl.value || undefined,
      cliente_id: this.clienteFilterControl.value || undefined
    };

    this.ubicacionesService.getAll(filters)
      .subscribe({
        next: (response) => {
          this.dataSource = response.data;
          this.totalUbicaciones = response.total;
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error al cargar ubicaciones:', error);
          this.snackBar.open('Error al cargar ubicaciones', 'Cerrar', { duration: 3000 });
          this.isLoading.set(false);
        }
      });
  }

  /**
   * Maneja el cambio de página
   */
  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarUbicaciones();
  }

  /**
   * Limpia el filtro de cliente
   */
  limpiarFiltroCliente(): void {
    this.clienteFilterControl.setValue(null);
  }

  /**
   * Abre el diálogo para crear una nueva ubicación
   */
  abrirFormularioCrear(): void {
    const dialogRef = this.dialog.open(UbicacionFormComponent, {
      width: '600px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarUbicaciones();
      }
    });
  }

  /**
   * Abre el diálogo para editar una ubicación
   */
  abrirFormularioEditar(ubicacion: Ubicacion): void {
    const dialogRef = this.dialog.open(UbicacionFormComponent, {
      width: '600px',
      disableClose: true,
      data: { ubicacion }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarUbicaciones();
      }
    });
  }

  /**
   * Elimina una ubicación con confirmación
   */
  eliminarUbicacion(ubicacion: Ubicacion): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmar eliminación',
        message: `¿Está seguro de eliminar la ubicación "${ubicacion.nombre}"?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.isLoading.set(true);
        this.ubicacionesService.delete(ubicacion.id)
          .subscribe({
            next: () => {
              this.snackBar.open('Ubicación eliminada exitosamente', 'Cerrar', { duration: 3000 });
              this.cargarUbicaciones();
            },
            error: (error) => {
              console.error('Error al eliminar ubicación:', error);
              const mensaje = error.error?.message || 'Error al eliminar ubicación';
              this.snackBar.open(mensaje, 'Cerrar', { duration: 5000 });
              this.isLoading.set(false);
            }
          });
      }
    });
  }

  /**
   * Formatea las coordenadas GPS para mostrar
   */
  formatCoordenadasGps(ubicacion: any): string {
    if (ubicacion.latitud && ubicacion.longitud) {
      return `${parseFloat(ubicacion.latitud).toFixed(5)}, ${parseFloat(ubicacion.longitud).toFixed(5)}`;
    }
    if (ubicacion.coordenadas_gps) return ubicacion.coordenadas_gps;
    return '-';
  }

  /**
   * Obtiene el nombre del cliente desde el objeto join
   */
  getNombreCliente(ubicacion: any): string {
    return ubicacion.cliente_nombre || ubicacion.cliente?.nombre || '-';
  }
}
