---
description: Renumera IDs de registros eliminando duplicados y manteniendo secuencia consecutiva
---

# Skill: Renumeración de Registros en Base de Datos

Este skill facilita la eliminación de registros duplicados y la renumeración de IDs para mantener una secuencia consecutiva en tablas con AUTO_INCREMENT.

## Proceso Interactivo

El skill solicitará la siguiente información:

1. **Base de datos:** Nombre de la base de datos MySQL donde se realizará la operación
2. **Tabla principal:** Tabla que contiene el ID AUTO_INCREMENT a renumerar
3. **Campo ID:** Nombre del campo de clave primaria (ej: `id_empleado`, `id_cliente`, etc.)
4. **ID duplicado a eliminar:** El ID del registro duplicado que se eliminará
5. **IDs a renumerar:** Rango de IDs que se renumerarán después del duplicado
6. **Tablas relacionadas:** Lista de tablas con claves foráneas que deben actualizarse

## Pasos que Ejecuta el Skill

### 1. Análisis Previo
- Verifica la existencia de la base de datos y tabla
- Muestra información del registro duplicado
- Identifica automáticamente tablas con claves foráneas
- Cuenta registros relacionados en cada tabla

### 2. Generación del Script SQL
Crea un script transaccional con la siguiente estructura:

```sql
USE {database};
SET FOREIGN_KEY_CHECKS = 0;
START TRANSACTION;

-- Paso 1: Renumeración temporal (evitar conflictos PK)
-- Paso 2: Eliminación del duplicado
-- Paso 3: Renumeración final (IDs consecutivos)
-- Paso 4: Reset AUTO_INCREMENT

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;
```

### 3. Validación Previa
Antes de ejecutar:
- Muestra preview de cambios
- Lista registros que serán afectados
- Solicita confirmación del usuario

### 4. Ejecución y Verificación
- Ejecuta el script en una transacción
- Verifica integridad de datos post-renumeración
- Genera reporte detallado de la operación

### 5. Reporte Final
Crea un archivo markdown en `Docs/` con:
- Resumen de la operación
- Registros eliminados y renumerados
- Verificación de integridad
- Script SQL ejecutado
- Recomendaciones

## Ejemplo de Uso

```bash
# Invocar el skill desde Claude Code
Claude: Necesito renumerar empleados porque eliminé un duplicado

# El skill preguntará interactivamente:
Skill: ¿En qué base de datos trabajarás?
Usuario: nomina

Skill: ¿Cuál es la tabla principal?
Usuario: rh_empleado

Skill: ¿Cuál es el campo de ID?
Usuario: id_empleado

Skill: ¿Qué ID duplicado quieres eliminar?
Usuario: 19

Skill: [Analiza y muestra registros relacionados]
Skill: He detectado las siguientes tablas relacionadas:
  - rh_estado_empleado (1 registro)
  - rh_historial_salario_empleado (1 registro)
  - rh_ingreso_despidos_empleados (1 registro)

Skill: ¿Deseas incluir alguna tabla adicional?
Usuario: no_cuotas, sys_usuarios

Skill: [Genera script y muestra preview]
Skill: Se renumerarán los IDs: 20, 21, 22, 23, 24 → 19, 20, 21, 22, 23
Skill: ¿Proceder con la renumeración? (sí/no)
Usuario: sí

Skill: [Ejecuta operación]
Skill: ✅ Renumeración completada exitosamente
Skill: 📄 Reporte generado: Docs/REPORTE_RENUMERACION_{tabla}_{fecha}.md
```

## Comandos SQL Internos

El skill ejecuta automáticamente:

### Análisis de Relaciones
```sql
-- Detectar tablas con FK
SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE REFERENCED_TABLE_SCHEMA = '{database}'
  AND REFERENCED_TABLE_NAME = '{table}';

-- Contar registros relacionados
SELECT COUNT(*) FROM {related_table} WHERE {id_field} = {duplicate_id};
```

### Verificación Post-Renumeración
```sql
-- Verificar integridad
SELECT MIN({id_field}), MAX({id_field}), COUNT(*)
FROM {table};

-- Verificar AUTO_INCREMENT
SHOW TABLE STATUS LIKE '{table}';

-- Contar registros en tablas relacionadas
SELECT COUNT(*) FROM {related_table}
WHERE {id_field} BETWEEN {new_first_id} AND {new_last_id};
```

## Seguridad y Reversibilidad

### Características de Seguridad
- ✅ Usa transacciones (puede hacer ROLLBACK)
- ✅ Desactiva temporalmente FK_CHECKS solo durante la operación
- ✅ Genera backup del script SQL ejecutado
- ✅ Valida datos antes y después de la operación
- ✅ Requiere confirmación explícita del usuario

### En Caso de Error
Si algo falla durante la ejecución:
1. La transacción hace ROLLBACK automático
2. Se restaura el estado anterior
3. Se genera un log de error detallado
4. Se sugieren acciones correctivas

## Casos de Uso Comunes

### 1. Eliminar Duplicado por Error de Importación
```
Situación: Importaste datos y se duplicó un cliente
Solución: Skill elimina el duplicado y renumera los posteriores
```

### 2. Mantener Secuencia Consecutiva
```
Situación: Eliminaste varios registros intermedios y quieres IDs sin huecos
Solución: Skill renumera todos los IDs para eliminar huecos
```

### 3. Corregir Error de Migración
```
Situación: Una migración de datos creó IDs duplicados o salteados
Solución: Skill normaliza toda la secuencia de IDs
```

## Limitaciones

- ⚠️ No soporta tablas sin clave primaria AUTO_INCREMENT
- ⚠️ Requiere que el campo ID sea numérico entero
- ⚠️ No funciona con UUIDs o IDs no secuenciales
- ⚠️ Requiere privilegios de administrador en MySQL
- ⚠️ No se recomienda en tablas con millones de registros (por performance)

## Mejores Prácticas

1. **Backup previo:** Siempre haz backup de la BD antes de renumerar
2. **Mantenimiento programado:** Ejecuta durante ventanas de mantenimiento
3. **Validación posterior:** Verifica la integridad referencial después
4. **Documentación:** El skill genera reportes automáticamente, guárdalos
5. **Prevención:** Implementa validaciones para evitar futuros duplicados

## Variables de Entorno Requeridas

El skill necesita acceso a:
```bash
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=******
MYSQL_PATH="C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
```

## Archivos Generados

Después de ejecutar, el skill crea:

1. **Script SQL:** `renumerar_{tabla}_{fecha}.sql`
2. **Reporte:** `Docs/REPORTE_RENUMERACION_{tabla}_{fecha}.md`
3. **Log:** `Logs/renumeracion_{tabla}_{fecha}.log` (si hay errores)

## Soporte

Si encuentras problemas:
1. Revisa el reporte generado en `Docs/`
2. Verifica el script SQL ejecutado
3. Consulta los logs de error
4. Verifica que las credenciales MySQL sean correctas
5. Asegúrate de tener privilegios de administrador

---

**Nota:** Este skill está diseñado para operaciones seguras y reversibles. Siempre valida los cambios antes de confirmar con COMMIT.
