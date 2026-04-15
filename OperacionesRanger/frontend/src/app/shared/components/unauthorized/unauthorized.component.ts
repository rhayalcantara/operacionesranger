import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/auth.model';

/**
 * UnauthorizedComponent
 *
 * Componente que se muestra cuando un usuario intenta acceder a una ruta
 * para la cual no tiene permisos suficientes.
 *
 * Características:
 * - Mensaje claro de acceso denegado
 * - Información sobre el rol actual del usuario
 * - Navegación de regreso al dashboard
 * - Diseño amigable con Material UI
 */
@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="unauthorized-container">
      <mat-card class="unauthorized-card">
        <mat-card-header>
          <div class="header-content">
            <mat-icon class="warning-icon">block</mat-icon>
            <div class="title-wrapper">
              <mat-card-title>Acceso No Autorizado</mat-card-title>
              <mat-card-subtitle>No tienes permisos para acceder a esta página</mat-card-subtitle>
            </div>
          </div>
        </mat-card-header>

        <mat-card-content>
          <div class="content-section">
            <mat-icon class="info-icon">info</mat-icon>
            <div class="info-text">
              <p>
                Esta página requiere permisos especiales que tu cuenta actual no posee.
                Si crees que esto es un error, contacta al administrador del sistema.
              </p>

              <div class="user-info" *ngIf="currentUser">
                <div class="info-row">
                  <strong>Usuario actual:</strong>
                  <span>{{ currentUser.username }}</span>
                </div>
                <div class="info-row">
                  <strong>Rol:</strong>
                  <span class="role-badge" [class.admin]="currentUser.rol === 'ADMIN'"
                        [class.supervisor]="currentUser.rol === 'SUPERVISOR'"
                        [class.consulta]="currentUser.rol === 'CONSULTA'">
                    {{ currentUser.rol }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </mat-card-content>

        <mat-card-actions>
          <button mat-raised-button color="primary" (click)="goToDashboard()">
            <mat-icon>home</mat-icon>
            Volver al Dashboard
          </button>
          <button mat-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
            Regresar
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .unauthorized-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      padding: 20px;
    }

    .unauthorized-card {
      width: 100%;
      max-width: 600px;
      padding: 20px;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 16px;
      width: 100%;
    }

    .warning-icon {
      font-size: 56px;
      width: 56px;
      height: 56px;
      color: #f44336;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.6;
      }
    }

    .title-wrapper {
      flex: 1;
    }

    mat-card-title {
      font-size: 24px;
      color: #f44336;
      margin-bottom: 8px;
    }

    mat-card-subtitle {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
    }

    mat-card-content {
      padding: 24px 0;
    }

    .content-section {
      display: flex;
      gap: 16px;
    }

    .info-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #2196f3;
      flex-shrink: 0;
    }

    .info-text {
      flex: 1;
    }

    .info-text p {
      margin: 0 0 20px 0;
      font-size: 16px;
      line-height: 1.6;
      color: rgba(0, 0, 0, 0.87);
    }

    .user-info {
      background-color: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid #2196f3;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-size: 14px;
    }

    .info-row:last-child {
      margin-bottom: 0;
    }

    .info-row strong {
      color: rgba(0, 0, 0, 0.87);
    }

    .info-row span {
      color: rgba(0, 0, 0, 0.6);
    }

    .role-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      color: white !important;
    }

    .role-badge.admin {
      background-color: #f44336;
    }

    .role-badge.supervisor {
      background-color: #ff9800;
    }

    .role-badge.consulta {
      background-color: #4caf50;
    }

    mat-card-actions {
      display: flex;
      gap: 12px;
      padding: 16px 0 0 0;
      margin: 0;
    }

    mat-card-actions button {
      flex: 1;
    }

    mat-icon {
      margin-right: 8px;
    }

    /* Responsive design */
    @media (max-width: 600px) {
      .unauthorized-container {
        padding: 10px;
      }

      .unauthorized-card {
        padding: 16px;
      }

      mat-card-title {
        font-size: 20px;
      }

      .warning-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
      }

      .content-section {
        flex-direction: column;
      }

      mat-card-actions {
        flex-direction: column;
      }

      mat-card-actions button {
        width: 100%;
      }
    }
  `]
})
export class UnauthorizedComponent implements OnInit {
  currentUser: User | null = null;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
  }

  /**
   * Navega al dashboard
   */
  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  /**
   * Regresa a la página anterior
   */
  goBack(): void {
    window.history.back();
  }
}
