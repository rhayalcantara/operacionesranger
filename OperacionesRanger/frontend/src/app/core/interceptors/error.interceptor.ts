import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Interceptor de errores HTTP (functional, Angular 20)
 * - Intercepta todos los errores HTTP
 * - Formatea mensajes de error amigables
 * - Muestra notificaciones (console.error por ahora, después MatSnackBar)
 * - Log de errores en modo development
 *
 * Configuración en app.config.ts:
 * provideHttpClient(
 *   withInterceptors([authInterceptor, errorInterceptor])
 * )
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Formatear error
      const errorMessage = formatErrorMessage(error);

      // Log en modo development
      if (!environment.production) {
        console.error('HTTP Error:', {
          url: req.url,
          method: req.method,
          status: error.status,
          statusText: error.statusText,
          message: errorMessage,
          error: error.error
        });
      } else {
        // En producción, solo log básico
        console.error(`HTTP Error ${error.status}: ${errorMessage}`);
      }

      // TODO: Mostrar notificación con MatSnackBar cuando esté disponible
      // this.snackBar.open(errorMessage, 'Cerrar', { duration: 5000 });

      // Por ahora, mostrar en consola con formato visual
      showErrorNotification(error.status, errorMessage);

      // Propagar error formateado
      return throwError(() => ({
        status: error.status,
        statusText: error.statusText,
        message: errorMessage,
        originalError: error
      }));
    })
  );
};

/**
 * Formatear mensaje de error según status code
 */
function formatErrorMessage(error: HttpErrorResponse): string {
  // Error de red (no se pudo conectar al servidor)
  if (error.status === 0) {
    return 'Error de conexión. Verifique su conexión a internet o que el servidor esté disponible.';
  }

  // Errores del cliente (4xx)
  if (error.status >= 400 && error.status < 500) {
    return formatClientError(error);
  }

  // Errores del servidor (5xx)
  if (error.status >= 500 && error.status < 600) {
    return formatServerError(error);
  }

  // Error desconocido
  return `Error ${error.status}: ${error.statusText || 'Error desconocido'}`;
}

/**
 * Formatear errores del cliente (4xx)
 */
function formatClientError(error: HttpErrorResponse): string {
  switch (error.status) {
    case 400:
      // Bad Request - extraer mensaje del backend si existe
      if (error.error?.message) {
        return error.error.message;
      }
      if (error.error?.errors) {
        // Errores de validación
        return formatValidationErrors(error.error.errors);
      }
      return 'Datos inválidos. Por favor verifique la información enviada.';

    case 401:
      // Unauthorized - manejado por authInterceptor, pero por si acaso
      if (error.error?.message) {
        return error.error.message;
      }
      return 'No autorizado. Por favor inicie sesión nuevamente.';

    case 403:
      // Forbidden
      if (error.error?.message) {
        return error.error.message;
      }
      return 'Acceso prohibido. No tiene permisos para realizar esta acción.';

    case 404:
      // Not Found
      if (error.error?.message) {
        return error.error.message;
      }
      return 'Recurso no encontrado.';

    case 409:
      // Conflict
      if (error.error?.message) {
        return error.error.message;
      }
      return 'Conflicto. El recurso ya existe o hay un problema de concurrencia.';

    case 422:
      // Unprocessable Entity - errores de validación
      if (error.error?.message) {
        return error.error.message;
      }
      if (error.error?.errors) {
        return formatValidationErrors(error.error.errors);
      }
      return 'Los datos enviados no pueden ser procesados.';

    case 429:
      // Too Many Requests
      return 'Demasiadas solicitudes. Por favor espere un momento antes de intentar nuevamente.';

    default:
      if (error.error?.message) {
        return error.error.message;
      }
      return `Error ${error.status}: ${error.statusText}`;
  }
}

/**
 * Formatear errores del servidor (5xx)
 */
function formatServerError(error: HttpErrorResponse): string {
  switch (error.status) {
    case 500:
      // Internal Server Error
      if (error.error?.message && !environment.production) {
        return `Error interno del servidor: ${error.error.message}`;
      }
      return 'Error interno del servidor. Por favor intente nuevamente más tarde.';

    case 502:
      // Bad Gateway
      return 'El servidor no está disponible temporalmente. Por favor intente nuevamente más tarde.';

    case 503:
      // Service Unavailable
      return 'Servicio no disponible. El servidor está en mantenimiento.';

    case 504:
      // Gateway Timeout
      return 'Tiempo de espera agotado. El servidor tardó demasiado en responder.';

    default:
      if (error.error?.message && !environment.production) {
        return `Error del servidor: ${error.error.message}`;
      }
      return 'Error del servidor. Por favor intente nuevamente más tarde.';
  }
}

/**
 * Formatear errores de validación
 */
function formatValidationErrors(errors: any): string {
  if (Array.isArray(errors)) {
    return errors.join(', ');
  }

  if (typeof errors === 'object') {
    const messages: string[] = [];
    for (const [field, message] of Object.entries(errors)) {
      if (typeof message === 'string') {
        messages.push(`${field}: ${message}`);
      } else if (Array.isArray(message)) {
        messages.push(`${field}: ${message.join(', ')}`);
      }
    }
    return messages.join('; ');
  }

  return 'Errores de validación en los datos enviados.';
}

/**
 * Mostrar notificación de error en consola (temporal)
 * TODO: Reemplazar con MatSnackBar cuando esté disponible
 */
function showErrorNotification(status: number, message: string): void {
  const color = getErrorColor(status);
  console.error(
    `%c⚠️ Error ${status}`,
    `color: ${color}; font-weight: bold; font-size: 14px;`,
    message
  );
}

/**
 * Obtener color según status code para consola
 */
function getErrorColor(status: number): string {
  if (status === 0) return '#ff5722'; // Network error - rojo
  if (status >= 400 && status < 500) return '#ff9800'; // Client error - naranja
  if (status >= 500) return '#f44336'; // Server error - rojo oscuro
  return '#9e9e9e'; // Otros - gris
}

/**
 * Servicio de notificaciones (para uso futuro con MatSnackBar)
 * TODO: Implementar cuando MatSnackBar esté disponible
 */
/*
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private snackBar: MatSnackBar) {}

  showError(message: string, duration: number = 5000): void {
    this.snackBar.open(message, 'Cerrar', {
      duration,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  showSuccess(message: string, duration: number = 3000): void {
    this.snackBar.open(message, 'Cerrar', {
      duration,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  showWarning(message: string, duration: number = 4000): void {
    this.snackBar.open(message, 'Cerrar', {
      duration,
      panelClass: ['warning-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  showInfo(message: string, duration: number = 3000): void {
    this.snackBar.open(message, 'Cerrar', {
      duration,
      panelClass: ['info-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }
}
*/
