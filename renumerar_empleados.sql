-- Script para eliminar empleado duplicado ID 19 y renumerar empleados 20-24 -> 19-23
-- Base de datos: nomina
-- Fecha: 2025-11-16

USE nomina;

-- Desactivar verificación de claves foráneas
SET FOREIGN_KEY_CHECKS = 0;

-- Iniciar transacción
START TRANSACTION;

-- ============================================
-- PASO 1: Renumeración temporal (evitar conflictos de PK)
-- ============================================

-- Renumerar empleados 20-24 a IDs temporales (10020-10024)
UPDATE rh_empleado SET id_empleado = 10020 WHERE id_empleado = 20;
UPDATE rh_empleado SET id_empleado = 10021 WHERE id_empleado = 21;
UPDATE rh_empleado SET id_empleado = 10022 WHERE id_empleado = 22;
UPDATE rh_empleado SET id_empleado = 10023 WHERE id_empleado = 23;
UPDATE rh_empleado SET id_empleado = 10024 WHERE id_empleado = 24;

-- Actualizar tablas relacionadas con IDs temporales
UPDATE no_cuotas SET id_empleado = 10020 WHERE id_empleado = 20;
UPDATE no_cuotas SET id_empleado = 10021 WHERE id_empleado = 21;
UPDATE no_cuotas SET id_empleado = 10022 WHERE id_empleado = 22;
UPDATE no_cuotas SET id_empleado = 10023 WHERE id_empleado = 23;
UPDATE no_cuotas SET id_empleado = 10024 WHERE id_empleado = 24;

UPDATE rh_estado_empleado SET id_empleado = 10020 WHERE id_empleado = 20;
UPDATE rh_estado_empleado SET id_empleado = 10021 WHERE id_empleado = 21;
UPDATE rh_estado_empleado SET id_empleado = 10022 WHERE id_empleado = 22;
UPDATE rh_estado_empleado SET id_empleado = 10023 WHERE id_empleado = 23;
UPDATE rh_estado_empleado SET id_empleado = 10024 WHERE id_empleado = 24;

UPDATE rh_historial_salario_empleado SET id_empleado = 10020 WHERE id_empleado = 20;
UPDATE rh_historial_salario_empleado SET id_empleado = 10021 WHERE id_empleado = 21;
UPDATE rh_historial_salario_empleado SET id_empleado = 10022 WHERE id_empleado = 22;
UPDATE rh_historial_salario_empleado SET id_empleado = 10023 WHERE id_empleado = 23;
UPDATE rh_historial_salario_empleado SET id_empleado = 10024 WHERE id_empleado = 24;

UPDATE rh_ingreso_despidos_empleados SET id_empleado = 10020 WHERE id_empleado = 20;
UPDATE rh_ingreso_despidos_empleados SET id_empleado = 10021 WHERE id_empleado = 21;
UPDATE rh_ingreso_despidos_empleados SET id_empleado = 10022 WHERE id_empleado = 22;
UPDATE rh_ingreso_despidos_empleados SET id_empleado = 10023 WHERE id_empleado = 23;
UPDATE rh_ingreso_despidos_empleados SET id_empleado = 10024 WHERE id_empleado = 24;

UPDATE sys_usuarios SET id_empleado = 10020 WHERE id_empleado = 20;
UPDATE sys_usuarios SET id_empleado = 10021 WHERE id_empleado = 21;
UPDATE sys_usuarios SET id_empleado = 10022 WHERE id_empleado = 22;
UPDATE sys_usuarios SET id_empleado = 10023 WHERE id_empleado = 23;
UPDATE sys_usuarios SET id_empleado = 10024 WHERE id_empleado = 24;

-- ============================================
-- PASO 2: Eliminar empleado duplicado (ID 19)
-- ============================================

-- Eliminar registros relacionados del empleado 19
DELETE FROM rh_estado_empleado WHERE id_empleado = 19;
DELETE FROM rh_historial_salario_empleado WHERE id_empleado = 19;
DELETE FROM rh_ingreso_despidos_empleados WHERE id_empleado = 19;
DELETE FROM sys_usuarios WHERE id_empleado = 19;
DELETE FROM no_cuotas WHERE id_empleado = 19;

-- Eliminar el empleado duplicado
DELETE FROM rh_empleado WHERE id_empleado = 19;

-- ============================================
-- PASO 3: Renumeración final (IDs consecutivos)
-- ============================================

-- Renumerar de IDs temporales a IDs finales (19-23)
UPDATE rh_empleado SET id_empleado = 19 WHERE id_empleado = 10020;
UPDATE rh_empleado SET id_empleado = 20 WHERE id_empleado = 10021;
UPDATE rh_empleado SET id_empleado = 21 WHERE id_empleado = 10022;
UPDATE rh_empleado SET id_empleado = 22 WHERE id_empleado = 10023;
UPDATE rh_empleado SET id_empleado = 23 WHERE id_empleado = 10024;

-- Actualizar tablas relacionadas con IDs finales
UPDATE no_cuotas SET id_empleado = 19 WHERE id_empleado = 10020;
UPDATE no_cuotas SET id_empleado = 20 WHERE id_empleado = 10021;
UPDATE no_cuotas SET id_empleado = 21 WHERE id_empleado = 10022;
UPDATE no_cuotas SET id_empleado = 22 WHERE id_empleado = 10023;
UPDATE no_cuotas SET id_empleado = 23 WHERE id_empleado = 10024;

UPDATE rh_estado_empleado SET id_empleado = 19 WHERE id_empleado = 10020;
UPDATE rh_estado_empleado SET id_empleado = 20 WHERE id_empleado = 10021;
UPDATE rh_estado_empleado SET id_empleado = 21 WHERE id_empleado = 10022;
UPDATE rh_estado_empleado SET id_empleado = 22 WHERE id_empleado = 10023;
UPDATE rh_estado_empleado SET id_empleado = 23 WHERE id_empleado = 10024;

UPDATE rh_historial_salario_empleado SET id_empleado = 19 WHERE id_empleado = 10020;
UPDATE rh_historial_salario_empleado SET id_empleado = 20 WHERE id_empleado = 10021;
UPDATE rh_historial_salario_empleado SET id_empleado = 21 WHERE id_empleado = 10022;
UPDATE rh_historial_salario_empleado SET id_empleado = 22 WHERE id_empleado = 10023;
UPDATE rh_historial_salario_empleado SET id_empleado = 23 WHERE id_empleado = 10024;

UPDATE rh_ingreso_despidos_empleados SET id_empleado = 19 WHERE id_empleado = 10020;
UPDATE rh_ingreso_despidos_empleados SET id_empleado = 20 WHERE id_empleado = 10021;
UPDATE rh_ingreso_despidos_empleados SET id_empleado = 21 WHERE id_empleado = 10022;
UPDATE rh_ingreso_despidos_empleados SET id_empleado = 22 WHERE id_empleado = 10023;
UPDATE rh_ingreso_despidos_empleados SET id_empleado = 23 WHERE id_empleado = 10024;

UPDATE sys_usuarios SET id_empleado = 19 WHERE id_empleado = 10020;
UPDATE sys_usuarios SET id_empleado = 20 WHERE id_empleado = 10021;
UPDATE sys_usuarios SET id_empleado = 21 WHERE id_empleado = 10022;
UPDATE sys_usuarios SET id_empleado = 22 WHERE id_empleado = 10023;
UPDATE sys_usuarios SET id_empleado = 23 WHERE id_empleado = 10024;

-- ============================================
-- PASO 4: Resetear AUTO_INCREMENT
-- ============================================

-- Ajustar el AUTO_INCREMENT para que el próximo empleado sea 24
ALTER TABLE rh_empleado AUTO_INCREMENT = 24;

-- Verificar resultado final
SELECT 'Empleados después de renumeración:' as mensaje;
SELECT id_empleado, cedula_empleado, nombres, apellidos
FROM rh_empleado
WHERE id_empleado BETWEEN 17 AND 24
ORDER BY id_empleado;

-- Confirmar cambios
COMMIT;

-- Reactivar verificación de claves foráneas
SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Renumeración completada exitosamente' as resultado;
