# Aclaración: AFP, ARS e ISR - Comportamiento Especial

**Fecha:** 2025-10-08

---

## 🎯 Problema Identificado

**Situación:** Se configuraron AFP y ARS con `quincena_aplicacion = 2` (solo segunda quincena), pero seguían aplicándose en la primera quincena.

**Causa:** AFP y ARS tienen un comportamiento especial diferente a otros descuentos/créditos.

---

## 📊 Descuentos de Ley: Tres Tipos Diferentes

### 1. AFP y ARS (Seguridad Social)

**Cálculo:**
- Se calculan **directamente del salario del empleado**
- **NO se insertan** en `no_desc_cred_nomina`
- Se guardan directo en `no_det_nomina.desc_afp` y `no_det_nomina.desc_sfs`

**Código:** `nominaModel.js` líneas 854-874
```javascript
const [descuentosLey] = await connection.query(
  'SELECT descripcion, empleado AS porcentaje, tope FROM no_desc_cred WHERE fijo = 1 AND origen = "D"'
);
const afpConfig = descuentosLey.find(d => d.descripcion.toUpperCase().includes('AFP'));
const sfsConfig = descuentosLey.find(d => d.descripcion.toUpperCase().includes('SFS'));

// Cálculo directo
montoAfp = (salarioCotizableAfp / 2) * (porcentaje / 100);
montoSfs = (salarioCotizableSfs / 2) * (porcentaje / 100);
```

**Importante:**
- La tabla `no_desc_cred` **solo guarda la configuración** (porcentaje, tope)
- El campo `quincena_aplicacion` en `no_desc_cred` **NO afecta** el cálculo de AFP/ARS
- **Siempre se calculan en ambas quincenas** (obligatorio por ley dominicana)

**¿Por qué?**
- Son descuentos obligatorios por ley
- Deben aplicarse siempre, independientemente de la configuración
- El cálculo es automático y no se puede desactivar

---

### 2. ISR (Impuesto Sobre la Renta)

**Cálculo:**
- Se calcula del **ingreso bruto del empleado**
- Se controla mediante el campo `isr` en la tabla `no_nominas` (NOT `no_desc_cred`)
- Se guarda en `no_det_nomina.desc_isr`

**Código:** `nominaModel.js` líneas 900-922
```javascript
const aplicarISR = isr === 1 || isr === true || isr === null || isr === undefined;

if (aplicarISR) {
  // Calcular ISR
  desc_isr = await isrService.calcularISR(...);
} else {
  // No calcular ISR
  desc_isr = 0;
}
```

**Control:**
- **Campo `no_nominas.isr`**: Activa/desactiva cálculo por nómina
- **Campo `no_nominas.id_nomina_isr`**: Vincula nóminas para cálculo acumulativo
- El campo `quincena_aplicacion` en `no_desc_cred` **NO afecta** el ISR

**Configuraciones típicas:**
- 1ra quincena: `isr = 0` → ISR = 0
- 2da quincena: `isr = 1`, `id_nomina_isr = [1ra]` → ISR total mensual

---

### 3. Otros Descuentos/Créditos Manuales

**Ejemplos:** Préstamos, bonos, horas extras, anticipos

**Cálculo:**
- Se insertan en `no_desc_cred_nomina`
- **SÍ usan** el filtro `quincena_aplicacion`

**Código:** `nominaModel.js` líneas 876-887
```javascript
SELECT ... FROM no_desc_cred_nomina ndcn
JOIN no_desc_cred ndc ON ndcn.id_desc_cred = ndc.id_desc_cred
WHERE ndcn.id_nomina = ?
  AND (ndc.quincena_aplicacion = 0 OR ndc.quincena_aplicacion = ?)
```

**Control:**
- **Campo `no_desc_cred.quincena_aplicacion`**:
  - `0` = Ambas quincenas
  - `1` = Solo primera quincena
  - `2` = Solo segunda quincena

---

## 📋 Resumen Comparativo

| Concepto | Dónde se calcula | Dónde se guarda | Usa filtro quincena | Cómo se controla |
|----------|------------------|-----------------|---------------------|------------------|
| **AFP** | Directo del salario | `no_det_nomina.desc_afp` | ❌ NO | Siempre se aplica |
| **ARS/SFS** | Directo del salario | `no_det_nomina.desc_sfs` | ❌ NO | Siempre se aplica |
| **ISR** | Del ingreso bruto | `no_det_nomina.desc_isr` | ❌ NO | Campo `no_nominas.isr` |
| **Otros** | Manual | `no_desc_cred_nomina` | ✅ SÍ | Campo `no_desc_cred.quincena_aplicacion` |

---

## ⚙️ Configuración Correcta

### AFP y ARS en `no_desc_cred`

**SIEMPRE deben tener:**
```sql
UPDATE no_desc_cred
SET quincena_aplicacion = 0  -- Ambas quincenas
WHERE fijo = 1
  AND origen = 'D'
  AND (descripcion LIKE '%AFP%' OR descripcion LIKE '%SFS%' OR descripcion LIKE '%ARS%');
```

**Razón:**
- Aunque el campo `quincena_aplicacion` no afecta el cálculo
- Mantener `0` evita confusión
- Documenta que aplican en ambas quincenas

---

### ISR en `no_desc_cred`

**Puede tener cualquier valor:**
- El campo `quincena_aplicacion` **NO afecta** el ISR
- El ISR se controla desde `no_nominas.isr`

**Si existe en `no_desc_cred`:**
- Es solo referencia histórica
- El cálculo real se hace en `nominaModel.js`
- No se inserta en `no_desc_cred_nomina`

---

### Otros Descuentos/Créditos

**Configurar según necesidad:**
```sql
-- Bono quincenal (ambas)
UPDATE no_desc_cred SET quincena_aplicacion = 0 WHERE id_desc_cred = X;

-- Préstamo mensual (solo 2da)
UPDATE no_desc_cred SET quincena_aplicacion = 2 WHERE id_desc_cred = Y;

-- Comisión (solo 1ra)
UPDATE no_desc_cred SET quincena_aplicacion = 1 WHERE id_desc_cred = Z;
```

---

## 🔧 Script de Corrección Aplicado

**Archivo:** `migrations/fix_afp_ars_quincena.js`

**Acción:**
```
AFP: quincena_aplicacion 2 → 0 ✓
ARS: quincena_aplicacion 2 → 0 ✓
```

**Resultado:**
- AFP y ARS ahora tienen `quincena_aplicacion = 0`
- Siguen aplicándose en ambas quincenas (como siempre)
- Configuración ahora es consistente con el comportamiento

---

## ❓ Preguntas Frecuentes

### ¿Por qué AFP y ARS no respetan `quincena_aplicacion`?

**R:** Porque se calculan directamente del salario, no pasan por el sistema de `no_desc_cred_nomina`. Son obligatorios por ley y siempre deben aplicarse.

### ¿Puedo desactivar AFP o ARS en una quincena?

**R:** No. Son descuentos de ley obligatorios en República Dominicana. Deben aplicarse siempre.

### ¿Cómo controlo el ISR por quincena?

**R:** Usa los campos en `no_nominas`:
- `isr = 1` → Calcular ISR
- `isr = 0` → NO calcular ISR
- `id_nomina_isr` → Vincular con nómina anterior para cálculo mensual

Ver guía completa: [GUIA_USUARIO_CONFIGURACION_ISR.md](GUIA_USUARIO_CONFIGURACION_ISR.md)

### ¿Qué descuentos SÍ usan `quincena_aplicacion`?

**R:** Solo los descuentos/créditos manuales que se insertan en `no_desc_cred_nomina`:
- Préstamos
- Bonos
- Anticipos
- Horas extras
- Cualquier otro ingreso/descuento no fijo

---

## 🎯 Conclusión

**Para descuentos de ley (AFP, ARS, ISR):**
- **NO usar** `quincena_aplicacion` en `no_desc_cred`
- Se controlan de forma especial en el código
- AFP/ARS: Siempre en ambas quincenas
- ISR: Controlado por `no_nominas.isr`

**Para otros descuentos/créditos:**
- **SÍ usar** `quincena_aplicacion`
- Funciona correctamente con el filtro implementado

---

**Corrección aplicada:** ✅ 2025-10-08
**Script ejecutado:** `fix_afp_ars_quincena.js`
