/**
 * Tests Unitarios - PasswordService
 *
 * Pruebas para:
 * - Generación de hashes bcrypt
 * - Verificación de contraseñas
 * - Validaciones de requisitos
 */

import {
  hashPassword,
  verifyPassword,
  hashPasswordSync,
} from '../../src/services/password.service';
import { PASSWORD_CONFIG } from '../../src/models/auth.model';

// Aumentar timeout para bcrypt (puede ser lento)
jest.setTimeout(10000);

describe('PasswordService', () => {
  // ============================================================================
  // hashPassword()
  // ============================================================================

  describe('hashPassword', () => {
    it('debería generar hash de contraseña válida', async () => {
      const password = 'MySecurePass123';
      const hash = await hashPassword(password);

      // Verificar que retorna un string
      expect(typeof hash).toBe('string');

      // Verificar formato bcrypt ($2a$rounds$salt+hash, 60 caracteres)
      expect(hash).toMatch(/^\$2[aby]\$\d{2}\$.{53}$/);
    });

    it('debería generar hashes diferentes para la misma contraseña', async () => {
      const password = 'SamePassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      // Los hashes deben ser diferentes (salt aleatorio)
      expect(hash1).not.toBe(hash2);
    });

    it('debería rechazar contraseña vacía', async () => {
      await expect(hashPassword('')).rejects.toThrow(
        'Contraseña inválida'
      );
    });

    it('debería rechazar contraseña con solo espacios', async () => {
      await expect(hashPassword('   ')).rejects.toThrow(
        'Contraseña inválida'
      );
    });

    it('debería rechazar contraseña demasiado corta', async () => {
      const shortPassword = 'a'.repeat(PASSWORD_CONFIG.MIN_LENGTH - 1);
      await expect(hashPassword(shortPassword)).rejects.toThrow(
        `al menos ${PASSWORD_CONFIG.MIN_LENGTH} caracteres`
      );
    });

    it('debería rechazar contraseña demasiado larga', async () => {
      const longPassword = 'a'.repeat(PASSWORD_CONFIG.MAX_LENGTH + 1);
      await expect(hashPassword(longPassword)).rejects.toThrow(
        `no puede exceder ${PASSWORD_CONFIG.MAX_LENGTH} caracteres`
      );
    });

    it('debería aceptar contraseña de longitud mínima exacta', async () => {
      const minPassword = 'a'.repeat(PASSWORD_CONFIG.MIN_LENGTH);
      const hash = await hashPassword(minPassword);
      expect(hash).toMatch(/^\$2[aby]\$/);
    });

    it('debería aceptar contraseña de longitud máxima exacta', async () => {
      const maxPassword = 'a'.repeat(PASSWORD_CONFIG.MAX_LENGTH);
      const hash = await hashPassword(maxPassword);
      expect(hash).toMatch(/^\$2[aby]\$/);
    });

    it('debería generar hash con formato bcrypt correcto', async () => {
      const password = 'TestPassword123';
      const hash = await hashPassword(password);

      // Formato: $2a$10$... (60 caracteres total)
      expect(hash.length).toBe(60);
      expect(hash.startsWith('$2')).toBe(true);
    });
  });

  // ============================================================================
  // verifyPassword()
  // ============================================================================

  describe('verifyPassword', () => {
    it('debería retornar true para contraseña correcta', async () => {
      const password = 'CorrectPassword123';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('debería retornar false para contraseña incorrecta', async () => {
      const correctPassword = 'CorrectPassword123';
      const wrongPassword = 'WrongPassword123';
      const hash = await hashPassword(correctPassword);

      const isValid = await verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });

    it('debería retornar false para hash inválido', async () => {
      const password = 'TestPassword123';
      const invalidHash = 'not_a_valid_bcrypt_hash';

      const isValid = await verifyPassword(password, invalidHash);
      expect(isValid).toBe(false);
    });

    it('debería retornar false para contraseña vacía', async () => {
      const hash = await hashPassword('SomePassword123');

      const isValid = await verifyPassword('', hash);
      expect(isValid).toBe(false);
    });

    it('debería retornar false para hash vacío', async () => {
      const password = 'SomePassword123';

      const isValid = await verifyPassword(password, '');
      expect(isValid).toBe(false);
    });

    it('debería funcionar con contraseñas especiales', async () => {
      const specialPassword = 'P@ssw0rd!#$%^&*()_+=-{}[]|\\:";\'<>?,./';
      const hash = await hashPassword(specialPassword);

      const isValid = await verifyPassword(specialPassword, hash);
      expect(isValid).toBe(true);
    });

    it('debería ser case-sensitive', async () => {
      const password = 'CaseSensitive123';
      const hash = await hashPassword(password);

      const isValidLower = await verifyPassword('casesensitive123', hash);
      const isValidUpper = await verifyPassword('CASESENSITIVE123', hash);
      const isValidCorrect = await verifyPassword(password, hash);

      expect(isValidLower).toBe(false);
      expect(isValidUpper).toBe(false);
      expect(isValidCorrect).toBe(true);
    });

    it('debería manejar múltiples verificaciones del mismo hash', async () => {
      const password = 'ReuseTest123';
      const hash = await hashPassword(password);

      // Verificar 5 veces
      for (let i = 0; i < 5; i++) {
        const isValid = await verifyPassword(password, hash);
        expect(isValid).toBe(true);
      }
    });
  });

  // ============================================================================
  // hashPasswordSync()
  // ============================================================================

  describe('hashPasswordSync', () => {
    it('debería generar hash de forma síncrona', () => {
      const password = 'SyncPassword123';
      const hash = hashPasswordSync(password);

      expect(typeof hash).toBe('string');
      expect(hash).toMatch(/^\$2[aby]\$/);
    });

    it('debería generar hash compatible con verifyPassword async', async () => {
      const password = 'CompatibilityTest123';
      const syncHash = hashPasswordSync(password);

      const isValid = await verifyPassword(password, syncHash);
      expect(isValid).toBe(true);
    });

    it('debería rechazar contraseña inválida', () => {
      expect(() => hashPasswordSync('')).toThrow('Contraseña inválida');
    });
  });

  // ============================================================================
  // Tests de Integración
  // ============================================================================

  describe('Integración hashPassword + verifyPassword', () => {
    it('debería funcionar end-to-end con contraseña típica', async () => {
      const password = 'User123Pass!';

      // Generar hash
      const hash = await hashPassword(password);
      expect(hash).toBeDefined();

      // Verificar contraseña correcta
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);

      // Verificar contraseña incorrecta
      const isInvalid = await verifyPassword('WrongPassword!', hash);
      expect(isInvalid).toBe(false);
    });

    it('debería funcionar con múltiples usuarios diferentes', async () => {
      const users = [
        { password: 'User1Password!' },
        { password: 'User2SecurePass123' },
        { password: 'Admin!SuperSecure456' },
      ];

      // Generar hashes para cada usuario
      const hashes = await Promise.all(
        users.map(async (user) => {
          const hash = await hashPassword(user.password);
          return { password: user.password, hash };
        })
      );

      // Verificar que cada hash solo valide su contraseña
      for (let i = 0; i < hashes.length; i++) {
        const { password, hash } = hashes[i];

        // Verificar contraseña correcta
        const isValid = await verifyPassword(password, hash);
        expect(isValid).toBe(true);

        // Verificar que otras contraseñas no funcionen
        for (let j = 0; j < hashes.length; j++) {
          if (i !== j) {
            const otherPassword = hashes[j].password;
            const isInvalid = await verifyPassword(otherPassword, hash);
            expect(isInvalid).toBe(false);
          }
        }
      }
    });
  });
});
