-- ============================================================================
-- Migration 005: Crear tablas cronogramas + cronogramas_detalle
-- Sistema de Gestión de Turnos - OperacionesRanger
-- Fecha: 2026-04-04
-- Descripción: Planificación semanal de trabajo con regla de 1 día libre
-- ============================================================================

USE turnos_guardianes;

-- Tabla cabecera del cronograma
CREATE TABLE IF NOT EXISTS cronogramas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion VARCHAR(500) NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,

  -- Auditoría
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Cabecera de cronogramas semanales de trabajo';

-- Tabla detalle del cronograma (asignaciones por día)
CREATE TABLE IF NOT EXISTS cronogramas_detalle (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cronograma_id INT NOT NULL,
  dia_semana TINYINT NOT NULL COMMENT '0=Domingo, 1=Lunes, ..., 6=Sábado',
  puesto_id INT NOT NULL,
  empleado_id INT NOT NULL COMMENT 'Referencia a rh_empleado.id_empleado',
  tipo_turno ENUM('DIURNO', 'NOCTURNO') NOT NULL,

  -- Auditoría
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT fk_cronograma_det_cronograma FOREIGN KEY (cronograma_id)
    REFERENCES cronogramas(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_cronograma_det_puesto FOREIGN KEY (puesto_id)
    REFERENCES puestos(id) ON DELETE RESTRICT ON UPDATE CASCADE,

  -- Un empleado no puede estar en dos puestos el mismo día dentro del mismo cronograma
  CONSTRAINT uk_cronograma_empleado_dia UNIQUE (cronograma_id, empleado_id, dia_semana),

  -- Validar rango de día de semana
  CONSTRAINT chk_dia_semana CHECK (dia_semana BETWEEN 0 AND 6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Detalle de asignaciones diarias en cronogramas semanales';

-- Índices
CREATE INDEX idx_cronogramas_activo ON cronogramas(activo);
CREATE INDEX idx_cronogramas_det_dia ON cronogramas_detalle(dia_semana);
CREATE INDEX idx_cronogramas_det_empleado ON cronogramas_detalle(empleado_id);
