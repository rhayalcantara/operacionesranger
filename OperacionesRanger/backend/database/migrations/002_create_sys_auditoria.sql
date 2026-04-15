-- ============================================
-- Migration: 002_create_sys_auditoria
-- Description: Create audit trail table for CRUD operations
-- Date: 2026-01-19
-- Author: OperacionesRanger Team
-- ============================================

USE turnos_guardianes;

-- Drop table if exists (for development/testing)
-- CAUTION: In production, use ALTER TABLE instead of DROP
DROP TABLE IF EXISTS sys_auditoria;

-- Create sys_auditoria table
CREATE TABLE IF NOT EXISTS sys_auditoria (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Audit record ID',

  -- Who performed the action
  user_id INT NOT NULL COMMENT 'User who performed the action (FK to sys_usuarios)',

  -- What action was performed
  accion ENUM('CREATE', 'UPDATE', 'DELETE') NOT NULL COMMENT 'Action type',

  -- On which entity
  entidad VARCHAR(100) NOT NULL COMMENT 'Entity name (table or resource)',

  -- Which specific record
  entidad_id INT NULL COMMENT 'ID of the affected record (NULL for bulk operations)',

  -- Where it came from
  ip_address VARCHAR(45) NULL COMMENT 'Client IP address (supports IPv4 and IPv6)',

  -- What changed (for UPDATE and DELETE)
  datos_anteriores JSON NULL COMMENT 'Data before the change (for UPDATE and DELETE)',

  -- What is the new state (for CREATE and UPDATE)
  datos_nuevos JSON NULL COMMENT 'Data after the change (for CREATE and UPDATE)',

  -- When it happened
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp of the action',

  -- Foreign key constraint
  CONSTRAINT fk_auditoria_user
    FOREIGN KEY (user_id)
    REFERENCES sys_usuarios(id_usuario)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  -- Indexes for performance
  INDEX idx_user_id (user_id),
  INDEX idx_entidad (entidad),
  INDEX idx_created_at (created_at),
  INDEX idx_entidad_id (entidad_id),
  INDEX idx_accion (accion),
  INDEX idx_user_entidad (user_id, entidad),
  INDEX idx_entidad_fecha (entidad, created_at)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Audit trail for CRUD operations';

-- ============================================
-- Sample queries for audit trail
-- ============================================

-- Query 1: Get recent audit records for a user
-- SELECT
--   a.id,
--   a.accion,
--   a.entidad,
--   a.entidad_id,
--   u.username,
--   a.ip_address,
--   a.created_at
-- FROM sys_auditoria a
-- JOIN sys_usuarios u ON a.user_id = u.id
-- WHERE a.user_id = 1
-- ORDER BY a.created_at DESC
-- LIMIT 20;

-- Query 2: Get all changes to a specific record
-- SELECT
--   a.accion,
--   a.datos_anteriores,
--   a.datos_nuevos,
--   u.username,
--   a.created_at
-- FROM sys_auditoria a
-- JOIN sys_usuarios u ON a.user_id = u.id
-- WHERE a.entidad = 'clientes'
--   AND a.entidad_id = 5
-- ORDER BY a.created_at DESC;

-- Query 3: Get audit summary by entity
-- SELECT
--   entidad,
--   accion,
--   COUNT(*) as total_operaciones,
--   COUNT(DISTINCT user_id) as usuarios_unicos
-- FROM sys_auditoria
-- WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
-- GROUP BY entidad, accion
-- ORDER BY total_operaciones DESC;

-- Query 4: Get recent deletions (for recovery purposes)
-- SELECT
--   a.id,
--   a.entidad,
--   a.entidad_id,
--   a.datos_anteriores,
--   u.username,
--   a.ip_address,
--   a.created_at
-- FROM sys_auditoria a
-- JOIN sys_usuarios u ON a.user_id = u.id
-- WHERE a.accion = 'DELETE'
-- ORDER BY a.created_at DESC
-- LIMIT 50;

-- ============================================
-- Migration complete
-- ============================================

SELECT 'Migration 002_create_sys_auditoria completed successfully' AS status;
