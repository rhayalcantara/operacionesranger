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
3. Verificar dependencias:
   - Si una tarea depende de otras, verificar que estén `[✓]` Completadas
   - Seleccionar solo tareas sin dependencias bloqueadas
4. Priorizar por:
   - **Alta prioridad** primero
   - **Sin dependencias** o dependencias resueltas
   - **Orden lógico** del flujo de desarrollo

#### 1.3. Asignación a Subagente

Una vez seleccionada la tarea, el coordinador debe:

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

#### 1.4. Post-Ejecución

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

#### 1.5. Iteración - Siguiente Tarea

1. **Cerrar subagente actual** (el Task tool se cierra automáticamente)
2. **Volver a 1.2** - Selección de siguiente tarea pendiente
3. **Lanzar nuevo subagente** para la nueva tarea
4. **Repetir hasta** que todas las tareas de la fase estén `[✓]` Completadas

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
4. **Un subagente a la vez** - No lanzar múltiples subagentes en paralelo para tareas de la misma fase
5. **Respetar prioridades** - Alta > Media > Baja
6. **Documentar todo** - Mantener logs y reportes actualizados

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

## 6. FAQ - Preguntas Frecuentes

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

---

## 7. Checklist de Inicio - Coordinador

Al comenzar una nueva sesión como coordinador, verificar:

- [ ] He leído CLAUDE.md
- [ ] He leído Metodologia.md (este archivo)
- [ ] He leído el archivo de tareas más reciente en `docs/tasks/`
- [ ] He identificado cuántas tareas están completadas vs pendientes
- [ ] He verificado si hay tareas bloqueadas que necesiten atención
- [ ] He seleccionado la siguiente tarea según prioridad y dependencias
- [ ] He preparado el prompt para el subagente con contexto completo
- [ ] Estoy listo para lanzar el subagente

---

## 8. Checklist de Inicio - Subagente

Al ser lanzado como subagente, verificar:

- [ ] He leído CLAUDE.md
- [ ] He leído Metodologia.md sección 2 (Metodología del Subagente)
- [ ] He leído el archivo de tareas asignado
- [ ] He identificado mi tarea específica (T00X)
- [ ] He verificado que no hay dependencias bloqueadas
- [ ] He creado un plan detallado en `docs/plans/`
- [ ] He guardado el plan antes de comenzar ejecución
- [ ] He creado TodoWrite para trackear subtareas
- [ ] Estoy listo para ejecutar

---

**Última actualización**: 2026-01-17
**Versión**: 1.0
