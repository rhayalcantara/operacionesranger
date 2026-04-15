# Análisis: Problema de Descuentos Fijos en Formulario de Empleado

**Fecha**: 2026-01-21
**Ubicación**: `rangernomina-frontend/src/app/employee-form/`
**Problema reportado**: "Cuando grabamos un descuento fijo en el formulario de empleado, lo guarda como si fuera un descuento, lo que causa inconveniente a la hora de generar la nómina"

---

## 1. HALLAZGOS PRINCIPALES

### 1.1 Inconsistencia Conceptual del Campo "fijo"

El campo `fijo` en la tabla `no_desc_cred` tiene **dos interpretaciones contradictorias**:

**Interpretación Backend** (`ingresos_descuentos.js:36-49`):
- Items con `fijo = 1` son "calculados automáticamente"
- NO deberían asignarse manualmente a empleados
- Ejemplos: AFP, SFS, ISR, Horas Extras (importadas)

**Interpretación Frontend** (`employee-form.ts:193`):
- Items con `fijo = 1` son "descuentos/ingresos fijos del empleado"
- SÍ deberían asignarse manualmente
- El diálogo se abre con `soloFijos: true`

### 1.2 Items Fijos en Base de Datos

Consulta realizada muestra 14 items con `fijo = 1`:

| id_desc_cred | descripcion | origen | empleados_asignados | ¿Debería ser manual? |
|--------------|-------------|--------|---------------------|----------------------|
| 12 | Desc de Ahorros | D | 28 | **SÍ** ✓ |
| 16 | Seguros Medicos Complementarios | D | 11 | **SÍ** ✓ |
| 6 | horas extras 35% | I | 8 | **NO** (importado) |
| 20 | DIAS LIBRES | I | 8 | **SÍ** ✓ |
| 10 | Seguro de Vida | D | 6 | **SÍ** ✓ |
| 5 | horas extras | I | 5 | **NO** (importado) |
| 7 | horas extras 15% | I | 5 | **NO** (importado) |
| 18 | Otras Extras | I | 2 | **Depende** |
| 1 | SFS | D | 0 | **NO** (calculado) |
| 2 | AFP | D | 0 | **NO** (calculado) |
| 8 | Sueldo_Bruto | I | 0 | **NO** (calculado) |
| 11 | Contribucion Complementaria | I | 0 | **Depende** |
| 24 | DES. CUARTEL | D | 0 | **Depende** |
| 30 | ARMAS | I | 0 | **Depende** |

### 1.3 Flujo Actual del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│ FORMULARIO EMPLEADO (employee-form.ts)                     │
├─────────────────────────────────────────────────────────────┤
│ 1. Usuario hace clic en "Añadir Ingreso/Descuento"         │
│ 2. Se abre NoDescCredSearchDialogComponent con:            │
│    { soloFijos: true }  ← MUESTRA SOLO fijo = 1            │
│ 3. Usuario selecciona un item (ej: "Desc de Ahorros")      │
│ 4. Se agrega al array ingresosDescuentos[]                 │
│ 5. Al guardar, llama a:                                    │
│    updateEmployeeWithIngresosDescuentos(id, data, items)   │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ SERVICIO (employee.service.ts:95-99)                       │
├─────────────────────────────────────────────────────────────┤
│ Hace 2 llamadas paralelas:                                 │
│ - PUT /empleados/:id (actualiza empleado)                  │
│ - POST /empleados/:id/ingresos-descuentos (guarda items)   │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ BACKEND (ingresos_descuentos.js:20-77)                     │
├─────────────────────────────────────────────────────────────┤
│ 1. Validar que NO sean items fijos (líneas 36-49):         │
│    SELECT * FROM no_desc_cred WHERE id_desc_cred IN (?)    │
│    AND fijo = 1                                            │
│                                                             │
│ 2. Si encuentra items fijos → ERROR 400                    │
│    "No se pueden asignar manualmente items calculados      │
│     automáticamente"                                       │
│                                                             │
│ 3. Si OK → Borra registros existentes                      │
│    DELETE FROM no_desc_cred_auto WHERE id_empleado = ?     │
│                                                             │
│ 4. Inserta nuevos registros                                │
│    INSERT INTO no_desc_cred_auto                           │
│    (id_empleado, id_desc_cred, descripcion,                │
│     valor, numero_de_quincena) VALUES ...                  │
└─────────────────────────────────────────────────────────────┘
```

### 1.4 Problema Identificado

**La validación del backend (líneas 36-49) DEBERÍA estar impidiendo** que se guarden items con `fijo = 1`, pero hay 68 registros en `no_desc_cred_auto` que tienen items con `fijo = 1`.

Esto significa:
1. **La validación no está funcionando**, o
2. **Los registros se crearon antes de implementar la validación**, o
3. **Hay otra ruta que permite insertar estos datos sin validación**

---

## 2. ESTRUCTURA DE TABLAS

### 2.1 Tabla `no_desc_cred` (Catálogo)

```sql
CREATE TABLE no_desc_cred (
  id_desc_cred INT PRIMARY KEY AUTO_INCREMENT,
  descripcion VARCHAR(45),
  origen VARCHAR(1),  -- 'I' = Ingreso, 'D' = Descuento
  fijo TINYINT(1),    -- ← CAMPO PROBLEMÁTICO
  valorporciento VARCHAR(45),  -- 'V' = Valor, 'P' = Porcentaje
  empleado DECIMAL(10,2),
  compania DECIMAL(10,2),
  tope DECIMAL(10,2),
  maneja_cuotas TINYINT(1),
  aplica_afp_quincena TINYINT,
  aplica_ars_quincena TINYINT,
  quincena_aplicacion TINYINT
)
```

### 2.2 Tabla `no_desc_cred_auto` (Asignación a Empleados)

```sql
CREATE TABLE no_desc_cred_auto (
  item INT PRIMARY KEY AUTO_INCREMENT,
  id_empleado INT,
  id_desc_cred INT,
  descripcion VARCHAR(50),  -- ← DUPLICADO, existe en no_desc_cred
  valor DECIMAL(10,2),
  numero_de_quincena INT
)
```

**Nota**: La columna `descripcion` está **duplicada** innecesariamente. Ya existe en `no_desc_cred` y se puede obtener mediante JOIN.

---

## 3. IMPACTO EN GENERACIÓN DE NÓMINA

### 3.1 Cómo se Usan los Descuentos Fijos en Nómina

El modelo `nominaModel.js` tiene la función `_generarCargosAutomaticos()` (líneas 287-302):

```javascript
static async _generarCargosAutomaticos(connection, nominaId, quincena) {
  // 1. Obtiene empleados de la nómina
  const [employees] = await connection.query(
    'SELECT codigo_empleado FROM no_empleados_nomina WHERE id_nomina = ?',
    [nominaId]
  );

  // 2. Busca descuentos automáticos de esos empleados
  const [cargos] = await connection.query(
    `SELECT id_desc_cred, id_empleado, valor
     FROM no_desc_cred_auto
     WHERE id_empleado IN (?)
     AND (numero_de_quincena = ? OR numero_de_quincena = 0 OR numero_de_quincena IS NULL)`,
    [employeeIds, quincena]
  );

  // 3. Inserta en no_desc_cred_nomina
  const values = cargos.map(cargo => [
    nominaId,
    cargo.id_empleado,
    cargo.id_desc_cred,
    cargo.valor,
    new Date(),
    'A'  // ← 'A' = Automático
  ]);

  await connection.query(
    'INSERT INTO no_desc_cred_nomina (id_nomina, codigo_empleado, id_desc_cred, valor, fecha, automanual) VALUES ?',
    [values]
  );
}
```

### 3.2 Problema en la Generación

Cuando se genera la nómina:

1. **Todos los items de `no_desc_cred_auto` se agregan automáticamente** a `no_desc_cred_nomina`
2. Esto incluye items que deberían calcularse automáticamente (como horas extras)
3. **Resultado**: Duplicación o conflicto con cálculos automáticos

**Ejemplo de conflicto**:
- Si un empleado tiene "horas extras 35%" en `no_desc_cred_auto` con valor 1000
- Y luego se importan horas extras desde Excel
- La nómina podría tener **DOS registros** para horas extras

---

## 4. PROBLEMAS ESPECÍFICOS DETECTADOS

### 4.1 Problema 1: Campo "fijo" Mal Utilizado

**Descripción**: El campo `fijo` se usa para dos propósitos diferentes:
- Marcar items calculados automáticamente (AFP, SFS)
- Marcar items que son descuentos "fijos" del empleado (Desc de Ahorros)

**Solución propuesta**: Crear un nuevo campo `tipo_calculo` con valores:
- `'AUTO'` = Calculado automáticamente (AFP, SFS, Horas Extras, ISR)
- `'MANUAL'` = Asignable manualmente (Desc de Ahorros, Seguros)
- `'MIXTO'` = Puede ser ambos

### 4.2 Problema 2: Validación Backend No Funciona

**Descripción**: Hay 68 registros con items `fijo = 1` en `no_desc_cred_auto`, pero la validación debería impedirlo.

**Causas posibles**:
1. Los registros se crearon antes de implementar la validación
2. Hay otra ruta que inserta sin validar
3. La validación tiene un bug

**Solución propuesta**:
- Auditar todas las rutas que insertan en `no_desc_cred_auto`
- Agregar constraint en base de datos
- Limpiar registros incorrectos

### 4.3 Problema 3: Descripción Duplicada

**Descripción**: La columna `descripcion` en `no_desc_cred_auto` duplica información de `no_desc_cred`.

**Impacto**:
- Desperdicio de espacio
- Inconsistencias si se actualiza el catálogo
- Violación de normalización (2NF)

**Solución propuesta**:
- Eliminar columna `descripcion` de `no_desc_cred_auto`
- Siempre hacer JOIN con `no_desc_cred` para obtener descripción

### 4.4 Problema 4: Frontend Muestra Items Incorrectos

**Descripción**: El formulario abre el diálogo con `soloFijos: true`, mostrando items que NO deberían asignarse manualmente.

**Código problemático** (`employee-form.ts:191-194`):
```typescript
const dialogRef = this.dialog.open(NoDescCredSearchDialogComponent, {
  width: '600px',
  data: { soloFijos: true }  // ← INCORRECTO
});
```

**Solución propuesta**:
- Cambiar a `{ excluirFijos: true }` o
- Crear nuevo campo `tipo_calculo` y filtrar por `'MANUAL'`

---

## 5. SOLUCIONES PROPUESTAS

### 5.1 Solución Corto Plazo (Quick Fix)

**Objetivo**: Corregir el problema inmediatamente sin cambiar la estructura

**Paso 1**: Identificar items que SÍ deben asignarse manualmente
```sql
-- Items que SON asignables manualmente:
-- 12 = Desc de Ahorros
-- 16 = Seguros Medicos Complementarios
-- 10 = Seguro de Vida
-- 20 = DIAS LIBRES
-- 18 = Otras Extras
-- 11 = Contribucion Complementaria
-- 24 = DES. CUARTEL
-- 30 = ARMAS

UPDATE no_desc_cred
SET fijo = 0
WHERE id_desc_cred IN (12, 16, 10, 20, 18, 11, 24, 30);
```

**Paso 2**: Cambiar el diálogo en el frontend
```typescript
// employee-form.ts:191-194
const dialogRef = this.dialog.open(NoDescCredSearchDialogComponent, {
  width: '600px',
  data: { excluirFijos: true }  // ← CAMBIO: excluir items calculados automáticamente
});
```

**Paso 3**: Mantener la validación del backend
- La validación actual impedirá asignar AFP, SFS, Horas Extras (importadas), etc.

**Ventajas**:
- Rápido de implementar
- No requiere cambios de estructura
- Soluciona el problema inmediato

**Desventajas**:
- No es semánticamente correcto (campo `fijo` sigue siendo confuso)
- Puede causar confusión futura

---

### 5.2 Solución Largo Plazo (Refactorización)

**Objetivo**: Corregir el diseño del sistema para evitar confusiones futuras

#### Paso 1: Agregar Nueva Columna

```sql
ALTER TABLE no_desc_cred
ADD COLUMN tipo_calculo ENUM('AUTO', 'MANUAL', 'MIXTO') DEFAULT 'MANUAL';

-- Actualizar valores existentes
UPDATE no_desc_cred SET tipo_calculo = 'AUTO'
WHERE id_desc_cred IN (1, 2, 5, 6, 7, 8);  -- AFP, SFS, Horas Extras, Sueldo

UPDATE no_desc_cred SET tipo_calculo = 'MANUAL'
WHERE id_desc_cred IN (12, 16, 10, 20, 18, 11, 24, 30);  -- Descuentos manuales
```

#### Paso 2: Actualizar Validación Backend

```javascript
// ingresos_descuentos.js:36-49
const [itemsAuto] = await connection.execute(
  `SELECT id_desc_cred, descripcion FROM no_desc_cred
   WHERE id_desc_cred IN (?) AND tipo_calculo = 'AUTO'`,
  [ids]
);

if (itemsAuto.length > 0) {
  const descripciones = itemsAuto.map(i => i.descripcion).join(', ');
  await connection.rollback();
  return res.status(400).json({
    message: `No se pueden asignar manualmente los siguientes items (son calculados automáticamente): ${descripciones}`
  });
}
```

#### Paso 3: Actualizar Frontend

```typescript
// employee-form.ts:191-194
const dialogRef = this.dialog.open(NoDescCredSearchDialogComponent, {
  width: '600px',
  data: {
    soloManuales: true  // ← NUEVO: solo items tipo_calculo = 'MANUAL'
  }
});
```

```typescript
// no-desc-cred-search-dialog.component.ts:99-102
if (this.data?.soloManuales) {
  items = items.filter(item => item.tipo_calculo === 'MANUAL');
}
```

#### Paso 4: Eliminar Columna Redundante

```sql
-- Opcional: Eliminar descripcion de no_desc_cred_auto
ALTER TABLE no_desc_cred_auto DROP COLUMN descripcion;

-- Actualizar queries que usen descripcion
-- Siempre hacer JOIN con no_desc_cred
```

**Ventajas**:
- Diseño semánticamente correcto
- Elimina confusión
- Facilita mantenimiento futuro
- Más flexible para nuevos tipos

**Desventajas**:
- Requiere más tiempo de implementación
- Necesita actualizar múltiples archivos
- Requiere migración de datos

---

## 6. RECOMENDACIÓN

**Implementar Solución Corto Plazo INMEDIATAMENTE**, luego planificar Solución Largo Plazo:

### Fase 1 (Inmediato - 1 hora)
1. Actualizar campo `fijo` para items manuales
2. Cambiar `soloFijos: true` a `excluirFijos: true`
3. Probar que funciona correctamente

### Fase 2 (Planificado - 1 día)
1. Agregar columna `tipo_calculo`
2. Migrar datos existentes
3. Actualizar validaciones backend
4. Actualizar filtros frontend
5. Eliminar columna `descripcion` redundante
6. Actualizar tests
7. Documentar cambios

---

## 7. VERIFICACIÓN POST-IMPLEMENTACIÓN

### Tests a Realizar

1. **Test Frontend**:
   - Abrir formulario de empleado
   - Click en "Añadir Ingreso/Descuento"
   - Verificar que NO aparecen: AFP, SFS, Horas Extras (importadas)
   - Verificar que SÍ aparecen: Desc de Ahorros, Seguros

2. **Test Backend**:
   - Intentar asignar AFP manualmente → Debe rechazar
   - Intentar asignar Desc de Ahorros → Debe aceptar
   - Generar nómina → Verificar que no hay duplicados

3. **Test Integración**:
   - Crear empleado nuevo
   - Asignar descuentos fijos
   - Guardar
   - Generar nómina
   - Verificar que descuentos aparecen correctamente
   - Importar horas extras
   - Recalcular
   - Verificar que no hay duplicados

---

## 8. ARCHIVOS AFECTADOS

### Frontend
- `rangernomina-frontend/src/app/employee-form/employee-form.ts` (línea 191-194)
- `rangernomina-frontend/src/app/no-desc-cred/no-desc-cred-search-dialog/no-desc-cred-search-dialog.component.ts` (líneas 56-65, 94-106)
- `rangernomina-frontend/src/app/no-desc-cred/no-desc-cred.service.ts` (agregar interface con tipo_calculo)

### Backend
- `backend-ranger-nomina/routes/ingresos_descuentos.js` (líneas 36-49)
- `backend-ranger-nomina/models/nominaModel.js` (líneas 287-302 - verificar)
- `backend-ranger-nomina/routes/no_desc_cred.js` (si hay queries adicionales)

### Base de Datos
- `no_desc_cred` (agregar columna tipo_calculo)
- `no_desc_cred_auto` (eliminar columna descripcion - opcional)

---

## 9. CONCLUSIÓN

El problema reportado es causado por una **inconsistencia conceptual** en el uso del campo `fijo`. El sistema tiene dos interpretaciones contradictorias:

1. Frontend: "Items fijos" = descuentos/ingresos asignables al empleado
2. Backend: "Items fijos" = descuentos/ingresos calculados automáticamente

La solución corto plazo es actualizar el valor del campo `fijo` para items que SÍ deben asignarse manualmente, y cambiar el filtro del diálogo a `excluirFijos: true`.

La solución largo plazo es agregar un nuevo campo `tipo_calculo` para distinguir claramente entre items automáticos y manuales.

**Prioridad**: Alta
**Impacto**: Alto (afecta generación de nómina)
**Riesgo**: Medio (requiere cambios en frontend y backend)
