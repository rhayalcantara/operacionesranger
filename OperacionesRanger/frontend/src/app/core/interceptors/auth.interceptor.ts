import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor de autenticación (functional, Angular 20)
 * - Agrega header Authorization Bearer token a todas las requests
 * - Intercepta errores 401 (Unauthorized)
 * - Intenta auto-refresh del token
 * - Retry request con nuevo token
 * - Si refresh falla, hace logout y redirige a login
 *
 * Configuración en app.config.ts:
 * provideHttpClient(
 *   withInterceptors([authInterceptor, errorInterceptor])
 * )
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 1. Agregar token a la request (si existe y no es endpoint de auth)
  const modifiedReq = addAuthToken(req, authService);

  // 2. Continuar con la request y manejar errores 401
  return next(modifiedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Solo manejar errores 401 (Unauthorized)
      if (error.status === 401) {
        return handle401Error(modifiedReq, next, authService, router);
      }

      // Otros errores, propagarlos
      return throwError(() => error);
    })
  );
};

/**
 * Agregar token de autenticación al header
 */
function addAuthToken(req: HttpRequest<unknown>, authService: AuthService): HttpRequest<unknown> {
  // No agregar token a endpoints de autenticación
  const isAuthEndpoint = req.url.includes('/api/auth/login') ||
                         req.url.includes('/api/auth/refresh');

  if (isAuthEndpoint) {
    return req;
  }

  // Obtener access token
  const token = authService.getAccessToken();

  // Si hay token, agregarlo al header
  if (token) {
    return req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return req;
}

/**
 * Manejar error 401 (Unauthorized)
 * Intentar refresh token y retry request
 */
function handle401Error(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  router: Router
) {
  console.log('AuthInterceptor: 401 Unauthorized, attempting token refresh...');

  // Si la request es al endpoint de refresh, no intentar de nuevo (evitar loop)
  if (req.url.includes('/api/auth/refresh')) {
    console.error('AuthInterceptor: Refresh token expired, logging out');
    authService.logout().subscribe(() => {
      router.navigate(['/login']);
    });
    return throwError(() => new Error('Refresh token expired'));
  }

  // Intentar refresh token
  return authService.refreshToken().pipe(
    switchMap(() => {
      // Refresh exitoso, retry request original con nuevo token
      console.log('AuthInterceptor: Token refreshed, retrying request...');
      const newToken = authService.getAccessToken();

      const retryReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${newToken}`
        }
      });

      return next(retryReq);
    }),
    catchError(refreshError => {
      // Refresh falló, hacer logout
      console.error('AuthInterceptor: Token refresh failed, logging out', refreshError);

      authService.logout().subscribe({
        next: () => {
          router.navigate(['/login']);
        },
        error: (logoutError) => {
          // Incluso si logout falla, redirigir a login
          console.error('AuthInterceptor: Logout failed', logoutError);
          router.navigate(['/login']);
        }
      });

      return throwError(() => refreshError);
    })
  );
}

/**
 * Interceptor de autenticación (class-based, alternativa)
 * Angular 20 prefiere functional interceptors, pero esta versión también funciona
 *
 * Configuración en app.module.ts:
 * providers: [
 *   { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
 * ]
 */
/*
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getAccessToken();

    if (token && !req.url.includes('/api/auth/login') && !req.url.includes('/api/auth/refresh')) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          return this.handle401Error(req, next);
        }
        return throwError(() => error);
      })
    );
  }

  private handle401Error(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.url.includes('/api/auth/refresh')) {
      this.authService.logout().subscribe(() => {
        this.router.navigate(['/login']);
      });
      return throwError(() => new Error('Refresh token expired'));
    }

    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap((response) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(response.accessToken);

          return next.handle(req.clone({
            setHeaders: {
              Authorization: `Bearer ${response.accessToken}`
            }
          }));
        }),
        catchError((error) => {
          this.isRefreshing = false;
          this.authService.logout().subscribe(() => {
            this.router.navigate(['/login']);
          });
          return throwError(() => error);
        })
      );
    } else {
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(token => {
          return next.handle(req.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`
            }
          }));
        })
      );
    }
  }
}
*/
