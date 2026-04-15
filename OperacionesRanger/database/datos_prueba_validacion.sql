-- ============================================================================
-- DATOS DE PRUEBA PARA VALIDACIÓN DE PROCEDIMIENTOS Y TRIGGERS
-- Sistema de Gestión de Turnos - OperacionesRanger
-- ============================================================================
-- Fecha: 2026-01-17
-- Tarea: T005 - Validar procedimientos almacenados y triggers
-- ============================================================================

USE turnos_guardianes;

-- ============================================================================
-- LIMPIAR DATOS DE PRUEBA ANTERIORES (si existen)
-- ============================================================================

-- Eliminar turnos de prueba primero (por FK constraint)
DELETE FROM turnos WHERE empleado_id IN (1, 999, 1001);

-- Eliminar incentivos de prueba
DELETE FROM incentivos_puesto WHERE puesto_id IN (
    SELECT id FROM puestos WHERE codigo IN ('P001-TEST', 'P002-TEST')
);

-- Eliminar puestos de prueba
DELETE FROM puestos WHERE codigo IN ('P001-TEST', 'P002-TEST');

-- Eliminar ubicaciones de prueba
DELETE FROM ubicaciones WHERE codigo = 'UB001-TEST';

-- Eliminar clientes de prueba
DELETE FROM clientes WHERE codigo = 'CLI001-TEST';

-- ============================================================================
-- CREAR DATOS DE PRUEBA
-- ============================================================================

-- Cliente de prueba
INSERT INTO clientes (
    codigo,
    nombre,
    rnc,
    telefono,
    email,
    direccion,
    contacto_nombre,
    contacto_telefono,
    activo
) VALUES (
    'CLI001-TEST',
    'EMPRESA DE PRUEBA S.A.',
    '123456789',
    '809-555-1234',
    'contacto@empresaprueba.com',
    'Av. Principal #123, Santo Domingo',
    'Juan Pérez',
    '809-555-5678',
    TRUE
);

-- Obtener ID del cliente recién creado
SET @cliente_id = LAST_INSERT_ID();

-- Ubicación de prueba
INSERT INTO ubicaciones (
    cliente_id,
    codigo,
    nombre,
    direccion,
    provincia,
    municipio,
    sector,
    telefono,
    contacto_nombre,
    contacto_telefono,
    activo
) VALUES (
    @cliente_id,
    'UB001-TEST',
    'Oficina Central de Prueba',
    'Av. 27 de Febrero #456, Plaza Comercial',
    'Distrito Nacional',
    'Santo Domingo',
    'Naco',
    '809-555-9999',
    'María González',
    '809-555-8888',
    TRUE
);

-- Obtener ID de la ubicación recién creada
SET @ubicacion_id = LAST_INSERT_ID();

-- Puesto de prueba 1 - Entrada Principal
INSERT INTO puestos (
    ubicacion_id,
    codigo,
    nombre,
    descripcion,
    cantidad_guardianes,
    requiere_turno_diurno,
    requiere_turno_nocturno,
    activo
) VALUES (
    @ubicacion_id,
    'P001-TEST',
    'Entrada Principal - Prueba',
    'Puesto de vigilancia en entrada principal del edificio (TEST)',
    1,
    TRUE,
    TRUE,
    TRUE
);

SET @puesto_id_1 = LAST_INSERT_ID();

-- Puesto de prueba 2 - Estacionamiento
INSERT INTO puestos (
    ubicacion_id,
    codigo,
    nombre,
    descripcion,
    cantidad_guardianes,
    requiere_turno_diurno,
    requiere_turno_nocturno,
    activo
) VALUES (
    @ubicacion_id,
    'P002-TEST',
    'Estacionamiento - Prueba',
    'Puesto de vigilancia en estacionamiento (TEST)',
    1,
    TRUE,
    TRUE,
    TRUE
);

SET @puesto_id_2 = LAST_INSERT_ID();

-- ============================================================================
-- CREAR INCENTIVOS DE PRUEBA
-- ============================================================================

-- Incentivo para primera quincena de enero 2026 (días 1-15)
INSERT INTO incentivos_puesto (
    puesto_id,
    anio,
    quincena,
    monto,
    fecha_inicio,
    fecha_fin,
    observaciones
) VALUES (
    @puesto_id_1,
    2026,
    1, -- Primera quincena (enero 1-15)
    7200.00, -- Monto total para 15 días
    '2026-01-01',
    '2026-01-15',
    'Incentivo de prueba - Primera quincena enero 2026'
);

-- Incentivo para segunda quincena de enero 2026 (días 16-31)
INSERT INTO incentivos_puesto (
    puesto_id,
    anio,
    quincena,
    monto,
    fecha_inicio,
    fecha_fin,
    observaciones
) VALUES (
    @puesto_id_1,
    2026,
    2, -- Segunda quincena (enero 16-31)
    7200.00,
    '2026-01-16',
    '2026-01-31',
    'Incentivo de prueba - Segunda quincena enero 2026'
);

-- ============================================================================
-- VALIDAR DATOS CREADOS
-- ============================================================================

SELECT '========================================' AS '';
SELECT 'DATOS DE PRUEBA CREADOS EXITOSAMENTE' AS RESULTADO;
SELECT '========================================' AS '';

SELECT 'Cliente de prueba:' AS '';
SELECT id, codigo, nombre, rnc FROM clientes WHERE codigo = 'CLI001-TEST';

SELECT '' AS '';
SELECT 'Ubicación de prueba:' AS '';
SELECT id, codigo, nombre, direccion FROM ubicaciones WHERE codigo = 'UB001-TEST';

SELECT '' AS '';
SELECT 'Puestos de prueba:' AS '';
SELECT id, codigo, nombre, cantidad_guardianes FROM puestos WHERE codigo IN ('P001-TEST', 'P002-TEST');

SELECT '' AS '';
SELECT 'Incentivos creados:' AS '';
SELECT
    id,
    puesto_id,
    anio,
    quincena,
    monto,
    valor_hora,
    fecha_inicio,
    fecha_fin
FROM incentivos_puesto
WHERE puesto_id IN (@puesto_id_1, @puesto_id_2);

SELECT '' AS '';
SELECT '========================================' AS '';
SELECT 'VARIABLES DISPONIBLES PARA PRUEBAS:' AS '';
SELECT '========================================' AS '';
SELECT CONCAT('Cliente ID: ', @cliente_id) AS INFO;
SELECT CONCAT('Ubicación ID: ', @ubicacion_id) AS INFO;
SELECT CONCAT('Puesto 1 ID (Entrada Principal): ', @puesto_id_1) AS INFO;
SELECT CONCAT('Puesto 2 ID (Estacionamiento): ', @puesto_id_2) AS INFO;
SELECT '' AS '';
SELECT 'Usar empleado_id = 1 o 999 para pruebas (IDs ficticios)' AS NOTA;
SELECT '========================================' AS '';
