-- ============================================================================
-- SEED DATA: FERIADOS NACIONALES - REPÚBLICA DOMINICANA 2026
-- ============================================================================
-- Autor: Rhay / Claude Subagent
-- Fecha: 2026-01-17
-- Fuente oficial: Ministerio de Trabajo de la República Dominicana
-- Referencias:
--   - https://mt.gob.do/ministerio-de-trabajo-informa-dias-feriados-correspondientes-al-ano-2026/
--   - https://presidencia.gob.do/noticias/ministerio-de-trabajo-informa-dias-feriados-correspondientes-al-ano-2026
--   - Ley 139-97 (regula el traslado de días festivos en RD)
-- ============================================================================
-- IMPORTANTE:
--   - Este script usa INSERT IGNORE para evitar errores por duplicados
--   - Si el feriado ya existe con la misma fecha, se ignora la inserción
--   - Los feriados móviles (Viernes Santo, Corpus Christi) han sido verificados
--     con el calendario litúrgico 2026
-- ============================================================================

USE turnos_guardianes;

-- Feriados Nacionales República Dominicana 2026
-- Total: 12 días feriados oficiales según Ministerio de Trabajo

INSERT IGNORE INTO feriados (fecha, nombre, tipo, descripcion) VALUES

-- ENERO 2026
('2026-01-01', 'Año Nuevo', 'NACIONAL',
 'Celebración del primer día del año - No se cambia'),

('2026-01-06', 'Día de los Santos Reyes', 'NACIONAL',
 'Día de Reyes - Según Ley 139-97, se trabaja el martes 6 y el feriado se traslada al lunes 5 de enero'),

('2026-01-21', 'Día de Nuestra Señora de la Altagracia', 'NACIONAL',
 'Patrona del pueblo dominicano - No se cambia'),

('2026-01-26', 'Día del Padre de la Patria (Juan Pablo Duarte)', 'NACIONAL',
 'Natalicio de Juan Pablo Duarte - No se cambia'),

-- FEBRERO 2026
('2026-02-27', 'Día de la Independencia Nacional', 'NACIONAL',
 'Independencia de la República Dominicana - No se cambia'),

-- ABRIL 2026
('2026-04-03', 'Viernes Santo', 'NACIONAL',
 'Festividad religiosa, conmemoración de la muerte de Jesucristo - Fecha móvil (Pascua 2026: 5 de abril)'),

-- MAYO 2026
('2026-05-01', 'Día del Trabajo', 'NACIONAL',
 'Día Internacional del Trabajo - Según Ley 139-97, se trabaja el viernes 1 y el feriado se cambia al lunes 4 de mayo'),

-- JUNIO 2026
('2026-06-04', 'Corpus Christi', 'NACIONAL',
 'Festividad religiosa católica - Fecha móvil, 60 días después del Domingo de Resurrección (5 abril + 60 días = 4 junio)'),

-- AGOSTO 2026
('2026-08-16', 'Día de la Restauración', 'NACIONAL',
 'Restauración de la República Dominicana - No se cambia'),

-- SEPTIEMBRE 2026
('2026-09-24', 'Día de Nuestra Señora de las Mercedes', 'NACIONAL',
 'Patrona de la República Dominicana - No se cambia'),

-- NOVIEMBRE 2026
('2026-11-06', 'Día de la Constitución', 'NACIONAL',
 'Día de la Constitución Dominicana - Según Ley 139-97, se trabaja el viernes 6 y el feriado se cambia al lunes 9 de noviembre'),

-- DICIEMBRE 2026
('2026-12-25', 'Día de Navidad', 'NACIONAL',
 'Celebración del nacimiento de Jesucristo - No se cambia');

-- ============================================================================
-- VALIDACIÓN POST-INSERT
-- ============================================================================

-- Verificar que se cargaron los 12 feriados de 2026
SELECT
    COUNT(*) AS total_feriados_2026,
    CASE
        WHEN COUNT(*) = 12 THEN 'OK - 12 feriados cargados correctamente'
        ELSE CONCAT('ERROR - Se esperaban 12 feriados, se encontraron ', COUNT(*))
    END AS validacion
FROM feriados
WHERE YEAR(fecha) = 2026;

-- Listar todos los feriados de 2026 ordenados por fecha
SELECT
    fecha,
    DAYNAME(fecha) AS dia_semana,
    nombre,
    tipo,
    descripcion
FROM feriados
WHERE YEAR(fecha) = 2026
ORDER BY fecha;

-- ============================================================================
-- NOTAS PARA AÑOS FUTUROS
-- ============================================================================
-- Para cargar feriados de años futuros:
--   1. Consultar calendario oficial del Ministerio de Trabajo (www.mt.gob.do)
--   2. Verificar fechas móviles en calendario litúrgico:
--      - Viernes Santo: Viernes antes del Domingo de Pascua
--      - Corpus Christi: 60 días después del Domingo de Resurrección
--   3. Actualizar el año en todos los INSERT VALUES
--   4. Ejecutar este script contra la base de datos
--
-- Feriados móviles - Cálculo:
--   - Pascua (Domingo de Resurrección): Primer domingo después de la primera
--     luna llena que ocurre después del equinoccio de primavera (21 marzo)
--   - Viernes Santo: 2 días antes de Pascua
--   - Corpus Christi: 60 días (8 semanas + 4 días) después de Pascua
--
-- Referencias útiles:
--   - https://mt.gob.do (Ministerio de Trabajo RD)
--   - https://www.timeanddate.com/holidays/dominican-republic/
--   - https://publicholidays.do/
-- ============================================================================
