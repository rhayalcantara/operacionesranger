# Resumen: Control de AFP y ARS por Quincena

**Fecha**: 2025-10-08
**Autor**: Claude Code

## Objetivo

Implementar la funcionalidad para permitir que el usuario configure en qué quincena(s) se deben retener AFP (Fondo de Pensiones) y ARS (Seguro de Salud) en la nómina quincenal.

## Contexto

En República Dominicana, es una práctica común retener todas las contribuciones de Seguridad Social (TSS: AFP + ARS) e ISR en la **primera quincena**, dejando la **segunda quincena** con un pago "limpio" (sin retenciones o con menos retenciones).

Anteriormente, el sistema solo permitía configurar ISR por quincena. Ahora se extiende esta funcionalidad para AFP y ARS.

## Cambios Implementados

### 1. Base de Datos

**Tabla**: `no_desc_cred`

Se agregaron dos nuevos campos:

```sql
ALTER TABLE no_desc_cred
ADD COLUMN aplica_afp_quincena TINYINT DEFAULT 0
  COMMENT '0=ambas quincenas, 1=primera quincena, 2=segunda quincena';

ALTER TABLE no_desc_cred
ADD COLUMN aplica_ars_quincena TINYINT DEFAULT 0
  COMMENT '0=ambas quincenas, 1=primera quincena, 2=segunda quincena';
```

**Valores permitidos**:
- `0`: Aplicar en **ambas quincenas** (comportamiento por defecto)
- `1`: Aplicar **solo en la primera quincena**
- `2`: Aplicar **solo en la segunda quincena**

### 2. Backend (Node.js)

**Archivo modificado**: `backend-ranger-nomina/models/nominaModel.js`

#### Cambios en la función `recalcular()`

1. **Query de configuración**:
```javascript
const [descuentosLey] = await connection.query(
  'SELECT descripcion, empleado AS porcentaje, tope, aplica_afp_quincena, aplica_ars_quincena
   FROM no_desc_cred WHERE fijo = 1 AND origen = "D"'
);
```

2. **Lógica de cálculo de AFP**:
```javascript
if (afpConfig) {
  // Verificar si debe aplicar AFP en esta quincena
  const aplicaAfp = afpConfig.aplica_afp_quincena === 0 ||
                    afpConfig.aplica_afp_quincena === quincena ||
                    afpConfig.aplica_afp_quincena === null ||
                    afpConfig.aplica_afp_quincena === undefined;

  if (aplicaAfp) {
    const topeMensualAfp = parseFloat(afpConfig.tope);
    const salarioCotizableAfp = Math.min(salarioMensual, topeMensualAfp);
    montoAfp = (periodoDePago === 'QUINCENAL' ? salarioCotizableAfp / 2 : salarioCotizableAfp)
                * (parseFloat(afpConfig.porcentaje) / 100);
  }
}
```

3. **Lógica de cálculo de ARS** (idéntica a AFP):
```javascript
if (sfsConfig) {
  // Verificar si debe aplicar ARS en esta quincena
  const aplicaArs = sfsConfig.aplica_ars_quincena === 0 ||
                    sfsConfig.aplica_ars_quincena === quincena ||
                    sfsConfig.aplica_ars_quincena === null ||
                    sfsConfig.aplica_ars_quincena === undefined;

  if (aplicaArs) {
    const topeMensualSfs = parseFloat(sfsConfig.tope);
    const salarioCotizableSfs = Math.min(salarioMensual, topeMensualSfs);
    montoSfs = (periodoDePago === 'QUINCENAL' ? salarioCotizableSfs / 2 : salarioCotizableSfs)
                * (parseFloat(sfsConfig.porcentaje) / 100);
  }
}
```

**Nota importante**: El cálculo respeta la configuración de `quincena` de la nómina actual.

### 3. Frontend (Angular)

#### A. Interfaz TypeScript

**Archivo**: `rangernomina-frontend/src/app/no-desc-cred/no-desc-cred.service.ts`

```typescript
export interface NoDescCred {
  id_desc_cred?: number;
  descripcion: string;
  origen: 'I' | 'D';
  fijo: boolean;
  valorporciento: 'V' | 'P';
  empleado: number;
  compania: number;
  tope: number;
  maneja_cuotas?: boolean;
  quincena_aplicacion?: number; // 0=Ambas, 1=Primera, 2=Segunda
  aplica_afp_quincena?: number; // 0=Ambas, 1=Primera, 2=Segunda ← NUEVO
  aplica_ars_quincena?: number; // 0=Ambas, 1=Primera, 2=Segunda ← NUEVO
}
```

#### B. Componente del Formulario

**Archivo**: `rangernomina-frontend/src/app/no-desc-cred/no-desc-cred-form.component.ts`

```typescript
this.descCredForm = this.fb.group({
  descripcion: [this.data?.descripcion || '', Validators.required],
  origen: [this.data?.origen || 'I'],
  fijo: [this.data?.fijo || false],
  maneja_cuotas: [this.data?.maneja_cuotas || false],
  valorporciento: [this.data?.valorporciento || 'V'],
  empleado: [this.data?.empleado || null],
  compania: [this.data?.compania || null],
  tope: [this.data?.tope || null],
  quincena_aplicacion: [this.data?.quincena_aplicacion ?? 0],
  aplica_afp_quincena: [this.data?.aplica_afp_quincena ?? 0], // ← NUEVO
  aplica_ars_quincena: [this.data?.aplica_ars_quincena ?? 0]  // ← NUEVO
});
```

#### C. Template HTML

**Archivo**: `rangernomina-frontend/src/app/no-desc-cred/no-desc-cred-form.component.html`

Se agregaron dos nuevos selectores:

```html
<div class="form-group">
  <label class="field-label">Aplicar AFP en Quincena</label>
  <mat-form-field appearance="fill" style="width: 100%;">
    <mat-label>Seleccione quincena para AFP</mat-label>
    <mat-select formControlName="aplica_afp_quincena">
      <mat-option [value]="0">Ambas quincenas</mat-option>
      <mat-option [value]="1">Primera quincena</mat-option>
      <mat-option [value]="2">Segunda quincena</mat-option>
    </mat-select>
  </mat-form-field>
</div>

<div class="form-group">
  <label class="field-label">Aplicar ARS en Quincena</label>
  <mat-form-field appearance="fill" style="width: 100%;">
    <mat-label>Seleccione quincena para ARS</mat-label>
    <mat-select formControlName="aplica_ars_quincena">
      <mat-option [value]="0">Ambas quincenas</mat-option>
      <mat-option [value]="1">Primera quincena</mat-option>
      <mat-option [value]="2">Segunda quincena</mat-option>
    </mat-select>
  </mat-form-field>
</div>
```

## Casos de Uso

### Caso 1: Retener todo en la primera quincena (práctica común)

**Configuración**:
- AFP: `aplica_afp_quincena = 1` (Primera quincena)
- ARS: `aplica_ars_quincena = 1` (Primera quincena)
- ISR: Configurado para primera quincena mediante `isr` y `id_nomina_isr`

**Resultado**:
- **Primera quincena**: Se retienen AFP, ARS e ISR → Pago neto más bajo
- **Segunda quincena**: Sin retenciones → Pago "limpio" más alto

### Caso 2: Dividir retenciones entre quincenas

**Configuración**:
- AFP: `aplica_afp_quincena = 1` (Primera quincena)
- ARS: `aplica_ars_quincena = 2` (Segunda quincena)
- ISR: Configurado para cálculo mensual (ambas quincenas)

**Resultado**:
- **Primera quincena**: Se retiene AFP e ISR parcial
- **Segunda quincena**: Se retiene ARS e ISR complementario

### Caso 3: Retenciones normales (ambas quincenas)

**Configuración**:
- AFP: `aplica_afp_quincena = 0` (Ambas quincenas)
- ARS: `aplica_ars_quincena = 0` (Ambas quincenas)
- ISR: Configurado para cálculo mensual

**Resultado**:
- **Ambas quincenas**: Se retienen AFP, ARS e ISR equitativamente

## Retrocompatibilidad

- Los registros existentes en `no_desc_cred` sin estos campos tendrán valores `0` por defecto.
- El valor `0` (o `NULL`) se interpreta como "aplicar en ambas quincenas".
- Esto garantiza que el comportamiento actual no cambie hasta que el usuario configure explícitamente.

## Flujo de Trabajo para el Usuario

1. **Configurar descuentos fijos**:
   - Ir a: Mantenimiento → Descuentos/Créditos
   - Editar registro de "AFP" y "ARS" (descuentos fijos)
   - Seleccionar quincena de aplicación para cada uno

2. **Crear nómina**:
   - Crear nómina quincenal normalmente
   - El sistema aplicará AFP/ARS según la configuración

3. **Recalcular**:
   - Al recalcular la nómina, el sistema verifica:
     - `quincena` de la nómina (1 o 2)
     - `aplica_afp_quincena` del registro AFP
     - `aplica_ars_quincena` del registro ARS
   - Solo aplica la retención si corresponde a la quincena actual

## Pruebas Sugeridas

1. **Prueba 1: AFP solo en primera quincena**
   - Configurar AFP con `aplica_afp_quincena = 1`
   - Crear nómina quincena 1 → Debe calcular AFP
   - Crear nómina quincena 2 → **NO** debe calcular AFP

2. **Prueba 2: ARS solo en segunda quincena**
   - Configurar ARS con `aplica_ars_quincena = 2`
   - Crear nómina quincena 1 → **NO** debe calcular ARS
   - Crear nómina quincena 2 → Debe calcular ARS

3. **Prueba 3: Combinación con ISR**
   - Configurar AFP, ARS e ISR para primera quincena
   - Verificar que segunda quincena tenga pago "limpio"

4. **Prueba 4: Retrocompatibilidad**
   - Crear nómina sin modificar configuración (valores por defecto)
   - Debe calcular AFP y ARS en ambas quincenas (comportamiento original)

## Notas Importantes

- **AFP** se identifica en la base de datos buscando `descripcion` que contenga "AFP" (case-insensitive).
- **ARS** se identifica buscando `descripcion` que contenga "SFS" (case-insensitive).
- La configuración es global para todos los empleados (se configura en `no_desc_cred`, no por empleado).
- Si se necesita configuración por empleado, se requeriría una nueva tabla intermedia.

## Referencias

- Artículo sobre prácticas de retención en RD: [Reddit discussion](https://www.reddit.com/r/DominicanRepublic/comments/1bq2gm1/how_does_payroll_deductions_work_for_tss_and_isr/)
- Plan original: `Docs/PLAN_APLICACION_QUINCENA_DESC_CRED.md`
- Implementación ISR: `Docs/RESUMEN_IMPLEMENTACION_CONTROL_ISR.md`

## Conclusión

Esta implementación proporciona **máxima flexibilidad** al usuario para configurar las retenciones de AFP y ARS según sus necesidades de flujo de caja y prácticas empresariales, manteniendo compatibilidad con el sistema existente.
