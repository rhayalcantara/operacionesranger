# Ejemplo de Instrucciones para Test de Funcionalidad

Este archivo muestra cómo estructurar las instrucciones para el agente `test-funcionalidad`.

---

## Formato 1: Descripción Simple

```
Prueba la creación de un nuevo departamento
```

---

## Formato 2: Con Pasos Detallados

```
Prueba la actualización de empleado:
1. Ve a Mantenimiento -> Empleados
2. Edita el empleado con ID 1
3. Cambia el teléfono a 8091234567
4. Guarda y verifica que se actualizó
```

---

## Formato 3: Estructura Completa

```yaml
Funcionalidad: Crear Nueva Nómina
URL: http://localhost:4200
Usuario: admin
Clave: RHoss.1234

Pasos:
1. Navegar a Payroll -> Nominas
2. Click en "Crear Nueva Nómina"
3. Seleccionar:
   - Tipo: Administrativa
   - Fecha Inicio: 01/11/2025
   - Fecha Fin: 15/11/2025
4. Seleccionar todos los empleados activos
5. Click en "Generar Detalle"
6. Verificar que se crearon los registros
7. Verificar cálculos de AFP, ARS, ISR
8. Guardar nómina

Datos Esperados:
- Número de empleados: 11
- Total aproximado: > RD$100,000

Verificaciones:
- No debe haber errores en consola
- POST /api/nominas debe retornar 201
- Debe aparecer en la lista de nóminas
```

---

## Formato 4: Caso de Uso CRUD Completo

```
Funcionalidad: CRUD de Puestos de Trabajo

TEST 1 - CREAR:
1. Ve a Mantenimientos -> Puestos
2. Click en "Agregar"
3. Llena el formulario:
   - Nombre: "ANALISTA DE SISTEMAS"
   - Descripción: "Desarrollo y mantenimiento de sistemas"
   - Salario Base Sugerido: 45000
4. Guarda
5. Verifica que aparece en la lista

TEST 2 - ACTUALIZAR:
1. Edita el puesto recién creado
2. Cambia el salario base a 50000
3. Guarda
4. Verifica el cambio

TEST 3 - ELIMINAR:
1. Elimina el puesto de prueba
2. Confirma la eliminación
3. Verifica que ya no aparece en la lista

NOTA: Si hay error de constraint al eliminar, documenta que el puesto
está siendo usado por empleados (comportamiento esperado).
```

---

## Formato 5: Test de Regresión

```
Funcionalidad: Importación de Horas Extra - Test de Regresión

Contexto: Después de la actualización del módulo de importaciones,
verificar que todas las funcionalidades siguen operando correctamente.

Verificaciones:
1. ✅ Validación de formato Excel
   - Subir archivo con formato incorrecto
   - Debe mostrar error claro

2. ✅ Importación exitosa
   - Subir archivo válido: horas_extra_noviembre.xlsx
   - Debe mostrar resumen de importación
   - Verificar que los registros se crearon en no_desc_cred_nomina

3. ✅ Manejo de duplicados
   - Intentar importar el mismo archivo dos veces
   - Debe detectar duplicados y preguntar qué hacer

4. ✅ Feedback visual
   - Debe mostrar progress bar durante importación
   - Debe mostrar notificación de éxito/error
   - Debe actualizar el listado automáticamente

Datos de Prueba:
- Archivo: tests/data/horas_extra_test.xlsx
- Empleados en el archivo: 5
- Total de horas: 120
```

---

## Formato 6: Test de Validaciones

```
Funcionalidad: Validaciones de Formulario de Empleado

Objetivo: Verificar que todas las validaciones funcionan correctamente

Test Cases:

1. Campos Requeridos
   - Intenta guardar sin llenar campos obligatorios
   - Debe mostrar mensajes de error
   - Campos a probar: Cédula, Nombres, Apellidos, Salario, TSS

2. Formato de Cédula
   - Ingresa cédula con letras: ABC123
   - Ingresa cédula con menos de 11 dígitos: 123
   - Ingresa cédula válida: 00112345678
   - Solo la última debe ser aceptada

3. Validación de Salario
   - Ingresa salario negativo: -1000
   - Ingresa salario cero: 0
   - Ingresa salario válido: 25000
   - Solo el último debe ser aceptado

4. Validación de Email
   - Ingresa email inválido: "correo@"
   - Ingresa email válido: "empleado@empresa.com"

5. Fecha de Nacimiento
   - Ingresa fecha futura
   - Ingresa fecha que da edad < 18 años
   - Ingresa fecha válida
   - Solo la última debe ser aceptada

Resultado Esperado:
- Todas las validaciones deben funcionar
- Mensajes de error claros
- No se debe poder guardar con datos inválidos
```

---

## Formato 7: Test de Permisos

```
Funcionalidad: Control de Acceso por Nivel de Usuario

Setup:
1. Crear usuario de prueba con nivel = 5 (no admin)
2. Logout del usuario admin
3. Login con usuario de prueba

Tests:

1. Verificar acceso a módulos permitidos:
   ✅ Dashboard
   ✅ Empleados (solo lectura)
   ✅ Reportes

2. Verificar restricción a módulos de admin:
   ❌ Usuarios (no debe aparecer en menú)
   ❌ Configuración de ISR
   ❌ Cierre de Nómina

3. Verificar permisos de operación:
   ✅ Puede ver lista de empleados
   ❌ No puede editar empleados
   ❌ No puede eliminar empleados

Cleanup:
1. Logout del usuario de prueba
2. Login como admin
3. Eliminar usuario de prueba
```

---

## Formato 8: Test de Performance

```
Funcionalidad: Performance de Lista de Empleados con Paginación

Objetivo: Verificar que la paginación funciona correctamente
y que no hay problemas de rendimiento

Escenario: Base de datos con 11 empleados

Tests:

1. Carga Inicial
   - Navegar a Empleados
   - Medir tiempo de carga
   - Debe cargar en < 2 segundos

2. Paginación
   - Cambiar items por página a 5
   - Verificar que muestra "1-5 of 11"
   - Click en "Next page"
   - Verificar que muestra "6-10 of 11"
   - Click en "Next page" otra vez
   - Verificar que muestra "11-11 of 11"

3. Búsqueda
   - Escribir "DIMAS" en el buscador
   - Debe filtrar y mostrar solo empleados con ese nombre
   - Limpiar búsqueda
   - Debe volver a mostrar todos

4. Solicitudes de Red
   - Verificar que solo se hace una solicitud GET por página
   - No debe haber solicitudes innecesarias
   - Debe usar caché apropiadamente (304 Not Modified)

Métricas Esperadas:
- Carga inicial: < 2s
- Cambio de página: < 500ms
- Búsqueda: < 1s
- Solicitudes: Máximo 1 por acción
```

---

## Cómo Usar Estos Ejemplos

1. **Copia** el formato que mejor se ajuste a tu necesidad
2. **Modifica** los datos específicos de tu prueba
3. **Guarda** en un archivo .md (ej: `test_mi_funcionalidad.md`)
4. **Invoca** el agente referenciando el archivo:

```bash
"Usa el agente test-funcionalidad con las instrucciones en test_mi_funcionalidad.md"
```

O simplemente pega el contenido directamente en el chat.

---

## Tips

- ✅ Sé específico con los datos de prueba
- ✅ Incluye valores esperados cuando sea posible
- ✅ Menciona casos especiales o excepciones
- ✅ Define claramente el estado inicial y final
- ✅ Especifica qué debe verificarse en cada paso

- ❌ No uses instrucciones ambiguas como "prueba si funciona"
- ❌ No omitas información crítica como URLs o credenciales
- ❌ No asumas que el agente conoce el contexto previo

---

**Nota:** Estos son solo ejemplos. Puedes combinar elementos de diferentes
formatos para crear el test perfecto para tu caso de uso específico.
