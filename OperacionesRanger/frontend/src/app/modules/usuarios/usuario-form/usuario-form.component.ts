import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
  AsyncValidatorFn
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { UsuariosService, Usuario, CreateUsuarioRequest, UpdateUsuarioRequest } from '../../../core/services/usuarios.service';
import { UserRole } from '../../../core/models/auth.model';
import { Observable, of } from 'rxjs';
import { map, catchError, debounceTime, distinctUntilChanged, switchMap, first } from 'rxjs/operators';

/**
 * Componente de formulario para crear/editar usuarios
 * Modo CREAR: incluye campos de password
 * Modo EDITAR: NO incluye password (se usa endpoint separado)
 */
@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule
  ],
  templateUrl: './usuario-form.component.html',
  styleUrls: ['./usuario-form.component.scss']
})
export class UsuarioFormComponent implements OnInit {
  usuarioForm!: FormGroup;
  isLoading = false;
  isEditMode = false;
  hidePassword = true;
  hideConfirmPassword = true;

  // Roles disponibles
  roles: UserRole[] = ['ADMIN', 'SUPERVISOR', 'CONSULTA'];

  // Labels para roles
  roleLabels: Record<UserRole, string> = {
    'ADMIN': 'Administrador',
    'SUPERVISOR': 'Supervisor',
    'CONSULTA': 'Consulta'
  };

  constructor(
    private fb: FormBuilder,
    private usuariosService: UsuariosService,
    private dialogRef: MatDialogRef<UsuarioFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { usuario?: Usuario; isEdit: boolean },
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.isEditMode = this.data.isEdit;
    this.buildForm();
  }

  /**
   * Construir formulario reactivo
   */
  buildForm(): void {
    if (this.isEditMode) {
      // MODO EDITAR: Sin campos de password
      this.usuarioForm = this.fb.group({
        username: [{ value: '', disabled: true }], // Read-only en edición
        email: [
          '',
          [Validators.required, Validators.email],
          [this.emailUnicoValidator()]
        ],
        nombre_completo: [
          '',
          [Validators.required, Validators.maxLength(100)]
        ],
        rol: ['', Validators.required],
        activo: [true]
      });

      // Cargar datos del usuario
      if (this.data.usuario) {
        this.usuarioForm.patchValue(this.data.usuario);
      }
    } else {
      // MODO CREAR: Con campos de password
      this.usuarioForm = this.fb.group(
        {
          username: [
            '',
            [
              Validators.required,
              Validators.minLength(4),
              Validators.maxLength(50),
              Validators.pattern(/^[a-zA-Z0-9_]+$/)
            ],
            [this.usernameUnicoValidator()]
          ],
          password: [
            '',
            [
              Validators.required,
              Validators.minLength(8),
              this.passwordFuerteValidator()
            ]
          ],
          confirm_password: ['', Validators.required],
          email: [
            '',
            [Validators.required, Validators.email],
            [this.emailUnicoValidator()]
          ],
          nombre_completo: [
            '',
            [Validators.required, Validators.maxLength(100)]
          ],
          rol: ['', Validators.required],
          activo: [true]
        },
        {
          validators: [this.passwordsCoinciden()]
        }
      );
    }
  }

  /**
   * Validador de password fuerte
   * Requiere: min 8 chars, 1 mayúscula, 1 número
   */
  passwordFuerteValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      const tieneMayuscula = /[A-Z]/.test(value);
      const tieneNumero = /[0-9]/.test(value);
      const tieneMinimo8 = value.length >= 8;

      const passwordValido = tieneMayuscula && tieneNumero && tieneMinimo8;

      return passwordValido ? null : { passwordDebil: true };
    };
  }

  /**
   * Validador de passwords coincidentes
   */
  passwordsCoinciden() {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const password = formGroup.get('password')?.value;
      const confirmPassword = formGroup.get('confirm_password')?.value;

      if (!password || !confirmPassword) {
        return null;
      }

      return password === confirmPassword ? null : { passwordsNoCoinciden: true };
    };
  }

  /**
   * Validador asíncrono para username único
   */
  usernameUnicoValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }

      const excludeId = this.data?.usuario?.id;

      return of(control.value).pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(username =>
          this.usuariosService.validarUsernameUnico(username, excludeId).pipe(
            map(esUnico => (esUnico ? null : { usernameDuplicado: true })),
            catchError(() => of(null))
          )
        ),
        first()
      );
    };
  }

  /**
   * Validador asíncrono para email único
   */
  emailUnicoValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }

      const excludeId = this.data?.usuario?.id;

      return of(control.value).pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(email =>
          this.usuariosService.validarEmailUnico(email, excludeId).pipe(
            map(esUnico => (esUnico ? null : { emailDuplicado: true })),
            catchError(() => of(null))
          )
        ),
        first()
      );
    };
  }

  /**
   * Obtiene mensaje de error para campo
   */
  getErrorMessage(fieldName: string): string {
    const field = this.usuarioForm.get(fieldName);

    if (!field || !field.errors || !field.touched) {
      return '';
    }

    if (field.errors['required']) {
      return 'Este campo es requerido';
    }

    if (field.errors['minlength']) {
      const minLength = field.errors['minlength'].requiredLength;
      return `Mínimo ${minLength} caracteres`;
    }

    if (field.errors['maxlength']) {
      const maxLength = field.errors['maxlength'].requiredLength;
      return `Máximo ${maxLength} caracteres`;
    }

    if (field.errors['email']) {
      return 'Email inválido';
    }

    if (field.errors['pattern']) {
      if (fieldName === 'username') {
        return 'Solo letras, números y guión bajo';
      }
    }

    if (field.errors['passwordDebil']) {
      return 'La contraseña debe tener al menos 8 caracteres, una mayúscula y un número';
    }

    if (field.errors['usernameDuplicado']) {
      return 'Este username ya está registrado';
    }

    if (field.errors['emailDuplicado']) {
      return 'Este email ya está registrado';
    }

    return 'Error de validación';
  }

  /**
   * Obtener error de passwords no coincidentes
   */
  getPasswordsMismatchError(): string {
    if (
      this.usuarioForm.errors?.['passwordsNoCoinciden'] &&
      this.usuarioForm.get('confirm_password')?.touched
    ) {
      return 'Las contraseñas no coinciden';
    }
    return '';
  }

  /**
   * Submit del formulario
   */
  onSubmit(): void {
    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const formValue = this.usuarioForm.getRawValue();

    let observable: Observable<Usuario>;

    if (this.isEditMode) {
      // Modo editar: no enviar password
      const updateData: UpdateUsuarioRequest = {
        email: formValue.email,
        nombre_completo: formValue.nombre_completo,
        rol: formValue.rol,
        activo: formValue.activo
      };
      observable = this.usuariosService.update(this.data.usuario!.id, updateData);
    } else {
      // Modo crear: incluir password
      const createData: CreateUsuarioRequest = {
        username: formValue.username,
        password: formValue.password,
        email: formValue.email,
        nombre_completo: formValue.nombre_completo,
        rol: formValue.rol,
        activo: formValue.activo
      };
      observable = this.usuariosService.create(createData);
    }

    observable.subscribe({
      next: (usuario) => {
        const mensaje = this.isEditMode
          ? 'Usuario actualizado exitosamente'
          : 'Usuario creado exitosamente';

        this.snackBar.open(mensaje, 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });

        this.dialogRef.close(usuario);
      },
      error: (error) => {
        console.error('Error al guardar usuario:', error);

        let mensaje = 'Error al guardar usuario';
        if (error.error?.message) {
          mensaje += ': ' + error.error.message;
        }

        this.snackBar.open(mensaje, 'Cerrar', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });

        this.isLoading = false;
      }
    });
  }

  /**
   * Cancelar y cerrar dialog
   */
  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * Toggle visibilidad del password
   */
  togglePasswordVisibility(field: 'password' | 'confirm'): void {
    if (field === 'password') {
      this.hidePassword = !this.hidePassword;
    } else {
      this.hideConfirmPassword = !this.hideConfirmPassword;
    }
  }
}
