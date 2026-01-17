# Guía: OnPush Change Detection en Angular
## Cómo Avisar Cambios con ChangeDetectionStrategy.OnPush

---

## 📚 ¿Qué es OnPush?

`ChangeDetectionStrategy.OnPush` le dice a Angular que **NO verifique automáticamente** si el componente necesita actualizarse. Solo verifica cuando:

1. Una referencia de `@Input()` cambia
2. Un evento del template se dispara (click, input, etc.)
3. Un Observable con `async` pipe emite
4. Llamamos manualmente a `markForCheck()`

---

## 🎯 Métodos para Avisar Cambios

### 1️⃣ ChangeDetectorRef.markForCheck() ⭐ Más Usado

**Cuándo usar:** Cuando modificas propiedades del componente dentro de un Observable.

#### Ejemplo Básico
```typescript
import { ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MiComponente {
  datos: any[] = [];
  isLoading = false;

  constructor(private cdr: ChangeDetectorRef) {}

  loadData(): void {
    this.isLoading = true;
    this.cdr.markForCheck(); // ✅ Avisar cambio de isLoading

    this.service.getData().subscribe({
      next: (data) => {
        this.datos = data;
        this.isLoading = false;
        this.cdr.markForCheck(); // ✅ Avisar datos recibidos
      },
      error: (error) => {
        this.hasError = true;
        this.isLoading = false;
        this.cdr.markForCheck(); // ✅ Avisar error
      }
    });
  }
}
```

#### ✅ Ejemplo del Proyecto (Departamento)
```typescript
loadDepartamentos(): void {
  this.isLoading = true;
  this.hasError = false;
  this.cdr.markForCheck(); // ✅ Avisar inicio de carga

  this.departamentoService.getDepartamentos(this.currentPage, this.pageSize, this.searchTerm)
    .pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.isLoading = false;
        this.cdr.markForCheck(); // ✅ Avisar fin de carga
      }),
      catchError(error => {
        this.hasError = true;
        this.notificationService.showError('Error al cargar departamentos');
        this.cdr.markForCheck(); // ✅ Avisar error
        return EMPTY;
      })
    )
    .subscribe({
      next: (response: DepartamentoPaginado) => {
        this.departamentos = response.data;
        this.totalRecords = response.total;
        this.hasError = false;
        this.cdr.markForCheck(); // ✅ Avisar datos recibidos
      }
    });
}
```

---

### 2️⃣ Async Pipe 🚀 Más Reactivo (Recomendado)

**Ventaja:** Angular automáticamente llama a `markForCheck()` por ti.

#### Antes (Imperativo)
```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DepartamentoComponent {
  departamentos: Departamento[] = [];
  isLoading = false;

  constructor(private cdr: ChangeDetectorRef) {}

  loadDepartamentos(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.service.getDepartamentos().subscribe({
      next: (data) => {
        this.departamentos = data;
        this.isLoading = false;
        this.cdr.markForCheck(); // 😓 Manual
      }
    });
  }
}
```

#### Después (Reactivo) ✅
```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DepartamentoComponent {
  // Observable en lugar de array
  departamentos$ = this.service.getDepartamentos().pipe(
    shareReplay(1) // Cache para múltiples subscripciones
  );

  // No necesitas ChangeDetectorRef
}
```

```html
<!-- El async pipe maneja todo automáticamente -->
<div *ngFor="let dept of departamentos$ | async">
  {{ dept.descripcion }}
</div>

<mat-spinner *ngIf="!(departamentos$ | async)"></mat-spinner>
```

---

### 3️⃣ Inmutabilidad (Cambiar Referencia)

**Concepto:** OnPush detecta cambios cuando la **referencia del objeto** cambia.

#### ❌ Incorrecto - Mutar el array
```typescript
loadDepartamentos(): void {
  this.service.getDepartamentos().subscribe(data => {
    // ❌ Misma referencia - OnPush NO detecta el cambio
    this.departamentos.push(...data);

    // Necesitas markForCheck()
    this.cdr.markForCheck();
  });
}
```

#### ✅ Correcto - Nueva referencia
```typescript
loadDepartamentos(): void {
  this.service.getDepartamentos().subscribe(data => {
    // ✅ Nueva referencia - OnPush detecta automáticamente
    this.departamentos = [...data];

    // No necesitas markForCheck() porque cambió la referencia
  });
}
```

#### Más Ejemplos de Inmutabilidad
```typescript
// ❌ Incorrecto
this.user.name = 'Juan';           // Muta el objeto
this.items[0].active = true;       // Muta el array

// ✅ Correcto
this.user = { ...this.user, name: 'Juan' };  // Nueva referencia
this.items = [...this.items];                 // Nuevo array
this.items = this.items.map((item, i) =>
  i === 0 ? { ...item, active: true } : item
);
```

---

### 4️⃣ Signals 🆕 (Angular 16+) - Futuro

**Ventaja:** Reactividad automática sin `markForCheck()`.

```typescript
import { signal, computed } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DepartamentoComponent {
  // Signals automáticamente notifican cambios
  departamentos = signal<Departamento[]>([]);
  isLoading = signal(true);
  hasError = signal(false);

  // Computed signals
  departamentosCount = computed(() => this.departamentos().length);

  loadDepartamentos(): void {
    this.isLoading.set(true); // ✅ Automático
    this.hasError.set(false); // ✅ Automático

    this.service.getDepartamentos().subscribe({
      next: (data) => {
        this.departamentos.set(data); // ✅ Automático
        this.isLoading.set(false);    // ✅ Automático
      },
      error: () => {
        this.hasError.set(true);      // ✅ Automático
        this.isLoading.set(false);    // ✅ Automático
      }
    });
  }
}
```

```html
<!-- Llamar como función -->
<div *ngFor="let dept of departamentos()">
  {{ dept.descripcion }}
</div>

<p>Total: {{ departamentosCount() }}</p>
```

---

## 🔧 Otros Métodos de ChangeDetectorRef

### detectChanges()
Ejecuta change detection **inmediatamente** solo en este componente.

```typescript
updateData(): void {
  this.data = newData;
  this.cdr.detectChanges(); // ✅ Actualiza AHORA
}
```

**⚠️ Precaución:** Puede causar errores si lo llamas durante change detection.

### detach() / reattach()
Desconecta/reconecta el componente del árbol de change detection.

```typescript
ngOnInit(): void {
  // Pausar change detection
  this.cdr.detach();

  // Actualizar manualmente cuando quieras
  this.loadData();
}

loadData(): void {
  this.service.getData().subscribe(data => {
    this.data = data;
    this.cdr.detectChanges(); // Actualizar manualmente
  });
}
```

---

## 📊 Comparación de Métodos

| Método | Automático | Reactividad | Complejidad | Recomendado |
|--------|-----------|-------------|-------------|-------------|
| **markForCheck()** | ❌ Manual | Media | Baja | ✅ Sí |
| **Async Pipe** | ✅ Sí | Alta | Baja | ⭐ Muy recomendado |
| **Inmutabilidad** | ✅ Sí | Media | Media | ✅ Sí |
| **Signals** | ✅ Sí | Alta | Baja | 🆕 Futuro |
| **detectChanges()** | ❌ Manual | Inmediata | Alta | ⚠️ Usar con cuidado |

---

## 🎯 Cuándo Usar Cada Método

### markForCheck() - Usa cuando:
- ✅ Modificas propiedades en subscriptions
- ✅ Tienes lógica compleja con múltiples estados
- ✅ Necesitas control fino sobre updates
- ✅ **Es el método más común y seguro**

### Async Pipe - Usa cuando:
- ✅ Puedes trabajar con Observables directamente
- ✅ Quieres código más reactivo
- ✅ No necesitas manipular los datos antes de mostrarlos
- ✅ **Ideal para migración gradual a programación reactiva**

### Inmutabilidad - Usa cuando:
- ✅ Tienes estructuras de datos simples
- ✅ Quieres aprovechar OnPush al máximo
- ✅ Estás familiarizado con programación funcional
- ✅ **Combínalo con markForCheck() para garantía**

### Signals - Usa cuando:
- ✅ Usas Angular 16+
- ✅ Quieres el futuro de Angular
- ✅ Inicias un proyecto nuevo
- ✅ **Aún en desarrollo, pero muy prometedor**

---

## ⚠️ Errores Comunes

### Error 1: Olvidar markForCheck()
```typescript
// ❌ El cambio no se refleja en UI
loadData(): void {
  this.service.getData().subscribe(data => {
    this.datos = data; // Sin markForCheck()
  });
}

// ✅ Correcto
loadData(): void {
  this.service.getData().subscribe(data => {
    this.datos = data;
    this.cdr.markForCheck(); // ✅
  });
}
```

### Error 2: Mutar objetos sin cambiar referencia
```typescript
// ❌ OnPush no detecta el cambio
this.user.name = 'Juan';

// ✅ Correcto
this.user = { ...this.user, name: 'Juan' };
```

### Error 3: Llamar detectChanges() durante change detection
```typescript
// ❌ Error: ExpressionChangedAfterItHasBeenCheckedError
ngAfterViewInit(): void {
  this.value = 'nuevo';
  this.cdr.detectChanges(); // ❌
}

// ✅ Correcto
ngAfterViewInit(): void {
  this.value = 'nuevo';
  this.cdr.markForCheck(); // ✅
}
```

---

## 🚀 Patrón Recomendado para el Proyecto

### Patrón Híbrido: markForCheck() + Inmutabilidad

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MiComponente {
  items: Item[] = [];
  isLoading = false;
  hasError = false;

  constructor(
    private service: MiService,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService
  ) {}

  loadItems(): void {
    this.isLoading = true;
    this.hasError = false;
    this.cdr.markForCheck(); // ✅ Avisar inicio

    this.service.getItems()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck(); // ✅ Avisar fin
        }),
        catchError(error => {
          this.hasError = true;
          this.notificationService.showError('Error al cargar');
          this.cdr.markForCheck(); // ✅ Avisar error
          return EMPTY;
        })
      )
      .subscribe({
        next: (response) => {
          // Nueva referencia + markForCheck
          this.items = [...response.data]; // ✅ Inmutabilidad
          this.cdr.markForCheck();          // ✅ Avisar cambio
        }
      });
  }

  addItem(item: Item): void {
    // Nueva referencia
    this.items = [...this.items, item];
    this.cdr.markForCheck();
  }

  updateItem(id: number, updates: Partial<Item>): void {
    // Nueva referencia con inmutabilidad
    this.items = this.items.map(item =>
      item.id === id ? { ...item, ...updates } : item
    );
    this.cdr.markForCheck();
  }

  deleteItem(id: number): void {
    // Nueva referencia
    this.items = this.items.filter(item => item.id !== id);
    this.cdr.markForCheck();
  }
}
```

---

## 📝 Checklist para Migrar a OnPush

Al agregar `OnPush` a un componente, verifica:

- [ ] ✅ Importar `ChangeDetectorRef`
- [ ] ✅ Inyectarlo en el constructor
- [ ] ✅ Agregar `markForCheck()` después de:
  - [ ] Subscripciones que modifican propiedades
  - [ ] Operaciones asíncronas (setTimeout, Promise)
  - [ ] Modificaciones después de eventos externos
- [ ] ✅ Usar inmutabilidad al actualizar arrays/objetos
- [ ] ✅ Considerar migrar a `async` pipe si es posible
- [ ] ✅ Testing completo de la UI

---

## 🎓 Recursos Adicionales

- [Angular Change Detection](https://angular.io/guide/change-detection)
- [OnPush Strategy](https://angular.io/api/core/ChangeDetectionStrategy)
- [ChangeDetectorRef API](https://angular.io/api/core/ChangeDetectorRef)
- [Signals (Angular 16+)](https://angular.io/guide/signals)

---

## 🏆 Mejores Prácticas

1. **Siempre usa markForCheck()** cuando modifiques propiedades en Observables
2. **Prefiere async pipe** para datos que vienen de servicios
3. **Usa inmutabilidad** para aprovechar OnPush al máximo
4. **Evita detectChanges()** a menos que sea absolutamente necesario
5. **Combina métodos:** Inmutabilidad + markForCheck() para máxima seguridad
6. **Migra gradualmente:** No necesitas cambiar todo a la vez

---

**Generado por:** Claude Code
**Fecha:** 2025-10-22
**Versión:** 1.0
