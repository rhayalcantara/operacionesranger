import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../../environments/environment';
import {
  User,
  UserRole,
  LoginCredentials,
  AuthResponse,
  RefreshTokenResponse,
  ChangePasswordRequest,
  JWTPayload,
  AuthState,
  AUTH_STORAGE_KEYS,
  AUTH_ENDPOINTS
} from '../models/auth.model';

/**
 * Servicio de autenticación
 * Maneja login, logout, refresh tokens y validación de usuarios
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  /**
   * Estado de autenticación observable
   */
  private authStateSubject = new BehaviorSubject<AuthState>(this.loadAuthState());
  public authState$ = this.authStateSubject.asObservable();

  /**
   * Flag para evitar múltiples refresh simultáneos
   */
  private isRefreshing = false;

  constructor(private http: HttpClient) {
    // Inicializar estado desde localStorage
    this.loadAuthState();
  }

  /**
   * Iniciar sesión con credenciales
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${environment.apiBaseUrl}${AUTH_ENDPOINTS.LOGIN}`,
      credentials
    ).pipe(
      tap(response => this.handleAuthResponse(response)),
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Cerrar sesión
   */
  logout(): Observable<void> {
    const refreshToken = this.getRefreshToken();
    const headers = this.createAuthHeaders();

    return this.http.post<void>(
      `${environment.apiBaseUrl}${AUTH_ENDPOINTS.LOGOUT}`,
      { refreshToken },
      { headers }
    ).pipe(
      tap(() => this.clearAuthData()),
      catchError(error => {
        // Limpiar datos incluso si la llamada falla
        this.clearAuthData();
        console.error('Logout error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Refrescar access token usando refresh token
   */
  refreshToken(): Observable<RefreshTokenResponse> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    // Evitar múltiples refresh simultáneos
    if (this.isRefreshing) {
      return throwError(() => new Error('Refresh already in progress'));
    }

    this.isRefreshing = true;

    return this.http.post<RefreshTokenResponse>(
      `${environment.apiBaseUrl}${AUTH_ENDPOINTS.REFRESH}`,
      { refreshToken }
    ).pipe(
      tap(response => {
        // Actualizar access token
        this.saveAccessToken(response.accessToken);
        this.isRefreshing = false;
      }),
      catchError(error => {
        this.isRefreshing = false;
        // Si refresh falla, limpiar datos y redirigir a login
        this.clearAuthData();
        console.error('Refresh token error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Cambiar contraseña del usuario actual
   */
  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    const headers = this.createAuthHeaders();
    const body: ChangePasswordRequest = { currentPassword, newPassword };

    return this.http.post<void>(
      `${environment.apiBaseUrl}${AUTH_ENDPOINTS.CHANGE_PASSWORD}`,
      body,
      { headers }
    ).pipe(
      catchError(error => {
        console.error('Change password error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) {
      return false;
    }

    try {
      const decoded = jwtDecode<JWTPayload>(token);
      const now = Date.now() / 1000; // Convertir a segundos

      // Verificar si el token no ha expirado
      return decoded.exp > now;
    } catch (error) {
      console.error('Error decoding token:', error);
      return false;
    }
  }

  /**
   * Obtener usuario actual
   */
  getCurrentUser(): User | null {
    const userJson = localStorage.getItem(AUTH_STORAGE_KEYS.CURRENT_USER);
    if (!userJson) {
      return null;
    }

    try {
      return JSON.parse(userJson) as User;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  /**
   * Obtener access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
  }

  /**
   * Obtener refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
  }

  /**
   * Verificar si el usuario tiene alguno de los roles especificados
   */
  hasRole(...roles: UserRole[]): boolean {
    const user = this.getCurrentUser();
    if (!user) {
      return false;
    }

    return roles.includes(user.rol);
  }

  /**
   * Verificar si el access token está por expirar (menos de 5 minutos)
   */
  isTokenExpiringSoon(): boolean {
    const token = this.getAccessToken();
    if (!token) {
      return false;
    }

    try {
      const decoded = jwtDecode<JWTPayload>(token);
      const now = Date.now() / 1000;
      const timeUntilExpiry = decoded.exp - now;

      // Retornar true si quedan menos de 5 minutos (300 segundos)
      return timeUntilExpiry < 300 && timeUntilExpiry > 0;
    } catch (error) {
      console.error('Error checking token expiry:', error);
      return false;
    }
  }

  /**
   * Decodificar JWT token
   */
  decodeToken(token: string): JWTPayload | null {
    try {
      return jwtDecode<JWTPayload>(token);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Manejar respuesta de autenticación (login/refresh)
   */
  private handleAuthResponse(response: AuthResponse): void {
    // Guardar tokens
    localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);
    localStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);

    // Guardar datos del usuario
    localStorage.setItem(AUTH_STORAGE_KEYS.CURRENT_USER, JSON.stringify(response.user));

    // Actualizar estado
    this.authStateSubject.next({
      isAuthenticated: true,
      user: response.user,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken
    });
  }

  /**
   * Guardar solo el access token (usado en refresh)
   */
  private saveAccessToken(accessToken: string): void {
    localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, accessToken);

    // Actualizar estado manteniendo usuario y refresh token
    const currentState = this.authStateSubject.value;
    this.authStateSubject.next({
      ...currentState,
      accessToken
    });
  }

  /**
   * Limpiar todos los datos de autenticación
   */
  private clearAuthData(): void {
    // Limpiar localStorage
    localStorage.removeItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(AUTH_STORAGE_KEYS.CURRENT_USER);

    // Actualizar estado
    this.authStateSubject.next({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null
    });
  }

  /**
   * Cargar estado de autenticación desde localStorage
   */
  private loadAuthState(): AuthState {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    const user = this.getCurrentUser();

    return {
      isAuthenticated: this.isAuthenticated(),
      user,
      accessToken,
      refreshToken
    };
  }

  /**
   * Crear headers de autenticación
   */
  private createAuthHeaders(): HttpHeaders {
    const token = this.getAccessToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }
}
