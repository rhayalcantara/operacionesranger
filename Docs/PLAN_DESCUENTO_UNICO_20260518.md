# Plan: Modo "Descuento Único" en módulo Cuotas

**Fecha:** 2026-05-18
**Solicitante:** Agustina Cordero / Lic. Victor Peralta (Ranger)
**Origen:** Conversación WhatsApp SISTEMA RAY del 18-may-2026, demo enviado mismo día.
**Estado:** PLAN — pendiente de implementación.

---

## Contexto

Tras presentar el módulo de Cuotas (commits `c6bbd71`, `11e2de2`), Agustina y Victor preguntaron si los descuentos manuales aislados también caen en este módulo. La respuesta corta: **sí**, creando una cuota con `cuotas_totales = 1`.

El problema es de UX: el formulario actual está optimizado para préstamos en N cuotas. Para un descuento puntual de UNA quincena, los campos "cantidad de cuotas" y "fecha de fin" son ruido. Cuando hay muchos descuentos puntuales por período, la captura se vuelve lenta.

---

## Objetivo

Agregar un **modo "Descuento Único"** dentro del mismo módulo de Cuotas que:

- Reutilice tabla `no_amortizaciones` (sin nueva tabla).
- Simplifique el formulario al mínimo: empleado · tipo · monto · fecha de aplicación.
- Genere internamente una cuota con `cuotas_totales = 1`.
- Marque el registro con un flag visible (`tipo_captura = 'unico'`) para diferenciarlo en listados/reportes.
- Mantenga el mismo flujo de aplicación automática al recalcular nómina.

---

## Alcance

### Incluye
- Toggle/switch en el formulario actual: *"Cuotas en N quincenas"* ↔ *"Descuento único (1 quincena)"*.
- Modo "único":
  - Oculta: `cuotas_totales`, calculo "monto por cuota", `fecha_fin`.
  - Muestra: `empleado`, `id_desc_cred`, `concepto`, `monto_total`, `fecha_aplicacion` (que se mapea a `fecha_inicio` con `fecha_fin = fecha_inicio` y `cuotas_totales = 1`).
- Etiqueta visual en el listado (badge "Único") junto a los registros creados en este modo.
- Filtro en el listado por `tipo_captura` (Cuotas / Único / Ambos).

### No incluye
- Cambios en backend de cálculo (la aplicación automática ya funciona para cuotas de 1).
- Cambios en historial (sigue siendo el mismo).
- Nueva pantalla "Descuentos del período" (opción más ambiciosa, queda fuera de scope).

---

## Diseño Técnico

### 1. Base de datos

**Migración mínima** sobre `no_amortizaciones`:

```sql
ALTER TABLE no_amortizaciones
  ADD COLUMN tipo_captura ENUM('cuotas','unico') DEFAULT 'cuotas' AFTER estado,
  ADD INDEX idx_tipo_captura (tipo_captura);
```

- Registros existentes quedan como `'cuotas'` por default → backward compatible.
- Cuando frontend crea en modo "único", envía `tipo_captura = 'unico'`.

### 2. Backend (Node/Express en `backend-ranger-nomina`)

`POST /api/cuotas`:
- Aceptar campo opcional `tipo_captura` (default `'cuotas'`).
- Si `tipo_captura === 'unico'`: forzar `cuotas_totales = 1`, `fecha_fin = fecha_inicio`, `monto_cuota = monto_total`. Ignorar campos `cuotas_totales` y `fecha_fin` enviados.
- Validar `monto_total > 0` y `fecha_inicio` en el período correcto.

`GET /api/cuotas`:
- Soportar query `tipo_captura=cuotas|unico|ambos` (default `ambos`).

Ningún cambio en `nominaModel.recalcular()` (sigue funcionando idéntico, una cuota de 1 se aplica una vez y queda finalizada).

### 3. Frontend (Angular en `rangernomina-frontend`)

Componente: `cuota-form-dialog.component.ts` (o equivalente del form actual).

Cambios:

1. **Toggle en el header del dialog:**
   ```html
   <mat-button-toggle-group [(value)]="tipoCaptura" (change)="onTipoCapturaChange()">
     <mat-button-toggle value="cuotas">Cuotas (N quincenas)</mat-button-toggle>
     <mat-button-toggle value="unico">Descuento único</mat-button-toggle>
   </mat-button-toggle-group>
   ```

2. **Visibilidad condicional:**
   ```html
   <div *ngIf="tipoCaptura === 'cuotas'">
     <!-- campos: cantidad de cuotas, fecha fin (calculada), monto por cuota (calculado) -->
   </div>
   <div *ngIf="tipoCaptura === 'unico'">
     <!-- label "Fecha de aplicación" en vez de "Fecha de inicio" -->
   </div>
   ```

3. **Submit handler:**
   - Modo `'unico'`: envía `{ ..., cuotas_totales: 1, fecha_fin: fecha_inicio, tipo_captura: 'unico' }`.
   - Modo `'cuotas'`: comportamiento actual.

4. **Listado** (`cuota-list.component.ts`):
   - Columna nueva o badge en columna "concepto": `<mat-chip *ngIf="cuota.tipo_captura === 'unico'">Único</mat-chip>`.
   - Filtro en el header: dropdown "Tipo: Todos / Cuotas / Único".

### 4. Reportes
- Si hay reporte/exportación CSV de cuotas, incluir columna `tipo_captura`.
- Si hay dashboard, opcional agregar contador "Descuentos únicos del mes".

---

## Estimación

| Tarea | Tiempo |
|---|---|
| Migración DB + script revert | 15 min |
| Backend: ajustes POST/GET + tests | 30 min |
| Frontend: toggle + condicionales + submit | 45 min |
| Frontend: listado con badge + filtro | 30 min |
| QA manual (crear, listar, aplicar en nómina) | 30 min |
| Total | **~2.5 h** |

---

## Criterios de aceptación

1. Desde el form, el usuario puede elegir "Descuento único" y solo ve 4 campos: empleado, tipo, monto, fecha de aplicación.
2. Al guardar, el registro queda en `no_amortizaciones` con `cuotas_totales=1`, `tipo_captura='unico'`.
3. En el listado, los registros tipo único muestran badge "Único" visible.
4. Filtro del listado permite ver solo Únicos, solo Cuotas, o ambos.
5. Al recalcular una nómina del período correspondiente, el descuento único se aplica al empleado igual que cualquier otra cuota, y el registro queda `estado='finalizado'`.
6. Registros existentes (creados antes de la migración) siguen funcionando sin cambios — la columna `tipo_captura` queda en default `'cuotas'`.

---

## Riesgos

- **Migración en producción:** el `ALTER TABLE` con DEFAULT no debería bloquear, pero ejecutar fuera de horario de captura por si acaso.
- **Caché de UI:** clientes pueden no ver el toggle hasta forzar refresh del frontend; mencionarlo en la nota de release.

---

## Próximos pasos sugeridos

1. Confirmar el plan con Agustina y Victor (mostrarles esta nota o explicación verbal).
2. Crear branch `feat/descuento-unico` en backend + frontend.
3. Aplicar migración en ambiente de testing primero.
4. Demo interno antes de producción.
5. Release con changelog corto.

---

## Anexo: por qué NO una pantalla separada

Se consideró una pantalla "Descuentos del período" exclusiva para descuentos únicos. Se descartó porque:

- Duplicaría código y mental model: dos lugares para hacer básicamente lo mismo.
- El listado de Cuotas con filtro "Únicos" cubre el caso de uso de "ver todos los descuentos puntuales del mes".
- Mantener un solo módulo simplifica capacitación al usuario y mantenimiento del código.

Si el feedback del cliente tras la entrega indica que el toggle sigue siendo fricción, reabrir la discusión.
