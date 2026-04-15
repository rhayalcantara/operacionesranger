import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { Subject, Observable, of } from 'rxjs';
import { takeUntil, debounceTime, switchMap, startWith, map, catchError } from 'rxjs/operators';

import { ReporteHorasService, ReporteHorasResult, ReporteHorasFila } from '../../../core/services/reporte-horas.service';
import { RrhhService, Guardian } from '../../../core/services/rrhh.service';
import { PuestosService, Puesto } from '../../../core/services/puestos.service';

/**
 * Componente para el reporte de horas trabajadas con tabla pivot
 * Muestra horas por empleado o puesto cruzadas con fechas del periodo
 */
@Component({
  selector: 'app-reporte-horas',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatRadioModule,
    MatAutocompleteModule,
    MatSelectModule
  ],
  templateUrl: './reporte-horas.component.html',
  styleUrls: ['./reporte-horas.component.scss']
})
export class ReporteHorasComponent implements OnInit, OnDestroy {
  formulario!: FormGroup;
  isLoading = false;
  showResults = false;
  reporteData: ReporteHorasResult | null = null;

  // Autocomplete empleados
  empleadoControl = new FormControl<string | Guardian>('');
  empleadosFiltrados$: Observable<Guardian[]> = of([]);

  // Lista de puestos
  puestos: Puesto[] = [];

  // Fecha máxima (hoy)
  maxDate = new Date();

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private reporteHorasService: ReporteHorasService,
    private rrhhService: RrhhService,
    private puestosService: PuestosService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
    this.configurarAutocompleteEmpleados();
    this.cargarPuestos();
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
      fechaFin: ['', Validators.required],
      tipo: ['empleado', Validators.required],
      puesto_id: [null]
    }, {
      validators: [this.validarRangoFechas, this.validarRangoMaximo]
    });

    // Limpiar resultados al cambiar tipo
    this.formulario.get('tipo')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.empleadoControl.setValue('');
        this.formulario.get('puesto_id')!.setValue(null);
        this.limpiarResultados();
      });
  }

  /**
   * Configura el autocomplete de empleados con búsqueda
   */
  configurarAutocompleteEmpleados(): void {
    this.empleadosFiltrados$ = this.empleadoControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap(value => {
        const searchTerm = typeof value === 'string' ? value : '';
        if (searchTerm.length < 2) {
          return of([]);
        }
        return this.rrhhService.buscarGuardianes(searchTerm).pipe(
          map(response => response.data),
          catchError(() => of([]))
        );
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Carga la lista de puestos activos
   */
  cargarPuestos(): void {
    this.puestosService.getAll({ activo: true, pageSize: 1000 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.puestos = response.data;
        },
        error: () => {
          // Silenciar error, el selector simplemente no tendrá opciones
        }
      });
  }

  /**
   * Display function para el autocomplete de empleados
   */
  displayEmpleado(guardian: Guardian): string {
    return guardian ? `${guardian.nombres} ${guardian.apellidos} (${guardian.cedula_empleado})` : '';
  }

  /**
   * Validador: fecha fin >= fecha inicio
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
   * Validador: máximo 31 días
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
   * Genera el reporte
   */
  generarReporte(): void {
    if (this.formulario.invalid) {
      this.mostrarErrorValidacion();
      return;
    }

    this.isLoading = true;
    this.showResults = false;

    const fechaInicio = this.formatDate(this.formulario.value.fechaInicio);
    const fechaFin = this.formatDate(this.formulario.value.fechaFin);
    const tipo = this.formulario.value.tipo;

    const filters: any = {
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      tipo
    };

    // Agregar filtro opcional de empleado
    if (tipo === 'empleado' && this.empleadoControl.value && typeof this.empleadoControl.value === 'object') {
      filters.empleado_id = (this.empleadoControl.value as Guardian).id_empleado;
    }

    // Agregar filtro opcional de puesto
    if (tipo === 'puesto' && this.formulario.value.puesto_id) {
      filters.puesto_id = this.formulario.value.puesto_id;
    }

    this.reporteHorasService.getReporte(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.reporteData = data;
          this.showResults = true;
          this.isLoading = false;
          this.cdr.detectChanges();

          if (data.total_registros === 0) {
            this.snackBar.open('No se encontraron registros en el periodo seleccionado', 'Cerrar', {
              duration: 4000,
              panelClass: ['info-snackbar']
            });
          } else {
            this.snackBar.open(`Reporte generado: ${data.total_registros} registros`, 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
          }
        },
        error: (error) => {
          console.error('Error al generar reporte:', error);
          this.isLoading = false;
          this.snackBar.open('Error al generar el reporte. Intente nuevamente.', 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  /**
   * Exporta los resultados a CSV
   */
  exportarCSV(): void {
    if (!this.reporteData) return;
    this.reporteHorasService.exportToCsv(this.reporteData);
    this.snackBar.open('Archivo CSV descargado', 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Obtiene el valor de horas para una celda
   */
  getHorasCelda(fila: ReporteHorasFila, fecha: string): string {
    const valor = fila.dias[fecha];
    if (valor === undefined || valor === null) return '-';
    return valor.toFixed(1);
  }

  /**
   * Verifica si una celda tiene horas > 12 (overtime highlight)
   */
  isHorasAltas(fila: ReporteHorasFila, fecha: string): boolean {
    const valor = fila.dias[fecha];
    return valor !== undefined && valor !== null && valor > 12;
  }

  /**
   * Calcula el total general de horas
   */
  get totalHorasGeneral(): number {
    if (!this.reporteData) return 0;
    return this.reporteData.filas.reduce((sum, fila) => sum + fila.total_horas, 0);
  }

  /**
   * Formatea fecha YYYY-MM-DD a DD/MM
   */
  formatFechaCorta(fecha: string): string {
    const parts = fecha.split('-');
    return `${parts[2]}/${parts[1]}`;
  }

  /**
   * Formatea fecha YYYY-MM-DD a DD/MM/YYYY
   */
  formatFechaDisplay(fecha: string): string {
    if (!fecha) return '';
    const [year, month, day] = fecha.split('-');
    return `${day}/${month}/${year}`;
  }

  /**
   * Helper para formatear fecha a YYYY-MM-DD
   */
  formatDate(date: Date | string): string {
    if (typeof date === 'string') return date;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Limpia resultados
   */
  private limpiarResultados(): void {
    this.showResults = false;
    this.reporteData = null;
  }

  /**
   * Limpia todo el formulario
   */
  limpiar(): void {
    this.formulario.reset({ tipo: 'empleado' });
    this.empleadoControl.setValue('');
    this.limpiarResultados();
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
      this.snackBar.open('El rango de fechas no puede ser mayor a 31 dias', 'Cerrar', {
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
   * Getter para el tipo actual seleccionado
   */
  get tipoActual(): string {
    return this.formulario.get('tipo')?.value || 'empleado';
  }

  /**
   * Verifica si se puede generar el reporte
   */
  get puedeGenerar(): boolean {
    return this.formulario.valid && !this.isLoading;
  }
}
