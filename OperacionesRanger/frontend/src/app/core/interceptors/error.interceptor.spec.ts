import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { errorInterceptor } from './error.interceptor';
import { environment } from '../../../environments/environment';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  const apiBase = environment.apiBaseUrl;

  beforeEach(() => {
    // Suppress console.error from interceptor during tests
    vi.spyOn(console, 'error').mockImplementation(() => {});

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  // ============================================================================
  // Success passthrough
  // ============================================================================

  it('should pass through successful responses', () => {
    http.get(`${apiBase}/clientes`).subscribe((data) => {
      expect(data).toEqual([{ id: 1 }]);
    });

    httpMock.expectOne(`${apiBase}/clientes`).flush([{ id: 1 }]);
  });

  // ============================================================================
  // Client errors (4xx)
  // ============================================================================

  describe('client errors (4xx)', () => {
    it('should format 400 with backend message', () => {
      http.get(`${apiBase}/clientes`).subscribe({
        error: (err) => {
          expect(err.status).toBe(400);
          expect(err.message).toBe('Nombre es requerido');
        },
      });

      httpMock.expectOne(`${apiBase}/clientes`).flush(
        { message: 'Nombre es requerido' },
        { status: 400, statusText: 'Bad Request' }
      );
    });

    it('should format 400 with default message when no backend message', () => {
      http.get(`${apiBase}/clientes`).subscribe({
        error: (err) => {
          expect(err.message).toContain('Datos inválidos');
        },
      });

      httpMock.expectOne(`${apiBase}/clientes`).flush(
        null,
        { status: 400, statusText: 'Bad Request' }
      );
    });

    it('should format 401 error', () => {
      http.get(`${apiBase}/clientes`).subscribe({
        error: (err) => {
          expect(err.status).toBe(401);
          expect(err.message).toContain('autorizado');
        },
      });

      httpMock.expectOne(`${apiBase}/clientes`).flush(
        null,
        { status: 401, statusText: 'Unauthorized' }
      );
    });

    it('should format 403 error', () => {
      http.get(`${apiBase}/usuarios`).subscribe({
        error: (err) => {
          expect(err.status).toBe(403);
          expect(err.message).toContain('prohibido');
        },
      });

      httpMock.expectOne(`${apiBase}/usuarios`).flush(
        null,
        { status: 403, statusText: 'Forbidden' }
      );
    });

    it('should format 404 error', () => {
      http.get(`${apiBase}/clientes/999`).subscribe({
        error: (err) => {
          expect(err.status).toBe(404);
          expect(err.message).toContain('no encontrado');
        },
      });

      httpMock.expectOne(`${apiBase}/clientes/999`).flush(
        null,
        { status: 404, statusText: 'Not Found' }
      );
    });

    it('should format 409 conflict error', () => {
      http.post(`${apiBase}/clientes`, {}).subscribe({
        error: (err) => {
          expect(err.status).toBe(409);
          expect(err.message).toContain('Conflicto');
        },
      });

      httpMock.expectOne(`${apiBase}/clientes`).flush(
        null,
        { status: 409, statusText: 'Conflict' }
      );
    });

    it('should format 422 with validation errors array', () => {
      http.post(`${apiBase}/clientes`, {}).subscribe({
        error: (err) => {
          expect(err.status).toBe(422);
          expect(err.message).toContain('nombre');
        },
      });

      httpMock.expectOne(`${apiBase}/clientes`).flush(
        { errors: ['nombre es requerido', 'ruc es inválido'] },
        { status: 422, statusText: 'Unprocessable Entity' }
      );
    });

    it('should format 429 rate limit', () => {
      http.get(`${apiBase}/clientes`).subscribe({
        error: (err) => {
          expect(err.status).toBe(429);
          expect(err.message).toContain('Demasiadas solicitudes');
        },
      });

      httpMock.expectOne(`${apiBase}/clientes`).flush(
        null,
        { status: 429, statusText: 'Too Many Requests' }
      );
    });
  });

  // ============================================================================
  // Server errors (5xx)
  // ============================================================================

  describe('server errors (5xx)', () => {
    it('should format 500 error', () => {
      http.get(`${apiBase}/clientes`).subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
          expect(err.message).toContain('Error interno');
        },
      });

      httpMock.expectOne(`${apiBase}/clientes`).flush(
        null,
        { status: 500, statusText: 'Internal Server Error' }
      );
    });

    it('should format 502 bad gateway', () => {
      http.get(`${apiBase}/clientes`).subscribe({
        error: (err) => {
          expect(err.status).toBe(502);
          expect(err.message).toContain('no está disponible');
        },
      });

      httpMock.expectOne(`${apiBase}/clientes`).flush(
        null,
        { status: 502, statusText: 'Bad Gateway' }
      );
    });

    it('should format 503 service unavailable', () => {
      http.get(`${apiBase}/clientes`).subscribe({
        error: (err) => {
          expect(err.status).toBe(503);
          expect(err.message).toContain('mantenimiento');
        },
      });

      httpMock.expectOne(`${apiBase}/clientes`).flush(
        null,
        { status: 503, statusText: 'Service Unavailable' }
      );
    });

    it('should format 504 gateway timeout', () => {
      http.get(`${apiBase}/clientes`).subscribe({
        error: (err) => {
          expect(err.status).toBe(504);
          expect(err.message).toContain('Tiempo de espera');
        },
      });

      httpMock.expectOne(`${apiBase}/clientes`).flush(
        null,
        { status: 504, statusText: 'Gateway Timeout' }
      );
    });
  });

  // ============================================================================
  // Error structure
  // ============================================================================

  describe('error structure', () => {
    it('should include status, statusText, message and originalError', () => {
      http.get(`${apiBase}/clientes`).subscribe({
        error: (err) => {
          expect(err).toHaveProperty('status');
          expect(err).toHaveProperty('statusText');
          expect(err).toHaveProperty('message');
          expect(err).toHaveProperty('originalError');
        },
      });

      httpMock.expectOne(`${apiBase}/clientes`).flush(
        null,
        { status: 500, statusText: 'Server Error' }
      );
    });
  });
});
