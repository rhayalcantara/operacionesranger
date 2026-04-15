-- ============================================================================
-- Migration 003: Crear tablas plantillas_servicio + plantillas_servicio_detalle
-- Sistema de Gestión de Turnos - OperacionesRanger
-- Fecha: 2026-04-04
-- Descripción: Plantillas reutilizables de servicios para poblado rápido del diario
-- ============================================================================

USE turnos_guardianes;

-- Tabla cabecera de plantilla
CREATE TABLE IF NOT EXISTS plantillas_servicio (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion VARCHAR(500) NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,

  -- Auditoría
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Plantillas reutilizables de servicios por puesto';

-- Tabla detalle de plantilla (cada fila es un servicio incluido)
CREATE TABLE IF NOT EXISTS plantillas_servicio_detalle (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plantilla_id INT NOT NULL,
  puesto_id INT NOT NULL,
  servicio_puesto_id INT NOT NULL,

  -- Auditoría
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT fk_plantilla_det_plantilla FOREIGN KEY (plantilla_id)
    REFERENCES plantillas_servicio(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_plantilla_det_puesto FOREIGN KEY (puesto_id)
    REFERENCES puestos(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_plantilla_det_servicio FOREIGN KEY (servicio_puesto_id)
    REFERENCES servicios_puesto(id) ON DELETE RESTRICT ON UPDATE CASCADE,

  -- Un servicio no se repite en la misma plantilla
  CONSTRAINT uk_plantilla_servicio UNIQUE (plantilla_id, servicio_puesto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Detalle de servicios incluidos en cada plantilla';

-- Índices
CREATE INDEX idx_plantillas_activo ON plantillas_servicio(activo);
