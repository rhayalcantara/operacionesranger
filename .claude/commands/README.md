# Comandos de Análisis de Componentes

Este directorio contiene comandos slash para analizar componentes y módulos Angular del proyecto DMS.

## 📋 Comandos Disponibles

| Comando | Descripción | Tiempo estimado |
|---------|-------------|-----------------|
| `/review-component` | Análisis completo de un componente | ~30-60s |
| `/review-security` | Análisis de seguridad únicamente | ~30s |
| `/review-performance` | Análisis de desempeño únicamente | ~30s |
| `/review-ux` | Análisis visual/UX únicamente | ~30s |
| `/review-module` | Análisis de módulo completo | ~2-5min |

## 🚀 Inicio Rápido

### Análisis Simple
```bash
/review-component file-explorer
```

### Análisis Específico
```bash
/review-security upload-dialog
```

### Análisis en Paralelo
```bash
# En el chat de Claude Code:
Analiza file-explorer para seguridad, performance y UX en paralelo
```

## 📚 Documentación Completa

Ver el archivo completo de documentación:
```
C:\COOPASPIRE\Proyectos\.claude\review-system-guide.md
```

## 🎯 Categorías de Análisis

### 🔒 Seguridad
- Input validation & sanitization
- Authentication & authorization
- XSS/Injection protection
- Data exposure
- OWASP Top 10

### ⚡ Desempeño
- Change Detection optimization
- Memory leaks
- RxJS optimization
- Bundle size
- Rendering performance

### 🎨 Visual/UX
- Accesibilidad (WCAG 2.1)
- Responsive design
- Visual consistency
- User feedback
- Interaction design

## 💡 Ejemplos

### Ejemplo 1: Pre-Commit Check
```bash
/review-component mi-nuevo-componente
```
Revisa el score y resuelve issues críticos antes de commit.

### Ejemplo 2: Auditoría de Seguridad
```bash
/review-security upload-dialog
/review-security move-dialog
```

### Ejemplo 3: Optimización de Performance
```bash
/review-performance file-explorer
```
Implementa las "Quick Wins" sugeridas.

### Ejemplo 4: Análisis de Módulo
```bash
/review-module document-management
```
Analiza todos los componentes del módulo de gestión documental.

## 🔧 Personalización

Puedes editar los archivos `.md` en este directorio para:
- Ajustar criterios de evaluación
- Agregar checks específicos de tu proyecto
- Modificar el formato de los reportes
- Agregar nuevas categorías de análisis

## 📊 Interpretación de Resultados

### Scores
- 🟢 90-100: Excelente
- 🟡 75-89: Bueno
- 🟠 60-74: Necesita atención
- 🔴 0-59: Crítico

### Severidad
- 🚨 CRÍTICO: Resolver antes de deploy
- ⚠️ ALTO: Resolver en próximo sprint
- 📝 MEDIO: Agregar a backlog
- 💡 BAJO: Nice to have

## 🛠️ Integración con Workflow

### Desarrollo de Features
1. Desarrollar componente
2. `/review-component <nombre>`
3. Resolver críticos
4. Commit + PR con reporte

### Code Review
1. Revisor ejecuta `/review-component <nombre>`
2. Valida que score > 75
3. Aprueba PR

### Pre-Producción
1. `/review-security` en componentes críticos
2. `/review-performance` en componentes pesados
3. `/review-ux` en componentes públicos
4. Resolver todos los críticos

## 🔍 Troubleshooting

### "No puedo encontrar el componente"
- Verifica que el nombre del componente sea correcto
- Usa el nombre del directorio (ej: `file-explorer` no `FileExplorer`)

### "El análisis toma mucho tiempo"
- Los análisis de módulos pueden tomar 2-5 minutos
- Usa análisis específicos para ser más rápido
- Ejecuta análisis en paralelo cuando sea posible

### "Quiero agregar un nuevo tipo de análisis"
- Crea un nuevo archivo `.md` en este directorio
- Sigue el formato de los archivos existentes
- Agrega el comando a esta documentación

## 📞 Más Información

Para guía completa con ejemplos detallados, flujos de trabajo y best practices:
```
.claude/review-system-guide.md
```
