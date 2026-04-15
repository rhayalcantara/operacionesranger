import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface MarcarProcesadosDialogData {
  fecha_inicio: string;
  fecha_fin: string;
  cantidad_turnos: number;
}

export interface MarcarProcesadosDialogResult {
  nomina_id: number;
}

@Component({
  selector: 'app-marcar-procesados-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon color="warn">check_circle</mat-icon>
      Marcar Periodo como Procesado
    </h2>

    <mat-dialog-content>
      <div class="info-section">
        <div class="info-row">
          <span class="label">Periodo:</span>
          <span class="value">{{ data.fecha_inicio }} a {{ data.fecha_fin }}</span>
        </div>
        <div class="info-row">
          <span class="label">Turnos a procesar:</span>
          <span class="value">{{ data.cantidad_turnos }}</span>
        </div>
      </div>

      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>ID de Nomina</mat-label>
          <input matInput type="number" formControlName="nomina_id" placeholder="Ej: 125">
          <mat-hint>Ingrese el ID de la nomina del sistema de pagos</mat-hint>
          <mat-error *ngIf="form.get('nomina_id')?.hasError('required')">
            El ID de nomina es requerido
          </mat-error>
          <mat-error *ngIf="form.get('nomina_id')?.hasError('min')">
            Debe ser un numero positivo
          </mat-error>
        </mat-form-field>
      </form>

      <div class="warning">
        <mat-icon color="warn">warning</mat-icon>
        <span>Esta accion es irreversible. Los turnos marcados como procesados no apareceran en futuros reportes CSV.</span>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button (click)="onCancel()">Cancelar</button>
      <button
        mat-flat-button
        color="warn"
        [disabled]="form.invalid"
        (click)="onConfirm()"
      >
        <mat-icon>check_circle</mat-icon>
        Confirmar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .info-section {
      background: #f5f5f5;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
    }
    .label {
      color: #666;
      font-weight: 500;
    }
    .value {
      font-weight: 600;
    }
    .full-width {
      width: 100%;
    }
    .warning {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      background: #fff3e0;
      border: 1px solid #ffb74d;
      border-radius: 8px;
      padding: 12px;
      margin-top: 16px;
      font-size: 13px;
      color: #e65100;
    }
    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class MarcarProcesadosDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<MarcarProcesadosDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MarcarProcesadosDialogData
  ) {
    this.form = this.fb.group({
      nomina_id: [null, [Validators.required, Validators.min(1)]]
    });
  }

  onConfirm(): void {
    if (this.form.valid) {
      this.dialogRef.close({ nomina_id: this.form.value.nomina_id } as MarcarProcesadosDialogResult);
    }
  }

  onCancel(): void {
    this.dialogRef.close(undefined);
  }
}
