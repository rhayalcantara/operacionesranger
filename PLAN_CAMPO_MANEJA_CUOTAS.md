# Plan de Implementación: Campo `maneja_cuotas` en `no_desc_cred`

**Fecha:** 2025-10-05
**Objetivo:** Agregar campo booleano `maneja_cuotas` a la tabla `no_desc_cred` para identificar de forma confiable qué descuentos/créditos se manejan con sistema de cuotas, eliminando la búsqueda por descripción con LIKE.

## Problema Identificado

Actualmente en `backend-ranger-nomina/models/nominaModel.js:747-751` se busca si existe un registro de cuota usando:

```sql
SELECT id_desc_cred_nomina FROM no_desc_cred_nomina
WHERE id_nomina = ? AND codigo_empleado = ? AND descripcion LIKE ?
-- Parámetro: `%Cuota ${cuotaDetalle.numero_cuota}%`
```

**Problemas:**
- Búsqueda por descripción es frágil y poco confiable
- Si cambia el formato de la descripción, falla la búsqueda
- No hay forma de filtrar en selectores solo los desc_cred válidos para cuotas
- Performance inferior (LIKE vs campo indexado)

## Solución Propuesta

Agregar campo `maneja_cuotas TINYINT(1)` a la tabla `no_desc_cred` para identificar explícitamente los descuentos/créditos que utilizan sistema de cuotas.

## Cambios a Realizar

### 1. Base de Datos

**Script de migración:**
```sql
ALTER TABLE no_desc_cred
ADD COLUMN maneja_cuotas TINYINT(1) DEFAULT 0
COMMENT 'Indica si este desc/cred se maneja con sistema de cuotas';

-- Crear índice para mejorar performance en búsquedas
CREATE INDEX idx_maneja_cuotas ON no_desc_cred(maneja_cuotas);
```

**Archivo:** Crear script en `backend-ranger-nomina/migrations/` o ejecutar directamente

### 2. Backend

#### 2.1. Modelo Sequelize (`descCredSequelizeModel.js`)
- Agregar campo `maneja_cuotas` al modelo
- Actualizar validaciones si es necesario

#### 2.2. Controlador (`descCredController.js`)
- Incluir `maneja_cuotas` en operaciones CRUD
- Agregar endpoint GET `/api/desc-cred/cuotas` para listar solo desc_cred con `maneja_cuotas = 1`

#### 2.3. Modelo de Nómina (`nominaModel.js`)
**Línea 747-751:** Cambiar consulta de:
```javascript
const [existente] = await connection.query(
  `SELECT id_desc_cred_nomina FROM no_desc_cred_nomina
   WHERE id_nomina = ? AND codigo_empleado = ? AND descripcion LIKE ?`,
  [nominaId, empleado.id_empleado, `%Cuota ${cuotaDetalle.numero_cuota}%`]
);
```

A:
```javascript
const [existente] = await connection.query(
  `SELECT dcn.id_desc_cred_nomina
   FROM no_desc_cred_nomina dcn
   INNER JOIN no_desc_cred dc ON dcn.id_desc_cred = dc.id_desc_cred
   WHERE dcn.id_nomina = ?
     AND dcn.codigo_empleado = ?
     AND dc.maneja_cuotas = 1
     AND dcn.descripcion LIKE ?`,
  [nominaId, empleado.id_empleado, `%Cuota ${cuotaDetalle.numero_cuota}%`]
);
```

**Nota:** Mantenemos temporalmente el LIKE en descripción para identificar el número de cuota específico, pero agregamos `maneja_cuotas = 1` como filtro primario.

#### 2.4. Rutas (`routes/descCred.js`)
- Agregar ruta para endpoint de desc_cred con cuotas

### 3. Frontend

#### 3.1. Interfaz TypeScript (`interfaces/desc-cred.interface.ts`)
Agregar campo:
```typescript
export interface DescCred {
  id_desc_cred?: number;
  tipo: 'ingreso' | 'descuento';
  codigo: string;
  descripcion: string;
  maneja_cuotas?: boolean;  // NUEVO
  estado?: number;
}
```

#### 3.2. Servicio (`services/desc-cred.service.ts`)
Agregar método:
```typescript
getDescCredCuotas(): Observable<DescCred[]> {
  return this.http.get<DescCred[]>(`${this.apiUrl}/cuotas`);
}
```

#### 3.3. Componente de Mantenimiento (`desc-cred/desc-cred-form.component.ts`)
- Agregar checkbox para campo `maneja_cuotas`
- Mostrar en tabla de listado

#### 3.4. Componente de Cuotas (`cuotas/cuotas-form.component.ts`)
- Modificar selector de desc_cred para usar `getDescCredCuotas()`
- Filtrar solo desc_cred donde `maneja_cuotas = true`

## Orden de Implementación

1. ✅ **Crear este documento de planificación**
2. ✅ Ejecutar script SQL de migración
3. ✅ Actualizar modelo Sequelize backend (no necesario - se usa SQL directo)
4. ✅ Actualizar controlador y rutas backend
5. ✅ Modificar consultas en `nominaModel.js`
6. ✅ Actualizar interfaz TypeScript frontend
7. ✅ Actualizar servicio frontend
8. ✅ Actualizar componente de mantenimiento desc_cred
9. ✅ Actualizar componente de cuotas
10. ⏳ Probar funcionalidad end-to-end
11. ⏳ Actualizar datos existentes (marcar desc_cred de cuotas actuales)

## Pruebas Requeridas

1. Crear nuevo desc_cred con `maneja_cuotas = 1`
2. Verificar que aparece en selector de cuotas
3. Crear cuota con desc_cred marcado
4. Verificar que la búsqueda de existencia funciona correctamente
5. Recalcular nómina con cuotas y verificar cálculos
6. Verificar que desc_cred sin `maneja_cuotas` no aparecen en selector de cuotas

## Datos de Migración

**Script para marcar desc_cred existentes que manejan cuotas:**
```sql
-- Identificar y marcar desc_cred que actualmente se usan para cuotas
UPDATE no_desc_cred dc
SET maneja_cuotas = 1
WHERE EXISTS (
  SELECT 1 FROM no_desc_cred_nomina dcn
  WHERE dcn.id_desc_cred = dc.id_desc_cred
    AND dcn.descripcion LIKE '%Cuota%'
);
```

## Archivos Afectados

### Backend
- `backend-ranger-nomina/migrations/add_maneja_cuotas_field.sql` (NUEVO)
- `backend-ranger-nomina/models/descCredSequelizeModel.js`
- `backend-ranger-nomina/controllers/descCredController.js`
- `backend-ranger-nomina/routes/descCred.js`
- `backend-ranger-nomina/models/nominaModel.js` (líneas 747-751)

### Frontend
- `rangernomina-frontend/src/app/interfaces/desc-cred.interface.ts`
- `rangernomina-frontend/src/app/services/desc-cred.service.ts`
- `rangernomina-frontend/src/app/desc-cred/desc-cred-form.component.ts`
- `rangernomina-frontend/src/app/desc-cred/desc-cred-form.component.html`
- `rangernomina-frontend/src/app/cuotas/cuotas-form.component.ts`

## Rollback

Si es necesario revertir:
```sql
ALTER TABLE no_desc_cred DROP COLUMN maneja_cuotas;
DROP INDEX idx_maneja_cuotas ON no_desc_cred;
```

Revertir commits en orden inverso.

## Notas Adicionales

- Este cambio mejora la integridad referencial del sistema de cuotas
- Facilita futuras validaciones y reportes de cuotas
- Reduce riesgo de errores por cambios en descripciones
- Mejora el performance de consultas relacionadas a cuotas

---

**Implementado por:** Claude Code
**Revisado por:** [Pendiente]
**Fecha de Aprobación:** [Pendiente]