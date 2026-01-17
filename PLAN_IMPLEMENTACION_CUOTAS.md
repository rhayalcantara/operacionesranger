# Plan de Implementación: Sistema de Ingresos y Descuentos con Cuotas

## Objetivo
Implementar un sistema que permita distribuir ingresos o descuentos a empleados en múltiples quincenas (cuotas), como préstamos, adelantos, o bonificaciones diferidas.

## Análisis de Requerimientos

### Funcionalidad Principal
- Crear un ingreso o descuento que se distribuya automáticamente en N quincenas
- El monto total se divide equitativamente entre las quincenas
- El sistema debe aplicar automáticamente las cuotas en cada nómina correspondiente

### Ejemplo de Caso de Uso
**Préstamo de RD$6,000 a 6 quincenas:**
- Monto total: RD$6,000
- Cuotas: 6 quincenas
- Monto por quincena: RD$1,000
- Se genera automáticamente un descuento de RD$1,000 en cada una de las próximas 6 nóminas del empleado

## Arquitectura de Datos

### Opción A: Nueva Tabla `no_cuotas` (Recomendada)

**Tabla: `no_cuotas`**
```sql
CREATE TABLE no_cuotas (
  id_cuota INT AUTO_INCREMENT PRIMARY KEY,
  id_empleado INT NOT NULL,
  id_tipo_desc_cred INT NOT NULL,
  descripcion VARCHAR(255),
  monto_total DECIMAL(10,2) NOT NULL,
  cantidad_cuotas INT NOT NULL,
  monto_por_cuota DECIMAL(10,2) NOT NULL,
  cuotas_aplicadas INT DEFAULT 0,
  fecha_inicio DATE NOT NULL,
  estado ENUM('activo', 'completado', 'cancelado') DEFAULT 'activo',
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  usuario_creacion INT,
  FOREIGN KEY (id_empleado) REFERENCES rh_empleado(id_empleado),
  FOREIGN KEY (id_tipo_desc_cred) REFERENCES rh_tipo_desc_cred(id_tipo_desc_cred)
);
```

**Tabla: `no_cuotas_detalle`**
```sql
CREATE TABLE no_cuotas_detalle (
  id_cuota_detalle INT AUTO_INCREMENT PRIMARY KEY,
  id_cuota INT NOT NULL,
  numero_cuota INT NOT NULL,
  id_nomina INT,
  id_desc_cred_nomina INT,
  monto DECIMAL(10,2) NOT NULL,
  fecha_esperada_aplicacion DATE NOT NULL,  -- Fecha estimada para aplicar esta cuota
  fecha_aplicacion DATE,                      -- Fecha real cuando se aplicó
  estado ENUM('pendiente', 'aplicado', 'omitido') DEFAULT 'pendiente',
  FOREIGN KEY (id_cuota) REFERENCES no_cuotas(id_cuota),
  FOREIGN KEY (id_nomina) REFERENCES no_nominas(id_nomina),
  FOREIGN KEY (id_desc_cred_nomina) REFERENCES no_desc_cred_nomina(id_desc_cred_nomina)
);
```

**Campo clave:** `fecha_esperada_aplicacion` permite que el sistema sepa CUÁNDO debe aplicar cada cuota, incluso si la nómina aún no existe.

**Ventajas:**
- Trazabilidad completa de cada cuota
- Permite pausar, reanudar o cancelar cuotas
- Historial detallado de aplicaciones
- No afecta la estructura actual de `no_desc_cred_nomina`

**Desventajas:**
- Requiere crear nuevas tablas
- Mayor complejidad en el modelo

### Opción B: Extensión de `no_desc_cred_nomina` (Más Simple)

**Modificación a `no_desc_cred_nomina`:**
```sql
ALTER TABLE no_desc_cred_nomina
  ADD COLUMN id_cuota_padre INT,
  ADD COLUMN es_cuota BOOLEAN DEFAULT FALSE,
  ADD COLUMN numero_cuota INT,
  ADD COLUMN total_cuotas INT,
  ADD COLUMN monto_total_cuota DECIMAL(10,2);
```

**Ventajas:**
- No requiere nuevas tablas
- Implementación más rápida
- Usa la estructura existente

**Desventajas:**
- Menos control sobre el estado de las cuotas
- Dificulta la gestión centralizada de cuotas pendientes

## Recomendación: **Opción A** (Nueva Tabla)

Permite mejor control, trazabilidad y escalabilidad del sistema.

## Flujo de Proceso

### 1. Creación de Cuota

```
Usuario → Formulario "Nuevo Ingreso/Descuento con Cuotas"
  ↓
Selecciona:
  - Empleado
  - Tipo de ingreso/descuento (rh_tipo_desc_cred)
  - Descripción (ej: "Préstamo personal")
  - Monto total
  - Cantidad de cuotas
  - Fecha de inicio (primera quincena donde se aplicará, ej: 2025-02-15)
  ↓
Sistema calcula:
  - monto_por_cuota = monto_total / cantidad_cuotas
  - fecha_esperada_aplicacion para cada cuota:
      * Cuota 1: fecha_inicio
      * Cuota 2: fecha_inicio + 15 días
      * Cuota 3: fecha_inicio + 30 días
      * ... (incrementando 15 días por quincena)
  ↓
Crea registro en no_cuotas
  ↓
Genera registros en no_cuotas_detalle (uno por cada cuota)
  - numero_cuota: 1, 2, 3, ..., N
  - estado: 'pendiente'
  - monto: monto_por_cuota
  - fecha_esperada_aplicacion: calculada según la quincena
```

**Importante:** Las cuotas se crean con fechas futuras, NO requieren que existan nóminas.

### 2. Aplicación Automática en Nómina

**Proceso al generar/recalcular nómina:**

```
Al crear/recalcular nómina:
  ↓
Obtener fecha_desde y fecha_hasta de la nómina
  ↓
Para cada empleado en la nómina:
  ↓
  Buscar cuotas del empleado donde:
    - no_cuotas.estado = 'activo'
    - no_cuotas.id_empleado = empleado actual
  ↓
  Para cada cuota activa:
    ↓
    Buscar cuotas_detalle pendientes que correspondan a esta nómina:
      - no_cuotas_detalle.estado = 'pendiente'
      - no_cuotas_detalle.fecha_esperada_aplicacion BETWEEN fecha_desde AND fecha_hasta
    ↓
    Para cada cuota_detalle que corresponda:
      ↓
      - Crear/Actualizar registro en no_desc_cred_nomina
      - Actualizar no_cuotas_detalle:
          * id_nomina = ID de nómina actual
          * id_desc_cred_nomina = ID del registro creado/actualizado
          * estado = 'aplicado'
          * fecha_aplicacion = fecha actual
      - Incrementar no_cuotas.cuotas_aplicadas += 1
      - Si cuotas_aplicadas == cantidad_cuotas:
          * Cambiar no_cuotas.estado = 'completado'
  ↓
Continuar con cálculo normal de nómina (TSS, ISR, etc.)
```

**Puntos clave:**
- Las cuotas se aplican **según su fecha_esperada_aplicacion**, NO según el orden de creación de nóminas
- Permite crear nóminas en cualquier orden (ej: crear nómina de marzo antes que la de febrero)
- Si una nómina abarca múltiples quincenas, se aplicarán todas las cuotas correspondientes
- Si no hay cuotas que correspondan a las fechas de la nómina, no se aplica nada

#### Ejemplo Práctico: Cuotas para Nóminas Futuras

**Escenario:**
- Hoy: 5 de febrero de 2025
- Usuario crea préstamo de RD$6,000 a 6 quincenas
- Fecha inicio: 15 de febrero de 2025

**Cuotas generadas:**
| # | Monto | Fecha Esperada | Estado | Nómina |
|---|-------|----------------|--------|--------|
| 1 | RD$1,000 | 2025-02-15 | Pendiente | - |
| 2 | RD$1,000 | 2025-03-01 | Pendiente | - |
| 3 | RD$1,000 | 2025-03-15 | Pendiente | - |
| 4 | RD$1,000 | 2025-04-01 | Pendiente | - |
| 5 | RD$1,000 | 2025-04-15 | Pendiente | - |
| 6 | RD$1,000 | 2025-05-01 | Pendiente | - |

**Caso 1: Crear nómina de febrero (15-28)**
```
Al recalcular nómina:
  - fecha_desde: 2025-02-15
  - fecha_hasta: 2025-02-28
  - Busca cuotas pendientes con fecha_esperada BETWEEN '2025-02-15' AND '2025-02-28'
  - Encuentra cuota #1 (fecha: 2025-02-15)
  - La aplica automáticamente
  - Cuota #1 → Estado: 'aplicado', id_nomina: asignado
```

**Caso 2: Usuario NO crea nómina de marzo, pero crea la de abril**
```
Al recalcular nómina de abril:
  - fecha_desde: 2025-04-01
  - fecha_hasta: 2025-04-15
  - Busca cuotas pendientes en ese rango
  - Encuentra cuota #4 (fecha: 2025-04-01) y cuota #5 (fecha: 2025-04-15)
  - Las aplica automáticamente
  - Cuotas #2 y #3 (de marzo) siguen pendientes
```

**Caso 3: Posteriormente crea nómina de marzo**
```
Al recalcular nómina de marzo:
  - fecha_desde: 2025-03-01
  - fecha_hasta: 2025-03-15
  - Busca cuotas pendientes (estado = 'pendiente')
  - Encuentra cuota #2 (fecha: 2025-03-01) y cuota #3 (fecha: 2025-03-15)
  - Las aplica automáticamente
  - Ahora todas las cuotas de marzo están aplicadas
```

**Ventajas de este enfoque:**
✅ No importa el orden de creación de nóminas
✅ Cuotas futuras esperan pacientemente a su nómina correspondiente
✅ Si saltas una nómina, las cuotas de ese periodo siguen pendientes
✅ Puedes crear nóminas retroactivas y las cuotas se aplicarán correctamente

### 3. Consulta y Gestión

#### A. Ver Estado de Cuotas de un Empleado

**Consulta SQL para obtener resumen:**
```sql
SELECT
  c.id_cuota,
  c.descripcion,
  tdc.descripcion as tipo,
  c.monto_total,
  c.cantidad_cuotas,
  c.cuotas_aplicadas,
  (c.cantidad_cuotas - c.cuotas_aplicadas) as cuotas_pendientes,
  c.monto_por_cuota,
  (c.cantidad_cuotas - c.cuotas_aplicadas) * c.monto_por_cuota as monto_pendiente,
  c.estado,
  c.fecha_inicio
FROM no_cuotas c
JOIN rh_tipo_desc_cred tdc ON c.id_tipo_desc_cred = tdc.id_tipo_desc_cred
WHERE c.id_empleado = ?
  AND c.estado IN ('activo', 'completado')
ORDER BY c.fecha_creacion DESC
```

**Resultado esperado:**
| Descripción | Tipo | Total | Cuotas | Aplicadas | Pendientes | Monto Pendiente | Estado |
|-------------|------|-------|--------|-----------|------------|-----------------|--------|
| Préstamo personal | Descuento | RD$6,000 | 6 | 2 | 4 | RD$4,000 | Activo |
| Bono anual | Ingreso | RD$3,000 | 3 | 3 | 0 | RD$0 | Completado |

#### B. Ver Detalle de Cuotas (Aplicadas y Pendientes)

**Consulta SQL para historial completo:**
```sql
SELECT
  cd.numero_cuota,
  cd.monto,
  cd.fecha_esperada_aplicacion,
  cd.fecha_aplicacion,
  cd.estado,
  n.id_nomina,
  n.descripcion as nomina_descripcion,
  n.fecha_desde,
  n.fecha_hasta,
  n.estado as nomina_estado,
  dcn.id_desc_cred_nomina
FROM no_cuotas_detalle cd
LEFT JOIN no_nominas n ON cd.id_nomina = n.id_nomina
LEFT JOIN no_desc_cred_nomina dcn ON cd.id_desc_cred_nomina = dcn.id_desc_cred_nomina
WHERE cd.id_cuota = ?
ORDER BY cd.numero_cuota
```

**Resultado esperado:**
| Cuota | Monto | Fecha Esperada | Fecha Aplicación | Estado | Nómina | Estado Nómina |
|-------|-------|----------------|------------------|--------|--------|---------------|
| 1/6 | RD$1,000 | 2025-02-15 | 2025-02-20 | Aplicado | QNA-2025-02-A | Cerrado |
| 2/6 | RD$1,000 | 2025-03-01 | 2025-03-05 | Aplicado | QNA-2025-03-A | Abierto |
| 3/6 | RD$1,000 | 2025-03-15 | - | Pendiente | - | - |
| 4/6 | RD$1,000 | 2025-04-01 | - | Pendiente | - | - |
| 5/6 | RD$1,000 | 2025-04-15 | - | Pendiente | - | - |
| 6/6 | RD$1,000 | 2025-05-01 | - | Pendiente | - | - |

#### C. Ver Relación Cuota → Nómina

Desde el detalle de cuota (tabla anterior), puedes:
- **Ver en qué nómina se aplicó cada cuota** (columna "Nómina")
- **Click en ID de nómina** → Ir a detalle de esa nómina
- **Ver registro en `no_desc_cred_nomina`** usando `id_desc_cred_nomina`

#### D. Mover Cuota a Otra Nómina

**Requisitos:**
- Solo si nómina origen NO está cerrada
- Solo cuotas ya aplicadas (estado = 'aplicado')

**Proceso:**
1. Usuario hace click en "Mover" en la fila de cuota aplicada
2. Se abre diálogo para seleccionar nómina destino
3. Backend:
   - Elimina registro de `no_desc_cred_nomina` de nómina origen
   - Crea nuevo registro en `no_desc_cred_nomina` de nómina destino
   - Actualiza `no_cuotas_detalle.id_nomina`
4. Se recalcula ambas nóminas

**Endpoint:**
```javascript
PUT /api/cuotas/detalle/:id_cuota_detalle/mover
Body: { id_nomina_destino: 123 }
```

#### E. Cuotas Sin Procesar (Pendientes por Nómina)

**Consulta para saber qué cuotas están pendientes y para qué fecha:**
```sql
SELECT
  cd.id_cuota_detalle,
  cd.numero_cuota,
  cd.monto,
  cd.fecha_esperada_aplicacion,
  c.descripcion,
  e.nombre,
  e.apellido,
  tdc.descripcion as tipo
FROM no_cuotas_detalle cd
JOIN no_cuotas c ON cd.id_cuota = c.id_cuota
JOIN rh_empleado e ON c.id_empleado = e.id_empleado
JOIN rh_tipo_desc_cred tdc ON c.id_tipo_desc_cred = tdc.id_tipo_desc_cred
WHERE cd.estado = 'pendiente'
  AND c.estado = 'activo'
  AND cd.fecha_esperada_aplicacion <= CURDATE()  -- Cuotas vencidas o actuales
ORDER BY cd.fecha_esperada_aplicacion ASC
```

**Resultado esperado (cuotas que ya deberían haberse aplicado):**
| Empleado | Descripción | Cuota | Monto | Fecha Esperada | Días Vencidos |
|----------|-------------|-------|-------|----------------|---------------|
| Juan Pérez | Préstamo | 2/6 | RD$1,000 | 2025-03-01 | 15 |
| María García | Adelanto | 1/3 | RD$500 | 2025-03-10 | 6 |

Esta consulta es útil para:
- Dashboard de alertas
- Recordatorio para crear nóminas faltantes
- Validación de que todas las cuotas se están aplicando correctamente

## Componentes a Desarrollar

### Backend

#### Modelos
1. **`models/cuotaModel.js`**
   - `crear(datosCuota)` - Crea cuota y genera todas las cuotas_detalle con fechas calculadas
   - `listarPorEmpleado(id_empleado)` - Cuotas de un empleado
   - `listarActivas()` - Todas las cuotas activas
   - `obtenerCuotasPendientesPorFecha(id_empleado, fecha_desde, fecha_hasta)` - **Método clave:** Obtiene cuotas que corresponden al rango de fechas de una nómina
   - `aplicarCuotaEnNomina(id_cuota_detalle, id_nomina, id_desc_cred_nomina)` - Marca cuota como aplicada
   - `cancelar(id_cuota)` - Cancela cuotas pendientes
   - `obtenerDetalle(id_cuota)` - Detalle completo con historial
   - `moverCuota(id_cuota_detalle, id_nomina_destino)` - Permite reasignar cuota a otra nómina

#### Rutas
2. **`routes/cuotaRoutes.js`**
   ```javascript
   POST   /api/cuotas                    // Crear nueva cuota
   GET    /api/cuotas                    // Listar todas
   GET    /api/cuotas/empleado/:id       // Cuotas de un empleado
   GET    /api/cuotas/:id                // Detalle de cuota
   PUT    /api/cuotas/:id/cancelar       // Cancelar cuota
   GET    /api/cuotas/activas            // Cuotas activas
   ```

#### Modificaciones
3. **`models/nominaModel.js`**
   - Modificar método `recalcular()` para integrar aplicación de cuotas
   - Agregar método `_aplicarCuotasAutomaticas(id_nomina, fecha_desde, fecha_hasta)`
   - Flujo:
     ```javascript
     async recalcular(id_nomina) {
       // 1. Obtener datos de la nómina (fecha_desde, fecha_hasta)
       // 2. Para cada empleado en no_det_nomina:
       //    - Llamar a cuotaModel.obtenerCuotasPendientesPorFecha(id_empleado, fecha_desde, fecha_hasta)
       //    - Para cada cuota pendiente encontrada:
       //        * Crear/actualizar registro en no_desc_cred_nomina
       //        * Llamar a cuotaModel.aplicarCuotaEnNomina(id_cuota_detalle, id_nomina, id_desc_cred_nomina)
       // 3. Continuar con cálculo normal (TSS, ISR, etc.)
     }
     ```

### Frontend

#### Componentes
1. **`cuotas/cuotas.component.ts`**
   - Listado de cuotas (tabla con filtros)
   - Acciones: Ver detalle, Cancelar
   - Indicadores: Progreso de cuotas (ej: 3/6 aplicadas)

2. **`cuotas/cuota-form-dialog.component.ts`**
   - Formulario de creación
   - Campos:
     * Empleado (autocomplete)
     * Tipo ingreso/descuento (select)
     * Descripción
     * Monto total
     * Cantidad de cuotas
     * Fecha inicio (opcional, default: próxima nómina)
   - Validaciones:
     * Monto > 0
     * Cuotas >= 1
     * Tipo seleccionado válido

3. **`cuotas/cuota-detalle-dialog.component.ts`**
   - Información general de la cuota
   - Tabla de detalle (cuotas aplicadas y pendientes)
   - Gráfico de progreso (opcional)

#### Servicios
4. **`services/cuota.service.ts`**
   - Métodos HTTP para todas las operaciones CRUD
   - Integración con `NotificationService`

#### Rutas
5. **`app-routing.module.ts`**
   - Agregar ruta `/cuotas`

6. **`navmenu.component.ts`**
   - Agregar opción "Cuotas" en menú de Nómina

### Interfaz

#### Modelo TypeScript
```typescript
export interface Cuota {
  id_cuota?: number;
  id_empleado: number;
  id_tipo_desc_cred: number;
  descripcion: string;
  monto_total: number;
  cantidad_cuotas: number;
  monto_por_cuota: number;
  cuotas_aplicadas: number;
  fecha_inicio: Date;
  estado: 'activo' | 'completado' | 'cancelado';
  fecha_creacion?: Date;
  usuario_creacion?: number;

  // Relaciones (para vistas expandidas)
  empleado?: {
    nombre: string;
    apellido: string;
    cedula: string;
  };
  tipo?: {
    descripcion: string;
    tipo: 'ingreso' | 'descuento';
  };
  detalle?: CuotaDetalle[];
}

export interface CuotaDetalle {
  id_cuota_detalle?: number;
  id_cuota: number;
  numero_cuota: number;
  id_nomina?: number;
  id_desc_cred_nomina?: number;
  monto: number;
  fecha_esperada_aplicacion: Date;  // Fecha programada para esta cuota
  fecha_aplicacion?: Date;           // Fecha real de aplicación
  estado: 'pendiente' | 'aplicado' | 'omitido';

  // Relaciones
  nomina?: {
    descripcion: string;
    fecha_desde: Date;
    fecha_hasta: Date;
  };
}
```

## Validaciones y Reglas de Negocio

1. **Validación de monto:**
   - Monto total > 0
   - Monto por cuota = monto_total / cantidad_cuotas (puede tener decimales)

2. **Validación de cuotas:**
   - Cantidad de cuotas >= 1
   - No permitir cantidad de cuotas excesiva (ej: máximo 24 quincenas = 1 año)

3. **Estado de cuotas:**
   - Una cuota solo puede cancelarse si tiene cuotas pendientes
   - Al cancelar, cambiar estado de cuotas_detalle pendientes a 'cancelado'

4. **Aplicación en nómina cerrada:**
   - Si una nómina se cierra, la cuota aplicada queda registrada
   - Si se reabre la nómina, se debe permitir "desaplicar" la cuota

5. **Omisión de cuotas:**
   - ¿Qué pasa si se crea una nómina sin incluir a un empleado con cuotas pendientes?
   - Opción A: No aplicar, esperar a próxima nómina
   - Opción B: Marcar como "omitida" y aplicar doble en siguiente
   - **Recomendación:** Opción A (más simple)

6. **Empleados inactivos:**
   - Si un empleado con cuotas activas se inactiva, mostrar advertencia
   - Opción de cancelar cuotas pendientes automáticamente

## Fases de Implementación

### Fase 1: Base de Datos y Modelo Backend
- [ ] Crear tablas `no_cuotas` y `no_cuotas_detalle`
- [ ] Crear `models/cuotaModel.js` con métodos básicos
- [ ] Crear `routes/cuotaRoutes.js`
- [ ] Probar endpoints con Postman/Thunder Client

### Fase 2: Integración con Nómina
- [ ] Modificar `nominaModel.js` para aplicar cuotas automáticamente
- [ ] Probar creación de nómina con empleados que tienen cuotas
- [ ] Validar cálculos de descuentos/ingresos

### Fase 3: Frontend - Gestión de Cuotas
- [ ] Crear `cuota.service.ts`
- [ ] Crear interfaces TypeScript
- [ ] Crear `cuotas.component.ts` (listado)
- [ ] Crear `cuota-form-dialog.component.ts` (formulario)
- [ ] Agregar a menú de navegación

### Fase 4: Frontend - Visualización y Detalle
- [ ] Crear `cuota-detalle-dialog.component.ts`
- [ ] Agregar indicadores visuales (progreso de cuotas)
- [ ] Implementar cancelación de cuotas
- [ ] Agregar filtros y búsqueda en listado

### Fase 5: Mejoras y Reportes
- [ ] Dashboard de cuotas pendientes
- [ ] Reporte de proyección de descuentos por empleado
- [ ] Exportar a Excel/PDF
- [ ] Notificaciones cuando una cuota se completa

## Consideraciones Adicionales

### Rendimiento
- Si hay muchos empleados con cuotas, el proceso de generación de nómina podría ser lento
- Optimizar consultas SQL con índices adecuados
- Considerar procesamiento en lote

### Auditabilidad
- Registrar quién creó cada cuota (`usuario_creacion`)
- Registrar fecha de creación
- Log de cancelaciones

### Redondeo de Montos
- Si monto_total / cantidad_cuotas tiene decimales, ajustar última cuota para que sume exacto
- Ejemplo: RD$1,000 / 3 = RD$333.33, RD$333.33, RD$333.34

### Permisos
- Considerar si solo usuarios nivel 9 pueden crear cuotas
- O permitir a supervisores crear cuotas para sus empleados

## Riesgos y Mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Cuotas aplicadas incorrectamente | Alto | Validación exhaustiva en backend, tests unitarios |
| Nómina cerrada con cuota mal aplicada | Alto | Proceso de revisión antes de cierre, opción de "desaplicar" |
| Rendimiento en nóminas grandes | Medio | Índices en BD, procesamiento eficiente |
| Usuario cancela cuota por error | Bajo | Confirmación antes de cancelar, registro de auditoría |

## Preguntas Abiertas para Discusión

1. **¿Se permite editar una cuota una vez creada?** (ej: cambiar monto, cantidad de cuotas)
   - Recomendación: NO, solo cancelar y crear nueva

2. **¿Qué pasa si un empleado tiene múltiples cuotas activas?**
   - Se aplican todas en la misma nómina

3. **¿Se permite aplicar cuotas manualmente en lugar de automático?**
   - Opción avanzada: Checkbox "Aplicar manualmente" en creación de cuota

4. **¿Fecha de inicio es obligatoria o automática?**
   - Recomendación: Opcional, default = próxima nómina a crear

5. **¿Se valida que el empleado tenga suficiente salario para el descuento?**
   - Validación de salario neto >= salario mínimo después de descuentos
   - Mostrar advertencia si cuota es muy alta

6. **¿Se permiten cuotas con diferentes montos por quincena?**
   - Versión 1: NO (monto equitativo)
   - Versión futura: Permitir personalizar cada cuota

7. **¿Integración con sistema contable/financiero?**
   - Considerar para futuras fases

## Resumen: Respuestas a Tus Preguntas

### 1. ¿Dónde ver cuántos desc_cred en cuotas tiene un empleado?

**Ubicación en UI:**
- Módulo de Cuotas → Filtrar por empleado
- Perfil del empleado → Pestaña "Cuotas" (nuevo)

**Consulta SQL:** Ver sección 3.A (línea 235)

### 2. ¿Cuántas cuotas sin procesar tiene un empleado?

**Consulta SQL:**
```sql
SELECT COUNT(*) as cuotas_pendientes
FROM no_cuotas_detalle cd
JOIN no_cuotas c ON cd.id_cuota = c.id_cuota
WHERE c.id_empleado = ?
  AND cd.estado = 'pendiente'
  AND c.estado = 'activo'
```

### 3. ¿Cómo ver relación desc_cred ↔ nómina?

**Método:**
- Tabla `no_cuotas_detalle` contiene `id_nomina` y `id_desc_cred_nomina`
- Ver sección 3.B para consulta completa (línea 265)

### 4. ¿Es posible cambiar cuota a otra nómina?

**Respuesta:** SÍ, pero solo si nómina origen NO está cerrada

**Método:**
- Endpoint: `PUT /api/cuotas/detalle/:id/mover`
- Ver sección 3.D para detalles (línea 302)

### 5. ¿Cuotas se aplican aunque nómina no exista?

**Respuesta:** SÍ, el sistema está diseñado para esto

**Funcionamiento:**
- Las cuotas se crean con `fecha_esperada_aplicacion`
- Al recalcular CUALQUIER nómina, el sistema busca cuotas pendientes cuya `fecha_esperada_aplicacion` esté dentro del rango de fechas de esa nómina
- **No importa el orden** de creación de nóminas
- Ver sección 2 "Ejemplo Práctico" (línea 175) para casos de uso completos

**Ventajas:**
✅ Crear cuotas para nóminas futuras que aún no existen
✅ Crear nóminas en cualquier orden (marzo antes que febrero)
✅ Cuotas se aplican automáticamente según las fechas
✅ Trazabilidad completa de qué cuota fue a qué nómina

## Conclusión

Este plan propone un sistema robusto de gestión de cuotas que:
- Automatiza la distribución de ingresos/descuentos en múltiples nóminas **futuras**
- Mantiene trazabilidad completa de cada cuota y su aplicación
- Se integra naturalmente con el flujo actual de nómina
- Permite flexibilidad total en el orden de creación de nóminas
- Permite escalabilidad y futuras mejoras

**Próximos Pasos:**
1. Revisar y aprobar este plan actualizado
2. Definir respuestas a preguntas abiertas
3. Aprobar arquitectura de datos (Opción A recomendada)
4. Iniciar Fase 1 de implementación
