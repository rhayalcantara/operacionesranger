# Preguntas — Integración Nómina Operacional (RangerNomina ↔ OperacionesRanger)

**Fecha creación:** 2026-04-09
**Objetivo:** Procesar la nómina de operaciones (guardianes) directamente desde RangerNomina, leyendo datos de turnos registrados en OperacionesRanger, en vez de solo exportar CSV.

**Copia local del Código de Trabajo:** `Docs/codigo-de-trabajo.pdf` (+ versión texto `Docs/codigo-de-trabajo.txt` para búsquedas rápidas).

---

## ✅ Decisiones arquitectónicas tomadas

### DA-01 (2026-04-09): `horas_dia` y `dias_mes` son propiedades configurables por tipo de nómina

> ✅ **CONFIRMADO POR EL USUARIO 2026-04-09** — Enfoque A (divisor fijo, independiente del mes real). Valores lockeados: Admin = `8h × 5.5 días × 23.83 días/mes`, Operacional = `10h × 6 días × 26 días/mes`. Ver justificación y fuentes en la sección "Duración de la quincena" más abajo.

**Decisión:** Eliminar las constantes hardcodeadas `HORAS_DIA = 8` y `DIAS_LABORALES_MES = 23.83` y convertirlas en propiedades configurables del tipo de nómina (`no_tipo_nomina`), que se copian como snapshot a cada nómina creada (`no_nominas`).

**Por qué:**
- Permite que cada tipo de nómina (Administración, Operacional, Regalía, etc.) tenga su propia jornada sin tocar código.
- **Futuro-proof**: otros países (y tendencia creciente en RD) están migrando a semanas de 4 días — si mañana Guardianes Ranger o un nuevo cliente lo adopta, solo se cambia la configuración del tipo, no código.
- Las nóminas cerradas conservan sus valores históricos (inmutabilidad) aunque cambie la configuración después.
- Resuelve el bug actual donde operaciones usa `8h/día × 23.83 días` en vez de `10h/día × 26 días`.

**Modelo de datos propuesto:**

```sql
-- Configuración por tipo (default para nuevas nóminas)
ALTER TABLE no_tipo_nomina
  ADD COLUMN horas_dia DECIMAL(4,2) NOT NULL DEFAULT 8.00,
  ADD COLUMN dias_semana DECIMAL(3,1) NOT NULL DEFAULT 5.5,
  ADD COLUMN dias_mes DECIMAL(5,2) NOT NULL DEFAULT 23.83;

-- Snapshot al momento de crear la nómina (inmutabilidad histórica)
ALTER TABLE no_nominas
  ADD COLUMN horas_dia DECIMAL(4,2) NOT NULL DEFAULT 8.00,
  ADD COLUMN dias_semana DECIMAL(3,1) NOT NULL DEFAULT 5.5,
  ADD COLUMN dias_mes DECIMAL(5,2) NOT NULL DEFAULT 23.83;
```

**Valores iniciales (migración):**

| Tipo Nómina | `horas_dia` | `dias_semana` | `dias_mes` | Base legal |
|---|---|---|---|---|
| Administrativa (ID 1) | 8.00 | 5.5 | 23.83 | Art. 147 |
| Operacional (ID 2) | 10.00 | 6.0 | 26.00 | Art. 150 |
| Regalía Pascual (ID 3) | 8.00 | 5.5 | 23.83 | (no aplica, es anual) |

**Impacto en el código:**

1. Eliminar de `utils/payrollConstants.js`:
   - ❌ `HORAS_DIA` (hardcoded 8)
   - ❌ `DIAS_LABORALES_MES` (hardcoded 23.83)
   - ❌ `DIAS_VIGILANTE_MES` (hardcoded 26)
   - ✅ Mantener: `DIAS_QUINCENA`, `ID_PUESTO_VIGILANTE`, `ID_NOMINA_OPERACIONAL`, `MAX_CUOTAS_*`

2. En `nominaModel.recalcular()`: ya carga `nominaInfo`, solo añadir `horas_dia`, `dias_mes` al SELECT y usarlos en vez de constantes.

3. En `importService.importHoras()`: recibir `horas_dia` y `dias_mes` de la nómina, no de constantes:
   ```js
   const salarioPorHora = empleado.salario_act / nomina.dias_mes / nomina.horas_dia;
   ```

4. En `_calcularMontoVacaciones()`: mismo patrón — usar `nomina.dias_mes` en vez de `DIAS_LABORALES_MES` / `DIAS_VIGILANTE_MES`. El caso especial del vigilante (id_puesto=97) podría desaparecer si los tipos de nómina ya capturan la diferencia.

5. Al crear una nueva nómina (`nominaModel.create()`): copiar `horas_dia`, `dias_semana`, `dias_mes` desde `no_tipo_nomina` al registro de `no_nominas` (snapshot).

6. UI: agregar campos editables en el mantenimiento de `no_tipo_nomina` (solo nivel 9). En la creación/edición de nómina mostrarlos como **readonly** (se heredan del tipo, pero quedan visibles para auditoría).

**Beneficio colateral:** esto deja preparado el sistema para manejar la **semana de 4 días** (ejemplo: `horas_dia=10, dias_semana=4, dias_mes=17.33`) sin tocar código.

**Preguntas abiertas que quedan:**
- ¿Permitimos editar `horas_dia` de una nómina ya creada (antes de cerrarla) por si alguien se equivocó al configurar el tipo? → sugerencia: **sí**, solo nivel 9 y mientras esté abierta.
- ¿Agregamos también `horas_semana` o lo derivamos (`horas_dia × dias_semana`)? → sugerencia: derivarlo para evitar inconsistencias.
- ¿Qué hacer con nóminas ya cerradas que tienen los valores hardcodeados? → migración que rellena con los defaults según el tipo que tenían.

---

## ⚖️ Base legal — Código de Trabajo de la República Dominicana

Artículos clave que sustentan la diferencia de jornada entre Administración y Operaciones:

### Art. 147 — Jornada normal (ADMINISTRACIÓN)
> "La duración normal de la jornada de trabajo… **no podrá exceder de ocho horas por día ni de cuarenta y cuatro horas por semana**. La jornada semanal de trabajo terminará a las doce horas meridiano del día sábado."

➡️ Esto es lo que usa la nómina administrativa actual: **8 h/día × 5.5 días = 44 h/sem**, que se promedia a `DIAS_LABORALES_MES = 23.83`.

### Art. 149 — Definición de jornadas
- **Diurna**: 7:00 AM – 9:00 PM
- **Nocturna**: 9:00 PM – 7:00 AM
- **Mixta**: períodos diurno y nocturno (si el nocturno es < 3h). Si es ≥ 3h se considera nocturna.

### Art. 150 — Excepciones (OPERACIONES / VIGILANTES)
> "La disposición del artículo 147 **no es aplicable**, salvo convención en contrario:
> […]
> Tampoco es aplicable a los trabajadores que ejecuten **labores intermitentes o que requieran su sola presencia en el lugar de trabajo**.
> Sin embargo, estos trabajadores **no pueden permanecer más de diez horas diarias en el lugar de su trabajo**."

➡️ **Esta es la base legal** de las 10 horas para operaciones/vigilantes. Los guardianes de seguridad entran en "labores que requieran su sola presencia" → límite legal **10 h/día**.

➡️ Por eso `DIAS_VIGILANTE_MES = 26` en el código: vigilantes trabajan 6 días/semana incluyendo sábados, y pueden llegar a 10 h/día (vs 8 h/día admin).

### Art. 157 — Jornadas corridas
> "Por acuerdo entre el empleador y sus trabajadores, se pueden establecer jornadas corridas de trabajo, siempre que **no excedan de diez horas diarias en las actividades comerciales** y de nueve en las industriales, sin que en ningún caso la jornada semanal pueda exceder de cuarenta y cuatro horas."

### Art. 158 — Empresas de funcionamiento continuo
> "En las empresas donde el trabajo sea de funcionamiento continuo en razón de la naturaleza misma del trabajo el personal debe turnarse cada ocho horas de trabajo. En estos casos **la jornada puede prolongarse una hora más** pero el promedio semanal no podrá exceder, en ningún caso, de **cincuenta horas**, pagándose como horas extraordinarias las rendidas sobre las cuarenta y cuatro horas semanales."

➡️ Seguridad 24/7 encaja aquí: turnos de 8h, se pueden extender a 9h, pero todo lo que pase de **44 h/semana es horas extras**.

### Art. 203 — Tarifa de horas extras
1. **+35%** sobre hora normal → por cada hora en exceso de la jornada y hasta 68 h/semana.
2. **+100%** sobre hora normal → por cada hora en exceso de 68 h/semana.

### Art. 204 — Recargo nocturno
> "Los salarios correspondientes a las horas de la jornada nocturna deben pagarse a los trabajadores con un aumento **no menor del quince por ciento (15%)** sobre el valor de la hora normal."

➡️ **El 15% no es "otro tipo de hora extra"** — es el recargo por trabajar en horario nocturno (9 PM – 7 AM), independientemente de si son horas normales o extras.

### Art. 205 — Día feriado trabajado
> "Cuando por convención entre las partes, el trabajador preste servicios en un día declarado legalmente no laborable, recibirá como retribución el salario a que tiene derecho **aumentado en un ciento por ciento (100%)**."

➡️ Feriado trabajado = salario normal + recargo 100% = **salario doble**.

### Art. 164 — Descanso semanal trabajado
> "Si el trabajador presta servicio en el período de su descanso semanal, puede optar entre recibir su salario ordinario **aumentado en un ciento por ciento** o disfrutar en la semana siguiente de un descanso compensatorio igual al tiempo de su descanso semanal."

### Art. 165 + Ley 139-97 — Días feriados
Los días declarados no laborables por la Constitución o las leyes son descanso remunerado. La **Ley 139-97** regula el traslado de feriados que caen martes/miércoles/jueves/viernes al lunes más cercano (para aumentar productividad). Esto ya está modelado en `ot_feriados` con `tipo = NACIONAL/DECRETO`.

### Art. 169 — Excepción de cierre obligatorio para servicios de vigilancia
Art. 166-167 obligan a cerrar establecimientos los domingos y feriados. Art. 169 **exceptúa** hospitales, hoteles, casinos, **agencias** y otros servicios continuos. Los servicios de seguridad/vigilancia encajan en esta excepción legalmente. ➡️ Trabajar en feriado es **legal** para vigilantes; lo que cambia es solo la compensación (Art. 205).

---

## 🔀 Combinación de recargos — zona gris del Código

El Código de Trabajo define cada recargo por separado pero **NO especifica cómo combinarlos** cuando coinciden varios. Ej: una hora extra nocturna trabajada en un feriado podría combinar 35% + 15% + 100%.

**Fuente**: el estudio jurídico Medina Rivera & Asociados confirma explícitamente que "the document does not explicitly specify whether premiums are additive or multiplicative when conditions overlap". Queda a interpretación de la empresa (sujeto a revisión del Ministerio de Trabajo y tribunales laborales).

### Dos enfoques posibles

**🅰️ Enfoque Aditivo (lo más común en DR)** — simplemente se suman los porcentajes:

| Escenario | Fórmula | % sobre hora normal |
|---|---|---|
| Hora normal diurna | `H × 1.00` | 0% |
| Hora normal nocturna | `H × 1.15` | +15% |
| Hora extra diurna | `H × 1.35` | +35% |
| Hora extra nocturna | `H × (1 + 0.35 + 0.15)` | **+50%** |
| Hora feriado normal diurna | `H × 2.00` | +100% |
| Hora feriado normal nocturna | `H × (1 + 1.00 + 0.15)` | **+115%** |
| Hora extra feriado diurna | `H × (1 + 1.00 + 0.35)` | **+135%** |
| Hora extra feriado nocturna | `H × (1 + 1.00 + 0.35 + 0.15)` | **+150%** |
| Hora extra > 68/sem (Art. 203§2) | `H × (1 + 1.00)` | +100% |

**🅱️ Enfoque Multiplicativo** — cada recargo se calcula sobre el anterior:

| Escenario | Fórmula | % sobre hora normal |
|---|---|---|
| Hora extra nocturna | `H × 1.35 × 1.15` | **+55.25%** |
| Hora feriado nocturna | `H × 2.00 × 1.15` | **+130%** |
| Hora extra feriado nocturna | `H × 2.00 × 1.35 × 1.15` | **+210.5%** |

### Confirmación web

La búsqueda web devolvió resultados **favorables al enfoque Aditivo** como la interpretación estándar:

> "Work at night is compensated with an increase of 15% on the value of the regular hour, which is **added to the surcharge for overtime hours**, ensuring fair remuneration" — Impulsa Popular (Banco Popular)

> "both the 35% overtime surcharge and the 15% night work surcharge are applied **cumulatively**" — Suazo Rivas & Asociados (interpretación resumida)

El enfoque aditivo es:
- ✅ Más simple de implementar y explicar
- ✅ Más consistente con la letra del Art. 204 ("sobre el valor de la hora normal" — siempre referido a la hora normal base, no a la hora ya recargada)
- ✅ Favorece al trabajador en casos ambiguos (principio in dubio pro operario)
- ❌ Matemáticamente "pierde" un poco de compensación cuando hay múltiples recargos

### Decisión pendiente

- **a)** ¿Adoptamos **Enfoque Aditivo**? → mi recomendación
- **b)** ¿O Enfoque Multiplicativo?
- **c)** ¿O quieres replicar **exactamente** lo que Guardianes Ranger está haciendo hoy en sus nóminas manuales? Si es así, necesito un ejemplo numérico concreto de una quincena reciente.

---

## 🚨 Hallazgo importante sobre el código actual

En `services/importService.js` línea 57:
```js
const salarioPorHora = empleado.salario_act / DIAS_LABORALES_MES / HORAS_DIA;
// = salario / 23.83 / 8 = salario / 190.64 h/mes
```

**Problema**: Esta fórmula usa parámetros de administración (8 h/día × 23.83 días) para **todos** los empleados, incluidos los vigilantes. Un vigilante trabaja 10 h/día × 26 días = 260 h/mes, por lo que **su tarifa horaria real es distinta**.

Si el sueldo bruto es el mismo:
- Admin: `salario / 190.64 = tarifa más alta por hora` ✅ correcto
- Vigilante actual (bug): `salario / 190.64 = tarifa inflada` ❌
- Vigilante correcto: `salario / 260 = tarifa real` ✅

**Esto hay que corregirlo en la integración** — los vigilantes deben tener su propia fórmula. Según DA-01 (configurabilidad por tipo de nómina), el fix es:
```js
const salarioPorHora = empleado.salario_act / nomina.dias_mes / nomina.horas_dia;
// Operacional: salario / 26 / 10 = salario / 260 h/mes ✅
// Admin:       salario / 23.83 / 8 = salario / 190.64 h/mes ✅
```

---

## 📅 Duración de la quincena — hallazgos 2026-04-09

### ¿El Código de Trabajo define "quincena"?

**No.** El Código de Trabajo de RD **no define** la duración exacta de una quincena:
- **Art. 192** solo la menciona como una modalidad válida de pago ("por hora, por día, por semana, **por quincena** o por mes"), sin especificar días.
- **Art. 198** solo impone que el período de pago no exceda 1 mes.
- **Art. 147** fija 44 h/semana como jornada normal (base del divisor 23.83), pero **Art. 150 excluye** a los vigilantes de esa regla.

**Conclusión legal**: la duración exacta de la quincena y el método de prorrateo **son convención de la empresa**, no obligación legal.

### Práctica dominicana estándar (fuentes web)

Para empleados administrativos, la práctica consolidada en RD usa **divisores fijos**, independientes de si el mes real tiene 28, 30 o 31 días:

| Concepto | Divisor | Derivación |
|---|---|---|
| Salario mensual → diario | `÷ 23.83` | 52 sem × 5.5 días ÷ 12 meses |
| Salario quincenal → diario | `÷ 11.91` | 23.83 ÷ 2 |

Estos valores son usados consistentemente por Alegra Nómina, NomiGo+, Siempre al Día, CGR Lawyer y la mayoría de sistemas dominicanos.

### Aplicación a vigilantes (Guardianes Ranger)

Con los parámetros de jornada para operaciones (10 h/día × 6 días/semana, Art. 150), el paralelo matemático es:

| Concepto | Cálculo | Valor |
|---|---|---|
| Semanas por mes promedio | 52 ÷ 12 | 4.333 sem/mes |
| Días trabajados por mes | 4.333 × 6 | **26 días/mes** |
| Días trabajados por quincena | 26 ÷ 2 | **13 días/quincena** |
| Horas trabajadas por quincena | 13 × 10 | **130 h/quincena** |
| Horas trabajadas por mes | 26 × 10 | **260 h/mes** |
| Tarifa horaria (base mensual) | `sueldo_mensual / 260` | |
| Tarifa horaria (base quincenal) | `sueldo_quincenal / 130` | |

### Decisión tomada: Enfoque A — Divisor fijo ✅

**Usuario confirmó 2026-04-09**: se adopta **Enfoque A (divisor fijo)** para operaciones, consistente con la práctica dominicana estándar:

- `dias_mes = 26` para tipo Operacional, **constante todos los meses** (no se recalcula por mes real)
- Las diferencias entre meses de 28/30/31 días **se cancelan a lo largo del año**
- Si un mes requiere ajuste excepcional (ausencia, feriado especial), se registra manualmente en `no_desc_cred_nomina`
- Es lo que ya usa tu código (`DIAS_VIGILANTE_MES = 26`), por lo que la migración es mínima

**Opciones descartadas:**
- ❌ Enfoque B (días calendario reales por quincena): más justo pero complejidad operativa no justificada
- ❌ Enfoque C (híbrido sueldo base fijo + descuentos reales): se logra lo mismo con Enfoque A + ajustes manuales cuando haga falta

### Valores finales para DA-01

```sql
-- no_tipo_nomina tras la migración
Administrativa (ID 1):  horas_dia=8.00,  dias_semana=5.5, dias_mes=23.83
Operacional    (ID 2):  horas_dia=10.00, dias_semana=6.0, dias_mes=26.00
Regalía        (ID 3):  horas_dia=8.00,  dias_semana=5.5, dias_mes=23.83
```

### Fuentes consultadas

- [Código de Trabajo RD (PDF)](https://docs.republica-dominicana.justia.com/nacionales/codigos/codigo-de-trabajo.pdf) — copia local en `Docs/codigo-de-trabajo.pdf`
- [Cómo calcular el salario diario en RD — Siempre al Día](https://siemprealdia.co/republica-dominicana/derecho-laboral/formula-para-calcular-el-salario-diario/)
- [Cómo calcular el salario diario correctamente — Alegra](https://blog.alegra.com/republica-dominicana/calcular-el-salario-diario/)
- [Cómo Calcular el TSS 2025 — NomiGo+](https://www.nomigoplus.com/como-calcular-el-tss-en-republica-dominicana-2025-guia-completa/)
- [Nómina de empleados en RD — CGR Lawyer](https://cgrlawyer.com.do/2024/10/15/nomina-de-empleados-en-republica-dominicana/)
- [Gestión de nóminas y TSS — Siempre al Día](https://siemprealdia.co/republica-dominicana/derecho-laboral/gestion-de-nominas-y-seguridad-social/)

---

## ✅ Inventario — Lo que YA existe en RangerNomina

Antes de preguntar, esto es lo que ya está construido y se puede reutilizar:

### Constantes (`backend-ranger-nomina/utils/payrollConstants.js`)
```js
DIAS_LABORALES_MES = 23.83     // Días laborales promedio (excluye sáb/dom)
DIAS_VIGILANTE_MES = 26        // Días/mes para vigilantes (incluye sábados)
DIAS_QUINCENA = 15             // Días por quincena
HORAS_DIA = 8                  // Horas laborales estándar por día
ID_PUESTO_VIGILANTE = 97       // FK en rh_empleado.id_puesto
ID_NOMINA_OPERACIONAL = 2      // FK en no_tipo_nomina = "Operacional"
```

### Tipo de nómina "Operacional" ya creado
- `no_tipo_nomina` ID=2, descripción "Operacional", periodo QUINCENAL
- Ya tiene su subnómina asociada

### Lógica especial ya implementada en `nominaModel.js`

**`recalcular()` línea ~857:**
```js
const esNominaOperacional = id_tipo_nomina === 2;
```
Cuando detecta nómina operacional:
- **No usa** `rh_empleado.salario_act` como sueldo quincenal
- **Lee** el sueldo bruto desde `no_desc_cred_nomina` con `id_desc_cred = 8` (concepto "Sueldo_Bruto")
- Esto significa que el sueldo operacional se **captura por nómina**, no es fijo

**`_calcularMontoVacaciones()` línea ~805:**
- Si `empleado.id_puesto === 97` (vigilante) → usa `salario_act / 26 días` (incluye sábados)
- Si `empleado.id_nomina === 2` (operacional no-vigilante) → usa promedio salarial del último año

### Importación de horas vía Excel (`services/importService.js`)
Endpoint: `POST /nomina/:id/import-horas`

Columnas del Excel esperadas:
- `CODIGO` — id_empleado
- `HORAS DÍA` — (actualmente parseado pero no usado)
- `HORAS EXTRAS` — cantidad de horas base (se guarda como cantidad)
- `HORAS 35%` — monto calculado 35%
- `HORAS 15%` — monto calculado 15%

Guarda en `no_desc_cred_nomina` con `automanual='I'` usando los 3 conceptos:
- `horas extras` (cantidad base)
- `horas extras 35` (monto)
- `horas extras 15` (monto)

Tarifa horaria calculada: `salario_act / 23.83 / 8` (nota: usa días laborales, NO días de vigilante)

### Conceptos ya existentes en `no_desc_cred`
**Ingresos aplicables a operaciones:**
- ID 4  — Vacaciones
- ID 5  — horas extras (base, cantidad)
- ID 6  — horas extras 35%
- ID 7  — horas extras 15%
- ID 8  — Sueldo_Bruto (operacional — se captura por nómina)
- ID 18 — Otras Extras
- ID 19 — DIA FERIADO
- ID 20 — DIAS LIBRES
- ID 28 — DIAS LABORADOS
- ID 30 — ARMAS

**Deducciones:**
- AFP, SFS, ISR (automáticos)
- Uniforme, botas, flota, cuartel, daños, municiones, préstamos coop, etc.

### Lo que YA hace OperacionesRanger (`ot_turnos`)
Cada turno registra:
- `horas_normales` (0-12), `horas_extras` (0-4)
- `tipo_turno`: DIURNO/NOCTURNO
- `es_feriado` + `feriado_id` (NACIONAL/DECRETO)
- `procesado_nomina` + `nomina_id` (para inmutabilidad)
- Incentivo por puesto: `ot_incentivos_puesto.valor_hora = monto / 360`

---

## ❌ Lo que NO existe y hay que construir

1. **Lectura directa de `ot_turnos` desde RangerNomina** — hoy solo importa desde Excel
2. **Servicio/endpoint** que jale turnos del período y los convierta en registros `no_desc_cred_nomina`
3. **Cálculo de incentivos por puesto** dentro de la nómina
4. **Cálculo de feriado trabajado** con tasa especial (hoy solo existe el concepto ID 19 "DIA FERIADO" pero sin fórmula)
5. **Marcado de `ot_turnos.procesado_nomina = TRUE`** al cerrar la nómina (ya existe endpoint en Operaciones pero no se llama desde Nómina)
6. **UI en RangerNomina** con botón "Jalar desde Operaciones" en la nómina operacional abierta

---

# 📋 Preguntas por tema (responder punto por punto)

## 1️⃣ Alcance de cálculos

### 1.0 🆕 Jornada diaria: 8h (admin) vs 10h (operaciones)
**Base legal:** Art. 150 del Código de Trabajo — los trabajadores de "sola presencia" (vigilantes) pueden estar hasta **10 horas diarias** en el lugar de trabajo.

> ✅ **RESUELTO PARCIALMENTE** — ver **DA-01** arriba. `horas_dia` y `dias_mes` pasan a ser propiedades configurables por tipo de nómina. Admin = 8h/23.83d, Operacional = 10h/26d.

Preguntas que quedan pendientes incluso con DA-01:

- **a)** ¿Confirmas que los vigilantes de Guardianes Ranger efectivamente trabajan **10 h/día × 26 días/mes**? (es lo que usaremos como default del tipo Operacional)
- **b)** ¿Hay puestos de operaciones con jornadas diferentes (ej: supervisores 8h, o turnos especiales de 12h)? Si sí, ¿son tantos que justifican otro tipo de nómina, o son excepciones que se ajustan manualmente en la nómina?
- **c)** ¿Los vigilantes descansan 1 día completo a la semana (por lo que son 6 días × 4.33 sem ≈ 26)? ¿O rotan y el promedio real es otro?
- **d)** En la UI de administración del tipo de nómina, ¿quién puede editar estos valores? → propuesta: solo nivel 9.

**Respuesta:**
a) si 10 * 15 es para el sueldo para operaciones
b) si pueden haber puestos pero tenemos una subnomina independientes para ellos
c) entiendo que por semana rotan de turno en una trabajan de dia en la otra de noche
d) si nivel 9

> 📝 **Aclaración posterior (2026-04-09)**: El usuario corrigió que no son 15 días calendario sino **13 días trabajados** por quincena (los 2 días restantes son los libres). La cifra correcta es:
> - **13 días × 10 horas = 130 horas por quincena**
> - **26 días × 10 horas = 260 horas por mes**
>
> Se adoptó **Enfoque A (divisor fijo)** — ver sección "Duración de la quincena" arriba. Valor lockeado para tipo Operacional: `dias_mes = 26`, `horas_dia = 10`, `dias_semana = 6`. ✅ **Sección 1.0 CERRADA.**

> 📝 **Nota sobre 1.0.c (rotación diurna/nocturna)**: La rotación semanal día/noche implica que los recargos nocturnos (+15% Art. 204) aplicarán a **aproximadamente la mitad de los turnos** cada quincena. Esto se discute en la pregunta 1.2 más abajo.

---

### 1.1 Horas normales — ¿cómo se pagan?

**Respuesta del usuario (2026-04-09):**
> "Se toma como que el empleado debe completar primero las 130 horas para salario nominal luego se toma las horas trabajadas después de las 10 horas como horas extra siempre que estén dentro de las horas diurnas; para las nocturnas hay especificaciones en el código, lo mismo para feriados y feriados nocturnos."

### 📋 Modelo de compensación adoptado

El modelo es **híbrido (Filosofía C)**: sueldo base fijo garantizado + recargos por exceso **diario** y condiciones especiales.

#### 🧮 Reglas de cálculo

1. **Sueldo base garantizado**: el empleado cobra su `sueldo_bruto` quincenal completo si **completó sus 130 horas esperadas** (10 h × 13 días trabajados en la quincena).

2. **Horas extras diarias**: cualquier hora trabajada **por encima de 10 h en un solo día** es hora extra. El umbral es **diario**, no semanal — esto encaja con Art. 150 que fija "no permanecer más de diez horas diarias" como la jornada legal del vigilante.

3. **Clasificación por franja horaria** (Art. 149):
   - **Diurnas**: 7:00 AM – 9:00 PM
   - **Nocturnas**: 9:00 PM – 7:00 AM
   - Las horas extras se clasifican según la franja en que fueron trabajadas.

4. **Recargos aplicables** (Art. 203, 204, 205):
   - Extra diurna → **+35%** (Art. 203)
   - Extra nocturna → **+35% + 15% = +50%** (Art. 203 + 204, enfoque aditivo)
   - Normal nocturna (dentro de las 10h) → **+15%** (Art. 204) si el turno cae en franja nocturna
   - Feriado trabajado (normal diurna) → **+100%** (Art. 205)
   - Feriado trabajado nocturno → **+100% + 15% = +115%**
   - Feriado extra diurna → **+100% + 35% = +135%**
   - Feriado extra nocturna → **+100% + 35% + 15% = +150%**

5. **Horas > 68/semana** (Art. 203 §2): las horas extras que hacen que el total semanal supere las 68 horas se pagan a **+100%** en vez de +35%. Esto es raro para vigilantes (60 h normales + hasta 8 extras semanales ≈ 68).

#### ⚠️ Puntos pendientes de clarificación (bloqueantes para implementar)

Los siguientes puntos no quedaron del todo claros en la respuesta. Son necesarios para implementar correctamente:

**a) ¿Qué pasa si el empleado NO completa las 130 horas?**

Ejemplo: vigilante con sueldo quincenal de RD$15,000 que solo trabajó 120 horas (faltó 10h por ausencia injustificada).

- **Opción i** — Cobra RD$15,000 completo igual (el sueldo es garantizado incondicionalmente). Las ausencias se manejan por RRHH con medidas disciplinarias, no descuentos.
- **Opción ii** — Cobra prorrateado: `RD$15,000 × (120/130) = RD$13,846`. Se descuenta automáticamente por las horas no trabajadas.
- **Opción iii** — Cobra RD$15,000 menos las horas faltantes a tarifa normal: `RD$15,000 − (10 × tarifa)`.
- **Opción iv** — Depende de la razón: ausencia justificada = Opción i; injustificada = Opción ii o iii.

**b) ¿Las horas nocturnas NORMALES (no extras, dentro de las 10h del día) llevan recargo +15%?**

Tú confirmaste en 1.0.c que los vigilantes rotan día/noche semanalmente. Entonces una quincena puede tener ~6-7 turnos nocturnos completos de 10h cada uno (60-70 h nocturnas normales).

- **Opción i** — Sí, el +15% aplica a **todas** las horas en franja 9PM-7AM, aunque estén dentro de las 10h normales. Esto significa que un turno nocturno completo de 10h genera un ingreso adicional (10h × 0.15 × tarifa).
- **Opción ii** — No, el +15% solo aplica a extras nocturnas. El sueldo base ya compensa la rotación día/noche implícitamente.
- **Opción iii** — Sí, pero solo para las horas que caen estrictamente entre 9PM y 7AM (no para el tipo de turno completo). Esto requiere cálculo preciso de hora_entrada/hora_salida.

La letra del Art. 204 dice "las horas de la jornada nocturna deben pagarse con un aumento no menor del 15%". Interpretación literal = **Opción i** (todas las horas nocturnas, normales o extras). Pero en la práctica, muchas empresas lo tratan como **Opción ii** asumiendo que el sueldo base ya incluye el mix rotativo.

**c) Combinación de recargos: ¿Aditivo o Multiplicativo?**

Esta decisión está en la sección "🔀 Combinación de recargos — zona gris del Código" arriba. Mi recomendación es **Aditivo** (el estándar dominicano), pero necesito tu confirmación.

**d) Clasificación diurna/nocturna cuando un turno cruza ambas franjas**

Un turno de 6 PM a 4 AM (10h) cruza ambas franjas: 3h diurnas (6-9 PM) + 7h nocturnas (9 PM - 4 AM).

- **Opción i** — Usar `ot_turnos.tipo_turno` (DIURNO/NOCTURNO) como clasificación del turno completo. Simple pero impreciso.
- **Opción ii** — Calcular proporcionalmente usando `hora_entrada` y `hora_salida` de `ot_turnos`. Preciso pero más complejo.

**Mi propuesta técnica**:
- Arrancar con Opción i (tipo_turno) para el MVP
- Agregar Opción ii después como mejora

**Respuestas del usuario (2026-04-09):**
- **a)** "se pagan las horas trabajadas" → **Opción iii modificada**: pago estrictamente por horas efectivas. NO hay sueldo base garantizado. Si trabajó 120h cobra 120 × tarifa, si trabajó 130h cobra 130 × tarifa. El "sueldo bruto quincenal" del contrato es una referencia (130 × tarifa esperada), pero el pago real es siempre `horas_reales × tarifa`.
- **b)** "sí" → **Opción i**: interpretación literal del Art. 204. **Todas** las horas trabajadas en franja nocturna (9PM-7AM) reciben +15%, sean normales o extras.
- **c)** "a" → **Enfoque Aditivo** confirmado. Los recargos se suman (35% + 15% = 50%, no se multiplican).
- **d)** "i" → **MVP con `tipo_turno`**: clasificación del turno completo como DIURNO o NOCTURNO. Refinamiento con `hora_entrada/hora_salida` se deja para después.

---

## ✅ Sección 1.1 CERRADA — Modelo de compensación completo

### 🧮 Fórmula canónica

Dado:
- `tarifa = sueldo_contrato_quincenal / 130` (o `sueldo_mensual / 260`)
- Por cada turno en `ot_turnos` del período de la nómina, con campos: `horas_normales`, `horas_extras`, `tipo_turno` (DIURNO/NOCTURNO), `es_feriado` (0/1)

Algoritmo (por empleado, por quincena):
```
Inicializar acumuladores en 0:
  h_normal_diurno, h_normal_nocturno
  h_extra_diurno, h_extra_nocturno
  h_fer_normal_diurno, h_fer_normal_nocturno
  h_fer_extra_diurno, h_fer_extra_nocturno

Para cada turno del empleado en el período:
  es_nocturno = (tipo_turno == 'NOCTURNO')
  es_feriado  = (es_feriado == 1)

  Si es_feriado:
    Si es_nocturno:
      h_fer_normal_nocturno += turno.horas_normales
      h_fer_extra_nocturno  += turno.horas_extras
    Sino:
      h_fer_normal_diurno   += turno.horas_normales
      h_fer_extra_diurno    += turno.horas_extras
  Sino:
    Si es_nocturno:
      h_normal_nocturno += turno.horas_normales
      h_extra_nocturno  += turno.horas_extras
    Sino:
      h_normal_diurno   += turno.horas_normales
      h_extra_diurno    += turno.horas_extras
```

Cálculo del pago (enfoque aditivo):
```
sueldo_base =
    (h_normal_diurno    + h_normal_nocturno +
     h_extra_diurno     + h_extra_nocturno  +
     h_fer_normal_diurno + h_fer_normal_nocturno +
     h_fer_extra_diurno  + h_fer_extra_nocturno) × tarifa

recargo_nocturno_normal =
    (h_normal_nocturno + h_fer_normal_nocturno) × tarifa × 0.15

recargo_extras_35 =
    (h_extra_diurno + h_extra_nocturno +
     h_fer_extra_diurno + h_fer_extra_nocturno) × tarifa × 0.35

recargo_extras_nocturnas_15 =
    (h_extra_nocturno + h_fer_extra_nocturno) × tarifa × 0.15

recargo_feriado_100 =
    (h_fer_normal_diurno + h_fer_normal_nocturno +
     h_fer_extra_diurno + h_fer_extra_nocturno) × tarifa × 1.00

total_pagar = sueldo_base + recargo_nocturno_normal +
              recargo_extras_35 + recargo_extras_nocturnas_15 +
              recargo_feriado_100
```

### 📊 Verificación con ejemplo numérico

Vigilante con tarifa = **RD$100/hora** que trabajó la siguiente quincena:
- **11 días normales diurnos** de 10h cada uno → 110h normales diurnas
- **2 días normales nocturnos** de 12h cada uno (10 normales + 2 extras) → 20h normal nocturnas + 4h extras nocturnas
- **1 día feriado diurno** de 10h → 10h feriado normal diurno
- Total días: 14 (uno más de lo normal, pero legal bajo Art. 150)

**Pago**:
| Concepto | Horas | Tarifa efectiva | Monto |
|---|---|---|---|
| Normal diurna | 110 | 100 × 1.00 | 11,000 |
| Normal nocturna | 20 | 100 × 1.15 | 2,300 |
| Extra nocturna | 4 | 100 × 1.50 | 600 |
| Feriado normal diurna | 10 | 100 × 2.00 | 2,000 |
| **Total bruto** | **144 h** | | **RD$15,900** |

Desglose en conceptos del sistema (enfoque "base + recargos separados"):
| Concepto | Cálculo | Monto |
|---|---|---|
| Sueldo Base (id_desc_cred=8) | 144h × 100 | 14,400 |
| Recargo Nocturno Normal | 20h × 100 × 0.15 | 300 |
| Recargo Extras 35% | 4h × 100 × 0.35 | 140 |
| Recargo Extras Nocturnas 15% | 4h × 100 × 0.15 | 60 |
| Recargo Feriado 100% | 10h × 100 × 1.00 | 1,000 |
| **Total** | | **RD$15,900** ✓ |

Ambos enfoques dan el mismo resultado — la diferencia es solo cómo se **desglosa** en registros de `no_desc_cred_nomina` para reportería.

### 📝 Notas sobre el modelo

1. **NO hay sueldo fijo garantizado**: el sueldo depende de las horas efectivamente trabajadas. Si un vigilante falta 1 día sin justificar, no cobra esas 10 horas (ni extras ese día, obviamente).

2. **"Debe completar las 130 horas para salario nominal"** significa: el vigilante debe trabajar 13 días × 10h = 130h en la quincena **para recibir el sueldo bruto de referencia** del contrato. Si trabaja menos, cobra menos (proporcional a horas efectivas). Si trabaja más, cobra más (con los recargos correspondientes si exceden 10h/día o caen en feriado).

3. **Concepto ID 8 "Sueldo_Bruto"**: en el nuevo flujo **se calcula automáticamente** desde las horas de `ot_turnos`, ya no se captura manualmente. El valor capturable manual se mantiene como fallback cuando no hay datos de operaciones.

4. **Ausencias justificadas (enfermedad, licencia médica, etc.)**: el módulo de novedades de salud ya maneja esto como registros RRHH independientes. Si un vigilante tiene una licencia médica, sus turnos de esos días no estarán en `ot_turnos`, por lo que **automáticamente cobra menos**. El tratamiento específico (pago de días con SFS, etc.) se maneja fuera de esta integración.

5. **Art. 203 §2 (+100% sobre las 68h/semana)**: raramente aplica porque 10h×6días=60h base + hasta 8h extras = 68h máximo típico. Si acaso excede, se aplica como excepción. **Decisión**: por ahora **NO implementar** el cálculo automático del 68h/semana; dejarlo como ajuste manual si alguna vez ocurre. Esto se puede agregar después.

6. **Art. 164 (descanso semanal trabajado +100%)**: si el día libre del vigilante es "trabajado" (excepción), debería pagarse con +100%. Pendiente confirmar si `ot_turnos` distingue esto o si se considera feriado normal. **Pregunta para más adelante**.

---

## ✅ Sección 1.2 — Horas extras 35% vs 15%: CERRADA por coherencia con 1.1

Tu respuesta 1.1.c (Aditivo) y 1.1.b (nocturno aplica a todas las horas) responde automáticamente a 1.2:

- **a)** ¿Combinables? → **Sí, aditivos** (35% + 15% = 50%)
- **b)** ¿Todo exceso de 44h/sem al 35%? → **No aplica directamente** — para vigilantes el umbral es **diario** (>10h/día), no semanal, por Art. 150
- **c)** ¿+100% si pasan 68h/sem? → **Pospuesto** (ver nota 5 arriba)
- **d)** Horas nocturnas normales → **Sí, +15%** (respuesta 1.1.b)
- **e)** ¿Sueldo bruto incluye nocturno implícitamente? → **No**, se calcula explícito con recargo

---

### 1.3 Incentivo por puesto — ✅ CERRADA

`ot_incentivos_puesto` tiene `monto` y `valor_hora = monto/360`. Se calcula como `valor_hora × (horas_normales + horas_extras)` por turno.

**Respuesta del usuario (2026-04-09):**
> "Hay que crear un ingreso como incentivo para poner los valores y este como ingreso afecta ISR. El AFP/ARS solo [sobre] las horas trabajadas hasta 130 que es el salario."

**Decisiones derivadas:**

- **a)** ✅ **Sí**, el incentivo va como ingreso adicional a la nómina del guardián.
- **b)** ✅ **Crear concepto nuevo** "Incentivo por Puesto" en `no_desc_cred` (NO reusar ID 18 "Otras Extras").
  - `origen = 'I'` (ingreso)
  - `fijo = 0` (variable, calculado desde `ot_incentivos_puesto`)
  - `valorporciento = 'V'` (valor fijo, no porcentaje)
  - `aplica_afp_quincena = 0` (no aplica AFP)
  - `aplica_ars_quincena = 0` (no aplica ARS)
  - `quincena_aplicacion = 0` (aplica ambas quincenas)
- **c)** ✅ **Sujeción tributaria**:
  - **ISR** → sí, cuenta como ingreso gravable (suma a la base ISR)
  - **AFP** → no, excluido de la base AFP
  - **ARS** → no, excluido de la base ARS

---

### 🔑 Regla clave derivada de 1.3: base AFP/ARS ≠ base ISR

Esta es una regla crítica que afecta la lógica de cálculo de descuentos de ley para operacionales:

**Base AFP/ARS (reducida)** = `min(horas_normales_trabajadas, 130) × tarifa_base`
- SOLO el sueldo base sin recargos, capeado a 130 horas
- NO incluye: recargo nocturno (+15%), horas extras (+35%), recargo feriado (+100%), incentivo por puesto
- Equivale conceptualmente a "el salario ordinario fijo" del contrato

**Base ISR (total)** = `total_ingresos - AFP - ARS`
- SÍ incluye: sueldo base + recargo nocturno + horas extras + recargo feriado + incentivo
- Es el tratamiento que ya hace `isrService.js` para los demás tipos de nómina

**⚠️ Implicación técnica**: el cálculo automático de descuentos de ley en `nominaModel._generarDescuentosDeLey()` (o equivalente para operacionales) debe tratar la nómina operacional distinto. Hoy, para admin, usa el total como base AFP/ARS. Para operacional, debe usar solo `min(h_normales, 130) × tarifa`.

**⚠️ Posible riesgo de compliance**: según la Ley 87-01 (Sistema Dominicano de Seguridad Social), el "salario cotizable" para TSS incluye "remuneración devengada" que algunos abogados interpretan como incluyendo extras y recargos. La interpretación de Guardianes Ranger de excluirlos es común en la práctica pero podría ser cuestionada en una auditoría de TSS. **Validar con contador/asesor legal antes de producción.** Esto NO es un bloqueante para el desarrollo — el sistema debe hacer lo que el negocio indique — pero queda registrado.

---

### 1.4 Feriado trabajado — ✅ CERRADA

**Código de Trabajo Art. 205**: feriado trabajado = salario aumentado en 100% (salario doble).

**Respuesta del usuario (2026-04-09):**
> "Todos son feriados y se tratan igual"

**Decisiones derivadas:**

- **a)** ✅ Sí, feriado trabajado = +100% (salario doble), aplicando Art. 205
- **b)** ✅ **NO hay distinción entre NACIONAL y DECRETO** — ambos se tratan igual. El campo `ot_feriados.tipo` sigue existiendo para información pero no afecta el cálculo.
- **c)** ✅ El sistema guarda el recargo como concepto separado: `Recargo Feriado 100% = horas_feriado × tarifa × 1.00`, siguiendo el patrón "base + recargos" consolidado en la sección 1.1.
- **d)** ✅ Si el feriado incluye horas extras (> 10h), **los recargos se acumulan aditivamente**: 100% (feriado) + 35% (extra) + 15% si es nocturna = hasta +150% (ver tabla de recargos aditivos en sección 1.1).
- **e)** ✅ Respuesta del usuario "todos iguales" resuelve también el caso de coincidencia con descanso semanal — se trata como feriado normal (+100%), no se acumula otro 100%. Si el caso fuera bloqueante legalmente, se ajustaría manualmente.

**⚠️ Implicación para `ot_turnos`**: el campo `es_feriado` (0/1) es suficiente, no se necesita diferenciación por tipo de feriado. La lógica de asignar `es_feriado=1` a un turno sigue dependiendo de si `turno.fecha` coincide con algún registro en `ot_feriados` (independiente del `tipo`).

---

### 1.5 Deducciones legales (AFP/ARS/ISR) — ✅ CERRADA

**Respuesta del usuario (2026-04-09):**
> "Al igual que las demás nóminas: salario [para] AFP/ARS, todo ingreso [para] ISR según apliquen"

**Decisiones derivadas:**

| Descuento | Base de cálculo | Qué incluye | Qué excluye |
|---|---|---|---|
| **AFP** (2.87%) | `min(h_normales, 130) × tarifa_base` | Sueldo base ordinario | Recargo nocturno, extras, feriado, incentivos |
| **ARS** (3.04%) | `min(h_normales, 130) × tarifa_base` | Sueldo base ordinario | Recargo nocturno, extras, feriado, incentivos |
| **ISR** (progresivo) | `total_ingresos - AFP - ARS` | TODO (sueldo + recargos + extras + feriados + incentivos) | AFP+ARS ya descontados |

**Topes existentes (mantener)**:
- AFP: tope salarial de RD$9,932.40 (configurable en `rh_afp.tope_salarial`)
- ARS: tope salarial de RD$9,932.40 (configurable en `rh_ars.tope_salarial`)
- ISR: tabla progresiva de `no_isr` (sin cambios)

**Implementación**: la base AFP/ARS para nóminas operacionales **no puede** usar la misma lógica que admin (que usa total de ingresos sujetos). Hay que agregar una rama en `_generarDescuentosDeLey()`:
```js
if (esNominaOperacional) {
  const horasCotizables = Math.min(h_normales_total, 130);
  baseAfpArs = horasCotizables * tarifa_base;
} else {
  // Lógica actual para admin
  baseAfpArs = totalIngresosSujetos;
}
```

---

## 2️⃣ Flujo de integración — ✅ CERRADA

**Autorización del usuario (2026-04-09)**: "bien procede, autorizo" → se adoptan todas las recomendaciones presentadas. Decisiones consolidadas:

### 2.1 ✅ Flujo Pull desde RangerNomina

**Decisión**: **Opción A — Pull**. El usuario inicia la importación desde el detalle de la nómina operacional con un botón explícito "Importar desde Operaciones".

**Flujo paso a paso:**
1. Usuario crea nómina tipo "Operacional" (`id_tipo_nomina=2`) en RangerNomina con fecha_inicio/fin y selecciona subnominas.
2. Al crear, el sistema carga todos los empleados activos de las subnominas seleccionadas (paso existente en `_llenarEmpleadosNomina()`).
3. Usuario abre el detalle de la nómina y ve un botón nuevo **"Importar desde Operaciones"** (visible solo si `id_tipo_nomina=2` y `status='abierto'`).
4. Al hacer click, se ejecuta el servicio nuevo `operacionesImportService.importarTurnos(nominaId)`:
   - Lee empleados de la nómina
   - Para cada empleado: `SELECT * FROM ot_turnos WHERE empleado_id = ? AND fecha BETWEEN ? AND ? AND procesado_nomina = FALSE`
   - Aplica el algoritmo confirmado en 1.1 (día por día, multiplicadores aditivos)
   - Calcula: Sueldo Base, Recargo Nocturno, Recargo Extras 35%, Recargo Feriado 100%, Incentivo por Puesto
   - Inserta/actualiza registros en `no_desc_cred_nomina` con `automanual='I'`
5. Al terminar la importación, se llama automáticamente a `nominaModel.recalcular(nominaId)` para que calcule AFP/ARS (con base reducida para operacionales) e ISR (con base total).
6. Usuario revisa los resultados, ajusta manualmente si hace falta, y cierra la nómina cuando esté lista.
7. Al cerrar → hook dispara el marcado de `ot_turnos.procesado_nomina = TRUE` (ver 2.4).

**Descartadas**:
- ❌ Opción B (Push desde Operaciones): acopla Operaciones a Nómina, el usuario de nómina pierde control.
- ❌ Opción C (Automático en creación): demasiado rígido, dificulta correcciones.

### 2.2 ✅ Edición manual + Re-importación con merge inteligente

**Decisiones:**
- **a)** ✅ Edición manual permitida (comportamiento actual de RangerNomina — cualquier nómina abierta).
- **b)** ✅ Re-importación permitida las veces que sea necesario, con **merge inteligente**.
- **Estrategia de merge**:
  - La re-importación solo borra y recrea registros con `automanual = 'I'` (importados de operaciones).
  - Registros con `automanual = 'M'` (manuales del usuario) se **preservan intactos**.
  - Registros con `automanual = 'A'` (automáticos del sistema, como cargos recurrentes) también se preservan.
- **Ventaja**: el usuario puede importar → corregir manualmente un caso específico → re-importar → la corrección manual se mantiene, y los datos de operaciones se refrescan.
- **SQL de la operación de merge**:
  ```sql
  DELETE FROM no_desc_cred_nomina
  WHERE id_nomina = ?
    AND automanual = 'I'
    AND id_desc_cred IN (<conceptos_operacionales>);
  -- Luego insertar los nuevos registros de la importación
  ```

### 2.3 ✅ Empleados incluidos: Híbrido (Opción C) + filtro por subnómina

**Decisiones:**
- **a)** ✅ **Al crear la nómina**: se cargan todos los empleados activos de las subnominas seleccionadas (comportamiento existente en `_llenarEmpleadosNomina()`). Esto no cambia.
- **b)** ✅ **Al importar desde operaciones**: solo se procesan los empleados que tengan turnos en el período. Los que no tengan turnos quedan con `no_desc_cred_nomina` vacío para los conceptos operacionales → su sueldo bruto calculado = 0.
- **c)** ✅ **Responsabilidad del usuario**: antes de cerrar, el usuario puede eliminar manualmente los empleados en cero si así lo desea (feature existente en RangerNomina). Alternativamente, puede dejarlos para auditoría de "quién no trabajó esta quincena".
- **d)** ✅ **Subnóminas**: el flujo actual de `no_det_nomina_subnomina` (junction table) ya permite asignar 1 o más subnóminas a una nómina. La importación **no filtra** por subnomina — procesa todos los empleados ya cargados en `no_empleados_nomina` de esa nómina. Si hay varias subnóminas (ej: vigilantes + supervisores), cada una sigue su propio flujo de ser incluidas en la nómina y sus empleados son procesados por la importación.

### 2.4 ✅ Marcar turnos como procesados al cerrar

**Decisiones:**
- **a)** ✅ **Sí**, al cerrar la nómina (`nominaModel.cerrar()`), disparar hook que marque todos los turnos del período.
- **SQL al cierre**:
  ```sql
  UPDATE ot_turnos
  SET procesado_nomina = TRUE,
      nomina_id = ?,
      fecha_procesado = NOW()
  WHERE procesado_nomina = FALSE
    AND fecha BETWEEN ? AND ?
    AND empleado_id IN (
      SELECT id_empleado FROM rh_emplado_nomina WHERE id_nomina = ?
    );
  ```
- **b)** ✅ **Reapertura**: no aplicable hoy (nóminas cerradas son inmutables en RangerNomina). Si alguna vez se implementa, el hook de reapertura tendría que revertir el marcado. Fuera del alcance actual.
- **Beneficio**: previene doble procesamiento si alguien intenta crear otra nómina operacional que traslape fechas — los turnos marcados no vuelven a aparecer en la consulta.

---

---

## 3️⃣ Conceptos y módulos nuevos

### 3.1 Nuevos conceptos en `no_desc_cred` — propuesta derivada de sección 1

Basado en las decisiones confirmadas en 1.1, 1.3, 1.4 y 1.5, estos son los conceptos que hay que **crear**, **reusar** o **dejar como están**:

#### ✅ Conceptos NUEVOS a crear

| ID propuesto | Descripción | `origen` | `fijo` | `valorporciento` | `aplica_afp` | `aplica_ars` | Propósito |
|---|---|---|---|---|---|---|---|
| _next_ | **Recargo Nocturno Art. 204** | I | 0 | V | 1 (como AFP normal) | 1 | Recargo del 15% aplicado a todas las horas en franja nocturna (normales + extras). Gravable ISR. |
| _next+1_ | **Recargo Feriado Art. 205** | I | 0 | V | 1 | 1 | Recargo del 100% aplicado a todas las horas trabajadas en feriado. Gravable ISR. |
| _next+2_ | **Incentivo por Puesto** | I | 0 | V | **0** | **0** | Incentivo calculado desde `ot_incentivos_puesto`. **NO aplica AFP/ARS** (decisión 1.3). Gravable ISR. |

**⚠️ Nota sobre `aplica_afp_quincena`**: el flag en la tabla `no_desc_cred` NO es el mecanismo correcto para implementar la regla "base AFP reducida a 130h × tarifa" de la sección 1.5. Ese cálculo especial tiene que ir en la lógica de `_generarDescuentosDeLey()` cuando detecte `esNominaOperacional`. El flag de la tabla solo afecta si un concepto se incluye en la base AFP/ARS por default, pero la regla operacional es más compleja (cap por horas).

**Decisión**: para mayor claridad, poner `aplica_afp_quincena = 0` y `aplica_ars_quincena = 0` en los 3 conceptos operacionales nuevos, y que la lógica especial de `_generarDescuentosDeLey()` calcule explícitamente la base AFP/ARS como `min(h_normales, 130) × tarifa`, independiente de los flags de la tabla. Así evitamos ambigüedad.

#### 🔁 Conceptos EXISTENTES a reusar (sin cambios)

| ID | Descripción | Uso en operaciones |
|---|---|---|
| **8** | `Sueldo_Bruto` | Se usa como monto total de horas trabajadas × tarifa (sin recargos). Hoy se captura manualmente, ahora se calculará automático desde `ot_turnos`. |
| **6** | `horas extras 35%` | Se usa para el recargo del 35% sobre horas extras (diurnas + nocturnas). |

#### ⚠️ Concepto EXISTENTE problemático

| ID | Descripción | Problema |
|---|---|---|
| **7** | `horas extras 15%` | Nombre semánticamente incorrecto — el 15% del Art. 204 no es "un tipo de extra" sino el recargo nocturno, que aplica a TODAS las horas nocturnas (incluidas las normales). |

**Opciones para ID 7**:
- **a)** **Dejarlo intacto** para compatibilidad histórica, y usar el nuevo concepto "Recargo Nocturno Art. 204" en el flujo nuevo.
- **b)** **Renombrar** a "Recargo Nocturno Art. 204" y reusar.
- **c)** **Deprecar** (marcarlo inactivo en el UI pero mantener para histórico).

**Mi recomendación**: **(a) dejarlo intacto** para no afectar nóminas históricas que ya lo usan. El flujo nuevo usa el concepto nuevo. Si algún día se hace un data migration se puede consolidar.

#### Resumen de cambios SQL

```sql
-- Agregar 3 conceptos nuevos (los IDs los asigna auto_increment)
INSERT INTO no_desc_cred (descripcion, origen, fijo, valorporciento,
  aplica_afp_quincena, aplica_ars_quincena, quincena_aplicacion)
VALUES
  ('Recargo Nocturno Art. 204',  'I', 0, 'V', 0, 0, 0),
  ('Recargo Feriado Art. 205',   'I', 0, 'V', 0, 0, 0),
  ('Incentivo por Puesto',       'I', 0, 'V', 0, 0, 0);
```

**Respuesta del usuario (2026-04-09)**: ✅ "confirmo la lista 3.1"

**Sección 3.1 CERRADA** — proceder con:
- Crear 3 conceptos nuevos (Recargo Nocturno, Recargo Feriado, Incentivo por Puesto)
- Reusar ID 8 (Sueldo_Bruto) e ID 6 (horas extras 35%)
- Dejar intacto ID 7 para compatibilidad histórica
- La lógica de base AFP/ARS reducida vive en `_generarDescuentosDeLey()`, no en los flags de la tabla

---

### 3.2 Cuando dijiste "módulos que no tenga nuestra nómina"…
¿A qué te referías específicamente? ¿Qué módulos adicionales imaginas además de la integración de turnos?

Algunas ideas que podrían aplicar:
- Dashboard de horas trabajadas por guardián en el período de nómina
- Reporte comparativo: horas programadas (cronograma) vs horas reales (turnos)
- Vista de turnos del guardián desde la ficha del empleado en RangerNomina
- Alerta cuando un guardián pasa del tope legal de horas/mes
- Gestión de cronogramas desde nómina
- Otra cosa

**Respuesta:**
_(pendiente)_

---

## 4️⃣ Reglas de negocio del cliente (Guardianes Ranger)

### 4.1 ¿Existe una tabla/documento con las reglas de pago?
Por ejemplo:
- Tarifa por hora normal diurna
- Tarifa por hora normal nocturna
- Recargo de horas extras
- Recargo de feriados
- Bonificaciones especiales

**Respuesta:**
_(pendiente)_

---

### 4.2 Quincena o mensual
`no_tipo_nomina` ID=2 está configurado como QUINCENAL. ¿Siempre es quincenal o hay casos mensuales para operaciones?

**Respuesta:**
_(pendiente)_

---

### 4.3 Empleados en múltiples puestos
Si un guardián trabaja en 2 puestos distintos durante la quincena (cada uno con su incentivo):

- **a)** ¿Recibe ambos incentivos?
- **b)** ¿Se suman las horas independientemente?

**Respuesta:**
_(pendiente)_

---

## 5️⃣ Aspectos técnicos (para confirmar después)

### 5.1 Base de datos
Confirmado: ambos sistemas ya comparten `db_aae4a2_ranger`, por lo que RangerNomina puede leer `ot_turnos` directamente sin API.

- **a)** ¿Prefieres lectura directa a la tabla (rápido, acoplado)?
- **b)** ¿O llamada HTTP a API de OperacionesRanger (puerto 3002)? Más desacoplado pero requiere que el backend de Operaciones esté corriendo.

**Respuesta:**
_(pendiente)_

---

### 5.2 Rollback
Si después de jalar turnos el usuario quiere cancelar la importación (sin cerrar la nómina):

- **a)** ¿Botón "Limpiar importación" que borre los `no_desc_cred_nomina` creados?
- **b)** ¿O se puede reimportar (que ya cubre el caso)?

**Respuesta:**
_(pendiente)_

---

## 📝 Notas y decisiones pendientes

_(El usuario va agregando aquí notas y decisiones según va respondiendo)_

---

## 🎯 Siguiente paso después de responder

Una vez contestadas las preguntas clave de **secciones 1 y 2**, se puede:
1. Crear un plan de implementación con tareas priorizadas
2. Empezar por el servicio backend que lee `ot_turnos` y crea registros en `no_desc_cred_nomina`
3. Probar en una nómina operacional existente antes de hacer la UI
