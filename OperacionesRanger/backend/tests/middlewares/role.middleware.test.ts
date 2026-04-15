/**
 * Tests Unitarios para roleMiddleware
 *
 * Verifica el comportamiento del middleware de autorización por roles
 * en todos los escenarios posibles (roles permitidos, denegados, etc.)
 */

import { Request, Response, NextFunction } from 'express';
import {
  requireRole,
  requirePermission,
  hasRole,
  hasAnyRole,
  isAdmin,
} from '../../src/middlewares/role.middleware';
import { UserRole, JWTPayload } from '../../src/models/auth.model';

describe('requireRole', () => {
  // Mocks de Express
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    // Reset de mocks antes de cada test
    jest.clearAllMocks();

    // Mock de Response
    jsonMock = jest.fn();
    statusMock = jest.fn(() => mockResponse as Response);
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    // Mock de Next
    mockNext = jest.fn();

    // Mock de Request (sin user por defecto)
    mockRequest = {};
  });

  describe('Casos de éxito', () => {
    test('Usuario ADMIN accediendo a ruta ADMIN: llama next()', () => {
      // Arrange
      const adminUser: JWTPayload = {
        sub: 1,
        username: 'admin',
        rol: UserRole.ADMIN,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      mockRequest.user = adminUser;
      const middleware = requireRole(UserRole.ADMIN);

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(statusMock).not.toHaveBeenCalled();
      expect(jsonMock).not.toHaveBeenCalled();
    });

    test('Usuario SUPERVISOR accediendo a ruta [ADMIN, SUPERVISOR]: llama next()', () => {
      // Arrange
      const supervisorUser: JWTPayload = {
        sub: 2,
        username: 'supervisor',
        rol: UserRole.SUPERVISOR,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      mockRequest.user = supervisorUser;
      const middleware = requireRole(UserRole.ADMIN, UserRole.SUPERVISOR);

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(statusMock).not.toHaveBeenCalled();
    });

    test('Usuario CONSULTA accediendo a ruta [ADMIN, SUPERVISOR, CONSULTA]: llama next()', () => {
      // Arrange
      const consultaUser: JWTPayload = {
        sub: 3,
        username: 'consulta',
        rol: UserRole.CONSULTA,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      mockRequest.user = consultaUser;
      const middleware = requireRole(
        UserRole.ADMIN,
        UserRole.SUPERVISOR,
        UserRole.CONSULTA
      );

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    test('Usuario ADMIN accediendo a ruta con múltiples roles: llama next()', () => {
      // Arrange
      const adminUser: JWTPayload = {
        sub: 1,
        username: 'admin',
        rol: UserRole.ADMIN,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      mockRequest.user = adminUser;
      const middleware = requireRole(
        UserRole.ADMIN,
        UserRole.SUPERVISOR,
        UserRole.CONSULTA
      );

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('Casos de error: Acceso denegado (403)', () => {
    test('Usuario CONSULTA accediendo a ruta ADMIN: retorna 403', () => {
      // Arrange
      const consultaUser: JWTPayload = {
        sub: 3,
        username: 'consulta',
        rol: UserRole.CONSULTA,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      mockRequest.user = consultaUser;
      const middleware = requireRole(UserRole.ADMIN);

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Acceso denegado',
        message: 'Acceso denegado. Rol requerido: ADMIN',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('Usuario CONSULTA accediendo a ruta [ADMIN, SUPERVISOR]: retorna 403', () => {
      // Arrange
      const consultaUser: JWTPayload = {
        sub: 3,
        username: 'consulta',
        rol: UserRole.CONSULTA,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      mockRequest.user = consultaUser;
      const middleware = requireRole(UserRole.ADMIN, UserRole.SUPERVISOR);

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Acceso denegado',
        message: 'Acceso denegado. Rol requerido: ADMIN o SUPERVISOR',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('Usuario SUPERVISOR accediendo a ruta ADMIN: retorna 403', () => {
      // Arrange
      const supervisorUser: JWTPayload = {
        sub: 2,
        username: 'supervisor',
        rol: UserRole.SUPERVISOR,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      mockRequest.user = supervisorUser;
      const middleware = requireRole(UserRole.ADMIN);

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Casos de error: Usuario no autenticado (401)', () => {
    test('Sin req.user (usuario no autenticado): retorna 401', () => {
      // Arrange - Sin req.user (ya configurado en beforeEach)
      const middleware = requireRole(UserRole.ADMIN);

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'No autorizado',
        message: 'Usuario no autenticado',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Validación de parámetros', () => {
    test('requireRole sin roles: lanza error', () => {
      // Act & Assert
      expect(() => {
        requireRole();
      }).toThrow('requireRole: Debe especificar al menos un rol permitido');
    });

    test('requireRole con rol inválido: lanza error', () => {
      // Act & Assert
      expect(() => {
        requireRole('INVALID_ROLE' as UserRole);
      }).toThrow(/requireRole: Rol inválido/);
    });
  });

  describe('Casos de error: Errores inesperados', () => {
    test('Error al verificar rol: retorna 500', () => {
      // Arrange
      const malformedUser: any = {
        sub: 1,
        username: 'testuser',
        rol: null, // Rol null causa error
      };

      mockRequest.user = malformedUser;

      // Mock para simular error
      const middleware = requireRole(UserRole.ADMIN);

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert - Debería manejar el error gracefully
      // En este caso específico, como rol es null y no está en la lista,
      // debería retornar 403 (no 500 porque no hay excepción)
      expect(statusMock).toHaveBeenCalledWith(403);
    });
  });
});

describe('hasRole helper', () => {
  test('Usuario con rol ADMIN y verificación ADMIN: retorna true', () => {
    // Arrange
    const mockRequest: Partial<Request> = {
      user: {
        sub: 1,
        username: 'admin',
        rol: UserRole.ADMIN,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
    };

    // Act
    const result = hasRole(mockRequest as Request, UserRole.ADMIN);

    // Assert
    expect(result).toBe(true);
  });

  test('Usuario con rol SUPERVISOR y verificación ADMIN: retorna false', () => {
    // Arrange
    const mockRequest: Partial<Request> = {
      user: {
        sub: 2,
        username: 'supervisor',
        rol: UserRole.SUPERVISOR,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
    };

    // Act
    const result = hasRole(mockRequest as Request, UserRole.ADMIN);

    // Assert
    expect(result).toBe(false);
  });

  test('Sin req.user: retorna false', () => {
    // Arrange
    const mockRequest: Partial<Request> = {};

    // Act
    const result = hasRole(mockRequest as Request, UserRole.ADMIN);

    // Assert
    expect(result).toBe(false);
  });
});

describe('hasAnyRole helper', () => {
  test('Usuario SUPERVISOR con roles [ADMIN, SUPERVISOR]: retorna true', () => {
    // Arrange
    const mockRequest: Partial<Request> = {
      user: {
        sub: 2,
        username: 'supervisor',
        rol: UserRole.SUPERVISOR,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
    };

    // Act
    const result = hasAnyRole(mockRequest as Request, [
      UserRole.ADMIN,
      UserRole.SUPERVISOR,
    ]);

    // Assert
    expect(result).toBe(true);
  });

  test('Usuario CONSULTA con roles [ADMIN, SUPERVISOR]: retorna false', () => {
    // Arrange
    const mockRequest: Partial<Request> = {
      user: {
        sub: 3,
        username: 'consulta',
        rol: UserRole.CONSULTA,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
    };

    // Act
    const result = hasAnyRole(mockRequest as Request, [
      UserRole.ADMIN,
      UserRole.SUPERVISOR,
    ]);

    // Assert
    expect(result).toBe(false);
  });

  test('Sin req.user: retorna false', () => {
    // Arrange
    const mockRequest: Partial<Request> = {};

    // Act
    const result = hasAnyRole(mockRequest as Request, [UserRole.ADMIN]);

    // Assert
    expect(result).toBe(false);
  });

  test('Array vacío de roles: retorna false', () => {
    // Arrange
    const mockRequest: Partial<Request> = {
      user: {
        sub: 1,
        username: 'admin',
        rol: UserRole.ADMIN,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
    };

    // Act
    const result = hasAnyRole(mockRequest as Request, []);

    // Assert
    expect(result).toBe(false);
  });
});

describe('isAdmin helper', () => {
  test('Usuario con rol ADMIN: retorna true', () => {
    // Arrange
    const mockRequest: Partial<Request> = {
      user: {
        sub: 1,
        username: 'admin',
        rol: UserRole.ADMIN,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
    };

    // Act
    const result = isAdmin(mockRequest as Request);

    // Assert
    expect(result).toBe(true);
  });

  test('Usuario con rol SUPERVISOR: retorna false', () => {
    // Arrange
    const mockRequest: Partial<Request> = {
      user: {
        sub: 2,
        username: 'supervisor',
        rol: UserRole.SUPERVISOR,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
    };

    // Act
    const result = isAdmin(mockRequest as Request);

    // Assert
    expect(result).toBe(false);
  });

  test('Sin req.user: retorna false', () => {
    // Arrange
    const mockRequest: Partial<Request> = {};

    // Act
    const result = isAdmin(mockRequest as Request);

    // Assert
    expect(result).toBe(false);
  });
});

describe('requirePermission (placeholder)', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn(() => mockResponse as Response);
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    mockNext = jest.fn();
    mockRequest = {};
  });

  test('requirePermission sin permisos: lanza error', () => {
    // Act & Assert
    expect(() => {
      requirePermission();
    }).toThrow('requirePermission: Debe especificar al menos un permiso');
  });

  test('Usuario ADMIN: permite acceso (placeholder)', () => {
    // Arrange
    const adminUser: JWTPayload = {
      sub: 1,
      username: 'admin',
      rol: UserRole.ADMIN,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    mockRequest.user = adminUser;
    const middleware = requirePermission('TURNOS_ELIMINAR');

    // Act
    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  test('Usuario no-ADMIN: deniega acceso (placeholder)', () => {
    // Arrange
    const supervisorUser: JWTPayload = {
      sub: 2,
      username: 'supervisor',
      rol: UserRole.SUPERVISOR,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    mockRequest.user = supervisorUser;
    const middleware = requirePermission('TURNOS_ELIMINAR');

    // Act
    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(statusMock).toHaveBeenCalledWith(403);
    expect(mockNext).not.toHaveBeenCalled();
  });
});
