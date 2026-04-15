import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ReportesService, VistaPreviaItem, VistaPreviaResponse } from '../../../core/services/reportes.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  MarcarProcesadosDialogComponent,
  MarcarProcesadosDialogData,
  MarcarProcesadosDialogResult,
} from '../historial-reportes/marcar-procesados-dialog.component';

/**
 * Componente para generación de reporte CSV de nómina
 * Permite seleccionar rango de fechas, ver vista previa y descargar CSV completo
 */
@Component({
  selector: 'app-reporte-nomina',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './reporte-nomina.component.html',
  styleUrls: ['./reporte-nomina.component.scss']
})
export class ReporteNominaComponent implements OnInit, OnDestroy {
  formulario!: FormGroup;
  isLoadingPreview = false;
  isGeneratingCSV = false;
  showPreview = false;
  csvGenerated = false;
  isAdmin = false;
  previewData: VistaPreviaResponse | null = null;

  // Tabla de vista previa
  displayedColumns: string[] = [
    'fecha',
    'empleado',
    'puesto',
    'horas_normales',
    'horas_extras',
    'total_horas',
    'tipo_turno',
    'es_feriado',
    'incentivo'
  ];
  dataSource = new MatTableDataSource<VistaPreviaItem>([]);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Fecha máxima permitida (hoy)
  maxDate = new Date();

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    public reportesService: ReportesService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.hasRole('ADMIN');
    this.inicializarFormulario();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa el formulario con validaciones
   */
  inicializarFormulario(): void {
    this.formulario = this.fb.group({
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required]
    }, {
      validators: [this.validarRangoFechas, this.validarRangoMaximo]
    });
  }

  /**
   * Validador personalizado para el rango de fechas
   * Verifica que fecha_fin >= fecha_inicio
   */
  validarRangoFechas(group: AbstractControl): ValidationErrors | null {
    const inicio = group.get('fechaInicio')?.value;
    const fin = group.get('fechaFin')?.value;

    if (inicio && fin) {
      const fechaInicio = new Date(inicio);
      const fechaFin = new Date(fin);

      if (fechaFin < fechaInicio) {
        return { rangoInvalido: true };
      }
    }

    return null;
  }

  /**
   * Validador personalizado para máximo 31 días de diferencia
   */
  validarRangoMaximo(group: AbstractControl): ValidationErrors | null {
    const inicio = group.get('fechaInicio')?.value;
    const fin = group.get('fechaFin')?.value;

    if (inicio && fin) {
      const fechaInicio = new Date(inicio);
      const fechaFin = new Date(fin);

      const diffTime = Math.abs(fechaFin.getTime() - fechaInicio.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 31) {
        return { rangoMaximo: true };
      }
    }

    return null;
  }

  /**
   * Aplica un preset de fechas
   */
  aplicarPresetFecha(preset: string): void {
    let fechas: { fecha_inicio: string; fecha_fin: string };

    switch (preset) {
      case 'quincena_actual':
        fechas = this.reportesService.getQuincenaActual();
        break;

      case 'quincena_anterior':
        fechas = this.reportesService.getQuincenaAnterior();
        break;

      case 'mes_actual':
        fechas = this.reportesService.getMesActual();
        break;

      case 'mes_anterior':
        fechas = this.reportesService.getMesAnterior();
        break;

      default:
        return;
    }

    this.formulario.patchValue({
      fechaInicio: new Date(fechas.fecha_inicio),
      fechaFin: new Date(fechas.fecha_fin)
    });

    // Limpiar vista previa al cambiar fechas
    this.limpiarVistaPrevia();
  }

  /**
   * Ver vista previa de los datos
   */
  verVistaPrevia(): void {
    if (this.formulario.invalid) {
      this.mostrarErrorValidacion();
      return;
    }

    this.isLoadingPreview = true;
    this.showPreview = false;

    const fechaInicio = this.reportesService.formatDate(this.formulario.value.fechaInicio);
    const fechaFin = this.reportesService.formatDate(this.formulario.value.fechaFin);

    this.reportesService.vistaPrevia(fechaInicio, fechaFin)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.previewData = response;
          this.dataSource.data = response.data;
          this.showPreview = true;
          this.isLoadingPreview = false;

          // Configurar sort y paginator
          setTimeout(() => {
            if (this.sort) {
              this.dataSource.sort = this.sort;
            }
            if (this.paginator) {
              this.dataSource.paginator = this.paginator;
            }
          });

          if (response.total === 0) {
            this.snackBar.open('No hay turnos registrados en el periodo seleccionado', 'Cerrar', {
              duration: 4000,
              panelClass: ['info-snackbar']
            });
          } else {
            this.snackBar.open(`Vista previa cargada: ${response.total} registros encontrados`, 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
          }
        },
        error: (error) => {
          console.error('Error al cargar vista previa:', error);
          this.isLoadingPreview = false;
          this.snackBar.open('Error al cargar vista previa. Intente nuevamente.', 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  /**
   * Genera y descarga el reporte CSV completo
   */
  generarCSV(): void {
    if (this.formulario.invalid) {
      this.mostrarErrorValidacion();
      return;
    }

    if (!this.showPreview) {
      this.snackBar.open('Por favor, visualice la vista previa antes de generar el reporte', 'Cerrar', {
        duration: 4000,
        panelClass: ['warning-snackbar']
      });
      return;
    }

    this.isGeneratingCSV = true;

    const fechaInicio = this.reportesService.formatDate(this.formulario.value.fechaInicio);
    const fechaFin = this.reportesService.formatDate(this.formulario.value.fechaFin);

    this.reportesService.generarReporteNomina({ fecha_inicio: fechaInicio, fecha_fin: fechaFin })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          this.descargarCSV(blob, fechaInicio, fechaFin);
          this.isGeneratingCSV = false;
          this.csvGenerated = true;

          const totalRegistros = this.previewData?.total || 0;
          this.snackBar.open(`Reporte generado: ${totalRegistros} registros exportados`, 'Cerrar', {
            duration: 5000,
            panelClass: ['success-snackbar']
          });
        },
        error: (error) => {
          console.error('Error al generar CSV:', error);
          this.isGeneratingCSV = false;
          this.snackBar.open('Error al generar reporte CSV. Intente nuevamente.', 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  /**
   * Descarga el archivo CSV en el navegador
   */
  private descargarCSV(blob: Blob, fechaInicio: string, fechaFin: string): void {
    const filename = `nomina_${fechaInicio.replace(/-/g, '')}_${fechaFin.replace(/-/g, '')}.csv`;
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Calcula el total de horas para una fila
   */
  calcularTotalHoras(item: VistaPreviaItem): number {
    return item.horas_normales + item.horas_extras;
  }

  /**
   * Formatea un número como moneda dominicana
   */
  formatCurrency(amount: number): string {
    return `RD$ ${amount.toFixed(2)}`;
  }

  /**
   * Formatea una fecha ISO a DD/MM/YYYY
   */
  formatFechaDisplay(fecha: string): string {
    if (!fecha) return '';
    const [year, month, day] = fecha.split('-');
    return `${day}/${month}/${year}`;
  }

  /**
   * Obtiene la clase CSS para el chip de tipo turno
   */
  getTipoTurnoClass(tipo: string): string {
    return tipo === 'DIURNO' ? 'chip-diurno' : 'chip-nocturno';
  }

  /**
   * Obtiene el icono para el tipo de turno
   */
  getTipoTurnoIcon(tipo: string): string {
    return tipo === 'DIURNO' ? 'wb_sunny' : 'nights_stay';
  }

  /**
   * Abre dialog para marcar turnos como procesados despues de generar CSV
   */
  marcarProcesado(): void {
    const fechaInicio = this.reportesService.formatDate(this.formulario.value.fechaInicio);
    const fechaFin = this.reportesService.formatDate(this.formulario.value.fechaFin);

    const dialogData: MarcarProcesadosDialogData = {
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      cantidad_turnos: this.previewData?.total || 0,
    };

    const dialogRef = this.dialog.open(MarcarProcesadosDialogComponent, {
      width: '450px',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe((result: MarcarProcesadosDialogResult | undefined) => {
      if (result) {
        this.reportesService
          .marcarProcesados({
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            nomina_id: result.nomina_id,
          })
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              this.snackBar.open(
                `${response.turnos_procesados} turnos marcados como procesados (Nomina #${result.nomina_id})`,
                'Cerrar',
                { duration: 5000, panelClass: ['success-snackbar'] }
              );
              this.csvGenerated = false;
              this.limpiarVistaPrevia();
            },
            error: (error) => {
              console.error('Error marking as processed:', error);
              this.snackBar.open('Error al marcar turnos como procesados', 'Cerrar', {
                duration: 5000,
                panelClass: ['error-snackbar'],
              });
            },
          });
      }
    });
  }

  /**
   * Limpia la vista previa
   */
  private limpiarVistaPrevia(): void {
    this.showPreview = false;
    this.previewData = null;
    this.dataSource.data = [];
  }

  /**
   * Limpia el formulario y la vista previa
   */
  limpiar(): void {
    this.formulario.reset();
    this.csvGenerated = false;
    this.limpiarVistaPrevia();
  }

  /**
   * Muestra mensaje de error de validación
   */
  private mostrarErrorValidacion(): void {
    const errors = this.formulario.errors;

    if (errors?.['rangoInvalido']) {
      this.snackBar.open('La fecha final debe ser mayor o igual a la fecha inicial', 'Cerrar', {
        duration: 4000,
        panelClass: ['error-snackbar']
      });
    } else if (errors?.['rangoMaximo']) {
      this.snackBar.open('El rango de fechas no puede ser mayor a 31 días', 'Cerrar', {
        duration: 4000,
        panelClass: ['error-snackbar']
      });
    } else {
      this.snackBar.open('Por favor complete todos los campos correctamente', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  /**
   * Verifica si el botón de generar CSV debe estar habilitado
   */
  get puedeGenerarCSV(): boolean {
    return this.formulario.valid && this.showPreview && !this.isGeneratingCSV && (this.previewData?.total || 0) > 0;
  }

  /**
   * Verifica si el botón de vista previa debe estar habilitado
   */
  get puedeVerVistaPrevia(): boolean {
    return this.formulario.valid && !this.isLoadingPreview;
  }
}
