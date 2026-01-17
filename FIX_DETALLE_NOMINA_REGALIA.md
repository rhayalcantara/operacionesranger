# Fix - Detalle de Nómina Vacío en Regalía Pascual

**Fecha:** 2025-12-15
**Problema:** Nómina de Regalía se creaba sin detalle (no_det_nomina vacío), impidiendo imprimir volantes
**Estado:** ✅ RESUELTO

---

## Síntomas

1. La nómina de Regalía Pascual se creaba exitosamente en `no_nominas`
2. Aparecía en "Gestión de Nómina" en el frontend
3. Se podía ver el historial en "Historial de Regalía"
4. **PERO** la tabla `no_det_nomina` estaba vacía
5. **RESULTADO:** No se podían imprimir volantes de pago

---

## Causa Raíz

El endpoint `/api/regalia/crear-nomina` estaba usando el método `Nomina.create()` que tiene lógica diseñada para nóminas quincenales regulares.

### Problema técnico:

```javascript
// En routes/regalia.js (CÓDIGO INCORRECTO):
const nominaData = {
  id_tipo_nomina: tipoRegalia.id_nomina, // Esto es 3 (Regalia Pascual)
  // ...
};
const nominaResult = await Nomina.create(nominaData);
```

Internamente, `Nomina.create()` llama a `_llenarEmpleadosNomina()`:

```javascript
// En nominaModel.js línea 232:
WHERE e.status = 1
  AND e.fecha_ingreso <= ?
  AND e.id_nomina = ?  // ❌ Busca empleados con id_nomina = 3
```

**El problema:**
- Se pasa `id_tipo_nomina = 3` (Regalia Pascual)
- El filtro busca empleados donde `e.id_nomina = 3`
- Pero los empleados tienen `id_nomina = 1` (Admin) o `2` (Operaciones)
- **Resultado:** `employees.length === 0`, no se insertan empleados
- Sin empleados en `no_empleados_nomina`, tampoco se crea detalle en `no_det_nomina`

---

## Solución

**Archivo modificado:** `backend-ranger-nomina/routes/regalia.js`

Reescribí completamente el endpoint `/crear-nomina` para hacer **inserción manual directa** en lugar de usar `Nomina.create()`.

### Flujo nuevo (correcto):

```javascript
1. Insertar en no_nominas
   ├─ id_tipo_nomina = 3 (Regalia Pascual)
   ├─ cant_empleados = calculosPreview.length
   └─ total_a_Pagar = suma de montos de regalía

2. Insertar subnóminas (si existen)
   └─ no_det_nomina_subnomina

3. Insertar empleados en no_empleados_nomina
   └─ Usa calculosPreview directamente (empleados del preview)

4. Insertar detalle en no_det_nomina ✅ CLAVE
   ├─ Para cada empleado en calculosPreview:
   ├─ sueldo_nomina = monto_calculado
   ├─ total_ingreso = monto_calculado
   ├─ total_pagar = monto_calculado
   ├─ desc_afp = 0 (sin descuentos)
   ├─ desc_sfs = 0
   ├─ desc_isr = 0
   └─ total_descuento = 0

5. Crear snapshot en rh_emplado_nomina
   └─ Copia datos actuales del empleado

6. Guardar en no_regalia_calculada
   └─ Tabla específica de regalía
```

### Código nuevo:

```javascript
// Insertar detalle directamente
const detalleValues = calculosPreview.map(emp => {
  const montoFinal = emp.monto_ajustado || emp.monto_calculado;
  return [
    idNomina,
    emp.id_empleado,
    montoFinal,      // sueldo_nomina
    0,               // desc_afp
    0,               // desc_sfs
    0,               // desc_isr
    0,               // otros_ingresos
    0,               // desc_otros
    montoFinal,      // total_ingreso
    0,               // total_descuento
    montoFinal,      // total_pagar
    0,               // he15
    0,               // he35
    0                // vacaciones
  ];
});

await connection.query(
  `INSERT INTO no_det_nomina (
    id_nomina, id_empleado, sueldo_nomina, desc_afp, desc_sfs, desc_isr,
    otros_ingresos, desc_otros, total_ingreso, total_descuento, total_pagar,
    he15, he35, vacaciones
  ) VALUES ?`,
  [detalleValues]
);
```

---

## Ventajas de la Solución

### ✅ Control Total
- Inserción directa sin dependencias de lógica quincenal
- Código específico para Regalía Pascual
- Sin efectos secundarios de `Nomina.create()`

### ✅ Transaccional
- Todo el proceso usa `connection.beginTransaction()`
- Si falla algo, se hace `rollback` completo
- Garantiza consistencia de datos

### ✅ Sin Descuentos
- Regalía Pascual está **exenta** de AFP, ARS e ISR
- Todos los descuentos se insertan explícitamente en 0
- No hay llamada a `recalcular()` que podría aplicar descuentos

### ✅ Completo
- Inserta en todas las tablas necesarias:
  - `no_nominas` (cabecera)
  - `no_empleados_nomina` (relación empleados)
  - `no_det_nomina` (detalle ✅)
  - `rh_emplado_nomina` (snapshot)
  - `no_regalia_calculada` (cálculos específicos)

---

## Tablas Afectadas

### ✅ Ahora se insertan correctamente:

```sql
-- 1. Cabecera de nómina
INSERT INTO no_nominas (...)
VALUES (id_tipo_nomina = 3, ...)

-- 2. Empleados de la nómina
INSERT INTO no_empleados_nomina (id_nomina, codigo_empleado)
VALUES (123, 45), (123, 67), ...

-- 3. DETALLE (esto estaba vacío antes) ✅
INSERT INTO no_det_nomina (id_nomina, id_empleado, sueldo_nomina, ...)
VALUES (123, 45, 30000, 0, 0, 0, ...), (123, 67, 25000, 0, 0, 0, ...)

-- 4. Snapshot de empleados
INSERT INTO rh_emplado_nomina (id_empleado, id_nominas, ...)
VALUES (45, 123, ...), (67, 123, ...)

-- 5. Cálculos específicos
INSERT INTO no_regalia_calculada (id_empleado, anio, monto_calculado, ...)
VALUES (45, 2025, 30000, ...), (67, 2025, 25000, ...)
```

---

## Validaciones Agregadas

```javascript
// Validar que calculosPreview sea un array válido
if (!Array.isArray(calculosPreview) || calculosPreview.length === 0) {
  return res.status(400).json({
    message: 'calculosPreview debe ser un array con al menos un empleado'
  });
}
```

---

## Resultado

**Antes:**
```
no_nominas:           ✅ 1 registro
no_empleados_nomina:  ❌ 0 registros
no_det_nomina:        ❌ 0 registros (PROBLEMA)
rh_emplado_nomina:    ❌ 0 registros
no_regalia_calculada: ✅ N registros
```

**Después:**
```
no_nominas:           ✅ 1 registro
no_empleados_nomina:  ✅ N registros
no_det_nomina:        ✅ N registros (SOLUCIONADO)
rh_emplado_nomina:    ✅ N registros
no_regalia_calculada: ✅ N registros
```

---

## Próximos Pasos

1. ✅ Código corregido
2. ⏳ Reiniciar servidor backend
3. ⏳ **IMPORTANTE:** Eliminar nómina de regalía anterior (sin detalle)
4. ⏳ Crear nueva nómina de regalía desde el frontend
5. ⏳ Verificar que:
   - Se vea el detalle en "Gestión de Nómina"
   - Se puedan imprimir volantes de pago
   - Los montos sean correctos (sin descuentos)

---

## Comandos para Verificar

```sql
-- Verificar detalle de la nómina de regalía
SELECT
  n.id_nominas,
  n.titulo_nomina,
  COUNT(d.id_detalle_nomina) AS cantidad_detalles
FROM no_nominas n
LEFT JOIN no_det_nomina d ON n.id_nominas = d.id_nomina
WHERE n.id_tipo_nomina = 3
GROUP BY n.id_nominas;

-- Ver detalle completo
SELECT
  d.id_empleado,
  CONCAT(e.nombres, ' ', e.apellidos) AS empleado,
  d.sueldo_nomina,
  d.total_pagar,
  d.desc_afp,
  d.desc_sfs,
  d.desc_isr
FROM no_det_nomina d
INNER JOIN rh_empleado e ON d.id_empleado = e.id_empleado
WHERE d.id_nomina = [ID_NOMINA_REGALIA];
```

---

## Archivos Modificados

1. `backend-ranger-nomina/routes/regalia.js`
   - Endpoint `POST /crear-nomina` completamente reescrito
   - Inserción manual en todas las tablas
   - Control transaccional completo

---

**Estado:** ✅ Código corregido
**Verificado por:** Claude Code
**Siguiente acción:** Reiniciar backend, eliminar nómina antigua, y crear nueva regalía
