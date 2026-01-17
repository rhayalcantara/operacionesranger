# Plan de Gestión de Cuotas Pendientes

## Contexto

En el sistema actual de cuotas, cuando se crea una cuota se generan registros en `no_cuotas_detalle` con fechas esperadas de aplicación. Durante el procesamiento de nómina, estas cuotas se aplican automáticamente si coinciden con el rango de fechas.

### Problema
Por razones operativas, puede haber situaciones donde **no se puede cobrar una cuota a un empleado en una nómina específica**. Ejemplos:
- Empleado en licencia sin goce de sueldo
- Salario insuficiente para cubrir la cuota
- Decisión administrativa de suspender temporalmente el cobro
- Empleado suspendido temporalmente

### Soluciones Propuestas

#### **Solución 1: Acumular cuotas (cobrar múltiples cuotas en la siguiente nómina)**
- Pasar la cuota pendiente a la próxima nómina
- En la próxima nómina, cobrar tanto la cuota pasada como la que corresponde a esa nómina
- La cuota original mantiene su fecha esperada, pero se aplica en una nómina posterior

#### **Solución 2: Extender el plan de cuotas (ajustar fecha de cuota pendiente)**
- Cambiar la fecha esperada de la cuota pendiente a la siguiente de la fecha final
- Esto extiende el plan de pagos en una quincena/mes adicional
- Útil cuando se quiere mantener el monto de la cuota constante

---

## Análisis del Sistema Actual

### Tablas Involucradas

**`no_cuotas`** (Registro principal de la cuota)
```sql
- id_cuota (PK)
- id_empleado
- id_desc_cred
- descripcion
- monto_total
- cantidad_cuotas
- monto_por_cuota
- cuotas_aplicadas (contador)
- estado ('activo', 'completado', 'cancelado')
- fecha_inicio
- fecha_creacion
- usuario_creacion
```

**`no_cuotas_detalle`** (Detalle de cada cuota individual)
```sql
- id_cuota_detalle (PK)
- id_cuota (FK)
- numero_cuota (1, 2, 3, ...)
- monto
- fecha_esperada_aplicacion ⭐ (clave para aplicación automática)
- estado ('pendiente', 'aplicado', 'cancelado')
- id_nominas (FK - nómina donde se aplicó)
- id_desc_cred_nomina (FK - registro en no_desc_cred_nomina)
- fecha_aplicacion
```

### Flujo Actual de Aplicación de Cuotas

1. **Durante procesamiento de nómina** (`nominaModel.js -> _generarCargosAutomaticos()`)
   - Se llama a `cuotaModel.obtenerCuotasPendientesPorFecha(id_empleado, fecha_desde, fecha_hasta, quincena)`
   - Busca cuotas_detalle con:
     - `estado = 'pendiente'`
     - `fecha_esperada_aplicacion BETWEEN fecha_desde AND fecha_hasta`
     - cuota padre con `estado = 'activo'`

2. **Aplicación de cuota** (`cuotaModel.aplicarCuotaEnNomina()`)
   - Crea registro en `no_desc_cred_nomina`
   - Actualiza `no_cuotas_detalle`: estado='aplicado', id_nominas, id_desc_cred_nomina
   - Incrementa `cuotas_aplicadas` en `no_cuotas`
   - Si `cuotas_aplicadas >= cantidad_cuotas`, marca cuota como 'completado'

3. **Función existente: `moverCuota()`**
   - Permite mover una cuota de una nómina a otra
   - **LIMITACIÓN**: Solo funciona si la nómina origen NO está cerrada
   - Elimina de nómina origen y opcionalmente aplica en nómina destino

---

## Propuesta de Implementación

### **Solución 1: Saltar/Pausar Cuota (Acumular)**

#### Descripción
Marcar una cuota específica para que **NO se cobre en la nómina actual**, pero se mantenga pendiente para cobrarse en la siguiente nómina junto con la cuota que corresponde a esa fecha.

#### Casos de uso
- Empleado en licencia sin goce de sueldo temporalmente
- Acuerdo temporal de no cobro
- Salario insuficiente en esta quincena

#### Base de datos: Cambios necesarios

**Agregar campo a `no_cuotas_detalle`:**
```sql
ALTER TABLE no_cuotas_detalle
ADD COLUMN omitir_en_nomina TINYINT(1) DEFAULT 0
COMMENT 'Si es 1, esta cuota se omite en la aplicación automática actual';
```

#### Backend: Nuevas funcionalidades

**1. Nueva función en `cuotaModel.js`: `marcarOmitirCuota()`**
```javascript
/**
 * Marcar una cuota_detalle para omitirla en la próxima aplicación automática
 * @param {number} id_cuota_detalle
 * @param {boolean} omitir - true para omitir, false para reactivar
 */
async function marcarOmitirCuota(id_cuota_detalle, omitir = true) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Validar que la cuota está pendiente
    const [detalle] = await connection.query(
      'SELECT estado FROM no_cuotas_detalle WHERE id_cuota_detalle = ?',
      [id_cuota_detalle]
    );

    if (detalle.length === 0) {
      throw new Error('Cuota detalle no encontrada');
    }

    if (detalle[0].estado !== 'pendiente') {
      throw new Error('Solo se pueden omitir cuotas pendientes');
    }

    await connection.query(
      'UPDATE no_cuotas_detalle SET omitir_en_nomina = ? WHERE id_cuota_detalle = ?',
      [omitir ? 1 : 0, id_cuota_detalle]
    );

    await connection.commit();
    return { success: true, message: omitir ? 'Cuota omitida' : 'Cuota reactivada' };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
```

**2. Modificar `obtenerCuotasPendientesPorFecha()` en `cuotaModel.js`**
```javascript
// Línea ~212: Agregar condición para excluir cuotas omitidas
WHERE c.id_empleado = ?
  AND c.estado = 'activo'
  AND cd.estado = 'pendiente'
  AND cd.omitir_en_nomina = 0  -- ⭐ NUEVA CONDICIÓN
  AND cd.fecha_esperada_aplicacion BETWEEN ? AND ?
  ${whereQuincena}
```

**3. Nueva ruta en `cuotaRoutes.js`**
```javascript
// Omitir/reactivar cuota
router.patch('/:id/detalle/:detalleId/omitir', async (req, res) => {
  try {
    const { detalleId } = req.params;
    const { omitir } = req.body; // true o false

    const result = await cuotaModel.marcarOmitirCuota(detalleId, omitir);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

**4. Función auxiliar: `desomitirCuotasVencidas()`**
```javascript
/**
 * Reactivar automáticamente cuotas omitidas cuya fecha esperada ya pasó
 * (Ejecutar como cron job o manualmente)
 */
async function desomitirCuotasVencidas() {
  await db.query(
    `UPDATE no_cuotas_detalle
     SET omitir_en_nomina = 0
     WHERE omitir_en_nomina = 1
       AND estado = 'pendiente'
       AND fecha_esperada_aplicacion < CURDATE()`
  );
}
```

#### Frontend: Interfaz de usuario (integrada en diálogo unificado)

Esta funcionalidad se integrará en el **diálogo de gestión de cuotas** donde el usuario puede seleccionar entre múltiples acciones. Ver sección "Interfaz Unificada de Gestión de Cuotas" más arriba.

**Características específicas para "Pausar":**
- Radio button: "Pausar esta cuota"
- Descripción breve de consecuencias
- Badge "Pausada" en tabla de detalle
- Botón "Reactivar" para cuotas omitidas

#### Ventajas
✅ No modifica estructura fundamental del plan de cuotas
✅ Permite control granular (por cuota específica)
✅ Reversible (se puede reactivar fácilmente)
✅ No afecta fechas ni montos
✅ Implementación sencilla

#### Desventajas
⚠️ Si se omite una cuota, en la siguiente nómina se cobrarán 2 cuotas (puede ser un monto alto)
⚠️ Requiere gestión manual para reactivar cuotas
⚠️ No hay límite automático de cuántas veces se puede omitir

---

### **Solución 2: Posponer/Extender Cuota**

#### Descripción
Cambiar la **fecha esperada de aplicación** de una cuota pendiente para moverla a una fecha futura. Esto extiende el plan de cuotas.

#### Casos de uso
- Licencia médica prolongada
- Suspensión temporal del empleado
- Reestructuración de deuda del empleado
- Extender plan de pagos por dificultades financieras

#### Base de datos: Cambios necesarios

**Agregar campo de auditoría a `no_cuotas_detalle`:**
```sql
ALTER TABLE no_cuotas_detalle
ADD COLUMN fecha_original DATE NULL
COMMENT 'Fecha esperada original antes de modificaciones',
ADD COLUMN usuario_modificacion INT NULL,
ADD COLUMN fecha_modificacion DATETIME NULL,
ADD FOREIGN KEY (usuario_modificacion) REFERENCES sys_usuarios(id_usuario);
```

**Opcional: Tabla de historial de cambios**
```sql
CREATE TABLE no_cuotas_detalle_historial (
  id_historial INT AUTO_INCREMENT PRIMARY KEY,
  id_cuota_detalle INT NOT NULL,
  fecha_esperada_anterior DATE NOT NULL,
  fecha_esperada_nueva DATE NOT NULL,
  motivo VARCHAR(255),
  usuario_modificacion INT NOT NULL,
  fecha_modificacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_cuota_detalle) REFERENCES no_cuotas_detalle(id_cuota_detalle),
  FOREIGN KEY (usuario_modificacion) REFERENCES sys_usuarios(id_usuario)
);
```

#### Backend: Nuevas funcionalidades

**1. Nueva función en `cuotaModel.js`: `posponerCuota()`**
```javascript
/**
 * Posponer una cuota_detalle cambiando su fecha esperada
 * @param {number} id_cuota_detalle
 * @param {string} nueva_fecha_esperada - Formato YYYY-MM-DD
 * @param {number} usuario_id - ID del usuario que realiza el cambio
 * @param {string} motivo - Razón del cambio
 */
async function posponerCuota(id_cuota_detalle, nueva_fecha_esperada, usuario_id, motivo = null) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Validar que la cuota está pendiente
    const [detalle] = await connection.query(
      `SELECT cd.*, c.id_cuota, c.fecha_inicio
       FROM no_cuotas_detalle cd
       JOIN no_cuotas c ON cd.id_cuota = c.id_cuota
       WHERE cd.id_cuota_detalle = ?`,
      [id_cuota_detalle]
    );

    if (detalle.length === 0) {
      throw new Error('Cuota detalle no encontrada');
    }

    if (detalle[0].estado !== 'pendiente') {
      throw new Error('Solo se pueden posponer cuotas pendientes');
    }

    const fecha_esperada_actual = detalle[0].fecha_esperada_aplicacion;
    const fecha_nueva = new Date(nueva_fecha_esperada);
    const fecha_actual_obj = new Date(fecha_esperada_actual);

    // Validación: nueva fecha debe ser posterior
    if (fecha_nueva <= fecha_actual_obj) {
      throw new Error('La nueva fecha debe ser posterior a la fecha actual');
    }

    // Guardar fecha original si no existe
    const fecha_original = detalle[0].fecha_original || fecha_esperada_actual;

    // Actualizar cuota_detalle
    await connection.query(
      `UPDATE no_cuotas_detalle
       SET fecha_esperada_aplicacion = ?,
           fecha_original = ?,
           usuario_modificacion = ?,
           fecha_modificacion = NOW()
       WHERE id_cuota_detalle = ?`,
      [nueva_fecha_esperada, fecha_original, usuario_id, id_cuota_detalle]
    );

    // Registrar en historial
    await connection.query(
      `INSERT INTO no_cuotas_detalle_historial
       (id_cuota_detalle, fecha_esperada_anterior, fecha_esperada_nueva, motivo, usuario_modificacion)
       VALUES (?, ?, ?, ?, ?)`,
      [id_cuota_detalle, fecha_esperada_actual, nueva_fecha_esperada, motivo, usuario_id]
    );

    await connection.commit();
    return {
      success: true,
      message: `Cuota pospuesta de ${fecha_esperada_actual} a ${nueva_fecha_esperada}`
    };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
```

**2. Función auxiliar: `posponerCuotaAlFinal()`**
```javascript
/**
 * Posponer una cuota al final del plan (después de la última cuota)
 * Útil para "pasar" una cuota sin calcular fechas manualmente
 */
async function posponerCuotaAlFinal(id_cuota_detalle, usuario_id, motivo = null) {
  const connection = await db.getConnection();

  try {
    // Obtener la última fecha esperada del plan de cuotas
    const [ultimaCuota] = await connection.query(
      `SELECT MAX(cd2.fecha_esperada_aplicacion) as ultima_fecha
       FROM no_cuotas_detalle cd1
       JOIN no_cuotas_detalle cd2 ON cd1.id_cuota = cd2.id_cuota
       WHERE cd1.id_cuota_detalle = ?`,
      [id_cuota_detalle]
    );

    if (ultimaCuota.length === 0 || !ultimaCuota[0].ultima_fecha) {
      throw new Error('No se pudo determinar la última fecha del plan');
    }

    // Obtener quincena_aplicacion para calcular incremento correcto
    const [cuotaInfo] = await connection.query(
      `SELECT tdc.quincena_aplicacion
       FROM no_cuotas_detalle cd
       JOIN no_cuotas c ON cd.id_cuota = c.id_cuota
       JOIN no_desc_cred tdc ON c.id_desc_cred = tdc.id_desc_cred
       WHERE cd.id_cuota_detalle = ?`,
      [id_cuota_detalle]
    );

    const quincena_aplicacion = cuotaInfo[0].quincena_aplicacion;
    const diasIncremento = (quincena_aplicacion === 1 || quincena_aplicacion === 2) ? 30 : 15;

    // Calcular nueva fecha (siguiente periodo después de la última)
    const fecha_base = new Date(ultimaCuota[0].ultima_fecha);
    fecha_base.setDate(fecha_base.getDate() + diasIncremento);
    const nueva_fecha = fecha_base.toISOString().split('T')[0];

    return await posponerCuota(id_cuota_detalle, nueva_fecha, usuario_id, motivo);

  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
}
```

**3. Nueva ruta en `cuotaRoutes.js`**
```javascript
// Posponer cuota a fecha específica
router.patch('/:id/detalle/:detalleId/posponer', async (req, res) => {
  try {
    const { detalleId } = req.params;
    const { fecha_nueva, motivo } = req.body;
    const usuario_id = req.user.id_usuario; // Del JWT

    const result = await cuotaModel.posponerCuota(
      detalleId,
      fecha_nueva,
      usuario_id,
      motivo
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Posponer cuota al final del plan
router.patch('/:id/detalle/:detalleId/posponer-al-final', async (req, res) => {
  try {
    const { detalleId } = req.params;
    const { motivo } = req.body;
    const usuario_id = req.user.id_usuario;

    const result = await cuotaModel.posponerCuotaAlFinal(
      detalleId,
      usuario_id,
      motivo
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

#### Frontend: Interfaz de usuario (integrada en diálogo unificado)

Esta funcionalidad se integrará en el **diálogo de gestión de cuotas** donde el usuario puede seleccionar entre múltiples acciones. Ver sección "Interfaz Unificada de Gestión de Cuotas" más arriba.

**Características específicas para "Posponer":**
- Radio button: "Posponer al final del plan"
- Radio button: "Posponer a fecha específica" (con date picker)
- Badge "Pospuesta" en tabla de detalle
- Tooltip mostrando: "Fecha original: XX → Nueva: YY"
- Ícono de historial para ver registro de cambios

#### Ventajas
✅ Flexibilidad total para ajustar fechas
✅ No acumula cobros (cada quincena se cobra solo la cuota que corresponde)
✅ Auditoría completa de cambios (quién, cuándo, por qué)
✅ Permite extender plan indefinidamente si es necesario
✅ Útil para casos especiales (licencias prolongadas)

#### Desventajas
⚠️ Modifica el plan original de cuotas
⚠️ Puede extender el plazo de pago indefinidamente
⚠️ Requiere gestión cuidadosa para no perder control del plan
⚠️ Más complejo de implementar (historial, validaciones)

---

## Comparación de Soluciones

| Aspecto | Solución 1: Omitir/Pausar | Solución 2: Posponer |
|---------|---------------------------|----------------------|
| **Uso principal** | Suspensión temporal (1-2 quincenas) | Extensión de plazo prolongada |
| **Cambio en plan** | No modifica fechas | Sí modifica fechas |
| **Cobro posterior** | Acumula (2 cuotas juntas) | Distribuido (1 cuota a la vez) |
| **Complejidad** | Baja | Media-Alta |
| **Reversibilidad** | Fácil (reactivar) | Difícil (requiere restaurar fecha) |
| **Auditoría** | No necesaria | Completa (historial) |
| **Impacto en empleado** | Cuota doble próxima vez | Mantiene cuota normal |
| **Casos de uso** | Licencia corta, salario bajo | Licencia prolongada, reestructuración |

---

## Recomendación de Implementación

### Estrategia sugerida: **Implementar ambas soluciones con selector de acción**

**Razón**: Son complementarias y cubren diferentes casos de uso. El usuario decide en tiempo real cuál aplicar según la situación específica del empleado.

#### **Interfaz Unificada de Gestión de Cuotas**

El usuario verá un **menú de acciones** al trabajar con una cuota pendiente:

```
┌─────────────────────────────────────────────────────────┐
│ Cuota #3 de 12 - Empleado: Juan Pérez                  │
│ Monto: RD$5,000.00 | Fecha esperada: 2025-12-15        │
├─────────────────────────────────────────────────────────┤
│ ¿Qué desea hacer con esta cuota?                       │
│                                                         │
│ ○ Pausar esta cuota (se cobrará junto con la siguiente)│
│   • No modifica el plan original                       │
│   • Acumula cobro en próxima nómina                    │
│   • Reversible fácilmente                              │
│                                                         │
│ ○ Posponer al final del plan                           │
│   • Extiende el plan de pagos                          │
│   • Se cobrará después de la última cuota              │
│   • Mantiene monto individual                          │
│                                                         │
│ ○ Posponer a fecha específica                          │
│   • Control total de la nueva fecha                    │
│   • Requiere auditoría                                 │
│   • [Seleccionar fecha: ____]                          │
│                                                         │
│ Motivo (opcional): [___________________________]       │
│                                                         │
│           [Cancelar]  [Aplicar Acción]                 │
└─────────────────────────────────────────────────────────┘
```

### Fases de implementación

#### **Fase 1: Infraestructura Base** - Estimado: 2-3 días
1. Migración BD: Agregar todos los campos necesarios (ambas soluciones)
2. Backend: Estructura base de funciones
3. Frontend: Componente de diálogo unificado de acciones
4. Modelo de datos actualizado (interfaces TypeScript)

#### **Fase 2: Solución 1 (Pausar/Omitir)** - Estimado: 2-3 días
1. Backend: Funciones `marcarOmitirCuota()` y `desomitirCuotasVencidas()`
2. Backend: Modificar `obtenerCuotasPendientesPorFecha()` para excluir omitidas
3. Frontend: Opción "Pausar esta cuota" en diálogo
4. Frontend: Badge visual "Pausada" en tabla de detalle
5. Testing: Verificar omisión y acumulación

#### **Fase 3: Solución 2 (Posponer)** - Estimado: 3-4 días
1. Backend: Funciones `posponerCuota()` y `posponerCuotaAlFinal()`
2. Backend: Tabla de historial y auditoría
3. Frontend: Opciones "Posponer al final" y "Posponer a fecha"
4. Frontend: Date picker para fecha específica
5. Frontend: Visualización de historial de cambios
6. Testing: Verificar cálculo de fechas y auditoría

#### **Fase 4: Integración y Experiencia de Usuario** - Estimado: 2-3 días
1. Frontend: Diálogo unificado con radio buttons para seleccionar acción
2. Frontend: Tooltips y ayuda contextual para cada opción
3. Frontend: Confirmación con resumen de la acción seleccionada
4. Frontend: Dashboard de cuotas con filtros por estado (pausadas/pospuestas)
5. Backend: Endpoint unificado `/api/cuotas/:id/detalle/:detalleId/gestionar`
6. Testing de integración: Flujo completo de usuario

#### **Fase 5: Mejoras y Automatización** - Estimado: 2-3 días
1. Cron job para desomitir cuotas vencidas automáticamente
2. Notificaciones al supervisor cuando se gestionan cuotas
3. Reportes de cuotas gestionadas (dashboard)
4. Validaciones adicionales y permisos por rol
5. Documentación de usuario (manual de uso)

**Total estimado: 11-16 días de desarrollo**

---

## Consideraciones de Seguridad y Validaciones

### Permisos de usuario
- Solo usuarios nivel 9 (admin) o supervisor de nómina pueden:
  - Omitir/reactivar cuotas
  - Posponer cuotas
- Registrar usuario que realiza la acción (auditoría)

### Validaciones de negocio
1. **No permitir omitir/posponer cuotas ya aplicadas**
2. **No permitir modificar cuotas de nóminas cerradas**
3. **Límite de omisiones**: Opcional, evitar omitir misma cuota más de N veces
4. **Validación de fecha**: Al posponer, fecha debe ser futura y razonable
5. **Confirmación de usuario**: Dialog de confirmación antes de cambios

### Notificaciones
- Email/notificación al supervisor cuando se omite/pospone cuota
- Log de auditoría en sistema
- Dashboard de alertas para cuotas vencidas omitidas

---

## Pruebas Sugeridas

### Escenarios de testing

**Caso 1: Omitir cuota por 1 quincena**
1. Crear cuota de 6 quincenas
2. Omitir cuota #2
3. Procesar nómina → Solo cobra cuota #1
4. Procesar siguiente nómina → Cobra cuota #2 y #3 juntas
5. Verificar totales y contador de cuotas_aplicadas

**Caso 2: Posponer cuota al final**
1. Crear cuota de 4 quincenas (ene, feb, mar, abr)
2. Posponer cuota #2 al final
3. Verificar nueva fecha (después de abr)
4. Procesar nóminas → Cobra #1, #3, #4, y finalmente #2
5. Verificar historial de cambios

**Caso 3: Validaciones**
1. Intentar omitir cuota ya aplicada → Error
2. Intentar posponer a fecha pasada → Error
3. Intentar modificar con usuario sin permisos → Error
4. Intentar posponer cuota de nómina cerrada → Error

---

## Impacto en Sistema Existente

### Archivos a modificar

**Backend:**
- `models/cuotaModel.js` (agregar funciones nuevas)
- `routes/cuotaRoutes.js` (agregar rutas nuevas)
- Migraciones SQL (campos nuevos)

**Frontend:**
- `components/cuotas/cuota-detalle-dialog.component.ts` (agregar UI)
- `components/cuotas/cuota-detalle-dialog.component.html` (template)
- `services/cuota.service.ts` (agregar métodos API)
- `models/cuota.model.ts` (agregar campos)

### Compatibilidad
✅ **Retrocompatible**: Los cambios son aditivos, no rompen funcionalidad existente
✅ **Sin migración de datos**: Campos nuevos con valores por defecto seguros
✅ **Funcionalidad actual intacta**: No se modifica lógica de aplicación automática base

---

## Implementación Detallada: Interfaz Unificada

### Backend: Endpoint Unificado de Gestión

**Nueva ruta en `cuotaRoutes.js`:**
```javascript
/**
 * Endpoint unificado para gestionar cuotas (pausar, posponer, reactivar)
 * POST /api/cuotas/:id/detalle/:detalleId/gestionar
 */
router.post('/:id/detalle/:detalleId/gestionar', async (req, res) => {
  try {
    const { detalleId } = req.params;
    const { accion, fecha_nueva, motivo } = req.body;
    const usuario_id = req.user.id_usuario; // Del JWT

    let result;

    switch (accion) {
      case 'pausar':
        result = await cuotaModel.marcarOmitirCuota(detalleId, true);
        break;

      case 'reactivar':
        result = await cuotaModel.marcarOmitirCuota(detalleId, false);
        break;

      case 'posponer_al_final':
        result = await cuotaModel.posponerCuotaAlFinal(detalleId, usuario_id, motivo);
        break;

      case 'posponer_fecha':
        if (!fecha_nueva) {
          return res.status(400).json({ error: 'Fecha nueva es requerida' });
        }
        result = await cuotaModel.posponerCuota(detalleId, fecha_nueva, usuario_id, motivo);
        break;

      default:
        return res.status(400).json({ error: 'Acción no válida' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error al gestionar cuota:', error);
    res.status(400).json({ error: error.message });
  }
});
```

### Frontend: Componente de Diálogo Unificado

**Nuevo componente: `cuota-gestion-dialog.component.ts`**

```typescript
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CuotaDetalle } from '../../models/cuota.model';
import { CuotaService } from '../../services/cuota.service';
import { NotificationService } from '../../notification.service';

export interface GestionCuotaData {
  cuotaDetalle: CuotaDetalle;
  cuotaPrincipal: any; // Datos de la cuota principal para calcular "al final"
}

export type AccionCuota = 'pausar' | 'reactivar' | 'posponer_al_final' | 'posponer_fecha';

@Component({
  selector: 'app-cuota-gestion-dialog',
  templateUrl: './cuota-gestion-dialog.component.html',
  styleUrls: ['./cuota-gestion-dialog.component.css']
})
export class CuotaGestionDialogComponent implements OnInit {
  form: FormGroup;
  loading = false;
  accionSeleccionada: AccionCuota = 'pausar';
  fechaMinimaPermitida: Date;

  // Información calculada para mostrar al usuario
  fechaFinalCalculada: string = '';
  cuotasRestantes: number = 0;

  constructor(
    private fb: FormBuilder,
    private cuotaService: CuotaService,
    private notificationService: NotificationService,
    public dialogRef: MatDialogRef<CuotaGestionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: GestionCuotaData
  ) {
    // Fecha mínima = mañana
    this.fechaMinimaPermitida = new Date();
    this.fechaMinimaPermitida.setDate(this.fechaMinimaPermitida.getDate() + 1);
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      accion: ['pausar', Validators.required],
      fecha_nueva: [null],
      motivo: ['']
    });

    this.calcularInformacion();

    // Listener para cambio de acción
    this.form.get('accion')?.valueChanges.subscribe(accion => {
      this.accionSeleccionada = accion;
      this.actualizarValidaciones();
    });
  }

  calcularInformacion(): void {
    // Calcular cuántas cuotas quedan
    this.cuotasRestantes = this.data.cuotaPrincipal.cantidad_cuotas -
                           this.data.cuotaPrincipal.cuotas_aplicadas;

    // Calcular fecha estimada si se pospone al final
    // (esto es un estimado, el backend calculará la fecha exacta)
    const diasIncremento = this.data.cuotaPrincipal.quincena_aplicacion === 0 ? 15 : 30;
    const fechaBase = new Date(this.data.cuotaDetalle.fecha_esperada_aplicacion);
    const diasAgregar = (this.cuotasRestantes) * diasIncremento;

    const fechaFinal = new Date(fechaBase);
    fechaFinal.setDate(fechaFinal.getDate() + diasAgregar);
    this.fechaFinalCalculada = fechaFinal.toLocaleDateString('es-DO');
  }

  actualizarValidaciones(): void {
    const fechaControl = this.form.get('fecha_nueva');

    if (this.accionSeleccionada === 'posponer_fecha') {
      fechaControl?.setValidators([Validators.required]);
    } else {
      fechaControl?.clearValidators();
    }

    fechaControl?.updateValueAndValidity();
  }

  getDescripcionAccion(): string {
    switch (this.accionSeleccionada) {
      case 'pausar':
        return 'Esta cuota se omitirá en la próxima nómina y se acumulará con la siguiente. ' +
               'Recibirá 2 cuotas juntas en la próxima aplicación.';

      case 'posponer_al_final':
        return `Esta cuota se moverá al final del plan de pagos (aprox. ${this.fechaFinalCalculada}). ` +
               'El plan se extiende en una quincena/mes adicional.';

      case 'posponer_fecha':
        return 'Seleccione una fecha específica para aplicar esta cuota. ' +
               'Se registrará en el historial de auditoría.';

      default:
        return '';
    }
  }

  getMontoImpacto(): string {
    const monto = this.data.cuotaDetalle.monto;

    if (this.accionSeleccionada === 'pausar') {
      return `RD$${(monto * 2).toLocaleString('es-DO', { minimumFractionDigits: 2 })} (cuota doble próxima vez)`;
    } else {
      return `RD$${monto.toLocaleString('es-DO', { minimumFractionDigits: 2 })} (se mantiene igual)`;
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.notificationService.showError('Por favor complete todos los campos requeridos');
      return;
    }

    this.loading = true;
    const formValue = this.form.value;

    this.cuotaService.gestionarCuota(
      this.data.cuotaPrincipal.id_cuota,
      this.data.cuotaDetalle.id_cuota_detalle,
      {
        accion: formValue.accion,
        fecha_nueva: formValue.fecha_nueva,
        motivo: formValue.motivo
      }
    ).subscribe({
      next: (result) => {
        this.notificationService.showSuccess(result.message);
        this.dialogRef.close(true); // true = hubo cambios
      },
      error: (error) => {
        this.notificationService.showError(error.error?.error || 'Error al gestionar cuota');
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
```

**Template: `cuota-gestion-dialog.component.html`**

```html
<h2 mat-dialog-title>Gestionar Cuota</h2>

<mat-dialog-content>
  <!-- Información de la cuota -->
  <div class="cuota-info">
    <h3>Cuota #{{ data.cuotaDetalle.numero_cuota }} de {{ data.cuotaPrincipal.cantidad_cuotas }}</h3>
    <p><strong>Empleado:</strong> {{ data.cuotaPrincipal.empleado_nombre }} {{ data.cuotaPrincipal.empleado_apellido }}</p>
    <p><strong>Monto:</strong> RD${{ data.cuotaDetalle.monto | number:'1.2-2' }}</p>
    <p><strong>Fecha esperada:</strong> {{ data.cuotaDetalle.fecha_esperada_aplicacion | date:'dd/MM/yyyy' }}</p>
  </div>

  <mat-divider></mat-divider>

  <form [formGroup]="form" class="gestion-form">
    <h4>¿Qué desea hacer con esta cuota?</h4>

    <mat-radio-group formControlName="accion" class="acciones-radio-group">
      <!-- Opción 1: Pausar -->
      <mat-radio-button value="pausar" class="accion-option">
        <div class="accion-content">
          <div class="accion-titulo">
            <mat-icon>pause_circle</mat-icon>
            <span>Pausar esta cuota (se cobrará junto con la siguiente)</span>
          </div>
          <ul class="accion-detalles">
            <li>No modifica el plan original</li>
            <li>Acumula cobro en próxima nómina</li>
            <li>Reversible fácilmente</li>
          </ul>
        </div>
      </mat-radio-button>

      <!-- Opción 2: Posponer al final -->
      <mat-radio-button value="posponer_al_final" class="accion-option">
        <div class="accion-content">
          <div class="accion-titulo">
            <mat-icon>skip_next</mat-icon>
            <span>Posponer al final del plan</span>
          </div>
          <ul class="accion-detalles">
            <li>Extiende el plan de pagos</li>
            <li>Se cobrará después de la última cuota (aprox. {{ fechaFinalCalculada }})</li>
            <li>Mantiene monto individual</li>
          </ul>
        </div>
      </mat-radio-button>

      <!-- Opción 3: Posponer a fecha específica -->
      <mat-radio-button value="posponer_fecha" class="accion-option">
        <div class="accion-content">
          <div class="accion-titulo">
            <mat-icon>event</mat-icon>
            <span>Posponer a fecha específica</span>
          </div>
          <ul class="accion-detalles">
            <li>Control total de la nueva fecha</li>
            <li>Requiere auditoría</li>
          </ul>

          <mat-form-field *ngIf="accionSeleccionada === 'posponer_fecha'" class="fecha-picker">
            <mat-label>Seleccionar nueva fecha</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="fecha_nueva"
                   [min]="fechaMinimaPermitida">
            <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
            <mat-error *ngIf="form.get('fecha_nueva')?.hasError('required')">
              Fecha es requerida
            </mat-error>
          </mat-form-field>
        </div>
      </mat-radio-button>
    </mat-radio-group>

    <!-- Motivo (opcional pero recomendado) -->
    <mat-form-field class="full-width" *ngIf="accionSeleccionada !== 'pausar'">
      <mat-label>Motivo del cambio (opcional)</mat-label>
      <textarea matInput formControlName="motivo" rows="3"
                placeholder="Ej: Empleado en licencia médica"></textarea>
    </mat-form-field>

    <!-- Resumen de impacto -->
    <div class="impacto-resumen" *ngIf="accionSeleccionada">
      <mat-icon color="primary">info</mat-icon>
      <div class="impacto-texto">
        <p><strong>Impacto:</strong></p>
        <p>{{ getDescripcionAccion() }}</p>
        <p><strong>Monto próximo cobro:</strong> {{ getMontoImpacto() }}</p>
      </div>
    </div>
  </form>
</mat-dialog-content>

<mat-dialog-actions align="end">
  <button mat-button (click)="onCancel()" [disabled]="loading">
    Cancelar
  </button>
  <button mat-raised-button color="primary" (click)="onSubmit()"
          [disabled]="loading || form.invalid">
    <mat-spinner diameter="20" *ngIf="loading"></mat-spinner>
    <span *ngIf="!loading">Aplicar Acción</span>
  </button>
</mat-dialog-actions>
```

**Estilos: `cuota-gestion-dialog.component.css`**

```css
.cuota-info {
  background-color: #f5f5f5;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 16px;
}

.cuota-info h3 {
  margin-top: 0;
  color: #1976d2;
}

.gestion-form {
  margin-top: 16px;
}

.gestion-form h4 {
  margin-bottom: 16px;
  color: #333;
}

.acciones-radio-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.accion-option {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 16px;
  transition: all 0.3s ease;
}

.accion-option:hover {
  background-color: #f9f9f9;
  border-color: #1976d2;
}

.accion-option.mat-radio-checked {
  background-color: #e3f2fd;
  border-color: #1976d2;
  border-width: 2px;
}

.accion-content {
  margin-left: 8px;
}

.accion-titulo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  margin-bottom: 8px;
}

.accion-titulo mat-icon {
  color: #1976d2;
}

.accion-detalles {
  margin-left: 32px;
  font-size: 0.9em;
  color: #666;
  list-style-type: disc;
}

.fecha-picker {
  width: 100%;
  margin-top: 12px;
  margin-left: 32px;
}

.full-width {
  width: 100%;
}

.impacto-resumen {
  display: flex;
  gap: 12px;
  background-color: #fff3e0;
  border-left: 4px solid #ff9800;
  padding: 16px;
  border-radius: 4px;
  margin-top: 16px;
}

.impacto-resumen mat-icon {
  flex-shrink: 0;
}

.impacto-texto p {
  margin: 4px 0;
}

.impacto-texto p:first-child {
  font-weight: 500;
  margin-bottom: 8px;
}

mat-dialog-content {
  max-height: 80vh;
  overflow-y: auto;
}

mat-dialog-actions button {
  margin-left: 8px;
}
```

### Frontend: Servicio Actualizado

**Agregar método en `cuota.service.ts`:**

```typescript
gestionarCuota(
  idCuota: number,
  idCuotaDetalle: number,
  datos: {
    accion: 'pausar' | 'reactivar' | 'posponer_al_final' | 'posponer_fecha',
    fecha_nueva?: string,
    motivo?: string
  }
): Observable<any> {
  return this.http.post(
    `${this.apiUrl}/${idCuota}/detalle/${idCuotaDetalle}/gestionar`,
    datos
  );
}
```

### Integración en el componente de detalle existente

**En `cuota-detalle-dialog.component.ts`:**

```typescript
abrirGestionCuota(cuotaDetalle: CuotaDetalle): void {
  const dialogRef = this.dialog.open(CuotaGestionDialogComponent, {
    width: '700px',
    disableClose: true,
    data: {
      cuotaDetalle: cuotaDetalle,
      cuotaPrincipal: this.data.cuota
    }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      // Hubo cambios, recargar detalle
      this.cargarDetalleCuota();
    }
  });
}
```

**En `cuota-detalle-dialog.component.html`:**

```html
<!-- En la tabla de detalle de cuotas, agregar columna de acciones -->
<ng-container matColumnDef="acciones">
  <th mat-header-cell *matHeaderCellDef>Acciones</th>
  <td mat-cell *matCellDef="let cuotaDet">
    <button mat-icon-button
            *ngIf="cuotaDet.estado === 'pendiente'"
            (click)="abrirGestionCuota(cuotaDet)"
            matTooltip="Gestionar cuota">
      <mat-icon>settings</mat-icon>
    </button>

    <mat-chip *ngIf="cuotaDet.omitir_en_nomina === 1"
              class="badge-warning">
      Pausada
    </mat-chip>

    <mat-chip *ngIf="cuotaDet.fecha_original"
              class="badge-info"
              [matTooltip]="'Original: ' + cuotaDet.fecha_original + ' → Nueva: ' + cuotaDet.fecha_esperada_aplicacion">
      Pospuesta
    </mat-chip>
  </td>
</ng-container>
```

---

## Anexos

### Script de migración SQL - Solución 1

```sql
-- Solución 1: Campo para omitir cuotas
ALTER TABLE no_cuotas_detalle
ADD COLUMN omitir_en_nomina TINYINT(1) DEFAULT 0
COMMENT 'Si es 1, esta cuota se omite en la aplicación automática';

-- Índice para optimizar consultas
CREATE INDEX idx_omitir_en_nomina ON no_cuotas_detalle(omitir_en_nomina);
```

### Script de migración SQL - Solución 2

```sql
-- Solución 2: Campos de auditoría para posponer
ALTER TABLE no_cuotas_detalle
ADD COLUMN fecha_original DATE NULL
COMMENT 'Fecha esperada original antes de modificaciones',
ADD COLUMN usuario_modificacion INT NULL,
ADD COLUMN fecha_modificacion DATETIME NULL,
ADD FOREIGN KEY (usuario_modificacion) REFERENCES sys_usuarios(id_usuario);

-- Tabla de historial
CREATE TABLE no_cuotas_detalle_historial (
  id_historial INT AUTO_INCREMENT PRIMARY KEY,
  id_cuota_detalle INT NOT NULL,
  fecha_esperada_anterior DATE NOT NULL,
  fecha_esperada_nueva DATE NOT NULL,
  motivo VARCHAR(255),
  usuario_modificacion INT NOT NULL,
  fecha_modificacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_cuota_detalle) REFERENCES no_cuotas_detalle(id_cuota_detalle),
  FOREIGN KEY (usuario_modificacion) REFERENCES sys_usuarios(id_usuario),
  INDEX idx_cuota_detalle (id_cuota_detalle)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## Conclusión

Este plan proporciona **dos soluciones complementarias** para gestionar cuotas que no pueden cobrarse en su fecha programada:

1. **Omitir/Pausar**: Solución simple y rápida para casos temporales
2. **Posponer/Extender**: Solución robusta con auditoría para casos complejos

Ambas mantienen la integridad del sistema de cuotas existente, son retrocompatibles, y proporcionan flexibilidad operativa al equipo de nómina.

**Próximos pasos:**
1. Revisar y aprobar este plan
2. Decidir qué solución(es) implementar primero
3. Crear tareas en sistema de gestión de proyectos
4. Asignar recursos y timeline
5. Implementar en ambiente de desarrollo
6. Testing exhaustivo
7. Deploy a producción
