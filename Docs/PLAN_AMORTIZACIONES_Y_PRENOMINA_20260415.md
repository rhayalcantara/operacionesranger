# Plan: Amortizaciones con Historial y Captura Pre-Nómina

**Fecha:** 2026-04-15
**Solicitante:** Agustina Cordero (Ranger)
**Estado:** PLAN — NO INICIAR hasta confirmar sincronización total con repo remoto

---

## Contexto

Mensajes recibidos del cliente (14/04/2026):

1. Las amortizaciones de descuentos en cuotas deben tener **fecha de inicio y fecha final**.
2. Debe existir **historial consultable** de las amortizaciones aplicadas.
3. Los usuarios que capturan descuentos deben **notificar cuando terminen** para que Agustina genere la nómina.
4. Los descuentos manuales deben registrarse **antes** de generar la nómina, para que se apliquen automáticamente al crearla.

---

## Objetivos

- **O1**: Soportar amortizaciones programadas con vigencia (inicio/fin) y cuotas, aplicadas automáticamente al recalcular nómina.
- **O2**: Mantener historial inmutable de cada cuota aplicada (a qué nómina, cuándo, cuota #).
- **O3**: Pantalla de consulta por empleado con saldo pendiente y progreso.
- **O4**: Flujo de captura previa: estado de período (abierto/cerrado) y notificación cuando captura está lista.
- **O5**: Al generar/recalcular nómina, jalar automáticamente amortizaciones vigentes + descuentos capturados previamente.

---

## Alcance

### Incluye
- Módulo de amortizaciones (préstamos, adelantos, descuentos recurrentes) con fecha inicio/fin y cuotas.
- Historial de aplicación por nómina.
- Integración con `nominaModel.recalcular()`.
- Dashboard de estado de captura por subnómina/período.
- Reportes de saldos pendientes.

### No incluye
- Cambios en la lógica de ISR/AFP/ARS.
- Cambios en cierre de nómina (`estado = cerrado` sigue inmutable).
- Novedades de salud (módulo independiente ya planificado).

---

## Diseño Técnico

### 1. Base de datos

**Nueva tabla: `no_amortizaciones`**
```sql
CREATE TABLE no_amortizaciones (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  id_empleado     INT NOT NULL,
  id_desc_cred    INT NOT NULL,               -- tipo (préstamo, adelanto, cooperativa, etc.)
  concepto        VARCHAR(200),                -- descripción libre
  monto_total     DECIMAL(12,2) NOT NULL,
  cuotas_totales  INT NOT NULL,
  monto_cuota     DECIMAL(12,2) NOT NULL,
  fecha_inicio    DATE NOT NULL,
  fecha_fin       DATE NOT NULL,
  cuotas_pagadas  INT NOT NULL DEFAULT 0,
  saldo_pendiente DECIMAL(12,2) NOT NULL,
  estado          ENUM('activo','pausado','finalizado','cancelado') DEFAULT 'activo',
  id_usuario_creacion INT,
  fecha_creacion  DATETIME DEFAULT CURRENT_TIMESTAMP,
  observaciones   TEXT,
  FOREIGN KEY (id_empleado) REFERENCES rh_empleado(id),
  FOREIGN KEY (id_desc_cred) REFERENCES no_desc_cred(id),
  INDEX idx_empleado_estado (id_empleado, estado),
  INDEX idx_vigencia (fecha_inicio, fecha_fin, estado)
);
```

**Nueva tabla: `no_amortizaciones_historial`**
```sql
CREATE TABLE no_amortizaciones_historial (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  id_amortizacion     INT NOT NULL,
  id_nomina           INT NOT NULL,
  id_det_nomina       INT NOT NULL,
  cuota_numero        INT NOT NULL,
  monto_aplicado      DECIMAL(12,2) NOT NULL,
  saldo_posterior     DECIMAL(12,2) NOT NULL,
  fecha_aplicacion    DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_amortizacion) REFERENCES no_amortizaciones(id),
  FOREIGN KEY (id_nomina) REFERENCES no_nominas(id),
  UNIQUE KEY uq_amort_nomina (id_amortizacion, id_nomina)
);
```

**Nueva tabla: `no_captura_estado`** (flujo pre-nómina)
```sql
CREATE TABLE no_captura_estado (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  id_tipo_nomina      INT NOT NULL,
  id_subnomina        INT NULL,
  periodo_inicio      DATE NOT NULL,
  periodo_fin         DATE NOT NULL,
  estado              ENUM('abierto','cerrado','nomina_generada') DEFAULT 'abierto',
  id_usuario_cierre   INT NULL,
  fecha_cierre        DATETIME NULL,
  observaciones       TEXT,
  UNIQUE KEY uq_periodo (id_tipo_nomina, id_subnomina, periodo_inicio, periodo_fin)
);
```

### 2. Backend (`backend-ranger-nomina/`)

**Nuevos archivos:**
- `models/amortizacionModel.js` — CRUD + lógica de aplicación de cuotas (con transacciones).
- `models/capturaEstadoModel.js` — gestión de estado de captura.
- `routes/amortizaciones.js` — endpoints REST.
- `routes/capturaEstado.js` — endpoints REST.
- `tests/amortizacionModel.test.js` — cobertura de aplicación de cuotas, saldos, finalización.

**Modificaciones:**
- `models/nominaModel.js`:
  - Nueva función privada `_aplicarAmortizaciones(id_nomina, trx)` llamada dentro de `recalcular()`.
  - Criterios: `estado='activo'` AND `fecha_inicio <= periodo_fin` AND `fecha_fin >= periodo_inicio` AND `cuotas_pagadas < cuotas_totales`.
  - Inserta en `no_desc_cred_nomina` (como deducción) + `no_amortizaciones_historial`.
  - Incrementa `cuotas_pagadas` y ajusta `saldo_pendiente`; si llega al total, marca `estado='finalizado'`.
  - Al recalcular una nómina abierta, **revertir** aplicaciones previas del historial de esa nómina antes de reaplicar (para idempotencia).
- `services/reportesService.js` (o similar): reporte de saldos pendientes por empleado.

**Endpoints:**
```
GET    /api/amortizaciones                  (paginado + filtros: empleado, estado)
GET    /api/amortizaciones/:id
GET    /api/amortizaciones/empleado/:id     (todas del empleado con historial)
POST   /api/amortizaciones
PUT    /api/amortizaciones/:id              (solo si no tiene historial, o ajustes limitados)
PATCH  /api/amortizaciones/:id/pausar
PATCH  /api/amortizaciones/:id/reanudar
PATCH  /api/amortizaciones/:id/cancelar
GET    /api/amortizaciones/:id/historial

GET    /api/captura-estado                  (filtro por tipo_nomina, subnomina, periodo)
POST   /api/captura-estado                  (abrir período)
PATCH  /api/captura-estado/:id/cerrar       (marca captura cerrada → Agustina recibe señal)
```

### 3. Frontend (`rangernomina-frontend/`)

**Nuevos componentes:**
- `amortizaciones/amortizaciones-list.component.ts` — tabla paginada con filtros.
- `amortizaciones/amortizacion-form.component.ts` — diálogo crear/editar.
- `amortizaciones/amortizacion-historial.component.ts` — diálogo historial por amortización.
- `amortizaciones/empleado-amortizaciones.component.ts` — vista consolidada por empleado.
- `captura-estado/captura-estado.component.ts` — dashboard de períodos (abierto/cerrado/generada).

**Nuevos servicios:**
- `services/amortizacion.service.ts`
- `services/captura-estado.service.ts`

**Integración UI:**
- Menú (`navmenu.component.ts`): entradas "Amortizaciones" y "Estado de Captura".
- Ficha empleado: pestaña "Amortizaciones" con saldos y progreso.
- Pantalla de creación de nómina: mostrar estado de captura del período antes de permitir crear; advertencia si sigue `abierto`.
- Detalle de nómina: mostrar amortizaciones aplicadas con link al historial.

### 4. Reportes

- **Saldos pendientes por empleado** (Excel + PDF): concepto, total, cuotas pagadas/totales, saldo, fecha fin.
- **Historial de amortizaciones por nómina**: qué cuotas se aplicaron en una nómina específica.

---

## Tareas

### Fase 0 — Prerrequisito (BLOQUEANTE)
- [ ] **T000**: Confirmar sincronización total del repo con remoto (commits, submodules, working tree limpio). Sin esto, **no iniciar nada**.

### Fase 1 — Base de datos
- [ ] **T101**: Script SQL `no_amortizaciones` + índices.
- [ ] **T102**: Script SQL `no_amortizaciones_historial` + constraints.
- [ ] **T103**: Script SQL `no_captura_estado`.
- [ ] **T104**: Seed de tipos de descuento en `no_desc_cred` para amortización (si faltan).
- [ ] **T105**: Validar en BD de desarrollo; documentar en `database/migrations/`.

### Fase 2 — Backend amortizaciones
- [ ] **T201**: `amortizacionModel.js` — CRUD básico.
- [ ] **T202**: Lógica de aplicación de cuota con transacción.
- [ ] **T203**: Lógica de reversión (para recálculo idempotente).
- [ ] **T204**: Routes `/api/amortizaciones/*`.
- [ ] **T205**: Integración en `nominaModel.recalcular()`.
- [ ] **T206**: Tests unitarios (creación, aplicación, reversión, finalización automática, casos borde de vigencia).
- [ ] **T207**: Tests de integración con `recalcular()`.

### Fase 3 — Backend captura-estado
- [ ] **T301**: `capturaEstadoModel.js` + `routes/capturaEstado.js`.
- [ ] **T302**: Bloqueo/advertencia en creación de nómina si estado ≠ `cerrado`.
- [ ] **T303**: Tests.

### Fase 4 — Frontend amortizaciones
- [ ] **T401**: Servicio `amortizacion.service.ts` con interfaces TS.
- [ ] **T402**: Lista paginada con filtros.
- [ ] **T403**: Diálogo crear/editar con validación (cuotas > 0, fecha_fin > fecha_inicio, monto_cuota = monto_total/cuotas).
- [ ] **T404**: Diálogo historial.
- [ ] **T405**: Vista por empleado (integrada a ficha empleado).
- [ ] **T406**: Entradas de menú + permisos (nivel ≥ X).

### Fase 5 — Frontend captura-estado
- [ ] **T501**: Servicio + dashboard de estado de captura.
- [ ] **T502**: Notificación/alerta visual a Agustina cuando períodos pasan a `cerrado`.
- [ ] **T503**: Integración en pantalla de creación de nómina.

### Fase 6 — Reportes y ajustes
- [ ] **T601**: Reporte Excel de saldos pendientes.
- [ ] **T602**: Reporte PDF de historial por nómina.
- [ ] **T603**: Mostrar amortizaciones aplicadas en volante de pago (opcional — validar con Agustina).

### Fase 7 — QA y despliegue
- [ ] **T701**: Pruebas E2E con datos reales de producción (sandbox).
- [ ] **T702**: Documentación de usuario (manual de amortizaciones).
- [ ] **T703**: Capacitación a Agustina y capturistas.
- [ ] **T704**: Migración de amortizaciones existentes (si las hay capturadas manualmente en `no_desc_cred_nomina`).
- [ ] **T705**: Despliegue a producción.

---

## Riesgos y consideraciones

- **Idempotencia de recálculo**: si una nómina se recalcula varias veces, las amortizaciones deben revertirse y reaplicarse correctamente. Cubrir exhaustivamente con tests.
- **Nóminas cerradas**: amortizaciones aplicadas en nóminas cerradas son inmutables. El historial las preserva.
- **Migración de datos**: si hay préstamos ya en curso capturados manualmente, diseñar proceso de importación masiva (Excel).
- **Cálculo de cuota**: validar si el cliente quiere cuota fija o cuota = resto/restante al final. Confirmar con Agustina.
- **Fecha de aplicación**: definir si la cuota aplica por `fecha_nomina`, `periodo_inicio` o `periodo_fin`. Confirmar regla.
- **Descuentos concurrentes**: un empleado puede tener varias amortizaciones activas simultáneas. Validar que la suma no exceda cierto % del salario (regla legal DR: máx 25-30% del salario según caso).

---

## Preguntas para confirmar con Agustina antes de iniciar

1. ¿La cuota es siempre fija (monto_total/cuotas) o puede ajustarse manualmente?
2. ¿Qué porcentaje máximo del salario se puede descontar en un período por todas las amortizaciones juntas?
3. ¿Pueden existir amortizaciones en moneda distinta a RD$?
4. ¿Las amortizaciones deben aparecer en el volante de pago con detalle (concepto + cuota X/Y) o agrupadas?
5. ¿Quién puede crear/editar amortizaciones? ¿Solo nivel 9 o también capturistas?
6. ¿Debe notificarse por email/sistema a Agustina cuando un período se marca como `cerrado`?

---

## Estado

**NO INICIADO** — Esperando:
1. Confirmación de repo totalmente sincronizado con remoto.
2. Respuestas del cliente a las preguntas de la sección anterior.
3. Priorización: ¿iniciar por amortizaciones (O1-O3) o por flujo pre-nómina (O4)?
