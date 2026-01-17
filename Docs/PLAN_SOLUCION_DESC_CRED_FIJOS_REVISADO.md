# Plan de Solución: Problema con Descuentos/Créditos Fijos - REVISADO

**Fecha**: 2025-10-20
**Responsable**: Desarrollo Ranger Nómina
**Prioridad**: Alta

---

## 1. ANÁLISIS PROFUNDO DEL PROBLEMA

### 1.1 Investigación Realizada

Basándome en el análisis exhaustivo del código y las tablas de la base de datos `db_aae4a2_ranger`, he identificado lo siguiente:

#### Hallazgos Clave:

1. **AFP y SFS NO se almacenan en `no_desc_cred_nomina`**
   - Se calculan directamente en `nominaModel.recalcular()` (líneas 855-904)
   - Se escriben directamente en los campos `desc_afp` y `desc_sfs` de `no_det_nomina`
   - NO pasan por la tabla `no_desc_cred_nomina`

2. **La tabla `no_desc_cred_auto` está vacía**
   - No hay registros configurados para ningún empleado
   - Esta es la raíz del problema: los items "fijos" NO se están asignando a empleados

3. **Estructura de `no_desc_cred`**:
   ```
   id=1: SFS (fijo=1, origen=D, valorporciento=P, empleado=3.04%, tope=229908)
   id=2: AFP (fijo=1, origen=D, valorporciento=P, empleado=2.87%, tope=433496)
   id=10: Seguro de Vida (fijo=0, origen=I, valorporciento=V)
   ```

4. **Problema real identificado**:
   - El flag `fijo=1` en `no_desc_cred` marca AFP y SFS
   - Pero "fijo" NO significa "se debe asignar automáticamente a todos"
   - Significa "se calcula de forma especial (hardcoded) en el recálculo"
   - Otros items como "Seguro de Vida" tienen `fijo=0` pero podrían asignarse manualmente

### 1.2 Flujo Actual del Recálculo

```
Nomina.recalcular(nominaId)
│
├─► [PASO 1] Obtener empleados de rh_emplado_nomina
│
├─► [PASO 2] Para cada empleado:
│   │
│   ├─► Calcular AFP (HARDCODED, líneas 864-883)
│   │   - Lee config de no_desc_cred (tope, porcentaje)
│   │   - Calcula: (salario * 2.87%) / 2
│   │   - Escribe en desc_afp de no_det_nomina
│   │
│   ├─► Calcular SFS (HARDCODED, líneas 885-904)
│   │   - Lee config de no_desc_cred (tope, porcentaje)
│   │   - Calcula: (salario * 3.04%) / 2
│   │   - Escribe en desc_sfs de no_det_nomina
│   │
│   ├─► Leer otros movimientos de no_desc_cred_nomina (líneas 906-917)
│   │   - Suma otros_ingresos (origen != 'D')
│   │   - Suma otros_descuentos (origen = 'D')
│   │   - AQUÍ es donde deberían aparecer items como "Seguro de Vida"
│   │   - PERO NO HAY REGISTROS porque no_desc_cred_auto está vacío
│   │
│   └─► Calcular ISR, actualizar no_det_nomina
│
└─► [PASO 3] Actualizar totales de la nómina
```

### 1.3 Problema Confirmado

**El verdadero problema**: La interfaz no permite asignar items de `no_desc_cred` a empleados específicos en `no_desc_cred_auto`.

**Consecuencia**:
- `_generarCargosAutomaticos()` (líneas 249-264) lee de `no_desc_cred_auto`
- Como la tabla está vacía, NO se insertan items en `no_desc_cred_nomina`
- AFP/SFS se calculan correctamente (hardcoded)
- Pero otros items como "Seguro de Vida" nunca se aplican

---

## 2. SOLUCIÓN CORRECTA

### 2.1 Arquitectura Revisada

La solución correcta es **mucho más simple** que la original:

#### Items en el Sistema:

1. **AFP y SFS** (`fijo=1`, `origen=D`)
   - Se calculan automáticamente en `recalcular()`
   - NO se deben mostrar en la pestaña "Ingresos/Descuentos Fijos"
   - NO se almacenan en `no_desc_cred_auto` ni `no_desc_cred_nomina`
   - Se escriben directamente en `desc_afp` y `desc_sfs` de `no_det_nomina`

2. **Items Configurables** (como "Seguro de Vida", "Comida", etc.)
   - Se deben poder asignar a empleados específicos
   - Se almacenan en `no_desc_cred_auto`
   - `_generarCargosAutomaticos()` los copia a `no_desc_cred_nomina`
   - El query de línea 906-917 los suma como `otros_descuentos` o `otros_ingresos`

### 2.2 Cambio Fundamental

**NO necesitamos agregar el campo `es_calculado`** a la base de datos.

En su lugar, usaremos la lógica existente:
- Items con `fijo=1` → Solo lectura, se calculan automáticamente (AFP, SFS)
- Items con `fijo=0` → Configurables, se pueden asignar a empleados

---

## 3. IMPLEMENTACIÓN SIMPLIFICADA

### 3.1 FASE 1: Frontend - Actualizar Formulario de Empleado

#### 3.1.1 Modificar `employee-form.ts`

**Cambios mínimos**:

1. **Cargar items configurables** al abrir la pestaña:

```typescript
loadIngresosDescuentosEmpleado(): void {
  const id_empleado = this.employeeForm.get('id_empleado')?.value;

  if (!id_empleado) {
    // Nuevo empleado: mostrar lista vacía
    this.ingresosDescuentos = [];
    return;
  }

  // Cargar items existentes del empleado
  this.employeeService.getEmployeeIngresosDescuentos(id_empleado).subscribe(items => {
    this.ingresosDescuentos = items.map(item => ({
      id_desc_cred: item.id_desc_cred,
      descripcion: item.desc_cred_desc || item.descripcion,
      valor: item.valor,
      quincena: item.numero_de_quincena || 0
    }));
  });
}
```

2. **Modificar `onAddIngresoDescuento()` para filtrar items fijos**:

```typescript
onAddIngresoDescuento(): void {
  const dialogRef = this.dialog.open(NoDescCredSearchDialogComponent, {
    width: '600px',
    data: { excluirFijos: true } // Nuevo parámetro
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      const selectedItem: NoDescCred = result;

      // Validar que no sea un item fijo (AFP, SFS)
      if (selectedItem.fijo === 1) {
        this.notificationService.showError(
          `${selectedItem.descripcion} es un descuento de ley y se calcula automáticamente.`
        );
        return;
      }

      // Validar que no esté duplicado
      const yaExiste = this.ingresosDescuentos.some(
        item => item.id_desc_cred === selectedItem.id_desc_cred
      );

      if (yaExiste) {
        this.notificationService.showError(
          `${selectedItem.descripcion} ya está asignado a este empleado.`
        );
        return;
      }

      // Calcular valor inicial
      let valorInicial = 0;
      if (selectedItem.valorporciento === 'V') {
        valorInicial = selectedItem.empleado || 0;
      }

      // Agregar a la lista
      this.ingresosDescuentos.push({
        id_desc_cred: selectedItem.id_desc_cred || 0,
        descripcion: selectedItem.descripcion,
        valor: valorInicial,
        quincena: 0
      });
    }
  });
}
```

3. **Agregar método para eliminar**:

```typescript
onRemoveIngresoDescuento(index: number): void {
  this.ingresosDescuentos.splice(index, 1);
}
```

4. **Modificar `ngOnInit()` para cargar items**:

```typescript
ngOnInit(): void {
  this.userLevel = this.userService.getUserLevel();
  const id = this.route.snapshot.paramMap.get('id');

  // ... código existente ...

  if (id) {
    this.employeeService.getEmployee(+id).subscribe(employee => {
      if (employee) {
        this.employeeForm.patchValue(employee);

        // Cargar ingresos/descuentos del empleado
        this.loadIngresosDescuentosEmpleado();

        // ... resto del código ...
      }
    });
  }
}
```

#### 3.1.2 Modificar `employee-form.html`

**Actualizar la pestaña "Ingresos/Descuentos Fijos"** (líneas 256-282):

```html
<!-- Contenido de la pestaña Ingresos/Descuentos -->
<div class="tab-content" *ngIf="activeTab === 'ingresos'">

  <!-- Nota informativa -->
  <div class="info-box">
    <mat-icon>info</mat-icon>
    <p>
      Los descuentos de ley (AFP, SFS) se calculan automáticamente en la nómina.
      Aquí puede configurar otros ingresos o descuentos fijos para este empleado.
    </p>
  </div>

  <!-- Botón para agregar -->
  <button type="button" mat-raised-button color="primary" class="add-button" (click)="onAddIngresoDescuento()">
    <mat-icon>add</mat-icon> Añadir Ingreso/Descuento
  </button>

  <!-- Tabla editable -->
  <div class="ingresos-table">
    <table class="data-table">
      <thead>
        <tr>
          <th>CÓDIGO</th>
          <th>DESCRIPCIÓN</th>
          <th>TIPO</th>
          <th>VALOR</th>
          <th>QUINCENA</th>
          <th>ACCIONES</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let item of ingresosDescuentos; let i = index">
          <td>{{ item.id_desc_cred }}</td>
          <td>{{ item.descripcion }}</td>
          <td>
            <span class="badge" [class.badge-ingreso]="item.origen === 'I'" [class.badge-descuento]="item.origen === 'D'">
              {{ item.origen === 'I' ? 'Ingreso' : 'Descuento' }}
            </span>
          </td>
          <td>
            <input type="number"
                   class="value-input"
                   [(ngModel)]="item.valor"
                   [ngModelOptions]="{standalone: true}"
                   step="0.01"
                   min="0"
                   placeholder="0.00">
          </td>
          <td>
            <select class="quincena-select"
                    [(ngModel)]="item.quincena"
                    [ngModelOptions]="{standalone: true}">
              <option value="0">Ambas</option>
              <option value="1">Primera</option>
              <option value="2">Segunda</option>
            </select>
          </td>
          <td>
            <button type="button"
                    mat-icon-button
                    color="warn"
                    (click)="onRemoveIngresoDescuento(i)"
                    title="Eliminar">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </tr>
        <tr *ngIf="ingresosDescuentos.length === 0">
          <td colspan="6" class="no-data">
            No hay ingresos/descuentos configurados para este empleado.
            <br>
            <small>Haga clic en "Añadir Ingreso/Descuento" para agregar uno.</small>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

#### 3.1.3 Actualizar `employee-form.css`

```css
/* Caja de información */
.info-box {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  background-color: #e3f2fd;
  border-left: 4px solid #2196f3;
  border-radius: 4px;
}

.info-box mat-icon {
  color: #2196f3;
  font-size: 24px;
  width: 24px;
  height: 24px;
}

.info-box p {
  margin: 0;
  color: #1565c0;
  font-size: 0.9rem;
  line-height: 1.5;
}

/* Botón agregar */
.add-button {
  margin-bottom: 1rem;
}

/* Input de valor */
.value-input {
  width: 100%;
  max-width: 120px;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  text-align: right;
}

.value-input:focus {
  outline: none;
  border-color: #3f51b5;
}

/* Select de quincena */
.quincena-select {
  width: 100%;
  max-width: 100px;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.quincena-select:focus {
  outline: none;
  border-color: #3f51b5;
}

/* Badges */
.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-ingreso {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.badge-descuento {
  background-color: #ffebee;
  color: #c62828;
}

/* Sin datos */
.no-data {
  text-align: center;
  padding: 3rem !important;
  color: #999;
}

.no-data small {
  font-size: 0.85rem;
  color: #bbb;
}

/* Tabla responsiva */
.ingresos-table {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.data-table th,
.data-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.data-table th {
  background-color: #f5f5f5;
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
  color: #666;
}

.data-table tbody tr:hover {
  background-color: #fafafa;
}
```

#### 3.1.4 Actualizar `employee.service.ts`

```typescript
getEmployeeIngresosDescuentos(id: number): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/${id}/ingresos-descuentos`);
}

updateEmployeeWithIngresosDescuentos(id: number, employeeData: Employee, ingresosDescuentos: any[]): Observable<any> {
  return this.updateEmployee(id, employeeData).pipe(
    switchMap(() => {
      return this.http.post(`${this.apiUrl}/${id}/ingresos-descuentos`, ingresosDescuentos);
    })
  );
}
```

---

### 3.2 FASE 2: Backend - Validaciones

#### 3.2.1 Actualizar `routes/ingresos_descuentos.js`

**Agregar validación para NO permitir AFP/SFS**:

```javascript
router.post('/:id/ingresos-descuentos', async (req, res) => {
    const { id } = req.params;
    const ingresosDescuentos = req.body;

    if (!Array.isArray(ingresosDescuentos)) {
        return res.status(400).json({ message: 'El cuerpo de la solicitud debe ser un array de ingresos/descuentos.' });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Validar que NO sean items fijos (AFP, SFS)
        const ids = ingresosDescuentos.map(item => item.id_desc_cred);
        if (ids.length > 0) {
            const [itemsFijos] = await connection.execute(
                `SELECT id_desc_cred, descripcion FROM no_desc_cred
                 WHERE id_desc_cred IN (?) AND fijo = 1`,
                [ids]
            );

            if (itemsFijos.length > 0) {
                const descripciones = itemsFijos.map(i => i.descripcion).join(', ');
                throw new Error(`No se pueden asignar manualmente los siguientes items (son calculados automáticamente): ${descripciones}`);
            }
        }

        // 2. Borrar los registros existentes para este empleado
        await connection.execute('DELETE FROM no_desc_cred_auto WHERE id_empleado = ?', [id]);

        // 3. Insertar los nuevos registros
        if (ingresosDescuentos.length > 0) {
            const sql = 'INSERT INTO no_desc_cred_auto (id_empleado, id_desc_cred, descripcion, valor, numero_de_quincena) VALUES ?';
            const values = ingresosDescuentos.map(item => [
                id,
                item.id_desc_cred,
                item.descripcion,
                item.valor || 0,
                item.quincena || 0
            ]);
            await connection.query(sql, [values]);
        }

        await connection.commit();
        res.status(201).json({ message: 'Ingresos y descuentos guardados con éxito' });

    } catch (err) {
        await connection.rollback();
        console.error('Error al guardar ingresos y descuentos:', err);
        res.status(500).json({ message: err.message || 'Error al guardar ingresos y descuentos' });
    } finally {
        connection.release();
    }
});
```

---

### 3.3 FASE 3: Actualizar Dialog de Búsqueda

#### 3.3.1 Modificar `no-desc-cred-search-dialog.component.ts`

```typescript
export class NoDescCredSearchDialogComponent implements OnInit {
  // ... propiedades existentes ...
  excluirFijos: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<NoDescCredSearchDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private noDescCredService: NoDescCredService
  ) {
    this.excluirFijos = data?.excluirFijos || false;
  }

  ngOnInit(): void {
    this.noDescCredService.getNoDescCreds().subscribe((data) => {
      let items = data.data;

      // Filtrar items fijos si se especifica
      if (this.excluirFijos) {
        items = items.filter(item => item.fijo !== 1);
      }

      this.allNoDescCreds = items;
      this.applyFilters();
    });
  }

  // ... resto del código sin cambios ...
}
```

---

## 4. VERIFICACIÓN DEL FLUJO COMPLETO

### 4.1 Flujo de Asignación de Items Fijos

```
1. Usuario abre formulario de empleado
2. Va a pestaña "Ingresos/Descuentos Fijos"
3. Click en "Añadir Ingreso/Descuento"
4. Dialog muestra items (EXCLUYENDO AFP y SFS)
5. Usuario selecciona "Seguro de Vida" (id_desc_cred=10)
6. Usuario ingresa valor: 500
7. Usuario selecciona quincena: "Ambas" (0)
8. Usuario hace click en "Guardar empleado"
9. Backend guarda en no_desc_cred_auto:
   - id_empleado: 123
   - id_desc_cred: 10
   - valor: 500
   - numero_de_quincena: 0
```

### 4.2 Flujo de Aplicación en Nómina

```
1. Usuario crea nómina (quincena 1)
2. Sistema ejecuta _generarCargosAutomaticos():
   - Lee no_desc_cred_auto para empleados de la nómina
   - Inserta en no_desc_cred_nomina:
     * id_nomina: 100
     * codigo_empleado: 123
     * id_desc_cred: 10
     * valor: 500
     * automanual: 'A'
3. Usuario hace click en "Recalcular"
4. Sistema ejecuta recalcular():
   - Calcula AFP (HARDCODED, escribe en desc_afp)
   - Calcula SFS (HARDCODED, escribe en desc_sfs)
   - Lee no_desc_cred_nomina (línea 906-917):
     * Suma otros_descuentos: 500 (Seguro de Vida)
   - Calcula ISR
   - Actualiza no_det_nomina:
     * desc_afp: 1200
     * desc_sfs: 1300
     * desc_otros: 500
     * total_descuento: 3000
```

---

## 5. TABLA DE COMPARACIÓN: PLAN ORIGINAL VS REVISADO

| Aspecto | Plan Original (Incorrecto) | Plan Revisado (Correcto) |
|---------|---------------------------|--------------------------|
| **Campo `es_calculado`** | Agregar a BD | NO necesario, usar `fijo` existente |
| **AFP/SFS en no_desc_cred_nomina** | Se pensaba que sí estaban | Confirmado que NO están (calculados hardcoded) |
| **Complejidad** | Alta (2 secciones, campos nuevos) | Baja (1 sección simple) |
| **Items mostrados en formulario** | AFP/SFS como "solo lectura" + Configurables | Solo configurables |
| **Lógica de cálculo** | Sin cambios | Sin cambios (ya funciona correctamente) |
| **Validación** | Basada en `es_calculado` | Basada en `fijo` existente |
| **Migración de datos** | Necesaria | NO necesaria |
| **Tiempo de implementación** | 13.5 horas | 6 horas |

---

## 6. RESUMEN DE CAMBIOS POR ARCHIVO

### Frontend

| Archivo | Cambios | Líneas Aprox. |
|---------|---------|---------------|
| `employee-form.ts` | Cargar items, validar fijos, eliminar | 60 |
| `employee-form.html` | Tabla editable con inputs | 50 |
| `employee-form.css` | Estilos para tabla e inputs | 80 |
| `employee.service.ts` | Método `updateEmployeeWithIngresosDescuentos()` | 10 |
| `no-desc-cred-search-dialog.component.ts` | Filtrar items fijos | 10 |

### Backend

| Archivo | Cambios | Líneas Aprox. |
|---------|---------|---------------|
| `routes/ingresos_descuentos.js` | Validación de items fijos | 15 |

**Total de líneas**: ~225 líneas (vs 300+ del plan original)

---

## 7. CASOS DE USO ACTUALIZADOS

### 7.1 Asignar Seguro de Vida a un Empleado

1. Usuario abre formulario de empleado (Juan Pérez, ID: 123)
2. Va a pestaña "Ingresos/Descuentos Fijos"
3. Ve mensaje: "Los descuentos de ley (AFP, SFS) se calculan automáticamente..."
4. Click en "Añadir Ingreso/Descuento"
5. Dialog muestra: Comida, Vacaciones, Seguro de Vida, Préstamos (NO muestra AFP ni SFS)
6. Selecciona "Seguro de Vida"
7. Ingresa valor: 500
8. Selecciona quincena: "Ambas"
9. Click "Guardar"
10. Sistema guarda en `no_desc_cred_auto`

### 7.2 Intentar Agregar AFP (Error)

1. Usuario intenta hackear el sistema y enviar AFP manualmente
2. Backend valida: `WHERE id_desc_cred IN (?) AND fijo = 1`
3. Encuentra AFP con `fijo=1`
4. Responde con error 500: "No se pueden asignar manualmente los siguientes items (son calculados automáticamente): AFP"

---

## 8. PLAN DE PRUEBAS

### 8.1 Pruebas de Asignación

- [ ] Abrir formulario de empleado nuevo → Pestaña vacía
- [ ] Agregar "Seguro de Vida" con valor 500 → Se muestra en tabla
- [ ] Modificar valor a 600 → Se actualiza
- [ ] Cambiar quincena a "Primera" → Se actualiza
- [ ] Eliminar item → Se remueve de la tabla
- [ ] Guardar empleado → Se persiste en `no_desc_cred_auto`
- [ ] Reabrir empleado → Items cargados correctamente

### 8.2 Pruebas de Validación

- [ ] Intentar agregar AFP → Dialog NO lo muestra
- [ ] Intentar agregar item duplicado → Mensaje de error
- [ ] Intentar agregar item sin valor → Permitido (valor 0)

### 8.3 Pruebas de Integración con Nómina

- [ ] Crear nómina → `_generarCargosAutomaticos()` inserta items
- [ ] Recalcular nómina → AFP/SFS calculados + items fijos sumados
- [ ] Verificar `no_det_nomina` → `desc_afp`, `desc_sfs`, `desc_otros` correctos
- [ ] Cerrar nómina → Items permanecen en histórico

---

## 9. CRONOGRAMA REVISADO

| Fase | Tarea | Tiempo Estimado | Responsable |
|------|-------|-----------------|-------------|
| 1 | Actualizar `employee-form.ts` | 1.5 horas | Frontend Dev |
| 1 | Actualizar `employee-form.html` | 1 hora | Frontend Dev |
| 1 | Actualizar `employee-form.css` | 0.5 horas | Frontend Dev |
| 1 | Actualizar `employee.service.ts` | 0.5 horas | Frontend Dev |
| 2 | Actualizar `routes/ingresos_descuentos.js` | 0.5 horas | Backend Dev |
| 3 | Actualizar dialog de búsqueda | 0.5 horas | Frontend Dev |
| 4 | Pruebas de asignación | 0.5 horas | QA |
| 4 | Pruebas de validación | 0.5 horas | QA |
| 4 | Pruebas de integración | 0.5 horas | QA |
| **TOTAL** | | **6 horas** | |

**Reducción de tiempo**: 7.5 horas (55% más rápido que el plan original)

---

## 10. RIESGOS MITIGADOS

| Riesgo Original | Estado |
|----------------|--------|
| Migración de datos existentes | ✅ **Eliminado** (no hay migración) |
| Campo `es_calculado` no se propaga | ✅ **Eliminado** (no hay campo nuevo) |
| Complejidad de 2 secciones en UI | ✅ **Eliminado** (solo 1 sección) |

**Nuevo riesgo identificado**:
- **Riesgo**: Usuario confundido sobre por qué AFP/SFS no aparecen
- **Mitigación**: Mensaje claro en la UI explicando que se calculan automáticamente

---

## 11. CONCLUSIÓN

### Lo que estaba CORRECTO en el plan original:
- ✅ El problema existe (items fijos no se pueden asignar)
- ✅ La necesidad de filtrar AFP/SFS del dialog
- ✅ La necesidad de inputs editables para valor y quincena

### Lo que estaba INCORRECTO en el plan original:
- ❌ AFP/SFS NO están en `no_desc_cred_nomina` (se calculan hardcoded)
- ❌ NO se necesita campo `es_calculado` (usar `fijo` existente)
- ❌ NO se necesitan 2 secciones (solo configurables)
- ❌ NO se necesita migración de datos

### Beneficios del plan revisado:
- ⚡ **55% más rápido** (6 horas vs 13.5 horas)
- 🎯 **Más simple** (1 sección vs 2)
- 🔧 **Sin cambios en BD** (sin riesgos de migración)
- ✨ **Usa arquitectura existente** (tabla `no_desc_cred_auto`)

---

**Próximos Pasos**:
1. Revisar y aprobar este plan revisado
2. Implementar cambios en frontend
3. Implementar validación en backend
4. Probar flujo completo
5. Desplegar

---

**Fecha de Última Actualización**: 2025-10-20
**Versión del Documento**: 2.0 (REVISADO)