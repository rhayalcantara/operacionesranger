/**
 * Tests Unitarios: Audit Middleware
 *
 * Suite de pruebas para el middleware de auditoría que registra
 * operaciones CRUD en la tabla sys_auditoria.
 */

import { Request, Response, NextFunction } from 'express';
import { auditMiddleware, sanitizeAuditData, getAuditAction, getClientIp, getEntityId } from '../../src/middlewares/audit.middleware';
import { env } from '../../src/config/env';
import { UserRole } from '../../src/models/auth.model';

// Mock de logger
jest.mock('../../src/config/logger', () => ({
  __esModule: true,
  default: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  sanitize: jest.fn((data) => data),
}));

// Mock de database
jest.mock('../../src/config/database', () => {
  const pool = {
    query: jest.fn(),
    escapeId: jest.fn((id: string) => `\`${id}\``),
  };
  return {
    turnosPool: pool,
    getTurnosPool: () => pool,
  };
});

// Get mock references after jest.mock hoisting
import { getTurnosPool } from '../../src/config/database';
const mockPool = getTurnosPool() as any;
const mockQuery = mockPool.query as jest.Mock;

// Mock de env
jest.mock('../../src/config/env', () => ({
  env: {
    audit: {
      enabled: true,
    },
  },
}));

describe('Audit Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock request
    req = {
      method: 'POST',
      params: { id: '123' },
      body: { nombre: 'Test', codigo: 'TST' },
      user: { sub: 1, username: 'testuser', rol: UserRole.ADMIN, iat: Date.now(), exp: Date.now() + 3600 },
      ip: '192.168.1.1',
      headers: {},
      socket: { remoteAddress: '192.168.1.1' } as any,
    };

    // Mock response
    jsonMock = jest.fn();
    res = {
      json: jsonMock,
      locals: {},
    };

    // Mock next
    next = jest.fn();

    // Reset env mock
    (env.audit as any).enabled = true;
  });

  describe('sanitizeAuditData', () => {
    it('should remove password fields from data', () => {
      const data = {
        username: 'testuser',
        password: 'secret123',
        email: 'test@example.com',
      };

      const sanitized = sanitizeAuditData(data);

      expect(sanitized).toEqual({
        username: 'testuser',
        email: 'test@example.com',
      });
      expect(sanitized.password).toBeUndefined();
    });

    it('should remove password_hash fields from data', () => {
      const data = {
        id: 1,
        username: 'testuser',
        password_hash: '$2a$10$hashedpassword',
      };

      const sanitized = sanitizeAuditData(data);

      expect(sanitized).toEqual({
        id: 1,
        username: 'testuser',
      });
      expect(sanitized.password_hash).toBeUndefined();
    });

    it('should remove token fields from data', () => {
      const data = {
        id: 1,
        username: 'testuser',
        token: 'jwt.token.here',
        refreshToken: 'refresh.token.here',
      };

      const sanitized = sanitizeAuditData(data);

      expect(sanitized).toEqual({
        id: 1,
        username: 'testuser',
      });
      expect(sanitized.token).toBeUndefined();
      expect(sanitized.refreshToken).toBeUndefined();
    });

    it('should recursively sanitize nested objects', () => {
      const data = {
        user: {
          username: 'testuser',
          password: 'secret123',
          profile: {
            name: 'Test User',
            credentials: {
              password: 'nested_secret',
              apiKey: 'api123',
            },
          },
        },
      };

      const sanitized = sanitizeAuditData(data);

      expect(sanitized).toEqual({
        user: {
          username: 'testuser',
          profile: {
            name: 'Test User',
            credentials: {
              apiKey: 'api123',
            },
          },
        },
      });
    });

    it('should handle arrays of objects', () => {
      const data = {
        users: [
          { username: 'user1', password: 'pass1' },
          { username: 'user2', password: 'pass2' },
        ],
      };

      const sanitized = sanitizeAuditData(data);

      expect(sanitized).toEqual({
        users: [
          { username: 'user1' },
          { username: 'user2' },
        ],
      });
    });
  });

  describe('getAuditAction', () => {
    it('should return CREATE for POST method', () => {
      expect(getAuditAction('POST')).toBe('CREATE');
      expect(getAuditAction('post')).toBe('CREATE');
    });

    it('should return UPDATE for PUT method', () => {
      expect(getAuditAction('PUT')).toBe('UPDATE');
      expect(getAuditAction('put')).toBe('UPDATE');
    });

    it('should return UPDATE for PATCH method', () => {
      expect(getAuditAction('PATCH')).toBe('UPDATE');
      expect(getAuditAction('patch')).toBe('UPDATE');
    });

    it('should return DELETE for DELETE method', () => {
      expect(getAuditAction('DELETE')).toBe('DELETE');
      expect(getAuditAction('delete')).toBe('DELETE');
    });

    it('should return null for GET method', () => {
      expect(getAuditAction('GET')).toBeNull();
    });

    it('should return null for HEAD method', () => {
      expect(getAuditAction('HEAD')).toBeNull();
    });

    it('should return null for OPTIONS method', () => {
      expect(getAuditAction('OPTIONS')).toBeNull();
    });
  });

  describe('getClientIp', () => {
    it('should extract IP from x-forwarded-for header', () => {
      req.headers!['x-forwarded-for'] = '203.0.113.195, 70.41.3.18';

      const ip = getClientIp(req as Request);

      expect(ip).toBe('203.0.113.195');
    });

    it('should extract IP from x-real-ip header', () => {
      req.headers!['x-real-ip'] = '203.0.113.195';

      const ip = getClientIp(req as Request);

      expect(ip).toBe('203.0.113.195');
    });

    it('should use req.ip if headers not present', () => {
      (req as any).ip = '192.168.1.100';

      const ip = getClientIp(req as Request);

      expect(ip).toBe('192.168.1.100');
    });

    it('should use req.socket.remoteAddress as fallback', () => {
      delete (req as any).ip;
      delete req.headers!['x-forwarded-for'];
      delete req.headers!['x-real-ip'];

      const ip = getClientIp(req as Request);

      expect(ip).toBe('192.168.1.1');
    });
  });

  describe('getEntityId', () => {
    it('should extract entity ID from req.params.id', () => {
      req.params = { id: '456' };

      const id = getEntityId(req as Request, res as Response);

      expect(id).toBe(456);
    });

    it('should extract entity ID from req.body.id if params.id not present', () => {
      req.params = {};
      req.body = { id: 789 };

      const id = getEntityId(req as Request, res as Response);

      expect(id).toBe(789);
    });

    it('should extract entity ID from res.locals.entityId', () => {
      req.params = {};
      req.body = {};
      res.locals!.entityId = 999;

      const id = getEntityId(req as Request, res as Response);

      expect(id).toBe(999);
    });

    it('should return null if no entity ID found', () => {
      req.params = {};
      req.body = {};
      res.locals = {};

      const id = getEntityId(req as Request, res as Response);

      expect(id).toBeNull();
    });

    it('should return null if ID is not a valid number', () => {
      req.params = { id: 'not-a-number' };

      const id = getEntityId(req as Request, res as Response);

      expect(id).toBeNull();
    });
  });

  describe('auditMiddleware - Core Functionality', () => {
    it('should skip audit if AUDIT_ENABLED is false', () => {
      (env.audit as any).enabled = false;

      const middleware = auditMiddleware('clientes');
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should skip audit if user is not authenticated', () => {
      delete req.user;

      const middleware = auditMiddleware('clientes');
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should skip audit for GET method', () => {
      req.method = 'GET';

      const middleware = auditMiddleware('clientes');
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should register audit for POST method (CREATE)', async () => {
      (mockQuery as jest.Mock).mockResolvedValueOnce([{ affectedRows: 1 }]);

      const middleware = auditMiddleware('clientes');
      middleware(req as Request, res as Response, next);

      // Trigger res.json to execute audit insert
      res.json!({ id: 123, nombre: 'Test Cliente' });

      // Wait for async audit insert
      await new Promise(process.nextTick);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO ot_sys_auditoria'),
        expect.arrayContaining([
          1, // user_id
          'CREATE', // accion
          'clientes', // entidad
          123, // entidad_id
          '192.168.1.1', // ip_address
          null, // datos_anteriores (CREATE doesn't have previous data)
          expect.any(String), // datos_nuevos (JSON string)
        ])
      );
    });

    it('should register audit for PUT method (UPDATE)', async () => {
      req.method = 'PUT';
      (mockQuery as jest.Mock)
        .mockResolvedValueOnce([
          [{ id: 123, nombre: 'Old Name', codigo: 'OLD' }]
        ]) // fetchPreviousData
        .mockResolvedValueOnce([{ affectedRows: 1 }]); // audit insert

      const middleware = auditMiddleware('clientes');
      await middleware(req as Request, res as Response, next);

      // Trigger res.json
      res.json!({ id: 123, nombre: 'Updated Name' });

      // Wait for async operations
      await new Promise(process.nextTick);

      // Verify fetchPreviousData was called
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM'),
        [123]
      );

      // Verify audit insert was called
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO ot_sys_auditoria'),
        expect.arrayContaining([
          1, // user_id
          'UPDATE', // accion
          'clientes', // entidad
          123, // entidad_id
          '192.168.1.1', // ip_address
          expect.any(String), // datos_anteriores
          expect.any(String), // datos_nuevos
        ])
      );
    });

    it('should register audit for DELETE method', async () => {
      req.method = 'DELETE';
      (mockQuery as jest.Mock)
        .mockResolvedValueOnce([
          [{ id: 123, nombre: 'Cliente to Delete', codigo: 'DEL' }]
        ]) // fetchPreviousData
        .mockResolvedValueOnce([{ affectedRows: 1 }]); // audit insert

      const middleware = auditMiddleware('clientes');
      await middleware(req as Request, res as Response, next);

      // Trigger res.json
      res.json!({ message: 'Cliente eliminado' });

      // Wait for async operations
      await new Promise(process.nextTick);

      // Verify audit insert includes previous data for DELETE
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO ot_sys_auditoria'),
        expect.arrayContaining([
          1, // user_id
          'DELETE', // accion
          'clientes', // entidad
          123, // entidad_id
          '192.168.1.1', // ip_address
          expect.any(String), // datos_anteriores (should have old data)
          null, // datos_nuevos (DELETE doesn't have new data)
        ])
      );
    });

    it('should handle audit insert errors gracefully without breaking request', async () => {
      (mockQuery as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      const middleware = auditMiddleware('clientes');
      middleware(req as Request, res as Response, next);

      // Trigger res.json
      res.json!({ id: 123, nombre: 'Test Cliente' });

      // Wait for async operation
      await new Promise(process.nextTick);

      // Verify next was called and response was sent despite audit error
      expect(next).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({ id: 123, nombre: 'Test Cliente' });
    });

    it('should work with different entity names', async () => {
      (mockQuery as jest.Mock).mockResolvedValueOnce([{ affectedRows: 1 }]);

      const middleware = auditMiddleware('turnos');
      middleware(req as Request, res as Response, next);

      res.json!({ id: 456 });
      await new Promise(process.nextTick);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO ot_sys_auditoria'),
        expect.arrayContaining([
          expect.anything(),
          expect.anything(),
          'turnos', // entity name
          expect.anything(),
          expect.anything(),
          expect.anything(),
          expect.anything(),
        ])
      );
    });
  });

  describe('auditMiddleware - Data Sanitization', () => {
    it('should sanitize passwords from audit data', async () => {
      req.body = {
        username: 'newuser',
        password: 'supersecret123',
        email: 'user@example.com',
      };

      (mockQuery as jest.Mock).mockResolvedValueOnce([{ affectedRows: 1 }]);

      const middleware = auditMiddleware('sys_usuarios');
      middleware(req as Request, res as Response, next);

      res.json!({ id: 10, username: 'newuser', email: 'user@example.com' });
      await new Promise(process.nextTick);

      const auditCall = (mockQuery as jest.Mock).mock.calls[0];
      const datosNuevos = JSON.parse(auditCall[1][6]); // datos_nuevos

      expect(datosNuevos.password).toBeUndefined();
      expect(datosNuevos.username).toBe('newuser');
      expect(datosNuevos.email).toBe('user@example.com');
    });

    it('should sanitize tokens from audit data', async () => {
      req.body = {
        userId: 1,
        token: 'jwt.token.here',
        refreshToken: 'refresh.token.here',
      };

      (mockQuery as jest.Mock).mockResolvedValueOnce([{ affectedRows: 1 }]);

      const middleware = auditMiddleware('sys_sessions');
      middleware(req as Request, res as Response, next);

      res.json!({ id: 5, userId: 1 });
      await new Promise(process.nextTick);

      const auditCall = (mockQuery as jest.Mock).mock.calls[0];
      const datosNuevos = JSON.parse(auditCall[1][6]);

      expect(datosNuevos.token).toBeUndefined();
      expect(datosNuevos.refreshToken).toBeUndefined();
      expect(datosNuevos.userId).toBe(1);
    });
  });
});
