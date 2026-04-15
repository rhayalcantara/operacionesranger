import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

interface ReporteCard {
  title: string;
  description: string;
  icon: string;
  route: string;
  available: boolean;
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss']
})
export class ReportesComponent {
  reportes: ReporteCard[] = [
    {
      title: 'Reporte de Nomina',
      description: 'Genere reportes CSV de turnos por periodo para integracion con sistema de nomina. Incluye horas normales, extras, incentivos y feriados.',
      icon: 'assessment',
      route: '/reportes/nomina',
      available: true
    },
    {
      title: 'Reporte de Horas',
      description: 'Tabla pivot de horas trabajadas por empleado o puesto, cruzada con fechas del periodo.',
      icon: 'schedule',
      route: '/reportes/horas',
      available: true
    },
    {
      title: 'Historial de Reportes',
      description: 'Consulte reportes CSV generados anteriormente. Re-descargue o marque como procesados en nomina.',
      icon: 'history',
      route: '/reportes/historial',
      available: true
    }
  ];

  constructor(private router: Router) {}

  navegarA(route: string): void {
    this.router.navigate([route]);
  }
}
