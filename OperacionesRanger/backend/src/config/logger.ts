/**
 * Logger Configuration using Winston
 *
 * Provides centralized logging with:
 * - Multiple log levels (error, warn, info, debug)
 * - Console and file transports
 * - Daily log rotation
 * - Sensitive data sanitization
 * - Environment-based formatting
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { env } from './env';

/**
 * Fields to sanitize from logs (sensitive data)
 */
const SENSITIVE_FIELDS = [
  'password',
  'password_hash',
  'passwordHash',
  'newPassword',
  'currentPassword',
  'token',
  'refreshToken',
  'accessToken',
  'jwt',
  'secret',
  'JWT_SECRET',
  'authorization',
  'Authorization'
];

/**
 * Sanitize sensitive fields from log data
 * Replaces sensitive values with '***REDACTED***'
 */
function sanitize(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitize(item));
  }

  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    // Check if field is sensitive (case insensitive)
    const isSensitive = SENSITIVE_FIELDS.some(
      field => key.toLowerCase() === field.toLowerCase()
    );

    if (isSensitive) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitize(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Custom format to sanitize sensitive data
 */
const sanitizeFormat = winston.format((info) => {
  // Sanitize metadata
  if (info.metadata) {
    info.metadata = sanitize(info.metadata);
  }

  // Sanitize additional properties
  const sanitized = sanitize(info);

  return {
    ...sanitized,
    message: info.message // Keep original message
  };
});

/**
 * Custom format for development (pretty-print)
 */
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  sanitizeFormat(),
  // winston.format.colorize(), // Disabled due to compatibility issue
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;

    // Add metadata if present (excluding timestamp, level, message)
    const metaKeys = Object.keys(metadata).filter(
      key => !['timestamp', 'level', 'message', 'splat', Symbol.for('splat')].includes(key)
    );

    if (metaKeys.length > 0) {
      const meta = metaKeys.reduce((acc, key) => {
        acc[key] = metadata[key];
        return acc;
      }, {} as any);

      msg += `\n${JSON.stringify(meta, null, 2)}`;
    }

    return msg;
  })
);

/**
 * Custom format for production (JSON)
 */
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  sanitizeFormat(),
  winston.format.json()
);

/**
 * Create transports based on environment
 */
const transports: winston.transport[] = [
  // Console transport (always enabled)
  new winston.transports.Console({
    format: env.server.nodeEnv === 'production' ? productionFormat : developmentFormat,
  })
];

/**
 * File transports (only in production and development, not in test)
 */
if (env.server.nodeEnv !== 'test') {
  const logDir = path.resolve(process.cwd(), env.server.logFilePath || 'logs');

  // Combined log file (all levels)
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '50m',
      maxFiles: '7d',
      format: productionFormat,
      level: 'debug'
    })
  );

  // Error log file (only errors)
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '50m',
      maxFiles: '14d', // Keep errors longer (14 days)
      format: productionFormat,
      level: 'error'
    })
  );
}

/**
 * Create Winston logger instance
 */
const logger = winston.createLogger({
  level: env.server.logLevel || 'info',
  levels: winston.config.npm.levels,
  transports,
  exitOnError: false,
  // Silent in test environment (unless explicitly enabled)
  silent: env.server.nodeEnv === 'test' && env.server.logLevel !== 'debug'
});

/**
 * Export logger instance and utility function
 */
export default logger;
export { sanitize };

/**
 * Usage examples:
 *
 * import logger from '@/config/logger';
 *
 * logger.info('User created successfully', { userId: 123, username: 'admin' });
 * logger.warn('Rate limit exceeded', { ip: req.ip, endpoint: req.path });
 * logger.error('Database connection failed', { error: err.message, stack: err.stack });
 * logger.debug('SQL query executed', { query: 'SELECT * FROM users', duration: 45 });
 */
