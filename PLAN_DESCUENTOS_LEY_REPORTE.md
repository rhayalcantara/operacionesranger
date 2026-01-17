# Plan: Incluir Descuentos de Ley (AFP, SFS, ISR) en el Reporte

**Fecha de creación:** 2025-11-08
**Última actualización:** 2025-11-08 (Análisis inicial)

---

## Problema Identificado

Los descuentos **AFP, SFS (ARS) e ISR** NO aparecen en el reporte de descuentos/créditos porque:

1. **Descuentos manuales** se guardan en: `no_desc_cred_nomina` (tabla que usa el reporte actual)
2. **Descuentos de ley** se guardan en: `no_det_nomina` (tabla diferente)

### Estructura Actual de Tablas

#### Tabla: `no_desc_cred_nomina`
- Almacena: Descuentos/Ingresos **manuales** o **automáticos** por cuotas
- Campos clave: `codigo_empleado`, `id_nomina`, `id_desc_cred`, `valor`, `fecha`
- Relación: `id_desc_cred` → `no_desc_cred.id_desc_cred`

#### Tabla: `no_det_nomina`
- Almacena: Detalle completo de cada empleado en una nómina
- Campos de descuentos de ley:
  - `desc_afp` - Descuento AFP (pensiones)
  - `desc_sfs` - Descuento SFS/ARS (seguro de salud)
  - `desc_isr` - Descuento ISR (impuesto sobre la renta)
- Campos: `id_nomina`, `id_empleado`, `sueldo_nomina`, etc.

---

## Opciones de Solución

### Opción 1: Reporte Separado para Descuentos de Ley ⭐ RECOMENDADA
**Descripción:** Crear un endpoint y componente separado específico para descuentos de ley.

**Ventajas:**
- ✅ Separación clara de responsabilidades
- ✅ No modifica el reporte actual (menos riesgo)
- ✅ Permite análisis específico de descuentos de ley
- ✅ Más fácil de mantener

**Desventajas:**
- ⚠️ Requiere crear componente adicional
- ⚠️ Usuario necesita ir a dos lugares diferentes

**Implementación:**
1. Nuevo endpoint: `GET /api/no_nomina/:nominaId/descuentos-ley`
2. Nuevo componente: `reporte-descuentos-ley.component.ts`
3. Muestra tabla con columnas: Empleado, AFP, SFS, ISR, Total
4. Resumen: Total AFP, Total SFS, Total ISR, Total General

---

### Opción 2: Unificar en el Reporte Actual (UNION)
**Descripción:** Modificar el reporte actual para incluir ambas fuentes de datos.

**Ventajas:**
- ✅ Todo en un solo lugar
- ✅ Vista consolidada de todos los descuentos

**Desventajas:**
- ⚠️ Más complejo: necesita UNION de dos consultas
- ⚠️ AFP, SFS, ISR no tienen `id_desc_cred` asociado
- ⚠️ Dificultad para filtrar por concepto (no aplica para AFP/SFS/ISR)
- ⚠️ Puede confundir al usuario (mezcla conceptos diferentes)

**Problemas técnicos:**
- Los descuentos de ley NO tienen `id_desc_cred` (no están en `no_desc_cred`)
- El filtro por concepto no funcionaría para AFP/SFS/ISR
- Necesitaría crear conceptos "virtuales" para AFP, SFS, ISR

---

### Opción 3: Agregar Toggle en el Reporte Actual
**Descripción:** Agregar un switch para elegir entre "Descuentos Manuales" o "Descuentos de Ley".

**Ventajas:**
- ✅ Un solo componente
- ✅ Usuario elige qué ver

**Desventajas:**
- ⚠️ Lógica condicional compleja
- ⚠️ Dos flujos diferentes en el mismo componente
- ⚠️ Menos intuitivo

---

### Opción 4: Reporte Consolidado con Pestañas (Tabs)
**Descripción:** Un componente con tabs: "Descuentos Manuales" | "Descuentos de Ley" | "Todos"

**Ventajas:**
- ✅ Todo en un solo lugar
- ✅ Separación visual clara
- ✅ Permite vista consolidada opcional

**Desventajas:**
- ⚠️ Más complejo de implementar
- ⚠️ Requiere tres consultas diferentes

---

## Análisis Detallado: Tabla no_det_nomina

### Campos Relevantes
```sql
SELECT
  id_nomina,
  id_empleado,
  desc_afp,      -- Descuento AFP
  desc_sfs,      -- Descuento SFS/ARS
  desc_isr,      -- Descuento ISR
  desc_otros,    -- Otros descuentos
  total_descuento
FROM no_det_nomina
WHERE id_nomina = ?
```

### Consulta para Reporte de Descuentos de Ley
```sql
SELECT
  dn.id_empleado,
  CONCAT(e.nombres, ' ', e.apellidos) AS nombre_completo,
  dn.desc_afp,
  dn.desc_sfs,
  dn.desc_isr,
  (dn.desc_afp + dn.desc_sfs + dn.desc_isr) AS total_descuentos_ley
FROM no_det_nomina dn
JOIN rh_empleado e ON dn.id_empleado = e.id_empleado
WHERE dn.id_nomina = ?
ORDER BY e.apellidos, e.nombres
```

### Totales a Calcular
```javascript
{
  totalAFP: SUM(desc_afp),
  totalSFS: SUM(desc_sfs),
  totalISR: SUM(desc_isr),
  totalGeneral: SUM(desc_afp + desc_sfs + desc_isr),
  cantidadEmpleados: COUNT(DISTINCT id_empleado),
  cantidadRegistros: COUNT(*)
}
```

---

## Recomendación Final: OPCIÓN 1

### Por qué Opción 1 es la mejor:

1. **Claridad conceptual:**
   - Descuentos manuales (no_desc_cred_nomina) vs Descuentos de ley (no_det_nomina)
   - Son datos fundamentalmente diferentes

2. **Simplicidad:**
   - No complica el reporte actual
   - Código más limpio y mantenible

3. **Flexibilidad:**
   - Permite análisis específico de descuentos de ley
   - Facilita futuras expansiones

4. **UX intuitiva:**
   - Dos reportes claros en el menú
   - Usuario sabe exactamente qué está viendo

---

## Plan de Implementación (Opción 1)

### Backend

#### 1. Crear método en DetNominaModel
**Archivo:** `backend-ranger-nomina/models/detNominaModel.js`

```javascript
static async getReporteDescuentosLey(nominaId) {
  const [rows] = await db.query(
    `SELECT
      dn.id_empleado,
      CONCAT(e.nombres, ' ', e.apellidos) AS nombre_completo,
      dn.desc_afp,
      dn.desc_sfs,
      dn.desc_isr,
      (dn.desc_afp + dn.desc_sfs + dn.desc_isr) AS total_descuentos_ley
    FROM no_det_nomina dn
    JOIN rh_empleado e ON dn.id_empleado = e.id_empleado
    WHERE dn.id_nomina = ?
    ORDER BY e.apellidos, e.nombres`,
    [nominaId]
  );

  // Calcular totales
  const totalAFP = rows.reduce((sum, row) => sum + parseFloat(row.desc_afp || 0), 0);
  const totalSFS = rows.reduce((sum, row) => sum + parseFloat(row.desc_sfs || 0), 0);
  const totalISR = rows.reduce((sum, row) => sum + parseFloat(row.desc_isr || 0), 0);
  const totalGeneral = totalAFP + totalSFS + totalISR;
  const cantidadEmpleados = rows.length;

  return {
    registros: rows,
    resumen: {
      totalAFP,
      totalSFS,
      totalISR,
      totalGeneral,
      cantidadEmpleados
    }
  };
}
```

#### 2. Crear endpoint en detNomina.js
**Archivo:** `backend-ranger-nomina/routes/detNomina.js`

```javascript
// GET /api/det_nomina/reporte-descuentos-ley/:nominaId
router.get('/reporte-descuentos-ley/:nominaId', async (req, res, next) => {
  try {
    const { nominaId } = req.params;
    const data = await DetNomina.getReporteDescuentosLey(nominaId);
    if (!data.registros || data.registros.length === 0) {
      return res.status(404).json({ message: 'No se encontraron registros para este reporte.' });
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
});
```

### Frontend

#### 3. Crear interfaz TypeScript
**Archivo:** `rangernomina-frontend/src/app/services/det-nomina.service.ts`

```typescript
export interface RegistroDescuentoLey {
  id_empleado: string;
  nombre_completo: string;
  desc_afp: number;
  desc_sfs: number;
  desc_isr: number;
  total_descuentos_ley: number;
}

export interface ResumenDescuentosLey {
  totalAFP: number;
  totalSFS: number;
  totalISR: number;
  totalGeneral: number;
  cantidadEmpleados: number;
}

export interface ReporteDescuentosLeyResponse {
  registros: RegistroDescuentoLey[];
  resumen: ResumenDescuentosLey;
}
```

#### 4. Crear servicio o agregar método
```typescript
getReporteDescuentosLey(nominaId: number): Observable<ReporteDescuentosLeyResponse> {
  return this.http.get<ReporteDescuentosLeyResponse>(
    `${this.apiUrl}/det_nomina/reporte-descuentos-ley/${nominaId}`,
    { headers: this.getAuthHeaders() }
  );
}
```

#### 5. Crear componente
**Archivo:** `rangernomina-frontend/src/app/components/reporte-descuentos-ley/`

Componente con:
- Selector de nómina
- Botón "Generar Reporte"
- Tabla con columnas: Empleado, AFP, SFS, ISR, Total
- Resumen con tarjetas para cada descuento
- Botón de impresión

#### 6. Agregar ruta
**Archivo:** `app.routes.ts`
```typescript
{
  path: 'reporte-descuentos-ley',
  loadComponent: () => import('./components/reporte-descuentos-ley/...'),
  canActivate: [AuthGuard]
}
```

#### 7. Agregar al menú
**Archivo:** `navmenu.ts`
```typescript
const payrollMenuItems: MenuItem[] = [
  ...
  { label: 'Reporte Desc/Cred por Nómina', link: '/reporte-desc-cred' },
  { label: 'Reporte Descuentos de Ley (AFP/SFS/ISR)', link: '/reporte-descuentos-ley' },
  ...
];
```

---

## Alternativa: Opción 2 (UNION Query)

Si prefieres unificar todo en un solo reporte, aquí está el query:

```sql
-- Descuentos manuales (no_desc_cred_nomina)
SELECT
  dcn.codigo_empleado,
  CONCAT(e.nombres, ' ', e.apellidos) AS nombre_completo,
  dc.descripcion AS concepto,
  'Manual' AS tipo,
  dcn.valor,
  dcn.fecha
FROM no_desc_cred_nomina dcn
JOIN rh_empleado e ON dcn.codigo_empleado = e.id_empleado
JOIN no_desc_cred dc ON dcn.id_desc_cred = dc.id_desc_cred
WHERE dcn.id_nomina = ? AND dc.origen = 'D'

UNION ALL

-- Descuentos de ley (no_det_nomina) - AFP
SELECT
  dn.id_empleado AS codigo_empleado,
  CONCAT(e.nombres, ' ', e.apellidos) AS nombre_completo,
  'AFP' AS concepto,
  'Ley' AS tipo,
  dn.desc_afp AS valor,
  n.fecha_nomina AS fecha
FROM no_det_nomina dn
JOIN rh_empleado e ON dn.id_empleado = e.id_empleado
JOIN no_nominas n ON dn.id_nomina = n.id_nominas
WHERE dn.id_nomina = ? AND dn.desc_afp > 0

UNION ALL

-- SFS
SELECT
  dn.id_empleado,
  CONCAT(e.nombres, ' ', e.apellidos),
  'SFS/ARS',
  'Ley',
  dn.desc_sfs,
  n.fecha_nomina
FROM no_det_nomina dn
JOIN rh_empleado e ON dn.id_empleado = e.id_empleado
JOIN no_nominas n ON dn.id_nomina = n.id_nominas
WHERE dn.id_nomina = ? AND dn.desc_sfs > 0

UNION ALL

-- ISR
SELECT
  dn.id_empleado,
  CONCAT(e.nombres, ' ', e.apellidos),
  'ISR',
  'Ley',
  dn.desc_isr,
  n.fecha_nomina
FROM no_det_nomina dn
JOIN rh_empleado e ON dn.id_empleado = e.id_empleado
JOIN no_nominas n ON dn.id_nomina = n.id_nominas
WHERE dn.id_nomina = ? AND dn.desc_isr > 0

ORDER BY nombre_completo, concepto
```

**Problema con UNION:** El usuario no puede filtrar por concepto específico de ley (AFP, SFS, ISR) usando el selector actual porque no están en `no_desc_cred`.

---

## Preguntas para Decidir

Antes de implementar, necesito que me confirmes:

1. **¿Prefieres Opción 1 o Opción 2?**
   - Opción 1: Reporte separado para descuentos de ley
   - Opción 2: Unificar en el reporte actual

2. **¿Cómo quieres que se llame el nuevo reporte?**
   - "Reporte de Descuentos de Ley"
   - "Reporte AFP/SFS/ISR"
   - Otro nombre

3. **¿Necesitas filtrar por tipo de descuento de ley?**
   - Sí: poder ver solo AFP, solo SFS, o solo ISR
   - No: mostrar siempre los tres juntos

4. **¿Qué columnas debe tener la tabla?**
   - Opción A: Empleado | AFP | SFS | ISR | Total (una fila por empleado)
   - Opción B: Empleado | Concepto | Valor | Fecha (varias filas por empleado)

---

## Próximos Pasos

Una vez que me confirmes las decisiones:

1. ✅ Implementar backend (modelo + endpoint)
2. ✅ Implementar frontend (servicio + componente)
3. ✅ Agregar al menú
4. ✅ Probar y validar cálculos
5. ✅ Actualizar documentación

---

## Notas Técnicas

- **Fecha de los descuentos de ley:** No hay fecha individual, se usa la fecha de la nómina
- **Conceptos virtuales:** AFP, SFS, ISR no existen en `no_desc_cred`, son campos directos
- **Cálculo automático:** Estos descuentos los calcula el método `recalcular()` de nominaModel.js
- **Inmutabilidad:** Una vez cerrada la nómina, estos valores son históricos

---

**Estado:** ✅ OPCIÓN 2 IMPLEMENTADA Y COMPLETA

---

## Decisión Final: OPCIÓN 2 - UNION Query

**Fecha decisión:** 2025-11-08
**Fecha implementación:** 2025-11-08

### Estrategia de Implementación

Para manejar el problema de que AFP, SFS, ISR no tienen `id_desc_cred`:

1. **Concepto especial "TODOS"**: Cuando `descCredId = 0` o un valor especial, mostrar TODOS los descuentos (manuales + ley)
2. **Columna "Tipo"**: Agregar columna que identifique "Manual" vs "Ley"
3. **Selector actualizado**: Agregar opción "Todos los descuentos" en el selector de conceptos

### ✅ Implementación Completada

#### ✅ Backend (`backend-ranger-nomina/models/descCredNominaModel.js`)
- **Líneas 148-253**: Método `getReporteByNominaAndDescCred()` implementado
- **Líneas 151-216**: Query UNION cuando `descCredId = 0`
  - Descuentos manuales de `no_desc_cred_nomina`
  - AFP, SFS, ISR de `no_det_nomina`
  - Columna `tipo` con valores 'Manual' o 'Ley'
- **Líneas 218-237**: Query original para conceptos específicos
- **Líneas 240-252**: Cálculo de totales y resumen

#### ✅ Frontend

**Archivo: `rangernomina-frontend/src/app/components/reporte-desc-cred/reporte-desc-cred.ts`**
- **Línea 49**: Columna 'tipo' agregada a `displayedColumns`

**Archivo: `rangernomina-frontend/src/app/components/reporte-desc-cred/reporte-desc-cred.html`**
- **Líneas 22-24**: Opción "TODOS LOS DESCUENTOS" con valor 0
- **Líneas 72-81**: Columna "Tipo" con badges visuales

**Archivo: `rangernomina-frontend/src/app/components/reporte-desc-cred/reporte-desc-cred.css`**
- **Líneas 69-87**: Estilos para badges de tipo
  - `.badge-ley`: Azul para descuentos de ley
  - `.badge-manual`: Naranja para descuentos manuales

**Archivo: `rangernomina-frontend/src/app/services/desc-cred-nomina.service.ts`**
- **Línea 21**: Campo `tipo` agregado a interfaz `RegistroReporte`

### Características Implementadas

1. **Selector de Concepto**:
   - Primera opción: "TODOS LOS DESCUENTOS (Manuales + Ley: AFP, SFS, ISR)"
   - Conceptos individuales de `no_desc_cred`

2. **Columna Tipo con Badges**:
   - Badge azul para descuentos de ley (AFP, SFS, ISR)
   - Badge naranja para descuentos manuales

3. **Query UNION**:
   - Combina descuentos manuales y de ley en un solo resultado
   - Ordenado por empleado y concepto

4. **Resumen**:
   - Total general de todos los descuentos
   - Cantidad de empleados afectados
   - Total de registros

### Cómo Usar el Reporte

1. Ir a **Payroll → Reporte Desc/Cred por Nómina**
2. Seleccionar una nómina del dropdown
3. Seleccionar un concepto:
   - **"TODOS LOS DESCUENTOS"**: Muestra todos (manuales + AFP + SFS + ISR)
   - **Descuentos de Ley**:
     - AFP (Pensiones)
     - SFS/ARS (Salud)
     - ISR (Impuesto)
   - **Descuentos e Ingresos Manuales**: Cualquier concepto de `no_desc_cred`
4. Click en "Generar Reporte"
5. El reporte mostrará:
   - Empleado
   - Concepto (descripción)
   - Tipo (Manual/Ley con badge de color)
   - Fecha
   - Valor
   - **Totales**: Monto total, cantidad de empleados, cantidad de registros

### Ejemplo de Uso

**Escenario**: El cliente quiere saber cuánto se pagó de AFP en la nómina de enero.

1. Selecciona "Nómina Enero 2025"
2. Selecciona "AFP (Pensiones)" del grupo "Descuentos de Ley"
3. Click "Generar Reporte"
4. **Resultado**:
   - Tabla con todos los empleados que tuvieron descuento AFP
   - Monto individual de cada empleado
   - **Total AFP**: RD$ 125,450.00
   - **Cantidad empleados**: 45
   - **Total registros**: 45

### IDs Especiales Utilizados

- `descCredId = 0`: TODOS los descuentos
- `descCredId = -1`: AFP solamente
- `descCredId = -2`: SFS/ARS solamente
- `descCredId = -3`: ISR solamente
- `descCredId > 0`: Concepto manual específico de `no_desc_cred`
