-- ============================================================================
-- Migration 006: Crear Tabla sys_reportes_generados
-- Sistema de Gestión de Turnos - OperacionesRanger
-- ============================================================================
-- Descripción: Crea tabla para mantener historial de reportes CSV generados
-- Autor: Claude Code
-- Fecha: 2026-01-18
-- Relacionado: T2.25 - Historial de reportes generados
-- ============================================================================

USE turnos_guardianes;

-- ============================================================================
-- TABLA: sys_reportes_generados
-- ============================================================================

CREATE TABLE IF NOT EXISTS sys_reportes_generados (
  -- Primary Key
  id INT AUTO_INCREMENT
    COMMENT 'ID único del registro de historial de reporte',

  -- Usuario que generó el reporte
  user_id INT NOT NULL
    COMMENT 'ID del usuario que generó el reporte (FK a sys_usuarios)',

  -- Rango de fechas del reporte
  fecha_inicio DATE NOT NULL
    COMMENT 'Fecha de inicio del rango del reporte (YYYY-MM-DD)',

  fecha_fin DATE NOT NULL
    COMMENT 'Fecha de fin del rango del reporte (YYYY-MM-DD)',

  -- Datos del reporte
  cantidad_turnos INT NOT NULL DEFAULT 0
    COMMENT 'Cantidad de turnos incluidos en el reporte generado',

  fecha_generacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    COMMENT 'Timestamp de cuando se generó el reporte',

  nomina_id INT NULL DEFAULT NULL
    COMMENT 'ID de la nómina en el sistema externo (NULL hasta que se procese)',

  nombre_archivo VARCHAR(255) NOT NULL
    COMMENT 'Nombre del archivo CSV generado (formato: nomina_YYYYMMDD_YYYYMMDD.csv)',

  -- Constraints
  PRIMARY KEY (id),

  -- Foreign Keys
  CONSTRAINT fk_reportes_generados_user
    FOREIGN KEY (user_id)
    REFERENCES sys_usuarios(id_usuario)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  -- Indexes
  INDEX idx_reportes_user (user_id),
  INDEX idx_reportes_fechas (fecha_inicio, fecha_fin),
  INDEX idx_reportes_nomina (nomina_id),
  INDEX idx_reportes_generacion (fecha_generacion DESC)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Historial de reportes CSV generados para integración con sistema de nómina';

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Verificar que la tabla se creó correctamente
SELECT
  TABLE_NAME,
  ENGINE,
  TABLE_ROWS,
  CREATE_TIME,
  TABLE_COMMENT
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'turnos_guardianes'
  AND TABLE_NAME = 'sys_reportes_generados';

-- Verificar estructura de columnas
DESCRIBE sys_reportes_generados;

-- Verificar foreign keys
SELECT
  CONSTRAINT_NAME,
  TABLE_NAME,
  COLUMN_NAME,
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'turnos_guardianes'
  AND TABLE_NAME = 'sys_reportes_generados'
  AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Verificar indexes
SHOW INDEX FROM sys_reportes_generados;

-- ============================================================================
-- NOTAS DE IMPLEMENTACIÓN
-- ============================================================================

/**
 * PROPÓSITO:
 * Esta tabla mantiene un historial completo de todos los reportes CSV
 * generados para el sistema de nómina, permitiendo:
 *
 * 1. Trazabilidad: Quién generó qué reporte y cuándo
 * 2. Re-descarga: Regenerar reportes anteriores con los mismos parámetros
 * 3. Auditoría: Verificar qué turnos fueron incluidos en cada nómina
 * 4. Integración: Vincular reportes con nóminas del sistema externo
 *
 * FLUJO DE USO:
 *
 * 1. Usuario genera reporte CSV (POST /api/reportes/nomina)
 *    → Se crea registro en sys_reportes_generados con nomina_id = NULL
 *
 * 2. CSV se importa en sistema de nómina externo
 *    → Sistema externo asigna nomina_id
 *
 * 3. Usuario marca turnos como procesados (POST /api/reportes/marcar-procesados)
 *    → Se actualiza nomina_id en registro de historial
 *    → Se actualiza nomina_id en tabla turnos
 *
 * 4. Usuario puede consultar historial (GET /api/reportes/historial)
 *    → Ve todos los reportes generados con sus datos
 *
 * 5. Usuario puede re-descargar reporte (GET /api/reportes/historial/:id/descargar)
 *    → Sistema regenera CSV con mismas fechas
 *
 * CAMPOS CLAVE:
 *
 * - user_id: Permite saber quién generó cada reporte (auditoría)
 * - fecha_inicio/fecha_fin: Rango del reporte (permite regeneración exacta)
 * - cantidad_turnos: Snapshot del momento de generación (validación)
 * - nomina_id: NULL hasta que se procese, luego ID del sistema externo
 * - nombre_archivo: Formato estándar para descarga (nomina_YYYYMMDD_YYYYMMDD.csv)
 *
 * INTEGRIDAD:
 *
 * - FK a sys_usuarios con CASCADE: Si se elimina usuario, se eliminan sus reportes
 * - nomina_id puede ser NULL: Reportes generados pero no procesados aún
 * - Indexes optimizados para:
 *   * Búsqueda por usuario (idx_reportes_user)
 *   * Búsqueda por fechas (idx_reportes_fechas)
 *   * Búsqueda por nómina (idx_reportes_nomina)
 *   * Ordenamiento por fecha de generación DESC (idx_reportes_generacion)
 *
 * CONSIDERACIONES FUTURAS:
 *
 * - Política de retención: Archivar reportes mayores a 1 año
 * - Exportación masiva: ZIP con múltiples reportes
 * - Filtros avanzados: Por usuario, fechas, estado de procesamiento
 */

-- ============================================================================
-- FIN DE MIGRATION 006
-- ============================================================================
