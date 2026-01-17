# Plan de Implementación: Aplicación de Descuentos/Créditos por Quincena

## 1. Contexto y Objetivo

### Situación Actual
El sistema aplica todos los descuentos y créditos (`no_desc_cred`) en ambas quincenas del mes de manera automática.

### Comportamiento Esperado
Permitir especificar en qué quincena se aplica cada descuento/crédito con las siguientes opciones:
- **1**: Aplicar solo en la primera quincena
- **2**: Aplicar solo en la segunda quincena
- **0**: Aplicar en ambas quincenas (comportamiento actual por defecto)

### Impacto en Cuotas
Los descuentos con cuotas (campo `maneja_cuotas = 1`) deben ajustar su frecuencia según la configuración:
- Si se aplica en **ambas quincenas (0)**: Las cuotas se descuentan **quincenalmente**
- Si se aplica en **una sola quincena (1 o 2)**: Las cuotas se descuentan **mensualmente**

---

## 2. Análisis de Componentes Afectados

### 2.1 Base de Datos

**Tabla Principal: `no_desc_cred`**
- **Campo a agregar**: `quincena_aplicacion` (TINYINT, valores: 0, 1, 2, default: 0)
- **Ubicación**: Tabla de catálogo de descuentos/créditos
- **Migración requerida**: Sí

**Tablas Relacionadas:**
- `no_desc_cred_nomina`: No requiere modificación (usa el campo del catálogo)
- `no_cuotas`: Lógica de aplicación debe considerar la quincena
- `no_nominas`: Campo `quincena` indica si la nómina es de primera (1) o segunda (2) quincena
- `no_tipo_nomina`: Campo `periodo_pago` indica la frecuencia de pago (anual, mensual, quincenal, diario, hora)

### 2.2 Backend

**Archivos a Modificar:**

1. **`backend-ranger-nomina/models/noDescCredSequelizeModel.js`**
   - Agregar campo `quincena_aplicacion` al modelo Sequelize
   - Actualizar validaciones y defaults

2. **`backend-ranger-nomina/models/nominaModel.js`** (CRÍTICO)
   - **Método `recalcular()`**: Filtrar descuentos según quincena de la nómina
   - **Lógica de cuotas**: Ajustar frecuencia según `quincena_aplicacion`
   - **Queries de totales**: Considerar solo descuentos aplicables a la quincena actual

3. **`backend-ranger-nomina/models/cuotaModel.js`**
   - Método `obtenerCuotasPendientesPorFecha()`: Verificar `quincena_aplicacion`
   - Cálculo de fechas de cuotas debe considerar frecuencia (quincenal vs mensual)

4. **`backend-ranger-nomina/routes/noDescCred.js`**
   - Asegurar que el campo `quincena_aplicacion` se acepte en POST/PUT

### 2.3 Frontend

**Archivos a Modificar:**

1. **`rangernomina-frontend/src/app/no-desc-cred/no-desc-cred.service.ts`**
   - Interface `NoDescCred`: Agregar campo `quincena_aplicacion?: number`

2. **`rangernomina-frontend/src/app/no-desc-cred/no-desc-cred-form.component.ts`**
   - Agregar control en el formulario para `quincena_aplicacion`
   - Usar `mat-select` o `mat-radio-group` para selección

3. **`rangernomina-frontend/src/app/no-desc-cred/no-desc-cred-form.component.html`**
   - Agregar campo de selección con las opciones:
     - "Ambas quincenas (0)"
     - "Primera quincena (1)"
     - "Segunda quincena (2)"

4. **`rangernomina-frontend/src/app/no-desc-cred/no-desc-cred-list.component.ts`** (opcional)
   - Mostrar columna de "Quincena de Aplicación" en la lista

---

## 3. Plan de Implementación Detallado

### **FASE 1: Modificación de Base de Datos**

**Paso 1.1**: Crear migración SQL
```sql
ALTER TABLE no_desc_cred
ADD COLUMN quincena_aplicacion TINYINT DEFAULT 0
COMMENT '0=Ambas, 1=Primera, 2=Segunda';
```

**Paso 1.2**: Ejecutar migración en entorno de desarrollo

**Paso 1.3**: Actualizar datos existentes (opcional)
- Revisar si algún descuento actual debe tener configuración específica

---

### **FASE 2: Actualización del Backend**

**Paso 2.1**: Actualizar Modelo Sequelize
- Archivo: `backend-ranger-nomina/models/noDescCredSequelizeModel.js`
- Agregar definición del campo `quincena_aplicacion`
- Validar valores permitidos (0, 1, 2)

**Paso 2.2**: Modificar Lógica de Recálculo
- Archivo: `backend-ranger-nomina/models/nominaModel.js`
- En método `recalcular()`:
  1. Obtener la quincena de la nómina actual (campo `quincena` de `no_nominas`)
  2. Filtrar descuentos de `no_desc_cred_nomina` según:
     - `quincena_aplicacion = 0` → Siempre se aplica
     - `quincena_aplicacion = quincena` → Solo si coincide la quincena (1 o 2)
     - `quincena_aplicacion != quincena AND != 0` → NO se aplica
  3. Actualizar queries de totales para incluir el filtro

**Paso 2.3**: Ajustar Lógica de Cuotas
- Archivo: `backend-ranger-nomina/models/cuotaModel.js`
- Modificar `obtenerCuotasPendientesPorFecha()`:
  - Consultar `quincena_aplicacion` del `no_desc_cred` relacionado
  - Si `quincena_aplicacion = 1 o 2`: Retornar solo 1 cuota por mes
  - Si `quincena_aplicacion = 0`: Retornar hasta 2 cuotas por mes (quincenal)
- Actualizar cálculo de fechas de vencimiento de cuotas

**Paso 2.4**: Testing Backend
- Crear pruebas unitarias para:
  - Filtrado de descuentos por quincena
  - Cálculo de cuotas mensuales vs quincenales
  - Recálculo de nóminas con diferentes configuraciones

---

### **FASE 3: Actualización del Frontend**

**Paso 3.1**: Actualizar Interface TypeScript
- Archivo: `rangernomina-frontend/src/app/no-desc-cred/no-desc-cred.service.ts`
- Agregar `quincena_aplicacion?: number` a interface `NoDescCred`

**Paso 3.2**: Modificar Formulario
- Archivo: `no-desc-cred-form.component.ts`
  ```typescript
  quincena_aplicacion: [this.data?.quincena_aplicacion || 0]
  ```

- Archivo: `no-desc-cred-form.component.html`
  ```html
  <mat-form-field appearance="fill">
    <mat-label>Aplicar en Quincena</mat-label>
    <mat-select formControlName="quincena_aplicacion">
      <mat-option [value]="0">Ambas quincenas</mat-option>
      <mat-option [value]="1">Primera quincena</mat-option>
      <mat-option [value]="2">Segunda quincena</mat-option>
    </mat-select>
  </mat-form-field>
  ```

**Paso 3.3**: Actualizar Lista (opcional pero recomendado)
- Agregar columna "Quincena" en la tabla de `no-desc-cred-list.component.ts`
- Mostrar texto legible: "Ambas", "1ra", "2da"

**Paso 3.4**: Testing Frontend
- Verificar que el campo se guarda correctamente
- Validar que se muestra en modo edición
- Probar con nuevos registros y edición de existentes

---

### **FASE 4: Pruebas de Integración**

**Paso 4.1**: Crear Casos de Prueba
1. **Descuento en ambas quincenas (0)**:
   - Crear descuento con `quincena_aplicacion = 0`
   - Crear nómina de 1ra quincena → Debe aplicarse
   - Crear nómina de 2da quincena → Debe aplicarse

2. **Descuento solo en primera quincena (1)**:
   - Crear descuento con `quincena_aplicacion = 1`
   - Crear nómina de 1ra quincena → Debe aplicarse
   - Crear nómina de 2da quincena → NO debe aplicarse

3. **Descuento solo en segunda quincena (2)**:
   - Crear descuento con `quincena_aplicacion = 2`
   - Crear nómina de 1ra quincena → NO debe aplicarse
   - Crear nómina de 2da quincena → Debe aplicarse

4. **Préstamo con cuotas - Ambas quincenas (0)**:
   - Crear préstamo de RD$6,000 en 6 cuotas, `quincena_aplicacion = 0`
   - Verificar que se generan 6 cuotas quincenales de RD$1,000
   - Duración: 3 meses (6 quincenas)

5. **Préstamo con cuotas - Solo segunda quincena (2)**:
   - Crear préstamo de RD$6,000 en 6 cuotas, `quincena_aplicacion = 2`
   - Verificar que se generan 6 cuotas mensuales de RD$1,000
   - Duración: 6 meses (6 segundas quincenas)

**Paso 4.2**: Validar Cálculos
- Ejecutar recalculo de nóminas
- Verificar totales de ingresos/descuentos
- Comparar con cálculos manuales

**Paso 4.3**: Pruebas de Regresión
- Verificar que descuentos existentes (con `quincena_aplicacion = 0`) siguen funcionando igual
- Probar importación de Excel de horas extras
- Validar cierre de nómina

---

### **FASE 5: Documentación y Despliegue**

**Paso 5.1**: Actualizar Documentación
- Actualizar `CLAUDE.md` con el nuevo campo
- Documentar reglas de negocio para cuotas
- Crear guía de usuario para la configuración

**Paso 5.2**: Script de Migración
- Preparar script SQL para producción
- Incluir rollback plan

**Paso 5.3**: Despliegue
1. Respaldar base de datos
2. Ejecutar migración SQL
3. Desplegar backend
4. Desplegar frontend
5. Verificar funcionalidad en producción

---

## 4. Consideraciones Técnicas

### 4.1 Determinación de Quincena
La quincena de una nómina se determina mediante:
- Campo `quincena` de la tabla `no_nominas`
- Posibles valores: 1 (primera quincena) o 2 (segunda quincena)

### 4.2 Query de Filtrado en Recálculo
```javascript
// Pseudocódigo para nominaModel.js
const [[nominaInfo]] = await connection.query(
  `SELECT * FROM no_nominas WHERE id_nominas = ?`,
  [nominaId]
);

const quincenaActual = nominaInfo.quincena; // 1 o 2

// Al calcular totales de desc/cred:
const [totals] = await connection.query(
  `SELECT
    SUM(CASE WHEN ndc.origen = 'I' THEN ndcn.valor ELSE 0 END) as totalIngresos,
    SUM(CASE WHEN ndc.origen = 'D' THEN ndcn.valor ELSE 0 END) as totalDescuentos
   FROM no_desc_cred_nomina ndcn
   JOIN no_desc_cred ndc ON ndcn.id_desc_cred = ndc.id_desc_cred
   WHERE ndcn.id_nomina = ?
     AND (ndc.quincena_aplicacion = 0 OR ndc.quincena_aplicacion = ?)`,
  [nominaId, quincenaActual]
);
```

### 4.3 Lógica de Cuotas
```javascript
// Pseudocódigo para cuotaModel.js
async obtenerCuotasPendientesPorFecha(id_empleado, fecha_inicio, fecha_fin) {
  const [cuotas] = await connection.query(
    `SELECT c.*, dc.quincena_aplicacion, dc.descripcion
     FROM no_cuotas c
     JOIN no_desc_cred dc ON c.id_desc_cred = dc.id_desc_cred
     WHERE c.id_empleado = ?
       AND c.estado = 'pendiente'
       AND c.fecha_vencimiento BETWEEN ? AND ?
       AND (dc.quincena_aplicacion = 0 OR dc.quincena_aplicacion = ?)`,
    [id_empleado, fecha_inicio, fecha_fin, quincena_nomina]
  );

  // Filtrar para evitar duplicados si quincena_aplicacion = 1 o 2
  // Solo retornar 1 cuota por mes para esos casos
}
```

### 4.4 Validaciones
- Validar que `quincena_aplicacion` solo acepte valores 0, 1, 2
- Al crear cuotas, verificar coherencia con la configuración
- Alertar al usuario si cambia `quincena_aplicacion` de un descuento con cuotas activas

---

## 5. Riesgos y Mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Descuentos existentes dejan de aplicarse | Alto | Default `quincena_aplicacion = 0` mantiene comportamiento actual |
| Cuotas mal calculadas | Alto | Pruebas exhaustivas con diferentes escenarios |
| Pérdida de datos en migración | Crítico | Backup completo antes de migración |
| Inconsistencia en nóminas cerradas | Medio | No modificar nóminas cerradas, solo afecta nuevas |
| Usuario cambia quincena con cuotas activas | Medio | Agregar validación y advertencia en frontend |

---

## 6. Estimación de Esfuerzo

| Fase | Horas Estimadas | Prioridad |
|------|-----------------|-----------|
| FASE 1: Base de Datos | 1-2 horas | Alta |
| FASE 2: Backend | 8-12 horas | Alta |
| FASE 3: Frontend | 4-6 horas | Alta |
| FASE 4: Testing | 6-8 horas | Crítica |
| FASE 5: Documentación | 2-3 horas | Media |
| **TOTAL** | **21-31 horas** | |

---

## 7. Checklist de Implementación

### Base de Datos
- [ ] Crear script de migración SQL
- [ ] Ejecutar migración en desarrollo
- [ ] Verificar valores default en registros existentes

### Backend
- [ ] Actualizar `noDescCredSequelizeModel.js`
- [ ] Modificar `nominaModel.recalcular()` con filtro de quincena
- [ ] Ajustar `cuotaModel.obtenerCuotasPendientesPorFecha()`
- [ ] Actualizar queries de totales en `nominaModel.js`
- [ ] Escribir pruebas unitarias
- [ ] Validar en Postman/Thunder Client

### Frontend
- [ ] Actualizar interface `NoDescCred`
- [ ] Agregar campo en formulario
- [ ] Actualizar template HTML con `mat-select`
- [ ] Agregar columna en lista (opcional)
- [ ] Probar creación de registros
- [ ] Probar edición de registros

### Testing
- [ ] Ejecutar casos de prueba de integración
- [ ] Validar cálculos de nómina
- [ ] Probar cuotas quincenales vs mensuales
- [ ] Verificar regresión en funcionalidad existente

### Despliegue
- [ ] Backup de base de datos
- [ ] Ejecutar migración en producción
- [ ] Desplegar backend
- [ ] Desplegar frontend
- [ ] Verificar en producción

---

## 8. Próximos Pasos

1. **Revisar y aprobar este plan** con el equipo
2. **Discutir casos extremos** (ej: cambiar quincena_aplicacion con cuotas activas)
3. **Definir prioridad** de implementación
4. **Asignar tareas** a desarrolladores
5. **Establecer fecha de entrega**

---

**Fecha de creación**: 2025-10-07
**Autor**: Claude Code
**Versión**: 1.0
