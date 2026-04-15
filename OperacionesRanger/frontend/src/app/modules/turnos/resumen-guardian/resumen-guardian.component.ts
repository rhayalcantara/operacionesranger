import { Component, OnInit, ViewChild, OnDestroy, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Observable, Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil, startWith, map } from 'rxjs/operators';

import { TurnosService, Turno, ResumenEmpleado } from '../../../core/services/turnos.service';
import { RrhhService, Guardian } from '../../../core/services/rrhh.service';

/**
 * Interface para las tarjetas de estadísticas
 */
interface EstadisticaCard {
  titulo: string;
  valor: string | number;
  icono: string;
  color: string;
  tooltip?: string;
}

@Component({
  selector: 'app-resumen-guardian',
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
    MatAutocompleteModule,
    MatSnackBarModule
  ],
  templateUrl: './resumen-guardian.component.html',
  styleUrls: ['./resumen-guardian.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResumenGuardianComponent implements OnInit, OnDestroy {
  formulario!: FormGroup;
  isLoading = signal(false);
  resumenGenerado = false;
  resumenData: ResumenEmpleado | null = null;
  estadisticas: EstadisticaCard[] = [];

  // Autocomplete de guardianes
  guardianesFiltered$!: Observable<Guardian[]>;
  selectedGuardian: Guardian | null = null;

  // Tabla de turnos detallados
  displayedColumns: string[] = [
    'fecha',
    'puesto',
    'horas_normales',
    'horas_extras',
    'total_horas',
    'tipo_turno',
    'es_feriado'
  ];
  dataSource = new MatTableDataSource<Turno>([]);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private turnosService: TurnosService,
    private rrhhService: RrhhService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
    this.configurarAutocomplete();
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
      guardian: ['', Validators.required],
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required]
    }, {
      validators: this.validarRangoFechas
    });
  }

  /**
   * Validador personalizado para el rango de fechas
   */
  validarRangoFechas(group: FormGroup): { [key: string]: any } | null {
    const inicio = group.get('fechaInicio')?.value;
    const fin = group.get('fechaFin')?.value;

    if (inicio && fin && new Date(inicio) > new Date(fin)) {
      return { rangoInvalido: true };
    }

    return null;
  }

  /**
   * Configura el autocomplete de guardianes con debounce
   */
  configurarAutocomplete(): void {
    const guardianControl = this.formulario.get('guardian');

    if (!guardianControl) return;

    this.guardianesFiltered$ = guardianControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        // Si es un objeto Guardian, no buscar
        if (typeof value === 'object' && value !== null) {
          return of([]);
        }

        const searchTerm = typeof value === 'string' ? value : '';

        if (searchTerm.length < 2) {
          return of([]);
        }

        // buscarGuardianes retorna GuardianesResponse, necesitamos extraer data
        return this.rrhhService.buscarGuardianes(searchTerm).pipe(
          map(response => response.data)
        );
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Muestra el nombre del guardián en el autocomplete
   */
  displayGuardian(guardian: Guardian | null): string {
    if (!guardian) return '';
    return `${guardian.nombres} ${guardian.apellidos} (${guardian.cedula_empleado})`;
  }

  /**
   * Maneja la selección de un guardián
   */
  onGuardianSelected(guardian: Guardian): void {
    this.selectedGuardian = guardian;
  }

  /**
   * Aplica un preset de fechas
   */
  aplicarPresetFecha(preset: string): void {
    const hoy = new Date();
    let fechaInicio: Date;
    let fechaFin: Date;

    switch (preset) {
      case 'ultima_quincena':
        // Si estamos en la primera quincena, mostrar la segunda del mes anterior
        if (hoy.getDate() <= 15) {
          fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 16);
          fechaFin = new Date(hoy.getFullYear(), hoy.getMonth(), 0); // Último día del mes anterior
        } else {
          fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
          fechaFin = new Date(hoy.getFullYear(), hoy.getMonth(), 15);
        }
        break;

      case 'ultimo_mes':
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
        fechaFin = new Date(hoy.getFullYear(), hoy.getMonth(), 0); // Último día del mes anterior
        break;

      case 'mes_actual':
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        fechaFin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0); // Último día del mes actual
        break;

      case 'trimestre_actual':
        const mesActual = hoy.getMonth();
        const primerMesTrimestre = Math.floor(mesActual / 3) * 3;
        fechaInicio = new Date(hoy.getFullYear(), primerMesTrimestre, 1);
        fechaFin = new Date(hoy.getFullYear(), primerMesTrimestre + 3, 0); // Último día del trimestre
        break;

      default:
        return;
    }

    this.formulario.patchValue({
      fechaInicio,
      fechaFin
    });
  }

  /**
   * Genera el resumen del guardián
   */
  generarResumen(): void {
    if (this.formulario.invalid || !this.selectedGuardian) {
      this.snackBar.open('Por favor complete todos los campos correctamente', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.isLoading.set(true);
    this.resumenGenerado = false;

    const fechaInicio = this.formatDate(this.formulario.value.fechaInicio);
    const fechaFin = this.formatDate(this.formulario.value.fechaFin);

    this.turnosService.getResumenEmpleado(
      this.selectedGuardian.id_empleado,
      fechaInicio,
      fechaFin
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (resumen) => {
        this.resumenData = resumen;
        this.generarEstadisticas(resumen);
        this.cargarTurnosDetallados(resumen.turnos || []);
        this.resumenGenerado = true;
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error al generar resumen:', error);
        this.snackBar.open('Error al generar resumen. Intente nuevamente.', 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Genera las tarjetas de estadísticas
   */
  generarEstadisticas(resumen: ResumenEmpleado): void {
    const totalHoras = resumen.total_horas ||
                      (resumen.total_horas_normales + resumen.total_horas_extras);

    this.estadisticas = [
      {
        titulo: 'Total de Turnos',
        valor: resumen.total_turnos,
        icono: 'calendar_today',
        color: 'primary',
        tooltip: 'Número total de turnos registrados'
      },
      {
        titulo: 'Horas Normales',
        valor: `${resumen.total_horas_normales.toFixed(2)} hrs`,
        icono: 'access_time',
        color: 'accent',
        tooltip: 'Total de horas normales trabajadas'
      },
      {
        titulo: 'Horas Extras',
        valor: `${resumen.total_horas_extras.toFixed(2)} hrs`,
        icono: 'alarm_add',
        color: 'warn',
        tooltip: 'Total de horas extras trabajadas'
      },
      {
        titulo: 'Total Horas',
        valor: `${totalHoras.toFixed(2)} hrs`,
        icono: 'timer',
        color: 'primary-dark',
        tooltip: 'Suma de horas normales y extras'
      },
      {
        titulo: 'Diurnos / Nocturnos',
        valor: `${resumen.turnos_diurnos} / ${resumen.turnos_nocturnos}`,
        icono: 'brightness_6',
        color: 'info',
        tooltip: 'Distribución de turnos por tipo'
      },
      {
        titulo: 'Turnos en Feriados',
        valor: resumen.turnos_feriados,
        icono: 'celebration',
        color: 'warn-dark',
        tooltip: 'Turnos trabajados en días feriados'
      }
    ];
  }

  /**
   * Carga los turnos detallados en la tabla
   */
  cargarTurnosDetallados(turnos: Turno[]): void {
    this.dataSource.data = turnos;

    // Configurar sort y paginator después de cargar datos
    setTimeout(() => {
      if (this.sort) {
        this.dataSource.sort = this.sort;
      }
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
    });
  }

  /**
   * Calcula el total de horas (normales + extras) para una fila
   */
  calcularTotalHoras(turno: Turno): number {
    return turno.horas_normales + turno.horas_extras;
  }

  /**
   * Formatea una fecha a YYYY-MM-DD
   */
  formatDate(date: Date | string): string {
    if (typeof date === 'string') return date;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Limpiar formulario y resultados
   */
  limpiar(): void {
    this.formulario.reset();
    this.selectedGuardian = null;
    this.resumenGenerado = false;
    this.resumenData = null;
    this.estadisticas = [];
    this.dataSource.data = [];
  }
}
