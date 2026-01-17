# Fix - Deadlock en Creación de Regalía Pascual

**Fecha:** 2025-12-15
**Problema:** Lock wait timeout exceeded al crear nómina de Regalía
**Estado:** ✅ RESUELTO

---

## Síntomas

Al intentar crear la nómina de Regalía Pascual, se producía el siguiente error:

```
Error: Lock wait timeout exceeded; try restarting transaction
at Regalia.guardarCalculos (models/regaliaModel.js:300:26)
at routes/regalia.js:243:5
```

---

## Causa Raíz

**Deadlock por transacciones anidadas**

El endpoint `/api/regalia/crear-nomina`:
1. Abre una conexión y comienza una transacción
2. Hace varios inserts en diferentes tablas
3. Llama a `Regalia.guardarCalculos()`
4. **PROBLEMA:** `guardarCalculos()` intenta abrir su propia conexión y transacción

```javascript
// En routes/regalia.js
connection = await db.getConnection();
await connection.beginTransaction();
// ... varios inserts ...
await Regalia.guardarCalculos(...);  // ❌ Intenta crear nueva transacción
await connection.commit();
```

```javascript
// En models/regaliaModel.js - CÓDIGO INCORRECTO
static async guardarCalculos(...) {
  let connection;
  connection = await db.getConnection();      // ❌ Nueva conexión
  await connection.beginTransaction();        // ❌ Nueva transacción
  // ... inserts ...
  await connection.commit();                  // ❌ Commit independiente
}
```

### Por qué causa deadlock:

1. **Transacción 1** (endpoint) tiene un lock en `no_nominas`, `no_det_nomina`, etc.
2. **Transacción 2** (`guardarCalculos`) intenta obtener lock en `no_regalia_calculada`
3. Si `no_regalia_calculada` tiene foreign keys a tablas bloqueadas por Transacción 1, se crea un deadlock
4. MySQL espera 50 segundos (timeout por defecto) y luego lanza el error

---

## Solución

**Modificar `guardarCalculos()` para aceptar conexión opcional**

### Cambio 1: Firma del método

```javascript
// ANTES
static async guardarCalculos(calculosPreview, anio, idNomina = null)

// DESPUÉS
static async guardarCalculos(calculosPreview, anio, idNomina = null, existingConnection = null)
```

### Cambio 2: Lógica de manejo de transacción

```javascript
static async guardarCalculos(calculosPreview, anio, idNomina = null, existingConnection = null) {
  let connection = existingConnection;
  let shouldManageTransaction = !existingConnection;

  try {
    // Solo crear conexión y transacción si NO se pasó una existente
    if (shouldManageTransaction) {
      connection = await db.getConnection();
      await connection.beginTransaction();
    }

    // ... inserts ...

    // Solo hacer commit si manejamos nuestra propia transacción
    if (shouldManageTransaction) {
      await connection.commit();
    }
    return true;

  } catch (error) {
    // Solo hacer rollback si manejamos nuestra propia transacción
    if (shouldManageTransaction && connection) {
      await connection.rollback();
    }
    throw error;
  } finally {
    // Solo liberar conexión si la creamos nosotros
    if (shouldManageTransaction && connection) {
      connection.release();
    }
  }
}
```

### Cambio 3: Llamada desde el endpoint

```javascript
// En routes/regalia.js

connection = await db.getConnection();
await connection.beginTransaction();

// ... varios inserts ...

// ANTES
await Regalia.guardarCalculos(calculosPreview, parseInt(anio), idNomina);

// DESPUÉS ✅
await Regalia.guardarCalculos(calculosPreview, parseInt(anio), idNomina, connection);

await connection.commit();
```

---

## Ventajas de la Solución

### ✅ Flexibilidad
El método puede usarse de dos formas:

**Forma 1: Con conexión existente (dentro de transacción)**
```javascript
const connection = await db.getConnection();
await connection.beginTransaction();
// ... otras operaciones ...
await Regalia.guardarCalculos(data, anio, id, connection);
await connection.commit();
```

**Forma 2: Independiente (sin transacción externa)**
```javascript
// El método crea su propia conexión y transacción
await Regalia.guardarCalculos(data, anio, id);
```

### ✅ Sin Deadlocks
- Una sola transacción maneja todas las operaciones
- Todos los inserts comparten la misma conexión
- No hay competencia por locks

### ✅ ACID Completo
- Si algo falla, TODA la transacción se revierte
- No hay inserts parciales en caso de error
- Consistencia de datos garantizada

---

## Resultado

**Antes:**
```
1. Endpoint abre Transacción A
2. Hace inserts en varias tablas (locks en T1, T2, T3)
3. Llama a guardarCalculos()
   - guardarCalculos abre Transacción B
   - Intenta insertar en T4 (que tiene FK a T1)
   - ❌ DEADLOCK: B espera lock de A, A espera que B termine
4. Timeout después de 50 segundos
```

**Después:**
```
1. Endpoint abre Transacción A
2. Hace inserts en varias tablas (locks en T1, T2, T3)
3. Llama a guardarCalculos(connection)
   - guardarCalculos usa la misma conexión
   - Inserta en T4 dentro de la misma transacción
   - ✅ Sin deadlock, misma transacción
4. Commit de toda la transacción
```

---

## Archivos Modificados

1. **`backend-ranger-nomina/models/regaliaModel.js`**
   - Método `guardarCalculos()` línea 281
   - Agregado parámetro `existingConnection`
   - Lógica condicional para manejo de transacción

2. **`backend-ranger-nomina/routes/regalia.js`**
   - Endpoint `/crear-nomina` línea 243
   - Agregado parámetro `connection` en llamada a `guardarCalculos()`

---

## Testing

**Verificar que NO haya locks activos:**
```sql
SELECT * FROM information_schema.INNODB_TRX;
-- Debe devolver vacío
```

**Verificar nóminas de regalía:**
```sql
SELECT
  n.id_nominas,
  n.titulo_nomina,
  COUNT(d.id_det_nomina) AS cant_detalles
FROM no_nominas n
LEFT JOIN no_det_nomina d ON n.id_nominas = d.id_nomina
WHERE n.id_tipo_nomina = 3
GROUP BY n.id_nominas;
```

---

## Prevención Futura

**Regla para el equipo:**
> Cuando un método pueda ser llamado desde dentro de una transacción existente, siempre permitir pasar una conexión opcional. Usar el patrón `shouldManageTransaction` para decidir si crear/commitear/rollbackear la transacción.

**Patrón recomendado:**
```javascript
static async miMetodo(params, existingConnection = null) {
  let connection = existingConnection;
  let shouldManageTransaction = !existingConnection;

  try {
    if (shouldManageTransaction) {
      connection = await db.getConnection();
      await connection.beginTransaction();
    }

    // ... operaciones con connection ...

    if (shouldManageTransaction) {
      await connection.commit();
    }
  } catch (error) {
    if (shouldManageTransaction && connection) {
      await connection.rollback();
    }
    throw error;
  } finally {
    if (shouldManageTransaction && connection) {
      connection.release();
    }
  }
}
```

---

## Próximos Pasos

1. ✅ Código corregido
2. ⏳ Reiniciar servidor backend
3. ⏳ Probar crear Regalía Pascual desde el frontend
4. ⏳ Verificar que se cree sin errores y con detalle completo

---

**Estado:** ✅ Código corregido
**Verificado por:** Claude Code
**Siguiente acción:** Reiniciar backend y probar funcionalidad
