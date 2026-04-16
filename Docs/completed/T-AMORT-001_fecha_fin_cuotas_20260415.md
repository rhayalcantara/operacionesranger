# Tarea Completada: T-AMORT-001 — Agregar fecha_fin a no_cuotas

**Fecha de inicio**: 2026-04-15
**Fecha de finalización**: 2026-04-15
**Solicitante**: Agustina Cordero (mensaje del 14/04/2026)
**Plan padre**: `Docs/PLAN_AMORTIZACIONES_Y_PRENOMINA_20260415.md`

## Resumen

Se extiende el sistema existente de cuotas (`no_cuotas` / `no_cuotas_detalle`) para soportar
explícitamente el requerimiento de Agustina: cada amortización debe tener **fecha de inicio y
fecha de finalización**. En lugar de crear tablas paralelas (`no_amortizaciones`) como proponía
el plan original, se optó por extender lo existente — menos riesgo, sin duplicar lógica y
preservando el historial ya operativo.

## Subtareas Completadas

- [✓] Exploración del sistema de cuotas existente (modelo, rutas, integración con nómina, frontend)
- [✓] Migración SQL para agregar columna `fecha_fin` + índice `idx_vigencia_cuotas` + backfill
- [✓] Actualización de `cuotaModel.crear()` para calcular y persistir `fecha_fin`
- [✓] Actualización del modelo TypeScript `Cuota` (`fecha_fin?: string`)
- [✓] Nueva columna "Vigencia" en la tabla de cuotas del listado principal

## Archivos Generados/Modificados

### Backend (`backend-ranger-nomina/`)
- `migrations/20260415_add_fecha_fin_cuotas.sql` — **NUEVO**. Migración idempotente que:
  - Agrega `fecha_fin DATE NULL` a `no_cuotas` (después de `fecha_inicio`)
  - Crea índice compuesto `idx_vigencia_cuotas(fecha_inicio, fecha_fin, estado)`
  - Backfill: para cuotas existentes toma `MAX(fecha_esperada_aplicacion)` del detalle
- `models/cuotaModel.js` (líneas 66–89) — `crear()` ahora calcula `fecha_fin` a partir de
  `fecha_inicio + (cantidad_cuotas - 1) × diasIncremento` (quincenal=15, mensual=30) y lo
  persiste en el INSERT.

### Frontend (`rangernomina-frontend/`)
- `src/app/models/cuota.model.ts` — interface `Cuota` con campo opcional `fecha_fin`.
- `src/app/components/cuotas/cuotas.component.html` — nueva columna "Vigencia" mostrando
  `fecha_inicio` / `fecha_fin`, `colspan` del empty state ajustado a 10.

## Criterios de Aceptación Cumplidos

- [✓] `no_cuotas` tiene columna `fecha_fin` con backfill automático para datos previos
- [✓] Cuotas nuevas persisten `fecha_fin` calculada automáticamente
- [✓] Listing queries (`SELECT c.*`) exponen `fecha_fin` sin cambios adicionales
- [✓] UI muestra vigencia (inicio/fin) en la tabla principal
- [✓] Migración es idempotente (usa `IF NOT EXISTS` vía `INFORMATION_SCHEMA`)

## Decisiones Técnicas Tomadas

- **Extender `no_cuotas` en vez de crear `no_amortizaciones` paralela**: el sistema existente
  ya cubre 80 % del requerimiento (cuotas, monto por cuota, estado, cuotas aplicadas, detalle
  por cuota con `id_nomina`/`fecha_aplicacion`). Crear tabla paralela habría duplicado
  `cuotaModel.js`, `cuotaRoutes.js`, el frontend completo y la integración con
  `nominaModel.js:906-965`.
- **`fecha_fin` almacenada, no calculada**: permite búsquedas por vigencia indexadas y evita
  recomputar en cada query. El trade-off (desincronización si se manipula detalle) es bajo
  porque `crear()` es la única fuente actual.
- **Backfill via `MAX(fecha_esperada_aplicacion)`**: para cuotas previas sin `fecha_fin`,
  usar la fecha esperada de la última cuota del detalle refleja fielmente la vigencia real.

## Migración aplicada

- **2026-04-16**: BD `db_aae4a2_ranger` migrada desde el servidor remoto `192.168.1.96`
  hacia la PC local (dump 5.1 MB en `scripts/migracion_db/db_aae4a2_ranger_20260416.sql`).
  Migración `20260415_add_fecha_fin_cuotas.sql` ejecutada sobre la BD local con éxito:
  columna `fecha_fin` agregada, índice `idx_vigencia_cuotas` creado, backfill 180/180
  cuotas (100%). Backend `:3333` y frontend `:4200` validados — endpoint
  `/api/cuotas/activas` devuelve `fecha_fin` y la columna "Vigencia" está presente en
  `cuotas.component.html`.

## Pendiente (próximos pasos)

- Mostrar `fecha_fin` también en `cuota-form-dialog` (readonly, calculada en vivo) y en
  `cuota-detalle-dialog`.
- Punto 2 del pedido de Agustina: pantalla de consulta de historial de cuotas aplicadas
  por empleado (gran parte del dato ya existe en `no_cuotas_detalle`; falta la UI de
  consulta consolidada).
- Punto 3–4: flujo de pre-nómina (tabla `no_captura_estado`, notificación a Agustina,
  aplicación automática de descuentos pre-capturados al crear nómina).

## Notas Adicionales

- El sistema ya tiene auditoría de modificaciones al detalle en
  `no_cuotas_detalle_historial` (pausar/posponer). No fue necesario crear nueva tabla de
  historial para esta tarea; la que existe más los campos `fecha_aplicacion`/`id_nomina`
  en `no_cuotas_detalle` cubren el historial de aplicaciones.
- Se mantuvo la lógica de `diasIncremento` existente (mensual vs quincenal según
  `quincena_aplicacion` del `no_desc_cred`) para que `fecha_fin` sea consistente con las
  `fecha_esperada_aplicacion` generadas por el mismo `crear()`.
