-- ============================================================================
-- Migration 002: Crear tabla servicios_puesto
-- Sistema de Gestión de Turnos - OperacionesRanger
-- Fecha: 2026-04-04
-- Descripción: Asignación semanal de guardianes a puestos por tipo de turno
-- ============================================================================

USE turnos_guardianes;

CREATE TABLE IF NOT EXISTS servicios_puesto (
  id INT AUTO_INCREMENT PRIMARY KEY,
  puesto_id INT NOT NULL,
  tipo_turno ENUM('DIURNO', 'NOCTURNO') NOT NULL,

  -- Asignación de empleados por día de semana (referencia a rh_empleado.id_empleado)
  domingo_empleado_id INT NULL,
  lunes_empleado_id INT NULL,
  martes_empleado_id INT NULL,
  miercoles_empleado_id INT NULL,
  jueves_empleado_id INT NULL,
  viernes_empleado_id INT NULL,
  sabado_empleado_id INT NULL,

  -- Estado
  cobrada BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Servicio facturado/cobrado',
  activo BOOLEAN NOT NULL DEFAULT TRUE,

  -- Auditoría
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT fk_servicios_puesto_puesto FOREIGN KEY (puesto_id)
    REFERENCES puestos(id) ON DELETE RESTRICT ON UPDATE CASCADE,

  -- Un puesto puede tener máximo un servicio por tipo de turno
  CONSTRAINT uk_puesto_tipo_turno UNIQUE (puesto_id, tipo_turno)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Asignación semanal de guardianes a puestos de vigilancia';

-- Índices para consultas frecuentes
CREATE INDEX idx_servicios_puesto_activo ON servicios_puesto(activo);
CREATE INDEX idx_servicios_puesto_cobrada ON servicios_puesto(cobrada);
