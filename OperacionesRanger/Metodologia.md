# Metodología de Desarrollo - Sistema de Gestión de Turnos

Este documento define la metodología de trabajo para el desarrollo del proyecto OperacionesRanger utilizando un sistema de agentes coordinados.

---

## 1. Metodología del Agente Coordinador

### Descripción
El **Agente Coordinador** (Claude principal) es responsable de orquestar el trabajo del proyecto, delegando tareas específicas a subagentes especializados y monitoreando el progreso general.

### Flujo de Trabajo del Coordinador

#### 1.1. Inicio de Sesión
Al iniciar una nueva conversación, el coordinador debe:

1. **Leer CLAUDE.md** - Contexto del proyecto
2. **Leer Metodologia.md** - Este archivo (contexto metodológico)
3. **Escanear directorios clave**:
   - `docs/plans/` - Planes de desarrollo por fase
   - `docs/tasks/` - Archivos de tareas con estado actual

#### 1.2. Selección de Tarea

```bash
# Directorios a revisar
docs/
├── plans/
│   ├── plan_fase1_fundacion_proyecto_YYYYMMDD.md
│   ├── plan_fase2_backend_core_YYYYMMDD.md
│   └── ...
└── tasks/
    ├── tareas_fase1_YYYYMMDD.md
    ├── tareas_fase2_YYYYMMDD.md
    └── ...
```

**Proceso de selección**:
1. Leer el archivo de tareas más reciente (por fecha)
2. Identificar tareas con estado `[ ]` Pendiente o `[→]` En progreso
3. **Análisis de dependencias** (NUEVO - ver sección 1.2.1):
   - Si una tarea depende de otras, verificar que estén `[✓]` Completadas
   - **Identificar TODAS las tareas sin dependencias bloqueadas**
   - **Agrupar tareas que pueden ejecutarse en paralelo**
4. Priorizar por:
   - **Alta prioridad** primero
   - **Sin dependencias** o dependencias resueltas
   - **Potencial de paralelización** (ejecutar múltiples tareas simultáneamente)
   - **Orden lógico** del flujo de desarrollo

#### 1.2.1. Análisis de Dependencias y Paralelización

**IMPORTANTE**: Para maximizar la velocidad de desarrollo, el coordinador debe **identificar tareas independientes** que pueden ejecutarse en paralelo.

**Proceso de análisis**:

1. **Crear grafo de dependencias**:
   ```
   T001 (✓) ──┐
              ├──> T011 (puede ejecutarse)
              │
   T003 (✓) ──┤
              ├──> T007 (puede ejecutarse) ──> T008 (bloqueada)
   T006 (✓) ──┤                            │
              ├──> T009 (puede ejecutarse) ─┴──> T010 (bloqueada)
   ```

2. **Identificar tareas listas para ejecución**:
   - Tareas con estado `[ ]` Pendiente
   - TODAS sus dependencias en estado `[✓]` Completada
   - En el ejemplo: **T011, T007, T009** pueden ejecutarse ahora

3. **Decisión de paralelización**:
   - **SÍ paralelizar** si hay 2+ tareas independientes de alta prioridad
   - **NO paralelizar** si las tareas son muy pequeñas (<1 hora estimadas)
   - **NO paralelizar** si hay riesgo de conflictos (editar mismo archivo)

4. **Matriz de decisión**:
   | Escenario | Acción |
   |-----------|--------|
   | 3+ tareas independientes (Alta prioridad) | Lanzar 2-3 subagentes en paralelo |
   | 2 tareas independientes (Alta prioridad) | Lanzar 2 subagentes en paralelo |
   | 1 tarea lista, otras bloqueadas | Lanzar 1 subagente |
   | Tareas < 1 hora cada una | Ejecutar secuencialmente (overhead de paralelización) |
   | Tareas editan mismos archivos | Ejecutar secuencialmente (evitar conflictos) |

**Ejemplo de identificación**:

```markdown
Tareas pendientes:
- [✓] T001 (completada)
- [✓] T003 (completada)
- [✓] T006 (completada)
- [ ] T007 - Depende de T003, T006 → LISTO ✅
- [ ] T008 - Depende de T007 → BLOQUEADO ❌
- [ ] T009 - Depende de T006 → LISTO ✅
- [ ] T010 - Depende de T006, T007, T009 → BLOQUEADO ❌
- [ ] T011 - Depende de T001 → LISTO ✅

**Decisión**: Lanzar 3 subagentes en paralelo (T007, T009, T011)
**Justificación**:
- Las 3 tareas son independientes entre sí
- Todas son alta prioridad
- Estimación: 3-4 horas cada una (suficiente para paralelizar)
- No hay conflictos de archivos (editan archivos diferentes)
**Beneficio**: Reducir tiempo total de ~12 horas a ~4 horas
```

#### 1.3. Asignación a Subagente(s)

Una vez seleccionada la(s) tarea(s), el coordinador debe:

**OPCIÓN A: Asignación Secuencial (1 tarea)**

1. **Preparar contexto para el subagente**:
   - Identificador de la tarea (ej: `T002`)
   - Descripción completa de la tarea
   - Criterios de aceptación
   - Archivos relevantes a leer
   - Dependencias completadas

2. **Lanzar subagente** usando `Task` tool:
   ```
   Subagent Type: general-purpose
   Prompt:
   "Tu tarea es completar: [T00X - Nombre de la Tarea]

   Lee el archivo docs/tasks/tareas_faseN_YYYYMMDD.md y busca la tarea [T00X].

   Sigue la metodología del subagente en Metodologia.md sección 2.

   Debes:
   1. Leer la metodología del subagente
   2. Crear un plan detallado en docs/plans/plan_T00X_YYYYMMDD.md
   3. Ejecutar la tarea completando todos los criterios de aceptación
   4. Crear archivo de resultado en docs/completed/T00X_nombre_tarea.md
   5. Informar cuando hayas terminado

   Archivos relevantes: [lista de archivos]"
   ```

3. **Monitorear ejecución**:
   - Esperar resultado del subagente
   - Revisar output y archivos generados

**OPCIÓN B: Asignación en Paralelo (2+ tareas independientes)**

**NUEVO**: Cuando hay múltiples tareas independientes, el coordinador puede lanzar múltiples subagentes simultáneamente.

1. **Verificar requisitos para paralelización**:
   - ✅ Hay 2+ tareas con dependencias satisfechas
   - ✅ Las tareas son independientes entre sí
   - ✅ No hay riesgo de conflictos (edición de mismos archivos)
   - ✅ Cada tarea tiene estimación >= 1 hora

2. **Preparar contexto para CADA subagente**:
   - Preparar prompts individuales para cada tarea
   - Asegurar que cada prompt es completo e independiente
   - Numerar o identificar cada subagente (ej: "Subagente 1: T007", "Subagente 2: T009")

3. **Lanzar MÚLTIPLES subagentes en un SOLO mensaje**:

   **IMPORTANTE**: Para ejecutar en paralelo, debes usar un SOLO mensaje con múltiples llamadas al `Task` tool.

   ```
   [Texto del coordinador explicando que lanzará N subagentes en paralelo]

   [Llamada 1 al Task tool - T007]
   [Llamada 2 al Task tool - T009]
   [Llamada 3 al Task tool - T011]
   ```

   Cada llamada debe incluir el prompt completo e independiente para su tarea.

4. **Monitorear ejecución en paralelo**:
   - Los subagentes se ejecutan simultáneamente
   - Cada uno retornará su resultado de forma independiente
   - El coordinador recibe TODOS los resultados cuando TODOS terminan
   - Validar cada resultado individualmente

**Ejemplo de lanzamiento paralelo**:

```
Voy a lanzar 3 subagentes en paralelo para maximizar la velocidad:
- Subagente 1: T007 (Configurar conexión DB)
- Subagente 2: T009 (Variables de entorno)
- Subagente 3: T011 (ADR autenticación)

Estas tareas son independientes y pueden ejecutarse simultáneamente.

[Task tool call 1 para T007]
[Task tool call 2 para T009]
[Task tool call 3 para T011]
```

**Beneficios de paralelización**:
- ⚡ Reducción dramática del tiempo total (ejemplo: 12h → 4h)
- 🔄 Aprovecha capacidad de múltiples agentes
- 📊 Progreso más rápido de la fase

**Cuándo NO paralelizar**:
- ❌ Tareas dependen una de otra
- ❌ Tareas editan los mismos archivos (riesgo de conflictos)
- ❌ Tareas muy pequeñas (<1 hora, overhead no vale la pena)
- ❌ Recursos limitados del sistema

#### 1.4. Post-Ejecución

**OPCIÓN A: Post-Ejecución Secuencial (1 subagente)**

Cuando el subagente termina:

1. **Validar completitud**:
   - ✅ Plan creado en `docs/plans/plan_T00X_YYYYMMDD.md`
   - ✅ Archivo de resultado en `docs/completed/T00X_nombre_tarea.md`
   - ✅ Todos los criterios de aceptación cumplidos
   - ✅ Archivos/código generado (si aplica)

2. **Actualizar archivo de tareas**:
   - Cambiar estado de `[ ]` o `[→]` a `[✓]`
   - Actualizar fecha de finalización
   - Actualizar tiempo real invertido
   - Actualizar conteo de progreso
   - Agregar notas si es necesario

3. **Actualizar métricas**:
   - Incrementar "Tareas completadas"
   - Actualizar porcentaje de progreso
   - Actualizar tiempo real acumulado

4. **Documentar en logs** (opcional):
   - Crear entrada en `docs/logs/coordinador_log.md`
   - Timestamp, tarea completada, subagente, observaciones

**OPCIÓN B: Post-Ejecución Paralela (múltiples subagentes)**

**NUEVO**: Cuando múltiples subagentes terminan:

1. **Recibir resultados de TODOS los subagentes**:
   - El coordinador espera a que TODOS los subagentes completen
   - Recibe múltiples reportes simultáneamente

2. **Validar completitud de CADA tarea individualmente**:

   Para cada tarea (T00X):
   - ✅ Plan creado en `docs/plans/plan_T00X_YYYYMMDD.md`
   - ✅ Archivo de resultado en `docs/completed/T00X_nombre_tarea.md`
   - ✅ Todos los criterios de aceptación cumplidos
   - ✅ Archivos/código generado (si aplica)
   - ✅ Sin conflictos con archivos de otras tareas paralelas

3. **Actualizar archivo de tareas para TODAS las tareas**:

   En una SOLA actualización del archivo:
   - Cambiar estado de TODAS: `[ ]` o `[→]` a `[✓]`
   - Actualizar fechas de finalización (mismo día, distintas horas posibles)
   - Actualizar tiempo real invertido de cada una
   - Actualizar conteo de progreso (ej: "Tareas completadas: 6 → 9")
   - Agregar notas si es necesario

4. **Actualizar métricas globales**:
   - Incrementar "Tareas completadas" por el número de tareas finalizadas (ej: +3)
   - Actualizar porcentaje de progreso
   - Actualizar tiempo real acumulado (suma de tiempos de todas)

5. **Resolver conflictos si existen** (raro si se planificó bien):
   - Identificar si hay archivos modificados por múltiples tareas
   - Resolver manualmente o solicitar re-ejecución de una tarea

6. **Documentar ejecución paralela en logs**:
   ```markdown
   ## 2026-01-17 14:30 - Ejecución Paralela Completada

   **Tareas ejecutadas en paralelo**:
   - T007: Configurar conexión DB (3h 15min)
   - T009: Variables de entorno (1h 45min)
   - T011: ADR autenticación (2h 10min)

   **Tiempo total en paralelo**: 3h 15min (la más larga)
   **Tiempo si fuera secuencial**: 7h 10min
   **Ahorro de tiempo**: 3h 55min (55%)

   **Observaciones**: Sin conflictos, todas completadas exitosamente
   ```

**Beneficios de validación paralela**:
- ✅ Todas las tareas validadas a la vez
- ✅ Actualización masiva del archivo de tareas
- ✅ Métricas reflejan progreso real acelerado
- ✅ Logs documentan eficiencia de paralelización

#### 1.5. Iteración - Siguiente Tarea

**Para ejecución secuencial**:
1. **Cerrar subagente actual** (el Task tool se cierra automáticamente)
2. **Volver a 1.2** - Selección de siguiente tarea pendiente
3. **Lanzar nuevo subagente** para la nueva tarea
4. **Repetir hasta** que todas las tareas de la fase estén `[✓]` Completadas

**Para ejecución paralela**:
1. **Cerrar TODOS los subagentes** (se cierran automáticamente)
2. **Re-analizar dependencias** (1.2.1):
   - Tareas que estaban bloqueadas pueden ahora estar listas
   - Ejemplo: T007 completa → T008 ahora puede ejecutarse
   - Ejemplo: T007 y T009 completas → T010 ahora puede ejecutarse
3. **Decidir siguiente estrategia**:
   - ¿Hay nuevamente múltiples tareas independientes? → Lanzar en paralelo
   - ¿Solo 1 tarea lista? → Lanzar secuencialmente
   - ¿Todas bloqueadas? → Investigar por qué (posible error de dependencias)
4. **Lanzar siguiente ronda** (paralela o secuencial)
5. **Repetir hasta** que todas las tareas de la fase estén `[✓]` Completadas

**Diagrama de flujo optimizado con paralelización**:

```
┌─────────────────────────────────────┐
│  1.2 Seleccionar tareas pendientes   │
│  Analizar dependencias               │
└──────────────┬──────────────────────┘
               │
               ▼
     ┌─────────────────────┐
     │ ¿Múltiples tareas   │
     │ independientes?     │
     └─────┬───────────┬───┘
           │           │
          SÍ          NO
           │           │
           ▼           ▼
   ┌───────────┐  ┌──────────────┐
   │ Lanzar en │  │ Lanzar 1     │
   │ paralelo  │  │ subagente    │
   │ (2-3)     │  │              │
   └─────┬─────┘  └──────┬───────┘
         │                │
         │    ┌───────────┘
         ▼    ▼
   ┌─────────────────┐
   │ Esperar         │
   │ resultados      │
   └────────┬────────┘
            │
            ▼
   ┌─────────────────┐
   │ Validar y       │
   │ actualizar      │
   └────────┬────────┘
            │
            ▼
   ┌─────────────────┐
   │ Re-analizar     │
   │ dependencias    │
   └────────┬────────┘
            │
            ▼
      ┌──────────┐
      │ ¿Tareas  │
      │ restantes?│
      └─┬──────┬─┘
       SÍ      NO
        │       │
        │       ▼
        │   ┌───────────┐
        │   │ Fase      │
        │   │ completa  │
        │   └───────────┘
        │
        └──► Volver al inicio
```

#### 1.6. Finalización de Fase

Cuando todas las tareas de una fase están completadas:

1. **Generar reporte de fase**:
   - Archivo: `docs/reports/reporte_faseN_YYYYMMDD.md`
   - Incluir: tareas completadas, tiempo total, bloqueadores resueltos, lecciones aprendidas

2. **Validar entregables de fase**:
   - Revisar que todos los archivos esperados existan
   - Verificar que el código/configuración funciona

3. **Notificar al usuario**:
   - Informar que la fase está completa
   - Solicitar feedback o aprobación para siguiente fase

4. **Preparar siguiente fase**:
   - Identificar archivo de tareas de siguiente fase
   - Comenzar ciclo desde 1.2

---

## 2. Metodología del Subagente

### Descripción
El **Subagente** es un agente especializado lanzado por el Coordinador para ejecutar una tarea específica. Su responsabilidad es completar la tarea de inicio a fin siguiendo criterios de aceptación estrictos.

### Flujo de Trabajo del Subagente

#### 2.1. Inicialización

Al ser lanzado, el subagente debe:

1. **Leer contexto**:
   - `CLAUDE.md` - Contexto del proyecto
   - `Metodologia.md` - Esta sección (Metodología del Subagente)
   - Archivo de tareas asignado (ej: `docs/tasks/tareas_fase1_YYYYMMDD.md`)

2. **Identificar tarea asignada**:
   - Buscar el identificador de tarea (ej: `T002`)
   - Leer descripción completa
   - Leer criterios de aceptación
   - Identificar dependencias y archivos relevantes

3. **Verificar dependencias**:
   - Si la tarea tiene dependencias, verificar que estén completadas
   - Si hay dependencias bloqueadas, notificar al coordinador y abortar

#### 2.2. Planificación

Antes de ejecutar, el subagente debe **crear un plan detallado**:

1. **Crear archivo de plan**:
   - Ubicación: `docs/plans/plan_T00X_YYYYMMDD.md`
   - Formato: Markdown estructurado

2. **Contenido del plan**:
   ```markdown
   # Plan: [T00X - Nombre de la Tarea]

   **Fecha**: YYYY-MM-DD
   **Tarea padre**: T00X
   **Fase**: Fase N
   **Estimación**: X-Y horas

   ## Objetivo
   [Descripción clara del objetivo de la tarea]

   ## Contexto
   [Contexto relevante, archivos existentes, decisiones previas]

   ## Subtareas

   ### 1. [Nombre de subtarea]
   - **Descripción**: [Qué se hará]
   - **Archivos a modificar/crear**: [Lista]
   - **Comando/herramienta**: [Si aplica]
   - **Resultado esperado**: [Qué se obtendrá]

   ### 2. [Nombre de subtarea]
   ...

   ## Criterios de Aceptación (checklist)
   - [ ] Criterio 1
   - [ ] Criterio 2
   - [ ] ...

   ## Archivos a Generar
   - `path/to/file1.ext` - Descripción
   - `path/to/file2.ext` - Descripción

   ## Riesgos y Consideraciones
   - [Riesgo 1]: Mitigación
   - [Riesgo 2]: Mitigación

   ## Notas Adicionales
   [Cualquier nota relevante]
   ```

3. **Guardar plan** antes de continuar

#### 2.3. Ejecución

Con el plan listo, el subagente debe **ejecutar cada subtarea**:

1. **Crear TodoWrite** para trackear progreso:
   ```
   [ ] Subtarea 1
   [ ] Subtarea 2
   [ ] Subtarea 3
   ...
   ```

2. **Para cada subtarea**:
   - Marcar como `[→]` En progreso
   - Ejecutar acciones necesarias (leer archivos, escribir código, ejecutar comandos)
   - Validar resultado
   - Marcar como `[✓]` Completada
   - **Importante**: Solo una subtarea `[→]` a la vez

3. **Uso de herramientas**:
   - **Read**: Para leer archivos existentes
   - **Write**: Para crear nuevos archivos
   - **Edit**: Para modificar archivos existentes
   - **Bash**: Para comandos del sistema (testing, ejecución)
   - **Glob/Grep**: Para búsqueda de código

4. **Validación continua**:
   - Después de cada subtarea, verificar que funciona
   - Ejecutar tests si están disponibles
   - Validar contra criterios de aceptación

#### 2.4. Documentación de Resultado

Al completar todas las subtareas, el subagente debe **documentar el resultado**:

1. **Crear archivo de completitud**:
   - Ubicación: `docs/completed/T00X_nombre_tarea.md`
   - Formato: Markdown estructurado

2. **Contenido del archivo de resultado**:
   ```markdown
   # Tarea Completada: [T00X - Nombre de la Tarea]

   **Fecha de inicio**: YYYY-MM-DD
   **Fecha de finalización**: YYYY-MM-DD
   **Tiempo real**: X horas Y minutos
   **Estimación original**: A-B horas

   ## Resumen
   [Resumen de 2-3 párrafos de lo realizado]

   ## Subtareas Completadas
   - [✓] Subtarea 1 - Descripción breve del resultado
   - [✓] Subtarea 2 - Descripción breve del resultado
   - [✓] ...

   ## Archivos Generados/Modificados
   - `path/to/file1.ext` - Descripción de qué contiene
   - `path/to/file2.ext` - Descripción de qué contiene

   ## Criterios de Aceptación Cumplidos
   - [✓] Criterio 1
   - [✓] Criterio 2
   - [✓] ...

   ## Comandos Ejecutados (si aplica)
   ```bash
   # Comando 1
   npm install express

   # Comando 2
   node scripts/test-connection.js
   ```

   ## Pruebas Realizadas
   - [Descripción de pruebas manuales o automatizadas]
   - [Resultados obtenidos]

   ## Problemas Encontrados y Soluciones
   | Problema | Solución | Tiempo Invertido |
   |----------|----------|------------------|
   | [Problema 1] | [Solución aplicada] | 30min |

   ## Decisiones Técnicas Tomadas
   - **Decisión 1**: [Justificación]
   - **Decisión 2**: [Justificación]

   ## Próximos Pasos / Recomendaciones
   - [Tarea siguiente sugerida]
   - [Mejora futura a considerar]

   ## Notas Adicionales
   [Cualquier observación relevante]
   ```

3. **Guardar archivo de resultado**

#### 2.5. Informe al Coordinador

Finalmente, el subagente debe **informar al coordinador** que ha terminado:

```
✅ TAREA COMPLETADA: T00X - [Nombre de la Tarea]

📋 Archivos generados:
- docs/plans/plan_T00X_YYYYMMDD.md (Plan de ejecución)
- docs/completed/T00X_nombre_tarea.md (Resultado documentado)
- [Otros archivos generados]

✅ Criterios de aceptación: [X/X] cumplidos

⏱️ Tiempo invertido: X horas Y minutos
📊 Estimación original: A-B horas
📈 Variación: +/-Z%

🔍 Observaciones:
[Cualquier observación importante para el coordinador]

🚀 Listo para siguiente tarea.
```

---

## 3. Convenciones y Estándares

### 3.1. Nomenclatura de Archivos

| Tipo | Formato | Ejemplo |
|------|---------|---------|
| Plan de tarea | `plan_T00X_YYYYMMDD.md` | `plan_T002_20260117.md` |
| Resultado de tarea | `T00X_nombre_tarea.md` | `T002_investigacion_rrhh.md` |
| Archivo de tareas | `tareas_faseN_YYYYMMDD.md` | `tareas_fase1_20260117.md` |
| Plan de fase | `plan_faseN_nombre_YYYYMMDD.md` | `plan_fase1_fundacion_proyecto_20260117.md` |
| Reporte de fase | `reporte_faseN_YYYYMMDD.md` | `reporte_fase1_20260125.md` |
| Log del coordinador | `coordinador_log_YYYYMMDD.md` | `coordinador_log_20260117.md` |

### 3.2. Estados de Tareas

| Estado | Símbolo | Significado |
|--------|---------|-------------|
| Pendiente | `[ ]` | No iniciada, puede comenzar cuando dependencias estén listas |
| En progreso | `[→]` | Actualmente siendo trabajada por un subagente |
| Completada | `[✓]` | Terminada y documentada exitosamente |
| Bloqueada | `[x]` | No puede avanzar por dependencias no resueltas |
| Cancelada | `[~]` | Ya no es necesaria o fue reemplazada por otra |

### 3.3. Estructura de Directorios

```
OperacionesRanger/
├── CLAUDE.md                    # Contexto del proyecto
├── Metodologia.md               # Este archivo
├── docs/
│   ├── plans/                   # Planes de tareas individuales
│   │   ├── plan_T001_20260117.md
│   │   ├── plan_T002_20260117.md
│   │   └── plan_fase1_fundacion_proyecto_20260117.md
│   ├── tasks/                   # Archivos de tareas por fase
│   │   ├── tareas_fase1_20260117.md
│   │   └── tareas_fase2_YYYYMMDD.md
│   ├── completed/               # Resultados de tareas completadas
│   │   ├── T001_decision_stack_backend.md
│   │   └── T003_setup_database.md
│   ├── decisions/               # ADRs (Architecture Decision Records)
│   │   ├── 001_eleccion_stack_backend.md
│   │   └── 002_estrategia_autenticacion.md
│   ├── reports/                 # Reportes de finalización de fase
│   │   └── reporte_fase1_YYYYMMDD.md
│   └── logs/                    # Logs del coordinador (opcional)
│       └── coordinador_log_20260117.md
├── backend/                     # Código del backend (cuando se cree)
├── frontend/                    # Código del frontend (cuando se cree)
└── database/
    └── sistema_turnos_guardianes.sql
```

---

## 4. Reglas Importantes

### 4.1. Para el Coordinador

1. **Nunca omitir la lectura** de `docs/plans/` y `docs/tasks/` al inicio
2. **Siempre validar dependencias** antes de asignar una tarea
3. **Actualizar archivos de tareas inmediatamente** después de cada tarea completada
4. **Optimizar con paralelización** (ACTUALIZADO):
   - **SÍ lanzar múltiples subagentes en paralelo** cuando:
     - Hay 2+ tareas independientes (sin dependencias bloqueadas)
     - Las tareas NO editan los mismos archivos
     - Cada tarea tiene estimación >= 1 hora
     - Todas son de alta o media prioridad
   - **NO lanzar en paralelo** cuando:
     - Las tareas dependen una de otra
     - Hay riesgo de conflictos de archivos
     - Las tareas son muy pequeñas (<1 hora)
   - **Máximo recomendado**: 3 subagentes en paralelo (para evitar sobrecarga)
5. **Respetar prioridades** - Alta > Media > Baja
6. **Documentar todo** - Mantener logs y reportes actualizados
7. **Re-analizar dependencias** después de cada ronda de ejecución (secuencial o paralela)

### 4.2. Para el Subagente

1. **Siempre crear plan primero** - No comenzar ejecución sin plan documentado
2. **Usar TodoWrite** - Trackear subtareas en tiempo real
3. **Una subtarea a la vez** - Completar antes de pasar a la siguiente
4. **Validar continuamente** - No asumir que algo funciona sin probarlo
5. **Documentar resultado completo** - El archivo `docs/completed/` debe ser exhaustivo
6. **Informar claramente** - El resumen final debe ser conciso pero completo

### 4.3. Generales

1. **Nunca modificar archivos de tareas manualmente** - Solo el coordinador actualiza estados
2. **Respetar formato Markdown** - Todos los archivos en formato consistente
3. **Usar fechas ISO 8601** - Formato YYYY-MM-DD
4. **Commits frecuentes** - Commitear después de cada tarea completada (si aplica git)
5. **Naming consistente** - Seguir convenciones de nomenclatura establecidas

---

## 5. Ejemplo de Flujo Completo

### Escenario: Completar T002 - Investigar tabla RRHH

#### Paso 1: Coordinador - Selección
```
1. Leo docs/tasks/tareas_fase1_20260117.md
2. Identifico T002 como siguiente tarea pendiente
3. Verifico que no tiene dependencias bloqueadas
4. Preparo contexto para subagente
```

#### Paso 2: Coordinador - Asignación
```
5. Lanzo subagente general-purpose con prompt:
   "Completa T002 - Investigar tabla de empleados en sistema RRHH
    Lee docs/tasks/tareas_fase1_20260117.md para detalles
    Sigue metodología del subagente en Metodologia.md"
```

#### Paso 3: Subagente - Planificación
```
6. Leo CLAUDE.md, Metodologia.md, tareas_fase1_20260117.md
7. Creo plan en docs/plans/plan_T002_20260117.md con:
   - Conectar a DB RRHH
   - Identificar tabla de empleados
   - Documentar estructura
   - Crear queries de ejemplo
8. Guardo plan
```

#### Paso 4: Subagente - Ejecución
```
9. Creo TodoWrite con 4 subtareas
10. Ejecuto subtarea 1: Conectar a DB (Bash mysql command)
11. Marco subtarea 1 como completada
12. Ejecuto subtarea 2: Identificar tabla (Bash SELECT)
13. Marco subtarea 2 como completada
14. ... (continúo con subtareas 3 y 4)
```

#### Paso 5: Subagente - Documentación
```
15. Todas las subtareas completadas
16. Creo docs/completed/T002_investigacion_rrhh.md con:
    - Resumen de hallazgos
    - Estructura de tabla documentada
    - Queries de ejemplo
    - Criterios de aceptación cumplidos
17. Guardo archivo de resultado
```

#### Paso 6: Subagente - Informe
```
18. Informo al coordinador:
    "✅ TAREA COMPLETADA: T002 - Investigar tabla RRHH
     📋 Archivos: plan_T002_20260117.md, T002_investigacion_rrhh.md
     ✅ Criterios: 6/6 cumplidos
     ⏱️ Tiempo: 4h 30min (estimado: 4-5h)"
```

#### Paso 7: Coordinador - Post-Ejecución
```
19. Valido archivos generados existen y son completos
20. Actualizo docs/tasks/tareas_fase1_20260117.md:
    - Estado: [ ] → [✓]
    - Fecha finalización: 2026-01-17
    - Tiempo real: 4h 30min
    - Incremento tareas completadas: 2 → 3
21. Busco siguiente tarea (T006)
22. Lanzo nuevo subagente para T006
```

---

## 6. Estrategia de Paralelización (NUEVO)

Esta sección detalla cómo maximizar la eficiencia del desarrollo mediante ejecución paralela de tareas independientes.

### 6.1. Cuándo Paralelizar

**Checklist de decisión**:

```
✅ Condiciones necesarias (TODAS deben cumplirse):
   □ Hay 2+ tareas con estado [ ] Pendiente
   □ Todas las dependencias de cada tarea están [✓] Completadas
   □ Las tareas NO dependen entre sí
   □ Las tareas NO editan los mismos archivos
   □ Cada tarea tiene estimación >= 1 hora

✅ Condiciones recomendadas (al menos 1 debe cumplirse):
   □ Todas las tareas son de prioridad Alta
   □ El tiempo total combinado es >= 6 horas
   □ Hay presión de tiempo para completar la fase

❌ Condiciones que BLOQUEAN paralelización:
   □ Tareas dependen secuencialmente (T1 → T2 → T3)
   □ Tareas modifican el mismo archivo de código
   □ Tareas muy pequeñas (< 30 minutos cada una)
   □ Recursos del sistema limitados
```

### 6.2. Ejemplo Real: Fase 1 - Tareas T007, T009, T011

**Situación inicial** (después de completar T006):

```
Estado de tareas:
[✓] T001 - Decidir stack backend (3h)
[✓] T002 - Investigar tabla RRHH (4h)
[✓] T003 - Crear base de datos (45min)
[✓] T004 - Seed data inicial (2h 15min)
[✓] T005 - Validar procedures (3h 30min)
[✓] T006 - Estructura proyecto backend (2h 30min)
[ ] T007 - Configurar conexión DB (Depende: T003, T006)
[ ] T008 - Scripts utilidades (Depende: T007)
[ ] T009 - Variables de entorno .env (Depende: T006)
[ ] T010 - README proyecto (Depende: T006, T007, T009)
[ ] T011 - ADR autenticación (Depende: T001)
```

**Análisis de dependencias**:

```
Tareas LISTAS para ejecutar:
✅ T007 - Depende de T003 (✓) y T006 (✓) → LISTO
✅ T009 - Depende de T006 (✓) → LISTO
✅ T011 - Depende de T001 (✓) → LISTO

Tareas BLOQUEADAS:
❌ T008 - Espera a T007
❌ T010 - Espera a T007 y T009
```

**Verificación de paralelización**:

```
✅ Hay 3 tareas listas (T007, T009, T011)
✅ Todas sus dependencias están completadas
✅ Son independientes entre sí:
   - T007 modifica: src/config/database.ts, .env
   - T009 modifica: .env.example, src/config/env.ts (diferente de database.ts)
   - T011 modifica: docs/decisions/002_*.md (solo documentación)
✅ Estimaciones: T007 (3-4h), T009 (1-2h), T011 (2h) - todas >= 1h
✅ Todas son prioridad Alta

Archivos a modificar:
- T007: src/config/database.ts, .env, backend/README.md
- T009: .env.example, src/config/env.ts, backend/README.md
- T011: docs/decisions/002_estrategia_autenticacion.md

⚠️  Posible conflicto: T007 y T009 modifican backend/README.md
💡 Solución: Ejecutar T007 y T009, dejar T011 para después, O
             Acordar que T009 NO modifica README (solo .env.example)

Decisión final: Lanzar T007 y T009 en paralelo (README conflict bajo)
```

**Comparación de tiempos**:

```
Ejecución SECUENCIAL:
T007 (3.5h) → T009 (1.5h) → T011 (2h) = 7 horas total

Ejecución PARALELA:
T007 (3.5h) }
T009 (1.5h) } = 3.5 horas (la más larga) + T011 (2h) = 5.5 horas
T011 (2h)   }

O mejor:
T007 (3.5h) }
T009 (1.5h) } = 3.5 horas (la más larga)

Ahorro: 7h - 3.5h = 3.5 horas (50% más rápido)
```

### 6.3. Plantilla de Mensaje para Lanzamiento Paralelo

**Plantilla del coordinador**:

```markdown
## Análisis de Paralelización

He analizado las dependencias de las tareas pendientes y encontré que las siguientes tareas pueden ejecutarse en paralelo:

**Tareas seleccionadas**:
1. **T007** - Configurar conexión a base de datos (Estimación: 3-4h)
   - Dependencias: T003 ✓, T006 ✓
   - Archivos: src/config/database.ts, .env

2. **T009** - Variables de entorno .env (Estimación: 1-2h)
   - Dependencias: T006 ✓
   - Archivos: .env.example, src/config/env.ts

3. **T011** - ADR autenticación (Estimación: 2h)
   - Dependencias: T001 ✓
   - Archivos: docs/decisions/002_*.md

**Justificación de paralelización**:
✅ Todas son independientes (no se bloquean entre sí)
✅ Modifican archivos diferentes (sin conflictos)
✅ Estimación total: 6-8 horas
✅ Tiempo en paralelo: ~4 horas (ahorro de 50%)
✅ Todas son prioridad Alta

**Verificación de conflictos**: Ningún archivo compartido entre tareas.

Procedo a lanzar 3 subagentes en paralelo:

[Task tool call 1 - T007]
[Task tool call 2 - T009]
[Task tool call 3 - T011]
```

### 6.4. Manejo de Resultados Paralelos

Cuando los 3 subagentes completan:

**Paso 1: Recibir resultados**
```
✅ Subagente 1 (T007) completó en 3h 15min
✅ Subagente 2 (T009) completó en 1h 45min
✅ Subagente 3 (T011) completó en 2h 10min

Tiempo total en paralelo: 3h 15min (el más largo)
```

**Paso 2: Validar cada tarea**
- Leer docs/completed/T007_*.md → ✅ Completo
- Leer docs/completed/T009_*.md → ✅ Completo
- Leer docs/completed/T011_*.md → ✅ Completo

**Paso 3: Actualizar archivo de tareas (una sola vez)**
```markdown
- [✓] T007 - Configurar conexión DB (3h 15min) - 2026-01-17
- [✓] T009 - Variables de entorno (1h 45min) - 2026-01-17
- [✓] T011 - ADR autenticación (2h 10min) - 2026-01-17

Tareas completadas: 6 → 9
Tiempo real acumulado: 16h → 23h 10min
```

**Paso 4: Re-analizar dependencias**
```
[ ] T008 - Scripts utilidades (Depende: T007 ✓) → AHORA LISTO ✅
[ ] T010 - README proyecto (Depende: T006 ✓, T007 ✓, T009 ✓) → AHORA LISTO ✅

Nueva decisión: Lanzar T008 y T010 en paralelo (ambas listas)
```

### 6.5. Métricas de Eficiencia

**Tracking de ahorro de tiempo**:

```markdown
## Reporte de Paralelización - Fase 1

### Ronda 1: T007 + T009 + T011
- Tiempo secuencial estimado: 7 horas
- Tiempo paralelo real: 3h 15min
- Ahorro: 3h 45min (54%)

### Ronda 2: T008 + T010
- Tiempo secuencial estimado: 5 horas
- Tiempo paralelo real: 3 horas
- Ahorro: 2 horas (40%)

### Total Fase 1
- Tiempo secuencial total: 35 horas
- Tiempo paralelo total: 22 horas
- Ahorro total: 13 horas (37%)
```

---

## 7. FAQ - Preguntas Frecuentes

**P: ¿Qué pasa si un subagente se bloquea?**
R: El subagente debe documentar el bloqueador en su archivo de resultado, marcar la tarea como `[x]` Bloqueada en el reporte, e informar al coordinador. El coordinador buscará otra tarea no bloqueada.

**P: ¿Puede el coordinador ejecutar código directamente?**
R: No. El coordinador solo orquesta. Toda ejecución de código/comandos la hace el subagente.

**P: ¿Cuándo se considera una tarea "completada"?**
R: Cuando TODOS los criterios de aceptación están cumplidos, todos los archivos esperados están creados, y el archivo de resultado está documentado.

**P: ¿Qué pasa si una tarea toma más tiempo del estimado?**
R: El subagente continúa hasta completarla. Se documenta la variación de tiempo en el archivo de resultado. El coordinador actualiza las métricas.

**P: ¿Puede un subagente lanzar otro subagente?**
R: No. Solo el coordinador puede lanzar subagentes. Los subagentes son ejecutores terminales.

**P: ¿Qué pasa si falta información para completar una tarea?**
R: El subagente documenta qué información falta, marca la tarea como bloqueada, y solicita al coordinador que gestione la obtención de esa información (posiblemente preguntando al usuario).

**P: ¿Puedo lanzar múltiples subagentes en paralelo? (NUEVO)**
R: **SÍ**. Cuando hay 2+ tareas independientes con sus dependencias satisfechas, el coordinador DEBE lanzar múltiples subagentes en paralelo para maximizar eficiencia. Ver sección 6 para detalles completos.

**P: ¿Cómo lanzo múltiples subagentes en paralelo? (NUEVO)**
R: Usa un SOLO mensaje con múltiples llamadas al `Task` tool. Cada llamada debe tener un prompt completo e independiente. Ejemplo:
```
[Texto explicando que lanzaré 3 subagentes]
[Task tool call 1 - T007]
[Task tool call 2 - T009]
[Task tool call 3 - T011]
```

**P: ¿Qué pasa si dos tareas en paralelo editan el mismo archivo? (NUEVO)**
R: Esto puede causar conflictos. El coordinador DEBE verificar antes de lanzar en paralelo que las tareas NO editen los mismos archivos. Si hay riesgo, ejecutar secuencialmente.

**P: ¿Cuál es el máximo de subagentes en paralelo? (NUEVO)**
R: Recomendado: **2-3 subagentes** en paralelo. Más de 3 puede causar sobrecarga y dificultar el tracking. Si hay 5+ tareas independientes, ejecutar en 2 rondas (3 + 2).

**P: ¿Cómo actualizo el archivo de tareas cuando ejecuto en paralelo? (NUEVO)**
R: Espera a que TODOS los subagentes completen, valida todos los resultados, y luego actualiza el archivo de tareas EN UNA SOLA EDICIÓN marcando todas las tareas como completadas. Ver sección 1.4 Opción B.

**P: ¿Vale la pena paralelizar tareas pequeñas (< 1 hora)? (NUEVO)**
R: Generalmente **NO**. El overhead de coordinar múltiples subagentes no compensa el ahorro de tiempo en tareas muy pequeñas. Ejecutar secuencialmente es más eficiente para tareas < 1 hora.

---

## 8. Checklist de Inicio - Coordinador

Al comenzar una nueva sesión como coordinador, verificar:

- [ ] He leído CLAUDE.md
- [ ] He leído Metodologia.md (este archivo)
- [ ] He leído el archivo de tareas más reciente en `docs/tasks/`
- [ ] He identificado cuántas tareas están completadas vs pendientes
- [ ] He verificado si hay tareas bloqueadas que necesiten atención
- [ ] **NUEVO**: He analizado dependencias de TODAS las tareas pendientes
- [ ] **NUEVO**: He identificado qué tareas pueden ejecutarse en paralelo
- [ ] **NUEVO**: He verificado que tareas paralelas NO editen mismos archivos
- [ ] He decidido estrategia: ¿secuencial (1 tarea) o paralelo (2-3 tareas)?
- [ ] He seleccionado la(s) siguiente(s) tarea(s) según prioridad y dependencias
- [ ] He preparado el/los prompt(s) para el/los subagente(s) con contexto completo
- [ ] Si es paralelo: He preparado un SOLO mensaje con múltiples Task calls
- [ ] Estoy listo para lanzar el/los subagente(s)

---

## 9. Checklist de Inicio - Subagente

Al ser lanzado como subagente, verificar:

- [ ] He leído CLAUDE.md
- [ ] He leído Metodologia.md sección 2 (Metodología del Subagente)
- [ ] He leído el archivo de tareas asignado
- [ ] He identificado mi tarea específica (T00X)
- [ ] He verificado que no hay dependencias bloqueadas
- [ ] He creado un plan detallado en `docs/plans/`
- [ ] He guardado el plan antes de comenzar ejecución
- [ ] He creado TodoWrite para trackear subtareas
- [ ] **NUEVO**: He verificado si estoy ejecutando en paralelo con otros subagentes
- [ ] **NUEVO**: Si es paralelo, he confirmado que NO voy a editar archivos de otras tareas
- [ ] Estoy listo para ejecutar

---

**Última actualización**: 2026-01-17
**Versión**: 2.0 (Agregada capacidad de paralelización)
