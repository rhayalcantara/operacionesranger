# Plan de Modificación: Componente Nomina-Detalle

## Objetivo
Modificar el componente `nomina-detalle` para:
1. Mostrar todos los campos `desc_cred` (descuentos/créditos) en la vista
2. Utilizar todo el espacio disponible en pantalla

---

## Análisis del Estado Actual

### Archivos involucrados:
- `src/app/components/nomina/nomina-detalle/nomina-detalle.ts`
- `src/app/components/nomina/nomina-detalle/nomina-detalle.html`
- `src/app/components/nomina/nomina-detalle/nomina-detalle.css`

### Problemas identificados:
1. **Contenedor limitado**: CSS actual tiene `.container { width: 70% }` - desperdicia 30% del espacio
2. **Spinner overlay fijo**: Usa dimensiones fijas `1440px x 900px` que no son responsivas
3. **Columnas de descuentos limitadas**: Solo muestra `desc_isr`, `desc_afp`, `desc_sfs`, `desc_otros`
4. **No muestra desc_cred dinámicos**: Los descuentos/créditos manuales (préstamos, cooperativas, cuotas, etc.) no se visualizan individualmente

### Columnas actuales (17):
```typescript
displayedColumns: string[] = [
  'nombreCompleto', 'departamento', 'sueldo_nomina', 'he15', 'he35',
  'monto_horas_extra_diurnas', 'monto_horas_extra_nocturnas', 'vacaciones',
  'otros_ingresos', 'total_ingreso', 'desc_isr', 'desc_afp', 'desc_sfs',
  'desc_otros', 'total_descuento', 'total_pagar', 'acciones'
];
```

---

## Plan de Implementación

### TAREA 1: Expandir contenedor al 100% del espacio disponible
**Archivo:** `nomina-detalle.css`

**Cambios:**
- Cambiar `.container { width: 70% }` a `width: 100%`
- Cambiar `.spinner-overlay` para usar dimensiones relativas (`100%`) en lugar de fijas
- Agregar padding lateral apropiado

### TAREA 2: Agregar servicio de desc_cred para obtener conceptos dinámicos
**Archivo:** `nomina-detalle.ts`

**Cambios:**
- Importar `NoDescCredService` para obtener la lista de conceptos de descuentos/créditos
- Agregar método para cargar los conceptos de desc_cred disponibles
- Crear estructura para mapear desc_cred dinámicos a columnas

### TAREA 3: Modificar la carga de datos para incluir desglose de desc_cred
**Archivo:** `nomina-detalle.ts`

**Cambios:**
- Modificar `cargarDetallesNomina()` para solicitar el desglose de desc_cred por empleado
- Crear interfaz para el desglose de descuentos/créditos
- Agregar columnas dinámicas basadas en los desc_cred existentes en la nómina

### TAREA 4: Actualizar la vista HTML con columnas de desc_cred
**Archivo:** `nomina-detalle.html`

**Cambios:**
- Agregar columnas dinámicas para cada tipo de desc_cred
- Usar `*ngFor` para generar columnas basadas en los conceptos disponibles
- Mantener la columna fija (nombre) con sticky positioning

### TAREA 5: Optimizar estilos para tabla más ancha
**Archivo:** `nomina-detalle.css`

**Cambios:**
- Ajustar anchos de columnas para acomodar más campos
- Mejorar el scroll horizontal con indicadores visuales
- Opcional: Agrupar columnas visualmente (Ingresos | Descuentos de Ley | Otros Descuentos | Totales)

---

## Lista de Tareas

| #  | Tarea | Estado | Archivo |
|----|-------|--------|---------|
| 1  | Expandir `.container` a `width: 100%` | Pendiente | nomina-detalle.css |
| 2  | Corregir spinner-overlay a dimensiones responsivas | Pendiente | nomina-detalle.css |
| 3  | Importar NoDescCredService | Pendiente | nomina-detalle.ts |
| 4  | Agregar carga de conceptos desc_cred | Pendiente | nomina-detalle.ts |
| 5  | Crear columnas dinámicas para desc_cred | Pendiente | nomina-detalle.ts |
| 6  | Actualizar displayedColumns con desc_cred | Pendiente | nomina-detalle.ts |
| 7  | Agregar definiciones de columnas dinámicas en HTML | Pendiente | nomina-detalle.html |
| 8  | Agregar estilos para agrupación visual de columnas | Pendiente | nomina-detalle.css |
| 9  | Probar responsividad en diferentes resoluciones | Pendiente | - |

---

## Estructura de Columnas Propuesta

### Grupo 1: Identificación
- Nombre Completo (sticky)
- Departamento

### Grupo 2: Ingresos
- Sueldo Bruto
- HE 15%
- HE 35%
- Horas Diurnas
- Horas Nocturnas
- Vacaciones
- Otros Ingresos
- **Total Ingresos**

### Grupo 3: Descuentos de Ley
- ISR
- AFP
- SFS

### Grupo 4: Otros Descuentos (dinámicos - desc_cred)
- Préstamos
- Cooperativa
- Seguros
- Cuotas
- [Otros conceptos configurados en no_desc_cred]

### Grupo 5: Totales
- **Total Descuentos**
- **Total a Pagar**

### Grupo 6: Acciones
- Ver Volante

---

## Notas Técnicas

1. El backend ya maneja los `desc_cred` en la tabla `no_desc_cred_nomina`
2. El servicio `DescCredNominaService` puede usarse para obtener los conceptos
3. Se recomienda que el endpoint `/no_nomina/{id}` devuelva el desglose de desc_cred por empleado
4. Considerar agregar tooltips en cabeceras de columnas abreviadas

---

## Análisis del Backend (Actualizado 2025-12-30)

### Tablas de Base de Datos

#### Tabla: `no_desc_cred` (Catálogo de Conceptos)
Almacena los tipos de descuentos/créditos disponibles en el sistema.

**Campos clave:**
- `id_desc_cred` (PK): ID del concepto
- `descripcion`: Nombre del concepto (ej: "Préstamos", "Cooperativa", "Horas Extras 15%")
- `origen`: 'I' (Ingreso) o 'D' (Descuento)
- `fijo`: 1 si es descuento de ley (AFP, ARS), 0 si es manual
- `valorporciento`: 'V' (valor fijo) o 'P' (porcentaje)
- `empleado`: Valor o porcentaje configurado
- `maneja_cuotas`: 1 si el concepto maneja cuotas, 0 si no
- `quincena_aplicacion`: 0 (ambas quincenas), 1 (primera), 2 (segunda)

#### Tabla: `no_desc_cred_nomina`
Almacena los registros individuales de descuentos/créditos por empleado en una nómina específica.

**Campos clave:**
- `id_desc_cred_nomina` (PK): ID del registro
- `id_nomina` (FK): ID de la nómina
- `codigo_empleado` (FK): ID del empleado
- `id_desc_cred` (FK): Referencia al concepto en `no_desc_cred`
- `descripcion`: Descripción específica (útil para cuotas: "Préstamo - Cuota 1/12")
- `valor`: Monto del descuento/crédito
- `fecha`: Fecha del registro
- `automanual`: 'A' (automático), 'M' (manual), 'I' (importado)

**Relación:** Un empleado puede tener múltiples registros de diferentes conceptos en una misma nómina.

#### Tabla: `no_det_nomina` (Detalle de Nómina)
Almacena el resumen calculado por empleado en una nómina.

**Campos relevantes para visualización:**
- Identificación: `id_empleado`, `nombreCompleto`, `departamento`
- Ingresos: `sueldo_nomina`, `he15`, `he35`, `vacaciones`, `otros_ingresos`, `total_ingreso`
- Descuentos de ley: `desc_afp`, `desc_sfs`, `desc_isr`
- Totales: `desc_otros` (suma de desc_cred manuales), `total_descuento`, `total_pagar`

**Importante:** Los campos `he15`, `he35` contienen el **monto calculado** de horas extras, NO las horas. Los desc_cred manuales se suman en `desc_otros`.

### Endpoints Disponibles en el Backend

#### 1. GET `/api/no-nomina/:id/detalles`
**Parámetros de query:**
- `page`: Número de página (default: 1)
- `pageSize`: Tamaño de página (default: 10)
- `search`: Término de búsqueda

**Respuesta:**
```json
{
  "detalles": [
    {
      "id_empleado": 123,
      "nombreCompleto": "Juan Pérez",
      "departamento": "Operaciones",
      "sueldo_nomina": 25000,
      "he15": 1500,
      "he35": 2000,
      "vacaciones": 0,
      "otros_ingresos": 500,
      "total_ingreso": 29000,
      "desc_afp": 717.25,
      "desc_sfs": 760,
      "desc_isr": 1200,
      "desc_otros": 3000,
      "total_descuento": 5677.25,
      "total_pagar": 23322.75
    }
  ],
  "total": 150
}
```

**Limitación:** Este endpoint NO devuelve el desglose de `desc_otros` por concepto. Solo muestra el total.

#### 2. GET `/api/no-nomina/:id/todos-los-detalles`
Igual que el anterior pero SIN paginación. Devuelve todos los empleados de la nómina.

#### 3. GET `/api/desc-cred-nomina/:nominaId`
**Parámetros de query:**
- `page`, `pageSize`, `searchTerm`

**Respuesta:**
```json
{
  "detalles": [
    {
      "id": 456,
      "codigo_empleado": 123,
      "nombre_completo": "Juan Pérez",
      "id_desc_cred": 10,
      "descripcion_concepto": "Préstamos",
      "valor": 1500,
      "fecha": "2025-01-15",
      "automanual": "M"
    }
  ],
  "total": 45,
  "nominaActiva": true
}
```

**Uso:** Devuelve TODOS los desc_cred de la nómina (manual, automáticos, importados), con información del empleado.

#### 4. GET `/api/desc-cred-nomina/reporte-agrupado/:nominaId` ⭐ **ENDPOINT CLAVE**
Este endpoint devuelve un reporte completo agrupado por tipo de concepto.

**Respuesta:**
```json
{
  "ingresos": {
    "grupos": [
      {
        "descripcion_concepto": "Horas Extras 15%",
        "id_desc_cred": 6,
        "tipo": "I",
        "detalles": [
          {
            "codigo_empleado": 123,
            "nombre_completo": "Juan Pérez",
            "fecha": "2025-01-15",
            "valor": 1500
          }
        ],
        "subtotal": {
          "valor": 1500,
          "cantidadEmpleados": 1,
          "cantidadRegistros": 1
        }
      }
    ],
    "subtotal": {
      "valor": 15000,
      "cantidadTipos": 3,
      "cantidadRegistros": 45
    }
  },
  "descuentos": {
    "grupos": [
      {
        "descripcion_concepto": "Préstamos",
        "id_desc_cred": 10,
        "tipo": "D",
        "detalles": [...],
        "subtotal": {...}
      }
    ],
    "subtotal": {...}
  }
}
```

**Ventaja:** Ya viene agrupado por concepto y tipo (Ingreso/Descuento).

#### 5. GET `/api/no-desc-cred/selector`
Devuelve el catálogo completo de conceptos disponibles.

**Respuesta:**
```json
[
  {
    "id_desc_cred": 5,
    "descripcion": "Horas Extras 35%",
    "origen": "I",
    "fijo": 0,
    "valorporciento": "V",
    "empleado": 0,
    "maneja_cuotas": 0
  }
]
```

### Modelos y Métodos Disponibles

#### `nominaModel.js`

**Métodos clave:**
- `getNominaDetails(nominaId, { page, pageSize, search })` - backend-ranger-nomina/models/nominaModel.js:91
- `getAllNominaDetails(nominaId)` - backend-ranger-nomina/models/nominaModel.js:159
- `recalcular(nominaId)` - backend-ranger-nomina/models/nominaModel.js:706 (Recalcula todos los totales)

#### `descCredNominaModel.js`

**Métodos clave:**
- `getByNominaId(nominaId)` - backend-ranger-nomina/models/descCredNominaModel.js:51
- `getByNominaIdWithDetails({ nominaId, page, pageSize, searchTerm })` - backend-ranger-nomina/models/descCredNominaModel.js:88
- `getReporteAgrupadoIngresosDescuentos({ nominaId })` - backend-ranger-nomina/models/descCredNominaModel.js:313 ⭐ **MÉTODO CLAVE**

## Propuesta de Implementación Detallada

### OPCIÓN 1: Usar Endpoint Existente `reporte-agrupado` (RECOMENDADA) ⭐

**Ventajas:**
- ✅ No requiere cambios en el backend
- ✅ Ya devuelve los datos agrupados por concepto
- ✅ Incluye totales y subtotales calculados
- ✅ Menos trabajo de procesamiento en el frontend

**Desventajas:**
- ❌ Devuelve TODOS los registros (no paginado)
- ❌ Requiere transformar la estructura para la tabla

**Implementación:**

1. **Frontend - nomina-detalle.component.ts:**
   ```typescript
   // Llamar al endpoint reporte-agrupado
   this.descCredNominaService.getReporteAgrupado(id_nomina).subscribe(reporte => {
     // Transformar los grupos a columnas dinámicas
     this.conceptosIngresos = reporte.ingresos.grupos.map(g => ({
       id: g.id_desc_cred,
       descripcion: g.descripcion_concepto,
       tipo: 'I'
     }));

     this.conceptosDescuentos = reporte.descuentos.grupos.map(g => ({
       id: g.id_desc_cred,
       descripcion: g.descripcion_concepto,
       tipo: 'D'
     }));

     // Construir displayedColumns dinámicamente
     this.displayedColumns = [
       'nombreCompleto', 'departamento',
       // Ingresos base
       'sueldo_nomina', 'vacaciones',
       // Ingresos dinámicos
       ...this.conceptosIngresos.map(c => `ing_${c.id}`),
       'total_ingreso',
       // Descuentos de ley
       'desc_afp', 'desc_sfs', 'desc_isr',
       // Descuentos dinámicos
       ...this.conceptosDescuentos.map(c => `desc_${c.id}`),
       'total_descuento', 'total_pagar', 'acciones'
     ];

     // Mapear datos de empleados con desc_cred
     this.detalles = this.mapearEmpleadosConDescCred(empleados, reporte);
   });
   ```

2. **Función de mapeo:**
   ```typescript
   mapearEmpleadosConDescCred(empleados, reporte) {
     return empleados.map(emp => {
       const empleadoConDescCred = { ...emp };

       // Mapear ingresos
       reporte.ingresos.grupos.forEach(grupo => {
         const detalle = grupo.detalles.find(d => d.codigo_empleado === emp.id_empleado);
         empleadoConDescCred[`ing_${grupo.id_desc_cred}`] = detalle ? detalle.valor : 0;
       });

       // Mapear descuentos
       reporte.descuentos.grupos.forEach(grupo => {
         const detalle = grupo.detalles.find(d => d.codigo_empleado === emp.id_empleado);
         empleadoConDescCred[`desc_${grupo.id_desc_cred}`] = detalle ? detalle.valor : 0;
       });

       return empleadoConDescCred;
     });
   }
   ```

3. **Template - nomina-detalle.component.html:**
   ```html
   <!-- Columnas dinámicas de ingresos -->
   <ng-container *ngFor="let concepto of conceptosIngresos" [matColumnDef]="'ing_' + concepto.id">
     <th mat-header-cell *matHeaderCellDef>{{ concepto.descripcion }}</th>
     <td mat-cell *matCellDef="let empleado">
       {{ empleado['ing_' + concepto.id] | currency:'DOP':'symbol':'1.2-2' }}
     </td>
   </ng-container>

   <!-- Columnas dinámicas de descuentos -->
   <ng-container *ngFor="let concepto of conceptosDescuentos" [matColumnDef]="'desc_' + concepto.id">
     <th mat-header-cell *matHeaderCellDef>{{ concepto.descripcion }}</th>
     <td mat-cell *matCellDef="let empleado">
       {{ empleado['desc_' + concepto.id] | currency:'DOP':'symbol':'1.2-2' }}
     </td>
   </ng-container>
   ```

### OPCIÓN 2: Crear Nuevo Endpoint Optimizado (Si se requiere paginación)

**Ventajas:**
- ✅ Soporta paginación
- ✅ Devuelve estructura ya preparada para la tabla
- ✅ Mejor rendimiento con muchos empleados

**Desventajas:**
- ❌ Requiere modificar el backend
- ❌ Más tiempo de implementación

**Backend - Nuevo método en nominaModel.js:**
```javascript
static async getDetallesConDescCredDesglosado(nominaId, { page = 1, pageSize = 10, search = '' }) {
  let connection;
  try {
    connection = await db.getConnection();

    // 1. Obtener empleados paginados
    const empleados = await this.getNominaDetails(nominaId, { page, pageSize, search });

    // 2. Obtener todos los desc_cred de esta nómina
    const [descCredRecords] = await connection.query(
      `SELECT dcn.codigo_empleado, dcn.id_desc_cred, dc.descripcion, dcn.valor, dc.origen
       FROM no_desc_cred_nomina dcn
       JOIN no_desc_cred dc ON dcn.id_desc_cred = dc.id_desc_cred
       WHERE dcn.id_nomina = ?`,
      [nominaId]
    );

    // 3. Obtener conceptos únicos
    const conceptosUnicos = [...new Set(descCredRecords.map(r => r.id_desc_cred))]
      .map(id => {
        const record = descCredRecords.find(r => r.id_desc_cred === id);
        return {
          id_desc_cred: id,
          descripcion: record.descripcion,
          origen: record.origen
        };
      });

    // 4. Mapear desc_cred a cada empleado
    const detallesConDescCred = empleados.detalles.map(emp => {
      const empleadoConDescCred = { ...emp };

      conceptosUnicos.forEach(concepto => {
        const registro = descCredRecords.find(
          r => r.codigo_empleado === emp.id_empleado && r.id_desc_cred === concepto.id_desc_cred
        );
        const columnKey = concepto.origen === 'I' ? `ing_${concepto.id_desc_cred}` : `desc_${concepto.id_desc_cred}`;
        empleadoConDescCred[columnKey] = registro ? registro.valor : 0;
      });

      return empleadoConDescCred;
    });

    return {
      detalles: detallesConDescCred,
      total: empleados.total,
      conceptos: conceptosUnicos
    };
  } finally {
    if (connection) connection.release();
  }
}
```

**Backend - Nueva ruta en routes/no_nomina.js:**
```javascript
router.get('/:id/detalles-completos', async (req, res, next) => {
  const { id } = req.params;
  const { page = 1, pageSize = 10, search = '' } = req.query;
  try {
    const result = await Nomina.getDetallesConDescCredDesglosado(id, { page, pageSize, search });
    res.json(result);
  } catch (err) {
    next(err);
  }
});
```

## Recomendación Final

**Utilizar OPCIÓN 1** con el endpoint `reporte-agrupado` existente porque:

1. ✅ **Cero cambios en el backend** - Funcionalidad ya existe
2. ✅ **Implementación más rápida** - Solo frontend
3. ✅ **Datos ya estructurados** - Agrupados por concepto
4. ✅ **Menos código** - Reutilización de lógica existente

**Consideraciones:**
- Si la nómina tiene más de 500 empleados, considerar OPCIÓN 2 para paginación
- El mapeo de datos se hace en el frontend, pero es eficiente con RxJS

---

## Dependencias del Backend

**ACTUALIZACIÓN:** El backend YA tiene toda la funcionalidad necesaria:

✅ **Endpoint disponible:** GET `/api/desc-cred-nomina/reporte-agrupado/:nominaId`
✅ **Modelo implementado:** `descCredNominaModel.getReporteAgrupadoIngresosDescuentos()`
✅ **Datos completos:** Incluye AFP, ARS, ISR, y todos los desc_cred manuales

**NO SE REQUIEREN CAMBIOS EN EL BACKEND** para implementar esta funcionalidad con la Opción 1 recomendada.

---

*Fecha de creación: 2025-12-29*
*Fecha de actualización: 2025-12-30*
*Estado: Listo para implementación (usando endpoint existente)*
