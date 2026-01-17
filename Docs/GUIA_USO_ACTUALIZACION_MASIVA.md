# Guía de Uso: Actualización Masiva de Descuentos/Créditos Fijos

## 📋 Contexto

Esta guía explica cómo usar la nueva funcionalidad de **Actualización Masiva** que permite cambiar el valor de un descuento/crédito fijo para **todos los empleados** en una sola operación.

### ¿Qué son los Descuentos/Créditos Fijos?

Son conceptos marcados como "VALOR FIJO" (ver imagen `desc_cred_fijo.png`) que se asignan a los empleados en el mantenimiento individual. Ejemplos:
- Almuerzo
- Bono de Transporte
- Descuento de Préstamo
- Aporte a Cooperativa

**Problema Anterior:** Si 500 empleados tienen "Almuerzo" = RD$500 y se necesita cambiar a RD$750, había que actualizar uno por uno (500 veces).

**Solución Actual:** Un solo clic actualiza los 500 empleados.

---

## 🚀 Paso a Paso

### Paso 1: Acceder al Módulo

1. Iniciar sesión con usuario nivel 9 (administrador)
2. Navegar a: **Mantenimiento → Descuentos y Créditos**

### Paso 2: Identificar Conceptos Fijos

En la tabla, buscar los conceptos que tengan:
- Columna **"Fijo"** = Sí
- Estos mostrarán un botón adicional con ícono de actualización

```
┌─────────────┬────────┬──────┬──────────────┬──────────┐
│ Descripción │ Origen │ Fijo │ Tipo         │ Acciones │
├─────────────┼────────┼──────┼──────────────┼──────────┤
│ Almuerzo    │ D      │ Sí   │ Valor fijo   │ 🔄 ✏️ 🗑️ │
│ SFS         │ D      │ Sí   │ Porcentaje   │ 🔄 ✏️ 🗑️ │
│ Bono Extra  │ I      │ No   │ Valor fijo   │    ✏️ 🗑️ │
└─────────────┴────────┴──────┴──────────────┴──────────┘
```

### Paso 3: Abrir Actualización Masiva

1. Hacer clic en el botón de **actualización masiva** (🔄 ícono `update`)
2. Se abre un diálogo mostrando:

#### Sección 1: Información del Concepto
```
Concepto: Almuerzo
Tipo: Valor fijo
Valor definido: 500.00
```

#### Sección 2: Resumen de Empleados
```
👥 Total empleados: 523
✅ Activos: 480
❌ Inactivos: 43
```

#### Sección 3: Tabla de Empleados Afectados
```
┌──────────────────────────┬──────────────┬────────┐
│ Empleado                 │ Valor Actual │ Estado │
├──────────────────────────┼──────────────┼────────┤
│ DIMAS EDUARDO ARIAS      │ 500.00       │ Activo │
│ CARLOS JULIO SORIANO     │ 500.00       │ Activo │
│ DANY MERCEDES SARMIENTO  │ 500.00       │ Activo │
│ ...                      │ ...          │ ...    │
└──────────────────────────┴──────────────┴────────┘
```

### Paso 4: Configurar la Actualización

#### Campo "Nuevo Valor"
- Ingresar el valor que se aplicará a todos los empleados
- Ejemplo: `750.00` para aumentar de RD$500 a RD$750

#### Checkbox "Actualizar solo empleados activos"
- **✅ Marcado:** Solo actualiza empleados con status = Activo (480 empleados)
- **☐ No marcado:** Actualiza TODOS los empleados, activos e inactivos (523 empleados)

**Recomendación:** Marcar el checkbox si solo desea afectar empleados activos.

### Paso 5: Revisar y Confirmar

1. El botón mostrará: **"Actualizar X empleados"** donde X es el número calculado
2. Verificar que el número es correcto
3. Hacer clic en el botón

### Paso 6: Verificar Resultado

1. El sistema ejecuta la actualización (toma 1-2 segundos)
2. Aparece notificación verde:
   ```
   ✅ Actualización completada: 480 empleados actualizados exitosamente
   ```
3. El diálogo se cierra automáticamente
4. La tabla se recarga mostrando los cambios

---

## 🎯 Ejemplos Prácticos

### Ejemplo 1: Aumentar Almuerzo para Todos

**Situación:** Almuerzo aumenta de RD$500 a RD$750 para todos los empleados

**Pasos:**
1. Abrir actualización masiva para "Almuerzo"
2. Ingresar `750` en "Nuevo Valor"
3. **NO** marcar "Solo empleados activos"
4. Hacer clic en "Actualizar 523 empleados"
5. ✅ Todos actualizados (activos e inactivos)

**Resultado:**
- 523 empleados ahora tienen RD$750 en Almuerzo

---

### Ejemplo 2: Aumentar Bono de Transporte Solo para Activos

**Situación:** Incrementar bono de transporte solo para empleados que están trabajando

**Pasos:**
1. Abrir actualización masiva para "Bono de Transporte"
2. Ingresar `350` en "Nuevo Valor"
3. **SÍ** marcar "Solo empleados activos"
4. Hacer clic en "Actualizar 480 empleados"
5. ✅ Solo activos actualizados

**Resultado:**
- 480 empleados activos: RD$350
- 43 empleados inactivos: Mantienen valor anterior

---

### Ejemplo 3: Ajustar Descuento de Cooperativa

**Situación:** Reducir descuento de cooperativa de RD$1000 a RD$800

**Pasos:**
1. Abrir actualización masiva para "Aporte Cooperativa"
2. Ingresar `800` en "Nuevo Valor"
3. Marcar "Solo empleados activos"
4. Hacer clic en "Actualizar X empleados"
5. ✅ Actualizado

---

## ⚠️ Consideraciones Importantes

### Seguridad
- ✅ Solo usuarios **nivel 9** pueden ejecutar actualizaciones masivas
- ✅ El sistema valida que el concepto sea "fijo"
- ✅ Transacción SQL garantiza atomicidad (todo o nada)
- ✅ Si algo falla, se hace rollback automático

### Validaciones
- El nuevo valor debe ser numérico
- El nuevo valor debe ser >= 0
- No se pueden actualizar conceptos no fijos (aparece mensaje de error)
- No se pueden actualizar conceptos inexistentes

### Vista Previa
- **SIEMPRE** revise la tabla de empleados antes de confirmar
- Verifique el número de empleados que serán afectados
- Use el checkbox "Solo activos" cuando corresponda

### Reversión
- No hay "deshacer" automático
- Si cometió un error, debe ejecutar nueva actualización con el valor correcto
- Por eso es importante revisar antes de confirmar

---

## 🔍 Casos Especiales

### ¿Qué pasa si no hay empleados?

Si el concepto fijo no está asignado a ningún empleado:
```
ℹ️ No hay empleados con este concepto asignado
```
El botón de actualizar estará deshabilitado.

---

### ¿Qué pasa con empleados inactivos?

Depende del checkbox:
- **Marcado:** Se ignoran, mantienen su valor anterior
- **No marcado:** Se actualizan igual que los activos

---

### ¿Se puede cancelar durante la ejecución?

No. Una vez que hace clic en "Actualizar", la operación es inmediata (1-2 segundos).
La transacción garantiza que o se completan todos o ninguno.

---

## 📊 Verificación Post-Actualización

### Opción 1: Revisar en Mantenimiento de Empleado
1. Abrir cualquier empleado afectado
2. Ir a pestaña "Ingresos/Descuentos"
3. Verificar que el concepto tenga el nuevo valor

### Opción 2: Generar Reporte
1. Ir a **Reportes → Descuentos/Créditos**
2. Seleccionar el concepto
3. Verificar que todos tengan el nuevo valor

---

## 🆘 Solución de Problemas

### Problema: No veo el botón de actualización masiva

**Causas posibles:**
1. El concepto NO está marcado como "fijo"
   - **Solución:** Editar el concepto y marcar checkbox "Fijo"
2. Su usuario no tiene nivel 9
   - **Solución:** Contactar administrador para permisos

---

### Problema: El botón está deshabilitado

**Causas posibles:**
1. No hay empleados con ese concepto
   - **Solución:** Asignar el concepto a empleados primero
2. El formulario tiene errores
   - **Solución:** Verificar que ingresó un valor numérico válido

---

### Problema: Aparece error al actualizar

**Causas posibles:**
1. Concepto no es fijo
   - **Solución:** Solo funciona con conceptos fijos
2. Valor no es numérico
   - **Solución:** Ingresar solo números
3. Error de base de datos
   - **Solución:** Contactar soporte técnico

---

## 📞 Soporte

Si encuentra algún problema o tiene dudas:
- Contactar al administrador del sistema
- Revisar documentación técnica en `Docs/actualizacion_masiva_desc_cred.md`

---

## ✅ Checklist de Uso

Antes de ejecutar una actualización masiva:

- [ ] Verificar que el concepto es el correcto
- [ ] Revisar la lista de empleados afectados
- [ ] Verificar el número total a actualizar
- [ ] Decidir si incluir empleados inactivos
- [ ] Ingresar el nuevo valor correcto
- [ ] Revisar el resumen final antes de confirmar
- [ ] Hacer clic en "Actualizar"
- [ ] Verificar notificación de éxito
- [ ] (Opcional) Verificar en algunos empleados

---

**Última actualización:** 2025-01-20
**Versión de la funcionalidad:** 1.0
