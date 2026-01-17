---
description: Analiza un componente Angular en profundidad (seguridad, desempeño, visual/UX)
---

# Análisis de Componente Angular

Realiza un análisis exhaustivo del componente especificado evaluando:

## 🔒 SEGURIDAD
- Validación y sanitización de inputs
- Manejo de autenticación/autorización
- Protección contra XSS/Injection
- Exposición de información sensible
- Vulnerabilidades en dependencias
- Uso de DomSanitizer cuando sea necesario
- Template security (property vs attribute binding)

## ⚡ DESEMPEÑO
- Change Detection Strategy (OnPush vs Default)
- Memory leaks (subscriptions, event listeners)
- Uso de trackBy en *ngFor
- Lazy loading de recursos
- Optimización de observables (shareReplay, etc.)
- Cantidad de watchers y bindings
- Bundle size impacto
- Renderizado condicional eficiente
- Uso de async pipe vs manual subscription

## 🎨 VISUAL/UX
- Accesibilidad (ARIA, roles, keyboard navigation)
- Responsive design
- Consistencia con Angular Material guidelines
- Estados de carga/error/vacío
- Feedback visual apropiado
- Manejo de interacciones del usuario
- Contraste y legibilidad
- Mobile-first considerations

## 📋 MEJORES PRÁCTICAS ANGULAR
- Arquitectura y organización del código
- Uso apropiado de directivas y pipes
- Dependency injection patterns
- Separación de concerns (presentational vs container)
- Testing readiness
- Type safety (TypeScript)
- RxJS best practices

## FORMATO DEL REPORTE

Genera un reporte estructurado con:

### 1. RESUMEN EJECUTIVO
- Score general (0-100)
- Scores por categoría
- Top 3 problemas críticos
- Top 3 mejoras recomendadas

### 2. ANÁLISIS DETALLADO POR CATEGORÍA

Para cada categoría:
- ✅ ASPECTOS POSITIVOS: Lo que está bien implementado
- ⚠️ ADVERTENCIAS: Problemas de severidad media
- 🚨 CRÍTICO: Problemas que deben resolverse inmediatamente
- 💡 SUGERENCIAS: Mejoras opcionales

### 3. CÓDIGO DE EJEMPLO

Para cada problema identificado, proporciona:
- Código actual (problema)
- Código sugerido (solución)
- Explicación del por qué

### 4. PLAN DE ACCIÓN PRIORIZADO

Lista las mejoras en orden de prioridad:
1. [CRÍTICO] Descripción corta
2. [ALTO] Descripción corta
3. [MEDIO] Descripción corta
4. [BAJO] Descripción corta

## INSTRUCCIONES

1. Lee todos los archivos relacionados con el componente (.ts, .html, .scss, .spec.ts)
2. Busca archivos de servicios, interfaces y modelos relacionados
3. Analiza el contexto de uso del componente en la aplicación
4. Aplica los criterios de evaluación mencionados
5. Genera el reporte completo

**COMPONENTE A ANALIZAR:** [El usuario especificará el nombre del componente]

**NOTA:** Si no se especifica un componente, pregunta cuál componente desea analizar de la lista disponible.

---

## 💾 GUARDAR RESULTADOS

**IMPORTANTE:** Después de completar el análisis, DEBES guardar el reporte en un archivo.

### Ubicación del archivo:
```
Docs/analysis-system/reports/components/{COMPONENT_NAME}-complete-{YYYY-MM-DD}.md
```

### Formato del nombre de archivo:
- `{COMPONENT_NAME}`: Nombre del componente analizado (ej: "file-explorer")
- `{YYYY-MM-DD}`: Fecha del análisis (ej: "2025-01-22")

### Ejemplo:
```
Docs/analysis-system/reports/components/file-explorer-complete-2025-01-22.md
```

### Contenido del archivo:
El archivo debe contener:
1. Encabezado con metadatos (fecha, analista, versión)
2. El reporte completo generado
3. Footer con información de cómo usar el reporte

### Instrucciones para guardar:
1. Usa la herramienta Write para crear el archivo
2. Incluye todos los hallazgos del análisis
3. Formatea usando Markdown apropiadamente
4. Al final del análisis, informa al usuario dónde se guardó el reporte

### Plantilla del encabezado:
```markdown
# Análisis Completo - {COMPONENT_NAME}

**Fecha:** {YYYY-MM-DD}
**Tipo:** Análisis Completo (Seguridad + Performance + UX)
**Score General:** X/100
**Estado:** 🟢/🟡/🟠/🔴

---

[CONTENIDO DEL ANÁLISIS]

---

## Cómo usar este reporte

1. Revisa el Resumen Ejecutivo para overview
2. Prioriza issues críticos (🚨)
3. Implementa Quick Wins primero
4. Sigue el Plan de Acción propuesto
5. Re-ejecuta análisis después de cambios

**Próximo análisis recomendado:** {fecha + 1 mes}
```
