# Actualización Masiva de Descuentos/Créditos Fijos

## Descripción

Esta funcionalidad permite actualizar el valor de un descuento/crédito fijo para **todos los empleados** que lo tengan asignado en una sola operación, resolviendo el problema de tener que actualizar manualmente cientos de registros individualmente.

## Problema Resuelto

**Situación previa:**
- Los descuentos/créditos fijos están asignados individualmente a cada empleado en la tabla `no_desc_cred_auto`
- Cuando el monto de un concepto fijo cambia (ej: de RD$500 a RD$750), era necesario actualizar uno por uno todos los empleados
- Con más de 500 empleados, esta tarea era extremadamente tediosa y propensa a errores

**Solución implementada:**
- Un solo clic permite actualizar todos los empleados a la vez
- Vista previa de empleados afectados antes de ejecutar la actualización
- Opción de actualizar solo empleados activos
- Transaccional y seguro con validaciones completas

## Estructura Técnica

### Backend

#### 1. Endpoint de Previsualización

**Ruta:** `GET /api/no_desc_cred/:id/preview-actualizacion-masiva`

**Descripción:** Muestra información del concepto y lista de empleados que serán afectados

**Respuesta:**
```json
{
  "concepto": {
    "id": 15,
    "descripcion": "prueba fijo",
    "tipo": "Valor fijo",
    "valor_definido": 500
  },
  "empleados_afectados": [
    {
      "item": 1,
      "id_empleado": 1,
      "valor_actual": "500.00",
      "nombre_completo": "DIMAS EDUARDO ARIAS WAGNER",
      "status": 1
    }
  ],
  "total_empleados": 3,
  "empleados_activos": 3,
  "empleados_inactivos": 0
}
```

#### 2. Endpoint de Actualización Masiva

**Ruta:** `PUT /api/no_desc_cred/:id/actualizar-masivo`

**Body:**
```json
{
  "nuevo_valor": 750.50,
  "solo_activos": true
}
```

**Validaciones:**
- Verifica que el concepto exista
- Verifica que el concepto sea marcado como "fijo"
- Valida que el nuevo valor sea numérico
- Usa transacciones para garantizar consistencia

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Actualización masiva completada exitosamente",
  "concepto": "prueba fijo",
  "empleados_actualizados": 3,
  "nuevo_valor": 750.5,
  "solo_activos": true,
  "detalles": [...]
}
```

#### Archivos Backend Modificados/Creados:
- `backend-ranger-nomina/routes/no_desc_cred.js` - Nuevos endpoints agregados

### Frontend

#### Componentes Creados:

1. **ActualizacionMasivaDialogComponent**
   - `rangernomina-frontend/src/app/no-desc-cred/actualizacion-masiva-dialog.component.ts`
   - `rangernomina-frontend/src/app/no-desc-cred/actualizacion-masiva-dialog.component.html`
   - `rangernomina-frontend/src/app/no-desc-cred/actualizacion-masiva-dialog.component.css`

#### Servicios Modificados:
- `rangernomina-frontend/src/app/no-desc-cred/no-desc-cred.service.ts`
  - `previewActualizacionMasiva(id: number)`
  - `ejecutarActualizacionMasiva(id: number, nuevoValor: number, soloActivos: boolean)`

#### Componentes Modificados:
- `rangernomina-frontend/src/app/no-desc-cred/no-desc-cred-list.component.ts`
  - Método `openActualizacionMasiva(noDescCred: NoDescCred)` agregado
  - Importación del nuevo componente de diálogo

- `rangernomina-frontend/src/app/no-desc-cred/no-desc-cred-list.component.html`
  - Botón de actualización masiva agregado a la columna de acciones
  - Solo visible para conceptos fijos y usuarios con nivel >= 9

## Flujo de Uso

### Paso 1: Acceder al Módulo
1. Navegar a **Mantenimiento de Descuentos y Créditos**
2. Los conceptos marcados como "Fijo" mostrarán un botón adicional con ícono de actualización

### Paso 2: Abrir Diálogo de Actualización Masiva
1. Hacer clic en el botón de actualización masiva (ícono `update`)
2. Se abre un diálogo mostrando:
   - Información del concepto (nombre, tipo, valor definido)
   - Resumen de empleados afectados (total, activos, inactivos)
   - Tabla con lista completa de empleados y sus valores actuales

### Paso 3: Configurar Actualización
1. Ingresar el **nuevo valor** a aplicar
2. (Opcional) Marcar checkbox **"Actualizar solo empleados activos"**
   - Si está marcado: solo actualiza empleados con status = 1
   - Si NO está marcado: actualiza todos (activos e inactivos)

### Paso 4: Ejecutar Actualización
1. Revisar el resumen que indica cuántos empleados serán actualizados
2. Hacer clic en el botón "Actualizar X empleados"
3. El sistema ejecuta la actualización en una transacción
4. Muestra notificación de éxito con número de empleados actualizados

## Seguridad y Permisos

### Restricciones de Acceso:
- Solo usuarios con **nivel 9** pueden ejecutar actualizaciones masivas
- El botón es visible solo para usuarios autorizados
- Backend valida permisos en cada request

### Validaciones:
- Solo conceptos marcados como "fijo" pueden ser actualizados masivamente
- El nuevo valor debe ser numérico y mayor o igual a 0
- Uso de transacciones para garantizar atomicidad

## Casos de Uso

### Caso 1: Actualizar Todos los Empleados
**Escenario:** El concepto "Bono de Alimentación" aumenta de RD$500 a RD$750 para todos

**Pasos:**
1. Abrir actualización masiva para "Bono de Alimentación"
2. Ingresar 750 como nuevo valor
3. Desmarcar "Solo empleados activos"
4. Confirmar actualización
5. Resultado: Todos los empleados (activos e inactivos) ahora tienen RD$750

### Caso 2: Actualizar Solo Empleados Activos
**Escenario:** Aumentar "Bono de Transporte" solo para empleados activos

**Pasos:**
1. Abrir actualización masiva para "Bono de Transporte"
2. Ingresar nuevo valor
3. Marcar "Solo empleados activos"
4. Confirmar actualización
5. Resultado: Solo empleados activos tienen el nuevo valor; inactivos mantienen el anterior

## Características Técnicas

### Transaccionalidad:
- Todas las actualizaciones se ejecutan dentro de una transacción MySQL
- Si algo falla, se hace rollback automático
- Garantiza consistencia de datos

### Performance:
- Una sola query UPDATE actualiza todos los registros
- Mucho más rápido que actualizar uno por uno
- Escalable a miles de empleados

### Auditoría:
- El backend retorna lista completa de empleados actualizados
- Logs en consola del servidor para trazabilidad
- Notificaciones en frontend con resumen de la operación

## Testing

### Tests Ejecutados:

#### Backend:
✅ Preview de actualización masiva para concepto con empleados
✅ Preview de actualización masiva para concepto sin empleados
✅ Actualización masiva exitosa (3 empleados actualizados)
✅ Validación de concepto no fijo (rechazado correctamente)
✅ Validación de valores en base de datos post-actualización

#### Frontend:
✅ Build de producción exitoso sin errores
✅ Componente de diálogo carga correctamente
✅ Validación de formulario funciona

## Datos de Ejemplo

### Antes de la Actualización:
```
Empleado 1: RD$500.00
Empleado 2: RD$500.00
Empleado 3: RD$500.00
```

### Después de Actualizar a RD$750.50:
```
Empleado 1: RD$750.50
Empleado 2: RD$750.50
Empleado 3: RD$750.50
```

## Roadmap Futuro

### Mejoras Potenciales:

1. **Historial de Cambios**
   - Registrar en tabla de auditoría cada actualización masiva
   - Mostrar quién hizo el cambio, cuándo, y valores anteriores

2. **Actualización Selectiva por Filtros**
   - Filtrar por departamento
   - Filtrar por tipo de nómina
   - Filtrar por rango salarial

3. **Actualización Programada**
   - Programar actualizaciones para fechas futuras
   - Aplicar incrementos automáticos mensuales/anuales

4. **Exportar Reporte**
   - Generar PDF/Excel con lista de empleados afectados
   - Antes y después de la actualización

## Conclusión

Esta funcionalidad reduce de **horas a segundos** el tiempo necesario para actualizar descuentos/créditos fijos para cientos de empleados, eliminando el error humano y mejorando significativamente la eficiencia operativa del sistema de nómina.

---

**Fecha de Implementación:** 2025-01-20
**Versión:** 1.0
**Desarrollado por:** Claude Code
