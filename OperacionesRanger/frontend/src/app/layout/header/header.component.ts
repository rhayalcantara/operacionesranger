import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { User } from '../../core/models/auth.model';

/**
 * HeaderComponent - Toolbar superior con menú de usuario
 *
 * Características:
 * - Toolbar con botón toggle para sidebar (mobile)
 * - Título de la aplicación
 * - Información del usuario actual (nombre y rol)
 * - Menú desplegable con opciones (Cambiar Password, Logout)
 * - Badge de rol con colores
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  /**
   * Evento emitido cuando se hace click en el botón toggle del sidebar
   */
  @Output() toggleSidebar = new EventEmitter<void>();

  /**
   * Usuario actual
   */
  currentUser: User | null = null;

  isDark = true;

  constructor(
    private router: Router,
    private authService: AuthService,
    private themeService: ThemeService
  ) {
    this.isDark = this.themeService.isDark;
    this.themeService.theme$.subscribe(t => this.isDark = t === 'dark');
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
  }

  /**
   * Emite evento para toggle del sidebar
   */
  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  /**
   * Navega a la página de cambio de password
   */
  onChangePassword(): void {
    this.router.navigate(['/cambiar-password']);
  }

  /**
   * Ejecuta logout
   */
  onLogout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Error durante logout:', error);
        // Navegar a login incluso si hay error
        this.router.navigate(['/login']);
      }
    });
  }

  onToggleTheme(): void {
    this.themeService.toggle();
  }

  /**
   * Retorna la clase CSS del badge según el rol
   */
  getRoleBadgeClass(): string {
    if (!this.currentUser) {
      return '';
    }

    switch (this.currentUser.rol) {
      case 'ADMIN':
        return 'role-badge role-admin';
      case 'SUPERVISOR':
        return 'role-badge role-supervisor';
      case 'CONSULTA':
        return 'role-badge role-consulta';
      default:
        return 'role-badge';
    }
  }

  /**
   * Retorna el label del rol en español
   */
  getRoleLabel(): string {
    if (!this.currentUser) {
      return '';
    }

    switch (this.currentUser.rol) {
      case 'ADMIN':
        return 'Administrador';
      case 'SUPERVISOR':
        return 'Supervisor';
      case 'CONSULTA':
        return 'Consulta';
      default:
        return this.currentUser.rol;
    }
  }
}
