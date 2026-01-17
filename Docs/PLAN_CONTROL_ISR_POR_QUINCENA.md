# Plan: Control de Aplicación de ISR por Quincena

**Fecha:** 2025-10-08
**Autor:** Claude Code
**Prioridad:** Alta
**Relacionado con:** PLAN_APLICACION_QUINCENA_DESC_CRED.md

---

## 📋 Contexto del Problema

### Situación Actual

El ISR (Impuesto Sobre la Renta) tiene un comportamiento especial en el sistema:

1. **Se calcula de forma acumulativa mensual:**
   - 1ra quincena: calcula ISR sobre ingresos de esa quincena
   - 2da quincena: calcula ISR sobre ingresos totales del mes (1ra + 2da), pero descuenta lo ya retenido en 1ra

2. **Problema identificado:**
   - El ISR NO es un `desc_cred` en la tabla `no_desc_cred`
   - Por lo tanto, NO se ve afectado por el filtro `quincena_aplicacion` implementado
   - **Actualmente se calcula en AMBAS quincenas siempre**, sin opción de configurarlo

3. **Campos existentes en `no_nominas`:**
   - `isr` (TINYINT): Flag para indicar si esta nómina debe calcular ISR
   - `id_nomina_isr` (INT): ID de la nómina anterior para cálculo acumulativo

### Necesidad del Usuario

**Permitir configurar en qué quincena se aplica el ISR:**
- Algunas empresas retienen todo el ISR en la 2da quincena
- Otras lo distribuyen en ambas quincenas
- Debe ser configurable por nómina

---

## 🎯 Objetivo

Implementar control granular del cálculo de ISR usando los campos existentes:

1. **Si `isr = 1`:** Calcular y aplicar ISR en esta nómina
2. **Si `isr = 0` o `NULL`:** NO calcular ISR (desc_isr = 0)
3. **Si `id_nomina_isr` está definido:** Usar cálculo acumulativo mensual

---

## 💡 Solución Propuesta

### Opción 1: Usar campos existentes (RECOMENDADA)

**Ventajas:**
✅ No requiere migración de base de datos
✅ Usa infraestructura existente
✅ Implementación más rápida
✅ Compatible con lógica actual

**Configuración por escenario:**

#### Escenario A: ISR solo en 2da quincena (Común en RD)
```
Nómina 1ra quincena:
  - isr = 0
  - id_nomina_isr = NULL
  → Resultado: desc_isr = 0

Nómina 2da quincena:
  - isr = 1
  - id_nomina_isr = [ID de 1ra quincena]
  → Resultado: desc_isr = ISR total del mes
```

#### Escenario B: ISR distribuido (ambas quincenas)
```
Nómina 1ra quincena:
  - isr = 1
  - id_nomina_isr = NULL
  → Resultado: desc_isr = ISR quincenal

Nómina 2da quincena:
  - isr = 1
  - id_nomina_isr = [ID de 1ra quincena]
  → Resultado: desc_isr = ISR mensual - ISR ya retenido
```

#### Escenario C: Sin ISR (ej: salarios exentos)
```
Nómina 1ra quincena:
  - isr = 0
  - id_nomina_isr = NULL

Nómina 2da quincena:
  - isr = 0
  - id_nomina_isr = NULL
  → Resultado: desc_isr = 0 en ambas
```

### Opción 2: Agregar campo `quincena_aplicacion_isr`

**Ventajas:**
✅ Más explícito
✅ UI más intuitiva

**Desventajas:**
❌ Requiere migración SQL
❌ Duplica funcionalidad de campo `isr`
❌ Más complejo de mantener

**No recomendada** porque el campo `isr` ya cumple esta función.

---

## 🔧 Implementación (Opción 1)

### FASE 1: Backend - Modificar Lógica de Recálculo

**Archivo:** `backend-ranger-nomina/models/nominaModel.js`

**Ubicación:** Método `recalcular()`, líneas 890-912

**Cambio requerido:**

```javascript
// ANTES (línea 890-912)
let sueldoBrutoParaISR = sueldoBrutoPeriodo;
let isrRetenidoQuincena1 = 0;
let periodoCalculoISR = periodoDePago;
let desc_isr = 0;

if (id_nomina_isr) {
    const [[ingresoAnterior]] = await connection.query(
      'SELECT total_ingreso, desc_isr FROM no_det_nomina WHERE id_nomina = ? AND id_empleado = ?',
      [id_nomina_isr, empleado.id_empleado]
    );
    if (ingresoAnterior) {
      sueldoBrutoParaISR += ingresoAnterior.total_ingreso;
      isrRetenidoQuincena1 = ingresoAnterior.desc_isr || 0;
      periodoCalculoISR = 'MENSUAL';
    }
}

const desc_isr_total = await isrService.calcularISR(sueldoBrutoParaISR, periodoCalculoISR);
desc_isr = desc_isr_total - isrRetenidoQuincena1;

// DESPUÉS
let sueldoBrutoParaISR = sueldoBrutoPeriodo;
let isrRetenidoQuincena1 = 0;
let periodoCalculoISR = periodoDePago;
let desc_isr = 0;

// ✨ NUEVO: Verificar si esta nómina debe calcular ISR
const aplicarISR = nominaInfo.isr === 1 || nominaInfo.isr === true;

if (aplicarISR) {
  if (id_nomina_isr) {
    const [[ingresoAnterior]] = await connection.query(
      'SELECT total_ingreso, desc_isr FROM no_det_nomina WHERE id_nomina = ? AND id_empleado = ?',
      [id_nomina_isr, empleado.id_empleado]
    );
    if (ingresoAnterior) {
      sueldoBrutoParaISR += ingresoAnterior.total_ingreso;
      isrRetenidoQuincena1 = ingresoAnterior.desc_isr || 0;
      periodoCalculoISR = 'MENSUAL';
    }
  }

  const desc_isr_total = await isrService.calcularISR(sueldoBrutoParaISR, periodoCalculoISR);
  desc_isr = desc_isr_total - isrRetenidoQuincena1;
} else {
  // Si isr = 0, no calcular ISR
  desc_isr = 0;
}
```

**Líneas a modificar:** 890-912

---

### FASE 2: Frontend - UI para Campo ISR

**Objetivo:** Permitir al usuario configurar el campo `isr` al crear/editar nómina

#### Archivo 1: `rangernomina-frontend/src/app/nomina/nomina.service.ts`

**Cambio:** Agregar campo `isr` a la interface `Nomina`

```typescript
export interface Nomina {
  id_nominas?: number;
  titulo_nomina: string;
  id_tipo_nomina: number;
  fecha_inicio: string;
  fecha_fin: string;
  fecha_nomina: string;
  status?: number;
  quincena?: number;
  isr?: number;              // ✨ NUEVO
  id_nomina_isr?: number;    // ✨ NUEVO (si no existe)
  // ... otros campos
}
```

#### Archivo 2: `rangernomina-frontend/src/app/nomina/nomina-form.component.ts`

**Cambio:** Agregar FormControls para `isr` y `id_nomina_isr`

```typescript
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';

// En imports del @Component
imports: [
  // ... existentes
  MatCheckboxModule,
  MatSelectModule
]

// En ngOnInit()
this.nominaForm = this.fb.group({
  // ... campos existentes
  isr: [this.data?.isr ?? 1],  // ✨ NUEVO - default 1 (calcular ISR)
  id_nomina_isr: [this.data?.id_nomina_isr || null]  // ✨ NUEVO
});

// ✨ NUEVO: Método para cargar nóminas disponibles
nominasAnteriores: Nomina[] = [];

ngOnInit(): void {
  // ... código existente
  this.loadNominasAnteriores();
}

loadNominasAnteriores(): void {
  this.nominaService.getHistorico().subscribe((nominas: Nomina[]) => {
    // Filtrar solo nóminas cerradas o activas anteriores
    this.nominasAnteriores = nominas.filter(n =>
      !this.isEditMode || n.id_nominas !== this.data?.id_nominas
    );
  });
}
```

#### Archivo 3: `rangernomina-frontend/src/app/nomina/nomina-form.component.html`

**Cambio:** Agregar campos en el formulario

```html
<!-- Después del campo de quincena -->

<!-- ✨ NUEVO: Checkbox para ISR -->
<div class="form-group">
  <mat-checkbox formControlName="isr">
    Calcular ISR en esta nómina
  </mat-checkbox>
  <small class="help-text">
    Marque esta opción si desea que se calcule y aplique el ISR en esta quincena.
    Si desmarca, el ISR será 0 para todos los empleados.
  </small>
</div>

<!-- ✨ NUEVO: Select para nómina ISR anterior -->
<div class="form-group" *ngIf="nominaForm.get('isr')?.value">
  <label class="field-label">Nómina para Cálculo Acumulativo (Opcional)</label>
  <mat-form-field appearance="fill" style="width: 100%;">
    <mat-label>Seleccione nómina anterior</mat-label>
    <mat-select formControlName="id_nomina_isr">
      <mat-option [value]="null">Ninguna (calcular solo esta quincena)</mat-option>
      <mat-option *ngFor="let nom of nominasAnteriores" [value]="nom.id_nominas">
        {{nom.titulo_nomina}} - {{nom.fecha_nomina | date:'dd/MM/yyyy'}}
      </mat-option>
    </mat-select>
  </mat-form-field>
  <small class="help-text">
    Si selecciona una nómina anterior, el ISR se calculará acumulando los ingresos
    de ambas quincenas (cálculo mensual). Use esto para la 2da quincena del mes.
  </small>
</div>
```

**Nota sobre estilos:**
```css
/* En nomina-form.component.css */
.help-text {
  display: block;
  font-size: 0.85em;
  color: #666;
  margin-top: 4px;
  font-style: italic;
}
```

---

### FASE 3: Validaciones y Reglas de Negocio

#### Validación 1: Coherencia de configuración

**Ubicación:** `nomina-form.component.ts`

```typescript
onSubmit(): void {
  if (this.nominaForm.invalid) return;

  // ✨ NUEVO: Validar coherencia ISR
  const isr = this.nominaForm.get('isr')?.value;
  const id_nomina_isr = this.nominaForm.get('id_nomina_isr')?.value;

  if (!isr && id_nomina_isr) {
    alert('Si no desea calcular ISR en esta nómina, no debe seleccionar una nómina anterior.');
    return;
  }

  // Continuar con submit normal...
}
```

#### Validación 2: Evitar referencia circular

**Ubicación:** Backend `nominaModel.js` - método `recalcular()`

```javascript
// Al inicio del método recalcular, después de obtener nominaInfo
if (id_nomina_isr === nominaId) {
  throw new Error('Una nómina no puede hacer referencia a sí misma para cálculo de ISR');
}
```

---

### FASE 4: Documentación de Usuario

**Archivo:** `Docs/GUIA_CONFIGURACION_ISR.md`

```markdown
# Guía: Configuración de ISR por Quincena

## Escenarios Comunes

### 1. ISR solo en 2da quincena (Recomendado RD)

**Configuración 1ra quincena:**
- ☐ Calcular ISR en esta nómina (desmarcado)
- Nómina para cálculo acumulativo: Ninguna

**Configuración 2da quincena:**
- ☑ Calcular ISR en esta nómina (marcado)
- Nómina para cálculo acumulativo: [Seleccionar 1ra quincena]

**Resultado:**
- 1ra quincena: ISR = 0
- 2da quincena: ISR = Total mensual

### 2. ISR distribuido en ambas quincenas

**Configuración 1ra quincena:**
- ☑ Calcular ISR en esta nómina (marcado)
- Nómina para cálculo acumulativo: Ninguna

**Configuración 2da quincena:**
- ☑ Calcular ISR en esta nómina (marcado)
- Nómina para cálculo acumulativo: [Seleccionar 1ra quincena]

**Resultado:**
- 1ra quincena: ISR quincenal
- 2da quincena: ISR mensual - ISR ya retenido

### 3. Sin ISR (salarios exentos)

**Configuración en ambas:**
- ☐ Calcular ISR en esta nómina (desmarcado)
- Nómina para cálculo acumulativo: Ninguna

**Resultado:**
- ISR = 0 en ambas quincenas
```

---

## 📊 Casos de Prueba

### Caso 1: ISR solo en 2da quincena

**Setup:**
```sql
-- Nómina 1ra quincena
INSERT INTO no_nominas (titulo_nomina, quincena, isr, id_nomina_isr)
VALUES ('Enero 2025 - 1ra', 1, 0, NULL);

-- Nómina 2da quincena
INSERT INTO no_nominas (titulo_nomina, quincena, isr, id_nomina_isr)
VALUES ('Enero 2025 - 2da', 2, 1, [ID_1ra_quincena]);
```

**Prueba:**
1. Recalcular 1ra quincena → `desc_isr` debe ser 0 para todos
2. Recalcular 2da quincena → `desc_isr` debe tener valor calculado acumulativo

**Resultado esperado:**
- Empleado con salario RD$50,000/mes
  - 1ra quincena: desc_isr = 0
  - 2da quincena: desc_isr = [ISR mensual calculado sobre RD$50,000]

---

### Caso 2: ISR distribuido

**Setup:**
```sql
-- Nómina 1ra quincena
INSERT INTO no_nominas (titulo_nomina, quincena, isr, id_nomina_isr)
VALUES ('Enero 2025 - 1ra', 1, 1, NULL);

-- Nómina 2da quincena
INSERT INTO no_nominas (titulo_nomina, quincena, isr, id_nomina_isr)
VALUES ('Enero 2025 - 2da', 2, 1, [ID_1ra_quincena]);
```

**Prueba:**
1. Recalcular 1ra quincena → `desc_isr` = ISR quincenal
2. Recalcular 2da quincena → `desc_isr` = (ISR mensual - ISR 1ra)

**Resultado esperado:**
- Empleado con salario RD$50,000/mes
  - 1ra quincena: desc_isr = ISR(RD$25,000)
  - 2da quincena: desc_isr = ISR(RD$50,000) - ISR(RD$25,000)

---

### Caso 3: Cambio de configuración mid-month

**Escenario:**
- 1ra quincena procesada con `isr = 1`
- Usuario cambia 2da quincena a `isr = 0`

**Comportamiento esperado:**
- 2da quincena: desc_isr = 0
- **⚠️ ADVERTENCIA:** El ISR de 1ra quincena YA fue retenido

**Recomendación:**
- Mostrar warning en UI si se detecta esta situación
- Sugerir ajuste manual o reversa de nómina anterior

---

## 🔄 Impacto en Sistema

### ✅ Compatibilidad Retroactiva

**Nóminas existentes sin campo `isr` definido:**
- Se asume `isr = NULL`
- **Comportamiento:**
  - En código actual: calcula ISR siempre
  - En código nuevo: **NO calcular ISR** (desc_isr = 0)

**⚠️ DECISIÓN REQUERIDA:**

**Opción A (RECOMENDADA):** Asumir `isr = 1` si es NULL
```javascript
const aplicarISR = nominaInfo.isr === 1 || nominaInfo.isr === true || nominaInfo.isr === null;
```

**Opción B:** Asumir `isr = 0` si es NULL (más estricto)
```javascript
const aplicarISR = nominaInfo.isr === 1 || nominaInfo.isr === true;
```

**Migración opcional para nóminas existentes:**
```sql
UPDATE no_nominas SET isr = 1 WHERE isr IS NULL;
```

---

## 📝 Checklist de Implementación

### Backend
- [ ] Modificar `nominaModel.js` línea 890-912
- [ ] Agregar validación de referencia circular
- [ ] Agregar logging para debug de ISR
- [ ] Pruebas unitarias de cálculo ISR

### Frontend
- [ ] Actualizar interface `Nomina` en service
- [ ] Agregar FormControls en form component
- [ ] Agregar UI (checkbox + select) en template
- [ ] Agregar validaciones en submit
- [ ] Método para cargar nóminas anteriores
- [ ] Estilos para help-text

### Base de Datos
- [ ] Decidir comportamiento para `isr = NULL`
- [ ] (Opcional) Migración para actualizar registros existentes

### Documentación
- [ ] Crear `GUIA_CONFIGURACION_ISR.md`
- [ ] Actualizar manual de usuario
- [ ] Screenshots de UI
- [ ] Ejemplos de configuración

### Testing
- [ ] Caso 1: ISR solo en 2da quincena
- [ ] Caso 2: ISR distribuido
- [ ] Caso 3: Sin ISR
- [ ] Caso 4: Nóminas existentes (retrocompatibilidad)
- [ ] Caso 5: Validación de referencia circular

---

## 🚀 Estimación

**Tiempo total:** 3-4 horas

- Backend: 1 hora
- Frontend: 1.5 horas
- Testing: 1 hora
- Documentación: 30 minutos

---

## 💡 Recomendaciones Adicionales

### 1. Default inteligente para campo ISR

Al crear nueva nómina, sugerir valor basado en quincena:
```typescript
// En nomina-form.component.ts
ngOnInit(): void {
  const quincenaActual = this.nominaForm.get('quincena')?.value;

  // Default: ISR solo en 2da quincena (común en RD)
  if (!this.isEditMode) {
    this.nominaForm.patchValue({
      isr: quincenaActual === 2 ? 1 : 0
    });
  }
}
```

### 2. Auto-selección de nómina anterior

```typescript
// Si es 2da quincena y campo ISR está marcado
this.nominaForm.get('quincena')?.valueChanges.subscribe(quincena => {
  if (quincena === 2) {
    // Buscar 1ra quincena del mismo mes/tipo
    const nominaAnterior = this.nominasAnteriores.find(n =>
      n.quincena === 1 &&
      this.mismoPeriodo(n, this.nominaForm.value)
    );

    if (nominaAnterior) {
      this.nominaForm.patchValue({
        id_nomina_isr: nominaAnterior.id_nominas
      });
    }
  }
});
```

### 3. Indicador visual en lista de nóminas

Agregar columna "ISR" en tabla de nóminas:
```html
<td mat-cell *matCellDef="let nomina">
  <mat-icon *ngIf="nomina.isr === 1" color="primary">check_circle</mat-icon>
  <mat-icon *ngIf="!nomina.isr" color="warn">cancel</mat-icon>
</td>
```

---

## 🎯 Conclusión

La solución propuesta aprovecha los campos existentes (`isr` y `id_nomina_isr`) sin necesidad de migración de base de datos. Es:

✅ Simple de implementar
✅ Intuitiva para el usuario
✅ Compatible con sistema actual
✅ Flexible para diferentes escenarios

El cambio principal está en **1 línea de código** en el backend:
```javascript
const aplicarISR = nominaInfo.isr === 1 || nominaInfo.isr === true;
if (aplicarISR) {
  // calcular ISR
} else {
  desc_isr = 0;
}
```

Todo lo demás es UI para facilitar la configuración.
