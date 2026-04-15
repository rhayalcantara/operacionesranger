import { Component, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import {
  FeriadosService,
  Feriado,
  TipoFeriado
} from '../../../core/services/feriados.service';
import { FeriadoFormComponent } from '../feriado-form/feriado-form.component';

/**
 * Componente de lista de feriados con calendario visual
 * Muestra calendario marcando feriados y tabla paginada con búsqueda
 */
@Component({
  selector: 'app-feriados-list',
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
    MatSelectModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './feriados-list.component.html',
  styleUrls: ['./feriados-list.component.scss']
})
export class FeriadosListComponent implements OnInit {
  displayedColumns: string[] = [
    'fecha',
    'nombre',
    'tipo',
    'descripcion',
    'acciones'
  ];

  dataSource: Feriado[] = [];
  totalFeriados = 0;
  pageSize = 10;
  pageIndex = 0;
  isLoading = signal(false);

  // Filtros
  anioSeleccionado: number;
  tipoSeleccionado: string = 'TODOS';
  aniosDisponibles: number[] = [];

  // Opciones de tipo
  tiposOptions = [
    { value: 'TODOS', label: 'Todos' },
    { value: TipoFeriado.NACIONAL, label: 'Nacional' },
    { value: TipoFeriado.DECRETO, label: 'Decreto' }
  ];

  // Calendario
  selectedDate: Date = new Date();
  feriadosDelAnio: Feriado[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private feriadosService: FeriadosService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.anioSeleccionado = new Date().getFullYear();
    this.aniosDisponibles = this.feriadosService.getAñosDisponibles();
  }

  ngOnInit(): void {
    this.loadFeriados();
    this.loadFeriadosParaCalendario();
  }

  /**
   * Cargar feriados con filtros actuales (para tabla)
   */
  loadFeriados(): void {
    this.isLoading.set(true);

    const filters = {
      page: this.pageIndex + 1,
      pageSize: this.pageSize,
      año: this.anioSeleccionado,
      tipo: this.tipoSeleccionado !== 'TODOS' ? this.tipoSeleccionado as TipoFeriado : undefined
    };

    this.feriadosService.getAll(filters).subscribe({
      next: (response) => {
        this.dataSource = response.data;
        this.totalFeriados = response.total;
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar feriados:', error);
        this.showError('Error al cargar feriados');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Cargar todos los feriados del año seleccionado (para calendario)
   */
  loadFeriadosParaCalendario(): void {
    this.feriadosService.getFeriadosPorAño(this.anioSeleccionado).subscribe({
      next: (feriados) => {
        this.feriadosDelAnio = feriados;
      },
      error: (error) => {
        console.error('Error al cargar feriados para calendario:', error);
      }
    });
  }

  /**
   * Clase personalizada para fechas del calendario (marcar feriados)
   */
  dateClass = (date: Date): string => {
    const dateStr = date.toISOString().split('T')[0];
    const feriado = this.feriadosDelAnio.find(f => f.fecha === dateStr);

    if (feriado) {
      return feriado.tipo === TipoFeriado.NACIONAL
        ? 'feriado-nacional'
        : 'feriado-decreto';
    }

    return '';
  };

  /**
   * Manejar selección de fecha en calendario
   */
  onDateSelected(date: Date | null): void {
    if (!date) return;

    const dateStr = date.toISOString().split('T')[0];
    const feriado = this.feriadosDelAnio.find(f => f.fecha === dateStr);

    if (feriado) {
      // Si existe un feriado, abrir dialog de edición
      this.openEditDialog(feriado);
    } else {
      // Si no existe, abrir dialog de creación con fecha preseleccionada
      this.openCreateDialog(dateStr);
    }
  }

  /**
   * Manejar cambio de mes en calendario
   */
  onMonthSelected(date: Date): void {
    const anio = date.getFullYear();
    if (anio !== this.anioSeleccionado) {
      this.anioSeleccionado = anio;
      this.onAnioChange();
    }
  }

  /**
   * Manejar cambio de página
   */
  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadFeriados();
  }

  /**
   * Manejar cambio de año
   */
  onAnioChange(): void {
    this.pageIndex = 0;
    this.loadFeriados();
    this.loadFeriadosParaCalendario();
  }

  /**
   * Manejar cambio de tipo
   */
  onTipoChange(): void {
    this.pageIndex = 0;
    this.loadFeriados();
  }

  /**
   * Abrir dialog para crear nuevo feriado
   */
  openCreateDialog(fechaInicial?: string): void {
    const dialogRef = this.dialog.open(FeriadoFormComponent, {
      width: '600px',
      disableClose: true,
      data: { feriado: null, fecha: fechaInicial }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadFeriados();
        this.loadFeriadosParaCalendario();
        this.showSuccess('Feriado creado exitosamente');
      }
    });
  }

  /**
   * Abrir dialog para editar feriado
   */
  openEditDialog(feriado: Feriado): void {
    const dialogRef = this.dialog.open(FeriadoFormComponent, {
      width: '600px',
      disableClose: true,
      data: { feriado }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadFeriados();
        this.loadFeriadosParaCalendario();
        this.showSuccess('Feriado actualizado exitosamente');
      }
    });
  }

  /**
   * Eliminar feriado con confirmación
   */
  deleteFeriado(feriado: Feriado): void {
    if (confirm(`¿Está seguro de eliminar el feriado "${feriado.nombre}"?`)) {
      this.isLoading.set(true);

      this.feriadosService.delete(feriado.id).subscribe({
        next: () => {
          this.showSuccess('Feriado eliminado exitosamente');
          this.loadFeriados();
          this.loadFeriadosParaCalendario();
        },
        error: (error) => {
          console.error('Error al eliminar feriado:', error);
          this.showError('Error al eliminar feriado');
          this.isLoading.set(false);
        }
      });
    }
  }

  /**
   * Obtener clase CSS para chip de tipo
   */
  getTipoChipClass(tipo: TipoFeriado): string {
    return tipo === TipoFeriado.NACIONAL ? 'tipo-nacional' : 'tipo-decreto';
  }

  /**
   * Formatear fecha para visualización
   */
  formatFecha(fecha: string): string {
    const date = new Date(fecha + 'T00:00:00'); // Evitar problemas de timezone
    return date.toLocaleDateString('es-DO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
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
