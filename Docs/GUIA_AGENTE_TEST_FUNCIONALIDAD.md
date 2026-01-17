# Guía Rápida: Agente Test de Funcionalidad

## ¿Qué es?

Un agente especializado de Claude Code que realiza pruebas funcionales automatizadas de tu aplicación web usando Chrome DevTools y genera reportes profesionales en formato Markdown.

## ¿Para qué sirve?

- ✅ Probar funcionalidades CRUD (Crear, Leer, Actualizar, Eliminar)
- ✅ Verificar procesos complejos (crear nóminas, importaciones, etc.)
- ✅ Validar formularios y sus validaciones
- ✅ Detectar errores en consola y solicitudes de red
- ✅ Generar documentación de pruebas
- ✅ Automatizar pruebas de regresión
- ✅ Crear evidencia para QA

## Inicio Rápido

### Forma más simple:

```
"Usa el agente test-funcionalidad para probar la creación de un departamento"
```

### Con más detalles:

```
"Usa test-funcionalidad para:
1. Ir a Mantenimientos -> ARS
2. Editar el primer registro
3. Cambiar el porcentaje a 3.5
4. Guardar y verificar"
```

### Con archivo de instrucciones:

1. Crea un archivo `test.md` con las instrucciones
2. Escribe: `"Usa test-funcionalidad con las instrucciones en test.md"`

## Lo que el Agente Hace Automáticamente

1. ✅ Navega a la aplicación (localhost:4200)
2. ✅ Verifica si hay sesión activa o hace login
3. ✅ Sigue los pasos de prueba que le indiques
4. ✅ Toma screenshots en puntos clave
5. ✅ Monitorea solicitudes HTTP (POST, PUT, GET, DELETE)
6. ✅ Detecta errores en la consola del navegador
7. ✅ Verifica que los datos se guarden correctamente
8. ✅ Genera un reporte completo en `Docs/`
9. ✅ Te da un resumen ejecutivo

## Ejemplos Reales

### Ejemplo 1: Prueba Simple de Actualización

**Entrada:**
```
Prueba actualizar el nombre de un empleado
```

**Lo que hace el agente:**
- Va a Mantenimientos -> Empleados
- Selecciona un empleado
- Cambia el nombre
- Guarda
- Verifica el cambio
- Genera reporte

**Salida:**
- Archivo: `Docs/test_actualizar_empleado_20251020.md`
- Resumen: ✅ PRUEBA EXITOSA - Sin errores

---

### Ejemplo 2: Prueba Compleja de Nómina

**Entrada:**
```
Prueba crear una nómina administrativa del 1 al 15 de noviembre,
con todos los empleados activos, verifica los cálculos de AFP,
ARS e ISR
```

**Lo que hace el agente:**
- Va a Payroll -> Nominas
- Click en "Crear Nueva Nómina"
- Selecciona tipo y fechas
- Selecciona empleados
- Genera detalle
- Verifica cálculos
- Valida totales
- Genera reporte

**Salida:**
- Reporte detallado con todos los cálculos verificados
- Lista de solicitudes HTTP ejecutadas
- Validación de fórmulas de deducción

---

### Ejemplo 3: Prueba de Validaciones

**Entrada:**
```
Prueba las validaciones del formulario de empleado:
- Intenta guardar sin cédula
- Intenta guardar con salario negativo
- Verifica que muestre errores apropiados
```

**Lo que hace el agente:**
- Abre formulario de empleado
- Intenta guardar con campos vacíos
- Documenta mensajes de error
- Prueba valores inválidos
- Verifica que las validaciones funcionen

**Salida:**
- Reporte con cada validación probada
- Screenshots de mensajes de error
- Evaluación de la UX de validaciones

---

### Ejemplo 4: Prueba de Eliminación

**Entrada:**
```
Prueba eliminar un puesto de trabajo que no esté siendo usado
```

**Lo que hace el agente:**
- Va a Mantenimientos -> Puestos
- Identifica un registro que no esté en uso
- Lo elimina
- Verifica que desapareció de la lista
- Valida solicitud DELETE exitosa

**Salida:**
- Confirmación de eliminación exitosa
- Validación de integridad referencial

## Estructura del Reporte Generado

Cada reporte incluye:

### 1. Encabezado
- Fecha y hora de la prueba
- Usuario utilizado
- URL de la aplicación

### 2. Objetivo
- Descripción clara de qué se probó

### 3. Procedimiento
- Paso a paso de lo que se hizo
- Estado de cada acción (✅/❌)

### 4. Análisis de Red
- Todas las solicitudes HTTP
- Códigos de estado
- Descripción de cada solicitud crítica

### 5. Consola
- Errores detectados
- Warnings importantes
- Logs relevantes

### 6. Validación de Datos
- Tabla con datos esperados vs actuales
- Verificación de persistencia

### 7. Resultados
- Estado general: ✅ EXITOSA / ❌ FALLIDA
- Detalles de cada aspecto probado
- Lista de errores (si hay)

### 8. Recomendaciones
- Mejoras sugeridas
- Problemas detectados
- Buenas prácticas observadas

### 9. Conclusión
- Resumen ejecutivo
- Estado final: APROBADO / RECHAZADO / REQUIERE ATENCIÓN

## Casos de Uso Comunes

### 📝 CRUD de Mantenimientos

```
"Prueba el CRUD completo de departamentos:
1. Crear un nuevo departamento
2. Editarlo
3. Eliminarlo"
```

### 💰 Procesos de Nómina

```
"Prueba el cierre de nómina:
1. Abre la última nómina
2. Verifica que todos los cálculos estén correctos
3. Cierra la nómina
4. Verifica que quede inmutable"
```

### 📊 Importaciones

```
"Prueba la importación de horas extras:
1. Sube el archivo Excel de prueba
2. Verifica que se valide el formato
3. Confirma la importación
4. Verifica que los datos se guardaron"
```

### 🔐 Permisos y Seguridad

```
"Prueba los permisos de usuario:
1. Login como usuario no-admin
2. Verifica que no vea el menú de Usuarios
3. Verifica que no pueda editar empleados
4. Confirma acceso solo a lectura"
```

### 🎨 Interfaz de Usuario

```
"Prueba la experiencia de usuario en el formulario de empleado:
1. Verifica que todos los campos se llenen correctamente
2. Prueba los date pickers
3. Prueba los dropdowns (AFP, ARS, Puesto)
4. Verifica que la foto se suba correctamente"
```

## Qué Incluir en tus Instrucciones

### ✅ INCLUYE:

- **Pasos específicos:** "Edita el empleado con ID 1"
- **Datos concretos:** "Cambia el salario a 50000"
- **Verificaciones:** "Confirma que aparece en la lista"
- **Condiciones:** "Si hay error de constraint, documéntalo"
- **Valores esperados:** "El total debe ser aproximadamente 100,000"

### ❌ EVITA:

- Instrucciones vagas: "Prueba si funciona"
- Asumir contexto: "Edita el registro" (¿cuál?)
- Omitir datos necesarios: No especificar URL o credenciales
- Ser demasiado general: "Verifica todo"

## Interpretación de Resultados

### ✅ Prueba Exitosa

```
**Estado General:** PASSED ✅
**Estado Final:** ✅ APROBADO PARA PRODUCCIÓN

Todos los aspectos verificados funcionan correctamente.
```

**Significado:** La funcionalidad está lista para usar.

---

### ❌ Prueba Fallida

```
**Estado General:** FAILED ❌
**Estado Final:** ❌ RECHAZADO

Errores Encontrados:
- ❌ Error 1: Solicitud POST retorna 500
- ❌ Error 2: Datos no se guardan en BD
```

**Significado:** Hay problemas que deben corregirse antes de usar la funcionalidad.

---

### ⚠️ Requiere Atención

```
**Estado General:** PASSED with WARNINGS ⚠️
**Estado Final:** ⚠️ REQUIERE ATENCIÓN

Observaciones:
- ⚠️ Funciona pero hay warnings en consola
- ⚠️ Validaciones podrían mejorarse
```

**Significado:** Funciona pero hay aspectos mejorables.

## Tips y Mejores Prácticas

### Para Obtener Mejores Resultados:

1. **Sé específico:** Mientras más detalles, mejor será la prueba
2. **Usa datos reales:** Especifica registros que sabes que existen
3. **Define éxito:** Indica qué significa "exitoso" para tu caso
4. **Menciona excepciones:** Si algo debe fallar, dilo
5. **Pide verificaciones específicas:** "Verifica que el total sea 148,858.80"

### Cuándo Usar Este Agente:

✅ **USAR cuando:**
- Desarrollaste una nueva funcionalidad
- Hiciste cambios en el código y quieres verificar regresiones
- Necesitas documentar el estado de una feature
- Estás haciendo QA antes de un release
- Quieres automatizar pruebas repetitivas

❌ **NO USAR cuando:**
- Solo necesitas entender cómo funciona algo (usa lectura de código)
- Quieres hacer cambios en el código (el agente solo prueba)
- La funcionalidad no tiene UI (usa pruebas unitarias)

## Limitaciones Conocidas

1. **Solo funcionalidades web:** No puede probar APIs directamente sin UI
2. **Requiere la app corriendo:** localhost:4200 debe estar activo
3. **Un test a la vez:** No ejecuta múltiples pruebas en paralelo
4. **Dependiente de selectores:** Si la UI cambia mucho, puede necesitar ajustes

## Solución de Problemas

### "El agente no encuentra un elemento"
- Verifica que la aplicación esté corriendo en localhost:4200
- Confirma que la sesión esté activa
- Revisa que el elemento exista en la UI actual

### "Las solicitudes de red fallan"
- Verifica que el backend esté corriendo en localhost:3333
- Confirma que la base de datos esté accesible
- Revisa las credenciales y permisos

### "El reporte está incompleto"
- Proporciona instrucciones más detalladas
- Especifica qué aspectos verificar
- Menciona si hay casos especiales

## Recursos Adicionales

- **Ejemplos:** `.claude/agents/ejemplos/test-ejemplo.md`
- **Documentación del agente:** `.claude/agents/test-funcionalidad.md`
- **README de agentes:** `.claude/agents/README.md`
- **Reportes anteriores:** `Docs/test_*.md`

## Contacto y Soporte

Si encuentras problemas o tienes sugerencias:
1. Revisa los ejemplos en `.claude/agents/ejemplos/`
2. Consulta la documentación completa del agente
3. Revisa reportes previos para ver el formato esperado

---

## Ejemplo Completo de Conversación

**Usuario:**
```
Usa el agente test-funcionalidad para probar la creación
de un nuevo puesto de trabajo con nombre "CONTADOR" y
salario base sugerido de 35000
```

**Claude Code:**
```
Entendido. Voy a probar la creación de un nuevo puesto de trabajo.

[Ejecuta el agente]

✅ Prueba completada exitosamente.

Resumen:
- ✅ Navegación correcta al módulo de Puestos
- ✅ Formulario llenado correctamente
- ✅ Datos guardados: POST /api/rh_puestos → 201 Created
- ✅ Puesto visible en la lista
- ✅ Sin errores en consola

Reporte generado: Docs/test_crear_puesto_20251020.md
```

---

**¡Estás listo para empezar a usar el agente de pruebas funcionales!** 🚀

Simplemente escribe tu instrucción de prueba y el agente se encargará del resto.
