import { Component, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import {
  ReportesService,
  HistorialReporte,
} from '../../../core/services/reportes.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  MarcarProcesadosDialogComponent,
  MarcarProcesadosDialogData,
  MarcarProcesadosDialogResult,
} from './marcar-procesados-dialog.component';

@Component({
  selector: 'app-historial-reportes',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
  ],
  templateUrl: './historial-reportes.component.html',
  styleUrls: ['./historial-reportes.component.scss'],
})
export class HistorialReportesComponent implements OnInit {
  displayedColumns: string[] = [
    'id',
    'usuario',
    'periodo',
    'cantidad_turnos',
    'fecha_generacion',
    'estado',
    'acciones',
  ];

  dataSource: HistorialReporte[] = [];
  totalReportes = 0;
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions = [5, 10, 25];
  isLoading = signal(false);
  isAdmin = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private reportesService: ReportesService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.hasRole('ADMIN');
    this.loadHistorial();
  }

  loadHistorial(): void {
    this.isLoading.set(true);

    this.reportesService.getHistorial(this.pageIndex + 1, this.pageSize).subscribe({
      next: (response) => {
        this.dataSource = response.data;
        this.totalReportes = response.total;
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading historial:', error);
        this.showError('Error al cargar historial de reportes');
        this.isLoading.set(false);
      },
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadHistorial();
  }

  descargarReporte(reporte: HistorialReporte): void {
    this.reportesService.descargarReporte(reporte.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = reporte.nombre_archivo;
        link.click();
        window.URL.revokeObjectURL(url);
        this.showSuccess(`Reporte ${reporte.nombre_archivo} descargado`);
      },
      error: (error) => {
        console.error('Error downloading report:', error);
        this.showError('Error al descargar reporte');
      },
    });
  }

  marcarProcesado(reporte: HistorialReporte): void {
    const dialogData: MarcarProcesadosDialogData = {
      fecha_inicio: reporte.fecha_inicio,
      fecha_fin: reporte.fecha_fin,
      cantidad_turnos: reporte.cantidad_turnos,
    };

    const dialogRef = this.dialog.open(MarcarProcesadosDialogComponent, {
      width: '450px',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe((result: MarcarProcesadosDialogResult | undefined) => {
      if (result) {
        this.ejecutarMarcarProcesado(reporte, result.nomina_id);
      }
    });
  }

  private ejecutarMarcarProcesado(reporte: HistorialReporte, nomina_id: number): void {
    this.isLoading.set(true);

    this.reportesService
      .marcarProcesados({
        fecha_inicio: reporte.fecha_inicio,
        fecha_fin: reporte.fecha_fin,
        nomina_id,
      })
      .subscribe({
        next: (response) => {
          this.showSuccess(
            `${response.turnos_procesados} turnos marcados como procesados (Nomina #${nomina_id})`
          );
          this.loadHistorial();
        },
        error: (error) => {
          console.error('Error marking as processed:', error);
          this.showError('Error al marcar turnos como procesados');
          this.isLoading.set(false);
        },
      });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar'],
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
    });
  }
}
