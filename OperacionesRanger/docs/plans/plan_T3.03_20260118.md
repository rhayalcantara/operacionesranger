# Plan: T3.03 - Implementar NavMenu, Header y Layout

**Fecha**: 2026-01-18
**Tarea padre**: T3.03
**Fase**: Fase 3 - Frontend Base (Sprint 1: Infraestructura)
**Estimación**: 3-4 horas
**Prioridad**: Alta
**Ejecución**: En paralelo con T3.01 y T3.02

---

## Objetivo

Crear los componentes de layout principal de la aplicación Angular: LayoutComponent (contenedor responsivo con sidebar), NavMenuComponent (menú de navegación jerárquico con control por roles), y HeaderComponent (toolbar con información de usuario y menú de acciones).

---

## Contexto

Esta tarea se ejecuta **EN PARALELO** con:
- **T3.01**: Creación del proyecto Angular y estructura base
- **T3.02**: Implementación de AuthService, Guards e Interceptors

**Consideraciones importantes**:
1. **NO editar** archivos de configuración global (angular.json, package.json) - T3.01 los está creando
2. **NO implementar** AuthService - T3.02 lo está creando
3. **Crear mock interface** temporal de AuthService si es necesario para compilación
4. La integración completa con AuthService se hará después de que T3.02 finalice

**Archivos que este subagente va a crear/modificar**:
- `frontend/src/app/layout/layout.component.ts` (NUEVO)
- `frontend/src/app/layout/layout.component.html` (NUEVO)
- `frontend/src/app/layout/layout.component.scss` (NUEVO)
- `frontend/src/app/layout/navmenu/navmenu.component.ts` (NUEVO)
- `frontend/src/app/layout/navmenu/navmenu.component.html` (NUEVO)
- `frontend/src/app/layout/navmenu/navmenu.component.scss` (NUEVO)
- `frontend/src/app/layout/header/header.component.ts` (NUEVO)
- `frontend/src/app/layout/header/header.component.html` (NUEVO)
- `frontend/src/app/layout/header/header.component.scss` (NUEVO)

**Archivos que NO debe tocar**:
- `angular.json`, `package.json`, `tsconfig.json` (gestionados por T3.01)
- `src/app/core/services/auth.service.ts` (T3.02)
- `src/app/core/guards/*` (T3.02)

---

## Subtareas

### 1. Verificar estructura de directorios y crear carpetas de layout
- **Descripción**: Verificar que existe `frontend/src/app/layout/` y crear subcarpetas necesarias
- **Archivos a crear**:
  - `frontend/src/app/layout/` (verificar/crear)
  - `frontend/src/app/layout/navmenu/` (crear)
  - `frontend/src/app/layout/header/` (crear)
- **Comando/herramienta**: Bash (mkdir) o verificación con Glob
- **Resultado esperado**: Estructura de directorios lista para componentes

### 2. Crear LayoutComponent (contenedor principal)
- **Descripción**: Implementar componente de layout con mat-sidenav-container, responsivo
- **Archivos a crear**:
  - `frontend/src/app/layout/layout.component.ts`
  - `frontend/src/app/layout/layout.component.html`
  - `frontend/src/app/layout/layout.component.scss`
- **Funcionalidades**:
  - `<mat-sidenav-container>` con sidebar y contenido principal
  - Sidebar colapsable (toggle button)
  - `<router-outlet>` para rutas hijas
  - Responsive modes: `side` (desktop), `over` (mobile)
  - Breakpoints: >1024px (desktop), 768-1024px (tablet), <768px (mobile)
- **Resultado esperado**: Componente de layout compilando sin errores

### 3. Crear NavMenuComponent (menú de navegación)
- **Descripción**: Implementar menú de navegación con mat-nav-list, items jerárquicos y control por roles
- **Archivos a crear**:
  - `frontend/src/app/layout/navmenu/navmenu.component.ts`
  - `frontend/src/app/layout/navmenu/navmenu.component.html`
  - `frontend/src/app/layout/navmenu/navmenu.component.scss`
- **Funcionalidades**:
  - Array de menuItems con estructura jerárquica
  - Iconos Material Icons para cada item
  - Submenu expandible/colapsable
  - Highlight de ruta activa (RouterLinkActive)
  - Filtrado de items por rol del usuario (usar mock si AuthService no existe)
  - Estructura de menú completa según especificación:
    - Dashboard
    - Mantenimientos (submenu: Clientes, Ubicaciones, Puestos, Feriados, Incentivos, Config Turnos)
    - Turnos (submenu: Registrar, Lista, Resumen)
    - Reportes
    - Usuarios (solo ADMIN)
- **Mock temporal**: Si AuthService no existe aún, crear interface mock:
  ```typescript
  interface MockAuthService {
    getCurrentUser(): { rol: string } | null;
    hasRole(...roles: string[]): boolean;
  }
  ```
- **Resultado esperado**: Menú funcional con items visibles según rol

### 4. Crear HeaderComponent (toolbar superior)
- **Descripción**: Implementar header con mat-toolbar, botón toggle, título, info de usuario y menú
- **Archivos a crear**:
  - `frontend/src/app/layout/header/header.component.ts`
  - `frontend/src/app/layout/header/header.component.html`
  - `frontend/src/app/layout/header/header.component.scss`
- **Funcionalidades**:
  - `<mat-toolbar>` con color primary
  - Botón toggle sidebar (icono `menu`, solo visible en mobile)
  - Título de la app: "Sistema de Gestión de Turnos"
  - Spacer para alinear contenido a la derecha
  - Info de usuario: nombre completo y rol (badge)
  - `<mat-menu>` de usuario con opciones:
    - Cambiar Password (routerLink: `/cambiar-password`)
    - Logout (llamar a AuthService.logout() o mock)
  - @Output() toggleSidebar: EventEmitter para notificar a LayoutComponent
- **Resultado esperado**: Header funcional con menú de usuario

### 5. Implementar estilos responsive para todos los componentes
- **Descripción**: Crear estilos SCSS para cada componente con breakpoints responsivos
- **Archivos a modificar**:
  - `layout.component.scss` (breakpoints para sidenav)
  - `navmenu.component.scss` (estilos de menú)
  - `header.component.scss` (toolbar responsive)
- **Breakpoints**:
  - Desktop (>1024px): sidebar modo `side`, ancho 250px
  - Tablet (768-1024px): sidebar modo `side`, ancho 200px, colapsable
  - Mobile (<768px): sidebar modo `over`, ancho 80vw
- **Estilos**:
  - Variables de color y espaciado consistentes con Material Design
  - Transiciones suaves para toggle
  - Hover states para items de menú
- **Resultado esperado**: Componentes con diseño responsivo funcionando

### 6. Integración de componentes y routing básico
- **Descripción**: Conectar los 3 componentes entre sí
- **Acciones**:
  - LayoutComponent usa `<app-header>` y `<app-navmenu>` como child components
  - HeaderComponent emite evento toggleSidebar → LayoutComponent lo maneja
  - NavMenuComponent usa routerLink y routerLinkActive
  - Verificar que compila sin errores TypeScript
- **Nota**: No modificar app-routing.module.ts (lo hará T3.01 o después)
- **Resultado esperado**: Componentes integrados correctamente

### 7. Pruebas básicas de compilación
- **Descripción**: Verificar que todo compila sin errores
- **Comando**: (solo si T3.01 ya tiene el proyecto corriendo)
  ```bash
  cd frontend
  ng build --configuration development
  ```
  O verificar con:
  ```bash
  ng lint (si está configurado)
  ```
- **Resultado esperado**: Sin errores de compilación TypeScript

---

## Criterios de Aceptación (checklist)

- [ ] LayoutComponent con mat-sidenav-container implementado
- [ ] Sidebar colapsable funcional (toggle button)
- [ ] NavMenuComponent con menú jerárquico (8 items principales + submenus)
- [ ] Items de menú filtrados por rol del usuario (mock o real)
- [ ] Ruta activa highlighted en menú (routerLinkActive)
- [ ] HeaderComponent con mat-toolbar y título
- [ ] Info de usuario mostrada en header (nombre + rol)
- [ ] Menú de usuario funcional (Cambiar Password, Logout)
- [ ] Responsive design implementado (desktop, tablet, mobile)
- [ ] Sidebar modo `side` en desktop, modo `over` en mobile
- [ ] Estilos consistentes con Material Design
- [ ] Sin errores de compilación TypeScript
- [ ] Componentes integrados correctamente entre sí

---

## Archivos a Generar

1. **Layout Component**:
   - `frontend/src/app/layout/layout.component.ts` (clase TypeScript)
   - `frontend/src/app/layout/layout.component.html` (template)
   - `frontend/src/app/layout/layout.component.scss` (estilos)

2. **NavMenu Component**:
   - `frontend/src/app/layout/navmenu/navmenu.component.ts` (clase TypeScript con menuItems array)
   - `frontend/src/app/layout/navmenu/navmenu.component.html` (template con mat-nav-list)
   - `frontend/src/app/layout/navmenu/navmenu.component.scss` (estilos de menú)

3. **Header Component**:
   - `frontend/src/app/layout/header/header.component.ts` (clase TypeScript con EventEmitter)
   - `frontend/src/app/layout/header/header.component.html` (template con mat-toolbar)
   - `frontend/src/app/layout/header/header.component.scss` (estilos de toolbar)

4. **Documentación**:
   - `docs/plans/plan_T3.03_20260118.md` (este archivo)
   - `docs/completed/T3.03_layout_navmenu_header.md` (resultado final)

---

## Riesgos y Consideraciones

### Riesgo 1: AuthService no existe aún (T3.02 en paralelo)
**Mitigación**:
- Crear mock interface temporal para getCurrentUser() y hasRole()
- Ejemplo mock:
  ```typescript
  // Mock temporal - reemplazar cuando AuthService esté listo
  private mockAuthService = {
    getCurrentUser: () => ({ id: 1, username: 'admin', rol: 'ADMIN', nombre_completo: 'Admin User' }),
    hasRole: (...roles: string[]) => roles.includes('ADMIN')
  };
  ```
- Dejar comentario `// TODO: Integrar con AuthService real de T3.02`
- La integración real se hará después de que T3.02 complete

### Riesgo 2: Proyecto Angular no existe aún (T3.01 en paralelo)
**Mitigación**:
- Verificar primero con Glob si existe `frontend/src/app/`
- Si no existe, esperar unos minutos y volver a verificar
- Si después de 5-10 minutos no existe, notificar al coordinador
- T3.01 debería crear estructura en ~1 hora

### Riesgo 3: Angular Material no instalado aún
**Mitigación**:
- T3.01 debe instalar Angular Material
- Si falta, documentar los imports necesarios para que T3.01 los agregue:
  - MatSidenavModule
  - MatToolbarModule
  - MatListModule
  - MatIconModule
  - MatButtonModule
  - MatMenuModule

### Riesgo 4: Conflictos de archivos con otros subagentes
**Mitigación**:
- Este subagente solo crea archivos en `frontend/src/app/layout/`
- T3.01 crea estructura base y configuración
- T3.02 crea archivos en `frontend/src/app/core/`
- No hay solapamiento de archivos → Sin riesgo de conflictos

---

## Notas Adicionales

### Estructura de menuItems

El array de menuItems debe seguir este formato:

```typescript
interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  roles: string[];
  expanded?: boolean;
  children?: MenuItem[];
}

menuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    icon: 'dashboard',
    route: '/dashboard',
    roles: ['ADMIN', 'SUPERVISOR', 'CONSULTA']
  },
  {
    label: 'Mantenimientos',
    icon: 'settings',
    expanded: false,
    roles: ['ADMIN', 'SUPERVISOR'],
    children: [
      { label: 'Clientes', route: '/clientes', icon: 'business', roles: ['ADMIN', 'SUPERVISOR'] },
      { label: 'Ubicaciones', route: '/ubicaciones', icon: 'location_on', roles: ['ADMIN', 'SUPERVISOR'] },
      { label: 'Puestos', route: '/puestos', icon: 'work', roles: ['ADMIN', 'SUPERVISOR'] },
      { label: 'Feriados', route: '/feriados', icon: 'event', roles: ['ADMIN', 'SUPERVISOR'] },
      { label: 'Incentivos', route: '/incentivos', icon: 'attach_money', roles: ['ADMIN', 'SUPERVISOR'] },
      { label: 'Configuración Turnos', route: '/configuracion-turnos', icon: 'schedule', roles: ['ADMIN'] }
    ]
  },
  {
    label: 'Turnos',
    icon: 'assignment',
    expanded: false,
    roles: ['ADMIN', 'SUPERVISOR', 'CONSULTA'],
    children: [
      { label: 'Registrar Turno', route: '/turnos/nuevo', icon: 'add_circle', roles: ['ADMIN', 'SUPERVISOR'] },
      { label: 'Lista de Turnos', route: '/turnos', icon: 'list', roles: ['ADMIN', 'SUPERVISOR', 'CONSULTA'] },
      { label: 'Resumen', route: '/turnos/resumen', icon: 'assessment', roles: ['ADMIN', 'SUPERVISOR', 'CONSULTA'] }
    ]
  },
  {
    label: 'Reportes',
    icon: 'description',
    route: '/reportes',
    roles: ['ADMIN', 'SUPERVISOR']
  },
  {
    label: 'Usuarios',
    icon: 'people',
    route: '/usuarios',
    roles: ['ADMIN']
  }
];
```

### Integración con AuthService (post-tarea)

Una vez que T3.02 complete, se deberá:

1. Importar AuthService real en NavMenuComponent y HeaderComponent
2. Reemplazar mock con inyección de dependencia:
   ```typescript
   constructor(private authService: AuthService) {}
   ```
3. Actualizar métodos para usar servicio real
4. Eliminar código mock

### Testing posterior

Después de completar esta tarea y T3.01, T3.02:
- Verificar que el layout responde correctamente al resize de ventana
- Verificar que el menú muestra/oculta items según rol
- Verificar que el toggle del sidebar funciona en mobile
- Verificar que routerLinkActive marca la ruta actual

---

**Última actualización**: 2026-01-18
**Tiempo estimado**: 3-4 horas
**Responsable**: Subagente T3.03
**Estado**: Plan listo para ejecución
