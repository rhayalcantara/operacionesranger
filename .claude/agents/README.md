# Agentes Personalizados de Claude Code

Este directorio contiene agentes especializados para tareas específicas del proyecto Ranger Nomina.

## Agentes Disponibles

### 🧪 test-funcionalidad (v2.1)

**Versión:** 2.1.0 - **CORREGIDO problema de páginas en paralelo**

**Propósito:** Realizar pruebas funcionales automatizadas end-to-end usando MCP Chrome DevTools y generar reportes detallados.

**Novedades v2.1:**
- 🔧 **CORRECCIÓN CRÍTICA:** Manejo apropiado de páginas en modo paralelo vs individual
- ⚠️ Detección automática de limitaciones de MCP Chrome DevTools
- 🔀 Modo híbrido: páginas independientes (individual) vs página compartida (paralelo)
- ⏱️ Waits ajustados según modo de ejecución (2.5x en paralelo)
- 🎯 Navegación por menú preferida en paralelo
- 📋 Guía específica para pruebas en paralelo

**Novedades v2.0:**
- ⏱️ Waits mejorados para evitar condiciones de carrera
- 🔗 Verificación automática de estabilidad de URL
- 🐛 Mejor detección de problemas de routing
- 📊 Métricas de rendimiento en reportes

**Cuándo usar:**
- Necesitas probar una funcionalidad específica de la aplicación web
- Quieres verificar que un módulo CRUD funciona correctamente
- Necesitas documentar el estado de una feature para QA
- Quieres automatizar pruebas de regresión en paralelo
- Necesitas generar evidencia de pruebas con métricas detalladas

**Cómo invocar:**

```bash
# Opción 1: Usar el comando Task desde Claude Code
@task test-funcionalidad "Prueba la creación de un nuevo empleado"

# Opción 2: Referencia directa en la conversación
"Usa el agente test-funcionalidad para verificar el módulo de departamentos"

# Opción 3: Con archivo de instrucciones
"Usa el agente test-funcionalidad con las instrucciones en test.md"

# Opción 4: Pruebas en paralelo (con limitaciones de MCP)
"Usa test-funcionalidad para probar AFP, ARS y Tipos de Nómina en paralelo"
# NOTA: El agente detectará modo paralelo y ajustará estrategia automáticamente

# Opción 5: Pruebas secuenciales (RECOMENDADO para precisión)
"Usa test-funcionalidad para probar AFP, luego ARS, luego Tipos de Nómina"
# Más lento pero sin falsos positivos por colisiones
```

**Ejemplos de uso:**

```
# Prueba CRUD básica
"Usa test-funcionalidad para probar la actualización de un registro de ARS"

# Prueba de proceso complejo
"Usa test-funcionalidad para probar el cierre de una nómina"

# Prueba con datos específicos
"Usa test-funcionalidad para crear un empleado con cédula 12345678901
y salario 50000"

# Prueba de importación
"Usa test-funcionalidad para probar la importación de horas extras desde Excel"
```

**Salida esperada (v2.0):**
- Archivo Markdown en `Docs/` con el reporte completo
- Screenshots del proceso con evidencia visual
- Tabla de verificación de URLs y navegación
- Métricas de rendimiento (tiempos, waits, solicitudes)
- Resumen ejecutivo de los resultados
- Lista de errores encontrados con severidad clasificada
- Recomendaciones de mejora priorizadas
- Análisis de problemas de routing (si aplica)

---

## Estructura de Archivos

```
.claude/
└── agents/
    ├── README.md                    # Este archivo
    └── test-funcionalidad.md        # Agente de pruebas funcionales
```

---

## Cómo Crear un Nuevo Agente

1. **Crea un archivo .md** en este directorio con el nombre del agente
2. **Define el propósito** claramente al inicio
3. **Especifica las herramientas** que puede usar
4. **Describe el flujo de trabajo** paso a paso
5. **Incluye ejemplos** de uso
6. **Documenta en este README**

### Template Básico

```markdown
# Agent: [Nombre del Agente]

[Descripción breve del propósito]

## Tu Misión

[Descripción detallada de lo que debe hacer]

## Herramientas Disponibles

[Lista de tools que usará]

## Flujo de Trabajo

### 1. [Paso 1]
[Descripción]

### 2. [Paso 2]
[Descripción]

## Mejores Prácticas

### DO ✅
- [Práctica 1]

### DON'T ❌
- [Anti-práctica 1]

## Ejemplos

[Ejemplos concretos de uso]
```

---

## Convenciones

### Nombres de Agentes
- Usar kebab-case: `nombre-del-agente`
- Ser descriptivo: `test-funcionalidad` mejor que `prueba`
- Evitar abreviaciones ambiguas

### Archivos de Salida
Los agentes que generan archivos deben seguir estas convenciones:

**Reportes de Prueba:**
- Ubicación: `Docs/`
- Formato: `test_[funcionalidad]_[fecha].md`
- Ejemplo: `test_crear_empleado_20251020.md`

**Logs:**
- Ubicación: `Logs/`
- Formato: `[agente]_[fecha]_[hora].log`

**Screenshots:**
- Ubicación: `Docs/screenshots/`
- Formato: `[funcionalidad]_[paso]_[timestamp].png`

---

## Mejores Prácticas Generales

### Para Usuarios

1. **Sé específico:** "Prueba crear un empleado" → "Prueba crear un empleado con todos los campos requeridos y verifica que se guarde correctamente"

2. **Proporciona contexto:** Si hay datos específicos necesarios, menciónalo: "Usa el empleado con ID 5 para la prueba"

3. **Define el alcance:** "Prueba solo la creación, no la edición ni eliminación"

4. **Menciona restricciones:** "No uses el empleado con ID 1 porque está en una nómina cerrada"

### Para Desarrolladores de Agentes

1. **Usa TodoWrite:** Siempre trackea el progreso con tareas
2. **Maneja errores:** No asumas que todo funciona, verifica
3. **Documenta todo:** Screenshots, solicitudes de red, logs de consola
4. **Sé consistente:** Usa los mismos formatos en todos los reportes
5. **Proporciona valor:** No solo reportes qué pasó, analiza por qué

---

## Testing de Agentes

Antes de considerar un agente como "completo", pruébalo con:

1. **Caso exitoso:** Todo funciona como se espera
2. **Caso con errores:** La funcionalidad tiene bugs
3. **Caso de datos inválidos:** Entradas incorrectas
4. **Caso de red lenta:** Simula latencia
5. **Caso de sesión expirada:** Sin autenticación

---

## Mantenimiento

### Cuándo Actualizar un Agente

- La aplicación cambió su estructura de UI
- Se agregaron nuevas herramientas MCP
- Se descubrieron mejores prácticas
- Los reportes necesitan información adicional
- Usuarios reportan problemas consistentes

### Versionado

Incluye un campo de versión en los agentes:

```markdown
**Versión:** 1.0.0
**Última Actualización:** 2025-10-20
**Changelog:**
- v1.0.0: Versión inicial
```

---

## Troubleshooting

### "El agente no se ejecuta"
- Verifica que el archivo .md esté en `.claude/agents/`
- Confirma que el nombre no tiene espacios
- Revisa que la sintaxis markdown sea correcta

### "El agente genera reportes incompletos"
- Revisa las instrucciones del flujo de trabajo
- Verifica que tenga acceso a las herramientas necesarias
- Comprueba que los pasos estén claramente definidos

### "El agente falla en ciertos casos"
- Agrega manejo de errores específico para esos casos
- Documenta las limitaciones conocidas
- Considera crear un agente especializado para ese caso

---

## Recursos

- [Documentación de Claude Code](https://docs.claude.com/claude-code)
- [MCP Chrome DevTools](https://github.com/anthropics/mcp-chrome-devtools)
- [Proyecto Ranger Nomina - CLAUDE.md](../../CLAUDE.md)

---

## Contribuir

Para agregar un nuevo agente o mejorar uno existente:

1. Crea o edita el archivo del agente
2. Actualiza este README
3. Prueba el agente con casos reales
4. Documenta cualquier limitación conocida
5. Comparte ejemplos de uso exitoso

---

**Última actualización:** 2025-10-20
**Mantenedor:** Equipo Ranger Sistemas
