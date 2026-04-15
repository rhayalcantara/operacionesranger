-- ============================================================================
-- VALIDACIÓN: CONFIGURACIÓN DE TURNOS DIURNO/NOCTURNO
-- ============================================================================
-- Script de validación para verificar que la configuración de rangos horarios
-- de turnos está correctamente definida
-- ============================================================================

USE turnos_guardianes;

-- ============================================================================
-- 1. VERIFICAR QUE EXISTEN LAS 2 CONFIGURACIONES
-- ============================================================================
SELECT
    COUNT(*) AS total_configuraciones,
    CASE
        WHEN COUNT(*) = 2 THEN '✓ OK - 2 configuraciones presentes (DIURNO y NOCTURNO)'
        WHEN COUNT(*) = 0 THEN '✗ ERROR - No hay configuraciones de turno'
        ELSE CONCAT('⚠ ADVERTENCIA - Se esperaban 2 configuraciones, se encontraron ', COUNT(*))
    END AS estado_validacion
FROM configuracion_turnos
WHERE activo = TRUE;

-- ============================================================================
-- 2. DETALLES DE CONFIGURACIONES
-- ============================================================================
SELECT
    tipo_turno,
    TIME_FORMAT(hora_inicio, '%H:%i:%s') AS hora_inicio,
    TIME_FORMAT(hora_fin, '%H:%i:%s') AS hora_fin,
    descripcion,
    activo,
    created_at
FROM configuracion_turnos
ORDER BY tipo_turno;

-- ============================================================================
-- 3. VALIDAR CONFIGURACIÓN DIURNO
-- ============================================================================
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

-- ============================================================================
-- 4. VALIDAR CONFIGURACIÓN NOCTURNO
-- ============================================================================
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
-- 5. VERIFICAR QUE NO HAY DUPLICADOS
-- ============================================================================
SELECT
    tipo_turno,
    COUNT(*) AS cantidad,
    CASE
        WHEN COUNT(*) > 1 THEN '✗ DUPLICADO'
        ELSE '✓ OK'
    END AS estado
FROM configuracion_turnos
GROUP BY tipo_turno
HAVING COUNT(*) > 1;

-- Si no hay resultados en la query anterior, significa que no hay duplicados (OK)

-- ============================================================================
-- FIN DE VALIDACIÓN
-- ============================================================================
