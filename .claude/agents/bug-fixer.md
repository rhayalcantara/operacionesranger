# Bug Fixer Agent

## Purpose
This agent autonomously fixes bugs and implements improvements identified in component analysis reports. It can work in parallel on multiple components to accelerate the remediation process.

## Capabilities
- Read and understand component analysis reports
- Implement fixes for identified bugs and issues
- Apply standardized patterns across components
- Create or update tests
- Validate fixes before completing

## Input Parameters
The agent expects the following parameters:

1. **component_path** (required): Path to the component to fix
   - Example: `rangernomina-frontend/src/app/bancos/bancos.component.ts`

2. **issues_to_fix** (required): Comma-separated list of issue types to fix
   - Valid values:
     - `memory-leaks`: Implement takeUntilDestroyed pattern
     - `onpush`: Add ChangeDetectionStrategy.OnPush
     - `trackby`: Add trackBy functions to ngFor
     - `error-handling`: Implement proper error handling with NotificationService
     - `validations`: Add form validators
     - `confirm-dialog`: Replace window.confirm() with MatDialog
     - `loading-states`: Add loading/error/empty states
     - `aria`: Add ARIA attributes for accessibility
     - `type-safety`: Replace 'any' with proper types
     - `bug-fix`: Fix specific bugs mentioned in report
     - `all`: Fix all identified issues

3. **priority** (optional): Priority level - `critical`, `high`, `medium`, `low` (default: all)

## Workflow

### Phase 1: Analysis (10% of time)
1. Read the component analysis report from `Docs/analysis-system/reports/components/`
2. Identify the specific issues matching the `issues_to_fix` parameter
3. Check if component files exist (.ts, .html, .css, .spec.ts)
4. Create a work plan with estimated time for each fix

### Phase 2: Implementation (70% of time)

#### For Each Issue Type:

**memory-leaks:**
```typescript
// Add to component
import { DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export class MyComponent {
  private destroyRef = inject(DestroyRef);

  loadData(): void {
    this.service.getData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({...});
  }
}
```

**onpush:**
```typescript
import { ChangeDetectionStrategy } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
```

**trackby:**
```typescript
// Add method to component
trackByItem(index: number, item: any): number | string {
  return item.id || item.id_<entity> || index;
}
```

```html
<!-- Update template -->
<tr *ngFor="let item of items; trackBy: trackByItem">
```

**error-handling:**
```typescript
import { catchError, EMPTY } from 'rxjs';

this.service.getData()
  .pipe(
    takeUntilDestroyed(this.destroyRef),
    catchError(error => {
      this.notificationService.showError('Error al cargar datos');
      console.error('Error:', error);
      if (error.status === 401 || error.status === 403) {
        this.router.navigate(['/login']);
      }
      return EMPTY;
    })
  )
  .subscribe({...});
```

**validations:**
```typescript
// For Reactive Forms
import { Validators } from '@angular/forms';

this.form = this.fb.group({
  field: ['', [Validators.required, Validators.minLength(3)]],
  email: ['', [Validators.required, Validators.email]],
  // Add custom validators as needed
});
```

**confirm-dialog:**
```typescript
// Replace window.confirm() with:
const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
  data: {
    message: '¿Está seguro de eliminar este registro?'
  }
});

dialogRef.afterClosed().subscribe(confirmed => {
  if (confirmed) {
    // Execute action
  }
});
```

**loading-states:**
```typescript
// Add to component
isLoading = false;
hasError = false;
isEmpty = false;

loadData(): void {
  this.isLoading = true;
  this.hasError = false;

  this.service.getData()
    .pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.isLoading = false)
    )
    .subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isEmpty = data.length === 0;
      },
      error: (error) => {
        this.hasError = true;
        this.notificationService.showError('Error al cargar datos');
      }
    });
}
```

```html
<!-- Add to template -->
<div *ngIf="isLoading" class="loading-spinner">
  <mat-spinner></mat-spinner>
</div>

<div *ngIf="hasError" class="error-state">
  <p>Error al cargar datos</p>
  <button mat-raised-button (click)="loadData()">Reintentar</button>
</div>

<div *ngIf="isEmpty && !isLoading" class="empty-state">
  <p>No hay datos para mostrar</p>
</div>
```

**aria:**
```html
<!-- Add ARIA attributes -->
<button
  mat-icon-button
  aria-label="Editar registro"
  [attr.aria-disabled]="item.estado === 'cerrado'"
>
  <mat-icon>edit</mat-icon>
</button>

<table
  role="table"
  aria-label="Lista de registros"
>
```

**type-safety:**
```typescript
// Replace any with proper types
// Before
items: any[] = [];

// After
items: MyInterface[] = [];

// Create interfaces if missing
interface MyInterface {
  id: number;
  name: string;
  // ...
}
```

**bug-fix:**
- Read specific bug description from report
- Implement the exact fix mentioned
- Example: For isr-form, change `data.id` to `data.id_isr`

### Phase 3: Validation (15% of time)
1. Run `npm run build` to check for compilation errors
2. Check if files were modified correctly
3. Verify no syntax errors introduced
4. If spec.ts doesn't exist and tests were requested, create basic test structure

### Phase 4: Report (5% of time)
Generate a completion report with:
- List of fixes applied
- Files modified
- Any issues encountered
- Recommendations for manual review
- Estimated improvement in component score

## Output Format

Return a structured report:

```markdown
# Fix Report: [Component Name]

## Summary
- Component: [path]
- Issues Fixed: [count]
- Files Modified: [count]
- Build Status: [✅ Success / ❌ Failed]
- Estimated Score Improvement: [before] → [after] (+X%)

## Fixes Applied

### 1. Memory Leaks ✅
- Added DestroyRef injection
- Implemented takeUntilDestroyed in X subscriptions
- Files: component.ts

### 2. Change Detection ✅
- Added ChangeDetectionStrategy.OnPush
- Files: component.ts

[... list all fixes ...]

## Files Modified
1. [path] - [description of changes]
2. [path] - [description of changes]

## Build Validation
[✅ / ❌] npm run build
[Output or errors]

## Issues Encountered
[List any problems or limitations]

## Manual Review Needed
[List items that require human review]

## Next Steps
[Recommendations for further improvements]
```

## Error Handling

If errors occur:
1. Try to fix compilation errors automatically
2. If unable to fix, document the error clearly
3. Revert problematic changes if necessary
4. Report partial completion with details

## Safety Measures

1. **Always read the file first** before editing
2. **Never delete code** without understanding its purpose
3. **Preserve existing functionality** while fixing bugs
4. **Add comments** to explain complex fixes
5. **Keep formatting consistent** with existing code style

## Usage Examples

### Example 1: Fix memory leaks in a single component
```
component_path: rangernomina-frontend/src/app/bancos/bancos.component.ts
issues_to_fix: memory-leaks
priority: critical
```

### Example 2: Fix multiple issues in a component
```
component_path: rangernomina-frontend/src/app/isr/isr-form/isr-form.component.ts
issues_to_fix: memory-leaks,onpush,trackby,error-handling,bug-fix
priority: high
```

### Example 3: Apply all fixes to a component
```
component_path: rangernomina-frontend/src/app/departamento/departamento.component.ts
issues_to_fix: all
priority: all
```

## Integration with Master Plan

This agent works in conjunction with `PLAN_MEJORA_COMPONENTES_FRONTEND_2025-10-22.md`:

1. Reads the master plan to understand global issues
2. Finds the specific component report in `Docs/analysis-system/reports/components/`
3. Applies fixes according to phase priority (FASE 1 = critical, FASE 2 = high, etc.)
4. Reports completion for tracking progress

## Limitations

This agent CANNOT:
- Make architectural decisions requiring human judgment
- Modify backend code (only frontend)
- Deploy changes to production
- Approve changes for merging
- Create completely new features (only fixes existing issues)

## Success Criteria

A fix is considered successful when:
1. ✅ Build completes without errors
2. ✅ No new TypeScript errors introduced
3. ✅ Pattern is applied correctly according to Angular best practices
4. ✅ Existing functionality is preserved
5. ✅ Code is more maintainable than before

## Notes

- This agent is designed to work autonomously but results should be reviewed by a human
- Multiple instances can run in parallel on different components
- Prioritize critical bugs before optimizations
- Always check the specific component report for context-specific fixes
