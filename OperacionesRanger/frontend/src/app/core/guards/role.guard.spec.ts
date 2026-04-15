import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { roleGuard } from './role.guard';
import { AuthService } from '../services/auth.service';
import { User } from '../models/auth.model';

describe('roleGuard', () => {
  let authService: any;
  let router: any;
  let mockState: RouterStateSnapshot;

  const mockAdmin: User = {
    id_usuario: 1,
    username: 'admin',
    email: 'admin@test.com',
    nombre_completo: 'Admin',
    rol: 'ADMIN',
    nivel: 9,
    activo: true,
  };

  const mockConsulta: User = {
    id_usuario: 2,
    username: 'consulta',
    email: 'consulta@test.com',
    nombre_completo: 'Consulta',
    rol: 'CONSULTA',
    nivel: 1,
    activo: true,
  };

  beforeEach(() => {
    const authSpy = {
      isAuthenticated: vi.fn(),
      getCurrentUser: vi.fn(),
      hasRole: vi.fn(),
    };
    const routerSpy = {
      navigate: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    mockState = { url: '/usuarios' } as RouterStateSnapshot;
  });

  function createRoute(roles?: string[]): ActivatedRouteSnapshot {
    return { data: { roles } } as any;
  }

  it('should redirect to login if not authenticated', () => {
    authService.isAuthenticated.mockReturnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      roleGuard(createRoute(['ADMIN']), mockState)
    );

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/usuarios' },
    });
  });

  it('should allow access if no roles specified', () => {
    authService.isAuthenticated.mockReturnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      roleGuard(createRoute(), mockState)
    );

    expect(result).toBe(true);
  });

  it('should allow access when user has required role', () => {
    authService.isAuthenticated.mockReturnValue(true);
    authService.getCurrentUser.mockReturnValue(mockAdmin);
    authService.hasRole.mockReturnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      roleGuard(createRoute(['ADMIN']), mockState)
    );

    expect(result).toBe(true);
  });

  it('should redirect to /unauthorized when user lacks role', () => {
    authService.isAuthenticated.mockReturnValue(true);
    authService.getCurrentUser.mockReturnValue(mockConsulta);
    authService.hasRole.mockReturnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      roleGuard(createRoute(['ADMIN']), mockState)
    );

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/unauthorized'], {
      queryParams: {
        requiredRoles: 'ADMIN',
        currentRole: 'CONSULTA',
      },
    });
  });

  it('should redirect to login if no current user', () => {
    authService.isAuthenticated.mockReturnValue(true);
    authService.getCurrentUser.mockReturnValue(null);

    const result = TestBed.runInInjectionContext(() =>
      roleGuard(createRoute(['ADMIN']), mockState)
    );

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/usuarios' },
    });
  });

  it('should support multiple roles (OR logic)', () => {
    authService.isAuthenticated.mockReturnValue(true);
    authService.getCurrentUser.mockReturnValue(mockAdmin);
    authService.hasRole.mockReturnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      roleGuard(createRoute(['ADMIN', 'SUPERVISOR']), mockState)
    );

    expect(result).toBe(true);
    expect(authService.hasRole).toHaveBeenCalledWith('ADMIN', 'SUPERVISOR');
  });
});
