/**
 * Audit Middleware
 *
 * Records CRUD operations (CREATE, UPDATE, DELETE) to sys_auditoria table.
 * Captures: user_id, action, entity, entity_id, IP address, before/after data.
 */

import { Request, Response, NextFunction } from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getTurnosPool } from '@/config/database';
import { env } from '@/config/env';
import logger, { sanitize } from '@/config/logger';

/**
 * Audit action types
 */
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

/**
 * Audit data structure
 */
interface AuditData {
  user_id: number;
  accion: AuditAction;
  entidad: string;
  entidad_id: number | null;
  ip_address: string | null;
  datos_anteriores: any | null;
  datos_nuevos: any | null;
}

/**
 * Fields to exclude from audit data (sensitive or irrelevant)
 */
const EXCLUDED_FIELDS = [
  'password',
  'password_hash',
  'passwordHash',
  'token',
  'refreshToken',
  'accessToken'
];

/**
 * Sanitize data for audit (remove sensitive fields)
 */
function sanitizeAuditData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeAuditData(item));
  }

  const sanitized: any = {};

  for (const [key, value] of Object.entries(data)) {
    // Skip excluded fields
    if (EXCLUDED_FIELDS.includes(key)) {
      continue;
    }

    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeAuditData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Determine audit action from HTTP method
 */
function getAuditAction(method: string): AuditAction | null {
  switch (method.toUpperCase()) {
    case 'POST':
      return 'CREATE';
    case 'PUT':
    case 'PATCH':
      return 'UPDATE';
    case 'DELETE':
      return 'DELETE';
    default:
      return null; // GET and other methods are not audited
  }
}

/**
 * Get client IP address from request
 */
function getClientIp(req: Request): string | null {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.ip ||
    req.socket.remoteAddress ||
    null
  );
}

/**
 * Extract entity ID from request
 * Tries: req.params.id → req.body.id → req.result.insertId
 */
function getEntityId(req: Request, res: Response): number | null {
  // From URL params
  if (req.params.id) {
    const id = parseInt(req.params.id, 10);
    if (!isNaN(id)) {
      return id;
    }
  }

  // From body (for CREATE operations)
  if (req.body && req.body.id) {
    const id = parseInt(req.body.id, 10);
    if (!isNaN(id)) {
      return id;
    }
  }

  // From response locals (set by controller)
  if (res.locals.entityId) {
    const id = parseInt(res.locals.entityId, 10);
    if (!isNaN(id)) {
      return id;
    }
  }

  return null;
}

/**
 * Fetch previous data for UPDATE and DELETE operations
 */
async function fetchPreviousData(
  entidad: string,
  entidad_id: number
): Promise<any | null> {
  try {
    const [rows] = await getTurnosPool().query<RowDataPacket[]>(
      `SELECT * FROM ${getTurnosPool().escapeId(entidad)} WHERE id = ? LIMIT 1`,
      [entidad_id]
    );

    if (rows && rows.length > 0) {
      return sanitizeAuditData(rows[0]);
    }

    return null;
  } catch (error) {
    logger.warn('Failed to fetch previous data for audit', {
      entidad,
      entidad_id,
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

/**
 * Insert audit record to database
 */
async function insertAuditRecord(data: AuditData): Promise<void> {
  try {
    await getTurnosPool().query<ResultSetHeader>(
      `INSERT INTO ot_sys_auditoria
       (user_id, accion, entidad, entidad_id, ip_address, datos_anteriores, datos_nuevos)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.user_id,
        data.accion,
        data.entidad,
        data.entidad_id,
        data.ip_address,
        data.datos_anteriores ? JSON.stringify(data.datos_anteriores) : null,
        data.datos_nuevos ? JSON.stringify(data.datos_nuevos) : null
      ]
    );

    logger.debug('Audit record created', {
      user_id: data.user_id,
      accion: data.accion,
      entidad: data.entidad,
      entidad_id: data.entidad_id
    });
  } catch (error) {
    // Log error but don't throw (audit failure shouldn't break the request)
    logger.error('Failed to insert audit record', {
      data: sanitize(data),
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Audit middleware factory
 *
 * @param entidad - Entity name (table name)
 * @returns Express middleware function
 *
 * @example
 * router.post('/clientes', auditMiddleware('clientes'), createCliente);
 * router.put('/clientes/:id', auditMiddleware('clientes'), updateCliente);
 * router.delete('/clientes/:id', auditMiddleware('clientes'), deleteCliente);
 */
export function auditMiddleware(entidad: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip if audit is disabled
    if (!env.audit.enabled) {
      return next();
    }

    // Skip if user is not authenticated
    if (!req.user || !req.user.sub) {
      return next();
    }

    // Determine audit action
    const accion = getAuditAction(req.method);

    // Skip if method is not audited (GET, HEAD, OPTIONS, etc.)
    if (!accion) {
      return next();
    }

    // Get entity ID
    let entidad_id = getEntityId(req, res);

    // For UPDATE and DELETE, fetch previous data BEFORE the operation
    let datos_anteriores: any | null = null;

    if ((accion === 'UPDATE' || accion === 'DELETE') && entidad_id) {
      datos_anteriores = await fetchPreviousData(entidad, entidad_id);
    }

    // Capture original res.json to intercept response
    const originalJson = res.json.bind(res);

    res.json = function (body: any) {
      // Try to extract entity ID from response if not already set
      if (!entidad_id && body && body.id) {
        entidad_id = parseInt(body.id, 10);
      }

      // For CREATE, capture new data from response
      let datos_nuevos: any | null = null;
      if (accion === 'CREATE' && body) {
        datos_nuevos = sanitizeAuditData(body);
      }

      // For UPDATE, capture new data from request body
      if (accion === 'UPDATE' && req.body) {
        datos_nuevos = sanitizeAuditData(req.body);
      }

      // Insert audit record asynchronously (don't wait)
      const auditData: AuditData = {
        user_id: req.user!.sub,
        accion,
        entidad,
        entidad_id,
        ip_address: getClientIp(req),
        datos_anteriores,
        datos_nuevos
      };

      // Fire and forget (don't block response)
      insertAuditRecord(auditData).catch((error) => {
        logger.error('Async audit insert failed', {
          error: error instanceof Error ? error.message : String(error)
        });
      });

      // Send original response
      return originalJson(body);
    };

    next();
  };
}

/**
 * Export for testing
 */
export {
  sanitizeAuditData,
  getAuditAction,
  getClientIp,
  getEntityId,
  fetchPreviousData,
  insertAuditRecord
};
