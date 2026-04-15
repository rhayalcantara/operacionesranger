import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

import { Turno } from '../../../core/services/turnos.service';

@Component({
  selector: 'app-turno-detalle-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
    MatDividerModule
  ],
  templateUrl: './turno-detalle-dialog.html',
  styleUrls: ['./turno-detalle-dialog.scss']
})
export class TurnoDetalleDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<TurnoDetalleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public turno: Turno
  ) {}

  getTotalHoras(): number {
    return this.turno.horas_normales + this.turno.horas_extras;
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
