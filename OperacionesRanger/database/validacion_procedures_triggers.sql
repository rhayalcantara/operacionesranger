-- ============================================================================
-- VALIDACIÓN COMPLETA DE PROCEDIMIENTOS ALMACENADOS Y TRIGGERS
-- Sistema de Gestión de Turnos - OperacionesRanger
-- ============================================================================
-- Fecha: 2026-01-17
-- Tarea: T005 - Validar procedimientos almacenados y triggers
-- Prerequisito: Ejecutar datos_prueba_validacion.sql primero
-- ============================================================================

USE turnos_guardianes;

-- ============================================================================
-- 1. VALIDACIÓN DE sp_verificar_feriado
-- ============================================================================

SELECT '============================================' AS '';
SELECT '1. VALIDACIÓN DE sp_verificar_feriado' AS '';
SELECT '============================================' AS '';

-- Caso 1: Fecha que SÍ es feriado - Año Nuevo
SELECT '' AS '';
SELECT 'Caso 1: Verificar Año Nuevo (2026-01-01) - DEBE SER FERIADO' AS PRUEBA;
CALL sp_verificar_feriado('2026-01-01', @es_feriado, @feriado_id, @tipo_feriado);
SELECT
    @es_feriado AS es_feriado,
    @feriado_id AS feriado_id,
    @tipo_feriado AS tipo_feriado,
    CASE WHEN @es_feriado = 1 THEN '✓ CORRECTO' ELSE '✗ ERROR' END AS resultado;

-- Caso 2: Fecha que NO es feriado - Día normal
SELECT '' AS '';
SELECT 'Caso 2: Verificar día normal (2026-01-02) - NO DEBE SER FERIADO' AS PRUEBA;
CALL sp_verificar_feriado('2026-01-02', @es_feriado, @feriado_id, @tipo_feriado);
SELECT
    @es_feriado AS es_feriado,
    @feriado_id AS feriado_id,
    @tipo_feriado AS tipo_feriado,
    CASE WHEN @es_feriado = 0 THEN '✓ CORRECTO' ELSE '✗ ERROR' END AS resultado;

-- Caso 3: Fecha feriado móvil - Viernes Santo
SELECT '' AS '';
SELECT 'Caso 3: Verificar Viernes Santo (2026-04-03) - DEBE SER FERIADO' AS PRUEBA;
CALL sp_verificar_feriado('2026-04-03', @es_feriado, @feriado_id, @tipo_feriado);
SELECT
    @es_feriado AS es_feriado,
    @feriado_id AS feriado_id,
    @tipo_feriado AS tipo_feriado,
    CASE WHEN @es_feriado = 1 THEN '✓ CORRECTO' ELSE '✗ ERROR' END AS resultado;

-- Caso 4: Domingo que NO es feriado (regla de negocio)
SELECT '' AS '';
SELECT 'Caso 4: Verificar domingo no festivo (2026-01-04) - NO DEBE SER FERIADO' AS PRUEBA;
CALL sp_verificar_feriado('2026-01-04', @es_feriado, @feriado_id, @tipo_feriado);
SELECT
    @es_feriado AS es_feriado,
    @feriado_id AS feriado_id,
    @tipo_feriado AS tipo_feriado,
    CASE WHEN @es_feriado = 0 THEN '✓ CORRECTO (domingos NO son feriados automáticos)' ELSE '✗ ERROR' END AS resultado;

-- Caso 5: Fecha feriado tipo DECRETO (si existe alguno)
SELECT '' AS '';
SELECT 'Caso 5: Verificar Corpus Christi (2026-06-04) - DEBE SER FERIADO NACIONAL' AS PRUEBA;
CALL sp_verificar_feriado('2026-06-04', @es_feriado, @feriado_id, @tipo_feriado);
SELECT
    @es_feriado AS es_feriado,
    @feriado_id AS feriado_id,
    @tipo_feriado AS tipo_feriado,
    CASE WHEN @es_feriado = 1 THEN '✓ CORRECTO' ELSE '✗ ERROR' END AS resultado;

-- Caso 6: Fecha en el pasado (año 2025)
SELECT '' AS '';
SELECT 'Caso 6: Verificar feriado del año anterior (2025-12-25 Navidad)' AS PRUEBA;
CALL sp_verificar_feriado('2025-12-25', @es_feriado, @feriado_id, @tipo_feriado);
SELECT
    @es_feriado AS es_feriado,
    @feriado_id AS feriado_id,
    @tipo_feriado AS tipo_feriado,
    CASE WHEN @es_feriado = 1 THEN '✓ CORRECTO' ELSE '✗ ERROR' END AS resultado;

-- ============================================================================
-- 2. VALIDACIÓN DE sp_determinar_tipo_turno
-- ============================================================================

SELECT '' AS '';
SELECT '============================================' AS '';
SELECT '2. VALIDACIÓN DE sp_determinar_tipo_turno' AS '';
SELECT '============================================' AS '';

-- Caso 1: Hora claramente diurna
SELECT '' AS '';
SELECT 'Caso 1: Hora 08:00:00 - DEBE SER DIURNO' AS PRUEBA;
CALL sp_determinar_tipo_turno('08:00:00', @tipo_turno);
SELECT
    @tipo_turno AS tipo_turno,
    CASE WHEN @tipo_turno = 'DIURNO' THEN '✓ CORRECTO' ELSE '✗ ERROR' END AS resultado;

-- Caso 2: Hora claramente nocturna
SELECT '' AS '';
SELECT 'Caso 2: Hora 20:00:00 - DEBE SER NOCTURNO' AS PRUEBA;
CALL sp_determinar_tipo_turno('20:00:00', @tipo_turno);
SELECT
    @tipo_turno AS tipo_turno,
    CASE WHEN @tipo_turno = 'NOCTURNO' THEN '✓ CORRECTO' ELSE '✗ ERROR' END AS resultado;

-- Caso 3: Hora límite inicio DIURNO (06:00:00)
SELECT '' AS '';
SELECT 'Caso 3: Hora 06:00:00 (límite inicio) - DEBE SER DIURNO' AS PRUEBA;
CALL sp_determinar_tipo_turno('06:00:00', @tipo_turno);
SELECT
    @tipo_turno AS tipo_turno,
    CASE WHEN @tipo_turno = 'DIURNO' THEN '✓ CORRECTO' ELSE '✗ ERROR' END AS resultado;

-- Caso 4: Hora límite inicio NOCTURNO (18:00:00)
SELECT '' AS '';
SELECT 'Caso 4: Hora 18:00:00 (límite inicio) - DEBE SER NOCTURNO' AS PRUEBA;
CALL sp_determinar_tipo_turno('18:00:00', @tipo_turno);
SELECT
    @tipo_turno AS tipo_turno,
    CASE WHEN @tipo_turno = 'NOCTURNO' THEN '✓ CORRECTO' ELSE '✗ ERROR' END AS resultado;

-- Caso 5: Hora edge antes de límite diurno
SELECT '' AS '';
SELECT 'Caso 5: Hora 05:59:59 - DEBE SER NOCTURNO' AS PRUEBA;
CALL sp_determinar_tipo_turno('05:59:59', @tipo_turno);
SELECT
    @tipo_turno AS tipo_turno,
    CASE WHEN @tipo_turno = 'NOCTURNO' THEN '✓ CORRECTO' ELSE '✗ ERROR' END AS resultado;

-- Caso 6: Hora edge antes de límite nocturno
SELECT '' AS '';
SELECT 'Caso 6: Hora 17:59:59 - DEBE SER DIURNO' AS PRUEBA;
CALL sp_determinar_tipo_turno('17:59:59', @tipo_turno);
SELECT
    @tipo_turno AS tipo_turno,
    CASE WHEN @tipo_turno = 'DIURNO' THEN '✓ CORRECTO' ELSE '✗ ERROR' END AS resultado;

-- Caso 7: Medianoche
SELECT '' AS '';
SELECT 'Caso 7: Hora 00:00:00 (medianoche) - DEBE SER NOCTURNO' AS PRUEBA;
CALL sp_determinar_tipo_turno('00:00:00', @tipo_turno);
SELECT
    @tipo_turno AS tipo_turno,
    CASE WHEN @tipo_turno = 'NOCTURNO' THEN '✓ CORRECTO' ELSE '✗ ERROR' END AS resultado;

-- ============================================================================
-- 3. VALIDACIÓN DE sp_registrar_turno
-- ============================================================================

SELECT '' AS '';
SELECT '============================================' AS '';
SELECT '3. VALIDACIÓN DE sp_registrar_turno' AS '';
SELECT '============================================' AS '';

-- Limpiar turnos de prueba anteriores
DELETE FROM turnos WHERE empleado_id IN (1, 999);

-- Caso 1: Turno normal diurno sin feriado (DEBE EXITIR)
SELECT '' AS '';
SELECT 'Caso 1: Turno diurno normal (2026-01-02, 10h normales) - DEBE REGISTRARSE' AS PRUEBA;
CALL sp_registrar_turno(
    1,                  -- empleado_id (ficticio)
    1,                  -- puesto_id (Entrada Principal)
    '2026-01-02',       -- fecha (día normal)
    '06:00:00',         -- hora_entrada
    '16:00:00',         -- hora_salida
    10.00,              -- horas_normales
    0.00,               -- horas_extras
    'Turno de prueba caso 1',
    1,                  -- created_by
    @turno_id,
    @mensaje
);
SELECT
    @turno_id AS turno_id,
    @mensaje AS mensaje,
    CASE WHEN @turno_id IS NOT NULL THEN '✓ CORRECTO' ELSE '✗ ERROR' END AS resultado;

-- Verificar que se creó correctamente
SELECT 'Verificación del turno creado:' AS '';
SELECT
    id, empleado_id, fecha, tipo_turno, horas_normales, horas_extras, es_feriado
FROM turnos
WHERE id = @turno_id;

-- Caso 2: Turno nocturno con horas extras (DEBE EXITIR)
SELECT '' AS '';
SELECT 'Caso 2: Turno nocturno con extras (2026-01-03, 10h normales + 2h extras) - DEBE REGISTRARSE' AS PRUEBA;
CALL sp_registrar_turno(
    1,
    1,
    '2026-01-03',
    '18:00:00',
    '06:00:00',
    10.00,
    2.00,
    'Turno nocturno con horas extras',
    1,
    @turno_id,
    @mensaje
);
SELECT
    @turno_id AS turno_id,
    @mensaje AS mensaje,
    CASE WHEN @turno_id IS NOT NULL THEN '✓ CORRECTO' ELSE '✗ ERROR' END AS resultado;

-- Caso 3: Turno en feriado (DEBE EXITIR y detectar feriado automáticamente)
SELECT '' AS '';
SELECT 'Caso 3: Turno en feriado (2026-01-01 Año Nuevo) - DEBE REGISTRARSE Y DETECTAR FERIADO' AS PRUEBA;
CALL sp_registrar_turno(
    1,
    1,
    '2026-01-01',       -- Año Nuevo (feriado)
    '08:00:00',
    '18:00:00',
    10.00,
    0.00,
    'Turno en día feriado',
    1,
    @turno_id,
    @mensaje
);
SELECT
    @turno_id AS turno_id,
    @mensaje AS mensaje,
    CASE WHEN @turno_id IS NOT NULL THEN '✓ CORRECTO' ELSE '✗ ERROR' END AS resultado;

-- Verificar que detectó el feriado
SELECT 'Verificación detección de feriado:' AS '';
SELECT
    id, fecha, es_feriado, feriado_id,
    CASE WHEN es_feriado = 1 THEN '✓ Feriado detectado' ELSE '✗ No detectó feriado' END AS verificacion
FROM turnos
WHERE id = @turno_id;

-- Caso 4: Turno duplicado (DEBE FALLAR)
SELECT '' AS '';
SELECT 'Caso 4: Intentar registrar turno duplicado (2026-01-02) - DEBE FALLAR' AS PRUEBA;
CALL sp_registrar_turno(
    1,
    1,
    '2026-01-02',       -- Ya existe
    '06:00:00',
    '16:00:00',
    10.00,
    0.00,
    'Intento de duplicado',
    1,
    @turno_id,
    @mensaje
);
SELECT
    @turno_id AS turno_id,
    @mensaje AS mensaje,
    CASE WHEN @turno_id IS NULL AND @mensaje LIKE '%Ya existe%' THEN '✓ CORRECTO (rechazó duplicado)' ELSE '✗ ERROR' END AS resultado;

-- Caso 5: Turno con múltiples guardianes en mismo puesto/fecha (DEBE EXITIR)
SELECT '' AS '';
SELECT 'Caso 5: Otro empleado en mismo puesto/fecha (empleado 999) - DEBE REGISTRARSE' AS PRUEBA;
CALL sp_registrar_turno(
    999,                -- empleado_id diferente
    1,                  -- mismo puesto
    '2026-01-02',       -- misma fecha
    '06:00:00',
    '16:00:00',
    10.00,
    0.00,
    'Segundo guardián en mismo puesto',
    1,
    @turno_id,
    @mensaje
);
SELECT
    @turno_id AS turno_id,
    @mensaje AS mensaje,
    CASE WHEN @turno_id IS NOT NULL THEN '✓ CORRECTO (permite múltiples guardianes)' ELSE '✗ ERROR' END AS resultado;

-- Caso 6: Turno en puesto diferente (DEBE EXITIR)
SELECT '' AS '';
SELECT 'Caso 6: Mismo empleado en puesto diferente (Estacionamiento) - DEBE REGISTRARSE' AS PRUEBA;
CALL sp_registrar_turno(
    1,
    2,                  -- puesto_id diferente (Estacionamiento)
    '2026-01-04',
    '06:00:00',
    '16:00:00',
    10.00,
    0.00,
    'Turno en puesto diferente',
    1,
    @turno_id,
    @mensaje
);
SELECT
    @turno_id AS turno_id,
    @mensaje AS mensaje,
    CASE WHEN @turno_id IS NOT NULL THEN '✓ CORRECTO' ELSE '✗ ERROR' END AS resultado;

-- ============================================================================
-- 4. VALIDACIÓN DE TRIGGER trg_turnos_before_insert
-- ============================================================================

SELECT '' AS '';
SELECT '============================================' AS '';
SELECT '4. VALIDACIÓN DE TRIGGER trg_turnos_before_insert' AS '';
SELECT '============================================' AS '';

-- Caso 1: Más de 12 horas normales (DEBE FALLAR)
SELECT '' AS '';
SELECT 'Caso 1: Intentar insertar turno con 13 horas normales - DEBE FALLAR' AS PRUEBA;

-- Desactivar temporalmente el modo de error estricto para capturar el error
SET @old_sql_mode = @@sql_mode;
SET sql_mode = '';

-- Intentar insertar (debe fallar)
INSERT INTO turnos (empleado_id, puesto_id, fecha, hora_entrada, hora_salida, horas_normales, horas_extras, tipo_turno, created_by)
VALUES (1, 1, '2026-01-05', '06:00:00', '19:00:00', 13.00, 0.00, 'DIURNO', 1);

-- Verificar que NO se insertó
SELECT
    CASE
        WHEN COUNT(*) = 0 THEN '✓ CORRECTO (trigger rechazó horas normales > 12)'
        ELSE '✗ ERROR (trigger no funcionó)'
    END AS resultado
FROM turnos
WHERE empleado_id = 1 AND fecha = '2026-01-05';

-- Restaurar modo SQL
SET sql_mode = @old_sql_mode;

-- Caso 2: Más de 4 horas extras (DEBE FALLAR)
SELECT '' AS '';
SELECT 'Caso 2: Intentar insertar turno con 5 horas extras - DEBE FALLAR' AS PRUEBA;

SET sql_mode = '';
INSERT INTO turnos (empleado_id, puesto_id, fecha, hora_entrada, hora_salida, horas_normales, horas_extras, tipo_turno, created_by)
VALUES (1, 1, '2026-01-06', '06:00:00', '18:00:00', 10.00, 5.00, 'DIURNO', 1);

SELECT
    CASE
        WHEN COUNT(*) = 0 THEN '✓ CORRECTO (trigger rechazó horas extras > 4)'
        ELSE '✗ ERROR (trigger no funcionó)'
    END AS resultado
FROM turnos
WHERE empleado_id = 1 AND fecha = '2026-01-06';

SET sql_mode = @old_sql_mode;

-- Caso 3: Más de 16 horas totales (DEBE FALLAR)
SELECT '' AS '';
SELECT 'Caso 3: Intentar insertar turno con 17 horas totales (12+5) - DEBE FALLAR' AS PRUEBA;

SET sql_mode = '';
INSERT INTO turnos (empleado_id, puesto_id, fecha, hora_entrada, hora_salida, horas_normales, horas_extras, tipo_turno, created_by)
VALUES (1, 1, '2026-01-07', '06:00:00', '23:00:00', 12.00, 5.00, 'DIURNO', 1);

SELECT
    CASE
        WHEN COUNT(*) = 0 THEN '✓ CORRECTO (trigger rechazó total > 16h)'
        ELSE '✗ ERROR (trigger no funcionó)'
    END AS resultado
FROM turnos
WHERE empleado_id = 1 AND fecha = '2026-01-07';

SET sql_mode = @old_sql_mode;

-- Caso 4: Exactamente 16 horas totales (12+4) - DEBE ACEPTARSE
SELECT '' AS '';
SELECT 'Caso 4: Turno con exactamente 16 horas totales (12+4) - DEBE ACEPTARSE (edge case)' AS PRUEBA;

INSERT INTO turnos (empleado_id, puesto_id, fecha, hora_entrada, hora_salida, horas_normales, horas_extras, tipo_turno, created_by)
VALUES (1, 1, '2026-01-08', '06:00:00', '22:00:00', 12.00, 4.00, 'DIURNO', 1);

SELECT
    CASE
        WHEN COUNT(*) = 1 THEN '✓ CORRECTO (aceptó 16h total como límite válido)'
        ELSE '✗ ERROR (rechazó límite válido)'
    END AS resultado
FROM turnos
WHERE empleado_id = 1 AND fecha = '2026-01-08';

-- ============================================================================
-- 5. VALIDACIÓN DE sp_generar_reporte_nomina
-- ============================================================================

SELECT '' AS '';
SELECT '============================================' AS '';
SELECT '5. VALIDACIÓN DE sp_generar_reporte_nomina' AS '';
SELECT '============================================' AS '';

-- Caso 1: Generar reporte de primera quincena con turnos
SELECT '' AS '';
SELECT 'Caso 1: Reporte primera quincena enero 2026 (con turnos) - DEBE GENERAR DATOS' AS PRUEBA;
CALL sp_generar_reporte_nomina('2026-01-01', '2026-01-15');

-- Caso 2: Contar cuántos registros se generaron
SELECT 'Total de registros en reporte:' AS '';
SELECT COUNT(*) AS total_turnos
FROM v_reporte_nomina
WHERE fecha BETWEEN '2026-01-01' AND '2026-01-15';

-- Caso 3: Verificar estructura del reporte
SELECT '' AS '';
SELECT 'Caso 3: Verificar estructura y columnas del reporte' AS PRUEBA;
SELECT
    'fecha' AS columna,
    CASE WHEN COUNT(fecha) > 0 THEN '✓' ELSE '✗' END AS presente
FROM v_reporte_nomina
WHERE fecha BETWEEN '2026-01-01' AND '2026-01-15'
UNION ALL
SELECT
    'empleado_id',
    CASE WHEN COUNT(empleado_id) > 0 THEN '✓' ELSE '✗' END
FROM v_reporte_nomina
WHERE fecha BETWEEN '2026-01-01' AND '2026-01-15'
UNION ALL
SELECT
    'puesto_codigo',
    CASE WHEN COUNT(puesto_codigo) > 0 THEN '✓' ELSE '✗' END
FROM v_reporte_nomina
WHERE fecha BETWEEN '2026-01-01' AND '2026-01-15'
UNION ALL
SELECT
    'horas_normales',
    CASE WHEN COUNT(horas_normales) > 0 THEN '✓' ELSE '✗' END
FROM v_reporte_nomina
WHERE fecha BETWEEN '2026-01-01' AND '2026-01-15'
UNION ALL
SELECT
    'tipo_turno',
    CASE WHEN COUNT(tipo_turno) > 0 THEN '✓' ELSE '✗' END
FROM v_reporte_nomina
WHERE fecha BETWEEN '2026-01-01' AND '2026-01-15';

-- Caso 4: Reporte de rango sin turnos (DEBE ESTAR VACÍO)
SELECT '' AS '';
SELECT 'Caso 4: Reporte de rango sin turnos (febrero 2026) - DEBE ESTAR VACÍO' AS PRUEBA;
CALL sp_generar_reporte_nomina('2026-02-01', '2026-02-15');

SELECT
    CASE
        WHEN COUNT(*) = 0 THEN '✓ CORRECTO (no hay turnos en ese rango)'
        ELSE CONCAT('Encontrados ', COUNT(*), ' turnos')
    END AS resultado
FROM v_reporte_nomina
WHERE fecha BETWEEN '2026-02-01' AND '2026-02-15';

-- ============================================================================
-- 6. RESUMEN DE TURNOS CREADOS
-- ============================================================================

SELECT '' AS '';
SELECT '============================================' AS '';
SELECT '6. RESUMEN DE TURNOS CREADOS EN VALIDACIÓN' AS '';
SELECT '============================================' AS '';

SELECT
    id,
    empleado_id,
    puesto_id,
    fecha,
    tipo_turno,
    horas_normales,
    horas_extras,
    (horas_normales + horas_extras) AS total_horas,
    es_feriado,
    CASE WHEN es_feriado THEN 'SÍ' ELSE 'NO' END AS feriado_text
FROM turnos
WHERE empleado_id IN (1, 999)
ORDER BY fecha, empleado_id;

-- ============================================================================
-- 7. VALIDACIÓN FINAL - CHECKS DE INTEGRIDAD
-- ============================================================================

SELECT '' AS '';
SELECT '============================================' AS '';
SELECT '7. VALIDACIÓN FINAL - CHECKS DE INTEGRIDAD' AS '';
SELECT '============================================' AS '';

SELECT 'Total de turnos válidos creados:' AS CHECK_ITEM;
SELECT COUNT(*) AS cantidad FROM turnos WHERE empleado_id IN (1, 999);

SELECT '' AS '';
SELECT 'Turnos con detección correcta de feriado:' AS CHECK_ITEM;
SELECT
    COUNT(*) AS cantidad,
    CASE WHEN COUNT(*) > 0 THEN '✓' ELSE '✗' END AS resultado
FROM turnos
WHERE empleado_id IN (1, 999) AND fecha = '2026-01-01' AND es_feriado = 1;

SELECT '' AS '';
SELECT 'Turnos con tipo DIURNO:' AS CHECK_ITEM;
SELECT COUNT(*) AS cantidad FROM turnos WHERE empleado_id IN (1, 999) AND tipo_turno = 'DIURNO';

SELECT '' AS '';
SELECT 'Turnos con tipo NOCTURNO:' AS CHECK_ITEM;
SELECT COUNT(*) AS cantidad FROM turnos WHERE empleado_id IN (1, 999) AND tipo_turno = 'NOCTURNO';

SELECT '' AS '';
SELECT 'Turnos que NO superan límite de horas (validación trigger):' AS CHECK_ITEM;
SELECT
    COUNT(*) AS cantidad,
    CASE
        WHEN COUNT(*) = 0 THEN '✓ CORRECTO (ningún turno supera límites)'
        ELSE CONCAT('✗ ERROR (', COUNT(*), ' turnos superan límites)')
    END AS resultado
FROM turnos
WHERE empleado_id IN (1, 999)
  AND (horas_normales > 12 OR horas_extras > 4 OR (horas_normales + horas_extras) > 16);

SELECT '' AS '';
SELECT '============================================' AS '';
SELECT 'VALIDACIÓN COMPLETA FINALIZADA' AS '';
SELECT '============================================' AS '';
