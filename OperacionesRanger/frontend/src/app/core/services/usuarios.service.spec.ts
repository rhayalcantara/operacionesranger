import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UsuariosService, Usuario, UsuariosPaginatedResponse } from './usuarios.service';
import { environment } from '../../../environments/environment';

describe('UsuariosService', () => {
  let service: UsuariosService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiBaseUrl}/usuarios`;

  const mockUsuario: Usuario = {
    id: 1,
    username: 'admin',
    email: 'admin@test.com',
    nombre_completo: 'Admin User',
    rol: 'ADMIN',
    activo: true,
    ultimo_acceso: null,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  };

  const mockResponse: UsuariosPaginatedResponse = {
    data: [mockUsuario],
    total: 1,
    page: 1,
    pageSize: 10,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UsuariosService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UsuariosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============================================================================
  // getAll
  // ============================================================================

  describe('getAll()', () => {
    it('should GET usuarios without filters', () => {
      service.getAll().subscribe((resp) => {
        expect(resp.data.length).toBe(1);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should pass pagination and search params', () => {
      service.getAll({ page: 2, pageSize: 20, search: 'admin' }).subscribe();

      const req = httpMock.expectOne((r) => r.url === apiUrl);
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('pageSize')).toBe('20');
      expect(req.request.params.get('search')).toBe('admin');
      req.flush(mockResponse);
    });
  });

  // ============================================================================
  // getById
  // ============================================================================

  describe('getById()', () => {
    it('should GET usuario by ID', () => {
      service.getById(1).subscribe((u) => {
        expect(u.username).toBe('admin');
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUsuario);
    });
  });

  // ============================================================================
  // create / update / delete
  // ============================================================================

  describe('create()', () => {
    it('should POST new usuario', () => {
      const newData = {
        username: 'nuevo',
        password: 'Pass1234!',
        email: 'nuevo@test.com',
        nombre_completo: 'Nuevo User',
        rol: 'SUPERVISOR' as const,
        activo: true,
      };

      service.create(newData).subscribe((created) => {
        expect(created.id).toBe(2);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newData);
      req.flush({ ...mockUsuario, id: 2, username: 'nuevo' });
    });
  });

  describe('update()', () => {
    it('should PUT updated usuario', () => {
      const updates = { email: 'updated@test.com', nombre_completo: 'Updated', rol: 'ADMIN' as const, activo: true };

      service.update(1, updates).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updates);
      req.flush({ ...mockUsuario, email: 'updated@test.com' });
    });
  });

  describe('delete()', () => {
    it('should DELETE usuario', () => {
      service.delete(1).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  // ============================================================================
  // resetPassword
  // ============================================================================

  describe('resetPassword()', () => {
    it('should POST to reset-password endpoint', () => {
      service.resetPassword(1).subscribe((resp) => {
        expect(resp.temporaryPassword).toBe('TempPass123');
        expect(resp.message).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiUrl}/1/reset-password`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush({ temporaryPassword: 'TempPass123', message: 'Password reset' });
    });
  });

  // ============================================================================
  // validarUsernameUnico / validarEmailUnico
  // ============================================================================

  describe('validarUsernameUnico()', () => {
    it('should GET validar/username with username param', () => {
      service.validarUsernameUnico('admin').subscribe();

      const req = httpMock.expectOne((r) => r.url === `${apiUrl}/validar/username`);
      expect(req.request.params.get('username')).toBe('admin');
      req.flush(true);
    });

    it('should pass excludeId when provided', () => {
      service.validarUsernameUnico('admin', 5).subscribe();

      const req = httpMock.expectOne((r) => r.url === `${apiUrl}/validar/username`);
      expect(req.request.params.get('excludeId')).toBe('5');
      req.flush(true);
    });
  });

  describe('validarEmailUnico()', () => {
    it('should GET validar/email with email param', () => {
      service.validarEmailUnico('test@test.com').subscribe();

      const req = httpMock.expectOne((r) => r.url === `${apiUrl}/validar/email`);
      expect(req.request.params.get('email')).toBe('test@test.com');
      req.flush(false);
    });

    it('should pass excludeId when provided', () => {
      service.validarEmailUnico('test@test.com', 3).subscribe();

      const req = httpMock.expectOne((r) => r.url === `${apiUrl}/validar/email`);
      expect(req.request.params.get('excludeId')).toBe('3');
      req.flush(true);
    });
  });

  // ============================================================================
  // countByRol
  // ============================================================================

  describe('countByRol()', () => {
    it('should GET count for a specific rol', () => {
      service.countByRol('ADMIN').subscribe((count) => {
        expect(count).toBe(3);
      });

      const req = httpMock.expectOne(`${apiUrl}/count/rol/ADMIN`);
      expect(req.request.method).toBe('GET');
      req.flush(3);
    });
  });
});
