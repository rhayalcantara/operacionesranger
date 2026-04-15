-- ============================================================================
-- Migration 004: Crear tabla diario_puesto
-- Sistema de Gestión de Turnos - OperacionesRanger
-- Fecha: 2026-04-04
-- Descripción: Registro diario de asistencia de guardianes por puesto
-- ============================================================================

USE turnos_guardianes;

CREATE TABLE IF NOT EXISTS diario_puesto (
  id INT AUTO_INCREMENT PRIMARY KEY,
  puesto_id INT NOT NULL,
  empleado_id INT NOT NULL COMMENT 'Referencia a rh_empleado.id_empleado',
  fecha DATE NOT NULL,
  horas DECIMAL(4,2) NOT NULL DEFAULT 0.00 COMMENT 'Horas trabajadas',
  tipo_turno ENUM('DIURNO', 'NOCTURNO') NOT NULL,

  -- Referencia opcional al servicio que generó esta entrada
  servicio_puesto_id INT NULL COMMENT 'NULL si fue entrada manual',

  -- Estado y auditoría
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT fk_diario_puesto_puesto FOREIGN KEY (puesto_id)
    REFERENCES puestos(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_diario_puesto_servicio FOREIGN KEY (servicio_puesto_id)
    REFERENCES servicios_puesto(id) ON DELETE SET NULL ON UPDATE CASCADE,

  -- Un empleado no puede tener dos registros para el mismo puesto en la misma fecha
  CONSTRAINT uk_diario_puesto_empleado_fecha UNIQUE (puesto_id, empleado_id, fecha),

  -- Validar horas
  CONSTRAINT chk_horas CHECK (horas >= 0 AND horas <= 24)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Registro diario de asistencia de guardianes por puesto';

-- Índices para consultas frecuentes
CREATE INDEX idx_diario_puesto_fecha ON diario_puesto(fecha);
CREATE INDEX idx_diario_puesto_empleado ON diario_puesto(empleado_id);
CREATE INDEX idx_diario_puesto_activo ON diario_puesto(activo);
CREATE INDEX idx_diario_puesto_tipo ON diario_puesto(tipo_turno);
