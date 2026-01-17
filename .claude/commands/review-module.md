---
description: Analiza un módulo completo con todos sus componentes en paralelo
---

# Análisis Completo de Módulo Angular

Realiza un análisis exhaustivo de un MÓDULO COMPLETO del proyecto DMS, evaluando todos sus componentes, servicios e interacciones.

## ALCANCE DEL ANÁLISIS

Este comando está diseñado para analizar módulos completos como:
- RAG Dashboard (rag-dashboard + semantic-search + chat-interface + conversations-list)
- Document Management (file-explorer + folder-tree + details-panel + upload/move/rename dialogs)
- Accessibility Module (accessibility-settings)

## PROCESO DE ANÁLISIS

### 1. DESCUBRIMIENTO
- Identificar todos los componentes del módulo
- Mapear dependencias entre componentes
- Identificar servicios compartidos
- Analizar rutas y navegación

### 2. ANÁLISIS POR COMPONENTE
Para CADA componente del módulo, lanzar agentes en PARALELO para:
- ✅ Análisis de Seguridad
- ✅ Análisis de Desempeño
- ✅ Análisis Visual/UX
- ✅ Análisis de Arquitectura

### 3. ANÁLISIS DE INTEGRACIÓN
- Comunicación entre componentes
- State management
- Data flow
- Error handling propagation
- Performance de la interacción

### 4. ANÁLISIS DE SERVICIOS
- Servicios compartidos
- HTTP interceptors
- Guards y Resolvers
- Pipes personalizados

## INSTRUCCIONES DE EJECUCIÓN

**PASO 1:** Identifica la estructura del módulo
```
Busca y lista todos los archivos relacionados con el módulo:
- Componentes (.ts, .html, .scss, .spec.ts)
- Servicios
- Models/Interfaces
- Guards/Resolvers
- Routing
```

**PASO 2:** Lanza análisis en paralelo

Usa el sistema de agentes para ejecutar análisis paralelos. Ejemplo:

```
Para el módulo RAG Dashboard:

Agent 1: /review-security rag-dashboard + chat-interface + conversations-list
Agent 2: /review-performance rag-dashboard + chat-interface + conversations-list
Agent 3: /review-ux rag-dashboard + chat-interface + conversations-list
Agent 4: Analizar semantic-search component
```

**PASO 3:** Consolida resultados

Una vez que todos los agentes reporten:
- Agrupa problemas comunes
- Identifica problemas de integración
- Prioriza acciones

## FORMATO DEL REPORTE

### 1. RESUMEN EJECUTIVO DEL MÓDULO
```
Módulo: [Nombre]
Componentes analizados: [cantidad]
Score general: X/100
Estado: 🟢 Saludable / 🟡 Necesita atención / 🔴 Crítico

Distribución de issues:
- 🚨 Críticos: X
- ⚠️ Altos: X
- 📝 Medios: X
- 💡 Bajos: X
```

### 2. MAPA DE COMPONENTES
```
[Módulo]
├── Component A (Score: 85/100)
│   ├── Security: ✅ 90/100
│   ├── Performance: ⚠️ 75/100
│   └── UX: ✅ 88/100
├── Component B (Score: 72/100)
│   ├── Security: 🚨 60/100
│   ├── Performance: ✅ 85/100
│   └── UX: ⚠️ 70/100
└── Shared Service (Score: 80/100)
```

### 3. TOP ISSUES DEL MÓDULO
Lista de los 10 problemas más críticos encontrados en TODO el módulo:
1. [CRÍTICO] [Componente] Descripción
2. [CRÍTICO] [Componente] Descripción
...

### 4. ANÁLISIS POR COMPONENTE
Para cada componente, sección detallada con hallazgos

### 5. ANÁLISIS DE INTEGRACIÓN
- Problemas de comunicación entre componentes
- Duplicación de código/lógica
- Inconsistencias de estado
- Performance de la integración

### 6. RECOMENDACIONES DE REFACTORING
Sugerencias de mejoras arquitectónicas para el módulo completo:
- Extracción de lógica compartida
- Mejoras en estructura
- Patterns recomendados

### 7. PLAN DE ACCIÓN PRIORIZADO

#### Sprint 1 (Crítico - 1 semana)
- [ ] Item 1
- [ ] Item 2

#### Sprint 2 (Alto - 2 semanas)
- [ ] Item 1
- [ ] Item 2

#### Backlog (Medio-Bajo)
- [ ] Item 1
- [ ] Item 2

### 8. MÉTRICAS Y KPIs
- Bundle size del módulo
- Test coverage
- Complexity metrics
- Maintenance score

**MÓDULO A ANALIZAR:** [Especificar el módulo]

**NOTA IMPORTANTE:** Este análisis puede tomar varios minutos debido a que se ejecutan múltiples análisis en paralelo. Los resultados serán consolidados al final.

---

## 💾 GUARDAR RESULTADOS

**IMPORTANTE:** El análisis de módulo genera MÚLTIPLES archivos.

### 1. Reporte Principal del Módulo
**Ubicación:**
```
Docs/analysis-system/reports/modules/{MODULE_NAME}-analysis-{YYYY-MM-DD}.md
```

**Contenido:**
- Resumen ejecutivo del módulo
- Mapa de componentes con scores
- Top issues del módulo
- Análisis de integración
- Plan de acción consolidado
- Métricas del módulo

### 2. Reportes Individuales de Componentes
Para cada componente analizado, crear archivo separado:
```
Docs/analysis-system/reports/components/{COMPONENT_NAME}-complete-{YYYY-MM-DD}.md
```

### 3. Índice del Módulo
**Ubicación:**
```
Docs/analysis-system/reports/modules/{MODULE_NAME}-index.md
```

**Contenido:**
```markdown
# Índice de Análisis - Módulo {MODULE_NAME}

**Último análisis:** {YYYY-MM-DD}

## Reportes Disponibles

### Reporte Principal
- [Análisis del Módulo {MODULE_NAME}](./{ MODULE_NAME}-analysis-{YYYY-MM-DD}.md) - Score: X/100

### Componentes
- [Component A](./../components/component-a-complete-{YYYY-MM-DD}.md) - Score: X/100
- [Component B](./../components/component-b-complete-{YYYY-MM-DD}.md) - Score: X/100
...

## Historial de Análisis
- {YYYY-MM-DD}: Score X/100 - [Ver reporte](./{MODULE_NAME}-analysis-{YYYY-MM-DD}.md)
- {YYYY-MM-DD anterior}: Score Y/100 - [Ver reporte](./{MODULE_NAME}-analysis-{fecha}.md)

## Tendencia
📈 Mejorando / 📉 Degradando / ➡️ Estable
```

### Plantilla del Reporte Principal:
```markdown
# Análisis de Módulo - {MODULE_NAME}

**Fecha:** {YYYY-MM-DD}
**Tipo:** Análisis de Módulo Completo
**Componentes analizados:** X
**Score General del Módulo:** X/100
**Estado:** 🟢/🟡/🟠/🔴

---

[CONTENIDO DEL ANÁLISIS]

---

## Archivos Relacionados

Este análisis generó los siguientes archivos:

### Reportes de Componentes:
- [Component A](../components/component-a-complete-{YYYY-MM-DD}.md)
- [Component B](../components/component-b-complete-{YYYY-MM-DD}.md)
...

### Ver también:
- [Índice del módulo](./{MODULE_NAME}-index.md)
- [Análisis anterior](./{MODULE_NAME}-analysis-{fecha-anterior}.md)

**Próximo análisis de módulo:** {fecha + 3 meses}
```

### Instrucciones:
1. Primero, analiza todos los componentes y guarda reportes individuales
2. Luego, crea el reporte principal del módulo
3. Finalmente, actualiza/crea el índice del módulo
4. Informa al usuario las ubicaciones de TODOS los archivos creados
5. Menciona el score general del módulo y top 3 issues críticos
