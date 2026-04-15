/**
 * Tests Unitarios - JWTService
 *
 * Pruebas para:
 * - Generación de access tokens
 * - Generación de refresh tokens
 * - Verificación de tokens
 */

import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeTokenWithoutVerification,
} from '../../src/services/jwt.service';
import { UserRole } from '../../src/models/auth.model';
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env';

describe('JWTService', () => {
  // ============================================================================
  // generateAccessToken()
  // ============================================================================

  describe('generateAccessToken', () => {
    it('debería generar access token válido', () => {
      const payload = {
        sub: 123,
        username: 'testuser',
        rol: UserRole.SUPERVISOR,
      };

      const token = generateAccessToken(payload);

      // Verificar que retorna un string
      expect(typeof token).toBe('string');

      // Verificar formato JWT (3 partes separadas por puntos)
      expect(token.split('.').length).toBe(3);
    });

    it('debería incluir todos los campos del payload', () => {
      const payload = {
        sub: 456,
        username: 'adminuser',
        rol: UserRole.ADMIN,
      };

      const token = generateAccessToken(payload);
      const decoded = decodeTokenWithoutVerification(token);

      expect(decoded.sub).toBe(456);
      expect(decoded.username).toBe('adminuser');
      expect(decoded.rol).toBe(UserRole.ADMIN);
    });

    it('debería generar tokens diferentes cada vez', (done) => {
      const payload = {
        sub: 789,
        username: 'user1',
        rol: UserRole.CONSULTA,
      };

      const token1 = generateAccessToken(payload);
      // Esperar 1 segundo para que iat sea diferente (JWT usa segundos)
      setTimeout(() => {
        const token2 = generateAccessToken(payload);
        expect(token1).not.toBe(token2);
        done();
      }, 1100);
    });

    it('debería rechazar payload sin sub', () => {
      const payload = {
        username: 'testuser',
        rol: UserRole.SUPERVISOR,
      } as any;

      expect(() => generateAccessToken(payload)).toThrow(
        'sub (user ID) es requerido'
      );
    });

    it('debería rechazar payload sin username', () => {
      const payload = {
        sub: 123,
        rol: UserRole.SUPERVISOR,
      } as any;

      expect(() => generateAccessToken(payload)).toThrow(
        'username es requerido'
      );
    });

    it('debería rechazar payload sin rol', () => {
      const payload = {
        sub: 123,
        username: 'testuser',
      } as any;

      expect(() => generateAccessToken(payload)).toThrow(
        'rol es requerido'
      );
    });

    it('debería incluir claim exp (expiration)', () => {
      const payload = {
        sub: 123,
        username: 'testuser',
        rol: UserRole.SUPERVISOR,
      };

      const token = generateAccessToken(payload);
      const decoded = decodeTokenWithoutVerification(token);

      expect(decoded.exp).toBeDefined();
      expect(typeof decoded.exp).toBe('number');
      expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it('debería incluir claim iat (issued at)', () => {
      const payload = {
        sub: 123,
        username: 'testuser',
        rol: UserRole.SUPERVISOR,
      };

      const token = generateAccessToken(payload);
      const decoded = decodeTokenWithoutVerification(token);

      expect(decoded.iat).toBeDefined();
      expect(typeof decoded.iat).toBe('number');
    });
  });

  // ============================================================================
  // verifyAccessToken()
  // ============================================================================

  describe('verifyAccessToken', () => {
    it('debería retornar payload para token válido', () => {
      const payload = {
        sub: 123,
        username: 'testuser',
        rol: UserRole.SUPERVISOR,
      };

      const token = generateAccessToken(payload);
      const verified = verifyAccessToken(token);

      expect(verified).not.toBeNull();
      expect(verified?.sub).toBe(123);
      expect(verified?.username).toBe('testuser');
      expect(verified?.rol).toBe(UserRole.SUPERVISOR);
    });

    it('debería retornar null para token inválido', () => {
      const invalidToken = 'not.a.valid.jwt.token';

      const verified = verifyAccessToken(invalidToken);
      expect(verified).toBeNull();
    });

    it('debería retornar null para token con firma incorrecta', () => {
      // Generar token con secret diferente
      const fakeToken = jwt.sign(
        { sub: 123, username: 'fake', rol: UserRole.ADMIN },
        'wrong_secret',
        { expiresIn: '15m' }
      );

      const verified = verifyAccessToken(fakeToken);
      expect(verified).toBeNull();
    });

    it('debería retornar null para token vacío', () => {
      const verified = verifyAccessToken('');
      expect(verified).toBeNull();
    });

    it('debería retornar null para string que no es JWT', () => {
      const notAToken = 'this_is_not_a_jwt_token_at_all';

      const verified = verifyAccessToken(notAToken);
      expect(verified).toBeNull();
    });

    it('debería retornar null para token expirado', (done) => {
      // Generar token con expiración inmediata
      const payload = {
        sub: 123,
        username: 'testuser',
        rol: UserRole.SUPERVISOR,
      };

      const expiredToken = jwt.sign(payload, env.security.jwtSecret, {
        expiresIn: '1ms', // Expira casi inmediatamente
      });

      // Esperar 100ms para asegurar expiración
      setTimeout(() => {
        const verified = verifyAccessToken(expiredToken);
        expect(verified).toBeNull();
        done();
      }, 100);
    });
  });

  // ============================================================================
  // generateRefreshToken()
  // ============================================================================

  describe('generateRefreshToken', () => {
    it('debería generar refresh token válido', () => {
      const token = generateRefreshToken();

      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });

    it('debería incluir type: refresh en payload', () => {
      const token = generateRefreshToken();
      const decoded = decodeTokenWithoutVerification(token);

      expect(decoded.type).toBe('refresh');
    });

    it('debería generar tokens diferentes cada vez', (done) => {
      const token1 = generateRefreshToken();
      // Esperar 1 segundo para que iat sea diferente (JWT usa segundos)
      setTimeout(() => {
        const token2 = generateRefreshToken();
        expect(token1).not.toBe(token2);
        done();
      }, 1100);
    });

    it('debería incluir claim exp', () => {
      const token = generateRefreshToken();
      const decoded = decodeTokenWithoutVerification(token);

      expect(decoded.exp).toBeDefined();
      expect(typeof decoded.exp).toBe('number');
    });
  });

  // ============================================================================
  // verifyRefreshToken()
  // ============================================================================

  describe('verifyRefreshToken', () => {
    it('debería retornar true para refresh token válido', () => {
      const token = generateRefreshToken();

      const isValid = verifyRefreshToken(token);
      expect(isValid).toBe(true);
    });

    it('debería retornar false para refresh token inválido', () => {
      const invalidToken = 'not.a.valid.jwt.token';

      const isValid = verifyRefreshToken(invalidToken);
      expect(isValid).toBe(false);
    });

    it('debería retornar false para access token (secret diferente)', () => {
      const accessToken = generateAccessToken({
        sub: 123,
        username: 'test',
        rol: UserRole.SUPERVISOR,
      });

      // Access token usa secret diferente, no debe validar como refresh
      const isValid = verifyRefreshToken(accessToken);
      expect(isValid).toBe(false);
    });

    it('debería retornar false para token vacío', () => {
      const isValid = verifyRefreshToken('');
      expect(isValid).toBe(false);
    });

    it('debería retornar false para token con firma incorrecta', () => {
      const fakeToken = jwt.sign({ type: 'refresh' }, 'wrong_secret', {
        expiresIn: '7d',
      });

      const isValid = verifyRefreshToken(fakeToken);
      expect(isValid).toBe(false);
    });
  });

  // ============================================================================
  // decodeTokenWithoutVerification()
  // ============================================================================

  describe('decodeTokenWithoutVerification', () => {
    it('debería decodificar access token sin verificar firma', () => {
      const payload = {
        sub: 123,
        username: 'testuser',
        rol: UserRole.ADMIN,
      };

      const token = generateAccessToken(payload);
      const decoded = decodeTokenWithoutVerification(token);

      expect(decoded).not.toBeNull();
      expect(decoded.sub).toBe(123);
      expect(decoded.username).toBe('testuser');
    });

    it('debería decodificar refresh token sin verificar firma', () => {
      const token = generateRefreshToken();
      const decoded = decodeTokenWithoutVerification(token);

      expect(decoded).not.toBeNull();
      expect(decoded.type).toBe('refresh');
    });

    it('debería retornar null para string inválido', () => {
      const decoded = decodeTokenWithoutVerification('not_a_jwt');
      expect(decoded).toBeNull();
    });

    it('debería decodificar token expirado', () => {
      const expiredToken = jwt.sign(
        { sub: 123, username: 'test', rol: UserRole.SUPERVISOR },
        env.security.jwtSecret,
        { expiresIn: '0s' }
      );

      // Decode debe funcionar incluso si está expirado
      const decoded = decodeTokenWithoutVerification(expiredToken);
      expect(decoded).not.toBeNull();
      expect(decoded.sub).toBe(123);
    });
  });

  // ============================================================================
  // Tests de Integración
  // ============================================================================

  describe('Integración Access + Refresh Tokens', () => {
    it('debería generar y verificar ambos tipos de tokens', () => {
      // Generar access token
      const accessPayload = {
        sub: 456,
        username: 'integrationuser',
        rol: UserRole.SUPERVISOR,
      };
      const accessToken = generateAccessToken(accessPayload);

      // Generar refresh token
      const refreshToken = generateRefreshToken();

      // Verificar access token
      const verifiedAccess = verifyAccessToken(accessToken);
      expect(verifiedAccess).not.toBeNull();
      expect(verifiedAccess?.sub).toBe(456);

      // Verificar refresh token
      const verifiedRefresh = verifyRefreshToken(refreshToken);
      expect(verifiedRefresh).toBe(true);
    });

    it('debería usar secrets diferentes para cada tipo de token', () => {
      const accessToken = generateAccessToken({
        sub: 123,
        username: 'test',
        rol: UserRole.ADMIN,
      });

      const refreshToken = generateRefreshToken();

      // Access token NO debe validar con verifyRefreshToken
      expect(verifyRefreshToken(accessToken)).toBe(false);

      // Refresh token NO debe decodificar correctamente con verifyAccessToken
      expect(verifyAccessToken(refreshToken)).toBeNull();
    });
  });
});
