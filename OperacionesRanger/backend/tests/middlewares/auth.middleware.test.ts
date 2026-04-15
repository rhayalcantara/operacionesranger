/**
 * Tests Unitarios para authMiddleware
 *
 * Verifica el comportamiento del middleware de autenticación JWT
 * en todos los escenarios posibles (token válido, inválido, expirado, etc.)
 */

import { Request, Response, NextFunction } from 'express';
import { authMiddleware, optionalAuthMiddleware } from '../../src/middlewares/auth.middleware';
import * as jwtService from '../../src/services/jwt.service';
import { UserRole } from '../../src/models/auth.model';

// Mock de JWTService
jest.mock('../../src/services/jwt.service');

describe('authMiddleware', () => {
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

    // Mock de Request (sin headers por defecto)
    mockRequest = {
      headers: {},
    };
  });

  describe('Casos de éxito', () => {
    test('Token válido: agrega req.user y llama next()', () => {
      // Arrange
      const validToken = 'valid.jwt.token';
      const mockPayload = {
        sub: 123,
        username: 'testuser',
        rol: UserRole.ADMIN,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      mockRequest.headers = {
        authorization: `Bearer ${validToken}`,
      };

      (jwtService.verifyAccessToken as jest.Mock).mockReturnValue(mockPayload);

      // Act
      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(jwtService.verifyAccessToken).toHaveBeenCalledWith(validToken);
      expect(mockRequest.user).toEqual(mockPayload);
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(statusMock).not.toHaveBeenCalled();
      expect(jsonMock).not.toHaveBeenCalled();
    });

    test('Token válido con espacios extras en header: funciona correctamente', () => {
      // Arrange
      const validToken = 'valid.jwt.token';
      const mockPayload = {
        sub: 456,
        username: 'supervisor',
        rol: UserRole.SUPERVISOR,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      // Header con espacios extras (no debería afectar)
      mockRequest.headers = {
        authorization: `Bearer ${validToken}`, // Solo un espacio es válido
      };

      (jwtService.verifyAccessToken as jest.Mock).mockReturnValue(mockPayload);

      // Act
      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockRequest.user).toEqual(mockPayload);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('Casos de error: Sin token', () => {
    test('Sin header Authorization: retorna 401', () => {
      // Arrange - Sin header (ya configurado en beforeEach)

      // Act
      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'No autorizado',
        message: 'Token de autenticación no proporcionado',
      });
      expect(mockNext).not.toHaveBeenCalled();
      expect(jwtService.verifyAccessToken).not.toHaveBeenCalled();
    });
  });

  describe('Casos de error: Formato inválido', () => {
    test('Header sin "Bearer" prefix: retorna 401', () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'InvalidFormat eyJhbGc...', // No usa "Bearer"
      };

      // Act
      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'No autorizado',
        message: 'Formato de token inválido. Use: Bearer <token>',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('Header solo con "Bearer" sin token: retorna 401', () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Bearer', // Solo la palabra Bearer
      };

      // Act
      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'No autorizado',
        message: 'Formato de token inválido. Use: Bearer <token>',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('Header con token vacío: retorna 401', () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Bearer ', // Bearer con espacio pero sin token
      };

      // Act
      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'No autorizado',
        message: 'Token vacío',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('Header con solo espacios como token: retorna 401', () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Bearer    ', // Solo espacios (múltiples partes)
      };

      // Act
      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(401);
      // Con múltiples espacios, split genera más de 2 partes, por lo que detecta formato inválido
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'No autorizado',
        message: 'Formato de token inválido. Use: Bearer <token>',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Casos de error: Token inválido o expirado', () => {
    test('Token expirado: retorna 401', () => {
      // Arrange
      const expiredToken = 'expired.jwt.token';
      mockRequest.headers = {
        authorization: `Bearer ${expiredToken}`,
      };

      // Mock: JWTService retorna null (token inválido/expirado)
      (jwtService.verifyAccessToken as jest.Mock).mockReturnValue(null);

      // Act
      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(jwtService.verifyAccessToken).toHaveBeenCalledWith(expiredToken);
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'No autorizado',
        message: 'Token inválido o expirado',
      });
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });

    test('Token con firma inválida: retorna 401', () => {
      // Arrange
      const invalidToken = 'invalid.signature.token';
      mockRequest.headers = {
        authorization: `Bearer ${invalidToken}`,
      };

      (jwtService.verifyAccessToken as jest.Mock).mockReturnValue(null);

      // Act
      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'No autorizado',
        message: 'Token inválido o expirado',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('Token malformado: retorna 401', () => {
      // Arrange
      const malformedToken = 'not.a.valid.jwt';
      mockRequest.headers = {
        authorization: `Bearer ${malformedToken}`,
      };

      (jwtService.verifyAccessToken as jest.Mock).mockReturnValue(null);

      // Act
      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'No autorizado',
        message: 'Token inválido o expirado',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Casos de error: Errores inesperados', () => {
    test('Error al verificar token: retorna 500', () => {
      // Arrange
      const token = 'some.token';
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      // Mock: JWTService lanza error inesperado
      (jwtService.verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      // Act
      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Error interno',
        message: 'Error al verificar token de autenticación',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});

describe('optionalAuthMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    mockResponse = {};
    mockNext = jest.fn();
    mockRequest = {
      headers: {},
    };
  });

  test('Sin header Authorization: continúa sin req.user', () => {
    // Arrange - Sin header

    // Act
    optionalAuthMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(mockRequest.user).toBeUndefined();
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(jwtService.verifyAccessToken).not.toHaveBeenCalled();
  });

  test('Token válido: agrega req.user y continúa', () => {
    // Arrange
    const validToken = 'valid.token';
    const mockPayload = {
      sub: 789,
      username: 'consulta',
      rol: UserRole.CONSULTA,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    mockRequest.headers = {
      authorization: `Bearer ${validToken}`,
    };

    (jwtService.verifyAccessToken as jest.Mock).mockReturnValue(mockPayload);

    // Act
    optionalAuthMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(jwtService.verifyAccessToken).toHaveBeenCalledWith(validToken);
    expect(mockRequest.user).toEqual(mockPayload);
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  test('Token inválido: continúa sin req.user (no falla)', () => {
    // Arrange
    const invalidToken = 'invalid.token';
    mockRequest.headers = {
      authorization: `Bearer ${invalidToken}`,
    };

    (jwtService.verifyAccessToken as jest.Mock).mockReturnValue(null);

    // Act
    optionalAuthMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(mockRequest.user).toBeUndefined();
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  test('Formato inválido del header: continúa sin req.user', () => {
    // Arrange
    mockRequest.headers = {
      authorization: 'InvalidFormat token',
    };

    // Act
    optionalAuthMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(mockRequest.user).toBeUndefined();
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(jwtService.verifyAccessToken).not.toHaveBeenCalled();
  });
});
