-- ============================================================================
-- VALIDACIÓN: FERIADOS 2026 - REPÚBLICA DOMINICANA
-- ============================================================================
-- Script de validación rápida para verificar que los feriados de 2026
-- están correctamente cargados en la base de datos
-- ============================================================================

USE turnos_guardianes;

-- ============================================================================
-- 1. CONTAR TOTAL DE FERIADOS 2026
-- ============================================================================
SELECT
    COUNT(*) AS total_feriados_2026,
    CASE
        WHEN COUNT(*) = 12 THEN '✓ OK - 12 feriados cargados correctamente'
        WHEN COUNT(*) = 0 THEN '✗ ERROR - No hay feriados de 2026 en la BD'
        ELSE CONCAT('⚠ ADVERTENCIA - Se esperaban 12 feriados, se encontraron ', COUNT(*))
    END AS estado_validacion
FROM feriados
WHERE YEAR(fecha) = 2026;

-- ============================================================================
-- 2. LISTAR TODOS LOS FERIADOS DE 2026
-- ============================================================================
SELECT
    DATE_FORMAT(fecha, '%Y-%m-%d') AS fecha,
    DATE_FORMAT(fecha, '%W') AS dia_semana,
    nombre,
    tipo
FROM feriados
WHERE YEAR(fecha) = 2026
ORDER BY fecha;

-- ============================================================================
-- 3. VERIFICAR FECHAS MÓVILES CRÍTICAS
-- ============================================================================
-- Validar que Viernes Santo y Corpus Christi tengan las fechas correctas

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
-- 4. VERIFICAR QUE NO HAY DUPLICADOS
-- ============================================================================
SELECT
    fecha,
    COUNT(*) AS cantidad,
    CASE
        WHEN COUNT(*) > 1 THEN '✗ DUPLICADO'
        ELSE '✓ OK'
    END AS estado
FROM feriados
WHERE YEAR(fecha) = 2026
GROUP BY fecha
HAVING COUNT(*) > 1;

-- Si no hay resultados en la query anterior, significa que no hay duplicados (OK)

-- ============================================================================
-- FIN DE VALIDACIÓN
-- ============================================================================
