-- =====================================================
-- Migración 003: Tabla sys_reportes_generados
-- =====================================================
-- Descripción: Tabla para mantener historial de reportes CSV generados
-- Fecha: 2026-01-19
-- Relacionado con: T2.25 - Implementar historial de reportes generados

USE turnos_guardianes;

-- Crear tabla sys_reportes_generados
CREATE TABLE IF NOT EXISTS sys_reportes_generados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT 'Usuario que generó el reporte',
    fecha_inicio DATE NOT NULL COMMENT 'Fecha inicial del rango del reporte',
    fecha_fin DATE NOT NULL COMMENT 'Fecha final del rango del reporte',
    cantidad_turnos INT NOT NULL COMMENT 'Cantidad de turnos incluidos en el reporte',
    fecha_generacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp de generación del reporte',
    nomina_id INT NULL COMMENT 'ID de la nómina si fue procesado (vinculación con sistema externo)',
    nombre_archivo VARCHAR(100) NOT NULL COMMENT 'Nombre del archivo CSV generado',

    -- Foreign keys
    CONSTRAINT fk_reportes_user FOREIGN KEY (user_id)
        REFERENCES sys_usuarios(id_usuario)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    -- Indices para optimización de consultas
    INDEX idx_user_fecha (user_id, fecha_generacion),
    INDEX idx_fecha_generacion (fecha_generacion),
    INDEX idx_nomina (nomina_id),
    INDEX idx_fecha_rango (fecha_inicio, fecha_fin)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Historial de reportes CSV generados para nómina';

-- Verificar creación
SELECT
    TABLE_NAME,
    TABLE_ROWS,
    CREATE_TIME,
    TABLE_COMMENT
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'turnos_guardianes'
  AND TABLE_NAME = 'sys_reportes_generados';

-- Verificar columnas
SELECT
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_KEY,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'turnos_guardianes'
  AND TABLE_NAME = 'sys_reportes_generados'
ORDER BY ORDINAL_POSITION;
