import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError, firstValueFrom, Observable } from 'rxjs';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let authService: any;
  let router: any;
  let mockRoute: ActivatedRouteSnapshot;
  let mockState: RouterStateSnapshot;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: vi.fn(),
            getRefreshToken: vi.fn(),
            refreshToken: vi.fn(),
          },
        },
        {
          provide: Router,
          useValue: { navigate: vi.fn() },
        },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    mockRoute = {} as ActivatedRouteSnapshot;
    mockState = { url: '/dashboard' } as RouterStateSnapshot;
  });

  it('should allow access when user is authenticated', () => {
    authService.isAuthenticated.mockReturnValue(true);

    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
    expect(result).toBe(true);
  });

  it('should redirect to login when no refresh token', () => {
    authService.isAuthenticated.mockReturnValue(false);
    authService.getRefreshToken.mockReturnValue(null);

    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/dashboard' },
    });
  });

  it('should attempt token refresh when expired but refresh token exists', async () => {
    authService.isAuthenticated.mockReturnValue(false);
    authService.getRefreshToken.mockReturnValue('valid-refresh');
    authService.refreshToken.mockReturnValue(of({ accessToken: 'new-token' }));

    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

    // Result is an Observable when refresh is attempted
    const allowed = await firstValueFrom(result as Observable<boolean>);
    expect(allowed).toBe(true);
    expect(authService.refreshToken).toHaveBeenCalled();
  });

  it('should redirect to login when refresh fails', async () => {
    authService.isAuthenticated.mockReturnValue(false);
    authService.getRefreshToken.mockReturnValue('expired-refresh');
    authService.refreshToken.mockReturnValue(throwError(() => new Error('Refresh failed')));

    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

    const allowed = await firstValueFrom(result as Observable<boolean>);
    expect(allowed).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/dashboard' },
    });
  });
});
