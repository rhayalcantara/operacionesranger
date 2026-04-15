-- ============================================================================
-- SCRIPT MAESTRO: VALIDACIÓN COMPLETA DE DATOS INICIALES
-- ============================================================================
-- Este script ejecuta todas las validaciones necesarias para verificar que
-- los datos iniciales del sistema están correctamente cargados
--
-- Autor: Rhay / Claude Subagent
-- Fecha: 2026-01-17
-- Tarea: T004 - Cargar datos iniciales (feriados y configuración)
-- ============================================================================

USE turnos_guardianes;

-- ============================================================================
-- PASO 1: VALIDAR FERIADOS 2026
-- ============================================================================
SELECT '╔════════════════════════════════════════════════════════════════════╗' AS '';
SELECT '║  PASO 1: VALIDACIÓN DE FERIADOS NACIONALES 2026                   ║' AS '';
SELECT '╚════════════════════════════════════════════════════════════════════╝' AS '';
SELECT '' AS '';

-- Contar total de feriados 2026
SELECT
    COUNT(*) AS total_feriados_2026,
    CASE
        WHEN COUNT(*) = 12 THEN '✓ OK - 12 feriados cargados correctamente'
        WHEN COUNT(*) = 0 THEN '✗ ERROR - No hay feriados de 2026 en la BD'
        ELSE CONCAT('⚠ ADVERTENCIA - Se esperaban 12 feriados, se encontraron ', COUNT(*))
    END AS estado_validacion
FROM feriados
WHERE YEAR(fecha) = 2026;

SELECT '' AS '';

-- Listar todos los feriados de 2026
SELECT 'Lista completa de feriados 2026:' AS '';
SELECT
    DATE_FORMAT(fecha, '%Y-%m-%d') AS fecha,
    DATE_FORMAT(fecha, '%W') AS dia_semana,
    nombre,
    tipo
FROM feriados
WHERE YEAR(fecha) = 2026
ORDER BY fecha;

SELECT '' AS '';

-- Verificar fechas móviles críticas
SELECT 'Validación de fechas móviles:' AS '';
SELECT
    'Viernes Santo' AS feriado,
    fecha AS fecha_en_bd,
    '2026-04-03' AS fecha_esperada,
    CASE
        WHEN fecha = '2026-04-03' THEN '✓ Correcto'
        ELSE '✗ Incorrecto - debe ser 2026-04-03'
    END AS validacion
FROM feriados
WHERE nombre LIKE '%Viernes Santo%' AND YEAR(fecha) = 2026

UNION ALL

SELECT
    'Corpus Christi' AS feriado,
    fecha AS fecha_en_bd,
    '2026-06-04' AS fecha_esperada,
    CASE
        WHEN fecha = '2026-06-04' THEN '✓ Correcto'
        ELSE '✗ Incorrecto - debe ser 2026-06-04'
    END AS validacion
FROM feriados
WHERE nombre LIKE '%Corpus Christi%' AND YEAR(fecha) = 2026;

-- ============================================================================
-- PASO 2: VALIDAR CONFIGURACIÓN DE TURNOS
-- ============================================================================
SELECT '' AS '';
SELECT '╔════════════════════════════════════════════════════════════════════╗' AS '';
SELECT '║  PASO 2: VALIDACIÓN DE CONFIGURACIÓN DE TURNOS                    ║' AS '';
SELECT '╚════════════════════════════════════════════════════════════════════╝' AS '';
SELECT '' AS '';

-- Verificar que existen las 2 configuraciones
SELECT
    COUNT(*) AS total_configuraciones,
    CASE
        WHEN COUNT(*) = 2 THEN '✓ OK - 2 configuraciones presentes (DIURNO y NOCTURNO)'
        WHEN COUNT(*) = 0 THEN '✗ ERROR - No hay configuraciones de turno'
        ELSE CONCAT('⚠ ADVERTENCIA - Se esperaban 2 configuraciones, se encontraron ', COUNT(*))
    END AS estado_validacion
FROM configuracion_turnos
WHERE activo = TRUE;

SELECT '' AS '';

-- Detalles de configuraciones
SELECT 'Detalles de configuraciones de turno:' AS '';
SELECT
    tipo_turno,
    TIME_FORMAT(hora_inicio, '%H:%i:%s') AS hora_inicio,
    TIME_FORMAT(hora_fin, '%H:%i:%s') AS hora_fin,
    descripcion,
    CASE WHEN activo THEN 'Activo' ELSE 'Inactivo' END AS estado
FROM configuracion_turnos
ORDER BY tipo_turno;

SELECT '' AS '';

-- Validar configuración DIURNO
SELECT 'Validación configuración DIURNO:' AS '';
SELECT
    'DIURNO' AS tipo_turno,
    TIME_FORMAT(hora_inicio, '%H:%i:%s') AS hora_inicio_bd,
    '06:00:00' AS hora_inicio_esperada,
    TIME_FORMAT(hora_fin, '%H:%i:%s') AS hora_fin_bd,
    '18:00:00' AS hora_fin_esperada,
    CASE
        WHEN hora_inicio = '06:00:00' AND hora_fin = '18:00:00' THEN '✓ Correcto'
        ELSE '✗ Incorrecto - debe ser 06:00:00 a 18:00:00'
    END AS validacion
FROM configuracion_turnos
WHERE tipo_turno = 'DIURNO'
LIMIT 1;

-- Validar configuración NOCTURNO
SELECT 'Validación configuración NOCTURNO:' AS '';
SELECT
    'NOCTURNO' AS tipo_turno,
    TIME_FORMAT(hora_inicio, '%H:%i:%s') AS hora_inicio_bd,
    '18:00:00' AS hora_inicio_esperada,
    TIME_FORMAT(hora_fin, '%H:%i:%s') AS hora_fin_bd,
    '06:00:00' AS hora_fin_esperada,
    CASE
        WHEN hora_inicio = '18:00:00' AND hora_fin = '06:00:00' THEN '✓ Correcto'
        ELSE '✗ Incorrecto - debe ser 18:00:00 a 06:00:00'
    END AS validacion
FROM configuracion_turnos
WHERE tipo_turno = 'NOCTURNO'
LIMIT 1;

-- ============================================================================
-- PASO 3: PROBAR PROCEDIMIENTO sp_verificar_feriado
-- ============================================================================
SELECT '' AS '';
SELECT '╔════════════════════════════════════════════════════════════════════╗' AS '';
SELECT '║  PASO 3: PRUEBAS DE PROCEDIMIENTO sp_verificar_feriado            ║' AS '';
SELECT '╚════════════════════════════════════════════════════════════════════╝' AS '';
SELECT '' AS '';

-- Caso 1: Año Nuevo 2026 (feriado nacional)
SELECT 'Caso 1: Año Nuevo 2026 (01-01-2026) - DEBE SER FERIADO' AS '';
CALL sp_verificar_feriado('2026-01-01');
SELECT '' AS '';

-- Caso 2: Día normal (no es feriado)
SELECT 'Caso 2: Día normal (02-01-2026) - NO DEBE SER FERIADO' AS '';
CALL sp_verificar_feriado('2026-01-02');
SELECT '' AS '';

-- Caso 3: Viernes Santo 2026 (fecha móvil)
SELECT 'Caso 3: Viernes Santo 2026 (03-04-2026) - DEBE SER FERIADO' AS '';
CALL sp_verificar_feriado('2026-04-03');
SELECT '' AS '';

-- Caso 4: Corpus Christi 2026 (fecha móvil)
SELECT 'Caso 4: Corpus Christi 2026 (04-06-2026) - DEBE SER FERIADO' AS '';
CALL sp_verificar_feriado('2026-06-04');
SELECT '' AS '';

-- Caso 5: Navidad 2026
SELECT 'Caso 5: Navidad 2026 (25-12-2026) - DEBE SER FERIADO' AS '';
CALL sp_verificar_feriado('2026-12-25');
SELECT '' AS '';

-- Caso 6: Domingo normal (NO automático)
SELECT 'Caso 6: Domingo normal (15-02-2026) - NO DEBE SER FERIADO' AS '';
CALL sp_verificar_feriado('2026-02-15');

-- ============================================================================
-- RESUMEN FINAL
-- ============================================================================
SELECT '' AS '';
SELECT '╔════════════════════════════════════════════════════════════════════╗' AS '';
SELECT '║  VALIDACIÓN COMPLETA FINALIZADA                                   ║' AS '';
SELECT '╚════════════════════════════════════════════════════════════════════╝' AS '';
SELECT '' AS '';
SELECT 'Si todos los tests muestran ✓, los datos iniciales están correctos.' AS '';
SELECT '' AS '';

-- ============================================================================
-- FIN DE VALIDACIÓN COMPLETA
-- ============================================================================
