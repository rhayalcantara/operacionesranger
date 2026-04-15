# Tareas: Interfaz Standalone - Módulo Novedades de Salud

**Fecha:** 2026-03-16
**Módulo:** Novedades de Salud (RRHH)
**Prerrequisito:** Backend, modelo, rutas, servicio Angular, dialog y tests ya implementados

---

## T-NS-UI-01: Modificar Dialog NovedadSaludFormComponent

**Estado:** Pendiente
**Archivos:**
- `rangernomina-frontend/src/app/components/nomina/novedad-salud-form/novedad-salud-form.ts`
- `rangernomina-frontend/src/app/components/nomina/novedad-salud-form/novedad-salud-form.html`

**Descripción:**
Extender el dialog existente para soportar un modo "nuevo desde listado" donde el empleado no está preseleccionado. Agregar un `mat-select` con campo de búsqueda integrado para seleccionar empleado.

**Detalle:**
- Agregar campo `empleadosDisponibles` a la interface `NovedadSaludDialogData`
- Si `data.id_empleado` es null → mostrar `mat-select` con filtro para elegir empleado
- Si `data.id_empleado` tiene valor → mostrar nombre read-only (comportamiento actual)
- Filtrar empleados que ya tienen novedad registrada en la nómina

**Criterios de aceptación:**
- [ ] Dialog funciona en modo edición (desde nomina-detalle) sin cambios
- [ ] Dialog funciona en modo nuevo (desde listado) con selector de empleado
- [ ] Selector filtra empleados que ya tienen novedad

---

## T-NS-UI-02: Crear Componente NovedadesSaludComponent (Listado Standalone)

**Estado:** Pendiente
**Archivos a crear:**
- `rangernomina-frontend/src/app/components/novedades-salud/novedades-salud.ts`
- `rangernomina-frontend/src/app/components/novedades-salud/novedades-salud.html`
- `rangernomina-frontend/src/app/components/novedades-salud/novedades-salud.css`

**Descripción:**
Crear página standalone siguiendo el patrón de `gestion-vacaciones.component.ts`.

**Funcionalidad:**
1. **Selector de Nómina** (mat-select) → cargar nóminas desde NominaService
2. **Botón "Agregar Novedad"** → habilitado solo con nómina abierta seleccionada
3. **Tabla Material** con columnas: Empleado, Fecha Inicio, Días Licencia, Tipo, Observación, Acciones
4. **Acciones por fila:** Editar (abre dialog existente), Eliminar (confirmation dialog)
5. **Estado nómina:** Si cerrada, ocultar acciones y botón agregar
6. Usar `app-titulo-listados` para el header

**Patrón a seguir:** `components/gestion-vacaciones/gestion-vacaciones.component.ts`
**Servicios a usar:** `NovedadSaludService`, `NominaService`

**Criterios de aceptación:**
- [ ] Selector de nómina muestra nóminas disponibles
- [ ] Al seleccionar nómina, tabla carga novedades existentes
- [ ] Botón "Agregar" abre dialog con selector de empleado
- [ ] Editar abre dialog en modo edición
- [ ] Eliminar muestra confirmación y elimina
- [ ] Nómina cerrada → acciones ocultas

---

## T-NS-UI-03: Registrar Ruta en app.routes.ts

**Estado:** Pendiente
**Archivo:** `rangernomina-frontend/src/app/app.routes.ts`

**Descripción:**
Agregar ruta `/novedades-salud` con lazy loading y AuthGuard.

```typescript
{
  path: 'novedades-salud',
  loadComponent: () => import('./components/novedades-salud/novedades-salud').then(m => m.NovedadesSaludComponent),
  canActivate: [AuthGuard]
}
```

---

## T-NS-UI-04: Agregar Entrada en Menú RRHH

**Estado:** Pendiente
**Archivo:** `rangernomina-frontend/src/app/navmenu/navmenu.ts` (~línea 156-158)

**Descripción:**
Agregar "Novedades de Salud" al menú RRHH, debajo de "Gestión de Vacaciones".

```typescript
const rrhhMenuItems: MenuItem[] = [
  { label: 'Gestión de Vacaciones', link: '/vacaciones' },
  { label: 'Novedades de Salud', link: '/novedades-salud' }
];
```

---

## Orden de implementación

```
T-NS-UI-01 (Dialog) → T-NS-UI-02 (Listado) → T-NS-UI-03 (Ruta) → T-NS-UI-04 (Menú)
```

## Verificación

1. Navegar a RRHH → "Novedades de Salud"
2. Seleccionar nómina abierta → tabla vacía
3. Clic "Agregar Novedad" → dialog con mat-select de empleados → guardar → aparece en tabla
4. Editar novedad → cambiar días → guardar
5. Eliminar novedad → confirmar → desaparece
6. Seleccionar nómina cerrada → sin botones de acción
7. Verificar que botón en nomina-detalle sigue funcionando igual
