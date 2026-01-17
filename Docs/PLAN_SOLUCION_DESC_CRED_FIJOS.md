# Plan de Solución: Problema con Descuentos/Créditos Fijos

**Fecha**: 2025-10-20
**Responsable**: Desarrollo Ranger Nómina
**Prioridad**: Alta

---

## 1. ANÁLISIS DEL PROBLEMA

### 1.1 Problema Identificado

Basado en las imágenes proporcionadas y el análisis del código, se identificaron los siguientes problemas:

1. **No hay forma de asignar/modificar valores a items fijos (`fijo = true`)** en el formulario de empleados
2. **Los items fijos no se están aplicando correctamente en el recálculo de nómina**
3. **Faltan campos para configurar el valor de items fijos** 

#### Evidencias de las imágenes:

**Imagen 1** (`fijosinvalor.png`):
- Muestra la lista de ingresos/descuentos fijos en la pestaña "Ingresos/Descuentos Fijos"
- Los items tienen valor "0" porque no hay forma de modificarlos desde la interfaz
- Los items mostrados son:
  - ID 10: Seguro de Vida (valor: 0)
  - Otros items fijos sin valores asignados

**Imagen 2** (`ingresos fijo.png`):
- Dialog de búsqueda de ingresos/descuentos
- Muestra items como `SFS` (ID: 1, Empleado: 3.04%, Compañía: 7.09%, Tope: DOP229,908.00)
- Muestra items como `AFP` (ID: 2, Empleado: 2.87%, Compañía: 7.10%, Tope: DOP433,496.00)
- Estos items tienen el badge "FIJO" pero al seleccionarlos no se puede modificar su valor

### 1.2 Componentes Afectados

#### Backend:
- `backend-ranger-nomina/models/nominaModel.js` (líneas 855-904): Lógica de cálculo de AFP/SFS
- `backend-ranger-nomina/routes/ingresos_descuentos.js`: Ruta para gestionar ingresos/descuentos automáticos del empleado
- Tabla `no_desc_cred`: Define los conceptos de ingresos/descuentos
- Tabla `no_desc_cred_auto`: Almacena los ingresos/descuentos fijos por empleado

#### Frontend:
- `rangernomina-frontend/src/app/employee-form/employee-form.ts`: Componente de formulario de empleados
- `rangernomina-frontend/src/app/employee-form/employee-form.html`: Template del formulario
- `rangernomina-frontend/src/app/no-desc-cred/no-desc-cred-search-dialog/`: Dialog de búsqueda

---

## 2. SOLUCIÓN PROPUESTA

### 2.1 Arquitectura de la Solución

La solución consiste en **diferenciar los items fijos en dos categorías**:

#### Categoría A: Items Calculados Automáticamente (AFP, SFS, ISR)
- **No permiten edición manual** del valor
- Se calculan automáticamente en `nominaModel.recalcular()` usando porcentajes y topes
- Se muestran en la pestaña "Ingresos/Descuentos Fijos" **solo como referencia/información**
- NO se almacenan en `no_desc_cred_auto`

#### Categoría B: Items Fijos Configurables (Seguro de Vida, etc.)
- **Permiten asignar un valor fijo** por empleado
- El valor se almacena en `no_desc_cred_auto`
- Se aplican automáticamente en cada nómina mediante `_generarCargosAutomaticos()`
- Se pueden editar desde la pestaña "Ingresos/Descuentos Fijos"

### 2.2 Cambios en la Base de Datos

#### Nuevo campo en tabla `no_desc_cred`:

```sql
ALTER TABLE no_desc_cred
ADD COLUMN es_calculado TINYINT(1) DEFAULT 0 COMMENT '1 = Calculado automáticamente (AFP/SFS/ISR), 0 = Configurable manualmente';
```

**Justificación**: Este campo permite distinguir entre items que se calculan automáticamente (AFP, SFS, ISR) y los que requieren un valor fijo configurable por empleado.

#### Actualizar registros existentes:

```sql
-- Marcar AFP, SFS e ISR como calculados
UPDATE no_desc_cred
SET es_calculado = 1
WHERE descripcion IN ('AFP', 'SFS', 'ARS', 'ISR') OR fijo = 1 AND valorporciento = 'P';

-- Marcar items configurables (Seguro de Vida, etc.)
UPDATE no_desc_cred
SET es_calculado = 0
WHERE fijo = 1 AND valorporciento = 'V';
```

---

## 3. IMPLEMENTACIÓN DETALLADA

### 3.1 FASE 1: Backend - Ajustes en la Base de Datos

**Tareas:**
1. Ejecutar el script SQL para agregar el campo `es_calculado`
2. Actualizar los registros existentes según la clasificación

**Archivo SQL**: `backend-ranger-nomina/migrations/add_es_calculado_field.sql`

**Tiempo estimado**: 1 hora

---

### 3.2 FASE 2: Backend - Modelo y Servicio

#### 3.2.1 Actualizar `no_desc_cred.service.ts` (Frontend)

Agregar método para obtener items fijos configurables:

```typescript
getConfigurableFixedNoDescCreds(): Observable<NoDescCred[]> {
  return this.http.get<NoDescCred[]>(`${this.apiUrl}/no-fijos-configurables`);
}
```

#### 3.2.2 Crear endpoint en Backend

**Archivo**: `backend-ranger-nomina/routes/no_desc_cred.js`

```javascript
// GET /api/no_desc_cred/no-fijos-configurables
router.get('/no-fijos-configurables', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM no_desc_cred WHERE fijo = 1 AND es_calculado = 0 ORDER BY descripcion'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener items fijos configurables:', err);
    res.status(500).json({ message: 'Error al obtener items fijos configurables' });
  }
});
```

#### 3.2.3 Actualizar endpoint de ingresos/descuentos del empleado

**Archivo**: `backend-ranger-nomina/routes/ingresos_descuentos.js` (líneas 20-59)

Modificar el POST para validar que los items fijos sean configurables:

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

        // 1. Validar que los items sean configurables (no calculados)
        const ids = ingresosDescuentos.map(item => item.id_desc_cred);
        if (ids.length > 0) {
            const [itemsNoPermitidos] = await connection.execute(
                `SELECT id_desc_cred, descripcion FROM no_desc_cred
                 WHERE id_desc_cred IN (?) AND es_calculado = 1`,
                [ids]
            );

            if (itemsNoPermitidos.length > 0) {
                const descripciones = itemsNoPermitidos.map(i => i.descripcion).join(', ');
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
                item.valor || 0, // Asegurar que siempre haya un valor
                item.numero_de_quincena || 0
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

**Tiempo estimado**: 2 horas

---

### 3.3 FASE 3: Frontend - Actualización de Componentes

#### 3.3.1 Modificar `employee-form.ts`

**Cambios necesarios:**

1. **Separar items fijos en dos listas**:

```typescript
// Línea 51: Agregar nueva propiedad
ingresosDescuentosCalculados: IngresoDescuento[] = []; // AFP, SFS, ISR (solo lectura)
```

2. **Actualizar `loadFixedIngresosDescuentos()`** (líneas 161-188):

```typescript
loadFixedIngresosDescuentos(): void {
  // Cargar items CONFIGURABLES
  this.noDescCredService.getConfigurableFixedNoDescCreds().subscribe(data => {
    if (data && Array.isArray(data)) {
      this.ingresosDescuentos = data.map(item => ({
        id_desc_cred: item.id_desc_cred || 0,
        descripcion: item.descripcion,
        valor: this.calcularValor(item), // Calcular valor inicial
        quincena: 0
      }));
    }
  });

  // Cargar items CALCULADOS (solo para mostrar)
  this.noDescCredService.getFixedNoDescCreds().subscribe(data => {
    if (data && Array.isArray(data)) {
      this.ingresosDescuentosCalculados = data
        .filter(item => item.es_calculado === 1)
        .map(item => ({
          id_desc_cred: item.id_desc_cred || 0,
          descripcion: item.descripcion,
          valor: this.calcularValor(item),
          quincena: 0
        }));
    }
  });
}

private calcularValor(item: NoDescCred): number {
  const salario = this.employeeForm.get('salario_act')?.value || 0;

  if (item.valorporciento === 'V') {
    return item.empleado;
  } else if (item.valorporciento === 'P') {
    const porcentaje = item.empleado / 100;
    let salarioParaCalculo = salario;
    if (item.tope > 0 && salario > item.tope) {
      salarioParaCalculo = item.tope;
    }
    return (salarioParaCalculo * porcentaje) / 2;
  }
  return 0;
}
```

3. **Actualizar `onAddIngresoDescuento()`** (líneas 190-216):

```typescript
onAddIngresoDescuento(): void {
  const dialogRef = this.dialog.open(NoDescCredSearchDialogComponent, {
    width: '600px',
    data: { soloConfigurables: true } // Pasar flag para filtrar
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      const selectedItem: NoDescCred = result;

      // Validar que no sea un item calculado
      if (selectedItem.es_calculado === 1) {
        // Mostrar notificación de error
        this.notificationService.showError(
          `${selectedItem.descripcion} es un item calculado automáticamente y no puede ser modificado.`
        );
        return;
      }

      // Agregar el item a la lista
      this.ingresosDescuentos.push({
        id_desc_cred: selectedItem.id_desc_cred || 0,
        descripcion: selectedItem.descripcion,
        valor: this.calcularValor(selectedItem),
        quincena: 0
      });
    }
  });
}
```

4. **Agregar método para eliminar items**:

```typescript
onRemoveIngresoDescuento(index: number): void {
  this.ingresosDescuentos.splice(index, 1);
}
```

5. **Cargar ingresos/descuentos del empleado al editar** (líneas 111-136):

```typescript
ngOnInit(): void {
  this.userLevel = this.userService.getUserLevel();
  const id = this.route.snapshot.paramMap.get('id');

  this.employeeForm.get('id_nomina')?.valueChanges.subscribe(id_nomina => {
    this.employeeForm.get('id_subnomina')?.setValue(null, { emitEvent: false });
    this.subnominaList = [];
    if (id_nomina) {
      this.loadSubnominas(id_nomina);
    }
  });

  if (id) {
    this.employeeService.getEmployee(+id).subscribe(employee => {
      if (employee) {
        const updateForm = (emp: Employee) => {
          this.employeeForm.patchValue(emp);

          // Cargar items fijos calculados (AFP, SFS, ISR)
          this.loadFixedIngresosDescuentos();

          // Cargar ingresos/descuentos configurables del empleado
          this.employeeService.getEmployeeIngresosDescuentos(emp.id_empleado!).subscribe(items => {
            this.ingresosDescuentos = items.map(item => ({
              id_desc_cred: item.id_desc_cred,
              descripcion: item.desc_cred_desc || item.descripcion,
              valor: item.valor,
              quincena: item.numero_de_quincena || 0
            }));
          });

          if (emp.foto) {
            this.photoUrl = emp.foto;
            this.employeeForm.get('foto')?.setValue(emp.foto);
          }
        };

        // ... resto del código
      }
    });
  } else {
    // Nuevo empleado: cargar solo items calculados
    this.loadFixedIngresosDescuentos();
  }
}
```

#### 3.3.2 Modificar `employee-form.html`

**Actualizar la pestaña "Ingresos/Descuentos Fijos"** (líneas 256-282):

```html
<!-- Contenido de la pestaña Ingresos/Descuentos -->
<div class="tab-content" *ngIf="activeTab === 'ingresos'">

  <!-- Sección 1: Items Calculados Automáticamente (Solo Lectura) -->
  <div class="info-section">
    <h3 class="subsection-title">
      <mat-icon>info</mat-icon> Items Calculados Automáticamente
    </h3>
    <p class="info-text">Los siguientes items se calculan automáticamente en la nómina basados en el salario:</p>
    <div class="ingresos-table readonly">
      <table class="data-table">
        <thead>
          <tr>
            <th>CÓDIGO</th>
            <th>DESCRIPCIÓN</th>
            <th>VALOR ESTIMADO (Quincenal)</th>
            <th>QUINCENA</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of ingresosDescuentosCalculados" class="readonly-row">
            <td>{{ item.id_desc_cred }}</td>
            <td>{{ item.descripcion }}</td>
            <td>{{ item.valor | currency:'DOP':'symbol':'1.2-2' }}</td>
            <td>{{ item.quincena === 0 ? 'Ambas' : item.quincena }}</td>
          </tr>
          <tr *ngIf="ingresosDescuentosCalculados.length === 0">
            <td colspan="4" class="no-data">No hay items calculados automáticamente</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <hr class="section-divider">

  <!-- Sección 2: Items Configurables (Editables) -->
  <div class="editable-section">
    <h3 class="subsection-title">
      <mat-icon>edit</mat-icon> Items Fijos Configurables
    </h3>
    <button type="button" mat-raised-button color="primary" class="add-button" (click)="onAddIngresoDescuento()">
      <mat-icon>add</mat-icon> Añadir Ingreso/Descuento
    </button>
    <div class="ingresos-table">
      <table class="data-table">
        <thead>
          <tr>
            <th>CÓDIGO</th>
            <th>DESCRIPCIÓN</th>
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
              <input type="number"
                     class="value-input"
                     [(ngModel)]="item.valor"
                     [ngModelOptions]="{standalone: true}"
                     step="0.01"
                     min="0">
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
            <td colspan="5" class="no-data">
              No hay items configurables asignados.
              Haga clic en "Añadir Ingreso/Descuento" para agregar uno.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>
```

#### 3.3.3 Modificar `employee-form.css`

Agregar estilos para las nuevas secciones:

```css
/* Sección de información (items calculados) */
.info-section {
  margin-bottom: 2rem;
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.info-text {
  margin: 0.5rem 0 1rem 0;
  color: #666;
  font-size: 0.9rem;
}

/* Tabla de solo lectura */
.ingresos-table.readonly {
  opacity: 0.8;
}

.readonly-row {
  background-color: #fafafa;
}

/* Divisor de secciones */
.section-divider {
  margin: 2rem 0;
  border: none;
  border-top: 2px solid #e0e0e0;
}

/* Input de valor editable */
.value-input {
  width: 100%;
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
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.quincena-select:focus {
  outline: none;
  border-color: #3f51b5;
}

/* Mensaje de sin datos */
.no-data {
  text-align: center;
  padding: 2rem !important;
  color: #999;
  font-style: italic;
}
```

#### 3.3.4 Actualizar `employee.service.ts`

Agregar método para obtener ingresos/descuentos del empleado:

```typescript
getEmployeeIngresosDescuentos(id: number): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/${id}/ingresos-descuentos`);
}
```

**Tiempo estimado**: 4 horas

---

### 3.4 FASE 4: Actualizar Dialog de Búsqueda

#### 3.4.1 Modificar `no-desc-cred-search-dialog.component.ts`

Agregar soporte para filtrar items configurables:

```typescript
export class NoDescCredSearchDialogComponent implements OnInit {
  // ... propiedades existentes ...
  soloConfigurables: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<NoDescCredSearchDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any, // Cambiar tipo
    private noDescCredService: NoDescCredService
  ) {
    this.soloConfigurables = data?.soloConfigurables || false;
  }

  ngOnInit(): void {
    this.noDescCredService.getNoDescCreds().subscribe((data) => {
      let items = data.data;

      // Filtrar solo configurables si se especifica
      if (this.soloConfigurables) {
        items = items.filter(item => item.es_calculado !== 1);
      }

      this.allNoDescCreds = items;
      this.applyFilters();
    });
  }

  // ... resto del código ...
}
```

**Tiempo estimado**: 1 hora

---

### 3.5 FASE 5: Verificación del Recálculo de Nómina

#### 3.5.1 Revisar `nominaModel.recalcular()`

**Verificar que los items fijos se aplican correctamente** (líneas 249-264 y 906-917):

El método `_generarCargosAutomaticos()` ya está implementado correctamente y carga los items de `no_desc_cred_auto`.

El método `recalcular()` en la línea 906-917 ya suma correctamente los ingresos y descuentos:

```javascript
const [[otrosMovimientos]] = await connection.query(
    `SELECT
        SUM(CASE WHEN ndc.origen != 'D' AND ndc.descripcion NOT LIKE '%horas extras%' AND ndcn.id_desc_cred != 8 THEN ndcn.valor ELSE 0 END) as otros_ingresos,
        SUM(CASE WHEN ndc.origen = 'D' THEN ndcn.valor ELSE 0 END) as otros_descuentos,
        SUM(CASE WHEN ndc.descripcion LIKE '%horas extras 15%' THEN ndcn.valor ELSE 0 END) as monto_he15,
        SUM(CASE WHEN ndc.descripcion LIKE '%horas extras 35%' THEN ndcn.valor ELSE 0 END) as monto_he35
     FROM no_desc_cred_nomina ndcn
     JOIN no_desc_cred ndc ON ndcn.id_desc_cred = ndc.id_desc_cred
     WHERE ndcn.id_nomina = ? AND ndcn.codigo_empleado = ?
       AND (ndc.quincena_aplicacion = 0 OR ndc.quincena_aplicacion = ?)`,
    [nominaId, empleado.id_empleado, quincena || 0]
);
```

**IMPORTANTE**: Verificar que el filtro `quincena_aplicacion` esté funcionando correctamente.

#### 3.5.2 Agregar Test de Integración

Crear test para verificar que los items fijos se aplican:

**Archivo**: `backend-ranger-nomina/tests/nomina.recalcular.test.js`

```javascript
describe('Nomina.recalcular - Items Fijos', () => {
  it('debe aplicar items fijos configurables correctamente', async () => {
    // 1. Crear empleado
    const empleado = await crearEmpleadoTest();

    // 2. Asignar item fijo (Seguro de Vida = 500)
    await db.query(
      'INSERT INTO no_desc_cred_auto (id_empleado, id_desc_cred, valor, numero_de_quincena) VALUES (?, ?, ?, ?)',
      [empleado.id_empleado, 10, 500, 0]
    );

    // 3. Crear nómina
    const nomina = await crearNominaTest();

    // 4. Recalcular
    await Nomina.recalcular(nomina.id_nominas);

    // 5. Verificar que se aplicó el descuento
    const [detalles] = await db.query(
      'SELECT desc_otros FROM no_det_nomina WHERE id_nomina = ? AND id_empleado = ?',
      [nomina.id_nominas, empleado.id_empleado]
    );

    expect(detalles[0].desc_otros).toBeGreaterThanOrEqual(500);
  });

  it('debe calcular AFP y SFS automáticamente sin items en no_desc_cred_auto', async () => {
    // Similar al anterior pero verificando que AFP y SFS se calculan sin estar en no_desc_cred_auto
  });
});
```

**Tiempo estimado**: 2 horas

---

## 4. RESUMEN DE CAMBIOS POR ARCHIVO

### Backend

| Archivo | Cambios | Líneas Aprox. |
|---------|---------|---------------|
| `migrations/add_es_calculado_field.sql` | Nuevo archivo (DDL) | 10 |
| `routes/no_desc_cred.js` | Nuevo endpoint `/no-fijos-configurables` | 15 |
| `routes/ingresos_descuentos.js` | Validación de items calculados | 30 |
| `tests/nomina.recalcular.test.js` | Tests de integración | 50 |

### Frontend

| Archivo | Cambios | Líneas Aprox. |
|---------|---------|---------------|
| `employee-form.ts` | Separar listas, cargar items, validaciones | 80 |
| `employee-form.html` | Dos secciones (calculados + configurables) | 70 |
| `employee-form.css` | Estilos para nuevas secciones | 50 |
| `employee.service.ts` | Nuevo método `getEmployeeIngresosDescuentos()` | 5 |
| `no-desc-cred.service.ts` | Nuevo método `getConfigurableFixedNoDescCreds()` | 5 |
| `no-desc-cred-search-dialog.component.ts` | Filtrar configurables | 15 |

---

## 5. CASOS DE USO

### 5.1 Caso de Uso: Asignar Seguro de Vida a un Empleado

**Flujo**:
1. Usuario abre el formulario de empleado
2. Navega a la pestaña "Ingresos/Descuentos Fijos"
3. Ve dos secciones:
   - **Items Calculados Automáticamente**: Muestra AFP (estimado: DOP 1,200), SFS (estimado: DOP 1,300), ISR (calculado en nómina)
   - **Items Fijos Configurables**: Vacío
4. Click en "Añadir Ingreso/Descuento"
5. Se abre dialog, busca "Seguro de Vida"
6. Selecciona "Seguro de Vida"
7. El item se agrega a la tabla con valor inicial 0
8. Usuario modifica el valor a 500
9. Usuario selecciona quincena "Ambas" (0)
10. Click en "Guardar"
11. El sistema guarda el registro en `no_desc_cred_auto`

### 5.2 Caso de Uso: Recalcular Nómina con Items Fijos

**Flujo**:
1. Usuario crea una nómina (ID: 100)
2. El sistema ejecuta `_generarCargosAutomaticos()` que:
   - Lee todos los registros de `no_desc_cred_auto` para los empleados de la nómina
   - Inserta los items en `no_desc_cred_nomina` con `automanual = 'A'`
3. Usuario hace click en "Recalcular"
4. El sistema ejecuta `Nomina.recalcular(100)` que:
   - Calcula AFP y SFS automáticamente (no lee de `no_desc_cred_auto`, usa lógica hardcoded)
   - Lee items de `no_desc_cred_nomina` (incluyendo los fijos insertados en paso 2)
   - Suma los valores en `otros_descuentos` / `otros_ingresos`
   - Actualiza `no_det_nomina`

### 5.3 Caso de Uso: Intentar Modificar AFP Manualmente (Error)

**Flujo**:
1. Usuario abre formulario de empleado
2. Va a "Ingresos/Descuentos Fijos"
3. Click en "Añadir Ingreso/Descuento"
4. Busca "AFP"
5. El dialog NO muestra AFP (filtrado porque `es_calculado = 1`)
6. Si el usuario intenta agregar AFP mediante manipulación de la API:
   - El backend rechaza la solicitud con error: "No se pueden asignar manualmente los siguientes items (son calculados automáticamente): AFP"

---

## 6. VALIDACIONES Y CONSIDERACIONES

### 6.1 Validaciones de Negocio

1. **Items calculados NO pueden ser modificados manualmente**
2. **Items configurables deben tener un valor >= 0**
3. **Quincena válida: 0 (ambas), 1 (primera), 2 (segunda)**
4. **No permitir duplicados**: Un empleado NO puede tener el mismo `id_desc_cred` dos veces en `no_desc_cred_auto`

### 6.2 Consideraciones de Rendimiento

1. **Carga inicial**: Al abrir el formulario de empleado, se ejecutan 2 queries:
   - `SELECT * FROM no_desc_cred WHERE fijo = 1 AND es_calculado = 1` (items calculados)
   - `SELECT * FROM no_desc_cred WHERE fijo = 1 AND es_calculado = 0` (items configurables)

   **Optimización**: Crear índice en `(fijo, es_calculado)`:
   ```sql
   CREATE INDEX idx_fijo_calculado ON no_desc_cred(fijo, es_calculado);
   ```

2. **Recálculo de nómina**: El método `_generarCargosAutomaticos()` ejecuta:
   ```sql
   SELECT id_desc_cred, id_empleado, valor
   FROM no_desc_cred_auto
   WHERE id_empleado IN (?)
     AND (numero_de_quincena = ? OR numero_de_quincena = 0 OR numero_de_quincena IS NULL)
   ```

   **Optimización**: Ya existe índice en `id_empleado`, pero agregar índice compuesto:
   ```sql
   CREATE INDEX idx_empleado_quincena ON no_desc_cred_auto(id_empleado, numero_de_quincena);
   ```

### 6.3 Migración de Datos Existentes

**Problema**: Si ya existen registros de AFP/SFS en `no_desc_cred_auto`, estos deben ser eliminados porque ahora se calculan automáticamente.

**Script de Migración**:

```sql
-- Eliminar registros de items calculados en no_desc_cred_auto
DELETE FROM no_desc_cred_auto
WHERE id_desc_cred IN (
  SELECT id_desc_cred
  FROM no_desc_cred
  WHERE es_calculado = 1
);
```

---

## 7. PLAN DE PRUEBAS

### 7.1 Pruebas Unitarias

- [ ] Test: `getConfigurableFixedNoDescCreds()` retorna solo items con `es_calculado = 0`
- [ ] Test: Validación de items calculados en POST `/ingresos-descuentos`
- [ ] Test: Cálculo automático de AFP y SFS en `recalcular()`

### 7.2 Pruebas de Integración

- [ ] Test: Crear empleado → Asignar Seguro de Vida → Crear nómina → Verificar que se aplica
- [ ] Test: Modificar valor de item fijo → Recalcular nómina → Verificar nuevo valor
- [ ] Test: Cambiar quincena de item fijo → Recalcular nómina → Verificar que se aplica solo en la quincena correcta

### 7.3 Pruebas de UI

- [ ] Test: Dialog de búsqueda NO muestra items calculados
- [ ] Test: Tabla de items calculados es solo lectura
- [ ] Test: Tabla de items configurables permite editar valor y quincena
- [ ] Test: Botón "Eliminar" funciona correctamente

### 7.4 Pruebas de Regresión

- [ ] Verificar que el cálculo de AFP/SFS sigue funcionando igual que antes
- [ ] Verificar que las horas extras se siguen aplicando correctamente
- [ ] Verificar que las vacaciones se calculan correctamente

---

## 8. CRONOGRAMA DE IMPLEMENTACIÓN

| Fase | Tarea | Tiempo Estimado | Responsable |
|------|-------|-----------------|-------------|
| 1 | Crear script de migración SQL | 1 hora | Backend Dev |
| 1 | Ejecutar script en base de datos | 0.5 horas | DBA |
| 2 | Crear endpoint `/no-fijos-configurables` | 1 hora | Backend Dev |
| 2 | Actualizar endpoint POST `/ingresos-descuentos` | 1 hora | Backend Dev |
| 3 | Actualizar `employee-form.ts` | 2 horas | Frontend Dev |
| 3 | Actualizar `employee-form.html` | 1.5 horas | Frontend Dev |
| 3 | Actualizar `employee-form.css` | 0.5 horas | Frontend Dev |
| 3 | Actualizar `employee.service.ts` | 0.5 horas | Frontend Dev |
| 4 | Actualizar dialog de búsqueda | 1 hora | Frontend Dev |
| 5 | Tests de integración | 2 horas | QA |
| 5 | Pruebas de UI | 1 hora | QA |
| 5 | Pruebas de regresión | 1 hora | QA |
| **TOTAL** | | **13.5 horas** | |

---

## 9. RIESGOS Y MITIGACIONES

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Datos existentes en `no_desc_cred_auto` para AFP/SFS causan duplicados | Alta | Alto | Ejecutar script de limpieza ANTES de desplegar |
| El campo `es_calculado` no se propaga correctamente | Media | Alto | Validar con queries manuales después de la migración |
| El dialog de búsqueda sigue mostrando items calculados | Baja | Medio | Test de UI antes de desplegar |
| El recálculo no suma correctamente los items fijos | Media | Alto | Tests de integración exhaustivos |

---

## 10. DOCUMENTACIÓN ADICIONAL

### 10.1 Diagrama de Flujo: Recálculo de Nómina con Items Fijos

```
┌─────────────────────────────────────────────┐
│ Usuario hace click en "Recalcular Nómina"  │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ Backend: Nomina.recalcular(nominaId)       │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ Para cada empleado en la nómina:           │
└────────────────┬────────────────────────────┘
                 │
                 ├─► [1] Calcular AFP (hardcoded, basado en salario y tope)
                 │
                 ├─► [2] Calcular SFS (hardcoded, basado en salario y tope)
                 │
                 ├─► [3] Leer items de no_desc_cred_nomina (incluye items fijos de no_desc_cred_auto)
                 │        │
                 │        ├─► Sumar otros_ingresos (origen != 'D')
                 │        └─► Sumar otros_descuentos (origen = 'D')
                 │
                 ├─► [4] Calcular ISR (basado en total de ingresos - TSS)
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ Actualizar no_det_nomina con:              │
│ - sueldo_nomina                            │
│ - desc_afp, desc_sfs, desc_isr             │
│ - otros_ingresos, desc_otros               │
│ - total_ingreso, total_descuento, total_pagar│
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ Actualizar totales de la nómina            │
└─────────────────────────────────────────────┘
```

### 10.2 Modelo de Datos

```
┌──────────────────────┐
│  no_desc_cred        │
├──────────────────────┤
│ id_desc_cred (PK)    │
│ descripcion          │
│ fijo (BOOL)          │
│ es_calculado (BOOL) ◄──── NUEVO CAMPO
│ valorporciento       │
│ empleado (%)         │
│ tope                 │
│ quincena_aplicacion  │
└──────────┬───────────┘
           │
           │ 1:N
           │
           ▼
┌──────────────────────┐
│ no_desc_cred_auto    │  ◄──── SOLO PARA ITEMS CONFIGURABLES
├──────────────────────┤
│ id (PK)              │
│ id_empleado (FK)     │
│ id_desc_cred (FK)    │
│ valor                │
│ numero_de_quincena   │
└──────────────────────┘
```

---

## 11. CONCLUSIÓN

Esta solución permite:

1. **Separar claramente** los items que se calculan automáticamente (AFP, SFS, ISR) de los items configurables (Seguro de Vida, etc.)
2. **Dar visibilidad** al usuario de los valores estimados de AFP y SFS sin permitir su modificación
3. **Permitir configurar** valores fijos para otros conceptos (seguros, préstamos, etc.)
4. **Mantener la integridad** del cálculo de nómina sin duplicar lógica

### Próximos Pasos:

1. Revisar y aprobar el plan
2. Ejecutar la migración de base de datos en ambiente de desarrollo
3. Implementar los cambios según el cronograma
4. Ejecutar pruebas exhaustivas
5. Desplegar en producción con rollback plan

---

**Fecha de Última Actualización**: 2025-10-20
**Versión del Documento**: 1.0
