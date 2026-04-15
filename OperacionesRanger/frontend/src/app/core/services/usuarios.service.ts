import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserRole } from '../models/auth.model';

/**
 * Interface de Usuario (completa)
 */
export interface Usuario {
  id: number;
  username: string;
  email: string;
  nombre_completo: string;
  rol: UserRole;
  activo: boolean;
  ultimo_acceso: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Request para crear usuario (incluye password)
 */
export interface CreateUsuarioRequest {
  username: string;
  password: string;
  email: string;
  nombre_completo: string;
  rol: UserRole;
  activo: boolean;
}

/**
 * Request para actualizar usuario (NO incluye password)
 */
export interface UpdateUsuarioRequest {
  email: string;
  nombre_completo: string;
  rol: UserRole;
  activo: boolean;
}

/**
 * Respuesta de reset password
 */
export interface ResetPasswordResponse {
  temporaryPassword: string;
  message: string;
}

/**
 * Filtros para consulta de usuarios
 */
export interface UsuariosFilters {
  page?: number;
  pageSize?: number;
  search?: string;
}

/**
 * Respuesta paginada de usuarios
 */
export interface UsuariosPaginatedResponse {
  data: Usuario[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Servicio de gestión de usuarios del sistema
 * Maneja CRUD completo + reset password
 */
@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private readonly baseUrl = `${environment.apiBaseUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los usuarios con paginación y búsqueda
   */
  getAll(filters: UsuariosFilters = {}): Observable<UsuariosPaginatedResponse> {
    let params = new HttpParams();

    if (filters.page) {
      params = params.set('page', filters.page.toString());
    }
    if (filters.pageSize) {
      params = params.set('pageSize', filters.pageSize.toString());
    }
    if (filters.search) {
      params = params.set('search', filters.search);
    }

    return this.http.get<UsuariosPaginatedResponse>(this.baseUrl, { params });
  }

  /**
   * Obtener usuario por ID
   */
  getById(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.baseUrl}/${id}`);
  }

  /**
   * Crear nuevo usuario
   */
  create(usuario: CreateUsuarioRequest): Observable<Usuario> {
    return this.http.post<Usuario>(this.baseUrl, usuario);
  }

  /**
   * Actualizar usuario existente (sin password)
   */
  update(id: number, usuario: UpdateUsuarioRequest): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.baseUrl}/${id}`, usuario);
  }

  /**
   * Eliminar usuario (soft delete)
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Reset password de usuario (genera password temporal)
   */
  resetPassword(id: number): Observable<ResetPasswordResponse> {
    return this.http.post<ResetPasswordResponse>(
      `${this.baseUrl}/${id}/reset-password`,
      {}
    );
  }

  /**
   * Validar si username es único (excluyendo un ID opcional)
   */
  validarUsernameUnico(username: string, excludeId?: number): Observable<boolean> {
    let params = new HttpParams().set('username', username);
    if (excludeId) {
      params = params.set('excludeId', excludeId.toString());
    }

    return this.http.get<boolean>(`${this.baseUrl}/validar/username`, { params });
  }

  /**
   * Validar si email es único (excluyendo un ID opcional)
   */
  validarEmailUnico(email: string, excludeId?: number): Observable<boolean> {
    let params = new HttpParams().set('email', email);
    if (excludeId) {
      params = params.set('excludeId', excludeId.toString());
    }

    return this.http.get<boolean>(`${this.baseUrl}/validar/email`, { params });
  }

  /**
   * Contar cantidad de usuarios por rol
   */
  countByRol(rol: UserRole): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/count/rol/${rol}`);
  }
}
