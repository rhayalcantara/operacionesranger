# Tareas: Fase 3 - Frontend Base

**Fase**: Fase 3 - Desarrollo de aplicaciÃ³n Angular
**Fecha de creaciÃ³n**: 2026-01-18
**Estado general**: Pendiente
**Plan general**: `docs/tasks/PLAN_GENERAL_PROYECTO.md`
**Fase anterior**: Fase 2 âœ… Completada parcialmente (19/28 tareas, 67.9% - 2026-01-18)

---

## Leyenda de Estados

- `[ ]` **Pendiente**: No iniciada
- `[â†’]` **En progreso**: Actualmente trabajando en ella
- `[âœ“]` **Completada**: Terminada y documentada
- `[x]` **Bloqueada**: No se puede avanzar por dependencia
- `[~]` **Cancelada**: Ya no es necesaria

---

## Resumen de Progreso

| Estado | Cantidad |
|--------|----------|
| Pendiente | 4 |
| En progreso | 0 |
| Completada | 13 |
| Bloqueada | 0 |
| Cancelada | 0 |
| **TOTAL** | **17** |

**Progreso Fase 3**: 13/17 tareas completadas (76.47%)
**Tiempo acumulado**: 45h 15min (Sprint 1-2: 37h 15min + Ronda 1: T3.17: 3h + T3.11: 2.5h + T3.16: 2.5h)
**Tareas en paralelo ejecutadas**: Ronda 1: 3 tareas (T3.17, T3.11, T3.16)
**Ahorro por paralelizaciÃ³n Ronda 1**: ~5h (8h total → 3h real = 62.5% ahorro)

---

## Objetivo de la Fase 3

Desarrollar la aplicaciÃ³n frontend en Angular 20+ con Angular Material, incluyendo autenticaciÃ³n, mÃ³dulos de mantenimiento (CRUDs), gestiÃ³n de turnos y reportes. Integrar con los endpoints del backend de la Fase 2.

### Entregables Principales
- [ ] AplicaciÃ³n Angular funcional con Angular Material (pendiente T3.01)
- [âœ“] Sistema de autenticaciÃ³n JWT integrado (T3.02 completada)
- [ ] MÃ³dulos CRUD para todas las entidades maestras
- [ ] MÃ³dulo de gestiÃ³n de turnos (registro, consulta, ediciÃ³n)
- [ ] MÃ³dulo de reportes CSV
- [âœ“] Guards y protecciÃ³n de rutas por roles (T3.02 completada)
- [~] Responsive design (mobile-first) - Layout base completado (T3.03)
- [~] Componentes reutilizables y servicios - Layout base completado (T3.03)

---

## Sprint 1: Infraestructura (4 tareas)

### T3.01 - Crear proyecto Angular y estructura base
- **Estado**: [âœ“] Completada
- **Prioridad**: Alta
- **EstimaciÃ³n**: 2-3 horas
- **Tiempo real**: 2h 30min
- **Fecha de completado**: 2026-01-19
- **DocumentaciÃ³n**: `docs/completed/T3.01_proyecto_angular.md`
- **Dependencias**: Ninguna
- **DescripciÃ³n**:
  Crear proyecto Angular 20+ con Angular Material, configurar estructura de carpetas, instalar dependencias principales y configurar estilos globales.

  **Tareas especÃ­ficas**:
  1. Crear proyecto Angular:
     ```bash
     ng new operaciones-ranger-frontend --routing --style=scss
     cd operaciones-ranger-frontend
     ```

  2. Instalar Angular Material y dependencias:
     ```bash
     ng add @angular/material
     npm install @angular/flex-layout
     npm install jwt-decode
     npm install date-fns
     ```

  3. Crear estructura de carpetas:
     ```
     src/app/
     â”œâ”€â”€ core/                   # Servicios singleton y guards
     â”‚   â”œâ”€â”€ guards/
     â”‚   â”œâ”€â”€ interceptors/
     â”‚   â””â”€â”€ services/
     â”œâ”€â”€ shared/                 # Componentes compartidos
     â”‚   â”œâ”€â”€ components/
     â”‚   â””â”€â”€ pipes/
     â”œâ”€â”€ modules/                # MÃ³dulos de features
     â”‚   â”œâ”€â”€ auth/
     â”‚   â”œâ”€â”€ dashboard/
     â”‚   â”œâ”€â”€ clientes/
     â”‚   â”œâ”€â”€ ubicaciones/
     â”‚   â”œâ”€â”€ puestos/
     â”‚   â”œâ”€â”€ feriados/
     â”‚   â”œâ”€â”€ usuarios/
     â”‚   â”œâ”€â”€ incentivos/
     â”‚   â”œâ”€â”€ turnos/
     â”‚   â””â”€â”€ reportes/
     â””â”€â”€ layout/                 # Componentes de layout
         â”œâ”€â”€ header/
         â”œâ”€â”€ navmenu/
         â””â”€â”€ footer/
     ```

  4. Configurar environment files:
     - `src/environments/environment.ts` (development)
     - `src/environments/environment.prod.ts` (production)
     - Variables: `apiBaseUrl`, `apiTimeout`, `appName`

  5. Configurar estilos globales:
     - Tema Angular Material (Indigo-Pink o personalizado)
     - Variables SCSS globales (colores, espaciados)
     - Reset CSS bÃ¡sico

  6. Configurar proxy para desarrollo:
     - Crear `proxy.conf.json` para evitar CORS
     - Proxy `/api` â†’ `http://localhost:3000/api`

  7. Actualizar `angular.json`:
     - Configurar proxy
     - Configurar assets
     - Configurar estilos globales

- **Criterios de AceptaciÃ³n**:
  - [ ] Proyecto Angular creado y compilando sin errores
  - [ ] Angular Material instalado y configurado
  - [ ] Estructura de carpetas creada
  - [ ] Environment files configurados con API base URL
  - [ ] Estilos globales aplicados (tema Material)
  - [ ] Proxy configurado para desarrollo
  - [ ] `npm start` ejecuta sin errores en http://localhost:4200
  - [ ] README.md actualizado con comandos de desarrollo

- **Archivo de Resultado**: `docs/completed/T3.01_proyecto_angular.md`

---

### T3.02 - Implementar AuthService, Guards e Interceptors
- **Estado**: [âœ“] Completada
- **Prioridad**: Alta
- **EstimaciÃ³n**: 4-5 horas
- **Tiempo real**: 4h 45min
- **Fecha de completado**: 2026-01-18
- **Dependencias**: Ninguna (puede ejecutarse en paralelo con T3.01)
- **DescripciÃ³n**:
  Crear servicio de autenticaciÃ³n, guards para protecciÃ³n de rutas, interceptor HTTP para agregar token JWT, y manejo de refresh tokens.

  **Servicios a implementar**:

  **1. AuthService** (`src/app/core/services/auth.service.ts`):
  ```typescript
  interface LoginCredentials {
    username: string;
    password: string;
  }

  interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: {
      id: number;
      username: string;
      rol: 'ADMIN' | 'SUPERVISOR' | 'CONSULTA';
      nombre_completo: string;
    };
  }

  class AuthService {
    login(credentials: LoginCredentials): Observable<AuthResponse>
    logout(): Observable<void>
    refreshToken(): Observable<{ accessToken: string }>
    changePassword(currentPassword: string, newPassword: string): Observable<void>
    isAuthenticated(): boolean
    getCurrentUser(): User | null
    getAccessToken(): string | null
    getRefreshToken(): string | null
    hasRole(...roles: UserRole[]): boolean
  }
  ```

  **2. AuthGuard** (`src/app/core/guards/auth.guard.ts`):
  - Implementar `CanActivate` interface
  - Verificar si el usuario estÃ¡ autenticado
  - Redirigir a `/login` si no estÃ¡ autenticado
  - Intentar refresh token si access token expirÃ³

  **3. RoleGuard** (`src/app/core/guards/role.guard.ts`):
  - Implementar `CanActivate` interface
  - Verificar que el usuario tenga el rol requerido
  - Redirigir a `/unauthorized` si no tiene permiso
  - Uso en rutas: `canActivate: [AuthGuard, RoleGuard], data: { roles: ['ADMIN'] }`

  **4. AuthInterceptor** (`src/app/core/interceptors/auth.interceptor.ts`):
  - Interceptar todas las HTTP requests
  - Agregar header `Authorization: Bearer {token}`
  - Interceptar respuestas 401 (Unauthorized)
  - Intentar refresh token automÃ¡ticamente
  - Si refresh falla, hacer logout y redirigir a login

  **5. ErrorInterceptor** (`src/app/core/interceptors/error.interceptor.ts`):
  - Interceptar errores HTTP
  - Formatear mensajes de error
  - Mostrar notificaciones con SnackBar
  - Log de errores en consola (development)

  **Almacenamiento de tokens**:
  - Access token: `localStorage.setItem('access_token', token)`
  - Refresh token: `localStorage.setItem('refresh_token', token)`
  - User data: `localStorage.setItem('current_user', JSON.stringify(user))`

  **ValidaciÃ³n de tokens**:
  - Usar `jwt-decode` para decodificar token
  - Verificar expiraciÃ³n antes de cada request
  - Auto-refresh si falta < 5 minutos para expirar

- **Criterios de AceptaciÃ³n**:
  - [ ] AuthService implementado con todos los mÃ©todos
  - [ ] AuthGuard protege rutas correctamente
  - [ ] RoleGuard valida roles correctamente
  - [ ] AuthInterceptor agrega token a requests
  - [ ] Auto-refresh token funciona (401 â†’ refresh â†’ retry)
  - [ ] ErrorInterceptor maneja errores HTTP
  - [ ] Tokens almacenados en localStorage
  - [ ] Logout limpia localStorage
  - [ ] Tests unitarios para AuthService (opcional, 10+ tests)

- **Archivo de Resultado**: `docs/completed/T3.02_auth_guards_interceptors.md`

---

### T3.03 - Implementar NavMenu, Header y Layout
- **Estado**: [âœ“] Completada
- **Prioridad**: Alta
- **EstimaciÃ³n**: 3-4 horas
- **Tiempo real**: 3h 15min
- **Fecha de completado**: 2026-01-18
- **Dependencias**: Ninguna (puede ejecutarse en paralelo con T3.01 y T3.02)
- **DescripciÃ³n**:
  Crear componentes de layout principal: sidebar de navegaciÃ³n, header con usuario, y estructura de layout responsivo usando Angular Material.

  **Componentes a crear**:

  **1. LayoutComponent** (`src/app/layout/layout.component.ts`):
  - Usar `<mat-sidenav-container>` para layout responsivo
  - Sidebar colapsable en mobile
  - Outlet para rutas hijas: `<router-outlet>`
  - Footer opcional

  **2. NavMenuComponent** (`src/app/layout/navmenu/navmenu.component.ts`):
  - Usar `<mat-nav-list>` para menÃº
  - Items de menÃº con iconos (Material Icons)
  - Submenu jerÃ¡rquico si es necesario
  - Highlight de ruta activa
  - Control de visibilidad por rol:

  **Estructura de menÃº**:
  ```typescript
  menuItems = [
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
        { label: 'Clientes', route: '/clientes', icon: 'business' },
        { label: 'Ubicaciones', route: '/ubicaciones', icon: 'location_on' },
        { label: 'Puestos', route: '/puestos', icon: 'work' },
        { label: 'Feriados', route: '/feriados', icon: 'event' },
        { label: 'Incentivos', route: '/incentivos', icon: 'attach_money' },
        { label: 'ConfiguraciÃ³n Turnos', route: '/configuracion-turnos', icon: 'schedule' }
      ]
    },
    {
      label: 'Turnos',
      icon: 'assignment',
      expanded: false,
      roles: ['ADMIN', 'SUPERVISOR', 'CONSULTA'],
      children: [
        { label: 'Registrar Turno', route: '/turnos/nuevo', icon: 'add_circle', roles: ['ADMIN', 'SUPERVISOR'] },
        { label: 'Lista de Turnos', route: '/turnos', icon: 'list' },
        { label: 'Resumen', route: '/turnos/resumen', icon: 'assessment' }
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

  **3. HeaderComponent** (`src/app/layout/header/header.component.ts`):
  - Toolbar con `<mat-toolbar>`
  - BotÃ³n para toggle sidebar (mobile)
  - TÃ­tulo de la aplicaciÃ³n
  - Info de usuario actual (nombre, rol)
  - Avatar/foto opcional
  - MenÃº de usuario con `<mat-menu>`:
    - Cambiar password
    - Logout

  **Responsive Design**:
  - Desktop (>1024px): Sidebar siempre visible
  - Tablet (768-1024px): Sidebar colapsable
  - Mobile (<768px): Sidebar overlay (over mode)

- **Criterios de AceptaciÃ³n**:
  - [ ] LayoutComponent con sidenav funcionando
  - [ ] NavMenuComponent con menÃº jerÃ¡rquico
  - [ ] Items de menÃº filtrados por rol del usuario
  - [ ] Ruta activa highlighted en menÃº
  - [ ] HeaderComponent con info de usuario
  - [ ] MenÃº de usuario funcional (cambiar password, logout)
  - [ ] Responsive design (mobile, tablet, desktop)
  - [ ] Sidebar colapsable en mobile
  - [ ] Estilos consistentes con Material Design

- **Archivo de Resultado**: `docs/completed/T3.03_layout_navmenu_header.md`

---

### T3.04 - Implementar Dashboard con estadÃ­sticas
- **Estado**: [âœ“] Completada
- **Prioridad**: Media
- **EstimaciÃ³n**: 3-4 horas
- **Tiempo real**: 2h 30min
- **Fecha de completado**: 2026-01-19
- **DocumentaciÃ³n**: `docs/completed/T3.04_dashboard.md`
- **Dependencias**: T3.01, T3.03
- **DescripciÃ³n**:
  Crear componente de dashboard con tarjetas de estadÃ­sticas, accesos rÃ¡pidos y resumen de datos usando los endpoints del backend.

  **Componente**: `DashboardComponent` (`src/app/modules/dashboard/dashboard.component.ts`)

  **Tarjetas de estadÃ­sticas** (usando `<mat-card>`):

  1. **Total de Turnos del Mes Actual**
     - Endpoint: `GET /api/turnos?fecha_inicio=YYYY-MM-01&fecha_fin=YYYY-MM-31`
     - Mostrar total de turnos
     - Icono: `assignment`

  2. **Guardianes Activos**
     - Endpoint: `GET /api/rrhh/guardianes` (contar total)
     - Mostrar cantidad de guardianes activos
     - Icono: `people`

  3. **Turnos Pendientes de Procesar**
     - Endpoint: `GET /api/turnos?procesado_nomina=false`
     - Mostrar cantidad de turnos sin procesar
     - Icono: `pending_actions`
     - Color: warning si > 50

  4. **Horas Totales del Mes**
     - Endpoint: `GET /api/turnos/empleado/{id}/resumen` (para todos)
     - Sumar horas_normales + horas_extras
     - Icono: `schedule`

  **Accesos rÃ¡pidos** (botones con `<mat-button>`):
  - Registrar nuevo turno â†’ `/turnos/nuevo`
  - Ver lista de turnos â†’ `/turnos`
  - Generar reporte â†’ `/reportes`

  **GrÃ¡ficos opcionales** (si hay tiempo):
  - Chart.js o ng2-charts
  - GrÃ¡fico de barras: Turnos por dÃ­a de la semana
  - GrÃ¡fico de pie: Turnos diurnos vs nocturnos

  **Layout**:
  - Usar `<mat-grid-list>` para layout responsivo
  - Desktop: 4 columnas (4 tarjetas en fila)
  - Tablet: 2 columnas
  - Mobile: 1 columna

- **Criterios de AceptaciÃ³n**:
  - [ ] 4 tarjetas de estadÃ­sticas mostrando datos reales del backend
  - [ ] Accesos rÃ¡pidos funcionando (navegaciÃ³n)
  - [ ] Layout responsivo (grid adaptativo)
  - [ ] Loading state mientras cargan datos
  - [ ] Manejo de errores si endpoint falla
  - [ ] Auto-refresh cada 5 minutos (opcional)
  - [ ] GrÃ¡ficos bÃ¡sicos (opcional)

- **Archivo de Resultado**: `docs/completed/T3.04_dashboard.md`

---

## Sprint 2: Maestros CRUD Parte 1 (3 tareas)

### T3.05 - Implementar CRUD de Clientes
- **Estado**: [âœ“] Completada
- **Prioridad**: Alta
- **EstimaciÃ³n**: 4-5 horas
- **Tiempo real**: 3h 45min
- **Fecha de completado**: 2026-01-19
- **DocumentaciÃ³n**: `docs/completed/T3.05_crud_clientes.md`
- **Dependencias**: T3.01, T3.02, T3.03
- **DescripciÃ³n**:
  Crear mÃ³dulo completo para gestiÃ³n de clientes con lista paginada, bÃºsqueda, formulario de crear/editar (dialog) y eliminaciÃ³n.

  **Componentes a crear**:

  **1. ClientesListComponent** (`src/app/modules/clientes/clientes-list/clientes-list.component.ts`):
  - Tabla con `<mat-table>`
  - Columnas: cÃ³digo, nombre, RUC, telÃ©fono, email, contacto, activo, acciones
  - PaginaciÃ³n: `<mat-paginator>` (server-side)
  - BÃºsqueda: Input con debounce (500ms)
  - BotÃ³n "Nuevo Cliente" (abrir dialog)
  - Acciones por fila:
    - Editar (icono `edit`, abrir dialog)
    - Eliminar (icono `delete`, confirmaciÃ³n con MatDialog)
  - Filtro: checkbox "Solo activos"

  **2. ClienteFormComponent** (`src/app/modules/clientes/cliente-form/cliente-form.component.ts`):
  - Dialog con `MatDialogRef`
  - Formulario reactivo (`FormGroup`)
  - Campos:
    - cÃ³digo (opcional, solo lectura si ediciÃ³n)
    - nombre (requerido, max 100 chars)
    - RUC (requerido, formato: 9 dÃ­gitos, Ãºnico)
    - direcciÃ³n (opcional, max 255)
    - telÃ©fono (opcional, formato: (809) 123-4567)
    - email (opcional, validaciÃ³n email)
    - contacto_nombre (opcional, max 100)
    - activo (checkbox, default true)
  - Validaciones:
    - RUC Ãºnico (async validator)
    - Email vÃ¡lido
    - TelÃ©fono formato dominicano
  - Botones: Guardar, Cancelar

  **3. ClientesService** (`src/app/core/services/clientes.service.ts`):
  ```typescript
  interface Cliente {
    id: number;
    codigo: string;
    nombre: string;
    ruc: string;
    direccion?: string;
    telefono?: string;
    email?: string;
    contacto_nombre?: string;
    activo: boolean;
  }

  class ClientesService {
    getAll(page: number, pageSize: number, search?: string): Observable<{ data: Cliente[], total: number }>
    getById(id: number): Observable<Cliente>
    create(cliente: Partial<Cliente>): Observable<Cliente>
    update(id: number, cliente: Partial<Cliente>): Observable<Cliente>
    delete(id: number): Observable<void>
  }
  ```

  **Endpoints usados**:
  - GET /api/clientes?page=1&pageSize=10&search=nombre
  - GET /api/clientes/:id
  - POST /api/clientes
  - PUT /api/clientes/:id
  - DELETE /api/clientes/:id

  **Routing**:
  - Ruta: `/clientes`
  - Guard: `AuthGuard, RoleGuard` (roles: ADMIN, SUPERVISOR)

- **Criterios de AceptaciÃ³n**:
  - [ ] Lista de clientes con paginaciÃ³n server-side
  - [ ] BÃºsqueda funcional con debounce
  - [ ] Formulario de crear cliente (dialog)
  - [ ] Formulario de editar cliente (dialog)
  - [ ] EliminaciÃ³n con confirmaciÃ³n
  - [ ] Validaciones de formulario completas
  - [ ] ValidaciÃ³n async de RUC Ãºnico
  - [ ] Mensajes de error/Ã©xito con SnackBar
  - [ ] Loading states en botones
  - [ ] Responsive design (tabla adaptativa en mobile)

- **Archivo de Resultado**: `docs/completed/T3.05_crud_clientes.md`

---

### T3.06 - Implementar CRUD de Ubicaciones
- **Estado**: [âœ“] Completada
- **Prioridad**: Alta
- **EstimaciÃ³n**: 4-5 horas
- **Tiempo real**: 3h 30min
- **Fecha de completado**: 2026-01-19
- **DocumentaciÃ³n**: `docs/completed/T3.06_crud_ubicaciones.md`
- **Dependencias**: T3.01, T3.02, T3.03
- **DescripciÃ³n**:
  Crear mÃ³dulo para gestiÃ³n de ubicaciones con filtro por cliente, lista paginada y formulario con selector jerÃ¡rquico.

  **Componentes a crear**:

  **1. UbicacionesListComponent** (`src/app/modules/ubicaciones/ubicaciones-list/ubicaciones-list.component.ts`):
  - Tabla con `<mat-table>`
  - Columnas: cÃ³digo, nombre, cliente, provincia, municipio, direcciÃ³n, coordenadas GPS, activo, acciones
  - Filtro por cliente: `<mat-select>` con lista de clientes activos
  - PaginaciÃ³n: `<mat-paginator>` (server-side)
  - BÃºsqueda: Input con debounce
  - BotÃ³n "Nueva UbicaciÃ³n"
  - Acciones: Editar, Eliminar

  **2. UbicacionFormComponent** (`src/app/modules/ubicaciones/ubicacion-form/ubicacion-form.component.ts`):
  - Dialog con formulario reactivo
  - Campos:
    - cliente_id (requerido, `<mat-select>` con clientes activos)
    - cÃ³digo (opcional, generado automÃ¡ticamente si vacÃ­o)
    - nombre (requerido, max 100)
    - direcciÃ³n (opcional, max 255)
    - provincia (opcional, `<mat-select>` con provincias RD)
    - municipio (opcional, `<mat-select>` dependiente de provincia)
    - coordenadas_gps (opcional, formato: "lat,lng", ejemplo: "18.4861,-69.9312")
    - activo (checkbox, default true)
  - Validaciones:
    - Cliente requerido
    - CÃ³digo Ãºnico dentro del cliente (async validator)
    - Coordenadas GPS formato vÃ¡lido: `/^-?\d+\.\d+,-?\d+\.\d+$/`
  - Mapa opcional (Leaflet) para seleccionar coordenadas

  **3. UbicacionesService** (`src/app/core/services/ubicaciones.service.ts`):
  ```typescript
  interface Ubicacion {
    id: number;
    cliente_id: number;
    codigo: string;
    nombre: string;
    direccion?: string;
    provincia?: string;
    municipio?: string;
    coordenadas_gps?: string;
    activo: boolean;
    cliente?: { id: number; nombre: string }; // Join
  }

  class UbicacionesService {
    getAll(page: number, pageSize: number, clienteId?: number, search?: string): Observable<{ data: Ubicacion[], total: number }>
    getById(id: number): Observable<Ubicacion>
    create(ubicacion: Partial<Ubicacion>): Observable<Ubicacion>
    update(id: number, ubicacion: Partial<Ubicacion>): Observable<Ubicacion>
    delete(id: number): Observable<void>
  }
  ```

  **Endpoints usados**:
  - GET /api/ubicaciones?cliente_id=1&page=1&pageSize=10&search=nombre
  - GET /api/ubicaciones/:id
  - POST /api/ubicaciones
  - PUT /api/ubicaciones/:id
  - DELETE /api/ubicaciones/:id

  **Provincias y Municipios RD** (hardcoded arrays):
  - Provincias: Santo Domingo, Santiago, La Vega, San CristÃ³bal, etc.
  - Municipios: dependientes de provincia seleccionada

- **Criterios de AceptaciÃ³n**:
  - [ ] Lista de ubicaciones con filtro por cliente
  - [ ] PaginaciÃ³n y bÃºsqueda funcional
  - [ ] Formulario con selector de cliente
  - [ ] Selector de provincia y municipio (cascada)
  - [ ] ValidaciÃ³n de coordenadas GPS
  - [ ] CÃ³digo Ãºnico por cliente validado
  - [ ] Mensajes de Ã©xito/error
  - [ ] Responsive design
  - [ ] Mapa para seleccionar coordenadas (opcional)

- **Archivo de Resultado**: `docs/completed/T3.06_crud_ubicaciones.md`

---

### T3.07 - Implementar CRUD de Puestos
- **Estado**: [âœ“] Completada
- **Prioridad**: Alta
- **EstimaciÃ³n**: 4-5 horas
- **Tiempo real**: 4h
- **Fecha de completado**: 2026-01-19
- **DocumentaciÃ³n**: `docs/completed/T3.07_crud_puestos.md`
- **Dependencias**: T3.01, T3.02, T3.03
- **DescripciÃ³n**:
  Crear mÃ³dulo para gestiÃ³n de puestos con selector jerÃ¡rquico (Cliente â†’ UbicaciÃ³n â†’ Puesto).

  **Componentes a crear**:

  **1. PuestosListComponent** (`src/app/modules/puestos/puestos-list/puestos-list.component.ts`):
  - Tabla con `<mat-table>`
  - Columnas: cÃ³digo, nombre, ubicaciÃ³n, cliente, horario esperado, requiere armado, activo, acciones
  - Filtros:
    - Por cliente: `<mat-select>`
    - Por ubicaciÃ³n: `<mat-select>` (dependiente de cliente)
  - PaginaciÃ³n y bÃºsqueda
  - BotÃ³n "Nuevo Puesto"
  - Acciones: Editar, Eliminar, Ver Turnos

  **2. PuestoFormComponent** (`src/app/modules/puestos/puesto-form/puesto-form.component.ts`):
  - Dialog con formulario reactivo
  - Selector jerÃ¡rquico:
    1. Cliente (requerido, `<mat-select>`)
    2. UbicaciÃ³n (requerido, `<mat-select>` filtrado por cliente)
  - Campos:
    - ubicacion_id (requerido, del selector)
    - cÃ³digo (requerido, Ãºnico dentro de ubicaciÃ³n)
    - nombre (requerido, max 100)
    - descripciÃ³n (opcional, textarea, max 500)
    - horario_esperado (opcional, ejemplo: "06:00-18:00")
    - requiere_armado (checkbox, default false)
    - activo (checkbox, default true)
  - Validaciones:
    - CÃ³digo Ãºnico por ubicaciÃ³n (async validator)
    - Horario formato HH:mm-HH:mm

  **3. PuestosService** (`src/app/core/services/puestos.service.ts`):
  ```typescript
  interface Puesto {
    id: number;
    ubicacion_id: number;
    codigo: string;
    nombre: string;
    descripcion?: string;
    horario_esperado?: string;
    requiere_armado: boolean;
    activo: boolean;
    ubicacion?: {
      id: number;
      nombre: string;
      cliente: { id: number; nombre: string };
    };
  }

  class PuestosService {
    getAll(page: number, pageSize: number, ubicacionId?: number, clienteId?: number, search?: string): Observable<{ data: Puesto[], total: number }>
    getById(id: number): Observable<Puesto>
    getTurnosByPuesto(puestoId: number): Observable<Turno[]>
    create(puesto: Partial<Puesto>): Observable<Puesto>
    update(id: number, puesto: Partial<Puesto>): Observable<Puesto>
    delete(id: number): Observable<void>
  }
  ```

  **Endpoints usados**:
  - GET /api/puestos?ubicacion_id=1&cliente_id=1&page=1&pageSize=10
  - GET /api/puestos/:id
  - GET /api/puestos/:id/turnos
  - POST /api/puestos
  - PUT /api/puestos/:id
  - DELETE /api/puestos/:id

- **Criterios de AceptaciÃ³n**:
  - [ ] Lista de puestos con filtros por cliente y ubicaciÃ³n
  - [ ] Selector jerÃ¡rquico (Cliente â†’ UbicaciÃ³n)
  - [ ] Formulario con todas las validaciones
  - [ ] CÃ³digo Ãºnico por ubicaciÃ³n validado
  - [ ] Checkbox "Requiere armado" funcional
  - [ ] BotÃ³n "Ver Turnos" navega a lista filtrada
  - [ ] Mensajes de Ã©xito/error
  - [ ] Responsive design

- **Archivo de Resultado**: `docs/completed/T3.07_crud_puestos.md`

---

## Sprint 3: Maestros CRUD Parte 2 (4 tareas)

### T3.08 - Implementar CRUD de Feriados
- **Estado**: [âœ“] Completada
- **Prioridad**: Media
- **EstimaciÃ³n**: 3-4 horas
- **Dependencias**: T3.01, T3.02, T3.03
- **Tiempo real**: 3h 30min
- **Fecha de completado**: 2026-01-19
- **DocumentaciÃ³n**: `docs/completed/T3.08_crud_feriados.md`
- **DescripciÃ³n**:
  Crear mÃ³dulo para gestiÃ³n de feriados nacionales y por decreto con calendario visual.

  **Componentes a crear**:

  **1. FeriadosListComponent** (`src/app/modules/feriados/feriados-list/feriados-list.component.ts`):
  - Vista de calendario: `<mat-calendar>` marcando feriados
  - Tabla con lista de feriados
  - Columnas: fecha, nombre, tipo (NACIONAL/DECRETO), recurrente, activo, acciones
  - Filtros:
    - Por aÃ±o: `<mat-select>` (2024, 2025, 2026, etc.)
    - Por tipo: `<mat-select>` (Todos, NACIONAL, DECRETO)
  - PaginaciÃ³n
  - BotÃ³n "Nuevo Feriado"

  **2. FeriadoFormComponent** (`src/app/modules/feriados/feriado-form/feriado-form.component.ts`):
  - Dialog con formulario reactivo
  - Campos:
    - fecha (requerido, `<mat-datepicker>`)
    - nombre (requerido, max 100)
    - tipo (requerido, `<mat-select>`: NACIONAL, DECRETO)
    - recurrente (checkbox, default: true si NACIONAL, false si DECRETO)
    - activo (checkbox, default true)
  - Validaciones:
    - Fecha no duplicada (async validator)
    - Nombre requerido
  - Helper text: "Feriados nacionales se repiten cada aÃ±o en la misma fecha"

  **3. FeriadosService** (`src/app/core/services/feriados.service.ts`):
  ```typescript
  interface Feriado {
    id: number;
    fecha: string; // ISO: YYYY-MM-DD
    nombre: string;
    tipo: 'NACIONAL' | 'DECRETO';
    recurrente: boolean;
    activo: boolean;
  }

  class FeriadosService {
    getAll(aÃ±o?: number, tipo?: string, page?: number, pageSize?: number): Observable<{ data: Feriado[], total: number }>
    getById(id: number): Observable<Feriado>
    verificarFeriado(fecha: string): Observable<{ es_feriado: boolean; feriado?: Feriado }>
    create(feriado: Partial<Feriado>): Observable<Feriado>
    update(id: number, feriado: Partial<Feriado>): Observable<Feriado>
    delete(id: number): Observable<void>
  }
  ```

  **Endpoints usados**:
  - GET /api/feriados?aÃ±o=2026&tipo=NACIONAL
  - GET /api/feriados/:id
  - GET /api/feriados/verificar/:fecha (ejemplo: /api/feriados/verificar/2026-01-01)
  - POST /api/feriados
  - PUT /api/feriados/:id
  - DELETE /api/feriados/:id

  **Calendario visual**:
  - Usar `<mat-calendar>` con `dateClass` para marcar feriados
  - Feriados nacionales: color azul
  - Feriados por decreto: color verde
  - Click en fecha: abrir dialog para crear feriado en esa fecha

- **Criterios de AceptaciÃ³n**:
  - [ ] Calendario visual marcando feriados
  - [ ] Tabla de feriados con filtros (aÃ±o, tipo)
  - [ ] Formulario con selector de fecha
  - [ ] ValidaciÃ³n de fecha Ãºnica
  - [ ] Checkbox recurrente funcional
  - [ ] Endpoint verificar usado en algÃºn componente
  - [ ] Mensajes de Ã©xito/error
  - [ ] Responsive design

- **Archivo de Resultado**: `docs/completed/T3.08_crud_feriados.md`

---

### T3.09 - Implementar CRUD de Usuarios
- **Estado**: [âœ“] Completada
- **Prioridad**: Media
- **EstimaciÃ³n**: 4-5 horas
- **Tiempo real**: 4h 30min
- **Fecha de completado**: 2026-01-19
- **DocumentaciÃ³n**: `docs/completed/T3.09_crud_usuarios.md`
- **Dependencias**: T3.01, T3.02, T3.03
- **DescripciÃ³n**:
  Crear mÃ³dulo para gestiÃ³n de usuarios del sistema (solo accesible por ADMIN).

  **Componentes a crear**:

  **1. UsuariosListComponent** (`src/app/modules/usuarios/usuarios-list/usuarios-list.component.ts`):
  - Tabla con `<mat-table>`
  - Columnas: username, nombre completo, email, rol, activo, Ãºltimo acceso, acciones
  - BÃºsqueda: por username, email o nombre
  - PaginaciÃ³n
  - BotÃ³n "Nuevo Usuario" (solo ADMIN)
  - Acciones:
    - Editar (solo ADMIN)
    - Reset Password (solo ADMIN)
    - Desactivar/Activar (solo ADMIN)
  - Indicador visual: badge para rol (colores diferentes)

  **2. UsuarioFormComponent** (`src/app/modules/usuarios/usuario-form/usuario-form.component.ts`):
  - Dialog con formulario reactivo
  - Campos (Crear):
    - username (requerido, Ãºnico, min 4 chars, max 50)
    - password (requerido, min 8 chars, 1 mayÃºscula, 1 nÃºmero)
    - confirm_password (requerido, debe coincidir)
    - email (requerido, formato email, Ãºnico)
    - nombre_completo (requerido, max 100)
    - rol (requerido, `<mat-select>`: ADMIN, SUPERVISOR, CONSULTA)
    - activo (checkbox, default true)
  - Campos (Editar):
    - username (solo lectura)
    - email (editable)
    - nombre_completo (editable)
    - rol (editable)
    - activo (editable)
    - NO incluir password (usar endpoint separado)
  - Validaciones:
    - Username Ãºnico (async validator)
    - Email Ãºnico (async validator)
    - Password fuerte (regex)
    - Passwords coinciden (custom validator)

  **3. ResetPasswordDialogComponent** (`src/app/modules/usuarios/reset-password-dialog/reset-password-dialog.component.ts`):
  - Dialog pequeÃ±o para reset password
  - Muestra password temporal generado por backend
  - BotÃ³n para copiar password al portapapeles
  - Mensaje: "El usuario debe cambiar este password en su prÃ³ximo login"

  **4. UsuariosService** (`src/app/core/services/usuarios.service.ts`):
  ```typescript
  interface Usuario {
    id: number;
    username: string;
    email: string;
    nombre_completo: string;
    rol: 'ADMIN' | 'SUPERVISOR' | 'CONSULTA';
    activo: boolean;
    ultimo_acceso: string | null;
    created_at: string;
  }

  class UsuariosService {
    getAll(page: number, pageSize: number, search?: string): Observable<{ data: Usuario[], total: number }>
    getById(id: number): Observable<Usuario>
    create(usuario: Partial<Usuario> & { password: string }): Observable<Usuario>
    update(id: number, usuario: Partial<Usuario>): Observable<Usuario>
    delete(id: number): Observable<void>
    resetPassword(id: number): Observable<{ temporaryPassword: string }>
  }
  ```

  **Endpoints usados**:
  - GET /api/usuarios?page=1&pageSize=10&search=juan
  - GET /api/usuarios/:id
  - POST /api/usuarios
  - PUT /api/usuarios/:id
  - DELETE /api/usuarios/:id (soft delete)
  - POST /api/usuarios/:id/reset-password

  **Routing**:
  - Ruta: `/usuarios`
  - Guard: `AuthGuard, RoleGuard` (roles: **ADMIN solo**)

- **Criterios de AceptaciÃ³n**:
  - [ ] Lista de usuarios (solo visible para ADMIN)
  - [ ] Formulario crear usuario con validaciones completas
  - [ ] Formulario editar usuario (sin password)
  - [ ] Reset password con password temporal
  - [ ] Validaciones async (username Ãºnico, email Ãºnico)
  - [ ] No permitir eliminar Ãºltimo ADMIN
  - [ ] Badge de rol con colores
  - [ ] Mensajes de Ã©xito/error
  - [ ] Responsive design

- **Archivo de Resultado**: `docs/completed/T3.09_crud_usuarios.md`

---

### T3.10 - Implementar CRUD de Incentivos
- **Estado**: [âœ“] Completada
- **Prioridad**: Alta
- **EstimaciÃ³n**: 4-5 horas
- **Tiempo real**: 4h 30min
- **Fecha de completado**: 2026-01-19
- **DocumentaciÃ³n**: `docs/completed/T3.10_crud_incentivos.md`
- **Dependencias**: T3.01, T3.02, T3.03, T3.07 (depende de puestos)
- **DescripciÃ³n**:
  Crear mÃ³dulo para gestiÃ³n de incentivos por puesto y quincena con cÃ¡lculo automÃ¡tico de valor hora.

  **Componentes a crear**:

  **1. IncentivosListComponent** (`src/app/modules/incentivos/incentivos-list/incentivos-list.component.ts`):
  - Tabla con `<mat-table>`
  - Columnas: puesto (con cliente y ubicaciÃ³n), quincena (inicio-fin), monto, valor_hora, concepto, activo, acciones
  - Filtros:
    - Por puesto: autocomplete con bÃºsqueda
    - Por rango de fechas: `<mat-date-range-picker>`
  - PaginaciÃ³n
  - BotÃ³n "Nuevo Incentivo"
  - Acciones: Editar, Eliminar
  - **Valor hora destacado**: mostrado en color verde, calculado automÃ¡ticamente

  **2. IncentivoFormComponent** (`src/app/modules/incentivos/incentivo-form/incentivo-form.component.ts`):
  - Dialog con formulario reactivo
  - Selector jerÃ¡rquico de puesto:
    1. Cliente
    2. UbicaciÃ³n
    3. Puesto
  - Campos:
    - puesto_id (requerido, del selector)
    - quincena_inicio (requerido, `<mat-datepicker>`)
    - quincena_fin (requerido, `<mat-datepicker>`)
    - monto (requerido, number, min 0.01)
    - concepto (opcional, textarea, max 255)
    - activo (checkbox, default true)
  - **CÃ¡lculo automÃ¡tico** (read-only):
    - valor_hora = monto / 360
    - Mostrar: "Valor por hora: RD$ {valor_hora.toFixed(2)}"
  - Validaciones:
    - quincena_inicio < quincena_fin
    - No solapamiento de fechas para mismo puesto (async validator)
    - Monto > 0
  - Helper text: "Quincena = 15 dÃ­as Ã— 24 horas = 360 horas"

  **3. IncentivosService** (`src/app/core/services/incentivos.service.ts`):
  ```typescript
  interface Incentivo {
    id: number;
    puesto_id: number;
    quincena_inicio: string; // ISO date
    quincena_fin: string;
    monto: number;
    concepto?: string;
    valor_hora: number; // Auto-calculado por backend
    activo: boolean;
    puesto?: {
      id: number;
      nombre: string;
      ubicacion: {
        nombre: string;
        cliente: { nombre: string };
      };
    };
  }

  class IncentivosService {
    getAll(page: number, pageSize: number, puestoId?: number, fechaInicio?: string, fechaFin?: string): Observable<{ data: Incentivo[], total: number }>
    getById(id: number): Observable<Incentivo>
    getIncentivosPorQuincena(fecha: string): Observable<Incentivo[]>
    create(incentivo: Partial<Incentivo>): Observable<Incentivo>
    update(id: number, incentivo: Partial<Incentivo>): Observable<Incentivo>
    delete(id: number): Observable<void>
  }
  ```

  **Endpoints usados**:
  - GET /api/incentivos?puesto_id=1&fecha_inicio=2026-01-01&fecha_fin=2026-01-15
  - GET /api/incentivos/:id
  - GET /api/incentivos/quincena/:fecha (ejemplo: /api/incentivos/quincena/2026-01-10)
  - POST /api/incentivos
  - PUT /api/incentivos/:id
  - DELETE /api/incentivos/:id

- **Criterios de AceptaciÃ³n**:
  - [âœ“] Lista de incentivos con filtros por puesto y fechas
  - [âœ“] Selector jerÃ¡rquico (Cliente â†’ UbicaciÃ³n â†’ Puesto)
  - [âœ“] Formulario con validaciÃ³n de solapamiento
  - [âœ“] CÃ¡lculo automÃ¡tico de valor_hora mostrado
  - [âœ“] ValidaciÃ³n de fechas (inicio < fin)
  - [âœ“] Endpoint /quincena/:fecha usado correctamente
  - [âœ“] Mensajes de Ã©xito/error
  - [âœ“] Responsive design

- **Archivo de Resultado**: `docs/completed/T3.10_crud_incentivos.md`

---

### T3.11 - Implementar configuraciÃ³n de turnos
- **Estado**: [✓] Completada
- **Prioridad**: Baja
- **EstimaciÃ³n**: 2-3 horas
- **Tiempo Real**: 2.5 horas
- **Fecha Completada**: 2026-01-19
- **Dependencias**: T3.01, T3.02, T3.03
- **DescripciÃ³n**:
  Crear componente para ver y editar la configuraciÃ³n de turnos (horarios dÃ­a/noche).

  **Componente**: `ConfiguracionTurnosComponent` (`src/app/modules/configuracion-turnos/configuracion-turnos.component.ts`)

  **UI**:
  - 2 tarjetas (MatCard) mostrando configuraciones:
    1. **Turno DIURNO**
       - Hora inicio: 06:00 (editable con `<mat-time-picker>`)
       - Hora fin: 18:00 (editable)
       - DescripciÃ³n
    2. **Turno NOCTURNO**
       - Hora inicio: 18:00
       - Hora fin: 06:00
       - DescripciÃ³n
  - BotÃ³n "Guardar Cambios" (solo ADMIN)
  - **Solo UPDATE**, no CREATE ni DELETE
  - ValidaciÃ³n: horarios no deben solaparse

  **Service**: `ConfiguracionTurnosService`
  ```typescript
  interface ConfiguracionTurno {
    id: number;
    tipo: 'DIURNO' | 'NOCTURNO';
    hora_inicio: string; // "06:00:00"
    hora_fin: string;
    descripcion?: string;
    activo: boolean;
  }

  class ConfiguracionTurnosService {
    getAll(): Observable<ConfiguracionTurno[]>
    getById(id: number): Observable<ConfiguracionTurno>
    update(id: number, config: Partial<ConfiguracionTurno>): Observable<ConfiguracionTurno>
  }
  ```

  **Endpoints usados**:
  - GET /api/configuracion-turnos
  - GET /api/configuracion-turnos/:id
  - PUT /api/configuracion-turnos/:id

  **Validaciones**:
  - Horarios no solapan
  - Formato TIME vÃ¡lido (HH:mm)
  - Solo ADMIN puede editar

  **Routing**:
  - Ruta: `/configuracion-turnos`
  - Guard: `AuthGuard, RoleGuard` (roles: ADMIN)

- **Criterios de AceptaciÃ³n**:
  - [ ] 2 tarjetas mostrando configuraciones
  - [ ] Time pickers funcionales
  - [ ] ValidaciÃ³n de no solapamiento
  - [ ] Solo ADMIN puede editar
  - [ ] Mensajes de Ã©xito/error
  - [ ] Responsive design

- **Archivo de Resultado**: `docs/completed/T3.11_configuracion_turnos.md`

---

## Sprint 4: Turnos y Reportes (5 tareas)

### T3.12 - Implementar formulario de registro de turno
- **Estado**: [ ] Pendiente
- **Prioridad**: Alta
- **EstimaciÃ³n**: 5-6 horas
- **Dependencias**: T3.01, T3.02, T3.03, T3.05, T3.06, T3.07, T3.10
- **DescripciÃ³n**:
  Crear formulario completo para registro de turnos con autocomplete de guardianes, selector jerÃ¡rquico de puesto, y validaciones de horas.

  **Componente**: `TurnoFormComponent` (`src/app/modules/turnos/turno-form/turno-form.component.ts`)

  **Formulario reactivo con los siguientes campos**:

  1. **GuardiÃ¡n** (requerido):
     - Autocomplete con bÃºsqueda por nombre o cÃ©dula
     - Endpoint: `GET /api/rrhh/guardianes/buscar/:search`
     - Debounce: 300ms
     - Mostrar: "Nombre (CÃ©dula)"

  2. **Selector JerÃ¡rquico de Puesto**:
     - Cliente (`<mat-select>`)
     - UbicaciÃ³n (`<mat-select>` filtrado por cliente)
     - Puesto (`<mat-select>` filtrado por ubicaciÃ³n)

  3. **Fecha** (requerido):
     - `<mat-datepicker>`
     - ValidaciÃ³n: no mÃ¡s de 7 dÃ­as en el futuro

  4. **Hora Entrada** (requerido):
     - Input type="time"
     - Formato: HH:mm

  5. **Hora Salida** (requerido):
     - Input type="time"
     - Formato: HH:mm
     - ValidaciÃ³n: > hora_entrada (puede ser del dÃ­a siguiente si nocturno)

  6. **Horas Normales** (requerido):
     - Input type="number" step="0.5"
     - Min: 0, Max: 12
     - Default: calcular automÃ¡ticamente de hora_entrada - hora_salida

  7. **Horas Extras** (opcional):
     - Input type="number" step="0.5"
     - Min: 0, Max: 4
     - Default: 0

  8. **Observaciones** (opcional):
     - Textarea
     - Max 500 caracteres

  **Validaciones**:
  - Total de horas (normales + extras) <= 16
  - Empleado existe y estÃ¡ activo (validaciÃ³n async)
  - Puesto existe y estÃ¡ activo
  - No duplicados (mismo empleado + puesto + fecha)

  **Campos Auto-calculados** (mostrados despuÃ©s de submit, retornados por backend):
  - tipo_turno: DIURNO o NOCTURNO (basado en hora_entrada)
  - es_feriado: true/false
  - tipo_feriado: NACIONAL, DECRETO, N/A
  - incentivo: monto calculado (si aplica)

  **Service**: `TurnosService` (`src/app/core/services/turnos.service.ts`):
  ```typescript
  interface Turno {
    id: number;
    empleado_id: number;
    puesto_id: number;
    fecha: string; // ISO
    hora_entrada: string; // HH:mm:ss
    hora_salida: string;
    horas_normales: number;
    horas_extras: number;
    tipo_turno: 'DIURNO' | 'NOCTURNO'; // Auto
    es_feriado: boolean; // Auto
    tipo_feriado?: 'NACIONAL' | 'DECRETO';
    procesado_nomina: boolean;
    nomina_id?: number;
    observaciones?: string;
    // Joins
    empleado?: { id: number; nombre: string; cedula: string };
    puesto?: { id: number; nombre: string };
  }

  class TurnosService {
    // CRUD completo (crear en esta tarea)
    create(turno: Partial<Turno>): Observable<Turno>
    getAll(filters: TurnoFilters): Observable<{ data: Turno[], total: number }>
    getById(id: number): Observable<Turno>
    update(id: number, turno: Partial<Turno>): Observable<Turno>
    delete(id: number): Observable<void>
    getResumenEmpleado(empleadoId: number, fechaInicio: string, fechaFin: string): Observable<ResumenEmpleado>
  }
  ```

  **Endpoints usados**:
  - POST /api/turnos
  - GET /api/rrhh/guardianes/buscar/:search

  **UI/UX**:
  - Stepper opcional (3 pasos: GuardiÃ¡n, Puesto, Detalles)
  - Mensajes de validaciÃ³n claros
  - Loading state en botÃ³n submit
  - Mostrar resultado con campos auto-calculados despuÃ©s de crear

  **Routing**:
  - Ruta: `/turnos/nuevo`
  - Guard: `AuthGuard, RoleGuard` (roles: ADMIN, SUPERVISOR)

- **Criterios de AceptaciÃ³n**:
  - [ ] Autocomplete de guardianes funcional
  - [ ] Selector jerÃ¡rquico (Cliente â†’ UbicaciÃ³n â†’ Puesto)
  - [ ] Validaciones de horas completas
  - [ ] ValidaciÃ³n de no duplicados
  - [ ] CÃ¡lculo automÃ¡tico de horas normales (opcional)
  - [ ] Campos auto-calculados mostrados despuÃ©s de crear
  - [ ] Mensajes de error/Ã©xito
  - [ ] Responsive design
  - [ ] TurnosService completo creado

- **Archivo de Resultado**: `docs/completed/T3.12_formulario_registro_turno.md`

---

### T3.13 - Implementar lista de turnos
- **Estado**: [ ] Pendiente
- **Prioridad**: Alta
- **EstimaciÃ³n**: 5-6 horas
- **Dependencias**: T3.01, T3.02, T3.03, T3.12 (service)
- **DescripciÃ³n**:
  Crear componente de lista de turnos con filtros avanzados, paginaciÃ³n, y acciones (editar, eliminar).

  **Componente**: `TurnosListComponent` (`src/app/modules/turnos/turnos-list/turnos-list.component.ts`)

  **Tabla** (`<mat-table>`):
  - Columnas:
    - Fecha
    - GuardiÃ¡n (nombre + cÃ©dula)
    - Puesto (con ubicaciÃ³n y cliente en tooltip)
    - Hora Entrada - Hora Salida
    - Horas Normales
    - Horas Extras
    - Total Horas
    - Tipo Turno (badge: ðŸŒž DIURNO, ðŸŒ™ NOCTURNO)
    - Feriado (badge: ðŸŽ‰ si es_feriado=true)
    - Procesado (badge: âœ… si procesado_nomina=true)
    - Acciones

  **Filtros** (panel expansible con `<mat-expansion-panel>`):
  1. Rango de fechas: `<mat-date-range-picker>`
  2. GuardiÃ¡n: autocomplete
  3. Puesto: autocomplete
  4. Tipo turno: `<mat-select>` (Todos, DIURNO, NOCTURNO)
  5. Es feriado: `<mat-checkbox>`
  6. Procesado en nÃ³mina: `<mat-checkbox>`

  **PaginaciÃ³n**: server-side con `<mat-paginator>`

  **BÃºsqueda**: input general (busca por nombre de guardiÃ¡n)

  **Acciones por fila**:
  - **Editar** (icono `edit`):
    - Solo si `procesado_nomina = false`
    - Solo roles: ADMIN, SUPERVISOR
    - Navega a `/turnos/:id/editar` o abre dialog
  - **Eliminar** (icono `delete`):
    - Solo si `procesado_nomina = false`
    - Solo rol: ADMIN
    - ConfirmaciÃ³n con MatDialog
  - **Ver detalles** (icono `visibility`):
    - Abre dialog con todos los campos

  **Indicadores visuales**:
  - Badges con colores:
    - DIURNO: azul claro
    - NOCTURNO: azul oscuro
    - Feriado: rojo
    - Procesado: verde
  - Fila deshabilitada (gris) si procesado_nomina=true

  **BotÃ³n**: "Nuevo Turno" â†’ `/turnos/nuevo`

  **Endpoints usados**:
  - GET /api/turnos?empleado_id=1&puesto_id=2&fecha_inicio=2026-01-01&fecha_fin=2026-01-31&tipo_turno=DIURNO&es_feriado=true&procesado_nomina=false&page=1&pageSize=10&search=juan
  - PUT /api/turnos/:id
  - DELETE /api/turnos/:id

- **Criterios de AceptaciÃ³n**:
  - [ ] Tabla con todas las columnas y datos
  - [ ] 6 filtros funcionales (fecha, guardiÃ¡n, puesto, tipo, feriado, procesado)
  - [ ] PaginaciÃ³n server-side
  - [ ] BÃºsqueda por nombre de guardiÃ¡n
  - [ ] Botones Editar y Eliminar con validaciones
  - [ ] ConfirmaciÃ³n de eliminaciÃ³n
  - [ ] Badges de tipo turno y feriado
  - [ ] Filas procesadas deshabilitadas
  - [ ] Responsive design (tabla adaptativa)

- **Archivo de Resultado**: `docs/completed/T3.13_lista_turnos.md`

---

### T3.14 - Implementar resumen por guardiÃ¡n
- **Estado**: [ ] Pendiente
- **Prioridad**: Media
- **EstimaciÃ³n**: 3-4 horas
- **Dependencias**: T3.01, T3.02, T3.03, T3.12 (service)
- **DescripciÃ³n**:
  Crear componente para ver resumen de turnos por guardiÃ¡n con estadÃ­sticas y tabla detallada.

  **Componente**: `ResumenGuardianComponent` (`src/app/modules/turnos/resumen-guardian/resumen-guardian.component.ts`)

  **UI**:

  1. **Selectores**:
     - GuardiÃ¡n: autocomplete (requerido)
     - Rango de fechas: `<mat-date-range-picker>` (requerido)
     - BotÃ³n "Generar Resumen"

  2. **Tarjetas de EstadÃ­sticas** (6 tarjetas con `<mat-card>`):
     - Total de Turnos
     - Total Horas Normales
     - Total Horas Extras
     - Total Horas (Normales + Extras)
     - Turnos Diurnos / Nocturnos (pie chart opcional)
     - Turnos en Feriados

  3. **Tabla Detallada**:
     - Lista de todos los turnos del guardiÃ¡n en ese periodo
     - Columnas: Fecha, Puesto, Horas Normales, Horas Extras, Tipo, Feriado
     - Ordenada por fecha DESC

  **Service**: usa `TurnosService.getResumenEmpleado(empleadoId, fechaInicio, fechaFin)`

  **Endpoint usado**:
  - GET /api/turnos/empleado/:empleado_id/resumen?fecha_inicio=2026-01-01&fecha_fin=2026-01-15

  **Response esperado**:
  ```typescript
  interface ResumenEmpleado {
    empleado_id: number;
    nombre_empleado: string;
    total_turnos: number;
    total_horas_normales: number;
    total_horas_extras: number;
    turnos_diurnos: number;
    turnos_nocturnos: number;
    turnos_feriados: number;
    turnos: Turno[]; // Lista detallada
  }
  ```

  **Routing**:
  - Ruta: `/turnos/resumen`
  - Guard: `AuthGuard` (todos los roles)

- **Criterios de AceptaciÃ³n**:
  - [ ] Autocomplete de guardiÃ¡n funcional
  - [ ] Selector de rango de fechas
  - [ ] 6 tarjetas con estadÃ­sticas
  - [ ] Tabla detallada de turnos
  - [ ] GrÃ¡fico pie opcional (diurnos vs nocturnos)
  - [ ] Loading state mientras carga
  - [ ] Manejo de errores
  - [ ] Responsive design

- **Archivo de Resultado**: `docs/completed/T3.14_resumen_guardian.md`

---

### T3.15 - Implementar generaciÃ³n de reporte CSV
- **Estado**: [ ] Pendiente
- **Prioridad**: Alta
- **EstimaciÃ³n**: 3-4 horas
- **Dependencias**: T3.01, T3.02, T3.03
- **DescripciÃ³n**:
  Crear componente para generar y descargar reporte CSV para nÃ³mina.

  **Componente**: `ReporteNominaComponent` (`src/app/modules/reportes/reporte-nomina/reporte-nomina.component.ts`)

  **UI**:

  1. **Selectores**:
     - Rango de fechas: `<mat-date-range-picker>` (requerido)
       - ValidaciÃ³n: mÃ¡ximo 31 dÃ­as
     - BotÃ³n "Vista Previa"
     - BotÃ³n "Generar CSV"

  2. **Vista Previa** (tabla):
     - Mostrar primeros 50 registros que se incluirÃ¡n en el CSV
     - Columnas: fecha, empleado_id, puesto_codigo, horas_normales, horas_extras, tipo_turno, es_feriado, tipo_feriado, incentivo
     - Total de registros: mostrar cantidad

  3. **Descarga**:
     - Al hacer click en "Generar CSV", llamar endpoint POST
     - Recibir archivo CSV
     - Descargar automÃ¡ticamente con nombre: `nomina_YYYYMMDD_YYYYMMDD.csv`
     - Mostrar mensaje de Ã©xito con cantidad de registros exportados

  **Service**: `ReportesService` (`src/app/core/services/reportes.service.ts`)
  ```typescript
  class ReportesService {
    generarReporteNomina(fechaInicio: string, fechaFin: string): Observable<Blob>
    vistaPrevia(fechaInicio: string, fechaFin: string): Observable<any[]>
  }
  ```

  **Endpoints usados**:
  - POST /api/reportes/nomina
    - Body: `{ fecha_inicio: "2026-01-01", fecha_fin: "2026-01-15" }`
    - Response: CSV file (blob)
    - Headers: `Content-Type: text/csv`, `Content-Disposition: attachment; filename="nomina_20260101_20260115.csv"`

  **Manejo de descarga**:
  ```typescript
  downloadCSV(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
  ```

  **Validaciones**:
  - Rango de fechas no puede ser > 31 dÃ­as
  - fecha_inicio < fecha_fin
  - Al menos 1 turno en el rango

  **Routing**:
  - Ruta: `/reportes/nomina`
  - Guard: `AuthGuard, RoleGuard` (roles: ADMIN, SUPERVISOR)

- **Criterios de AceptaciÃ³n**:
  - [ ] Selector de rango de fechas funcional
  - [ ] Vista previa mostrando datos
  - [ ] GeneraciÃ³n de CSV funcional
  - [ ] Descarga automÃ¡tica de archivo
  - [ ] Nombre de archivo correcto (formato: nomina_YYYYMMDD_YYYYMMDD.csv)
  - [ ] Validaciones de rango de fechas
  - [ ] Mensajes de Ã©xito/error
  - [ ] Responsive design

- **Archivo de Resultado**: `docs/completed/T3.15_reporte_csv_nomina.md`

---

### T3.16 - Implementar cambio de password
- **Estado**: [✓] Completada
- **Prioridad**: Baja
- **EstimaciÃ³n**: 2-3 horas
- **Tiempo Real**: 2.5 horas
- **Fecha Completada**: 2026-01-19
- **Dependencias**: T3.01, T3.02
- **DescripciÃ³n**:
  Crear componente para que el usuario cambie su contraseÃ±a.

  **Componente**: `CambioPasswordComponent` (`src/app/modules/auth/cambio-password/cambio-password.component.ts`)

  **Formulario reactivo**:
  - current_password (requerido, type="password")
  - new_password (requerido, type="password", min 8 chars, validaciÃ³n fuerte)
  - confirm_password (requerido, type="password", debe coincidir con new_password)

  **Validaciones**:
  - Password actual requerido
  - New password:
    - Min 8 caracteres
    - Al menos 1 mayÃºscula
    - Al menos 1 nÃºmero
    - Al menos 1 carÃ¡cter especial (opcional)
  - Confirm password debe coincidir
  - New password != current password

  **Indicador de fortaleza**:
  - Barra de progreso (`<mat-progress-bar>`) mostrando fortaleza
  - Colores: dÃ©bil (rojo), media (amarillo), fuerte (verde)

  **Endpoint usado**:
  - POST /api/auth/change-password
    - Headers: Authorization Bearer token
    - Body: `{ currentPassword: "...", newPassword: "..." }`

  **Flujo**:
  1. Usuario completa formulario
  2. Click en "Cambiar Password"
  3. Llamada al endpoint
  4. Si Ã©xito: mensaje "Password actualizado", opcional: hacer logout y redirigir a login
  5. Si falla: mostrar error (ej: "Password actual incorrecto")

  **Routing**:
  - Ruta: `/cambiar-password`
  - Guard: `AuthGuard` (todos los roles autenticados)
  - TambiÃ©n accesible desde menÃº de usuario en header

- **Criterios de AceptaciÃ³n**:
  - [✓] Formulario con 3 campos (current, new, confirm)
  - [✓] Validaciones completas de password fuerte
  - [✓] Indicador de fortaleza visual
  - [✓] Cambio exitoso actualiza password
  - [✓] Error si password actual incorrecto
  - [✓] Mensajes de Ã©xito/error
  - [✓] Responsive design

- **Archivo de Resultado**: `docs/completed/T3.16_cambio_password.md`

---

## MÃ³dulo Pendiente (Backend): Login Component

### T3.17 - Implementar pÃ¡gina de login
- **Estado**: [✓] Completada
- **Prioridad**: Alta
- **EstimaciÃ³n**: 3-4 horas
- **Tiempo Real**: 3 horas
- **Fecha Completada**: 2026-01-19
- **Dependencias**: T3.02 (AuthService)
- **DescripciÃ³n**:
  Crear pÃ¡gina de login con formulario de credenciales y manejo de autenticaciÃ³n.

  **Componente**: `LoginComponent` (`src/app/modules/auth/login/login.component.ts`)

  **Formulario reactivo**:
  - username (requerido)
  - password (requerido)
  - remember_me (checkbox opcional, para mantener sesiÃ³n)

  **UI**:
  - Centrado en pantalla
  - Logo de la aplicaciÃ³n
  - TÃ­tulo: "Sistema de GestiÃ³n de Turnos"
  - Card con formulario
  - BotÃ³n "Iniciar SesiÃ³n" (loading state)
  - Link "Â¿Olvidaste tu contraseÃ±a?" (opcional, futuro)

  **Flujo**:
  1. Usuario ingresa credenciales
  2. Click en "Iniciar SesiÃ³n"
  3. Llamada a `AuthService.login(username, password)`
  4. Si Ã©xito:
     - Guardar tokens en localStorage
     - Redirigir a `/dashboard`
  5. Si falla:
     - Mostrar error: "Usuario o contraseÃ±a incorrectos"
     - Limpiar campo password

  **Validaciones**:
  - Username y password requeridos
  - MÃ­nimo 4 caracteres para username
  - MÃ­nimo 4 caracteres para password

  **Endpoint usado**:
  - POST /api/auth/login
    - Body: `{ username: "...", password: "..." }`
    - Response: `{ accessToken, refreshToken, user }`

  **Routing**:
  - Ruta: `/login`
  - No requiere guard (pÃºblica)
  - Redirect: si ya estÃ¡ autenticado, redirigir a `/dashboard`

- **Criterios de AceptaciÃ³n**:
  - [✓] Formulario de login funcional
  - [✓] Validaciones de campos
  - [✓] Login exitoso guarda tokens y redirige
  - [✓] Login fallido muestra error
  - [✓] Loading state en botÃ³n
  - [✓] Responsive design
  - [✓] Redirect si ya autenticado

- **Archivo de Resultado**: `docs/completed/T3.17_login_component.md`

---

## Orden Sugerido de EjecuciÃ³n con ParalelizaciÃ³n

### Sprint 1: Infraestructura (Semana 1) - 7-9 horas

**Ronda 1A - ParalelizaciÃ³n** (3 subagentes en paralelo):
```
Lanzar en paralelo:
â”œâ”€ Subagente 1: T3.01 - Proyecto Angular (2-3h)
â”œâ”€ Subagente 2: T3.02 - Auth + Guards (4-5h)
â””â”€ Subagente 3: T3.03 - Layout (3-4h)

Tiempo total: 4-5h (el mÃ¡s largo: T3.02)
Tiempo secuencial: 9-12h
Ahorro: 5-7h (56%)
```

**Ronda 1B - Secuencial**:
```
â”œâ”€ Subagente 1: T3.04 - Dashboard (3-4h)

Tiempo total: 3-4h
```

**Total Sprint 1**: 7-9 horas (vs 12-16h, ahorro: 5-7h)

---

### Sprint 2: Maestros CRUD Parte 1 (Semana 2) - 4-5 horas

**Ronda 2 - ParalelizaciÃ³n** (3 subagentes en paralelo):
```
Lanzar en paralelo:
â”œâ”€ Subagente 1: T3.05 - CRUD Clientes (4-5h)
â”œâ”€ Subagente 2: T3.06 - CRUD Ubicaciones (4-5h)
â””â”€ Subagente 3: T3.07 - CRUD Puestos (4-5h)

Tiempo total: 4-5h
Tiempo secuencial: 12-15h
Ahorro: 8-10h (67%)
```

**Total Sprint 2**: 4-5 horas (vs 12-15h, ahorro: 8-10h)

---

### Sprint 3: Maestros CRUD Parte 2 (Semana 3) - 6-8 horas

**Ronda 3A - ParalelizaciÃ³n** (3 subagentes en paralelo):
```
Lanzar en paralelo:
â”œâ”€ Subagente 1: T3.08 - CRUD Feriados (3-4h)
â”œâ”€ Subagente 2: T3.09 - CRUD Usuarios (4-5h)
â””â”€ Subagente 3: T3.10 - CRUD Incentivos (4-5h)

Tiempo total: 4-5h
Tiempo secuencial: 11-14h
Ahorro: 7-9h (64%)
```

**Ronda 3B - Secuencial**:
```
â”œâ”€ Subagente 1: T3.11 - Config Turnos (2-3h)

Tiempo total: 2-3h
```

**Total Sprint 3**: 6-8 horas (vs 13-17h, ahorro: 7-9h)

---

### Sprint 4: Turnos y Reportes (Semana 4) - 13-16 horas

**Ronda 4A - Secuencial** (crear service completo):
```
â”œâ”€ Subagente 1: T3.12 - Registro Turno + Service (5-6h)

Tiempo total: 5-6h
```

**Ronda 4B - ParalelizaciÃ³n** (2 subagentes en paralelo):
```
Lanzar en paralelo:
â”œâ”€ Subagente 1: T3.13 - Lista Turnos (5-6h)
â””â”€ Subagente 2: T3.14 - Resumen GuardiÃ¡n (3-4h)

Tiempo total: 5-6h (el mÃ¡s largo: T3.13)
Tiempo secuencial: 8-10h
Ahorro: 3-4h (38%)
```

**Ronda 5 - ParalelizaciÃ³n** (2 subagentes en paralelo):
```
Lanzar en paralelo:
â”œâ”€ Subagente 1: T3.15 - Reporte CSV (3-4h)
â””â”€ Subagente 2: T3.16 - Cambio Password (2-3h)

Tiempo total: 3-4h (el mÃ¡s largo: T3.15)
Tiempo secuencial: 5-7h
Ahorro: 2-3h (40%)
```

**Total Sprint 4**: 13-16 horas (vs 18-23h, ahorro: 5-7h)

---

## AnÃ¡lisis de Dependencias y ParalelizaciÃ³n

### Grafo de Dependencias

```
SPRINT 1 (Infraestructura)
T3.01 â”€â”€â”
        â”œâ”€â”€> T3.04 (Dashboard)
T3.02 â”€â”€â”¤
        â”‚
T3.03 â”€â”€â”˜

SPRINT 2 (Maestros 1)
T3.01 â”€â”€â”
T3.02 â”€â”€â”¼â”€â”€> T3.05 (CRUD Clientes)  â”€â”€â”
T3.03 â”€â”€â”˜                             â”‚
                                      â”‚
T3.01 â”€â”€â”                             â”‚
T3.02 â”€â”€â”¼â”€â”€> T3.06 (CRUD Ubicaciones)â”œâ”€â”€> (Siguiente Sprint)
T3.03 â”€â”€â”˜                             â”‚
                                      â”‚
T3.01 â”€â”€â”                             â”‚
T3.02 â”€â”€â”¼â”€â”€> T3.07 (CRUD Puestos) â”€â”€â”€â”€â”˜
T3.03 â”€â”€â”˜

SPRINT 3 (Maestros 2)
T3.01 â”€â”€â”
T3.02 â”€â”€â”¼â”€â”€> T3.08 (CRUD Feriados)
T3.03 â”€â”€â”˜

T3.01 â”€â”€â”
T3.02 â”€â”€â”¼â”€â”€> T3.09 (CRUD Usuarios)
T3.03 â”€â”€â”˜

T3.01 â”€â”€â”
T3.02 â”€â”€â”¤
T3.03 â”€â”€â”¼â”€â”€> T3.10 (CRUD Incentivos)
T3.07 â”€â”€â”˜

T3.01 â”€â”€â”
T3.02 â”€â”€â”¼â”€â”€> T3.11 (Config Turnos)
T3.03 â”€â”€â”˜

SPRINT 4 (Turnos y Reportes)
T3.01 â”€â”€â”
T3.02 â”€â”€â”¤
T3.03 â”€â”€â”¤
T3.05 â”€â”€â”¤
T3.06 â”€â”€â”¼â”€â”€> T3.12 (Registro Turno) â”€â”€â”¬â”€â”€> T3.13 (Lista)
T3.07 â”€â”€â”¤                              â””â”€â”€> T3.14 (Resumen)
T3.10 â”€â”€â”˜

T3.01 â”€â”€â”
T3.02 â”€â”€â”¼â”€â”€> T3.15 (Reporte CSV)
T3.03 â”€â”€â”˜

T3.01 â”€â”€â”
T3.02 â”€â”€â”´â”€â”€> T3.16 (Cambio Password)
```

### Resumen de Rondas de ParalelizaciÃ³n

| Ronda | Tareas en Paralelo | Tiempo Secuencial | Tiempo Paralelo | Ahorro | % Ahorro |
|-------|-------------------|-------------------|-----------------|--------|----------|
| **1A** | T3.01 + T3.02 + T3.03 | 9-12h | 4-5h | 5-7h | 56-58% |
| **1B** | T3.04 (sola) | 3-4h | 3-4h | 0h | 0% |
| **2** | T3.05 + T3.06 + T3.07 | 12-15h | 4-5h | 8-10h | 67% |
| **3A** | T3.08 + T3.09 + T3.10 | 11-14h | 4-5h | 7-9h | 64% |
| **3B** | T3.11 (sola) | 2-3h | 2-3h | 0h | 0% |
| **4A** | T3.12 (sola) | 5-6h | 5-6h | 0h | 0% |
| **4B** | T3.13 + T3.14 | 8-10h | 5-6h | 3-4h | 38% |
| **5** | T3.15 + T3.16 | 5-7h | 3-4h | 2-3h | 40% |

### Totales

**Tiempo Total Secuencial**: 55-71 horas
**Tiempo Total Paralelo**: 30-42 horas
**Ahorro Total**: 25-29 horas
**Eficiencia**: **45-41% mÃ¡s rÃ¡pido**

---

## MÃ©tricas de Progreso

### Estimaciones
- **Tareas totales**: 16 (+1 login, total 17)
- **Tiempo estimado secuencial**: 55-71 horas (~7-9 dÃ­as)
- **Tiempo estimado paralelo**: 30-42 horas (~4-5 dÃ­as)
- **Sprints**: 4 sprints

### Estado Actual (Inicio)
- **Tareas completadas**: 0/16
- **Progreso**: 0%
- **Tiempo invertido**: 0h
- **Sprint actual**: Sprint 1 - Infraestructura

### Objetivo de Fase 3
- [ ] AplicaciÃ³n Angular funcional
- [ ] Sistema de autenticaciÃ³n JWT integrado
- [ ] Todos los mÃ³dulos CRUD operativos
- [ ] MÃ³dulo de turnos completo
- [ ] Reporte CSV funcional
- [ ] Responsive design
- [ ] Guards y protecciÃ³n por roles

---

## Notas Importantes

âš ï¸ **RECORDATORIO**: DespuÃ©s de completar CADA tarea:
1. Actualizar estado a [âœ“] Completada
2. Registrar tiempo real invertido
3. Crear archivo en `docs/completed/`
4. Actualizar mÃ©tricas de progreso
5. Commitear cambios con mensaje descriptivo

âš ï¸ **METODOLOGÃA**: Este proyecto sigue sistema de agentes coordinados (ver `Metodologia.md`):
- **Agente Coordinador**: Selecciona tareas, lanza subagentes, valida resultados
- **Subagentes**: Plan â†’ EjecuciÃ³n â†’ DocumentaciÃ³n â†’ Reporte

âš ï¸ **PARALELIZACIÃ“N**: Maximizar uso de paralelizaciÃ³n:
- **8 rondas totales**: 5 con mÃºltiples subagentes, 3 secuenciales
- **MÃ¡ximo 3 subagentes** en paralelo por ronda
- **Verificar archivos**: No editar mismos archivos en paralelo
- **Ahorro proyectado**: ~25-29 horas (45%)

âš ï¸ **ENDPOINTS BACKEND**: Verificar que los endpoints estÃ©n disponibles antes de implementar componentes que los consuman. Fase 2 Backend estÃ¡ al 67.9% (19/28 tareas).

âš ï¸ **ANGULAR MATERIAL**: Usar componentes Material en todos los mÃ³dulos para consistencia visual.

âš ï¸ **RESPONSIVE**: Todos los componentes deben ser responsive (mobile-first).

---

## Bloqueadores Potenciales

1. **Endpoints Backend Pendientes**:
   - âŒ T2.22 - Calendario mensual de turnos (NO CRÃTICO)
   - âŒ T2.24 - Marcar turnos como procesados
   - âŒ T2.25 - Historial de reportes
   - âŒ T2.26 - Reportes de resumen adicionales

   **MitigaciÃ³n**: Implementar frontend con endpoints disponibles, agregar funcionalidades adicionales cuando backend complete.

2. **VersiÃ³n de Angular**: Proyecto especifica Angular 20, verificar compatibilidad de librerÃ­as.

3. **CORS**: Asegurar que backend tenga CORS configurado correctamente para `http://localhost:4200`.

---

## Referencias

- **Fase anterior**: `docs/tasks/tareas_fase2_backend_core_20260118.md` (67.9% completa)
- **Plan general**: `docs/tasks/PLAN_GENERAL_PROYECTO.md`
- **MetodologÃ­a**: `Metodologia.md`
- **Backend README**: `backend/README.md`
- **CLAUDE.md**: Contexto completo del proyecto

---

## Cambios al Plan

NingÃºn cambio por el momento. Este archivo se mantendrÃ¡ actualizado conforme se descubran nuevos requisitos o cambios necesarios.

---

## Tareas Completadas

### Sprint 1: Infraestructura

#### âœ… T3.01 - Proyecto Angular (2h 30min) - 2026-01-19
CreaciÃ³n del proyecto Angular 21.1.0 con estructura base, configuraciÃ³n TypeScript strict mode, y stub components para todos los mÃ³dulos.

#### âœ… T3.02 - Auth Guards & Interceptors (3h 00min) - 2026-01-19
Sistema completo de autenticaciÃ³n: AuthGuard, RoleGuard, AuthInterceptor (token injection + refresh), manejo global de errores.

#### âœ… T3.03 - Layout & Navigation (5h 00min) - 2026-01-19
Sistema de navegaciÃ³n con sidebar/toolbar Material Design, menÃº dinÃ¡mico por roles, header con info de usuario, layout responsivo completo.

#### âœ… T3.04 - Dashboard con EstadÃ­sticas (2h 30min) - 2026-01-19
Dashboard funcional con 4 tarjetas de estadÃ­sticas en tiempo real, servicios TurnosService y RrhhService, accesos rÃ¡pidos, diseÃ±o responsive con gradients.

**Total Sprint 1**: 13h 00min (de 12-16h estimadas) âœ…

### Sprint 2: Maestros CRUD Parte 1

#### âœ… T3.06 - CRUD de Ubicaciones (3h 30min) - 2026-01-19
MÃ³dulo completo de gestiÃ³n de ubicaciones con filtro por cliente, selectores de provincia/municipio, validaciÃ³n de cÃ³digo Ãºnico, y coordenadas GPS.

#### âœ… T3.07 - CRUD de Puestos (4h 00min) - 2026-01-19
MÃ³dulo de gestiÃ³n de puestos con selector jerÃ¡rquico Cliente â†’ UbicaciÃ³n, tabla con filtros, formulario con validaciones async, y botÃ³n "Ver Turnos".

**Total Sprint 2** (parcial): 7h 30min (de 4-5h estimadas por tarea x 3 tareas = 12-15h) âœ…

---

**Ãšltima actualizaciÃ³n**: 2026-01-19
**Responsable**: Agente Coordinador
**Estado**: Sprint 2 parcial (67% - 2/3 tareas) - Falta T3.05 (Clientes)
**PrÃ³xima tarea recomendada**: T3.05 - CRUD Clientes (para completar Sprint 2)


### Sprint 3: Maestros CRUD Parte 2

#### âœ… T3.10 - CRUD de Incentivos (4h 30min) - 2026-01-19
MÃ³dulo completo de gestiÃ³n de incentivos con selector jerÃ¡rquico (Cliente â†’ UbicaciÃ³n â†’ Puesto), filtros avanzados (autocomplete de puesto + rango de fechas), cÃ¡lculo automÃ¡tico de valor_hora destacado en verde, validaciÃ³n de solapamiento de fechas, y formulario con 4 secciones organizadas.

**Total Sprint 3** (parcial): 4h 30min (de 11-14h estimadas x 4 tareas) âœ…

---

**Ãšltima actualizaciÃ³n**: 2026-01-19
**Responsable**: Agente Coordinador
**Estado**: Sprint 3 en progreso (25% - 1/4 tareas) - Sprint 2 pendiente T3.05 (Clientes)
**PrÃ³xima tarea recomendada**: T3.08 - CRUD Feriados o T3.09 - CRUD Usuarios (Sprint 3)

