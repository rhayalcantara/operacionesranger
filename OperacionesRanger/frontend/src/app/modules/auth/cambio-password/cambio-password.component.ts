import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../../../core/services/auth.service';

/**
 * CambioPasswordComponent
 *
 * Componente standalone para cambiar la contraseña del usuario autenticado.
 * Incluye validaciones de seguridad e indicador visual de fortaleza.
 *
 * Características:
 * - Formulario reactivo con validaciones robustas
 * - Indicador de fortaleza en tiempo real
 * - Validación de contraseña fuerte (min 8 chars, mayúscula, número, especial)
 * - Confirmación de contraseña
 * - Integración con AuthService
 */
@Component({
  selector: 'app-cambio-password',
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
    MatProgressBarModule,
    MatSnackBarModule
  ],
  template: `
    <div class="cambio-password-container">
      <mat-card class="cambio-password-card">
        <mat-card-header>
          <div class="header-content">
            <mat-icon class="header-icon">lock_reset</mat-icon>
            <div class="title-wrapper">
              <mat-card-title>Cambiar Contraseña</mat-card-title>
              <mat-card-subtitle>Actualice su contraseña de acceso</mat-card-subtitle>
            </div>
          </div>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="passwordForm" (ngSubmit)="onSubmit()">
            <!-- Contraseña Actual -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Contraseña Actual</mat-label>
              <input
                matInput
                [type]="hideCurrentPassword ? 'password' : 'text'"
                formControlName="currentPassword"
                placeholder="Ingrese su contraseña actual"
                autocomplete="current-password"
                required>
              <mat-icon matPrefix>lock</mat-icon>
              <button
                mat-icon-button
                matSuffix
                type="button"
                (click)="hideCurrentPassword = !hideCurrentPassword"
                [attr.aria-label]="'Ocultar contraseña'"
                [attr.aria-pressed]="hideCurrentPassword">
                <mat-icon>{{hideCurrentPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              <mat-error *ngIf="passwordForm.get('currentPassword')?.hasError('required')">
                La contraseña actual es requerida
              </mat-error>
            </mat-form-field>

            <!-- Nueva Contraseña -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nueva Contraseña</mat-label>
              <input
                matInput
                [type]="hideNewPassword ? 'password' : 'text'"
                formControlName="newPassword"
                placeholder="Ingrese su nueva contraseña"
                autocomplete="new-password"
                required
                (input)="updatePasswordStrength()">
              <mat-icon matPrefix>vpn_key</mat-icon>
              <button
                mat-icon-button
                matSuffix
                type="button"
                (click)="hideNewPassword = !hideNewPassword"
                [attr.aria-label]="'Ocultar contraseña'"
                [attr.aria-pressed]="hideNewPassword">
                <mat-icon>{{hideNewPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              <mat-error *ngIf="passwordForm.get('newPassword')?.hasError('required')">
                La nueva contraseña es requerida
              </mat-error>
              <mat-error *ngIf="passwordForm.get('newPassword')?.hasError('minlength')">
                Mínimo 8 caracteres
              </mat-error>
              <mat-error *ngIf="passwordForm.get('newPassword')?.hasError('passwordStrength')">
                Debe contener al menos 1 mayúscula, 1 número y 1 carácter especial
              </mat-error>
              <mat-error *ngIf="passwordForm.get('newPassword')?.hasError('sameAsOld')">
                La nueva contraseña debe ser diferente a la actual
              </mat-error>
            </mat-form-field>

            <!-- Indicador de Fortaleza -->
            <div class="strength-indicator" *ngIf="passwordForm.get('newPassword')?.value">
              <div class="strength-label">
                <span>Fortaleza:</span>
                <span [class]="'strength-text strength-' + passwordStrength.level">
                  {{ passwordStrength.text }}
                </span>
              </div>
              <mat-progress-bar
                [value]="passwordStrength.value"
                [color]="passwordStrength.color"
                mode="determinate">
              </mat-progress-bar>
            </div>

            <!-- Confirmar Contraseña -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Confirmar Nueva Contraseña</mat-label>
              <input
                matInput
                [type]="hideConfirmPassword ? 'password' : 'text'"
                formControlName="confirmPassword"
                placeholder="Confirme su nueva contraseña"
                autocomplete="new-password"
                required>
              <mat-icon matPrefix>check_circle</mat-icon>
              <button
                mat-icon-button
                matSuffix
                type="button"
                (click)="hideConfirmPassword = !hideConfirmPassword"
                [attr.aria-label]="'Ocultar contraseña'"
                [attr.aria-pressed]="hideConfirmPassword">
                <mat-icon>{{hideConfirmPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              <mat-error *ngIf="passwordForm.get('confirmPassword')?.hasError('required')">
                Debe confirmar la nueva contraseña
              </mat-error>
              <mat-error *ngIf="passwordForm.get('confirmPassword')?.hasError('passwordMismatch')">
                Las contraseñas no coinciden
              </mat-error>
            </mat-form-field>

            <!-- Requisitos de Contraseña -->
            <div class="password-requirements">
              <p class="requirements-title">La contraseña debe contener:</p>
              <ul>
                <li [class.met]="hasMinLength">Mínimo 8 caracteres</li>
                <li [class.met]="hasUpperCase">Al menos 1 letra mayúscula</li>
                <li [class.met]="hasNumber">Al menos 1 número</li>
                <li [class.met]="hasSpecialChar">Al menos 1 carácter especial (opcional)</li>
              </ul>
            </div>

            <!-- Botones de Acción -->
            <div class="form-actions">
              <button
                mat-raised-button
                type="button"
                (click)="onCancel()"
                [disabled]="isLoading">
                Cancelar
              </button>
              <button
                mat-raised-button
                color="primary"
                type="submit"
                [disabled]="passwordForm.invalid || isLoading">
                <mat-spinner *ngIf="isLoading" diameter="20" class="spinner"></mat-spinner>
                <span *ngIf="!isLoading">Cambiar Contraseña</span>
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .cambio-password-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .cambio-password-card {
      width: 100%;
      max-width: 550px;
      padding: 20px;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 16px;
      width: 100%;
    }

    .header-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #667eea;
    }

    .title-wrapper {
      flex: 1;
    }

    mat-card-title {
      font-size: 24px;
      margin-bottom: 8px;
    }

    mat-card-subtitle {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
    }

    mat-card-content {
      padding-top: 24px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    /* Indicador de Fortaleza */
    .strength-indicator {
      margin-bottom: 20px;
    }

    .strength-label {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
    }

    .strength-text {
      font-weight: 600;
    }

    .strength-text.strength-weak {
      color: #f44336;
    }

    .strength-text.strength-medium {
      color: #ff9800;
    }

    .strength-text.strength-strong {
      color: #4caf50;
    }

    /* Requisitos de Contraseña */
    .password-requirements {
      background-color: #f5f5f5;
      border-radius: 4px;
      padding: 16px;
      margin-bottom: 20px;
    }

    .requirements-title {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.87);
    }

    .password-requirements ul {
      margin: 0;
      padding-left: 20px;
      list-style: none;
    }

    .password-requirements li {
      position: relative;
      font-size: 13px;
      color: rgba(0, 0, 0, 0.6);
      padding: 4px 0;
    }

    .password-requirements li::before {
      content: '○';
      position: absolute;
      left: -20px;
      color: rgba(0, 0, 0, 0.4);
    }

    .password-requirements li.met {
      color: #4caf50;
      font-weight: 500;
    }

    .password-requirements li.met::before {
      content: '✓';
      color: #4caf50;
    }

    /* Botones de Acción */
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }

    .spinner {
      display: inline-block;
      margin-right: 8px;
    }

    /* Responsive design */
    @media (max-width: 600px) {
      .cambio-password-container {
        padding: 10px;
      }

      .cambio-password-card {
        padding: 16px;
      }

      mat-card-title {
        font-size: 20px;
      }

      .header-icon {
        font-size: 36px;
        width: 36px;
        height: 36px;
      }

      .form-actions {
        flex-direction: column-reverse;
      }

      .form-actions button {
        width: 100%;
      }
    }
  `]
})
export class CambioPasswordComponent implements OnInit {
  passwordForm: FormGroup;
  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;
  isLoading = false;

  // Indicador de fortaleza
  passwordStrength = {
    value: 0,
    level: 'weak',
    text: 'Débil',
    color: 'warn' as 'primary' | 'accent' | 'warn'
  };

  // Flags para requisitos de contraseña
  hasMinLength = false;
  hasUpperCase = false;
  hasNumber = false;
  hasSpecialChar = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        this.passwordStrengthValidator()
      ]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: [this.passwordMatchValidator(), this.newPasswordDifferentValidator()]
    });
  }

  ngOnInit(): void {
    // Verificar que el usuario esté autenticado
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
    }
  }

  /**
   * Validador personalizado: contraseña fuerte
   */
  private passwordStrengthValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) {
        return null;
      }

      const hasUpperCase = /[A-Z]/.test(value);
      const hasNumber = /[0-9]/.test(value);
      // El carácter especial es opcional pero recomendado
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

      const passwordValid = hasUpperCase && hasNumber;

      return passwordValid ? null : { passwordStrength: true };
    };
  }

  /**
   * Validador personalizado: las contraseñas deben coincidir
   */
  private passwordMatchValidator() {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const newPassword = formGroup.get('newPassword')?.value;
      const confirmPassword = formGroup.get('confirmPassword')?.value;

      if (!newPassword || !confirmPassword) {
        return null;
      }

      const match = newPassword === confirmPassword;

      // Establecer error en el campo confirmPassword
      if (!match) {
        formGroup.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      } else {
        // Limpiar error si coinciden
        const confirmControl = formGroup.get('confirmPassword');
        if (confirmControl?.hasError('passwordMismatch')) {
          confirmControl.setErrors(null);
        }
      }

      return null;
    };
  }

  /**
   * Validador personalizado: nueva contraseña diferente a la actual
   */
  private newPasswordDifferentValidator() {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const currentPassword = formGroup.get('currentPassword')?.value;
      const newPassword = formGroup.get('newPassword')?.value;

      if (!currentPassword || !newPassword) {
        return null;
      }

      const different = currentPassword !== newPassword;

      // Establecer error en el campo newPassword
      if (!different) {
        formGroup.get('newPassword')?.setErrors({ sameAsOld: true });
      }

      return null;
    };
  }

  /**
   * Actualiza el indicador de fortaleza de la contraseña
   */
  updatePasswordStrength(): void {
    const password = this.passwordForm.get('newPassword')?.value || '';

    // Actualizar flags de requisitos
    this.hasMinLength = password.length >= 8;
    this.hasUpperCase = /[A-Z]/.test(password);
    this.hasNumber = /[0-9]/.test(password);
    this.hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    // Calcular fortaleza (0-100)
    let strength = 0;

    if (this.hasMinLength) strength += 25;
    if (this.hasUpperCase) strength += 25;
    if (this.hasNumber) strength += 25;
    if (this.hasSpecialChar) strength += 25;

    // Determinar nivel y color
    if (strength <= 50) {
      this.passwordStrength = {
        value: strength,
        level: 'weak',
        text: 'Débil',
        color: 'warn'
      };
    } else if (strength <= 75) {
      this.passwordStrength = {
        value: strength,
        level: 'medium',
        text: 'Media',
        color: 'accent'
      };
    } else {
      this.passwordStrength = {
        value: strength,
        level: 'strong',
        text: 'Fuerte',
        color: 'primary'
      };
    }
  }

  /**
   * Maneja el envío del formulario
   */
  onSubmit(): void {
    if (this.passwordForm.invalid) {
      return;
    }

    this.isLoading = true;
    const { currentPassword, newPassword } = this.passwordForm.value;

    this.authService.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.isLoading = false;
        this.showMessage('Contraseña actualizada exitosamente', 'success');

        // Opcional: hacer logout y redirigir a login
        // Aquí decidimos NO hacer logout automático para mejor UX
        // El usuario puede seguir trabajando con la nueva contraseña

        // Resetear formulario
        this.passwordForm.reset();

        // Redirigir al dashboard después de un delay
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        const errorMessage = error?.error?.message || 'Error al cambiar la contraseña. Verifique que la contraseña actual sea correcta.';
        this.showMessage(errorMessage, 'error');

        // Limpiar contraseña actual en caso de error
        this.passwordForm.patchValue({ currentPassword: '' });
      }
    });
  }

  /**
   * Cancela el cambio y regresa al dashboard
   */
  onCancel(): void {
    this.router.navigate(['/dashboard']);
  }

  /**
   * Muestra un mensaje usando MatSnackBar
   */
  private showMessage(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: type === 'success' ? 3000 : 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: type === 'success' ? ['success-snackbar'] : ['error-snackbar']
    });
  }
}
