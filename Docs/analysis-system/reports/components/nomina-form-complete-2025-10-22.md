# Análisis Completo - nomina-form

**Fecha:** 2025-10-22
**Tipo:** Análisis Completo (Seguridad + Performance + UX)
**Score General:** 68/100
**Estado:** 🟠 REQUIERE MEJORAS

---

## 1. RESUMEN EJECUTIVO

### Scores por Categoría
- 🔒 **Seguridad:** 60/100
- ⚡ **Desempeño:** 65/100
- 🎨 **UX/Visual:** 70/100
- 📋 **Mejores Prácticas:** 75/100

### Top 3 Problemas Críticos
1. 🚨 **Memory Leaks**: Múltiples subscripciones sin unsubscribe (valueChanges, forkJoin, service calls)
2. 🚨 **Validación Inadecuada**: Uso de `alert()` para validación y falta de sanitización en inputs de fechas
3. 🚨 **Change Detection**: Uso de Default Change Detection Strategy causando renders innecesarios

### Top 3 Mejoras Recomendadas
1. 💡 Implementar manejo robusto de errores con feedback visual (SnackBar/Toast)
2. 💡 Agregar validadores personalizados para coherencia de fechas
3. 💡 Mejorar accesibilidad con ARIA labels y navegación por teclado

---

## 2. ANÁLISIS DETALLADO POR CATEGORÍA

### 🔒 SEGURIDAD (60/100)

#### ✅ ASPECTOS POSITIVOS
- Uso de `ReactiveFormsModule` para manejo controlado de formularios
- Validators aplicados en campos críticos (`Validators.required`)
- Disabled fields para campos calculados (previene manipulación)
- No hay uso directo de `innerHTML` o evaluación de código dinámico
- Form control para prevenir doble submit (`isLoading` flag)

#### 🚨 CRÍTICO

**1. Validación con `alert()` - Línea 188**
```typescript
// ❌ PROBLEMA: Uso de alert() bloqueante sin sanitización
if (!isr && id_nomina_isr) {
  alert('Si no desea calcular ISR en esta nómina, no debe seleccionar una nómina anterior.');
  return;
}
```

**Solución:**
```typescript
// ✅ SOLUCIÓN: Usar NotificationService o MatSnackBar
if (!isr && id_nomina_isr) {
  this.notificationService.error(
    'Si no desea calcular ISR en esta nómina, no debe seleccionar una nómina anterior.'
  );
  this.nominaForm.get('id_nomina_isr')?.setValue(null);
  return;
}
```

**2. Falta de sanitización en inputs de fecha**
```typescript
// ❌ PROBLEMA: No hay validación de formato de fechas
fecha_apertura: ['', Validators.required],
fecha_nomina: ['', Validators.required],
```

**Solución:**
```typescript
// ✅ SOLUCIÓN: Agregar validador personalizado
import { AbstractControl, ValidationErrors } from '@angular/forms';

export function dateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const date = new Date(control.value);
    return isNaN(date.getTime()) ? { invalidDate: true } : null;
  };
}

// En el FormBuilder:
fecha_apertura: ['', [Validators.required, dateValidator()]],
```

**3. Falta de validación de coherencia de fechas**
```typescript
// ❌ PROBLEMA: No valida que fecha_fin > fecha_inicio
fecha_inicio: ['', Validators.required],
fecha_fin: ['', Validators.required],
```

**Solución:**
```typescript
// ✅ SOLUCIÓN: Validador personalizado a nivel de formulario
export function dateRangeValidator(): ValidatorFn {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const fechaInicio = formGroup.get('fecha_inicio')?.value;
    const fechaFin = formGroup.get('fecha_fin')?.value;

    if (!fechaInicio || !fechaFin) return null;

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    return inicio >= fin ? { invalidDateRange: true } : null;
  };
}

// En el constructor:
this.nominaForm = this.fb.group({
  // ... campos
}, { validators: dateRangeValidator() });
```

#### ⚠️ ADVERTENCIAS

**1. Ausencia de límites en inputs numéricos**
```html
<!-- ❌ PROBLEMA: Sin restricciones min/max -->
<input type="number" id="quincena" formControlName="quincena" placeholder="1 ó 2">
```

**Solución:**
```html
<!-- ✅ SOLUCIÓN: Agregar restricciones -->
<input type="number" id="quincena" formControlName="quincena"
       placeholder="1 ó 2" min="1" max="2">
```

```typescript
// Y en el FormBuilder:
quincena: [null, [Validators.required, Validators.min(1), Validators.max(2)]],
```

**2. No hay protección contra navegación no guardada**
```typescript
// ❌ PROBLEMA: Usuario puede perder datos al navegar
onCancel(): void {
  if (!this.isLoading) {
    this.location.back();
  }
}
```

**Solución:**
```typescript
// ✅ SOLUCIÓN: Implementar CanDeactivate Guard
export interface ComponentCanDeactivate {
  canDeactivate: () => boolean | Observable<boolean>;
}

@Injectable({ providedIn: 'root' })
export class UnsavedChangesGuard implements CanDeactivate<ComponentCanDeactivate> {
  canDeactivate(component: ComponentCanDeactivate): boolean | Observable<boolean> {
    return component.canDeactivate() ||
           confirm('Tiene cambios sin guardar. ¿Desea salir?');
  }
}
```

---

### ⚡ DESEMPEÑO (65/100)

#### ✅ ASPECTOS POSITIVOS
- Uso de `debounceTime(500)` para evitar múltiples llamadas al API (línea 125)
- Standalone component (mejor tree-shaking)
- Uso de `finalize()` para cleanup de loading state
- Disabled fields en lugar de re-renderizado condicional

#### 🚨 CRÍTICO

**1. Memory Leaks - Múltiples subscripciones sin unsubscribe**
```typescript
// ❌ PROBLEMA: Línea 111-113 - Subscription sin cleanup
this.nominaForm.get('id_tipo_nomina')?.valueChanges.subscribe(tipoNominaId => {
  this.filteredSubnominas = tipoNominaId ? this.subnominas.filter(s => s.tipo_nomina === tipoNominaId) : [];
});
```

**Solución:**
```typescript
// ✅ SOLUCIÓN: Usar takeUntil pattern
import { Subject, takeUntil } from 'rxjs';

export class NominaFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.nominaForm.get('id_tipo_nomina')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(tipoNominaId => {
        this.filteredSubnominas = tipoNominaId
          ? this.subnominas.filter(s => s.tipo_nomina === tipoNominaId)
          : [];
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.formChangesSubscription?.unsubscribe();
  }
}
```

**2. Default Change Detection Strategy**
```typescript
// ❌ PROBLEMA: No especificado, usa Default (check todo el árbol)
@Component({
  selector: 'app-nomina-form',
  standalone: true,
  // ... sin changeDetection
})
```

**Solución:**
```typescript
// ✅ SOLUCIÓN: Usar OnPush para mejor performance
import { ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-nomina-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
```

**3. forkJoin sin manejo de error puede bloquear el componente**
```typescript
// ❌ PROBLEMA: Líneas 72-109 - forkJoin sin error handling
forkJoin([
  this.loadTiposNomina(),
  this.loadSubnominas(),
  this.loadNominasAnteriores()
]).subscribe(() => {
  // ... solo success path
});
```

**Solución:**
```typescript
// ✅ SOLUCIÓN: Agregar error handling
import { catchError, of } from 'rxjs';

forkJoin([
  this.loadTiposNomina().pipe(catchError(() => of([]))),
  this.loadSubnominas().pipe(catchError(() => of({ data: [], total: 0 }))),
  this.loadNominasAnteriores().pipe(catchError(() => of([])))
]).pipe(
  finalize(() => this.isLoading = false)
).subscribe({
  next: () => {
    if (this.nominaId) {
      this.loadNominaData();
    }
  },
  error: (err) => {
    console.error('Error loading initial data:', err);
    this.notificationService.error('Error al cargar datos iniciales');
  }
});
```

#### ⚠️ ADVERTENCIAS

**1. Llamada API en cada cambio de form (líneas 136-139)**
```typescript
// ⚠️ PROBLEMA: Puede generar muchas llamadas si usuario cambia rápido
this.nominaService.getEmployeeCount({ id_tipo_nomina, subnominas_ids, fecha_inicio, fecha_fin })
  .subscribe(response => {
    this.nominaForm.get('cant_empleados')?.setValue(response.count);
  });
```

**Solución:**
```typescript
// ✅ MEJORA: Agregar switchMap para cancelar requests anteriores
actualizarConteoEmpleados(): void {
  const { id_tipo_nomina, subnominas_ids, fecha_inicio, fecha_fin } = this.nominaForm.getRawValue();

  if (id_tipo_nomina && subnominas_ids?.length > 0 && fecha_inicio && fecha_fin) {
    this.nominaService.getEmployeeCount({ id_tipo_nomina, subnominas_ids, fecha_inicio, fecha_fin })
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => {
          this.nominaForm.get('cant_empleados')?.setValue(0);
          return of({ count: 0 });
        })
      )
      .subscribe(response => {
        this.nominaForm.get('cant_empleados')?.setValue(response.count);
      });
  } else {
    this.nominaForm.get('cant_empleados')?.setValue(0);
  }
}
```

**2. No hay lazy loading para opciones grandes**
```typescript
// ⚠️ PROBLEMA: Carga 1000 subnóminas de una vez (línea 152)
return this.subnominaService.getSubnominas(1, 1000).pipe(
```

**Solución:**
```typescript
// ✅ MEJORA: Implementar virtual scroll o paginación en select
// O filtrar del lado del servidor basado en búsqueda
```

#### 💡 SUGERENCIAS

**1. Usar async pipe en lugar de subscripciones manuales**
```typescript
// 💡 SUGERENCIA: Transformar a observables
tiposNomina$ = this.tipoNominaService.getTiposNomina();
subnominas$ = this.subnominaService.getSubnominas(1, 1000).pipe(
  map(data => data.data)
);

// En el template:
<option *ngFor="let tipo of tiposNomina$ | async" [ngValue]="tipo.id_nomina">
```

---

### 🎨 VISUAL/UX (70/100)

#### ✅ ASPECTOS POSITIVOS
- Loading overlay con spinner visual (líneas 6-8 HTML)
- Banner visual para nóminas cerradas (líneas 2-4 HTML)
- Form disabled cuando nómina está cerrada (protección UX)
- Grid responsive con breakpoint mobile (CSS línea 174-178)
- Textos de ayuda contextuales (`.help-text`)
- Placeholder informativos en inputs
- Estilos consistentes con sistema de diseño

#### 🚨 CRÍTICO

**1. Falta de accesibilidad (ARIA labels)**
```html
<!-- ❌ PROBLEMA: Select sin aria-label -->
<select id="id_tipo_nomina" formControlName="id_tipo_nomina">
  <option [ngValue]="null" disabled>Seleccione un tipo de nómina</option>
  <option *ngFor="let tipo of tiposNomina" [ngValue]="tipo.id_nomina">{{ tipo.descripcion }}</option>
</select>
```

**Solución:**
```html
<!-- ✅ SOLUCIÓN: Agregar ARIA attributes -->
<select
  id="id_tipo_nomina"
  formControlName="id_tipo_nomina"
  aria-label="Tipo de nómina"
  aria-required="true"
  [attr.aria-invalid]="nominaForm.get('id_tipo_nomina')?.invalid && nominaForm.get('id_tipo_nomina')?.touched">
  <option [ngValue]="null" disabled>Seleccione un tipo de nómina</option>
  <option *ngFor="let tipo of tiposNomina" [ngValue]="tipo.id_nomina">
    {{ tipo.descripcion }}
  </option>
</select>
<div class="error-message"
     *ngIf="nominaForm.get('id_tipo_nomina')?.invalid && nominaForm.get('id_tipo_nomina')?.touched"
     role="alert"
     aria-live="polite">
  Este campo es requerido
</div>
```

**2. No hay indicadores de error visual por campo**
```html
<!-- ❌ PROBLEMA: No muestra errores de validación -->
<input type="text" id="titulo_nomina" formControlName="titulo_nomina" placeholder="Ej: Primera Quincena de Enero">
```

**Solución:**
```html
<!-- ✅ SOLUCIÓN: Mostrar errores -->
<div class="form-field" [class.has-error]="nominaForm.get('titulo_nomina')?.invalid && nominaForm.get('titulo_nomina')?.touched">
  <label for="titulo_nomina">Título Nómina *</label>
  <input
    type="text"
    id="titulo_nomina"
    formControlName="titulo_nomina"
    placeholder="Ej: Primera Quincena de Enero"
    [attr.aria-describedby]="nominaForm.get('titulo_nomina')?.invalid ? 'titulo_nomina_error' : null">
  <span
    id="titulo_nomina_error"
    class="error-message"
    *ngIf="nominaForm.get('titulo_nomina')?.invalid && nominaForm.get('titulo_nomina')?.touched"
    role="alert">
    El título es requerido
  </span>
</div>
```

```css
/* CSS adicional */
.form-field.has-error input,
.form-field.has-error select {
  border-color: #f44336;
}

.error-message {
  color: #f44336;
  font-size: 0.85rem;
  margin-top: 0.25rem;
  display: block;
}
```

**3. Select múltiple sin indicación visual clara**
```html
<!-- ❌ PROBLEMA: Select múltiple HTML nativo - mala UX -->
<select id="subnominas_ids" formControlName="subnominas_ids" multiple>
```

**Solución:**
```html
<!-- ✅ SOLUCIÓN: Usar Angular Material mat-select -->
<mat-form-field appearance="outline">
  <mat-label>Subnóminas</mat-label>
  <mat-select formControlName="subnominas_ids" multiple>
    <mat-option *ngFor="let sub of filteredSubnominas" [value]="sub.id_subnomina">
      {{ sub.descripcion }}
    </mat-option>
  </mat-select>
  <mat-hint>Seleccione una o más subnóminas</mat-hint>
</mat-form-field>
```

#### ⚠️ ADVERTENCIAS

**1. Botones sin estado de loading visual**
```html
<!-- ⚠️ PROBLEMA: Botón solo se deshabilita, no muestra feedback -->
<button type="submit" [disabled]="nominaForm.invalid || isLoading" class="btn btn-primary">
  {{ isEditMode ? 'Actualizar Nómina' : 'Crear Nómina' }}
</button>
```

**Solución:**
```html
<!-- ✅ MEJORA: Agregar spinner en botón -->
<button type="submit" [disabled]="nominaForm.invalid || isLoading" class="btn btn-primary">
  <mat-spinner *ngIf="isLoading" diameter="20" class="inline-spinner"></mat-spinner>
  <span *ngIf="!isLoading">{{ isEditMode ? 'Actualizar Nómina' : 'Crear Nómina' }}</span>
  <span *ngIf="isLoading">Guardando...</span>
</button>
```

**2. Formulario muy largo sin scroll suave**
```css
/* ⚠️ PROBLEMA: Formulario largo sin secciones claras */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}
```

**Solución:**
```html
<!-- ✅ MEJORA: Dividir en secciones con accordion o tabs -->
<mat-accordion>
  <mat-expansion-panel expanded>
    <mat-expansion-panel-header>
      <mat-panel-title>Información General</mat-panel-title>
    </mat-expansion-panel-header>
    <!-- Campos básicos -->
  </mat-expansion-panel>

  <mat-expansion-panel>
    <mat-expansion-panel-header>
      <mat-panel-title>Configuración ISR</mat-panel-title>
    </mat-expansion-panel-header>
    <!-- Campos ISR -->
  </mat-expansion-panel>
</mat-accordion>
```

**3. Campos monetarios sin formato**
```html
<!-- ⚠️ PROBLEMA: No formatea montos (línea 91) -->
<input type="number" id="total_sueldos_bruto" formControlName="total_sueldos_bruto" placeholder="0.00">
```

**Solución:**
```typescript
// ✅ MEJORA: Crear pipe para formato de moneda
@Pipe({ name: 'currency' })
export class CurrencyPipe implements PipeTransform {
  transform(value: number): string {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP'
    }).format(value);
  }
}

// O usar readonly con valor formateado
```

#### 💡 SUGERENCIAS

**1. Mejorar contraste de colores**
```css
/* 💡 MEJORA: Color de texto de ayuda tiene bajo contraste */
.help-text {
  color: #666; /* Contraste ratio: 5.74:1 - WCAG AA OK */
}

/* Mejor: */
.help-text {
  color: #555; /* Contraste ratio: 7.48:1 - WCAG AAA */
}
```

**2. Agregar tooltips informativos**
```html
<!-- 💡 SUGERENCIA: Tooltips para campos complejos -->
<mat-form-field>
  <mat-label>Número de Quincena (Anual)</mat-label>
  <input matInput formControlName="numero_de_quincena">
  <mat-icon matSuffix matTooltip="Número secuencial de 1 a 24 que identifica la quincena en el año">
    help_outline
  </mat-icon>
</mat-form-field>
```

---

### 📋 MEJORES PRÁCTICAS ANGULAR (75/100)

#### ✅ ASPECTOS POSITIVOS
- Standalone component (Angular 15+)
- Reactive Forms (mejor control que Template-Driven)
- Dependency Injection apropiado
- Uso de interfaces tipadas (`Nomina`, `NoTipoNomina`, `Subnomina`)
- Separation of concerns (service layer separado)
- Implementa `OnDestroy` para cleanup
- Uso de `finalize()` para cleanup de estados
- Nombres de métodos descriptivos

#### 🚨 CRÍTICO

**1. Comentarios de código muerto (líneas 81-82, 95, 104)**
```typescript
// ❌ PROBLEMA: Código comentado en producción
// this.nominaService.getSubnominasByNominaId(this.nominaId!).subscribe(subnominas => {
  // const subnominasIds = subnominas.map(s => s.id_subnomina);
```

**Solución:**
```typescript
// ✅ SOLUCIÓN: Eliminar o implementar funcionalidad
// Si es funcionalidad futura, crear un TODO o issue en el tracker
```

**2. Lógica de negocio en el componente**
```typescript
// ❌ PROBLEMA: Conversión de datos en componente (líneas 84-92)
const nominaFormatted = {
  ...nomina,
  fecha_apertura: this.formatDateForInput(nomina.fecha_apertura),
  fecha_cerrada: this.formatDateForInput(nomina.fecha_cerrada),
  // ...
};
```

**Solución:**
```typescript
// ✅ SOLUCIÓN: Mover a service o usar adapter pattern
@Injectable({ providedIn: 'root' })
export class NominaAdapter {
  toFormValue(nomina: Nomina): NominaFormValue {
    return {
      ...nomina,
      fecha_apertura: this.formatDateForInput(nomina.fecha_apertura),
      fecha_cerrada: this.formatDateForInput(nomina.fecha_cerrada),
      fecha_nomina: this.formatDateForInput(nomina.fecha_nomina),
      fecha_inicio: this.formatDateForInput(nomina.fecha_inicio),
      fecha_fin: this.formatDateForInput(nomina.fecha_fin),
      isr: nomina.isr === 1
    };
  }

  fromFormValue(formValue: any): Nomina {
    return {
      ...formValue,
      isr: formValue.isr ? 1 : 0
    };
  }

  private formatDateForInput(dateValue: string | Date | null): string | null {
    if (!dateValue) return null;
    const date = new Date(dateValue);
    return date.toISOString().split('T')[0];
  }
}
```

#### ⚠️ ADVERTENCIAS

**1. No hay manejo de errores en subscribe**
```typescript
// ⚠️ PROBLEMA: Solo maneja success case (línea 204)
action.pipe(
  finalize(() => this.isLoading = false)
).subscribe(() => {
  this.router.navigate(['/nominas']);
});
```

**Solución:**
```typescript
// ✅ SOLUCIÓN: Agregar error handling
action.pipe(
  finalize(() => this.isLoading = false)
).subscribe({
  next: () => {
    this.notificationService.success(
      this.isEditMode ? 'Nómina actualizada correctamente' : 'Nómina creada correctamente'
    );
    this.router.navigate(['/nominas']);
  },
  error: (err) => {
    console.error('Error al guardar nómina:', err);
    this.notificationService.error(
      err.error?.message || 'Error al guardar la nómina. Por favor, intente nuevamente.'
    );
  }
});
```

**2. Duplicación de servicios de nómina**
```typescript
// ⚠️ PROBLEMA: Importa desde ruta incorrecta (línea 3)
import { NominaService } from '../services/nomina.services';
// Debería ser:
// import { NominaService } from '../services/nomina.service';
// O
// import { NominaService } from '../nomina/nomina.service';
```

**Solución:**
```typescript
// ✅ SOLUCIÓN: Consolidar servicios y usar barrel exports
// En app/services/index.ts:
export * from './nomina.service';
export * from './auth.service';
// ... otros servicios

// En componente:
import { NominaService } from '@services';
```

**3. Falta de tipado estricto en algunos lugares**
```typescript
// ⚠️ PROBLEMA: Uso de 'any' (líneas 33, 38, 151, 161)
getNominaById(id: number): Observable<any>
loadSubnominas(): Observable<any>
```

**Solución:**
```typescript
// ✅ SOLUCIÓN: Definir interfaces completas
interface SubnominaResponse {
  data: Subnomina[];
  total: number;
}

loadSubnominas(): Observable<SubnominaResponse> {
  return this.subnominaService.getSubnominas(1, 1000);
}
```

#### 💡 SUGERENCIAS

**1. Extraer constantes mágicas**
```typescript
// 💡 PROBLEMA: Números mágicos (línea 152, 125)
this.subnominaService.getSubnominas(1, 1000)
debounceTime(500)
```

**Solución:**
```typescript
// ✅ MEJORA: Constantes nombradas
const SUBNOMINAS_PAGE_SIZE = 1000;
const FORM_DEBOUNCE_TIME = 500;
```

**2. Usar FormBuilder shorthand**
```typescript
// 💡 MEJORA: Sintaxis más compacta
this.nominaForm = this.fb.group({
  fecha_apertura: ['', Validators.required],
  id_tipo_nomina: [null, Validators.required],
  // ...
});

// Mejor:
this.nominaForm = this.fb.group({
  fecha_apertura: this.fb.control('', { validators: Validators.required }),
  id_tipo_nomina: this.fb.control(null, { validators: Validators.required }),
  // ...
});

// O mejor aún con FormRecord para tipado fuerte:
this.nominaForm = this.fb.nonNullable.group({
  fecha_apertura: ['', [Validators.required]],
  // ...
});
```

**3. Testing readiness**
```typescript
// 💡 SUGERENCIA: Extraer lógica testeable a funciones puras
export function filterSubnominasByTipo(
  subnominas: Subnomina[],
  tipoNominaId: number | null
): Subnomina[] {
  return tipoNominaId
    ? subnominas.filter(s => s.tipo_nomina === tipoNominaId)
    : subnominas;
}

// En el componente:
this.nominaForm.get('id_tipo_nomina')?.valueChanges
  .pipe(takeUntil(this.destroy$))
  .subscribe(tipoNominaId => {
    this.filteredSubnominas = filterSubnominasByTipo(this.subnominas, tipoNominaId);
  });
```

---

## 3. CÓDIGO DE EJEMPLO - COMPONENTE REFACTORIZADO

### Versión Mejorada del Componente TypeScript

```typescript
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { NominaService } from '@services/nomina.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { SubnominaService, Subnomina } from '@services/subnomina.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  finalize,
  forkJoin,
  Observable,
  Subject,
  takeUntil,
  debounceTime,
  filter,
  switchMap,
  catchError,
  of,
  map
} from 'rxjs';
import { NoTipoNomina, NoTipoNominaService } from '@services/no-tipo-nomina.service';
import { Nomina } from '@models/nomina.model';
import { NotificationService } from '@services/notification.service';

// Constantes
const FORM_DEBOUNCE_TIME = 500;
const SUBNOMINAS_PAGE_SIZE = 1000;

// Validadores personalizados
export function dateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const date = new Date(control.value);
    return isNaN(date.getTime()) ? { invalidDate: true } : null;
  };
}

export function dateRangeValidator(): ValidatorFn {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const fechaInicio = formGroup.get('fecha_inicio')?.value;
    const fechaFin = formGroup.get('fecha_fin')?.value;

    if (!fechaInicio || !fechaFin) return null;

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    return inicio >= fin ? { invalidDateRange: true } : null;
  };
}

// Funciones puras (fácilmente testables)
export function filterSubnominasByTipo(
  subnominas: Subnomina[],
  tipoNominaId: number | null
): Subnomina[] {
  return tipoNominaId
    ? subnominas.filter(s => s.tipo_nomina === tipoNominaId)
    : subnominas;
}

@Component({
  selector: 'app-nomina-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './nomina-form.component.html',
  styleUrls: ['./nomina-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NominaFormComponent implements OnInit, OnDestroy {
  // Dependency Injection con inject()
  private fb = inject(FormBuilder);
  private nominaService = inject(NominaService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tipoNominaService = inject(NoTipoNominaService);
  private subnominaService = inject(SubnominaService);
  private location = inject(Location);
  private notificationService = inject(NotificationService);
  private snackBar = inject(MatSnackBar);

  // Estado del componente
  nominaForm!: FormGroup;
  isEditMode = false;
  isLoading = true;
  isClosed = false;
  nominaId: number | null = null;

  // Datos
  tiposNomina: NoTipoNomina[] = [];
  subnominas: Subnomina[] = [];
  filteredSubnominas: Subnomina[] = [];
  nominasAnteriores: Nomina[] = [];

  // Cleanup
  private destroy$ = new Subject<void>();

  constructor() {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.nominaId = Number(this.route.snapshot.params['id']) || null;
    this.loadInitialData();
    this.setupFormListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Inicialización
  private initializeForm(): void {
    this.nominaForm = this.fb.group({
      fecha_apertura: ['', [Validators.required, dateValidator()]],
      id_tipo_nomina: [null, Validators.required],
      quincena: [null, [Validators.required, Validators.min(1), Validators.max(2)]],
      fecha_cerrada: [null],
      status: [false],
      fecha_nomina: ['', [Validators.required, dateValidator()]],
      titulo_nomina: ['', [Validators.required, Validators.maxLength(255)]],
      dias_trabajo_nomina: [null, [Validators.min(1), Validators.max(31)]],
      cant_empleados: [{ value: 0, disabled: true }],
      cant_empleado_vacaciones: [null, [Validators.min(0)]],
      total_sueldos_bruto: [{ value: null, disabled: true }],
      total_incentivos: [{ value: null, disabled: true }],
      total_descuentos: [{ value: null, disabled: true }],
      total_a_Pagar: [{ value: null, disabled: true }],
      fecha_inicio: ['', [Validators.required, dateValidator()]],
      fecha_fin: ['', [Validators.required, dateValidator()]],
      isr: [true],
      id_nomina_isr: [null],
      numero_de_quincena: [null, [Validators.min(1), Validators.max(24)]],
      subnominas_ids: [[]]
    }, {
      validators: dateRangeValidator()
    });
  }

  private loadInitialData(): void {
    this.isLoading = true;

    forkJoin([
      this.loadTiposNomina().pipe(catchError(() => of([]))),
      this.loadSubnominas().pipe(catchError(() => of({ data: [], total: 0 }))),
      this.loadNominasAnteriores().pipe(catchError(() => of([])))
    ]).pipe(
      finalize(() => this.isLoading = false),
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        if (this.nominaId) {
          this.loadNominaData();
        }
      },
      error: (err) => {
        console.error('Error loading initial data:', err);
        this.notificationService.error('Error al cargar datos iniciales');
      }
    });
  }

  private loadNominaData(): void {
    if (!this.nominaId) return;

    this.isLoading = true;
    this.isEditMode = true;

    this.nominaService.getNominaById(this.nominaId)
      .pipe(
        finalize(() => this.isLoading = false),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (nomina) => {
          const nominaFormatted = this.formatNominaForForm(nomina);
          this.nominaForm.patchValue(nominaFormatted);

          if (String(nomina.status) === '0') {
            this.isClosed = true;
            this.nominaForm.disable();
          }

          this.nominaForm.get('id_tipo_nomina')?.updateValueAndValidity({ emitEvent: true });
        },
        error: (err) => {
          console.error('Error loading nomina:', err);
          this.notificationService.error('Error al cargar la nómina');
          this.router.navigate(['/nominas']);
        }
      });
  }

  private setupFormListeners(): void {
    // Filtro de subnóminas por tipo
    this.nominaForm.get('id_tipo_nomina')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(tipoNominaId => {
        this.filteredSubnominas = filterSubnominasByTipo(this.subnominas, tipoNominaId);
      });

    // Conteo de empleados con debounce
    const fieldsToWatch = ['id_tipo_nomina', 'subnominas_ids', 'fecha_inicio', 'fecha_fin'];
    this.nominaForm.valueChanges.pipe(
      debounceTime(FORM_DEBOUNCE_TIME),
      filter(() => fieldsToWatch.some(field => this.nominaForm.get(field)?.valid)),
      switchMap(() => this.getEmployeeCount()),
      takeUntil(this.destroy$)
    ).subscribe(count => {
      this.nominaForm.get('cant_empleados')?.setValue(count);
    });
  }

  private getEmployeeCount(): Observable<number> {
    const { id_tipo_nomina, subnominas_ids, fecha_inicio, fecha_fin } = this.nominaForm.getRawValue();

    if (!id_tipo_nomina || !subnominas_ids?.length || !fecha_inicio || !fecha_fin) {
      return of(0);
    }

    return this.nominaService.getEmployeeCount({
      id_tipo_nomina,
      subnominas_ids,
      fecha_inicio,
      fecha_fin
    }).pipe(
      map(response => response.count),
      catchError(() => of(0))
    );
  }

  // Carga de datos
  private loadTiposNomina(): Observable<NoTipoNomina[]> {
    return this.tipoNominaService.getTiposNomina().pipe(
      map(data => {
        this.tiposNomina = data;
        return data;
      })
    );
  }

  private loadSubnominas(): Observable<{ data: Subnomina[], total: number }> {
    return this.subnominaService.getSubnominas(1, SUBNOMINAS_PAGE_SIZE).pipe(
      map(data => {
        this.subnominas = data.data;
        this.filteredSubnominas = this.subnominas;
        return data;
      })
    );
  }

  private loadNominasAnteriores(): Observable<Nomina[]> {
    return this.nominaService.getNominasHistorico().pipe(
      map((nominas: Nomina[]) => {
        this.nominasAnteriores = nominas.filter(n =>
          !this.isEditMode || n.id_nominas !== this.nominaId
        );
        return this.nominasAnteriores;
      })
    );
  }

  // Formateo
  private formatNominaForForm(nomina: Nomina): any {
    return {
      ...nomina,
      fecha_apertura: this.formatDateForInput(nomina.fecha_apertura),
      fecha_cerrada: this.formatDateForInput(nomina.fecha_cerrada),
      fecha_nomina: this.formatDateForInput(nomina.fecha_nomina),
      fecha_inicio: this.formatDateForInput(nomina.fecha_inicio),
      fecha_fin: this.formatDateForInput(nomina.fecha_fin),
      isr: nomina.isr === 1
    };
  }

  private formatDateForInput(dateValue: string | Date | null): string | null {
    if (!dateValue) return null;
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
  }

  // Validación
  private validateIsrCoherence(): boolean {
    const isr = this.nominaForm.get('isr')?.value;
    const id_nomina_isr = this.nominaForm.get('id_nomina_isr')?.value;

    if (!isr && id_nomina_isr) {
      this.notificationService.error(
        'Si no desea calcular ISR en esta nómina, no debe seleccionar una nómina anterior.'
      );
      this.nominaForm.get('id_nomina_isr')?.setValue(null);
      return false;
    }
    return true;
  }

  // Acciones
  onSubmit(): void {
    if (this.nominaForm.invalid || this.isLoading) {
      this.markFormGroupTouched(this.nominaForm);
      this.notificationService.error('Por favor, complete todos los campos requeridos');
      return;
    }

    if (!this.validateIsrCoherence()) return;

    this.isLoading = true;
    const formValue = this.prepareFormValue();

    const action = this.isEditMode
      ? this.nominaService.updateNomina(this.nominaId!, formValue)
      : this.nominaService.createNomina(formValue);

    action.pipe(
      finalize(() => this.isLoading = false),
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.notificationService.success(
          this.isEditMode ? 'Nómina actualizada correctamente' : 'Nómina creada correctamente'
        );
        this.router.navigate(['/nominas']);
      },
      error: (err) => {
        console.error('Error al guardar nómina:', err);
        this.notificationService.error(
          err.error?.message || 'Error al guardar la nómina. Por favor, intente nuevamente.'
        );
      }
    });
  }

  onCancel(): void {
    if (!this.isLoading) {
      if (this.nominaForm.dirty) {
        const confirmLeave = confirm('Tiene cambios sin guardar. ¿Desea salir?');
        if (!confirmLeave) return;
      }
      this.location.back();
    }
  }

  // Utilidades
  private prepareFormValue(): any {
    const formValue = this.nominaForm.getRawValue();
    formValue.isr = formValue.isr ? 1 : 0;
    return formValue;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Guard para navegación
  canDeactivate(): boolean {
    if (this.nominaForm.dirty && !this.isClosed) {
      return confirm('Tiene cambios sin guardar. ¿Desea salir?');
    }
    return true;
  }

  // Getters para template
  get hasDateRangeError(): boolean {
    return this.nominaForm.hasError('invalidDateRange') &&
           this.nominaForm.get('fecha_inicio')?.touched &&
           this.nominaForm.get('fecha_fin')?.touched;
  }

  getFieldError(fieldName: string): string | null {
    const control = this.nominaForm.get(fieldName);
    if (!control || !control.errors || !control.touched) return null;

    if (control.errors['required']) return 'Este campo es requerido';
    if (control.errors['min']) return `Valor mínimo: ${control.errors['min'].min}`;
    if (control.errors['max']) return `Valor máximo: ${control.errors['max'].max}`;
    if (control.errors['invalidDate']) return 'Fecha inválida';
    if (control.errors['maxlength']) return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;

    return 'Campo inválido';
  }
}
```

### Versión Mejorada del Template HTML

```html
<div class="form-container">
  <!-- Banner de nómina cerrada -->
  <div *ngIf="isClosed" class="closed-banner" role="alert" aria-live="polite">
    <h1>NÓMINA CERRADA</h1>
    <p>Esta nómina ha sido cerrada y no puede ser modificada</p>
  </div>

  <!-- Indicador de carga -->
  <div class="loading-overlay" *ngIf="isLoading" role="status" aria-label="Cargando">
    <mat-spinner></mat-spinner>
  </div>

  <header>
    <h2>{{ isEditMode ? 'Editar' : 'Crear' }} Nómina</h2>
    <p class="subtitle">Complete los campos para gestionar la nómina.</p>
  </header>

  <form [formGroup]="nominaForm" (ngSubmit)="onSubmit()" novalidate>

    <!-- Sección: Información General -->
    <section class="form-section" aria-labelledby="section-general">
      <h3 id="section-general">Información General</h3>

      <div class="form-grid">
        <!-- Título -->
        <div class="form-field"
             [class.has-error]="nominaForm.get('titulo_nomina')?.invalid && nominaForm.get('titulo_nomina')?.touched">
          <label for="titulo_nomina">
            Título Nómina <span class="required" aria-label="requerido">*</span>
          </label>
          <input
            type="text"
            id="titulo_nomina"
            formControlName="titulo_nomina"
            placeholder="Ej: Primera Quincena de Enero"
            aria-required="true"
            [attr.aria-invalid]="nominaForm.get('titulo_nomina')?.invalid && nominaForm.get('titulo_nomina')?.touched"
            [attr.aria-describedby]="nominaForm.get('titulo_nomina')?.invalid ? 'titulo_nomina_error' : null">
          <span
            id="titulo_nomina_error"
            class="error-message"
            *ngIf="nominaForm.get('titulo_nomina')?.invalid && nominaForm.get('titulo_nomina')?.touched"
            role="alert">
            {{ getFieldError('titulo_nomina') }}
          </span>
        </div>

        <!-- Tipo de Nómina -->
        <div class="form-field"
             [class.has-error]="nominaForm.get('id_tipo_nomina')?.invalid && nominaForm.get('id_tipo_nomina')?.touched">
          <label for="id_tipo_nomina">
            Tipo Nómina <span class="required">*</span>
          </label>
          <select
            id="id_tipo_nomina"
            formControlName="id_tipo_nomina"
            aria-required="true"
            [attr.aria-invalid]="nominaForm.get('id_tipo_nomina')?.invalid && nominaForm.get('id_tipo_nomina')?.touched">
            <option [ngValue]="null" disabled>Seleccione un tipo de nómina</option>
            <option *ngFor="let tipo of tiposNomina" [ngValue]="tipo.id_nomina">
              {{ tipo.descripcion }}
            </option>
          </select>
          <span class="error-message"
                *ngIf="nominaForm.get('id_tipo_nomina')?.invalid && nominaForm.get('id_tipo_nomina')?.touched"
                role="alert">
            {{ getFieldError('id_tipo_nomina') }}
          </span>
        </div>

        <!-- Fechas -->
        <div class="form-field"
             [class.has-error]="nominaForm.get('fecha_apertura')?.invalid && nominaForm.get('fecha_apertura')?.touched">
          <label for="fecha_apertura">
            Fecha de Apertura <span class="required">*</span>
          </label>
          <input
            type="date"
            id="fecha_apertura"
            formControlName="fecha_apertura"
            aria-required="true">
          <span class="error-message"
                *ngIf="nominaForm.get('fecha_apertura')?.invalid && nominaForm.get('fecha_apertura')?.touched"
                role="alert">
            {{ getFieldError('fecha_apertura') }}
          </span>
        </div>

        <div class="form-field">
          <label for="fecha_cerrada">Fecha de Cierre</label>
          <input type="date" id="fecha_cerrada" formControlName="fecha_cerrada">
        </div>

        <div class="form-field"
             [class.has-error]="nominaForm.get('fecha_nomina')?.invalid && nominaForm.get('fecha_nomina')?.touched">
          <label for="fecha_nomina">
            Fecha de Nómina <span class="required">*</span>
          </label>
          <input
            type="date"
            id="fecha_nomina"
            formControlName="fecha_nomina"
            aria-required="true">
          <span class="error-message"
                *ngIf="nominaForm.get('fecha_nomina')?.invalid && nominaForm.get('fecha_nomina')?.touched"
                role="alert">
            {{ getFieldError('fecha_nomina') }}
          </span>
        </div>

        <!-- Período -->
        <div class="form-field"
             [class.has-error]="nominaForm.get('fecha_inicio')?.invalid && nominaForm.get('fecha_inicio')?.touched">
          <label for="fecha_inicio">
            Período Inicio <span class="required">*</span>
          </label>
          <input
            type="date"
            id="fecha_inicio"
            formControlName="fecha_inicio"
            aria-required="true">
          <span class="error-message"
                *ngIf="nominaForm.get('fecha_inicio')?.invalid && nominaForm.get('fecha_inicio')?.touched"
                role="alert">
            {{ getFieldError('fecha_inicio') }}
          </span>
        </div>

        <div class="form-field"
             [class.has-error]="nominaForm.get('fecha_fin')?.invalid && nominaForm.get('fecha_fin')?.touched || hasDateRangeError">
          <label for="fecha_fin">
            Período Fin <span class="required">*</span>
          </label>
          <input
            type="date"
            id="fecha_fin"
            formControlName="fecha_fin"
            aria-required="true">
          <span class="error-message"
                *ngIf="nominaForm.get('fecha_fin')?.invalid && nominaForm.get('fecha_fin')?.touched"
                role="alert">
            {{ getFieldError('fecha_fin') }}
          </span>
          <span class="error-message" *ngIf="hasDateRangeError" role="alert">
            La fecha fin debe ser posterior a la fecha inicio
          </span>
        </div>

        <!-- Quincena -->
        <div class="form-field"
             [class.has-error]="nominaForm.get('quincena')?.invalid && nominaForm.get('quincena')?.touched">
          <label for="quincena">
            Quincena <span class="required">*</span>
          </label>
          <input
            type="number"
            id="quincena"
            formControlName="quincena"
            placeholder="1 ó 2"
            min="1"
            max="2"
            aria-required="true">
          <span class="error-message"
                *ngIf="nominaForm.get('quincena')?.invalid && nominaForm.get('quincena')?.touched"
                role="alert">
            {{ getFieldError('quincena') }}
          </span>
        </div>

        <div class="form-field">
          <label for="numero_de_quincena">
            Número de Quincena (Anual)
            <button type="button"
                    class="help-icon"
                    aria-label="Ayuda: Número secuencial de 1 a 24"
                    matTooltip="Número secuencial de 1 a 24 que identifica la quincena en el año">
              ?
            </button>
          </label>
          <input
            type="number"
            id="numero_de_quincena"
            formControlName="numero_de_quincena"
            placeholder="Ej: 1 a 24"
            min="1"
            max="24">
        </div>

        <!-- Subnóminas (mejorar a mat-select en el futuro) -->
        <div class="form-field">
          <label for="subnominas_ids">Subnóminas</label>
          <select
            id="subnominas_ids"
            formControlName="subnominas_ids"
            multiple
            aria-label="Seleccione una o más subnóminas">
            <option *ngFor="let sub of filteredSubnominas" [ngValue]="sub.id_subnomina">
              {{ sub.descripcion }}
            </option>
          </select>
          <p class="help-text">Mantenga presionado Ctrl/Cmd para seleccionar múltiples</p>
        </div>
      </div>
    </section>

    <!-- Sección: Configuración -->
    <section class="form-section" aria-labelledby="section-config">
      <h3 id="section-config">Configuración</h3>

      <div class="form-grid">
        <div class="form-field">
          <label for="cant_empleados">Cantidad de Empleados</label>
          <input
            type="number"
            id="cant_empleados"
            formControlName="cant_empleados"
            placeholder="0"
            readonly
            aria-readonly="true">
          <p class="help-text">Calculado automáticamente según los filtros</p>
        </div>

        <div class="form-field">
          <label for="dias_trabajo_nomina">Días de Trabajo</label>
          <input
            type="number"
            id="dias_trabajo_nomina"
            formControlName="dias_trabajo_nomina"
            placeholder="Ej: 15"
            min="1"
            max="31">
        </div>

        <div class="form-field-checkbox">
          <input type="checkbox" id="status" formControlName="status">
          <label for="status">Nómina Activa</label>
        </div>
      </div>
    </section>

    <!-- Sección: Configuración ISR -->
    <section class="form-section" aria-labelledby="section-isr">
      <h3 id="section-isr">Configuración ISR</h3>

      <div class="form-grid">
        <div class="form-field">
          <mat-checkbox formControlName="isr">
            Calcular ISR en esta nómina
          </mat-checkbox>
          <p class="help-text">
            Marque esta opción si desea que se calcule y aplique el ISR en esta quincena.
          </p>
        </div>

        <div class="form-field" *ngIf="nominaForm.get('isr')?.value">
          <label for="id_nomina_isr">Nómina para Cálculo Acumulativo (Opcional)</label>
          <select id="id_nomina_isr" formControlName="id_nomina_isr">
            <option [ngValue]="null">Ninguna (calcular solo esta quincena)</option>
            <option *ngFor="let nom of nominasAnteriores" [ngValue]="nom.id_nominas">
              {{ nom.titulo_nomina }} - {{ nom.fecha_nomina | date:'dd/MM/yyyy' }}
            </option>
          </select>
          <p class="help-text">
            Si selecciona una nómina anterior, el ISR se calculará acumulando los ingresos de ambas quincenas.
          </p>
        </div>
      </div>
    </section>

    <!-- Sección: Totales (solo en modo edición) -->
    <section class="form-section" *ngIf="isEditMode" aria-labelledby="section-totales">
      <h3 id="section-totales">Totales</h3>

      <div class="form-grid">
        <div class="form-field currency">
          <label for="cant_empleado_vacaciones">Empleados en Vacaciones</label>
          <input
            type="number"
            id="cant_empleado_vacaciones"
            formControlName="cant_empleado_vacaciones"
            placeholder="0"
            min="0">
        </div>

        <div class="form-field currency">
          <label for="total_sueldos_bruto">Total Sueldos Bruto</label>
          <input
            type="number"
            id="total_sueldos_bruto"
            formControlName="total_sueldos_bruto"
            placeholder="0.00"
            readonly>
        </div>

        <div class="form-field currency">
          <label for="total_incentivos">Total Incentivos</label>
          <input
            type="number"
            id="total_incentivos"
            formControlName="total_incentivos"
            placeholder="0.00"
            readonly>
        </div>

        <div class="form-field currency">
          <label for="total_descuentos">Total Descuentos</label>
          <input
            type="number"
            id="total_descuentos"
            formControlName="total_descuentos"
            placeholder="0.00"
            readonly>
        </div>

        <div class="form-field currency">
          <label for="total_a_Pagar">Total a Pagar</label>
          <input
            type="number"
            id="total_a_Pagar"
            formControlName="total_a_Pagar"
            placeholder="0.00"
            readonly>
        </div>
      </div>
    </section>

    <!-- Botones de acción -->
    <footer class="form-actions">
      <button
        type="button"
        class="btn btn-secondary"
        (click)="onCancel()"
        [disabled]="isLoading"
        aria-label="Cancelar y volver">
        Cancelar
      </button>
      <button
        type="submit"
        [disabled]="nominaForm.invalid || isLoading"
        class="btn btn-primary"
        *ngIf="!isClosed"
        [attr.aria-busy]="isLoading">
        <mat-spinner *ngIf="isLoading" diameter="20" class="inline-spinner"></mat-spinner>
        <span *ngIf="!isLoading">{{ isEditMode ? 'Actualizar Nómina' : 'Crear Nómina' }}</span>
        <span *ngIf="isLoading">{{ isEditMode ? 'Actualizando...' : 'Creando...' }}</span>
      </button>
    </footer>

  </form>
</div>
```

### CSS Mejorado

```css
/* Variables CSS para mejor mantenibilidad */
:host {
  --primary-color: #3f51b5;
  --primary-dark: #303f9f;
  --danger-color: #f44336;
  --danger-dark: #d32f2f;
  --success-color: #4caf50;
  --text-color: #333;
  --text-secondary: #555;
  --text-muted: #666;
  --border-color: #ccc;
  --border-light: #e0e0e0;
  --error-color: #f44336;
  --disabled-bg: #c5cae9;
  --focus-shadow: rgba(63, 81, 181, 0.2);

  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: var(--text-color);
}

/* Contenedor principal */
.form-container {
  position: relative;
  max-width: 900px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border-light);
}

/* Banner de nómina cerrada */
.closed-banner {
  background-color: var(--danger-color);
  color: white;
  text-align: center;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border-radius: 8px;
}

.closed-banner h1 {
  margin: 0 0 0.5rem 0;
  font-size: 1.75em;
  font-weight: bold;
}

.closed-banner p {
  margin: 0;
  font-size: 1rem;
}

/* Overlay de carga */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
  border-radius: 8px;
}

/* Encabezado */
header h2 {
  font-size: 1.8rem;
  font-weight: 600;
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: var(--primary-color);
}

.subtitle {
  font-size: 1rem;
  margin-top: 0;
  margin-bottom: 2rem;
  color: var(--text-muted);
}

/* Secciones del formulario */
.form-section {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-light);
}

.form-section:last-of-type {
  border-bottom: none;
}

.form-section h3 {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text-secondary);
}

/* Grid de formulario */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

/* Campos del formulario */
.form-field {
  display: flex;
  flex-direction: column;
}

.form-field label {
  font-weight: 500;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-field label .required {
  color: var(--error-color);
  font-weight: bold;
}

/* Inputs */
.form-field input[type="text"],
.form-field input[type="number"],
.form-field input[type="date"],
.form-field select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: inherit;
}

.form-field input:focus,
.form-field select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--focus-shadow);
}

.form-field input:disabled,
.form-field input[readonly] {
  background-color: #f5f5f5;
  cursor: not-allowed;
  color: var(--text-muted);
}

/* Estados de error */
.form-field.has-error input,
.form-field.has-error select {
  border-color: var(--error-color);
}

.error-message {
  color: var(--error-color);
  font-size: 0.85rem;
  margin-top: 0.25rem;
  display: block;
  min-height: 1.2rem;
}

/* Campos monetarios */
.form-field.currency {
  position: relative;
}

.form-field.currency::before {
  content: 'RD$';
  position: absolute;
  left: 12px;
  top: 38px;
  color: var(--text-muted);
  font-weight: 500;
}

.form-field.currency input {
  padding-left: 3rem;
}

/* Checkboxes */
.form-field-checkbox {
  display: flex;
  align-items: center;
  margin-top: 10px;
  grid-column: span 1;
}

.form-field-checkbox input[type="checkbox"] {
  width: 1.2em;
  height: 1.2em;
  margin-right: 0.6rem;
  cursor: pointer;
}

.form-field-checkbox label {
  font-weight: 500;
  margin-bottom: 0;
  cursor: pointer;
}

/* Select múltiple */
select[multiple] {
  min-height: 120px;
  padding: 0.5rem;
}

select[multiple] option {
  padding: 0.5rem;
}

/* Texto de ayuda */
.help-text {
  display: block;
  font-size: 0.85em;
  color: var(--text-muted);
  margin-top: 4px;
  margin-bottom: 0;
  font-style: italic;
  line-height: 1.4;
}

/* Botón de ayuda */
.help-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1px solid var(--border-color);
  background-color: transparent;
  color: var(--text-muted);
  font-size: 0.75rem;
  cursor: help;
  transition: all 0.2s;
}

.help-icon:hover {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

/* Acciones del formulario */
.form-actions {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-light);
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.form-actions button {
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 140px;
  justify-content: center;
}

.form-actions .btn-primary {
  background-color: var(--primary-color);
}

.form-actions .btn-primary:hover:not(:disabled) {
  background-color: var(--primary-dark);
}

.form-actions .btn-secondary {
  background-color: var(--text-muted);
}

.form-actions .btn-secondary:hover:not(:disabled) {
  background-color: var(--text-secondary);
}

.form-actions .btn-danger {
  background-color: var(--danger-color);
}

.form-actions .btn-danger:hover:not(:disabled) {
  background-color: var(--danger-dark);
}

.form-actions button:disabled {
  background-color: var(--disabled-bg);
  cursor: not-allowed;
  opacity: 0.6;
}

.form-actions button:active:not(:disabled) {
  transform: scale(0.98);
}

/* Spinner inline en botón */
.inline-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
}

/* Diseño responsivo */
@media (max-width: 768px) {
  .form-container {
    margin: 1rem;
    padding: 1.5rem;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  header h2 {
    font-size: 1.5rem;
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .form-actions button {
    width: 100%;
  }
}

/* Mejoras de accesibilidad */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Focus visible para navegación por teclado */
:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

/* Alto contraste */
@media (prefers-contrast: high) {
  .form-field input,
  .form-field select {
    border-width: 2px;
  }

  .form-field.has-error input,
  .form-field.has-error select {
    border-width: 3px;
  }
}
```

---

## 4. PLAN DE ACCIÓN PRIORIZADO

### Prioridad CRÍTICA (Implementar inmediatamente)

1. **[CRÍTICO]** Implementar takeUntil pattern para evitar memory leaks en todas las subscripciones
   - Impacto: Alto - Memory leaks pueden causar degradación de performance
   - Esfuerzo: 2 horas
   - Archivo: `nomina-form.component.ts`

2. **[CRÍTICO]** Reemplazar `alert()` con NotificationService/MatSnackBar
   - Impacto: Alto - Mejor UX y no bloqueante
   - Esfuerzo: 1 hora
   - Archivo: `nomina-form.component.ts` línea 188

3. **[CRÍTICO]** Agregar manejo de errores en todas las subscripciones
   - Impacto: Alto - Previene bloqueos del componente
   - Esfuerzo: 3 horas
   - Archivos: `nomina-form.component.ts` líneas 76, 204, 137

### Prioridad ALTA (Implementar esta semana)

4. **[ALTO]** Agregar validadores personalizados para fechas y rangos
   - Impacto: Medio-Alto - Mejora validación y UX
   - Esfuerzo: 3 horas
   - Archivo: `nomina-form.component.ts`

5. **[ALTO]** Implementar OnPush Change Detection Strategy
   - Impacto: Medio - Mejor performance
   - Esfuerzo: 2 horas
   - Archivo: `nomina-form.component.ts`

6. **[ALTO]** Agregar indicadores de error visual por campo en HTML
   - Impacto: Medio-Alto - Mejora UX significativamente
   - Esfuerzo: 4 horas
   - Archivo: `nomina-form.component.html`

7. **[ALTO]** Implementar accesibilidad (ARIA labels, roles, keyboard navigation)
   - Impacto: Medio-Alto - Cumplimiento WCAG
   - Esfuerzo: 4 horas
   - Archivo: `nomina-form.component.html`

### Prioridad MEDIA (Implementar próximo sprint)

8. **[MEDIO]** Agregar validaciones min/max en inputs numéricos
   - Impacto: Medio - Previene datos inválidos
   - Esfuerzo: 1 hora
   - Archivos: `nomina-form.component.ts`, `nomina-form.component.html`

9. **[MEDIO]** Implementar CanDeactivate Guard para prevenir pérdida de datos
   - Impacto: Medio - Mejora UX
   - Esfuerzo: 2 horas
   - Archivos: Nuevo guard, routing configuration

10. **[MEDIO]** Refactorizar lógica de formateo a service/adapter
    - Impacto: Medio - Mejor arquitectura y testabilidad
    - Esfuerzo: 3 horas
    - Archivo: Nuevo `NominaAdapter` service

11. **[MEDIO]** Reemplazar select múltiple HTML nativo con Angular Material mat-select
    - Impacto: Medio - Mejor UX
    - Esfuerzo: 2 horas
    - Archivo: `nomina-form.component.html`

12. **[MEDIO]** Agregar loading indicator en botones de acción
    - Impacto: Medio - Mejor feedback visual
    - Esfuerzo: 1 hora
    - Archivo: `nomina-form.component.html`, CSS

### Prioridad BAJA (Backlog - mejoras futuras)

13. **[BAJO]** Eliminar código comentado
    - Impacto: Bajo - Limpieza de código
    - Esfuerzo: 30 minutos
    - Archivo: `nomina-form.component.ts`

14. **[BAJO]** Consolidar servicios duplicados de nómina
    - Impacto: Bajo - Mejor organización
    - Esfuerzo: 2 horas
    - Archivos: Services folder

15. **[BAJO]** Implementar barrel exports para imports más limpios
    - Impacto: Bajo - Mejor DX
    - Esfuerzo: 1 hora
    - Archivo: Nuevos `index.ts` files

16. **[BAJO]** Agregar tooltips informativos con Material
    - Impacto: Bajo - UX enhancement
    - Esfuerzo: 2 horas
    - Archivo: `nomina-form.component.html`

17. **[BAJO]** Dividir formulario en secciones con accordion o tabs
    - Impacto: Bajo - UX enhancement para formularios largos
    - Esfuerzo: 4 horas
    - Archivo: `nomina-form.component.html`

18. **[BAJO]** Implementar virtual scroll para selects con muchas opciones
    - Impacto: Bajo - Performance con datasets grandes
    - Esfuerzo: 3 horas
    - Archivo: `nomina-form.component.html`

### Quick Wins (Alta relación impacto/esfuerzo)

- ✅ Reemplazar alert() (1h, alto impacto)
- ✅ Agregar min/max en inputs (1h, medio impacto)
- ✅ Eliminar código comentado (30min, bajo impacto)
- ✅ Agregar loading en botones (1h, medio impacto)

### Esfuerzo Total Estimado
- **Crítico:** 6 horas
- **Alto:** 17 horas
- **Medio:** 11 horas
- **Bajo:** 14.5 horas
- **Total:** ~48.5 horas (~6 días de desarrollo)

---

## 5. RECOMENDACIONES ADICIONALES

### Testing
1. Crear unit tests para validadores personalizados
2. Crear integration tests para el flujo completo de creación/edición
3. Agregar tests de accesibilidad (axe-core)
4. Tests E2E para validar el flujo de usuario

### Monitoreo
1. Implementar logging de errores (Sentry, etc.)
2. Agregar analytics para tracking de uso
3. Monitorear performance metrics (LCP, FID, CLS)

### Documentación
1. Documentar validaciones de negocio
2. Crear Storybook stories para el componente
3. Documentar flujo de datos y estados

### Code Review Checklist
- [ ] Todas las subscripciones tienen unsubscribe/takeUntil
- [ ] Manejo de errores implementado en todas las llamadas HTTP
- [ ] Validaciones de formulario completas
- [ ] Accesibilidad verificada (ARIA, keyboard navigation)
- [ ] Performance optimizado (OnPush, debounceTime, switchMap)
- [ ] Sin código comentado o TODOs sin resolver
- [ ] Tests unitarios pasando
- [ ] Documentación actualizada

---

## Cómo usar este reporte

1. **Revisa el Resumen Ejecutivo** para entender el estado general del componente
2. **Prioriza issues críticos (🚨)** - Estos deben resolverse antes de cualquier release
3. **Implementa Quick Wins primero** - Alta relación beneficio/esfuerzo
4. **Sigue el Plan de Acción propuesto** - Organizado por prioridad e impacto
5. **Re-ejecuta análisis después de cambios** - Para medir mejora

**Próximo análisis recomendado:** 2025-11-22 (1 mes después de implementar mejoras críticas)

---

## Métricas de Mejora Esperadas

Después de implementar todas las mejoras críticas y de alta prioridad:

- **Seguridad:** 60/100 → 85/100 (+25 puntos)
- **Desempeño:** 65/100 → 90/100 (+25 puntos)
- **UX/Visual:** 70/100 → 88/100 (+18 puntos)
- **Mejores Prácticas:** 75/100 → 92/100 (+17 puntos)
- **Score General:** 68/100 → 88/100 (+20 puntos)
- **Estado:** 🟠 REQUIERE MEJORAS → 🟢 EXCELENTE

---

**Fin del Análisis Completo - nomina-form Component**
