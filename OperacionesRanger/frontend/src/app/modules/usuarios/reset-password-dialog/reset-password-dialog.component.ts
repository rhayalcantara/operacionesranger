import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Clipboard, ClipboardModule } from '@angular/cdk/clipboard';

/**
 * Datos del dialog
 */
export interface ResetPasswordDialogData {
  username: string;
  temporaryPassword: string;
}

/**
 * Dialog para mostrar contraseña temporal después de reset
 * Incluye botón para copiar al portapapeles
 */
@Component({
  selector: 'app-reset-password-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    ClipboardModule
  ],
  templateUrl: './reset-password-dialog.component.html',
  styleUrls: ['./reset-password-dialog.component.scss']
})
export class ResetPasswordDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ResetPasswordDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ResetPasswordDialogData,
    private clipboard: Clipboard,
    private snackBar: MatSnackBar
  ) {}

  /**
   * Copiar password al portapapeles
   */
  copyToClipboard(): void {
    const success = this.clipboard.copy(this.data.temporaryPassword);

    if (success) {
      this.snackBar.open('Contraseña copiada al portapapeles', 'Cerrar', {
        duration: 2000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['success-snackbar']
      });
    } else {
      this.snackBar.open('Error al copiar contraseña', 'Cerrar', {
        duration: 2000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
    }
  }

  /**
   * Cerrar dialog
   */
  onClose(): void {
    this.dialogRef.close();
  }
}
