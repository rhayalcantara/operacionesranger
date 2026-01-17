# Issue: Cuota Form Dialog - Employee Pagination Required

**Component:** `cuota-form-dialog.component.ts`
**Date Identified:** 2025-10-22
**Severity:** HIGH
**Type:** Performance Issue

## Problem Description

The cuota form dialog currently loads **1000 employees** in memory without server-side pagination when the component initializes. This creates several problems:

1. **Memory Usage**: Loading 1000 employee records consumes significant memory
2. **Network Overhead**: Large payload on every dialog open
3. **Client-side Filtering**: Filtering 1000 records synchronously can cause UI lag
4. **Scalability**: Won't scale for organizations with >1000 employees

## Current Implementation

```typescript
// Line 129 in cuota-form-dialog.component.ts
this.http.get<{ data: Employee[] }>(`${environment.apiUrl}/empleados/activos?limit=${CUOTA_CONSTANTS.EMPLEADOS_INITIAL_LIMIT}`)
```

Where `EMPLEADOS_INITIAL_LIMIT = 1000`

The component then filters these 1000 employees client-side:

```typescript
private _filtrarEmpleados(value: string | Employee): Employee[] {
  const filterValue = (value || '').toLowerCase().trim();
  return this.empleados.filter(emp =>
    `${emp.nombres} ${emp.apellidos}`.toLowerCase().includes(filterValue) ||
    emp.cedula_empleado?.toLowerCase().includes(filterValue)
  );
}
```

## Recommended Solution

Implement **server-side search with debounce**, similar to the pattern used in `departamento-form-dialog.component.ts`.

### Implementation Steps

1. **Backend**: Create or update endpoint to support search query parameter
   ```
   GET /api/empleados/activos?search={term}&limit=20
   ```

2. **Frontend**: Implement debounced server-side search
   ```typescript
   empleadosFiltrados$: Observable<Employee[]>;

   ngOnInit() {
     this.empleadosFiltrados$ = this.empleadoControl.valueChanges.pipe(
       startWith(''),
       debounceTime(300),
       distinctUntilChanged(),
       switchMap(termino => {
         if (typeof termino === 'object') {
           return of([termino]);
         }
         const busqueda = (termino || '').trim();
         if (!busqueda) {
           return this.employeeService.getActiveEmployees({ limit: 20 });
         }
         return this.employeeService.getActiveEmployees({
           search: busqueda,
           limit: 20
         });
       }),
       map(response => response.data || [])
     );
   }
   ```

3. **Benefits**:
   - Reduces initial load from 1000 to 20 employees
   - Search performed on server (indexed queries)
   - Better UX with debouncing
   - Scalable for any number of employees

## Temporary Mitigation

The constant `EMPLEADOS_INITIAL_LIMIT` has been extracted to make it easy to adjust:

```typescript
const CUOTA_CONSTANTS = {
  // NOTE: Loading 1000 employees is a performance issue
  // TODO: Implement server-side pagination similar to departamento-form
  EMPLEADOS_INITIAL_LIMIT: 1000
} as const;
```

This can be reduced to a smaller number (e.g., 100) as a quick fix, but server-side search is the proper solution.

## Related Files

- **Current Component**: `rangernomina-frontend/src/app/components/cuotas/cuota-form-dialog.component.ts`
- **Reference Pattern**: `rangernomina-frontend/src/app/departamento/departamento-form-dialog.component.ts`
- **Employee Service**: `rangernomina-frontend/src/app/employee.service.ts`
- **Backend Endpoint**: `backend-ranger-nomina/routes/empleadoRoutes.js`

## Priority

**HIGH** - Should be addressed in the next sprint to prevent performance degradation as the employee count grows.

## Status

- [x] Issue documented
- [x] Constant extracted for easy adjustment
- [ ] Backend endpoint with search support verified/created
- [ ] Frontend debounced search implemented
- [ ] Testing completed
- [ ] Deployed to production

## Additional Notes

This same pattern should be verified in other components that load employee lists:
- Employee assignment dialogs
- Vacation form dialogs
- Any other forms with employee autocomplete

Consider creating a **reusable employee autocomplete component** to standardize this pattern across the application.
