---
description: Analiza únicamente aspectos visuales y de experiencia de usuario de un componente
---

# Análisis Visual/UX - Componente Angular

Realiza un análisis enfocado exclusivamente en VISUAL y EXPERIENCIA DE USUARIO del componente/módulo especificado.

## 🎨 CHECKLIST VISUAL/UX

### Accesibilidad (A11y)
- [ ] Semantic HTML usado correctamente
- [ ] ARIA labels, roles y attributes apropiados
- [ ] Navegación por teclado funcional (Tab, Enter, Esc, Arrow keys)
- [ ] Focus indicators visibles y claros
- [ ] Screen reader friendly
- [ ] Contraste de colores cumple WCAG 2.1 (AA mínimo)
- [ ] Textos alternativos en imágenes
- [ ] Form labels asociados correctamente
- [ ] Error messages descriptivos y accesibles
- [ ] Skip navigation links donde sea necesario

### Responsive Design
- [ ] Mobile-first approach
- [ ] Breakpoints apropiados
- [ ] Touch targets de tamaño adecuado (mín 44x44px)
- [ ] Orientación portrait y landscape
- [ ] Viewport meta tag configurado
- [ ] No scroll horizontal no deseado
- [ ] Imágenes responsive
- [ ] Typography escalable

### Visual Consistency
- [ ] Sigue Angular Material Design guidelines
- [ ] Tipografía consistente (font families, sizes, weights)
- [ ] Espaciado consistente (margins, padding)
- [ ] Paleta de colores del sistema
- [ ] Iconografía consistente
- [ ] Elevation/Shadows usados apropiadamente
- [ ] Border radius consistente

### User Feedback
- [ ] Loading states claros
- [ ] Error states informativos
- [ ] Success feedback visible
- [ ] Empty states con guidance
- [ ] Progress indicators para operaciones largas
- [ ] Disabled states claramente indicados
- [ ] Hover/Focus/Active states diferenciados
- [ ] Tooltips para acciones no obvias

### Interaction Design
- [ ] Call-to-actions claros
- [ ] Jerarquía visual apropiada
- [ ] Confirmación para acciones destructivas
- [ ] Undo/Redo donde sea apropiado
- [ ] Drag & drop intuitivo (si aplica)
- [ ] Gestures apropiados para mobile
- [ ] Animations con propósito (no decorativas solamente)
- [ ] Micro-interactions que mejoran UX

### Form UX
- [ ] Validation en tiempo real apropiada
- [ ] Error messages claros y específicos
- [ ] Field labels descriptivos
- [ ] Placeholder text apropiado (no reemplaza labels)
- [ ] Help text cuando sea necesario
- [ ] Input masking donde aplique
- [ ] Autocomplete/suggestions útiles
- [ ] Submit button claramente identificable
- [ ] Form progress indicator (multi-step forms)

### Performance Percibido
- [ ] Skeleton screens para carga
- [ ] Optimistic UI updates
- [ ] Progressive disclosure
- [ ] Lazy loading de imágenes
- [ ] Animations suaves (no janky)
- [ ] Perceived performance optimizado

### Legibilidad
- [ ] Line height apropiado (1.5-1.6 para body text)
- [ ] Line length óptimo (50-75 caracteres)
- [ ] Jerarquía tipográfica clara
- [ ] Suficiente espacio en blanco
- [ ] Texto justificado evitado

## WCAG 2.1 COMPLIANCE LEVELS

### Level A (Mínimo)
- [ ] Todas las funcionalidades accesibles por teclado
- [ ] Contraste mínimo
- [ ] Texto alternativo

### Level AA (Recomendado)
- [ ] Contraste 4.5:1 para texto normal
- [ ] Contraste 3:1 para texto grande
- [ ] Redimensionable hasta 200%
- [ ] Múltiples formas de navegación

### Level AAA (Óptimo)
- [ ] Contraste 7:1 para texto normal
- [ ] Contraste 4.5:1 para texto grande
- [ ] No imágenes de texto

## FORMATO DEL REPORTE

### 1. UX SCORE
- Score general (0-100)
- Score por sub-categoría:
  - Accesibilidad: X/100
  - Responsive: X/100
  - Consistencia: X/100
  - Feedback: X/100
  - Usabilidad: X/100

### 2. PROBLEMAS IDENTIFICADOS

Para cada problema:
```
🎨 [SEVERIDAD: CRÍTICO/ALTO/MEDIO/BAJO] Título
Categoría: [Accesibilidad/Responsive/Consistencia/etc.]
Descripción: ...
Ubicación: archivo:línea
Impacto en usuario: ...
Implementación actual:
  [código/screenshot]
Solución propuesta:
  [código/mockup]
Estándar: [WCAG 2.1 Level AA, Material Design, etc.]
```

### 3. QUICK WINS UX
Mejoras rápidas con alto impacto en experiencia:
1. ...
2. ...
3. ...

### 4. MEJORAS ESTRATÉGICAS
Mejoras que requieren más esfuerzo:
1. ...
2. ...

### 5. TESTING RECOMMENDATIONS

#### Accessibility Testing
- Herramientas: axe DevTools, WAVE, Lighthouse
- Manual keyboard testing
- Screen reader testing (NVDA, JAWS, VoiceOver)

#### Responsive Testing
- Dispositivos a testear
- Breakpoints críticos
- Orientaciones

#### Usability Testing
- User flows a validar
- Métricas de usabilidad (task completion, time on task, etc.)

### 6. DESIGN SYSTEM COMPLIANCE
- Componentes que siguen el sistema: ✅
- Componentes que se desvían: ⚠️
- Justificación de desviaciones

### 7. VISUAL REGRESSION TESTING
- Recomendaciones para prevenir regresiones visuales
- Herramientas sugeridas (Percy, Chromatic, etc.)

**COMPONENTE/MÓDULO A ANALIZAR:** [Especificar componente o módulo]

**INCLUIR SCREENSHOTS:** Si es posible, analiza también screenshots del componente en diferentes estados (normal, hover, focus, error, loading, empty).

---

## 💾 GUARDAR RESULTADOS

**IMPORTANTE:** Después de completar el análisis de UX/Accesibilidad, DEBES guardar el reporte en un archivo.

### Ubicación del archivo:
```
Docs/analysis-system/reports/ux/{COMPONENT_NAME}-ux-accessibility-{YYYY-MM-DD}.md
```

### Plantilla del encabezado:
```markdown
# Análisis UX/Accesibilidad - {COMPONENT_NAME}

**Fecha:** {YYYY-MM-DD}
**Tipo:** Análisis de Experiencia de Usuario y Accesibilidad
**UX Score:** X/100
**WCAG 2.1 Compliance:** Level A / AA / AAA
**Problemas Críticos de A11y:** X

---

[CONTENIDO DEL ANÁLISIS]

---

## Testing Checklist

### Accessibility
- [ ] Lighthouse accessibility audit
- [ ] axe DevTools scan
- [ ] Keyboard navigation test
- [ ] Screen reader test (NVDA/JAWS)
- [ ] Color contrast verification

### Responsive
- [ ] Mobile (320px, 375px, 414px)
- [ ] Tablet (768px, 1024px)
- [ ] Desktop (1440px, 1920px)

## Acciones Prioritarias

[Lista de mejoras de accesibilidad críticas]

**Próximo UX audit:** {fecha + 3 meses}
**WCAG compliance review:** {fecha + 6 meses}
```

### Instrucciones:
1. Usa Write tool para guardar el archivo
2. Destaca el nivel WCAG compliance alcanzado
3. Lista las barreras de accesibilidad encontradas
4. Si hay screenshots, inclúyelos en el reporte
