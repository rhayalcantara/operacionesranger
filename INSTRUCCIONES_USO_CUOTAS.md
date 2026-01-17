# Instrucciones de Uso: Sistema de Cuotas

## ✅ Implementación Completa

El sistema de cuotas está **100% implementado** y listo para usar.

---

## 🚀 Cómo Iniciar

### 1. Iniciar Backend
```bash
cd backend-ranger-nomina
npm start
```
El backend estará disponible en `http://localhost:3333`

### 2. Iniciar Frontend
```bash
cd rangernomina-frontend
npm start
```
El frontend estará disponible en `http://localhost:4200`

---

## 📋 Cómo Usar el Sistema

### Acceso al Módulo
1. Iniciar sesión en el sistema
2. En el menú superior, ir a **Payroll → Cuotas (Ingresos/Descuentos)**
3. Se abrirá el listado de cuotas

### Crear una Nueva Cuota

#### Paso 1: Hacer clic en "Nueva Cuota"
- Se abrirá un formulario modal

#### Paso 2: Completar el formulario
| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| **Empleado** | Seleccionar empleado del listado | Juan Pérez |
| **Tipo** | Seleccionar si es ingreso o descuento | Préstamo (Descuento) |
| **Descripción** | Describir el concepto | Préstamo personal |
| **Monto Total** | Monto total a distribuir | RD$6,000.00 |
| **Cantidad de Cuotas** | Número de quincenas (máx 24) | 6 |
| **Fecha de Inicio** | Primera quincena donde aplicará | 2025-02-15 |

#### Paso 3: Verificar el cálculo automático
- El sistema muestra el **monto por cuota** calculado
- Ejemplo: RD$6,000 / 6 = RD$1,000 por quincena

#### Paso 4: Guardar
- Hacer clic en "Crear Cuota"
- El sistema genera automáticamente 6 cuotas con fechas programadas

---

## 🔄 Aplicación Automática en Nóminas

### Cómo Funciona

Cuando creas una cuota, el sistema:
1. Genera N cuotas_detalle (una por cada quincena)
2. Asigna fechas esperadas a cada cuota:
   - Cuota 1: 2025-02-15
   - Cuota 2: 2025-03-01
   - Cuota 3: 2025-03-15
   - etc.

**Al crear/recalcular una nómina:**
1. El sistema busca cuotas pendientes del empleado
2. Verifica qué cuotas corresponden al rango de fechas de la nómina
3. Las aplica automáticamente en `no_desc_cred_nomina`
4. Actualiza el estado de la cuota a "Aplicado"

### Ejemplo Práctico

```
SITUACIÓN:
- Hoy: 5 de febrero de 2025
- Creas préstamo de RD$6,000 a 6 quincenas
- Fecha inicio: 15 de febrero

CUOTAS GENERADAS:
Cuota 1: RD$1,000 - 2025-02-15 - Pendiente
Cuota 2: RD$1,000 - 2025-03-01 - Pendiente
Cuota 3: RD$1,000 - 2025-03-15 - Pendiente
... (y así sucesivamente)

ESCENARIO 1: Crear nómina del 15-28 de febrero
→ Al recalcular: Aplica automáticamente Cuota 1
→ Resultado: Descuento de RD$1,000 en la nómina

ESCENARIO 2: NO crear nómina de marzo
→ Cuotas 2 y 3 quedan pendientes

ESCENARIO 3: Crear nómina de abril (1-15)
→ Al recalcular: Aplica Cuotas 4 y 5
→ Cuotas 2 y 3 siguen pendientes

ESCENARIO 4: Crear nómina de marzo (retroactiva)
→ Al recalcular: Aplica Cuotas 2 y 3
→ Ahora todas las cuotas hasta abril están aplicadas
```

**Ventaja clave:** No importa el orden de creación de nóminas

---

## 👁️ Ver Detalle de una Cuota

### Desde el Listado
1. Hacer clic en el menú de acciones (⋮) de cualquier cuota
2. Seleccionar "Ver Detalle"

### Información Mostrada
- **Encabezado:**
  - Empleado y cédula
  - Descripción y tipo
  - Monto total y por cuota
  - Barra de progreso visual

- **Tabla de Historial:**
  | Columna | Descripción |
  |---------|-------------|
  | Cuota | Número (ej: 3/6) |
  | Monto | Monto de esa cuota |
  | Fecha Esperada | Cuándo debería aplicarse |
  | Fecha Aplicación | Cuándo se aplicó realmente |
  | Estado | Pendiente/Aplicado/Cancelado |
  | Nómina | Nómina donde se aplicó (con link) |

---

## ❌ Cancelar una Cuota

### Cuándo Cancelar
- Cuando el empleado liquida el préstamo
- Cuando se elimina el acuerdo
- Por error en la creación

### Cómo Cancelar
1. En el listado, hacer clic en menú de acciones (⋮)
2. Seleccionar "Cancelar Cuota"
3. Confirmar la acción

### Importante
- ✅ Solo cancela cuotas **pendientes**
- ❌ Las cuotas ya aplicadas permanecen en la nómina
- ℹ️ Las cuotas canceladas no se pueden reactivar

---

## 📊 Estados de las Cuotas

### Cuota Principal
| Estado | Descripción |
|--------|-------------|
| **Activo** | Tiene cuotas pendientes por aplicar |
| **Completado** | Todas las cuotas fueron aplicadas |
| **Cancelado** | Fue cancelada por el usuario |

### Cuota Detalle
| Estado | Descripción |
|--------|-------------|
| **Pendiente** | Aún no se ha aplicado en ninguna nómina |
| **Aplicado** | Ya fue aplicado en una nómina |
| **Cancelado** | Fue cancelado antes de aplicarse |

---

## ⚠️ Consideraciones Importantes

### 1. Fechas de las Cuotas
- Se calculan automáticamente cada 15 días
- Comienzan desde la "Fecha de Inicio"
- Ejemplo: Inicio 15-feb → 15-feb, 1-mar, 15-mar, 1-abr...

### 2. Nóminas Futuras
- **NO es necesario** que las nóminas futuras existan
- Las cuotas se crean hoy para nóminas de los próximos meses
- Se aplicarán automáticamente cuando se creen esas nóminas

### 3. Orden de Nóminas
- Puedes crear nóminas en cualquier orden
- Retroactivas, salteadas, fuera de secuencia
- Las cuotas siempre se aplican según su fecha esperada

### 4. Redondeo
- Si hay decimales, la última cuota se ajusta
- Ejemplo: RD$1,000 / 3 = RD$333.33, RD$333.33, RD$333.34

### 5. Nóminas Cerradas
- No se pueden mover cuotas de nóminas cerradas
- Las cuotas aplicadas quedan registradas permanentemente

---

## 🔍 Consultas Útiles

### Ver todas las cuotas de un empleado
```sql
SELECT * FROM no_cuotas WHERE id_empleado = 123;
```

### Ver cuotas pendientes por aplicar
```sql
SELECT
  e.nombres,
  e.apellidos,
  c.descripcion,
  cd.numero_cuota,
  cd.monto,
  cd.fecha_esperada_aplicacion
FROM no_cuotas_detalle cd
JOIN no_cuotas c ON cd.id_cuota = c.id_cuota
JOIN rh_empleado e ON c.id_empleado = e.id_empleado
WHERE cd.estado = 'pendiente'
  AND c.estado = 'activo'
ORDER BY e.apellidos, cd.fecha_esperada_aplicacion;
```

### Ver cuotas vencidas (fechas pasadas sin aplicar)
```sql
SELECT
  e.nombres,
  c.descripcion,
  cd.fecha_esperada_aplicacion,
  DATEDIFF(CURDATE(), cd.fecha_esperada_aplicacion) as dias_vencidos
FROM no_cuotas_detalle cd
JOIN no_cuotas c ON cd.id_cuota = c.id_cuota
JOIN rh_empleado e ON c.id_empleado = e.id_empleado
WHERE cd.estado = 'pendiente'
  AND cd.fecha_esperada_aplicacion < CURDATE();
```

---

## 🐛 Solución de Problemas

### Problema: La cuota no aparece en la nómina
**Posibles causas:**
1. ✅ Verificar que la fecha de la nómina incluya la fecha esperada de la cuota
2. ✅ Confirmar que la cuota esté en estado "Activo"
3. ✅ Asegurarse de haber recalculado la nómina después de crear la cuota
4. ✅ Revisar que el empleado esté en la nómina

**Solución:**
- Ir a la nómina → Hacer clic en "Recalcular"
- El sistema aplicará todas las cuotas pendientes correspondientes

### Problema: No puedo cancelar una cuota
**Causa:** La cuota ya tiene cuotas aplicadas

**Solución:**
- No se puede cancelar completamente
- Las cuotas aplicadas permanecen
- Solo se cancelan las pendientes

### Problema: El monto por cuota no es exacto
**Causa:** Redondeo automático

**Explicación:**
- Esto es normal y esperado
- La última cuota se ajusta para que sume exacto
- Ejemplo: RD$1,000 / 3 = RD$333.33 + RD$333.33 + RD$333.34 = RD$1,000

---

## 📱 Endpoints API (Uso Avanzado)

### Para Integraciones Externas

```javascript
// Crear cuota
POST /api/cuotas
Body: {
  id_empleado: 25,
  id_tipo_desc_cred: 3,
  descripcion: "Préstamo personal",
  monto_total: 6000,
  cantidad_cuotas: 6,
  fecha_inicio: "2025-02-15"
}

// Listar cuotas activas
GET /api/cuotas/activas

// Obtener cuotas de un empleado
GET /api/cuotas/empleado/25

// Ver detalle de una cuota
GET /api/cuotas/456

// Cancelar cuota
PUT /api/cuotas/456/cancelar

// Obtener cuotas vencidas
GET /api/cuotas/vencidas
```

---

## ✅ Checklist de Validación

Antes de usar en producción, verificar:

- [ ] Backend iniciado correctamente
- [ ] Frontend iniciado correctamente
- [ ] Tablas `no_cuotas` y `no_cuotas_detalle` creadas
- [ ] Login funcional
- [ ] Menú "Cuotas" visible en Payroll
- [ ] Formulario de crear cuota funciona
- [ ] Cálculo automático de monto por cuota correcto
- [ ] Cuotas se aplican al recalcular nómina
- [ ] Detalle de cuota muestra historial completo
- [ ] Cancelación de cuotas funciona

---

## 📞 Soporte

### Archivos de Referencia
- **Plan completo:** `PLAN_IMPLEMENTACION_CUOTAS.md`
- **Resumen técnico:** `RESUMEN_IMPLEMENTACION_CUOTAS.md`

### Logs y Debugging
- Backend: Revisar consola de Node.js
- Frontend: Revisar DevTools del navegador (F12)
- Base de datos: Revisar logs de MySQL

---

**Fecha de implementación:** 2025-10-04
**Versión:** 1.0
**Estado:** ✅ Completo y funcional
