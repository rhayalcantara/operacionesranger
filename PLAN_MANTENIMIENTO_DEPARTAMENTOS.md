# Plan de Implementación: Mantenimiento de Departamentos

## Estado Actual

**Análisis de la situación:**
- ✅ Backend: Modelo, rutas y controlador implementados
- ✅ Frontend: Componentes, servicio e interfaces creados
- ⚠️ **PROBLEMA PRINCIPAL**: El formulario usa navegación por rutas en lugar de dialog (MAT_DIALOG_DATA)
- ⚠️ El servicio no maneja paginación correctamente
- ⚠️ No hay búsqueda implementada
- ⚠️ Falta validación de integridad referencial (empleados asignados al departamento)
- ❌ Ruta del backend no está registrada en `server.js`
- ❌ No hay opción en el menú de navegación

**Archivos existentes:**
- Backend: `models/departamentoModel.js`, `routes/rh_departamentos.js`
- Frontend: `departamento/departamento.component.ts`, `departamento/departamento-form/departamento-form.component.ts`, `departamento.service.ts`

## Objetivos

1. **Corregir el patrón de formulario** para usar dialogs (como AFP, ARS, Puestos)
2. **Implementar paginación server-side** correctamente
3. **Agregar funcionalidad de búsqueda**
4. **Validar integridad referencial** antes de eliminar
5. **Registrar la ruta** en el servidor
6. **Agregar al menú** de navegación
7. **Mejorar el campo encargado** (debería mostrar nombre del empleado, no solo ID)

---

## Fase 1: Backend - Correcciones y Mejoras

### 1.1 Verificar y Registrar Ruta en server.js
**Archivo:** `backend-ranger-nomina/server.js`

**Acción:**
- Verificar si existe la línea: `app.use('/api/rh_departamentos', require('./routes/rh_departamentos'));`
- Si no existe, agregarla junto con las demás rutas

**Resultado esperado:** El endpoint `/api/rh_departamentos` responde correctamente

---

### 1.2 Mejorar Modelo de Departamento
**Archivo:** `backend-ranger-nomina/models/departamentoModel.js`

**Mejoras necesarias:**

#### a) Agregar búsqueda por descripción
```javascript
static async getAll({ page, limit, search }) {
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = 'SELECT * FROM rh_departamentos';
  let countQuery = 'SELECT COUNT(*) as total FROM rh_departamentos';
  const params = [];
  const countParams = [];

  if (search) {
    query += ' WHERE descripcion LIKE ?';
    countQuery += ' WHERE descripcion LIKE ?';
    const searchParam = `%${search}%`;
    params.push(searchParam);
    countParams.push(searchParam);
  }

  query += ' ORDER BY descripcion ASC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const [results] = await db.query(query, params);
  const [[{ total }]] = await db.query(countQuery, countParams);

  return {
    data: results,
    total: total,
    page: parseInt(page),
    limit: parseInt(limit)
  };
}
```

#### b) Agregar validación de integridad referencial
```javascript
static async canDelete(id) {
  // Verificar si hay empleados asignados a este departamento
  const [empleados] = await db.query(
    'SELECT COUNT(*) as count FROM rh_empleado WHERE id_departamento = ?',
    [id]
  );
  return empleados[0].count === 0;
}
```

#### c) Obtener departamentos con información del encargado
```javascript
static async getAllWithEncargado({ page, limit, search }) {
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = `
    SELECT
      d.id_departamentos,
      d.descripcion,
      d.encargado,
      CONCAT(e.nombres, ' ', e.apellidos) as nombre_encargado
    FROM rh_departamentos d
    LEFT JOIN rh_empleado e ON d.encargado = e.id_empleado
  `;

  let countQuery = 'SELECT COUNT(*) as total FROM rh_departamentos d';
  const params = [];
  const countParams = [];

  if (search) {
    query += ' WHERE d.descripcion LIKE ?';
    countQuery += ' WHERE descripcion LIKE ?';
    const searchParam = `%${search}%`;
    params.push(searchParam);
    countParams.push(searchParam);
  }

  query += ' ORDER BY d.descripcion ASC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const [results] = await db.query(query, params);
  const [[{ total }]] = await db.query(countQuery, countParams);

  return {
    data: results,
    total: total,
    page: parseInt(page),
    limit: parseInt(limit)
  };
}
```

**Tiempo estimado:** 30 minutos

---

### 1.3 Actualizar Rutas
**Archivo:** `backend-ranger-nomina/routes/rh_departamentos.js`

**Cambios:**

#### a) Usar método mejorado con encargado
```javascript
router.get('/', async (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;
  try {
    const result = await Departamento.getAllWithEncargado({
      page: parseInt(page),
      limit: parseInt(limit),
      search
    });
    res.json(result);
  } catch (err) {
    console.error('Error al obtener Departamentos:', err);
    res.status(500).json({ message: 'Error al obtener Departamentos', error: err.message });
  }
});
```

#### b) Validar antes de eliminar
```javascript
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Verificar si se puede eliminar
    const canDelete = await Departamento.canDelete(id);
    if (!canDelete) {
      return res.status(400).json({
        message: 'No se puede eliminar el departamento porque tiene empleados asignados'
      });
    }

    const deleted = await Departamento.delete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Departamento no encontrado' });
    }
    res.json({ message: 'Departamento eliminado con éxito' });
  } catch (err) {
    console.error('Error al eliminar Departamento:', err);
    res.status(500).json({ message: 'Error al eliminar Departamento', error: err.message });
  }
});
```

**Tiempo estimado:** 20 minutos

---

## Fase 2: Frontend - Refactorización Completa

### 2.1 Actualizar Interface y Servicio
**Archivo:** `rangernomina-frontend/src/app/departamento.service.ts`

**Cambios:**

#### a) Actualizar interface para incluir paginación
```typescript
export interface Departamento {
  id_departamentos?: number;
  descripcion: string;
  encargado?: number;
  nombre_encargado?: string; // Nombre completo del encargado
}

export interface DepartamentoPaginado {
  data: Departamento[];
  total: number;
  page: number;
  limit: number;
}
```

#### b) Actualizar método getDepartamentos
```typescript
getDepartamentos(page: number = 1, limit: number = 10, search: string = ''): Observable<DepartamentoPaginado> {
  const params = new HttpParams()
    .set('page', page.toString())
    .set('limit', limit.toString())
    .set('search', search);

  return this.http.get<DepartamentoPaginado>(this.apiUrl, {
    headers: this.getAuthHeaders(),
    params
  });
}
```

**Tiempo estimado:** 15 minutos

---

### 2.2 Refactorizar Componente Principal
**Archivo:** `rangernomina-frontend/src/app/departamento/departamento.component.ts`

**Cambios completos:**

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DepartamentoService, Departamento, DepartamentoPaginado } from '../departamento.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { DepartamentoFormComponent } from './departamento-form/departamento-form.component';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-departamento',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  templateUrl: './departamento.component.html',
  styleUrl: './departamento.component.css'
})
export class DepartamentoComponent implements OnInit {
  displayedColumns: string[] = ['id_departamentos', 'descripcion', 'nombre_encargado', 'actions'];
  departamentos: Departamento[] = [];

  // Paginación
  totalRecords = 0;
  pageSize = 10;
  currentPage = 1;

  // Búsqueda
  searchTerm = '';

  constructor(
    private departamentoService: DepartamentoService,
    public dialog: MatDialog,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadDepartamentos();
  }

  loadDepartamentos(): void {
    this.departamentoService.getDepartamentos(this.currentPage, this.pageSize, this.searchTerm)
      .subscribe({
        next: (response: DepartamentoPaginado) => {
          this.departamentos = response.data;
          this.totalRecords = response.total;
        },
        error: (error) => {
          this.notificationService.showError('Error al cargar departamentos');
          console.error('Error:', error);
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadDepartamentos();
  }

  onSearch(): void {
    this.currentPage = 1; // Reset a la primera página
    this.loadDepartamentos();
  }

  openDialog(departamento?: Departamento): void {
    const dialogRef = this.dialog.open(DepartamentoFormComponent, {
      width: '500px',
      data: departamento ? { ...departamento } : null,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadDepartamentos();
        this.notificationService.showSuccess('Departamento guardado con éxito');
      }
    });
  }

  editDepartamento(departamento: Departamento): void {
    this.openDialog(departamento);
  }

  deleteDepartamento(departamento: Departamento): void {
    if (departamento.id_departamentos !== undefined) {
      if (confirm(`¿Está seguro de eliminar el departamento "${departamento.descripcion}"?`)) {
        this.departamentoService.deleteDepartamento(departamento.id_departamentos).subscribe({
          next: () => {
            this.loadDepartamentos();
            this.notificationService.showSuccess('Departamento eliminado con éxito');
          },
          error: (error) => {
            if (error.status === 400) {
              this.notificationService.showError(
                'No se puede eliminar: El departamento tiene empleados asignados'
              );
            } else {
              this.notificationService.showError('Error al eliminar el departamento');
            }
            console.error('Error:', error);
          }
        });
      }
    }
  }
}
```

**Tiempo estimado:** 40 minutos

---

### 2.3 Actualizar Template del Componente Principal
**Archivo:** `rangernomina-frontend/src/app/departamento/departamento.component.html`

**Contenido completo:**

```html
<div class="container">
  <h2>Mantenimiento de Departamentos</h2>

  <!-- Barra de búsqueda y botón nuevo -->
  <div class="header-actions">
    <mat-form-field appearance="outline" class="search-field">
      <mat-label>Buscar por descripción</mat-label>
      <input matInput [(ngModel)]="searchTerm" (keyup.enter)="onSearch()" placeholder="Buscar...">
      <mat-icon matSuffix>search</mat-icon>
    </mat-form-field>

    <button mat-raised-button color="primary" (click)="openDialog()">
      <mat-icon>add</mat-icon>
      Nuevo Departamento
    </button>
  </div>

  <!-- Tabla de departamentos -->
  <table mat-table [dataSource]="departamentos" class="mat-elevation-z8">

    <!-- Columna ID -->
    <ng-container matColumnDef="id_departamentos">
      <th mat-header-cell *matHeaderCellDef>ID</th>
      <td mat-cell *matCellDef="let departamento">{{ departamento.id_departamentos }}</td>
    </ng-container>

    <!-- Columna Descripción -->
    <ng-container matColumnDef="descripcion">
      <th mat-header-cell *matHeaderCellDef>Descripción</th>
      <td mat-cell *matCellDef="let departamento">{{ departamento.descripcion }}</td>
    </ng-container>

    <!-- Columna Encargado -->
    <ng-container matColumnDef="nombre_encargado">
      <th mat-header-cell *matHeaderCellDef>Encargado</th>
      <td mat-cell *matCellDef="let departamento">
        {{ departamento.nombre_encargado || 'Sin asignar' }}
      </td>
    </ng-container>

    <!-- Columna Acciones -->
    <ng-container matColumnDef="actions">
      <th mat-header-cell *matHeaderCellDef>Acciones</th>
      <td mat-cell *matCellDef="let departamento">
        <button mat-icon-button color="primary" (click)="editDepartamento(departamento)" matTooltip="Editar">
          <mat-icon>edit</mat-icon>
        </button>
        <button mat-icon-button color="warn" (click)="deleteDepartamento(departamento)" matTooltip="Eliminar">
          <mat-icon>delete</mat-icon>
        </button>
      </td>
    </ng-container>

    <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
    <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
  </table>

  <!-- Paginador -->
  <mat-paginator
    [length]="totalRecords"
    [pageSize]="pageSize"
    [pageSizeOptions]="[5, 10, 25, 50]"
    (page)="onPageChange($event)"
    showFirstLastButtons>
  </mat-paginator>
</div>
```

**Tiempo estimado:** 20 minutos

---

### 2.4 Refactorizar Formulario a Dialog
**Archivo:** `rangernomina-frontend/src/app/departamento/departamento-form/departamento-form.component.ts`

**Contenido completo:**

```typescript
import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { DepartamentoService, Departamento } from '../../departamento.service';
import { EmployeeService } from '../../employee.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { NotificationService } from '../../notification.service';

@Component({
  selector: 'app-departamento-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule
  ],
  templateUrl: './departamento-form.component.html',
  styleUrls: ['./departamento-form.component.css']
})
export class DepartamentoFormComponent implements OnInit {
  departamentoForm: FormGroup;
  empleados: any[] = [];
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private departamentoService: DepartamentoService,
    private employeeService: EmployeeService,
    private notificationService: NotificationService,
    public dialogRef: MatDialogRef<DepartamentoFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Departamento | null
  ) {
    this.isEditMode = !!data;

    this.departamentoForm = this.fb.group({
      descripcion: [data?.descripcion || '', [Validators.required, Validators.maxLength(100)]],
      encargado: [data?.encargado || null]
    });
  }

  ngOnInit(): void {
    this.loadEmpleados();
  }

  loadEmpleados(): void {
    // Cargar lista de empleados para el select
    this.employeeService.getEmployees(1, 1000, '').subscribe({
      next: (response) => {
        this.empleados = response.data;
      },
      error: (error) => {
        console.error('Error al cargar empleados:', error);
      }
    });
  }

  onSubmit(): void {
    if (this.departamentoForm.valid) {
      const departamentoData = this.departamentoForm.value;

      // Si encargado está vacío, enviar null
      if (!departamentoData.encargado) {
        departamentoData.encargado = null;
      }

      if (this.isEditMode && this.data?.id_departamentos) {
        // Actualizar
        this.departamentoService.updateDepartamento(this.data.id_departamentos, departamentoData)
          .subscribe({
            next: () => {
              this.dialogRef.close(true);
            },
            error: (error) => {
              this.notificationService.showError('Error al actualizar el departamento');
              console.error('Error:', error);
            }
          });
      } else {
        // Crear
        this.departamentoService.addDepartamento(departamentoData)
          .subscribe({
            next: () => {
              this.dialogRef.close(true);
            },
            error: (error) => {
              this.notificationService.showError('Error al crear el departamento');
              console.error('Error:', error);
            }
          });
      }
    } else {
      this.notificationService.showError('Por favor complete todos los campos requeridos');
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
```

**Tiempo estimado:** 30 minutos

---

### 2.5 Actualizar Template del Formulario
**Archivo:** `rangernomina-frontend/src/app/departamento/departamento-form/departamento-form.component.html`

**Contenido completo:**

```html
<h2 mat-dialog-title>{{ isEditMode ? 'Editar Departamento' : 'Nuevo Departamento' }}</h2>

<mat-dialog-content>
  <form [formGroup]="departamentoForm" class="form-container">

    <!-- Campo Descripción -->
    <mat-form-field appearance="outline" class="full-width">
      <mat-label>Descripción</mat-label>
      <input matInput formControlName="descripcion" placeholder="Ej: Recursos Humanos" required>
      <mat-error *ngIf="departamentoForm.get('descripcion')?.hasError('required')">
        La descripción es requerida
      </mat-error>
      <mat-error *ngIf="departamentoForm.get('descripcion')?.hasError('maxlength')">
        Máximo 100 caracteres
      </mat-error>
    </mat-form-field>

    <!-- Campo Encargado -->
    <mat-form-field appearance="outline" class="full-width">
      <mat-label>Encargado</mat-label>
      <mat-select formControlName="encargado">
        <mat-option [value]="null">Sin asignar</mat-option>
        <mat-option *ngFor="let empleado of empleados" [value]="empleado.id_empleado">
          {{ empleado.nombres }} {{ empleado.apellidos }} - {{ empleado.cedula }}
        </mat-option>
      </mat-select>
    </mat-form-field>

  </form>
</mat-dialog-content>

<mat-dialog-actions align="end">
  <button mat-button (click)="onCancel()">Cancelar</button>
  <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="!departamentoForm.valid">
    {{ isEditMode ? 'Actualizar' : 'Guardar' }}
  </button>
</mat-dialog-actions>
```

**Tiempo estimado:** 15 minutos

---

### 2.6 Estilos CSS
**Archivo:** `rangernomina-frontend/src/app/departamento/departamento.component.css`

```css
.container {
  padding: 20px;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 16px;
}

.search-field {
  flex: 1;
  max-width: 400px;
}

table {
  width: 100%;
  margin-top: 16px;
}

mat-paginator {
  margin-top: 16px;
}
```

**Archivo:** `rangernomina-frontend/src/app/departamento/departamento-form/departamento-form.component.css`

```css
.form-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 400px;
  padding: 20px 0;
}

.full-width {
  width: 100%;
}
```

**Tiempo estimado:** 10 minutos

---

## Fase 3: Integración y Navegación

### 3.1 Agregar al Menú de Navegación
**Archivo:** `rangernomina-frontend/src/app/navmenu/navmenu.component.ts`

**Acción:** Agregar el item de departamentos en el array de menú (sección de Mantenimientos)

```typescript
{
  label: 'Departamentos',
  icon: 'business',
  route: '/departamentos',
  requiredLevel: 9
}
```

**Tiempo estimado:** 5 minutos

---

### 3.2 Verificar Importaciones en app.config.ts
**Archivo:** `rangernomina-frontend/src/app/app.config.ts`

**Acción:** Asegurar que MatTooltipModule y MatSelectModule estén disponibles globalmente si es necesario

**Tiempo estimado:** 5 minutos

---

## Fase 4: Pruebas

### 4.1 Pruebas Backend
- [ ] GET `/api/rh_departamentos` - Lista con paginación
- [ ] GET `/api/rh_departamentos?search=recursos` - Búsqueda
- [ ] POST `/api/rh_departamentos` - Crear departamento
- [ ] PUT `/api/rh_departamentos/:id` - Actualizar departamento
- [ ] DELETE `/api/rh_departamentos/:id` - Eliminar (sin empleados)
- [ ] DELETE `/api/rh_departamentos/:id` - Validar error (con empleados)

**Tiempo estimado:** 20 minutos

---

### 4.2 Pruebas Frontend
- [ ] Visualizar lista de departamentos paginada
- [ ] Búsqueda por descripción
- [ ] Crear nuevo departamento
- [ ] Editar departamento existente
- [ ] Eliminar departamento (sin empleados)
- [ ] Validar error al eliminar (con empleados)
- [ ] Verificar select de encargados carga correctamente
- [ ] Verificar navegación desde el menú

**Tiempo estimado:** 30 minutos

---

## Resumen de Tiempos

| Fase | Descripción | Tiempo Estimado |
|------|-------------|-----------------|
| 1.1 | Registrar ruta en server.js | 5 min |
| 1.2 | Mejorar modelo backend | 30 min |
| 1.3 | Actualizar rutas backend | 20 min |
| 2.1 | Actualizar servicio frontend | 15 min |
| 2.2 | Refactorizar componente principal | 40 min |
| 2.3 | Actualizar template principal | 20 min |
| 2.4 | Refactorizar formulario a dialog | 30 min |
| 2.5 | Actualizar template formulario | 15 min |
| 2.6 | Estilos CSS | 10 min |
| 3.1 | Agregar al menú | 5 min |
| 3.2 | Verificar importaciones | 5 min |
| 4.1 | Pruebas backend | 20 min |
| 4.2 | Pruebas frontend | 30 min |
| **TOTAL** | | **~4 horas** |

---

## Estructura de la Base de Datos

**Tabla:** `rh_departamentos`

```sql
CREATE TABLE rh_departamentos (
  id_departamentos INT AUTO_INCREMENT PRIMARY KEY,
  descripcion VARCHAR(100) NOT NULL,
  encargado INT NULL,
  FOREIGN KEY (encargado) REFERENCES rh_empleado(id_empleado)
);
```

**Relaciones:**
- `rh_empleado.id_departamento` → `rh_departamentos.id_departamentos`
- `rh_departamentos.encargado` → `rh_empleado.id_empleado`

---

## Notas Importantes

1. **Patrón de Dialog**: El formulario DEBE usar `MAT_DIALOG_DATA` para mantener consistencia con AFP, ARS, Puestos
2. **Paginación Server-Side**: Es crítica para rendimiento cuando hay muchos departamentos
3. **Validación de Integridad**: Evita eliminar departamentos con empleados asignados
4. **Select de Encargado**: Permite asignar un empleado como encargado del departamento
5. **Búsqueda**: Filtra por descripción en tiempo real

---

## Archivos a Modificar/Crear

### Backend
- ✏️ `backend-ranger-nomina/server.js` (verificar registro de ruta)
- ✏️ `backend-ranger-nomina/models/departamentoModel.js` (mejoras)
- ✏️ `backend-ranger-nomina/routes/rh_departamentos.js` (validaciones)

### Frontend
- ✏️ `rangernomina-frontend/src/app/departamento.service.ts` (paginación)
- ✏️ `rangernomina-frontend/src/app/departamento/departamento.component.ts` (refactor completo)
- ✏️ `rangernomina-frontend/src/app/departamento/departamento.component.html` (nueva UI)
- ✏️ `rangernomina-frontend/src/app/departamento/departamento.component.css` (estilos)
- ✏️ `rangernomina-frontend/src/app/departamento/departamento-form/departamento-form.component.ts` (dialog pattern)
- ✏️ `rangernomina-frontend/src/app/departamento/departamento-form/departamento-form.component.html` (dialog template)
- ✏️ `rangernomina-frontend/src/app/departamento/departamento-form/departamento-form.component.css` (estilos form)
- ✏️ `rangernomina-frontend/src/app/navmenu/navmenu.component.ts` (agregar menú)

---

## Checklist de Implementación

- [ ] Fase 1: Backend completado
- [ ] Fase 2: Frontend completado
- [ ] Fase 3: Integración completada
- [ ] Fase 4: Pruebas exitosas
- [ ] Documentación actualizada
- [ ] Commit y push de cambios

---

**Fecha de creación:** 2025-10-06
**Estado:** PENDIENTE
**Prioridad:** ALTA
**Asignado a:** Claude Code
