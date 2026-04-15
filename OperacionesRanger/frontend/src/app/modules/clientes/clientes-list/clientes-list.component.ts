import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ClientesService, Cliente } from '../../../core/services/clientes.service';
import { ClienteFormComponent } from '../cliente-form/cliente-form.component';

/**
 * Componente de lista de clientes
 * Muestra tabla paginada con búsqueda y acciones CRUD
 */
@Component({
  selector: 'app-clientes-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatCardModule
  ],
  templateUrl: './clientes-list.component.html',
  styleUrls: ['./clientes-list.component.scss']
})
export class ClientesListComponent implements OnInit {
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
  isLoading = false;

  searchTerm = '';
  soloActivos = true;
  private searchSubject = new Subject<string>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private clientesService: ClientesService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    // Configurar debounce para búsqueda
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.pageIndex = 0; // Reset a primera página
      this.loadClientes();
    });
  }

  ngOnInit(): void {
    this.loadClientes();
  }

  /**
   * Cargar clientes con filtros actuales
   */
  loadClientes(): void {
    this.isLoading = true;

    const filters = {
      page: this.pageIndex + 1, // Backend usa páginas 1-indexed
      pageSize: this.pageSize,
      search: this.searchTerm || undefined,
      activo: this.soloActivos ? true : undefined
    };

    this.clientesService.getAll(filters).subscribe({
      next: (response) => {
        this.dataSource = response.data;
        this.totalClientes = response.total;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar clientes:', error);
        this.showError('Error al cargar clientes');
        this.isLoading = false;
      }
    });
  }

  /**
   * Manejar cambio de página
   */
  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadClientes();
  }

  /**
   * Manejar cambio en búsqueda
   */
  onSearchChange(searchTerm: string): void {
    this.searchSubject.next(searchTerm);
  }

  /**
   * Manejar cambio en filtro "Solo activos"
   */
  onSoloActivosChange(): void {
    this.pageIndex = 0;
    this.loadClientes();
  }

  /**
   * Abrir dialog para crear nuevo cliente
   */
  openCreateDialog(): void {
    const dialogRef = this.dialog.open(ClienteFormComponent, {
      width: '600px',
      disableClose: true,
      data: { cliente: null, isEdit: false }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadClientes();
        this.showSuccess('Cliente creado exitosamente');
      }
    });
  }

  /**
   * Abrir dialog para editar cliente
   */
  openEditDialog(cliente: Cliente): void {
    const dialogRef = this.dialog.open(ClienteFormComponent, {
      width: '600px',
      disableClose: true,
      data: { cliente, isEdit: true }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadClientes();
        this.showSuccess('Cliente actualizado exitosamente');
      }
    });
  }

  /**
   * Eliminar cliente con confirmación
   */
  deleteCliente(cliente: Cliente): void {
    if (confirm(`¿Está seguro de eliminar el cliente "${cliente.nombre}"?`)) {
      this.isLoading = true;

      this.clientesService.delete(cliente.id).subscribe({
        next: () => {
          this.showSuccess('Cliente eliminado exitosamente');
          this.loadClientes();
        },
        error: (error) => {
          console.error('Error al eliminar cliente:', error);
          this.showError('Error al eliminar cliente');
          this.isLoading = false;
        }
      });
    }
  }

  /**
   * Mostrar mensaje de éxito
   */
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Mostrar mensaje de error
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}
