import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../core/services/auth.service';
import { TurnosService } from '../../core/services/turnos.service';
import { RrhhService } from '../../core/services/rrhh.service';
import { User } from '../../core/models/auth.model';

/**
 * DashboardComponent
 *
 * Componente principal del dashboard que muestra:
 * - Información del usuario autenticado
 * - Estadísticas generales del sistema
 * - Accesos rápidos a funcionalidades principales
 *
 * Standalone component con Material UI
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatGridListModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="dashboard-container">
      <!-- Welcome Section -->
      <div class="welcome-section">
        <h1 class="welcome-title">
          <mat-icon class="welcome-icon">waving_hand</mat-icon>
          Bienvenido, {{ currentUser?.nombre_completo || 'Usuario' }}
        </h1>
        <p class="welcome-subtitle">
          Sistema de Gestión de Turnos - OperacionesRanger
        </p>
      </div>

      <!-- Statistics Cards -->
      <div class="statistics-section">
        <h2 class="section-title">Estadísticas del Mes</h2>

        <div class="stats-grid">
          <!-- Tarjeta 1: Total de Turnos del Mes -->
          <mat-card class="stat-card stat-card-blue">
            <mat-card-content>
              <div class="stat-header">
                <mat-icon class="stat-icon">assignment</mat-icon>
                <span class="stat-label">Turnos del Mes</span>
              </div>
              <div class="stat-value" *ngIf="!isLoadingTurnos">
                {{ turnosMesActual }}
              </div>
              <div class="stat-loading" *ngIf="isLoadingTurnos">
                <mat-spinner diameter="40"></mat-spinner>
              </div>
              <div class="stat-error" *ngIf="errorTurnos && !isLoadingTurnos">
                <mat-icon>error_outline</mat-icon>
                <span>{{ errorTurnos }}</span>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Tarjeta 2: Guardianes Activos -->
          <mat-card class="stat-card stat-card-green">
            <mat-card-content>
              <div class="stat-header">
                <mat-icon class="stat-icon">people</mat-icon>
                <span class="stat-label">Guardianes Activos</span>
              </div>
              <div class="stat-value" *ngIf="!isLoadingGuardianes">
                {{ guardianesActivos }}
              </div>
              <div class="stat-loading" *ngIf="isLoadingGuardianes">
                <mat-spinner diameter="40"></mat-spinner>
              </div>
              <div class="stat-error" *ngIf="errorGuardianes && !isLoadingGuardianes">
                <mat-icon>error_outline</mat-icon>
                <span>{{ errorGuardianes }}</span>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Tarjeta 3: Turnos Pendientes -->
          <mat-card class="stat-card stat-card-orange" [class.stat-card-warning]="turnosPendientes > 50">
            <mat-card-content>
              <div class="stat-header">
                <mat-icon class="stat-icon">pending_actions</mat-icon>
                <span class="stat-label">Pendientes Procesar</span>
              </div>
              <div class="stat-value" *ngIf="!isLoadingPendientes">
                {{ turnosPendientes }}
              </div>
              <div class="stat-loading" *ngIf="isLoadingPendientes">
                <mat-spinner diameter="40"></mat-spinner>
              </div>
              <div class="stat-error" *ngIf="errorPendientes && !isLoadingPendientes">
                <mat-icon>error_outline</mat-icon>
                <span>{{ errorPendientes }}</span>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Tarjeta 4: Horas Totales del Mes -->
          <mat-card class="stat-card stat-card-purple">
            <mat-card-content>
              <div class="stat-header">
                <mat-icon class="stat-icon">schedule</mat-icon>
                <span class="stat-label">Horas Totales Mes</span>
              </div>
              <div class="stat-value" *ngIf="!isLoadingTurnos">
                {{ horasTotalesMes | number:'1.2-2' }}
              </div>
              <div class="stat-loading" *ngIf="isLoadingTurnos">
                <mat-spinner diameter="40"></mat-spinner>
              </div>
              <div class="stat-error" *ngIf="errorTurnos && !isLoadingTurnos">
                <mat-icon>error_outline</mat-icon>
                <span>{{ errorTurnos }}</span>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>

      <!-- User Info Card -->
      <mat-card class="user-info-card">
        <mat-card-header>
          <mat-icon mat-card-avatar class="user-avatar">account_circle</mat-icon>
          <mat-card-title>Información del Usuario</mat-card-title>
          <mat-card-subtitle>Datos de la sesión actual</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="info-grid">
            <div class="info-item">
              <mat-icon>person</mat-icon>
              <div class="info-content">
                <span class="info-label">Nombre Completo</span>
                <span class="info-value">{{ currentUser?.nombre_completo || 'N/A' }}</span>
              </div>
            </div>

            <div class="info-item">
              <mat-icon>badge</mat-icon>
              <div class="info-content">
                <span class="info-label">Usuario</span>
                <span class="info-value">{{ currentUser?.username || 'N/A' }}</span>
              </div>
            </div>

            <div class="info-item">
              <mat-icon>email</mat-icon>
              <div class="info-content">
                <span class="info-label">Correo Electrónico</span>
                <span class="info-value">{{ currentUser?.email || 'N/A' }}</span>
              </div>
            </div>

            <div class="info-item">
              <mat-icon>admin_panel_settings</mat-icon>
              <div class="info-content">
                <span class="info-label">Rol</span>
                <span class="info-value role-badge" [class.admin]="currentUser?.rol === 'ADMIN'"
                      [class.supervisor]="currentUser?.rol === 'SUPERVISOR'"
                      [class.consulta]="currentUser?.rol === 'CONSULTA'">
                  {{ currentUser?.rol || 'N/A' }}
                </span>
              </div>
            </div>

            <div class="info-item" *ngIf="currentUser?.activo !== undefined">
              <mat-icon>check_circle</mat-icon>
              <div class="info-content">
                <span class="info-label">Estado</span>
                <span class="info-value status-badge" [class.active]="currentUser?.activo">
                  {{ currentUser?.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Quick Access Section -->
      <div class="quick-access-section">
        <h2 class="section-title">Accesos Rápidos</h2>

        <div class="quick-access-buttons">
          <button mat-raised-button color="primary" class="quick-action-btn"
                  (click)="navegarA('/turnos/nuevo')"
                  *ngIf="hasRole(['ADMIN', 'SUPERVISOR'])">
            <mat-icon>add_circle</mat-icon>
            Registrar Nuevo Turno
          </button>

          <button mat-raised-button color="accent" class="quick-action-btn"
                  (click)="navegarA('/turnos')">
            <mat-icon>list_alt</mat-icon>
            Ver Lista de Turnos
          </button>

          <button mat-raised-button color="warn" class="quick-action-btn"
                  (click)="navegarA('/reportes')"
                  *ngIf="hasRole(['ADMIN', 'SUPERVISOR'])">
            <mat-icon>assessment</mat-icon>
            Generar Reporte
          </button>
        </div>
      </div>

      <!-- Action Cards -->
      <div class="action-cards-section">
        <h2 class="section-title">Módulos del Sistema</h2>

        <div class="cards-grid">
          <mat-card class="action-card" *ngIf="hasRole(['ADMIN', 'SUPERVISOR'])">
            <mat-card-header>
              <mat-icon class="card-icon primary">schedule</mat-icon>
            </mat-card-header>
            <mat-card-content>
              <h3>Gestión de Turnos</h3>
              <p>Registrar y consultar turnos de guardianes</p>
            </mat-card-content>
            <mat-card-actions>
              <button mat-raised-button color="primary" (click)="navegarA('/turnos')">
                <mat-icon>list</mat-icon>
                Ver Turnos
              </button>
            </mat-card-actions>
          </mat-card>

          <mat-card class="action-card" *ngIf="hasRole(['ADMIN', 'SUPERVISOR'])">
            <mat-card-header>
              <mat-icon class="card-icon accent">business</mat-icon>
            </mat-card-header>
            <mat-card-content>
              <h3>Clientes y Ubicaciones</h3>
              <p>Gestionar empresas clientes y sus ubicaciones</p>
            </mat-card-content>
            <mat-card-actions>
              <button mat-raised-button color="accent" (click)="navegarA('/clientes')">
                <mat-icon>list</mat-icon>
                Ver Clientes
              </button>
            </mat-card-actions>
          </mat-card>

          <mat-card class="action-card" *ngIf="hasRole(['ADMIN', 'SUPERVISOR'])">
            <mat-card-header>
              <mat-icon class="card-icon warn">assessment</mat-icon>
            </mat-card-header>
            <mat-card-content>
              <h3>Reportes y Nómina</h3>
              <p>Generar reportes CSV para nómina</p>
            </mat-card-content>
            <mat-card-actions>
              <button mat-raised-button color="warn" (click)="navegarA('/reportes')">
                <mat-icon>download</mat-icon>
                Exportar CSV
              </button>
            </mat-card-actions>
          </mat-card>

          <mat-card class="action-card" *ngIf="hasRole(['ADMIN'])">
            <mat-card-header>
              <mat-icon class="card-icon">people</mat-icon>
            </mat-card-header>
            <mat-card-content>
              <h3>Usuarios del Sistema</h3>
              <p>Administrar usuarios y permisos</p>
            </mat-card-content>
            <mat-card-actions>
              <button mat-raised-button (click)="navegarA('/usuarios')">
                <mat-icon>settings</mat-icon>
                Configurar
              </button>
            </mat-card-actions>
          </mat-card>
        </div>
      </div>

      <!-- System Info -->
      <mat-card class="system-info-card">
        <mat-card-content>
          <div class="system-info">
            <mat-icon>info</mat-icon>
            <div class="info-text">
              <strong>Sistema de Gestión de Turnos v1.0</strong>
              <span>OperacionesRanger - Guardianes Ranger | Dominican Republic</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 24px;
      max-width: 1600px;
      margin: 0 auto;
    }

    .welcome-section {
      margin-bottom: 32px;
    }

    /* Statistics Section */
    .statistics-section {
      margin-bottom: 32px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-top: 16px;
    }

    .stat-card {
      transition: transform 0.2s, box-shadow 0.2s;
      cursor: default;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .stat-card-blue mat-card-content {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 24px;
      border-radius: 8px;
    }

    .stat-card-green mat-card-content {
      background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
      color: white;
      padding: 24px;
      border-radius: 8px;
    }

    .stat-card-orange mat-card-content {
      background: linear-gradient(135deg, #ff9800 0%, #ffa726 100%);
      color: white;
      padding: 24px;
      border-radius: 8px;
    }

    .stat-card-warning mat-card-content {
      background: linear-gradient(135deg, #ff5722 0%, #f44336 100%);
      color: white;
      animation: pulse 2s infinite;
    }

    .stat-card-purple mat-card-content {
      background: linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%);
      color: white;
      padding: 24px;
      border-radius: 8px;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.85; }
    }

    .stat-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .stat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .stat-label {
      font-size: 14px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-value {
      font-size: 48px;
      font-weight: 700;
      text-align: center;
      margin: 16px 0;
    }

    .stat-loading {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80px;
    }

    .stat-error {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 12px;
      min-height: 80px;
      opacity: 0.9;
    }

    .stat-error mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    /* Quick Access Section */
    .quick-access-section {
      margin-bottom: 32px;
    }

    .quick-access-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-top: 16px;
    }

    .quick-action-btn {
      padding: 12px 24px;
      font-size: 16px;
      font-weight: 500;
    }

    .quick-action-btn mat-icon {
      margin-right: 8px;
    }

    /* Action Cards Section */
    .action-cards-section {
      margin-bottom: 32px;
    }

    .welcome-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 32px;
      font-weight: 500;
      margin: 0 0 8px 0;
      color: #333;
    }

    .welcome-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: #ffa726;
    }

    .welcome-subtitle {
      font-size: 16px;
      color: rgba(0, 0, 0, 0.6);
      margin: 0;
    }

    .user-info-card {
      margin-bottom: 32px;
    }

    .user-avatar {
      background-color: #667eea;
      color: white;
      font-size: 40px;
      width: 40px;
      height: 40px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-top: 16px;
    }

    .info-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      border-radius: 8px;
      background-color: #f5f5f5;
    }

    .info-item mat-icon {
      color: #667eea;
      margin-top: 2px;
    }

    .info-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }

    .info-label {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
      text-transform: uppercase;
      font-weight: 500;
    }

    .info-value {
      font-size: 16px;
      color: #333;
      font-weight: 500;
    }

    .role-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
    }

    .role-badge.admin {
      background-color: #f44336;
      color: white;
    }

    .role-badge.supervisor {
      background-color: #ff9800;
      color: white;
    }

    .role-badge.consulta {
      background-color: #4caf50;
      color: white;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
    }

    .status-badge.active {
      background-color: #4caf50;
      color: white;
    }

    .quick-access-section {
      margin-bottom: 32px;
    }

    .section-title {
      font-size: 24px;
      font-weight: 500;
      margin: 0 0 20px 0;
      color: #333;
    }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }

    .action-card {
      display: flex;
      flex-direction: column;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .action-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .card-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 8px;
    }

    .card-icon.primary {
      color: #667eea;
    }

    .card-icon.accent {
      color: #26a69a;
    }

    .card-icon.warn {
      color: #ff7043;
    }

    .action-card h3 {
      font-size: 18px;
      font-weight: 500;
      margin: 0 0 8px 0;
    }

    .action-card p {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
      margin: 0;
    }

    mat-card-actions {
      padding: 16px;
      margin: 0;
    }

    .system-info-card {
      background-color: #f5f5f5;
    }

    .system-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .system-info mat-icon {
      color: #667eea;
    }

    .info-text {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-text strong {
      font-size: 14px;
      color: #333;
    }

    .info-text span {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
    }

    /* Responsive design */
    @media (max-width: 1024px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 600px) {
      .dashboard-container {
        padding: 16px;
      }

      .welcome-title {
        font-size: 24px;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .cards-grid {
        grid-template-columns: 1fr;
      }

      .quick-access-buttons {
        flex-direction: column;
      }

      .quick-action-btn {
        width: 100%;
      }

      .stat-value {
        font-size: 36px;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;

  // Estadísticas
  turnosMesActual: number = 0;
  guardianesActivos: number = 0;
  turnosPendientes: number = 0;
  horasTotalesMes: number = 0;

  // Loading states
  isLoadingTurnos: boolean = true;
  isLoadingGuardianes: boolean = true;
  isLoadingPendientes: boolean = true;

  // Errors
  errorTurnos: string | null = null;
  errorGuardianes: string | null = null;
  errorPendientes: string | null = null;

  constructor(
    private authService: AuthService,
    private turnosService: TurnosService,
    private rrhhService: RrhhService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.cargarEstadisticas();
  }

  /**
   * Cargar todas las estadísticas del dashboard
   */
  cargarEstadisticas(): void {
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

    const fechaInicio = this.formatDate(primerDiaMes);
    const fechaFin = this.formatDate(ultimoDiaMes);

    // Cargar turnos del mes
    this.cargarTurnosMes(fechaInicio, fechaFin);

    // Cargar guardianes activos
    this.cargarGuardianesActivos();

    // Cargar turnos pendientes
    this.cargarTurnosPendientes();
  }

  /**
   * Cargar turnos del mes actual y calcular horas totales
   */
  cargarTurnosMes(fechaInicio: string, fechaFin: string): void {
    this.isLoadingTurnos = true;
    this.errorTurnos = null;

    this.turnosService.getAll({ fecha_inicio: fechaInicio, fecha_fin: fechaFin })
      .subscribe({
        next: (response) => {
          this.turnosMesActual = response.total;

          // Calcular horas totales (normales + extras)
          this.horasTotalesMes = response.data.reduce((sum, turno) =>
            sum + turno.horas_normales + turno.horas_extras, 0
          );

          this.isLoadingTurnos = false;
        },
        error: (error) => {
          console.error('Error cargando turnos del mes:', error);
          this.errorTurnos = 'Error al cargar turnos';
          this.isLoadingTurnos = false;

          // Datos de ejemplo si el endpoint no está disponible
          this.turnosMesActual = 0;
          this.horasTotalesMes = 0;
        }
      });
  }

  /**
   * Cargar cantidad de guardianes activos
   */
  cargarGuardianesActivos(): void {
    this.isLoadingGuardianes = true;
    this.errorGuardianes = null;

    this.rrhhService.getGuardianes({ status: 1 })
      .subscribe({
        next: (response) => {
          this.guardianesActivos = response.total;
          this.isLoadingGuardianes = false;
        },
        error: (error) => {
          console.error('Error cargando guardianes activos:', error);
          this.errorGuardianes = 'Error al cargar guardianes';
          this.isLoadingGuardianes = false;

          // Datos de ejemplo si el endpoint no está disponible
          this.guardianesActivos = 0;
        }
      });
  }

  /**
   * Cargar turnos pendientes de procesar
   */
  cargarTurnosPendientes(): void {
    this.isLoadingPendientes = true;
    this.errorPendientes = null;

    this.turnosService.getAll({ procesado_nomina: false })
      .subscribe({
        next: (response) => {
          this.turnosPendientes = response.total;
          this.isLoadingPendientes = false;
        },
        error: (error) => {
          console.error('Error cargando turnos pendientes:', error);
          this.errorPendientes = 'Error al cargar pendientes';
          this.isLoadingPendientes = false;

          // Datos de ejemplo si el endpoint no está disponible
          this.turnosPendientes = 0;
        }
      });
  }

  /**
   * Formatear fecha a YYYY-MM-DD
   */
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Navegar a una ruta específica
   */
  navegarA(ruta: string): void {
    this.router.navigate([ruta]);
  }

  /**
   * Verificar si el usuario tiene alguno de los roles especificados
   */
  hasRole(roles: string[]): boolean {
    return this.authService.hasRole(...roles as any);
  }
}
