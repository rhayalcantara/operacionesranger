import { Component, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { UsuariosService, Usuario } from '../../../core/services/usuarios.service';
import { AuthService } from '../../../core/services/auth.service';
import { UsuarioFormComponent } from '../usuario-form/usuario-form.component';
import { ResetPasswordDialogComponent } from '../reset-password-dialog/reset-password-dialog.component';
import { UserRole } from '../../../core/models/auth.model';

/**
 * Componente de lista de usuarios
 * Muestra tabla paginada con búsqueda y acciones CRUD
 * Solo accesible por ADMIN
 */
@Component({
  selector: 'app-usuarios-list',
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
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatChipsModule
  ],
  templateUrl: './usuarios-list.component.html',
  styleUrls: ['./usuarios-list.component.scss']
})
export class UsuariosListComponent implements OnInit {
  displayedColumns: string[] = [
    'username',
    'nombre_completo',
    'email',
    'rol',
    'activo',
    'ultimo_acceso',
    'acciones'
  ];

  dataSource: Usuario[] = [];
  totalUsuarios = 0;
  pageSize = 10;
  pageIndex = 0;
  isLoading = signal(false);

  searchTerm = '';
  private searchSubject = new Subject<string>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private usuariosService: UsuariosService,
    private authService: AuthService,
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
      this.loadUsuarios();
    });
  }

  ngOnInit(): void {
    this.loadUsuarios();
  }

  /**
   * Cargar usuarios con filtros actuales
   */
  loadUsuarios(): void {
    this.isLoading.set(true);

    const filters = {
      page: this.pageIndex + 1, // Backend usa páginas 1-indexed
      pageSize: this.pageSize,
      search: this.searchTerm || undefined
    };

    this.usuariosService.getAll(filters).subscribe({
      next: (response) => {
        this.dataSource = response.data;
        this.totalUsuarios = response.total;
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
        this.showError('Error al cargar usuarios');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Manejar cambio de página
   */
  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadUsuarios();
  }

  /**
   * Manejar cambio en búsqueda
   */
  onSearchChange(searchTerm: string): void {
    this.searchSubject.next(searchTerm);
  }

  /**
   * Abrir dialog para crear nuevo usuario
   */
  openCreateDialog(): void {
    const dialogRef = this.dialog.open(UsuarioFormComponent, {
      width: '600px',
      disableClose: true,
      data: { usuario: null, isEdit: false }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsuarios();
        this.showSuccess('Usuario creado exitosamente');
      }
    });
  }

  /**
   * Abrir dialog para editar usuario
   */
  openEditDialog(usuario: Usuario): void {
    const dialogRef = this.dialog.open(UsuarioFormComponent, {
      width: '600px',
      disableClose: true,
      data: { usuario, isEdit: true }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsuarios();
        this.showSuccess('Usuario actualizado exitosamente');
      }
    });
  }

  /**
   * Reset password de usuario
   */
  resetPassword(usuario: Usuario): void {
    if (confirm(`¿Desea resetear la contraseña del usuario "${usuario.username}"?`)) {
      this.isLoading.set(true);

      this.usuariosService.resetPassword(usuario.id).subscribe({
        next: (response) => {
          this.isLoading.set(false);

          // Abrir dialog con password temporal
          this.dialog.open(ResetPasswordDialogComponent, {
            width: '500px',
            data: {
              username: usuario.username,
              temporaryPassword: response.temporaryPassword
            }
          });
        },
        error: (error) => {
          console.error('Error al resetear password:', error);
          this.showError('Error al resetear contraseña');
          this.isLoading.set(false);
        }
      });
    }
  }

  /**
   * Alternar estado activo/inactivo
   */
  toggleActivo(usuario: Usuario): void {
    const accion = usuario.activo ? 'desactivar' : 'activar';

    if (confirm(`¿Está seguro de ${accion} el usuario "${usuario.username}"?`)) {
      this.isLoading.set(true);

      const updateData = {
        email: usuario.email,
        nombre_completo: usuario.nombre_completo,
        rol: usuario.rol,
        activo: !usuario.activo
      };

      this.usuariosService.update(usuario.id, updateData).subscribe({
        next: () => {
          this.showSuccess(`Usuario ${accion === 'activar' ? 'activado' : 'desactivado'} exitosamente`);
          this.loadUsuarios();
        },
        error: (error) => {
          console.error('Error al cambiar estado:', error);
          this.showError('Error al cambiar estado del usuario');
          this.isLoading.set(false);
        }
      });
    }
  }

  /**
   * Eliminar usuario con confirmación
   */
  deleteUsuario(usuario: Usuario): void {
    // Validar que no sea el último ADMIN
    if (usuario.rol === 'ADMIN') {
      this.usuariosService.countByRol('ADMIN').subscribe({
        next: (count) => {
          if (count <= 1) {
            this.showError('No se puede eliminar el último usuario ADMIN del sistema');
            return;
          }
          this.confirmDelete(usuario);
        },
        error: (error) => {
          console.error('Error al validar eliminación:', error);
          this.showError('Error al validar eliminación');
        }
      });
    } else {
      this.confirmDelete(usuario);
    }
  }

  /**
   * Confirmar y ejecutar eliminación
   */
  private confirmDelete(usuario: Usuario): void {
    if (confirm(`¿Está seguro de eliminar el usuario "${usuario.username}"? Esta acción no se puede deshacer.`)) {
      this.isLoading.set(true);

      this.usuariosService.delete(usuario.id).subscribe({
        next: () => {
          this.showSuccess('Usuario eliminado exitosamente');
          this.loadUsuarios();
        },
        error: (error) => {
          console.error('Error al eliminar usuario:', error);
          this.showError('Error al eliminar usuario');
          this.isLoading.set(false);
        }
      });
    }
  }

  /**
   * Obtener clase de color para badge de rol
   */
  getRolClass(rol: UserRole): string {
    const classes: Record<UserRole, string> = {
      'ADMIN': 'rol-admin',
      'SUPERVISOR': 'rol-supervisor',
      'CONSULTA': 'rol-consulta'
    };
    return classes[rol] || '';
  }

  /**
   * Formatear fecha de último acceso
   */
  formatUltimoAcceso(fecha: string | null): string {
    if (!fecha) {
      return 'Nunca';
    }

    const date = new Date(fecha);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;

    return date.toLocaleDateString('es-DO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Verificar si es el usuario actual
   */
  isCurrentUser(usuario: Usuario): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser?.id_usuario === usuario.id;
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
