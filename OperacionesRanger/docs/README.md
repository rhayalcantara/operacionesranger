# Documentación del Proyecto - OperacionesRanger

Este directorio contiene toda la documentación del proyecto Sistema de Gestión de Turnos para Guardianes de Seguridad.

---

## Estructura de Directorios

```
docs/
├── README.md                    # Este archivo
├── tasks/                       # Archivos de tareas por fase
│   ├── PLAN_GENERAL_PROYECTO.md       # Plan maestro del proyecto completo
│   ├── tareas_fase1_fundacion_proyecto_20260117.md
│   ├── tareas_fase2_backend_core.md (futuro)
│   └── ...
├── plans/                       # Planes de ejecución de tareas individuales
│   ├── plan_T001_20260117.md
│   ├── plan_T002_20260117.md
│   └── ...
├── completed/                   # Resultados de tareas completadas
│   ├── T001_decision_stack_backend.md
│   ├── T002_investigacion_rrhh.md
│   └── ...
├── decisions/                   # Architecture Decision Records (ADRs)
│   ├── 001_eleccion_stack_backend.md
│   ├── 002_estrategia_autenticacion.md
│   └── ...
├── reports/                     # Reportes de finalización de fase
│   ├── reporte_fase1_20260117.md (futuro)
│   └── ...
└── logs/                        # Logs del coordinador (opcional)
    └── coordinador_log_20260117.md (opcional)
```

---

## Tipos de Documentos

### 1. Plan General (`PLAN_GENERAL_PROYECTO.md`)
**Propósito**: Visión completa del proyecto con todas las fases y tareas principales.

**Contiene**:
- Resumen ejecutivo del proyecto
- Todas las fases del proyecto (7 fases)
- Estimaciones generales de tiempo y recursos
- Cronograma macro
- Riesgos identificados
- Métricas generales

**Actualización**: Mensual o cuando cambie el alcance del proyecto

---

### 2. Archivos de Tareas (`tareas_faseN_YYYYMMDD.md`)
**Propósito**: Detalle de todas las tareas de una fase específica.

**Contiene**:
- Lista de tareas con formato `T###`
- Estado de cada tarea: `[ ]` Pendiente, `[→]` En Progreso, `[✓]` Completada, `[x]` Bloqueada
- Descripción detallada de cada tarea
- Criterios de aceptación
- Dependencias entre tareas
- Estimaciones de tiempo
- Orden sugerido de ejecución
- Métricas de progreso de la fase

**Actualización**: Cada vez que se completa una tarea o cambia su estado

**Formato de tarea**:
```markdown
### T001 - Nombre de la Tarea
- **Estado**: [✓] Completada
- **Prioridad**: Alta
- **Estimación**: 3-4 horas
- **Iniciado**: 2026-01-17
- **Finalizado**: 2026-01-17
- **Tiempo real**: 3 horas
- **Dependencias**: T002, T003
- **Descripción**: ...
- **Criterios de Aceptación**: ...
- **Archivo de Resultado**: docs/completed/T001_nombre.md
```

---

### 3. Planes de Tarea (`plan_T###_YYYYMMDD.md`)
**Propósito**: Plan detallado de ejecución de una tarea específica ANTES de ejecutarla.

**Contiene**:
- Objetivo de la tarea
- Contexto y archivos relevantes
- Subtareas paso a paso
- Archivos a crear/modificar
- Herramientas/comandos a usar
- Resultado esperado de cada subtarea
- Criterios de aceptación (checklist)
- Riesgos y mitigaciones

**Cuándo se crea**: Por el subagente al INICIO de la ejecución de una tarea

**Ejemplo**: `plan_T002_20260117.md` - Plan para investigar tabla RRHH

---

### 4. Resultados de Tarea (`T###_nombre_tarea.md`)
**Propósito**: Documentación completa de lo realizado DESPUÉS de completar una tarea.

**Contiene**:
- Resumen de lo realizado
- Subtareas completadas
- Archivos generados/modificados
- Criterios de aceptación cumplidos
- Comandos ejecutados
- Pruebas realizadas
- Problemas encontrados y soluciones
- Decisiones técnicas tomadas
- Tiempo invertido (real vs estimado)
- Próximos pasos / Recomendaciones

**Cuándo se crea**: Por el subagente al FINALIZAR la ejecución de una tarea

**Ejemplo**: `T001_decision_stack_backend.md` - Resultado de decidir stack

---

### 5. Architecture Decision Records - ADRs (`###_nombre_decision.md`)
**Propósito**: Documentar decisiones arquitectónicas importantes con su contexto y justificación.

**Contiene**:
- Título de la decisión
- Estado (Propuesta, Aceptada, Rechazada, Deprecada)
- Contexto y problema
- Opciones consideradas (pros y contras)
- Decisión tomada
- Justificación
- Consecuencias (positivas y negativas)
- Fecha

**Cuándo se crea**: Cuando se toma una decisión arquitectónica significativa

**Ejemplo**: `001_eleccion_stack_backend.md` - Decisión de usar Node.js vs .NET

**Formato ADR estándar**:
```markdown
# ADR-###: Título de la Decisión

**Estado**: Aceptada
**Fecha**: YYYY-MM-DD
**Autores**: Nombre / Claude Code

## Contexto
[Descripción del problema o necesidad]

## Opciones Consideradas
### Opción 1: [Nombre]
**Pros**: ...
**Contras**: ...

### Opción 2: [Nombre]
**Pros**: ...
**Contras**: ...

## Decisión
[Cuál se eligió y por qué]

## Consecuencias
**Positivas**: ...
**Negativas**: ...

## Notas Adicionales
[Información complementaria]
```

---

### 6. Reportes de Fase (`reporte_faseN_YYYYMMDD.md`)
**Propósito**: Resumen ejecutivo al completar una fase completa del proyecto.

**Contiene**:
- Tareas completadas en la fase
- Tiempo total invertido
- Variación tiempo estimado vs real
- Bloqueadores resueltos
- Lecciones aprendidas
- Decisiones técnicas tomadas
- Entregables de la fase
- Estado para inicio de siguiente fase

**Cuándo se crea**: Al finalizar una fase (ej: Fase 1 completa)

**Ejemplo**: `reporte_fase1_20260125.md` - Reporte al finalizar Fase 1

---

### 7. Logs del Coordinador (`coordinador_log_YYYYMMDD.md`)
**Propósito**: (OPCIONAL) Registro de actividades del agente coordinador por fecha.

**Contiene**:
- Timestamp de cada acción
- Tarea asignada a subagente
- Resultado del subagente
- Decisiones tomadas
- Observaciones

**Cuándo se crea**: Diariamente (opcional)

---

## Flujo de Documentación

### Al Iniciar una Tarea (Subagente)
1. Leer archivo de tareas: `tareas_faseN_YYYYMMDD.md`
2. Identificar tarea asignada (ej: `T002`)
3. **Crear plan**: `docs/plans/plan_T002_YYYYMMDD.md`
4. Guardar plan antes de ejecutar

### Durante la Ejecución (Subagente)
5. Seguir pasos del plan
6. Trackear progreso con TodoWrite
7. Crear archivos de código/configuración según plan

### Al Finalizar la Tarea (Subagente)
8. **Crear resultado**: `docs/completed/T002_nombre_tarea.md`
9. Documentar todo lo realizado
10. Marcar criterios de aceptación como cumplidos
11. Reportar al coordinador

### Post-Ejecución (Coordinador)
12. Validar archivos generados
13. **Actualizar archivo de tareas**: Cambiar estado de `[ ]` a `[✓]`
14. Actualizar métricas
15. Seleccionar siguiente tarea

---

## Convenciones de Nomenclatura

### Identificadores de Tarea
- Formato: `T###` (3 dígitos, ceros a la izquierda)
- Ejemplos: `T001`, `T002`, `T025`, `T100`
- Secuencial por orden de creación (no por orden de ejecución)

### Nombres de Archivo
- **Tareas**: `tareas_fase#_nombre_YYYYMMDD.md`
- **Planes**: `plan_T###_YYYYMMDD.md`
- **Resultados**: `T###_nombre_descriptivo.md`
- **ADRs**: `###_nombre_decision.md`
- **Reportes**: `reporte_fase#_YYYYMMDD.md`

### Formato de Fecha
- **Siempre ISO 8601**: `YYYY-MM-DD`
- Ejemplo: `2026-01-17`

---

## Estados de Tareas

| Símbolo | Estado | Significado |
|---------|--------|-------------|
| `[ ]` | Pendiente | No iniciada, puede comenzar cuando dependencias estén listas |
| `[→]` | En progreso | Actualmente siendo trabajada por un subagente |
| `[✓]` | Completada | Terminada y documentada exitosamente |
| `[x]` | Bloqueada | No puede avanzar por dependencias no resueltas |
| `[~]` | Cancelada | Ya no es necesaria o fue reemplazada por otra |

---

## Buenas Prácticas

### Para el Coordinador
1. ✅ Actualizar estado de tareas inmediatamente después de completar
2. ✅ Verificar que existan plan Y resultado antes de marcar como completada
3. ✅ Mantener métricas actualizadas
4. ✅ Documentar bloqueadores y cambios al plan

### Para el Subagente
1. ✅ Siempre crear plan ANTES de ejecutar
2. ✅ Ser exhaustivo en el archivo de resultado
3. ✅ Incluir ejemplos de código/comandos en resultados
4. ✅ Documentar problemas encontrados y soluciones aplicadas
5. ✅ Calcular tiempo real invertido

### Para Todos
1. ✅ Usar Markdown para todos los documentos
2. ✅ Incluir enlaces a archivos relacionados
3. ✅ Mantener lenguaje claro y conciso
4. ✅ Usar bloques de código con syntax highlighting
5. ✅ Incluir ejemplos cuando sea relevante

---

## Plantillas

### Plantilla de Plan de Tarea
Ver ejemplo en: `Metodologia.md` sección 2.2

### Plantilla de Resultado de Tarea
Ver ejemplo en: `Metodologia.md` sección 2.4

### Plantilla de ADR
Ver sección "Architecture Decision Records" arriba

---

## Referencias

- **Metodología del proyecto**: `../Metodologia.md`
- **Contexto del proyecto**: `../CLAUDE.md`
- **Especificaciones**: `../especificaciones_sistema_turnos.md`
- **Diagrama ER**: `../diagrama_er_turnos.md`

---

## Contacto y Soporte

Para dudas sobre la documentación o estructura del proyecto, consultar:
- `CLAUDE.md` - Guía para futuras instancias de Claude Code
- `Metodologia.md` - Proceso de desarrollo con agentes coordinados

---

**Última actualización**: 2026-01-17
**Mantenido por**: Agente Coordinador + Equipo de Desarrollo
