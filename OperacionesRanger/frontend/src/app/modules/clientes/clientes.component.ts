import { Component, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ClientesService, Cliente } from '../../core/services/clientes.service';
import { ClienteFormComponent } from './cliente-form/cliente-form.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-clientes',
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
    MatCheckboxModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    MatCardModule
  ],
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.scss']
})
export class ClientesComponent implements OnInit {
  displayedColumns: string[] = [
    'codigo',
    'nombre',
    'ruc',
    'telefono',
    'email',
    'contacto_nombre',
    'activo',
    'acciones'
  ];

  dataSource: Cliente[] = [];
  totalClientes = 0;
  pageSize = 10;
  pageIndex = 0;
  isLoading = signal(false);

  searchControl = new FormControl('');
  soloActivosControl = new FormControl(true);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private clientesService: ClientesService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.cargarClientes();
    this.setupSearchDebounce();
    this.setupSoloActivosListener();
  }

  /**
   * Configura el debounce para la búsqueda
   */
  setupSearchDebounce(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.pageIndex = 0;
        this.cargarClientes();
      });
  }

  /**
   * Configura el listener para el filtro "Solo activos"
   */
  setupSoloActivosListener(): void {
    this.soloActivosControl.valueChanges.subscribe(() => {
      this.pageIndex = 0;
      this.cargarClientes();
    });
  }

  /**
   * Carga la lista de clientes desde el backend
   */
  cargarClientes(): void {
    this.isLoading.set(true);

    const filters = {
      page: this.pageIndex + 1,
      pageSize: this.pageSize,
      search: this.searchControl.value || undefined,
      activo: this.soloActivosControl.value ? true : undefined
    };

    this.clientesService.getAll(filters).subscribe({
      next: (response) => {
        this.dataSource = response.data;
        this.totalClientes = response.total;
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar clientes:', error);
        this.snackBar.open('Error al cargar clientes', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Maneja el cambio de página
   */
  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.cargarClientes();
  }

  /**
   * Abre el formulario para crear un nuevo cliente
   */
  abrirFormularioCrear(): void {
    const dialogRef = this.dialog.open(ClienteFormComponent, {
      width: '600px',
      disableClose: true,
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarClientes();
      }
    });
  }

  /**
   * Abre el formulario para editar un cliente existente
   */
  abrirFormularioEditar(cliente: Cliente): void {
    const dialogRef = this.dialog.open(ClienteFormComponent, {
      width: '600px',
      disableClose: true,
      data: { cliente }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarClientes();
      }
    });
  }

  /**
   * Elimina un cliente previa confirmación
   */
  eliminarCliente(cliente: Cliente): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmar Eliminación',
        message: `¿Está seguro que desea eliminar el cliente "${cliente.nombre}"?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.isLoading.set(true);

        this.clientesService.delete(cliente.id).subscribe({
          next: () => {
            this.snackBar.open('Cliente eliminado exitosamente', 'Cerrar', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
            this.cargarClientes();
          },
          error: (error) => {
            console.error('Error al eliminar cliente:', error);

            let mensaje = 'Error al eliminar cliente';
            if (error.error?.message) {
              mensaje += ': ' + error.error.message;
            }

            this.snackBar.open(mensaje, 'Cerrar', {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
            this.isLoading.set(false);
          }
        });
      }
    });
  }

  /**
   * Limpia los filtros de búsqueda
   */
  limpiarFiltros(): void {
    this.searchControl.setValue('');
    this.soloActivosControl.setValue(true);
    this.pageIndex = 0;
  }
}
