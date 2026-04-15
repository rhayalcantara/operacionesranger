-- ============================================================================
-- PRUEBAS: PROCEDIMIENTO sp_verificar_feriado
-- ============================================================================
-- Script para probar el procedimiento almacenado que verifica si una fecha
-- es un día feriado en República Dominicana
-- ============================================================================

USE turnos_guardianes;

-- ============================================================================
-- CASOS DE PRUEBA
-- ============================================================================

-- Caso 1: Año Nuevo 2026 (feriado nacional - jueves)
SELECT '=== Caso 1: Año Nuevo 2026 (01-01-2026) ===' AS test_case;
CALL sp_verificar_feriado('2026-01-01');

-- Separador
SELECT '' AS separador;

-- Caso 2: Día normal (02-01-2026 - viernes, no es feriado)
SELECT '=== Caso 2: Día normal (02-01-2026) ===' AS test_case;
CALL sp_verificar_feriado('2026-01-02');

-- Separador
SELECT '' AS separador;

-- Caso 3: Viernes Santo 2026 (03-04-2026 - fecha móvil)
SELECT '=== Caso 3: Viernes Santo 2026 (03-04-2026) ===' AS test_case;
CALL sp_verificar_feriado('2026-04-03');

-- Separador
SELECT '' AS separador;

-- Caso 4: Corpus Christi 2026 (04-06-2026 - fecha móvil)
SELECT '=== Caso 4: Corpus Christi 2026 (04-06-2026) ===' AS test_case;
CALL sp_verificar_feriado('2026-06-04');

-- Separador
SELECT '' AS separador;

-- Caso 5: Día de la Independencia (27-02-2026 - viernes)
SELECT '=== Caso 5: Día de la Independencia (27-02-2026) ===' AS test_case;
CALL sp_verificar_feriado('2026-02-27');

-- Separador
SELECT '' AS separador;

-- Caso 6: Navidad 2026 (25-12-2026 - viernes)
SELECT '=== Caso 6: Navidad 2026 (25-12-2026) ===' AS test_case;
CALL sp_verificar_feriado('2026-12-25');

-- Separador
SELECT '' AS separador;

-- Caso 7: Domingo normal (NO es feriado a menos que esté en la tabla)
SELECT '=== Caso 7: Domingo normal (15-02-2026) ===' AS test_case;
CALL sp_verificar_feriado('2026-02-15');

-- Separador
SELECT '' AS separador;

-- Caso 8: Fecha fuera de rango (año anterior sin feriados cargados)
SELECT '=== Caso 8: Fecha 2024 sin feriados (01-01-2024) ===' AS test_case;
CALL sp_verificar_feriado('2024-01-01');

-- ============================================================================
-- RESUMEN ESPERADO DE RESULTADOS
-- ============================================================================
/*
CASO 1 - 2026-01-01: ✓ DEBE RETORNAR es_feriado=1 (Año Nuevo)
CASO 2 - 2026-01-02: ✓ DEBE RETORNAR es_feriado=0 (Día normal)
CASO 3 - 2026-04-03: ✓ DEBE RETORNAR es_feriado=1 (Viernes Santo)
CASO 4 - 2026-06-04: ✓ DEBE RETORNAR es_feriado=1 (Corpus Christi)
CASO 5 - 2026-02-27: ✓ DEBE RETORNAR es_feriado=1 (Independencia)
CASO 6 - 2026-12-25: ✓ DEBE RETORNAR es_feriado=1 (Navidad)
CASO 7 - 2026-02-15: ✓ DEBE RETORNAR es_feriado=0 (Domingo normal, NO automático)
CASO 8 - 2024-01-01: ✓ DEBE RETORNAR es_feriado=0 (Año sin datos cargados)

NOTA IMPORTANTE:
- Los domingos NO son feriados automáticos en este sistema
- Solo son feriados si están explícitamente marcados en la tabla 'feriados'
- Esto es correcto según las especificaciones del sistema
*/

-- ============================================================================
-- FIN DE PRUEBAS
-- ============================================================================
