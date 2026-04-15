import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { forkJoin } from 'rxjs';

import {
  ConfiguracionTurnosService,
  ConfiguracionTurno,
  TipoTurno
} from '../../core/services/configuracion-turnos.service';
import { AuthService } from '../../core/services/auth.service';

/**
 * Componente para configuración de horarios de turnos
 *
 * Características:
 * - Muestra 2 tarjetas (DIURNO y NOCTURNO)
 * - Permite editar horarios con inputs type="time"
 * - Valida que no haya solapamiento de horarios
 * - Solo usuarios ADMIN pueden editar
 * - Actualiza ambas configuraciones simultáneamente
 */
@Component({
  selector: 'app-configuracion-turnos',
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
    MatSnackBarModule,
    MatCheckboxModule
  ],
  templateUrl: './configuracion-turnos.component.html',
  styleUrls: ['./configuracion-turnos.component.scss']
})
export class ConfiguracionTurnosComponent implements OnInit {
  diurnoForm: FormGroup;
  nocturnoForm: FormGroup;
  isLoading = signal(false);
  isSaving = false;

  configDiurno: ConfiguracionTurno | null = null;
  configNocturno: ConfiguracionTurno | null = null;

  constructor(
    private fb: FormBuilder,
    private configuracionService: ConfiguracionTurnosService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    // Inicializar formularios con valores por defecto
    this.diurnoForm = this.fb.group({
      hora_inicio: ['06:00', [Validators.required, Validators.pattern(/^\d{2}:\d{2}$/)]],
      hora_fin: ['18:00', [Validators.required, Validators.pattern(/^\d{2}:\d{2}$/)]],
      descripcion: [''],
      activo: [true]
    });

    this.nocturnoForm = this.fb.group({
      hora_inicio: ['18:00', [Validators.required, Validators.pattern(/^\d{2}:\d{2}$/)]],
      hora_fin: ['06:00', [Validators.required, Validators.pattern(/^\d{2}:\d{2}$/)]],
      descripcion: [''],
      activo: [true]
    });
  }

  ngOnInit(): void {
    this.loadConfiguraciones();

    // Si el usuario no es ADMIN, deshabilitar formularios
    if (!this.isAdmin()) {
      this.diurnoForm.disable();
      this.nocturnoForm.disable();
    }
  }

  /**
   * Verificar si el usuario es ADMIN
   */
  isAdmin(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  /**
   * Cargar configuraciones desde el backend
   */
  loadConfiguraciones(): void {
    this.isLoading.set(true);

    this.configuracionService.getAll().subscribe({
      next: (configuraciones) => {
        // Separar configuraciones por tipo
        this.configDiurno = configuraciones.find(c => c.tipo === TipoTurno.DIURNO) || null;
        this.configNocturno = configuraciones.find(c => c.tipo === TipoTurno.NOCTURNO) || null;

        // Poblar formularios
        if (this.configDiurno) {
          this.diurnoForm.patchValue({
            hora_inicio: this.configuracionService.formatTimeForForm(this.configDiurno.hora_inicio),
            hora_fin: this.configuracionService.formatTimeForForm(this.configDiurno.hora_fin),
            descripcion: this.configDiurno.descripcion || '',
            activo: this.configDiurno.activo
          });
        }

        if (this.configNocturno) {
          this.nocturnoForm.patchValue({
            hora_inicio: this.configuracionService.formatTimeForForm(this.configNocturno.hora_inicio),
            hora_fin: this.configuracionService.formatTimeForForm(this.configNocturno.hora_fin),
            descripcion: this.configNocturno.descripcion || '',
            activo: this.configNocturno.activo
          });
        }

        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar configuraciones:', error);
        this.showError('Error al cargar configuraciones de turnos');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Guardar cambios en ambas configuraciones
   */
  saveConfiguraciones(): void {
    // Validar formularios
    if (this.diurnoForm.invalid || this.nocturnoForm.invalid) {
      this.showError('Por favor complete todos los campos correctamente');
      return;
    }

    // Validar que no haya solapamiento
    const validation = this.configuracionService.validateNoOverlap(
      this.diurnoForm.value.hora_inicio,
      this.diurnoForm.value.hora_fin,
      this.nocturnoForm.value.hora_inicio,
      this.nocturnoForm.value.hora_fin
    );

    if (!validation.valid) {
      this.showError(validation.message || 'Error de validación de horarios');
      return;
    }

    // Verificar que existan las configuraciones
    if (!this.configDiurno || !this.configNocturno) {
      this.showError('No se encontraron las configuraciones de turnos');
      return;
    }

    this.isSaving = true;

    // Preparar datos para actualización
    const diurnoUpdate = {
      hora_inicio: this.configuracionService.formatTimeForBackend(this.diurnoForm.value.hora_inicio),
      hora_fin: this.configuracionService.formatTimeForBackend(this.diurnoForm.value.hora_fin),
      descripcion: this.diurnoForm.value.descripcion || undefined,
      activo: this.diurnoForm.value.activo
    };

    const nocturnoUpdate = {
      hora_inicio: this.configuracionService.formatTimeForBackend(this.nocturnoForm.value.hora_inicio),
      hora_fin: this.configuracionService.formatTimeForBackend(this.nocturnoForm.value.hora_fin),
      descripcion: this.nocturnoForm.value.descripcion || undefined,
      activo: this.nocturnoForm.value.activo
    };

    // Actualizar ambas configuraciones en paralelo
    forkJoin({
      diurno: this.configuracionService.update(this.configDiurno.id, diurnoUpdate),
      nocturno: this.configuracionService.update(this.configNocturno.id, nocturnoUpdate)
    }).subscribe({
      next: (results) => {
        this.configDiurno = results.diurno;
        this.configNocturno = results.nocturno;
        this.showSuccess('Configuraciones guardadas exitosamente');
        this.isSaving = false;
      },
      error: (error) => {
        console.error('Error al guardar configuraciones:', error);

        let mensaje = 'Error al guardar configuraciones';
        if (error.error?.message) {
          mensaje += ': ' + error.error.message;
        }

        this.showError(mensaje);
        this.isSaving = false;
      }
    });
  }

  /**
   * Restablecer valores a los originales del backend
   */
  resetForm(): void {
    if (this.configDiurno) {
      this.diurnoForm.patchValue({
        hora_inicio: this.configuracionService.formatTimeForForm(this.configDiurno.hora_inicio),
        hora_fin: this.configuracionService.formatTimeForForm(this.configDiurno.hora_fin),
        descripcion: this.configDiurno.descripcion || '',
        activo: this.configDiurno.activo
      });
    }

    if (this.configNocturno) {
      this.nocturnoForm.patchValue({
        hora_inicio: this.configuracionService.formatTimeForForm(this.configNocturno.hora_inicio),
        hora_fin: this.configuracionService.formatTimeForForm(this.configNocturno.hora_fin),
        descripcion: this.configNocturno.descripcion || '',
        activo: this.configNocturno.activo
      });
    }

    this.showSuccess('Valores restablecidos');
  }

  /**
   * Verificar si hay cambios sin guardar
   */
  hasUnsavedChanges(): boolean {
    return this.diurnoForm.dirty || this.nocturnoForm.dirty;
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
