import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { AUTH_STORAGE_KEYS, AUTH_ENDPOINTS, AuthResponse, User } from '../models/auth.model';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const mockUser: User = {
    id_usuario: 1,
    username: 'admin',
    email: 'admin@test.com',
    nombre_completo: 'Admin Test',
    rol: 'ADMIN',
    nivel: 9,
    activo: true,
  };

  // JWT con exp = año 2099 (no expira en tests)
  const mockAccessToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
    btoa(JSON.stringify({ sub: 1, username: 'admin', rol: 'ADMIN', iat: 1700000000, exp: 4100000000 }))
      .replace(/=/g, '') +
    '.fake-signature';

  const mockRefreshToken = 'mock-refresh-token';

  const mockAuthResponse: AuthResponse = {
    accessToken: mockAccessToken,
    refreshToken: mockRefreshToken,
    user: mockUser,
  };

  beforeEach(() => {
    // Limpiar localStorage antes de cada test
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  // ============================================================================
  // Creación del servicio
  // ============================================================================

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============================================================================
  // Login
  // ============================================================================

  describe('login()', () => {
    it('should POST to login endpoint and store tokens', () => {
      service.login({ username: 'admin', password: 'pass' }).subscribe((response) => {
        expect(response.accessToken).toBe(mockAccessToken);
        expect(response.user.username).toBe('admin');
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}${AUTH_ENDPOINTS.LOGIN}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ username: 'admin', password: 'pass' });
      req.flush(mockAuthResponse);

      // Verificar que se guardaron en localStorage
      expect(localStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN)).toBe(mockAccessToken);
      expect(localStorage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN)).toBe(mockRefreshToken);
      expect(localStorage.getItem(AUTH_STORAGE_KEYS.CURRENT_USER)).toBeTruthy();
    });

    it('should propagate login errors', () => {
      service.login({ username: 'bad', password: 'bad' }).subscribe({
        error: (err) => {
          expect(err.status).toBe(401);
        },
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}${AUTH_ENDPOINTS.LOGIN}`);
      req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  // ============================================================================
  // Logout
  // ============================================================================

  describe('logout()', () => {
    it('should POST to logout endpoint and clear tokens', () => {
      // Setup: simular usuario autenticado
      localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, mockAccessToken);
      localStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, mockRefreshToken);

      service.logout().subscribe();

      const req = httpMock.expectOne(`${environment.apiBaseUrl}${AUTH_ENDPOINTS.LOGOUT}`);
      expect(req.request.method).toBe('POST');
      req.flush(null);

      expect(localStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN)).toBeNull();
      expect(localStorage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN)).toBeNull();
    });

    it('should clear auth data even if logout request fails', () => {
      localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, mockAccessToken);

      service.logout().subscribe({ error: () => {} });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}${AUTH_ENDPOINTS.LOGOUT}`);
      req.flush(null, { status: 500, statusText: 'Server Error' });

      expect(localStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN)).toBeNull();
    });
  });

  // ============================================================================
  // Token refresh
  // ============================================================================

  describe('refreshToken()', () => {
    it('should POST to refresh endpoint and update access token', () => {
      localStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, mockRefreshToken);

      const newToken = 'new-access-token';

      service.refreshToken().subscribe((response) => {
        expect(response.accessToken).toBe(newToken);
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}${AUTH_ENDPOINTS.REFRESH}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ refreshToken: mockRefreshToken });
      req.flush({ accessToken: newToken });

      expect(localStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN)).toBe(newToken);
    });

    it('should throw error if no refresh token available', () => {
      service.refreshToken().subscribe({
        error: (err) => {
          expect(err.message).toContain('No refresh token');
        },
      });
    });

    it('should clear auth data if refresh fails', () => {
      localStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, mockRefreshToken);
      localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, mockAccessToken);

      service.refreshToken().subscribe({ error: () => {} });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}${AUTH_ENDPOINTS.REFRESH}`);
      req.flush(null, { status: 401, statusText: 'Unauthorized' });

      expect(localStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN)).toBeNull();
    });
  });

  // ============================================================================
  // isAuthenticated
  // ============================================================================

  describe('isAuthenticated()', () => {
    it('should return false when no token', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should return true when valid non-expired token exists', () => {
      localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, mockAccessToken);
      // Re-create service to pick up localStorage
      service = TestBed.inject(AuthService);
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should return false for invalid token', () => {
      localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, 'invalid-token');
      service = TestBed.inject(AuthService);
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  // ============================================================================
  // getCurrentUser / hasRole
  // ============================================================================

  describe('getCurrentUser()', () => {
    it('should return null when no user stored', () => {
      expect(service.getCurrentUser()).toBeNull();
    });

    it('should return user from localStorage', () => {
      localStorage.setItem(AUTH_STORAGE_KEYS.CURRENT_USER, JSON.stringify(mockUser));
      const user = service.getCurrentUser();
      expect(user).toBeTruthy();
      expect(user!.username).toBe('admin');
      expect(user!.rol).toBe('ADMIN');
    });
  });

  describe('hasRole()', () => {
    it('should return false when no user', () => {
      expect(service.hasRole('ADMIN')).toBe(false);
    });

    it('should return true when user has matching role', () => {
      localStorage.setItem(AUTH_STORAGE_KEYS.CURRENT_USER, JSON.stringify(mockUser));
      expect(service.hasRole('ADMIN')).toBe(true);
    });

    it('should return true with multiple roles (OR logic)', () => {
      localStorage.setItem(AUTH_STORAGE_KEYS.CURRENT_USER, JSON.stringify(mockUser));
      expect(service.hasRole('ADMIN', 'SUPERVISOR')).toBe(true);
    });

    it('should return false when user does not have role', () => {
      localStorage.setItem(AUTH_STORAGE_KEYS.CURRENT_USER, JSON.stringify(mockUser));
      expect(service.hasRole('CONSULTA')).toBe(false);
    });
  });

  // ============================================================================
  // getAccessToken / getRefreshToken
  // ============================================================================

  describe('getAccessToken()', () => {
    it('should return null when no token', () => {
      expect(service.getAccessToken()).toBeNull();
    });

    it('should return token from localStorage', () => {
      localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, 'my-token');
      expect(service.getAccessToken()).toBe('my-token');
    });
  });

  // ============================================================================
  // changePassword
  // ============================================================================

  describe('changePassword()', () => {
    it('should POST to change-password endpoint', () => {
      localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, mockAccessToken);

      service.changePassword('oldPass', 'newPass').subscribe();

      const req = httpMock.expectOne(`${environment.apiBaseUrl}${AUTH_ENDPOINTS.CHANGE_PASSWORD}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ currentPassword: 'oldPass', newPassword: 'newPass' });
      req.flush(null);
    });
  });

  // ============================================================================
  // authState$
  // ============================================================================

  describe('authState$', () => {
    it('should emit initial unauthenticated state', () => {
      service.authState$.subscribe((state) => {
        expect(state.isAuthenticated).toBe(false);
        expect(state.user).toBeNull();
      });
    });

    it('should emit authenticated state after login', () => {
      const states: boolean[] = [];

      service.authState$.subscribe((state) => {
        states.push(state.isAuthenticated);
      });

      service.login({ username: 'admin', password: 'pass' }).subscribe();

      const req = httpMock.expectOne(`${environment.apiBaseUrl}${AUTH_ENDPOINTS.LOGIN}`);
      req.flush(mockAuthResponse);

      expect(states).toContain(true);
    });
  });
});
