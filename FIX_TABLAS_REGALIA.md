# Fix - Tablas Faltantes de Regalía Pascual

**Fecha:** 2025-12-15
**Problema:** Error al crear regalía - Tablas no encontradas
**Estado:** ✅ RESUELTO

---

## Síntomas

Al intentar crear o calcular la Regalía Pascual, se producían errores en el navegador indicando que no se encontraban ciertas tablas o vistas de la base de datos.

Error principal: Tablas `no_regalia_historial_importado` y `no_regalia_importacion_log` no existían.

---

## Causa Raíz

La migración SQL `001_add_regalia_pascual.sql` estaba **incompleta**.

El modelo `regaliaModel.js` requiere estas tablas para la funcionalidad de importación de historial salarial:
- `no_regalia_historial_importado` (línea 487 del modelo)
- `no_regalia_importacion_log` (línea 643 del modelo)

Estas tablas **NO** estaban incluidas en la migración original.

---

## Solución

**Archivo modificado:** `backend-ranger-nomina/migrations/001_add_regalia_pascual.sql`

### Tablas agregadas:

#### 1. Tabla `no_regalia_historial_importado`
```sql
CREATE TABLE IF NOT EXISTS no_regalia_historial_importado (
  id_historial INT PRIMARY KEY AUTO_INCREMENT,
  id_empleado INT NOT NULL,
  anio YEAR NOT NULL,
  salario_enero DECIMAL(10,2) DEFAULT NULL,
  salario_febrero DECIMAL(10,2) DEFAULT NULL,
  salario_marzo DECIMAL(10,2) DEFAULT NULL,
  salario_abril DECIMAL(10,2) DEFAULT NULL,
  salario_mayo DECIMAL(10,2) DEFAULT NULL,
  salario_junio DECIMAL(10,2) DEFAULT NULL,
  salario_julio DECIMAL(10,2) DEFAULT NULL,
  salario_agosto DECIMAL(10,2) DEFAULT NULL,
  salario_septiembre DECIMAL(10,2) DEFAULT NULL,
  salario_octubre DECIMAL(10,2) DEFAULT NULL,
  salario_noviembre DECIMAL(10,2) DEFAULT NULL,
  fecha_importacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  usuario_importacion VARCHAR(100),
  archivo_origen VARCHAR(255),

  FOREIGN KEY (id_empleado) REFERENCES rh_empleado(id_empleado)
    ON DELETE CASCADE ON UPDATE CASCADE,

  INDEX idx_empleado_anio (id_empleado, anio),
  INDEX idx_anio (anio),

  UNIQUE KEY uk_empleado_anio (id_empleado, anio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Propósito:** Almacena el historial salarial mensual de empleados importado desde Excel para calcular la regalía cuando no existen nóminas cerradas del año.

#### 2. Tabla `no_regalia_importacion_log`
```sql
CREATE TABLE IF NOT EXISTS no_regalia_importacion_log (
  id_log INT PRIMARY KEY AUTO_INCREMENT,
  anio YEAR NOT NULL,
  archivo_nombre VARCHAR(255) NOT NULL,
  usuario VARCHAR(100) NOT NULL,
  fecha_importacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  registros_procesados INT NOT NULL DEFAULT 0,
  registros_exitosos INT NOT NULL DEFAULT 0,
  registros_errores INT NOT NULL DEFAULT 0,
  errores_detalle JSON DEFAULT NULL,
  duracion_ms INT DEFAULT NULL,

  INDEX idx_anio (anio),
  INDEX idx_fecha (fecha_importacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Propósito:** Registro de auditoría para las importaciones de historial salarial, incluyendo estadísticas de éxito/error y detalles de errores en formato JSON.

---

## Migración Ejecutada

```bash
mysql -u root -pRHoss.1234 db_aae4a2_ranger < migrations/001_add_regalia_pascual.sql
```

---

## Verificación

### Tablas creadas:
```sql
✅ no_regalia_calculada
✅ no_regalia_auditoria
✅ no_regalia_historial_importado
✅ no_regalia_importacion_log
```

### Vistas creadas:
```sql
✅ vw_regalia_empleados
✅ vw_regalia_historial_importado
```

### Procedimientos y funciones:
```sql
✅ sp_calcular_regalia_sin_historial (PROCEDURE)
✅ fn_tiene_historial_nomina (FUNCTION)
```

### Tipo de nómina:
```sql
✅ Regalia Pascual (id_nomina = 3, periodo_pago = ANUAL)
```

---

## Estructura de Base de Datos Completa para Regalía

```
no_tipo_nomina
├── [id=3] Regalia Pascual (ANUAL)
│
no_regalia_calculada (cálculos finales)
├── id_empleado → rh_empleado
├── anio
├── monto_calculado
├── monto_ajustado
├── id_nomina → no_nominas
│
no_regalia_historial_importado (datos importados)
├── id_empleado → rh_empleado
├── anio
├── salario_enero ... salario_noviembre
│
no_regalia_auditoria (auditoría de cambios)
├── id_regalia → no_regalia_calculada
├── monto_anterior → monto_nuevo
│
no_regalia_importacion_log (log de imports)
├── archivo_nombre
├── registros_procesados
├── errores_detalle (JSON)
│
vw_regalia_empleados (vista consolidada)
└── JOIN con rh_empleado, no_subnomina, no_nominas
```

---

## Funcionalidad de Importación de Historial

El sistema ahora permite:

1. **Importar historial salarial desde Excel** cuando los empleados no tienen nóminas cerradas en el año
2. **Registro detallado** de todas las importaciones con errores en formato JSON
3. **Auditoría completa** de todos los cambios manuales a montos de regalía
4. **Prioridad de cálculo:**
   - HISTORIAL: Si tiene nóminas cerradas en el año (usa `no_det_nomina`)
   - HISTORIAL_IMPORTADO: Si tiene datos importados (usa `no_regalia_historial_importado`)
   - SIN_HISTORIAL: Cálculo proporcional desde fecha de ingreso

---

## Próximos Pasos

1. ✅ Migración ejecutada
2. ⏳ Reiniciar servidor backend (si está corriendo)
3. ⏳ Probar desde el frontend:
   - Calcular preview de regalía
   - Crear nómina de regalía
   - Verificar que no hay errores en consola del navegador

---

## Archivos Modificados

1. `backend-ranger-nomina/migrations/001_add_regalia_pascual.sql`
   - Agregadas secciones 7 y 8 con las dos tablas faltantes

---

**Estado:** ✅ Base de datos actualizada
**Verificado por:** Claude Code
**Siguiente acción:** Reiniciar backend y probar funcionalidad
