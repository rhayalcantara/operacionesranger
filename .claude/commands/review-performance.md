---
description: Analiza únicamente aspectos de desempeño de un componente/módulo
---

# Análisis de Desempeño - Componente Angular

Realiza un análisis enfocado exclusivamente en PERFORMANCE del componente/módulo especificado.

## ⚡ CHECKLIST DE DESEMPEÑO

### Change Detection
- [ ] Change Detection Strategy apropiada (OnPush donde sea posible)
- [ ] Minimización de triggers innecesarios
- [ ] Uso de immutability para inputs
- [ ] Evitar funciones en templates
- [ ] Evitar cálculos complejos en getters

### Memory Management
- [ ] Todas las subscriptions son desuscritas
- [ ] Uso de takeUntil/take/first para auto-cleanup
- [ ] Uso de async pipe cuando sea posible
- [ ] Event listeners removidos en ngOnDestroy
- [ ] No hay referencias circulares
- [ ] Timers/Intervals limpiados correctamente

### RxJS Optimization
- [ ] Uso de shareReplay para observables compartidos
- [ ] debounceTime/throttleTime para eventos frecuentes
- [ ] switchMap vs mergeMap usado apropiadamente
- [ ] Operators combinados eficientemente
- [ ] Evitar nested subscriptions

### Rendering Performance
- [ ] trackBy implementado en *ngFor
- [ ] Virtual scrolling para listas largas
- [ ] Lazy loading de componentes pesados
- [ ] Renderizado condicional (*ngIf antes de *ngFor)
- [ ] Evitar deep object comparisons en templates

### Bundle Size & Loading
- [ ] Lazy loading de módulos
- [ ] Tree-shaking considerado
- [ ] Imports optimizados (no import * from)
- [ ] Dead code eliminado
- [ ] Heavy libraries importadas selectivamente

### Network & Data
- [ ] HTTP requests minimizados
- [ ] Caching implementado donde corresponde
- [ ] Paginación para grandes datasets
- [ ] Debouncing en búsquedas/filtros
- [ ] Prefetching de datos críticos

### DOM Manipulation
- [ ] Mínimas manipulaciones directas del DOM
- [ ] Batch updates cuando sea posible
- [ ] Evitar layout thrashing
- [ ] CSS animations vs JS animations

## MÉTRICAS A EVALUAR

### Initial Load
- Time to First Byte (TTFB)
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to Interactive (TTI)

### Runtime Performance
- Change Detection cycles
- Memory usage
- CPU usage
- Frame rate (60fps objetivo)

### Bundle Analysis
- Initial bundle size
- Lazy chunks size
- Total size

## FORMATO DEL REPORTE

### 1. PERFORMANCE SCORE
- Score general (0-100)
- Scores por sub-categoría

### 2. PROBLEMAS IDENTIFICADOS

Para cada problema:
```
⚠️ [IMPACTO: ALTO/MEDIO/BAJO] Título
Descripción: ...
Ubicación: archivo.ts:línea
Impacto estimado: +XXms / +XXkb / +XX% CPU
Código actual:
  [código]
Optimización propuesta:
  [código optimizado]
Ganancia esperada: [descripción del beneficio]
```

### 3. QUICK WINS
Lista de optimizaciones que pueden implementarse rápidamente con alto impacto:
1. ...
2. ...
3. ...

### 4. REFACTORINGS MAYORES
Optimizaciones que requieren más trabajo pero tienen gran impacto:
1. ...
2. ...

### 5. RECOMENDACIONES DE MONITOREO
- Métricas a trackear
- Herramientas sugeridas (Chrome DevTools, Lighthouse, etc.)
- Umbrales recomendados

### 6. BENCHMARKS
Si es posible, incluir mediciones antes/después para optimizaciones propuestas.

**COMPONENTE/MÓDULO A ANALIZAR:** [Especificar componente o módulo]

---

## 💾 GUARDAR RESULTADOS

**IMPORTANTE:** Después de completar el análisis de performance, DEBES guardar el reporte en un archivo.

### Ubicación del archivo:
```
Docs/analysis-system/reports/performance/{COMPONENT_NAME}-performance-{YYYY-MM-DD}.md
```

### Plantilla del encabezado:
```markdown
# Análisis de Performance - {COMPONENT_NAME}

**Fecha:** {YYYY-MM-DD}
**Tipo:** Análisis de Desempeño
**Performance Score:** X/100
**Problemas Críticos:** X
**Quick Wins Identificados:** X

---

[CONTENIDO DEL ANÁLISIS]

---

## Quick Wins (Implementar Hoy)

[Lista de optimizaciones rápidas con alto impacto]

## Impacto Estimado

Después de Quick Wins:
- Performance Score: X → Y (+Z puntos)
- Reducción en Change Detection: -X%
- Reducción en re-renders: -Y%

**Próximo performance audit:** {fecha + 2 meses}
```

### Instrucciones:
1. Usa Write tool para guardar el archivo
2. Destaca los Quick Wins al informar al usuario
3. Incluye métricas de mejora esperada
