import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authService: any;
  let router: any;

  const apiBase = environment.apiBaseUrl;
  const mockToken = 'mock-jwt-token';

  beforeEach(() => {
    localStorage.clear();

    const authSpy = {
      getAccessToken: vi.fn().mockReturnValue(mockToken),
      refreshToken: vi.fn(),
      logout: vi.fn().mockReturnValue(of(void 0)),
    };
    const routerSpy = {
      navigate: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  // ============================================================================
  // Token injection
  // ============================================================================

  describe('token injection', () => {
    it('should add Authorization header to API requests', () => {
      http.get(`${apiBase}/clientes`).subscribe();

      const req = httpMock.expectOne(`${apiBase}/clientes`);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush([]);
    });

    it('should NOT add token to login endpoint', () => {
      http.post(`${apiBase}/auth/login`, {}).subscribe();

      const req = httpMock.expectOne(`${apiBase}/auth/login`);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });

    it('should NOT add token to refresh endpoint', () => {
      http.post(`${apiBase}/auth/refresh`, {}).subscribe();

      const req = httpMock.expectOne(`${apiBase}/auth/refresh`);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });

    it('should NOT add token when no token available', () => {
      authService.getAccessToken.mockReturnValue(null);

      http.get(`${apiBase}/clientes`).subscribe();

      const req = httpMock.expectOne(`${apiBase}/clientes`);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush([]);
    });
  });

  // ============================================================================
  // 401 handling
  // ============================================================================

  describe('401 error handling', () => {
    it('should attempt token refresh on 401', () => {
      authService.refreshToken.mockReturnValue(of({ accessToken: 'new-token' }));
      authService.getAccessToken
        .mockReturnValueOnce(mockToken) // first request
        .mockReturnValue('new-token');  // retry

      http.get(`${apiBase}/clientes`).subscribe();

      // Original request fails with 401
      const req = httpMock.expectOne(`${apiBase}/clientes`);
      req.flush(null, { status: 401, statusText: 'Unauthorized' });

      // After refresh, retries with new token
      const retryReq = httpMock.expectOne(`${apiBase}/clientes`);
      expect(retryReq.request.headers.get('Authorization')).toBe('Bearer new-token');
      retryReq.flush([]);

      expect(authService.refreshToken).toHaveBeenCalled();
    });

    it('should logout and redirect when refresh fails', () => {
      authService.refreshToken.mockReturnValue(
        throwError(() => new Error('Refresh failed'))
      );

      http.get(`${apiBase}/clientes`).subscribe({ error: () => {} });

      const req = httpMock.expectOne(`${apiBase}/clientes`);
      req.flush(null, { status: 401, statusText: 'Unauthorized' });

      expect(authService.refreshToken).toHaveBeenCalled();
      expect(authService.logout).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Non-401 errors
  // ============================================================================

  describe('non-401 errors', () => {
    it('should propagate 400 errors without refresh attempt', () => {
      let errorReceived = false;

      http.get(`${apiBase}/clientes`).subscribe({
        error: (err) => {
          errorReceived = true;
          expect(err.status).toBe(400);
        },
      });

      const req = httpMock.expectOne(`${apiBase}/clientes`);
      req.flush({ message: 'Bad Request' }, { status: 400, statusText: 'Bad Request' });

      expect(errorReceived).toBe(true);
      expect(authService.refreshToken).not.toHaveBeenCalled();
    });

    it('should propagate 500 errors without refresh attempt', () => {
      let errorReceived = false;

      http.get(`${apiBase}/clientes`).subscribe({
        error: () => { errorReceived = true; },
      });

      const req = httpMock.expectOne(`${apiBase}/clientes`);
      req.flush(null, { status: 500, statusText: 'Server Error' });

      expect(errorReceived).toBe(true);
      expect(authService.refreshToken).not.toHaveBeenCalled();
    });

    it('should propagate 403 errors without refresh attempt', () => {
      let status = 0;

      http.get(`${apiBase}/usuarios`).subscribe({
        error: (err) => { status = err.status; },
      });

      const req = httpMock.expectOne(`${apiBase}/usuarios`);
      req.flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });

      expect(status).toBe(403);
      expect(authService.refreshToken).not.toHaveBeenCalled();
    });
  });
});
