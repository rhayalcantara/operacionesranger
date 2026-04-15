import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError, of } from 'rxjs';

/**
 * Guard de autenticación
 * Protege rutas que requieren que el usuario esté autenticado
 *
 * Uso:
 * {
 *   path: 'dashboard',
 *   component: DashboardComponent,
 *   canActivate: [authGuard]
 * }
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 1. Verificar si el usuario está autenticado
  if (authService.isAuthenticated()) {
    // Usuario autenticado, permitir acceso
    return true;
  }

  // 2. Usuario no autenticado, verificar si hay refresh token
  const refreshToken = authService.getRefreshToken();

  if (!refreshToken) {
    // No hay refresh token, redirigir a login
    console.log('AuthGuard: No refresh token, redirecting to login');
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  // 3. Intentar refrescar el access token
  console.log('AuthGuard: Access token expired, attempting refresh...');

  return authService.refreshToken().pipe(
    map(() => {
      // Refresh exitoso, permitir acceso
      console.log('AuthGuard: Token refreshed successfully');
      return true;
    }),
    catchError(error => {
      // Refresh falló, redirigir a login
      console.error('AuthGuard: Token refresh failed', error);
      router.navigate(['/login'], {
        queryParams: { returnUrl: state.url }
      });
      return of(false);
    })
  );
};

/**
 * Guard de autenticación (versión class-based, alternativa)
 * Angular 20 prefiere functional guards, pero esta versión también funciona
 *
 * Uso:
 * import { AuthGuard } from './auth.guard';
 *
 * {
 *   path: 'dashboard',
 *   component: DashboardComponent,
 *   canActivate: [AuthGuard]
 * }
 */
/*
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    }

    const refreshToken = this.authService.getRefreshToken();

    if (!refreshToken) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    }

    return this.authService.refreshToken().pipe(
      map(() => true),
      catchError(() => {
        this.router.navigate(['/login'], {
          queryParams: { returnUrl: state.url }
        });
        return of(false);
      })
    );
  }
}
*/
