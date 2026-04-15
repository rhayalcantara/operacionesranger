import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/auth.model';

/**
 * Guard de roles
 * Protege rutas que requieren roles específicos
 *
 * Uso:
 * {
 *   path: 'usuarios',
 *   component: UsuariosComponent,
 *   canActivate: [authGuard, roleGuard],
 *   data: { roles: ['ADMIN'] }
 * }
 *
 * Permite múltiples roles (OR logic):
 * data: { roles: ['ADMIN', 'SUPERVISOR'] } // Usuario con ADMIN O SUPERVISOR puede acceder
 */
export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 1. Verificar que el usuario esté autenticado
  if (!authService.isAuthenticated()) {
    console.log('RoleGuard: User not authenticated, redirecting to login');
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  // 2. Obtener roles requeridos desde route.data
  const requiredRoles = route.data['roles'] as UserRole[] | undefined;

  // Si no hay roles especificados, permitir acceso (guard mal configurado)
  if (!requiredRoles || requiredRoles.length === 0) {
    console.warn('RoleGuard: No roles specified in route.data, allowing access');
    return true;
  }

  // 3. Obtener usuario actual
  const currentUser = authService.getCurrentUser();

  if (!currentUser) {
    console.log('RoleGuard: No current user, redirecting to login');
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  // 4. Verificar si el usuario tiene alguno de los roles requeridos
  const hasRequiredRole = authService.hasRole(...requiredRoles);

  if (!hasRequiredRole) {
    console.log(
      `RoleGuard: User ${currentUser.username} (${currentUser.rol}) does not have required role(s): ${requiredRoles.join(', ')}`
    );

    // Redirigir a página de acceso no autorizado
    router.navigate(['/unauthorized'], {
      queryParams: {
        requiredRoles: requiredRoles.join(','),
        currentRole: currentUser.rol
      }
    });
    return false;
  }

  // Usuario tiene el rol requerido, permitir acceso
  console.log(
    `RoleGuard: User ${currentUser.username} (${currentUser.rol}) has required role, allowing access`
  );
  return true;
};

/**
 * Guard de roles (versión class-based, alternativa)
 * Angular 20 prefiere functional guards, pero esta versión también funciona
 *
 * Uso:
 * import { RoleGuard } from './role.guard';
 *
 * {
 *   path: 'usuarios',
 *   component: UsuariosComponent,
 *   canActivate: [AuthGuard, RoleGuard],
 *   data: { roles: ['ADMIN'] }
 * }
 */
/*
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    }

    const requiredRoles = route.data['roles'] as UserRole[] | undefined;

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    }

    const hasRequiredRole = this.authService.hasRole(...requiredRoles);

    if (!hasRequiredRole) {
      this.router.navigate(['/unauthorized'], {
        queryParams: {
          requiredRoles: requiredRoles.join(','),
          currentRole: currentUser.rol
        }
      });
      return false;
    }

    return true;
  }
}
*/
