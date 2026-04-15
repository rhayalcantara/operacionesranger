/**
 * Configuración y Validación de Variables de Entorno
 *
 * Este módulo:
 * - Define interfaces TypeScript para variables de entorno
 * - Valida que todas las variables requeridas estén presentes
 * - Provee valores por defecto para variables opcionales
 * - Convierte strings a tipos apropiados (number, boolean)
 * - Exporta configuración validada y tipada
 *
 * IMPORTANTE: Este módulo debe importarse ANTES de iniciar el servidor
 * para asegurar que el sistema falle rápido si falta configuración crítica.
 */

import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde archivo .env (o .env.test en modo test)
if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: path.join(__dirname, '../../.env.test') });
} else {
  dotenv.config();
}

// ================================================================================
// INTERFACES Y TIPOS
// ================================================================================

/**
 * Niveles de ambiente permitidos
 */
export type NodeEnv = 'development' | 'production' | 'test';

/**
 * Niveles de logging permitidos
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

/**
 * Configuración de conexión a base de datos
 */
export interface DatabaseConfig {
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
}

/**
 * Configuración del servidor
 */
export interface ServerConfig {
  nodeEnv: NodeEnv;
  port: number;
  logLevel: LogLevel;
  logFilePath: string;
}

/**
 * Configuración de seguridad (JWT)
 */
export interface SecurityConfig {
  jwtSecret: string;
  jwtAccessExpiresIn: string;
  jwtRefreshSecret: string;
  jwtRefreshExpiresIn: string;
  bcryptRounds: number;
}

/**
 * Configuración de CORS
 */
export interface CorsConfig {
  origin: string;
}

/**
 * Configuración de caché en memoria
 */
export interface CacheConfig {
  enabled: boolean;
  ttlSeconds: number;
}

/**
 * Configuración de auditoría
 */
export interface AuditConfig {
  enabled: boolean;
}

/**
 * Configuración completa del entorno
 */
export interface EnvConfig {
  dbTurnos: DatabaseConfig;
  server: ServerConfig;
  security: SecurityConfig;
  cors: CorsConfig;
  cache: CacheConfig;
  audit: AuditConfig;
  timezone: string;
}

// ================================================================================
// FUNCIONES DE VALIDACIÓN
// ================================================================================

/**
 * Obtiene una variable de entorno requerida
 * Lanza error si la variable no está definida o está vacía
 *
 * @param key - Nombre de la variable de entorno
 * @param description - Descripción de la variable para mensaje de error
 * @returns Valor de la variable
 * @throws Error si la variable no está definida
 */
function getRequiredEnv(key: string, description?: string): string {
  const value = process.env[key];

  if (!value || value.trim() === '') {
    const errorMessage = `
╔════════════════════════════════════════════════════════════════════════════════╗
║ ERROR: Variable de entorno requerida no encontrada                            ║
╚════════════════════════════════════════════════════════════════════════════════╝

Variable faltante: ${key}
${description ? `Descripción: ${description}` : ''}

Para resolver este error:

1. Asegúrate de tener un archivo .env en el directorio backend/

   Si no existe, crea uno copiando el archivo de ejemplo:
   → cp .env.example .env

2. Edita el archivo .env y configura el valor de ${key}

   Ejemplo:
   ${key}=valor_apropiado

3. Reinicia el servidor
   → npm run dev

4. Consulta .env.example para ver ejemplos de valores válidos

═══════════════════════════════════════════════════════════════════════════════

DOCUMENTACIÓN:
- Ver: backend/.env.example para todas las variables requeridas
- Ver: docs/completed/T009_variables_entorno.md para documentación completa
- Ver: backend/README.md para guía de instalación

═══════════════════════════════════════════════════════════════════════════════
    `.trim();

    console.error(errorMessage);
    process.exit(1);
  }

  return value.trim();
}

/**
 * Obtiene una variable de entorno opcional con valor por defecto
 *
 * @param key - Nombre de la variable de entorno
 * @param defaultValue - Valor por defecto si la variable no está definida
 * @returns Valor de la variable o valor por defecto
 */
function getOptionalEnv(key: string, defaultValue: string): string {
  const value = process.env[key];
  return value && value.trim() !== '' ? value.trim() : defaultValue;
}

/**
 * Convierte una variable de entorno a número
 *
 * @param key - Nombre de la variable de entorno
 * @param defaultValue - Valor por defecto si la variable no está definida
 * @returns Valor numérico
 * @throws Error si el valor no es un número válido
 */
function getEnvAsNumber(key: string, defaultValue: number): number {
  const value = process.env[key];

  if (!value || value.trim() === '') {
    return defaultValue;
  }

  const numValue = parseInt(value, 10);

  if (isNaN(numValue)) {
    console.error(
      `ERROR: Variable de entorno ${key} debe ser un número. Valor actual: "${value}"`
    );
    process.exit(1);
  }

  return numValue;
}

/**
 * Valida que un valor sea uno de los permitidos
 *
 * @param key - Nombre de la variable
 * @param value - Valor actual
 * @param allowedValues - Lista de valores permitidos
 * @returns Valor validado
 */
function validateEnum<T extends string>(
  key: string,
  value: string,
  allowedValues: readonly T[]
): T {
  if (!allowedValues.includes(value as T)) {
    console.error(`
ERROR: Variable de entorno ${key} tiene un valor inválido.

Valor actual: "${value}"
Valores permitidos: ${allowedValues.join(' | ')}

Por favor corrige el valor en tu archivo .env
    `);
    process.exit(1);
  }

  return value as T;
}

/**
 * Valida que un secret tenga la longitud mínima requerida
 *
 * @param key - Nombre de la variable
 * @param value - Valor del secret
 * @param minLength - Longitud mínima requerida
 */
function validateSecretLength(key: string, value: string, minLength: number): void {
  if (value.length < minLength) {
    console.error(`
ERROR: Variable de entorno ${key} es demasiado corta.

Longitud actual: ${value.length} caracteres
Longitud mínima requerida: ${minLength} caracteres

Para generar un secret seguro, ejecuta:
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

Por favor actualiza el valor en tu archivo .env
    `);
    process.exit(1);
  }
}

// ================================================================================
// CARGA Y VALIDACIÓN DE CONFIGURACIÓN
// ================================================================================

/**
 * Carga y valida todas las variables de entorno
 * Esta función se ejecuta al importar el módulo
 *
 * @returns Configuración validada y tipada
 */
function loadEnvConfig(): EnvConfig {
  // ===== BASE DE DATOS PRINCIPAL - TURNOS =====
  const dbTurnos: DatabaseConfig = {
    host: getRequiredEnv(
      'DB_TURNOS_HOST',
      'Host del servidor MySQL para base de datos de turnos'
    ),
    port: getEnvAsNumber('DB_TURNOS_PORT', 3306),
    name: getRequiredEnv(
      'DB_TURNOS_NAME',
      'Nombre de la base de datos de turnos (turnos_guardianes)'
    ),
    user: getRequiredEnv(
      'DB_TURNOS_USER',
      'Usuario de MySQL con permisos de lectura/escritura'
    ),
    password: getRequiredEnv(
      'DB_TURNOS_PASSWORD',
      'Contraseña del usuario de MySQL para turnos'
    ),
  };

  // ===== SERVIDOR =====
  const nodeEnvValue = getOptionalEnv('NODE_ENV', 'development');
  const logLevelValue = getOptionalEnv('LOG_LEVEL', 'info');

  const server: ServerConfig = {
    nodeEnv: validateEnum(
      'NODE_ENV',
      nodeEnvValue,
      ['development', 'production', 'test'] as const
    ),
    port: getEnvAsNumber('PORT', 3000),
    logLevel: validateEnum(
      'LOG_LEVEL',
      logLevelValue,
      ['error', 'warn', 'info', 'debug'] as const
    ),
    logFilePath: getOptionalEnv('LOG_FILE_PATH', 'logs'),
  };

  // ===== SEGURIDAD =====
  const jwtSecret = getRequiredEnv(
    'JWT_SECRET',
    'Secret para firmar access tokens JWT (mínimo 32 caracteres)'
  );
  validateSecretLength('JWT_SECRET', jwtSecret, 32);

  const jwtRefreshSecret = getRequiredEnv(
    'JWT_REFRESH_SECRET',
    'Secret para firmar refresh tokens JWT (mínimo 32 caracteres, debe ser diferente de JWT_SECRET)'
  );
  validateSecretLength('JWT_REFRESH_SECRET', jwtRefreshSecret, 32);

  // Validar que los secrets sean diferentes
  if (jwtSecret === jwtRefreshSecret) {
    console.error(`
ERROR: JWT_SECRET y JWT_REFRESH_SECRET deben ser diferentes.

Los access tokens y refresh tokens deben usar secrets separados para seguridad.

Por favor genera dos secrets diferentes en tu archivo .env:
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    `);
    process.exit(1);
  }

  const security: SecurityConfig = {
    jwtSecret,
    jwtAccessExpiresIn: getOptionalEnv('JWT_ACCESS_EXPIRES_IN', '15m'),
    jwtRefreshSecret,
    jwtRefreshExpiresIn: getOptionalEnv('JWT_REFRESH_EXPIRES_IN', '7d'),
    bcryptRounds: getEnvAsNumber('BCRYPT_ROUNDS', 10),
  };

  // ===== CORS =====
  const cors: CorsConfig = {
    origin: getOptionalEnv('CORS_ORIGIN', 'http://localhost:4200'),
  };

  // ===== CACHÉ =====
  const cacheEnabledValue = getOptionalEnv('CACHE_ENABLED', 'true');
  const cache: CacheConfig = {
    enabled: cacheEnabledValue === 'true',
    ttlSeconds: getEnvAsNumber('CACHE_TTL_SECONDS', 300),
  };

  // ===== AUDITORÍA =====
  const auditEnabledValue = getOptionalEnv('AUDIT_ENABLED', 'true');
  const audit: AuditConfig = {
    enabled: auditEnabledValue === 'true',
  };

  // ===== LOCALIZACIÓN =====
  const timezone = getOptionalEnv('TZ', 'America/Santo_Domingo');

  return {
    dbTurnos,
    server,
    security,
    cors,
    cache,
    audit,
    timezone,
  };
}

// ================================================================================
// EXPORTAR CONFIGURACIÓN
// ================================================================================

/**
 * Configuración del entorno validada y tipada
 * Importar esta constante en lugar de acceder a process.env directamente
 */
export const env: EnvConfig = loadEnvConfig();

/**
 * Imprime un resumen de la configuración (solo valores no sensibles)
 * Útil para debugging y logs de inicio del servidor
 */
export function printEnvSummary(): void {
  console.info('');
  console.info('═══════════════════════════════════════════════════════════');
  console.info('  CONFIGURACIÓN DEL ENTORNO');
  console.info('═══════════════════════════════════════════════════════════');
  console.info('');
  console.info('SERVIDOR:');
  console.info(`  • Ambiente: ${env.server.nodeEnv}`);
  console.info(`  • Puerto: ${env.server.port}`);
  console.info(`  • Log Level: ${env.server.logLevel}`);
  console.info(`  • Log File Path: ${env.server.logFilePath}`);
  console.info(`  • Timezone: ${env.timezone}`);
  console.info('');
  console.info('BASE DE DATOS - TURNOS:');
  console.info(`  • Host: ${env.dbTurnos.host}`);
  console.info(`  • Port: ${env.dbTurnos.port}`);
  console.info(`  • Database: ${env.dbTurnos.name}`);
  console.info(`  • User: ${env.dbTurnos.user}`);
  console.info(`  • Password: ${'*'.repeat(env.dbTurnos.password.length)} (oculto)`);
  console.info('');
  console.info('CORS:');
  console.info(`  • Origin: ${env.cors.origin}`);
  console.info('');
  console.info('CACHÉ:');
  console.info(`  • Enabled: ${env.cache.enabled}`);
  console.info(`  • TTL: ${env.cache.ttlSeconds} segundos`);
  console.info('');
  console.info('AUDITORÍA:');
  console.info(`  • Enabled: ${env.audit.enabled}`);
  console.info('');
  console.info('SEGURIDAD:');
  console.info(
    `  • JWT Access Secret: ${env.security.jwtSecret ? 'Configurado (' + '*'.repeat(32) + ')' : 'No configurado'}`
  );
  console.info(`  • JWT Access Expires In: ${env.security.jwtAccessExpiresIn}`);
  console.info(
    `  • JWT Refresh Secret: ${env.security.jwtRefreshSecret ? 'Configurado (' + '*'.repeat(32) + ')' : 'No configurado'}`
  );
  console.info(`  • JWT Refresh Expires In: ${env.security.jwtRefreshExpiresIn}`);
  console.info(`  • Bcrypt Rounds: ${env.security.bcryptRounds}`);
  console.info('');
  console.info('═══════════════════════════════════════════════════════════');
  console.info('');
}

// ================================================================================
// VALIDACIÓN AL CARGAR MÓDULO
// ================================================================================

// La configuración se valida automáticamente al importar este módulo
// Si falta alguna variable crítica, el proceso terminará con código de error
