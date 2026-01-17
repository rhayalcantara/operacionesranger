---
description: Analiza únicamente aspectos de seguridad de un componente/módulo
---

# Análisis de Seguridad - Componente Angular

Realiza un análisis enfocado exclusivamente en SEGURIDAD del componente/módulo especificado.

## 🔒 CHECKLIST DE SEGURIDAD

### Input Validation & Sanitization
- [ ] Todos los inputs del usuario son validados
- [ ] Validación en el lado del cliente y servidor
- [ ] Sanitización de HTML cuando sea necesario
- [ ] Uso correcto de DomSanitizer
- [ ] Prevención de Template Injection

### Authentication & Authorization
- [ ] Verificación de permisos antes de mostrar/ejecutar acciones
- [ ] Tokens manejados de forma segura
- [ ] No hay credenciales hardcodeadas
- [ ] Session management apropiado
- [ ] Guards implementados correctamente

### XSS Protection
- [ ] Property binding vs attribute binding usado correctamente
- [ ] innerHTML evitado o sanitizado apropiadamente
- [ ] URLs sanitizadas (ResourceUrl)
- [ ] No hay evaluación dinámica de código (eval, Function)
- [ ] Content Security Policy considerado

### Data Exposure
- [ ] No hay información sensible en console.log
- [ ] No hay datos sensibles en el DOM
- [ ] API keys no expuestas en el cliente
- [ ] Errores no revelan información del sistema
- [ ] PII (Personal Identifiable Information) protegida

### Dependencies & Third-party
- [ ] Dependencias actualizadas
- [ ] No hay vulnerabilidades conocidas (npm audit)
- [ ] Librerías de fuentes confiables
- [ ] Scope mínimo de permisos

### OWASP Top 10 Considerations
- [ ] Injection (SQL, NoSQL, Command)
- [ ] Broken Authentication
- [ ] Sensitive Data Exposure
- [ ] XML External Entities (XXE)
- [ ] Broken Access Control
- [ ] Security Misconfiguration
- [ ] Cross-Site Scripting (XSS)
- [ ] Insecure Deserialization
- [ ] Using Components with Known Vulnerabilities
- [ ] Insufficient Logging & Monitoring

## FORMATO DEL REPORTE

### 1. SECURITY SCORE
- Nivel general: CRÍTICO / ALTO / MEDIO / BAJO
- Score numérico (0-100)

### 2. VULNERABILIDADES ENCONTRADAS
Para cada vulnerabilidad:
```
🚨 [SEVERIDAD] Título
Descripción: ...
Ubicación: archivo.ts:línea
Impacto: ...
Código vulnerable:
  [código]
Solución:
  [código corregido]
Referencias: [CWE, OWASP, etc.]
```

### 3. RECOMENDACIONES PRIORITARIAS
1. Acción inmediata
2. Acción corto plazo
3. Acción largo plazo

### 4. BEST PRACTICES SECURITY CHECKLIST
- Lista de prácticas de seguridad recomendadas específicas para este componente

**COMPONENTE/MÓDULO A ANALIZAR:** [Especificar componente o módulo]

---

## 💾 GUARDAR RESULTADOS

**IMPORTANTE:** Después de completar el análisis de seguridad, DEBES guardar el reporte en un archivo.

### Ubicación del archivo:
```
Docs/analysis-system/reports/security/{COMPONENT_NAME}-security-{YYYY-MM-DD}.md
```

### Plantilla del encabezado:
```markdown
# Análisis de Seguridad - {COMPONENT_NAME}

**Fecha:** {YYYY-MM-DD}
**Tipo:** Análisis de Seguridad
**Security Score:** X/100
**Vulnerabilidades Críticas:** X
**Estado:** 🟢 Seguro / 🟡 Necesita atención / 🔴 Crítico

---

[CONTENIDO DEL ANÁLISIS]

---

## Acciones Inmediatas Requeridas

[Lista de vulnerabilidades críticas que deben resolverse antes de deploy]

**Próximo security audit:** {fecha + 3 meses}
```

### Instrucciones:
1. Usa Write tool para guardar el archivo
2. Informa al usuario la ubicación del reporte guardado
3. Menciona las vulnerabilidades críticas encontradas
