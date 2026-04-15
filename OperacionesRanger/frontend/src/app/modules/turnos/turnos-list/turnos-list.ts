import { Component, OnInit, OnDestroy, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

// Angular Material
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
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

// Services
import { TurnosService, Turno, TurnosFilters } from '../../../core/services/turnos.service';
import { RrhhService, Guardian } from '../../../core/services/rrhh.service';
import { PuestosService, Puesto } from '../../../core/services/puestos.service';
import { AuthService } from '../../../core/services/auth.service';

// Components
import { TurnoFormComponent } from '../turno-form/turno-form.component';
import { TurnoDetalleDialogComponent } from '../turno-detalle-dialog/turno-detalle-dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-turnos-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
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
    MatCardModule,
    MatChipsModule,
    MatExpansionModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatAutocompleteModule
  ],
  templateUrl: './turnos-list.html',
  styleUrls: ['./turnos-list.scss']
})
export class TurnosListComponent implements OnInit, OnDestroy {
  // Table configuration
  displayedColumns: string[] = [
    'fecha',
    'guardian',
    'puesto',
    'horario',
    'horas_normales',
    'horas_extras',
    'total_horas',
    'tipo_turno',
    'es_feriado',
    'procesado',
    'acciones'
  ];

  dataSource: Turno[] = [];
  totalTurnos = 0;
  pageSize = 25;
  pageIndex = 0;
  pageSizeOptions = [10, 25, 50, 100];
  isLoading = signal(false);

  // Search
  searchTerm = '';
  private searchSubject = new Subject<string>();

  // Filters form
  filtrosForm!: FormGroup;
  panelOpenState = false;

  // User permissions
  canEdit = false;
  canDelete = false;

  // Destroy subject
  private destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private fb: FormBuilder,
    private turnosService: TurnosService,
    private rrhhService: RrhhService,
    private puestosService: PuestosService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    // Setup search debounce
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.pageIndex = 0;
      this.loadTurnos();
    });
  }

  ngOnInit(): void {
    this.checkPermissions();
    this.buildFiltrosForm();
    this.loadTurnos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Check user permissions
   */
  checkPermissions(): void {
    this.canEdit = this.authService.hasRole('ADMIN', 'SUPERVISOR');
    this.canDelete = this.authService.hasRole('ADMIN');
  }

  /**
   * Build filters form
   */
  buildFiltrosForm(): void {
    this.filtrosForm = this.fb.group({
      fecha_inicio: [null],
      fecha_fin: [null],
      empleado_id: [null],
      puesto_id: [null],
      tipo_turno: [''],
      es_feriado: [false],
      procesado_nomina: [false]
    });
  }

  /**
   * Load turnos with current filters
   */
  loadTurnos(): void {
    this.isLoading.set(true);

    const formValue = this.filtrosForm.value;
    const filters: TurnosFilters = {
      page: this.pageIndex + 1,
      pageSize: this.pageSize,
      search: this.searchTerm || undefined
    };

    // Add filters from form
    if (formValue.fecha_inicio) {
      filters.fecha_inicio = this.formatDate(formValue.fecha_inicio);
    }
    if (formValue.fecha_fin) {
      filters.fecha_fin = this.formatDate(formValue.fecha_fin);
    }
    if (formValue.empleado_id) {
      filters.empleado_id = formValue.empleado_id;
    }
    if (formValue.puesto_id) {
      filters.puesto_id = formValue.puesto_id;
    }
    if (formValue.tipo_turno) {
      filters.tipo_turno = formValue.tipo_turno;
    }
    if (formValue.es_feriado) {
      filters.es_feriado = true;
    }
    if (formValue.procesado_nomina) {
      filters.procesado_nomina = true;
    }

    this.turnosService.getAll(filters).subscribe({
      next: (response) => {
        this.dataSource = response.data;
        this.totalTurnos = response.total;
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading turnos:', error);
        this.showError('Error al cargar turnos');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Handle page change
   */
  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadTurnos();
  }

  /**
   * Handle search change
   */
  onSearchChange(searchTerm: string): void {
    this.searchSubject.next(searchTerm);
  }

  /**
   * Apply filters
   */
  aplicarFiltros(): void {
    this.pageIndex = 0;
    this.loadTurnos();
  }

  /**
   * Clear filters
   */
  limpiarFiltros(): void {
    this.filtrosForm.reset({
      fecha_inicio: null,
      fecha_fin: null,
      empleado_id: null,
      puesto_id: null,
      tipo_turno: '',
      es_feriado: false,
      procesado_nomina: false
    });
    this.searchTerm = '';
    this.pageIndex = 0;
    this.loadTurnos();
  }

  /**
   * Open create dialog
   */
  crearTurno(): void {
    const dialogRef = this.dialog.open(TurnoFormComponent, {
      width: '800px',
      maxWidth: '90vw',
      disableClose: true,
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.showSuccess('Turno creado exitosamente');
        this.loadTurnos();
      }
    });
  }

  /**
   * Open edit dialog
   */
  editarTurno(turno: Turno): void {
    if (!this.canEdit) {
      this.showError('No tiene permisos para editar turnos');
      return;
    }

    if (turno.procesado_nomina) {
      this.showError('No se puede editar un turno procesado en nómina');
      return;
    }

    const dialogRef = this.dialog.open(TurnoFormComponent, {
      width: '800px',
      maxWidth: '90vw',
      disableClose: true,
      data: { turno }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.showSuccess('Turno actualizado exitosamente');
        this.loadTurnos();
      }
    });
  }

  /**
   * Delete turno with confirmation
   */
  eliminarTurno(turno: Turno): void {
    if (!this.canDelete) {
      this.showError('No tiene permisos para eliminar turnos');
      return;
    }

    if (turno.procesado_nomina) {
      this.showError('No se puede eliminar un turno procesado en nómina');
      return;
    }

    const dialogData: ConfirmDialogData = {
      title: 'Confirmar Eliminación',
      message: `¿Está seguro de eliminar este turno?\n\nGuardián: ${turno.empleado?.nombre || 'N/A'}\nFecha: ${turno.fecha}\n\nEsta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      confirmColor: 'warn'
    };

    const confirmDialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData
    });

    confirmDialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.isLoading.set(true);
        this.turnosService.delete(turno.id).subscribe({
          next: () => {
            this.showSuccess('Turno eliminado exitosamente');
            this.loadTurnos();
          },
          error: (error) => {
            console.error('Error deleting turno:', error);
            this.showError('Error al eliminar turno');
            this.isLoading.set(false);
          }
        });
      }
    });
  }

  /**
   * Open details dialog
   */
  verDetalles(turno: Turno): void {
    this.dialog.open(TurnoDetalleDialogComponent, {
      width: '700px',
      maxWidth: '90vw',
      data: turno
    });
  }

  /**
   * Get total hours for a turno
   */
  getTotalHoras(turno: Turno): number {
    return turno.horas_normales + turno.horas_extras;
  }

  /**
   * Check if row should be disabled (procesado)
   */
  isRowDisabled(turno: Turno): boolean {
    return turno.procesado_nomina;
  }

  /**
   * Format date to YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Show success message
   */
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}
