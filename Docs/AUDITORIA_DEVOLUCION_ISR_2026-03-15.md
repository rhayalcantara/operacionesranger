# Auditoría: Implementación de Devolución Automática de ISR

**Fecha:** 2026-03-15
**Autor:** Claude Code (Opus 4.6)
**Módulo afectado:** Nómina - Cálculo de ISR

---

## 1. Problema Detectado

Cuando un empleado tiene ingresos fijos (vía `no_desc_cred_auto`) en la primera quincena (Q1) que lo hacen superar el umbral de ISR, se le retiene ISR. Si en la segunda quincena (Q2) esos ingresos fijos se eliminan o reducen, el ISR mensual total resulta menor que lo ya retenido en Q1.

**Comportamiento anterior:** El campo `desc_isr` en `no_det_nomina` se volvía **negativo** (ej: -82.31), lo que:

- Era contablemente incorrecto (un descuento no puede ser negativo)
- La devolución era invisible en reportes y estado de cuenta
- No había trazabilidad del motivo del ajuste

### Caso real detectado

**Empleado:** ROBERT HERRERA ROSARIO (id_empleado: 8179)
**Nóminas afectadas:** Febrero 2026

| Nómina | ID | desc_isr (ANTES) |
|--------|----|------------------|
| ADMINISTRATIVA FEBRERO Q.01 | 22 | 82.31 |
| ADMINISTRATIVA FEBRERO Q.02 | 23 | **-82.31** |

---

## 2. Solución Implementada

Se creó un concepto de ingreso **"Devolución de ISR"** manejado exclusivamente por el sistema. Cuando se detecta que el ISR resulta negativo en el recálculo, en lugar de dejar el descuento negativo, se:

1. Pone `desc_isr = 0` (nunca negativo)
2. Crea un registro de ingreso "Devolución de ISR" en `no_desc_cred_nomina` por el monto correspondiente
3. Suma ese monto a `otros_ingresos` para mantener el pago neto correcto

### Resultado después de la corrección

| Campo | Antes | Después |
|-------|-------|---------|
| `desc_isr` (Q2) | -82.31 | **0.00** |
| `otros_ingresos` (Q2) | 0.00 | **82.31** |
| Registro "Devolución de ISR" | No existía | **RD$82.31** (automanual='A') |
| `total_pagar` (Q2) | 13,195.81 | **13,195.81** (sin cambio) |

El empleado recibe el mismo monto neto, pero la contabilidad es correcta y la devolución es visible y trazable.

---

## 3. Archivos Modificados

### 3.1 Nuevo: `backend-ranger-nomina/migrations/add_devolucion_isr.sql`

Script de migración que inserta el concepto "Devolución de ISR" en la tabla `no_desc_cred`:

```sql
INSERT INTO no_desc_cred (descripcion, origen, fijo, valorporciento, empleado, compania, tope, maneja_cuotas, quincena_aplicacion)
SELECT 'Devolución de ISR', 'I', 1, 'V', 0, 0, 0, 0, 0
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM no_desc_cred WHERE descripcion = 'Devolución de ISR');
```

- `origen = 'I'`: Es un ingreso
- `fijo = 1`: Manejado por el sistema, no asignable manualmente
- Se insertó con `id_desc_cred = 37`

**Estado:** Ejecutada exitosamente en la base de datos.

---

### 3.2 Modificado: `backend-ranger-nomina/models/nominaModel.js`

#### a) Función helper `getIdDevolucionISR()` (líneas 7-17)

Se agregó una función con caché para obtener el `id_desc_cred` de "Devolución de ISR" sin consultar la BD en cada iteración.

#### b) Exclusión en query de `otrosMovimientos` (línea 968)

Se añadió `AND ndcn.id_desc_cred != ?` (con el ID de devolución) al query que suma los otros ingresos, para evitar doble conteo cuando se recalcula múltiples veces.

#### c) Lógica de devolución después del cálculo de ISR (líneas 1015-1042)

```
Si desc_isr < 0:
  → montoDevolucionISR = abs(desc_isr)
  → desc_isr = 0
  → Upsert registro "Devolución de ISR" en no_desc_cred_nomina (automanual='A')

Si desc_isr >= 0:
  → Eliminar registro de devolución previo si existía (limpieza)
```

#### d) Cálculo de totales (líneas 1044-1047)

Se usa `otros_ingresos_final = otros_ingresos + montoDevolucionISR` para que el `total_ingreso` y `total_pagar` reflejen correctamente la devolución.

---

### 3.3 Modificado: `backend-ranger-nomina/routes/descCredNomina.js`

Se agregó validación en el middleware `isNominaActiva` (usado por PUT y DELETE) para impedir que los usuarios editen o eliminen registros generados automáticamente por el sistema:

```javascript
if (idDevISR && registro.id_desc_cred === idDevISR && registro.automanual === 'A') {
  return res.status(403).json({
    message: 'No se puede modificar un registro generado automáticamente por el sistema.'
  });
}
```

---

### 3.4 Modificado: `backend-ranger-nomina/routes/no_desc_cred.js`

El endpoint `/selector` (usado por el frontend para el dropdown de creación manual de ingresos/descuentos) ahora excluye "Devolución de ISR":

```sql
SELECT * FROM no_desc_cred WHERE descripcion != 'Devolución de ISR' ORDER BY descripcion
```

Esto impide que los usuarios asignen manualmente este concepto. Solo el sistema puede crear registros de este tipo.

**Nota:** El endpoint `/no-fijos` ya lo excluía automáticamente por el filtro `WHERE fijo = 0`.

---

### 3.5 Modificado: `rangernomina-frontend/.../mantenimiento-desc-cred-nomina.component.html`

Los botones de editar y eliminar se ocultan para registros con `automanual === 'A'`, mostrando la etiqueta "Sistema" en su lugar:

```html
<ng-container *ngIf="element.automanual !== 'A'">
  <!-- botones editar/eliminar -->
</ng-container>
<span *ngIf="element.automanual === 'A'" class="system-label">Sistema</span>
```

---

### 3.6 Modificado: `rangernomina-frontend/.../mantenimiento-desc-cred-nomina.component.css`

Se agregó el estilo para la etiqueta "Sistema":

```css
.system-label {
  color: rgba(0, 0, 0, 0.45);
  font-style: italic;
  font-size: 12px;
}
```

---

### 3.7 Modificado: `rangernomina-frontend/.../desc-cred-nomina.html` y `desc-cred-nomina.css`

Mismos cambios de protección de botones y estilo `.system-label` aplicados en la vista de creación manual de ingresos/descuentos.

---

## 4. Comportamiento del Sistema

### Escenario: Devolución de ISR

1. Se crea nómina Q1 con ingresos fijos que generan ISR
2. Se crea nómina Q2 vinculada (`id_nomina_isr = Q1`) sin esos ingresos fijos
3. Al recalcular Q2:
   - ISR mensual total < ISR retenido en Q1
   - `desc_isr` se pone en 0
   - Se crea ingreso "Devolución de ISR" por la diferencia
   - El pago neto del empleado refleja la devolución

### Escenario: Limpieza automática

1. Si luego se agregan ingresos a Q2 que restauran el ISR positivo
2. Al recalcular Q2:
   - ISR mensual total >= ISR retenido en Q1
   - `desc_isr` queda positivo
   - El registro de "Devolución de ISR" se elimina automáticamente

### Escenario: Protección de registros

- Los registros de "Devolución de ISR" no pueden ser editados ni eliminados por el usuario
- El concepto no aparece en los selectores de creación manual
- En las tablas del frontend se muestra "Sistema" en lugar de botones de acción

---

## 5. Estado de Cuenta y Reportes

La "Devolución de ISR" aparece automáticamente en:

- **Estado de cuenta del empleado** — como ingreso (via JOIN con `no_desc_cred`)
- **Reporte agrupado de ingresos y descuentos** — agrupada bajo ingresos
- **Auditoría de ingresos y descuentos** — con etiqueta "Sistema" y origen "Automático"

No se requirieron cambios adicionales en estos módulos ya que los JOINs existentes con `no_desc_cred` la incluyen automáticamente.

---

## 6. Nota sobre Encoding

Durante la ejecución de la migración SQL se detectó un problema de encoding con el carácter "ó" en "Devolución". Se corrigió ejecutando:

```sql
UPDATE no_desc_cred SET descripcion = 'Devolución de ISR' WHERE id_desc_cred = 37;
```

Con `--default-character-set=utf8mb4` para asegurar el encoding correcto (UTF-8: `C3 B3`).

---

## 7. Tabla de Cambios en Base de Datos

| Tabla | Registro | Cambio |
|-------|----------|--------|
| `no_desc_cred` | id=37 | **Nuevo** - Concepto "Devolución de ISR" |
| `no_desc_cred_nomina` | id_nomina=23, empleado=8179 | **Nuevo** - Devolución RD$82.31 (automanual='A') |
| `no_det_nomina` | id_nomina=23, empleado=8179 | **Actualizado** - desc_isr: -82.31 → 0, otros_ingresos: 0 → 82.31 |
