-- Migration: Refactor incentivos de quincena a permanente
-- Fecha: 2026-04-06
-- Descripcion: Cambiar modelo de incentivos de periodos quincenales a permanentes por puesto

ALTER TABLE ot_incentivos_puesto
  DROP INDEX ot_uk_puesto_periodo,
  DROP INDEX ot_idx_incentivos_periodo,
  DROP INDEX ot_idx_incentivos_fechas,
  DROP COLUMN anio,
  DROP COLUMN quincena,
  DROP COLUMN fecha_inicio,
  DROP COLUMN fecha_fin,
  CHANGE COLUMN observaciones concepto varchar(255) DEFAULT NULL COMMENT 'Descripcion del incentivo',
  ADD COLUMN activo tinyint(1) NOT NULL DEFAULT 1 AFTER valor_hora,
  ADD COLUMN created_by int DEFAULT NULL AFTER activo,
  ADD UNIQUE KEY ot_uk_puesto_incentivo (puesto_id),
  ADD KEY ot_idx_incentivos_activo (activo);

ALTER TABLE ot_incentivos_puesto COMMENT = 'Incentivos permanentes asignados a puestos de vigilancia';
