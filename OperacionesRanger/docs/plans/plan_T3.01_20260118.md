# Plan: T3.01 - Crear proyecto Angular y estructura base

**Fecha**: 2026-01-18
**Tarea padre**: T3.01
**Fase**: Fase 3 - Frontend Base
**Estimación**: 2-3 horas
**Prioridad**: Alta

## Objetivo

Crear la aplicación Angular 20+ con Angular Material, configurar la estructura completa de carpetas, instalar todas las dependencias necesarias, configurar estilos globales, environment files y proxy de desarrollo para integración con el backend.

## Contexto

Esta es la primera tarea de la Fase 3 (Frontend). El backend ya está operativo en el puerto 3000 con endpoints de autenticación y CRUDs maestros. Se necesita una aplicación Angular moderna con:
- Angular 20+ (última versión estable)
- Angular Material para UI components
- Arquitectura modular (core, shared, modules, layout)
- Proxy configurado para evitar CORS en desarrollo
- Estilos globales con tema Material Design

**IMPORTANTE**: Esta tarea se ejecuta en PARALELO con T3.02 (AuthService) y T3.03 (Layout). Solo debo crear la estructura de carpetas, NO los archivos TypeScript que crearán otros subagentes.

## Subtareas

### 1. Verificar instalación de herramientas
- **Descripción**: Verificar que Node.js, npm y Angular CLI estén instalados
- **Comando**: `node --version`, `npm --version`, `ng version`
- **Resultado esperado**: Node 16+, npm 8+, Angular CLI instalado

### 2. Crear proyecto Angular
- **Descripción**: Crear nuevo proyecto Angular con routing y SCSS
- **Comando**:
  ```bash
  cd "E:\ranger sistemas\OperacionesRanger"
  ng new frontend --routing --style=scss --skip-git
  ```
- **Opciones**:
  - `--routing`: Habilitar Angular Router
  - `--style=scss`: Usar SCSS para estilos
  - `--skip-git`: No inicializar git (ya existe en raíz)
- **Resultado esperado**: Carpeta `frontend/` creada con proyecto Angular funcional

### 3. Instalar Angular Material
- **Descripción**: Agregar Angular Material al proyecto
- **Comando**:
  ```bash
  cd frontend
  ng add @angular/material
  ```
- **Opciones durante instalación**:
  - Tema: Indigo/Pink (pre-built theme)
  - Tipografía global: Yes
  - Animaciones del navegador: Yes
- **Resultado esperado**: Angular Material configurado en el proyecto

### 4. Instalar dependencias adicionales
- **Descripción**: Instalar bibliotecas necesarias para el proyecto
- **Comando**:
  ```bash
  npm install jwt-decode date-fns @angular/flex-layout
  ```
- **Librerías**:
  - `jwt-decode`: Decodificar tokens JWT
  - `date-fns`: Manipulación de fechas (alternativa a moment.js)
  - `@angular/flex-layout`: Layout responsivo (opcional, puede usar CSS Grid)
- **Resultado esperado**: Dependencias instaladas en package.json

### 5. Crear estructura de carpetas
- **Descripción**: Crear arquitectura modular completa de la aplicación
- **Estructura**:
  ```
  src/app/
  ├── core/                   # Servicios singleton y guards
  │   ├── guards/             # AuthGuard, RoleGuard (VACÍA - T3.02)
  │   ├── interceptors/       # HTTP Interceptors (VACÍA - T3.02)
  │   └── services/           # Services core (VACÍA - T3.02)
  ├── shared/                 # Componentes y pipes reutilizables
  │   ├── components/         # Componentes compartidos
  │   └── pipes/              # Custom pipes
  ├── modules/                # Módulos de features
  │   ├── auth/               # Login, cambio password
  │   ├── dashboard/          # Dashboard principal
  │   ├── clientes/           # CRUD Clientes
  │   ├── ubicaciones/        # CRUD Ubicaciones
  │   ├── puestos/            # CRUD Puestos
  │   ├── feriados/           # CRUD Feriados
  │   ├── usuarios/           # CRUD Usuarios
  │   ├── incentivos/         # CRUD Incentivos
  │   ├── configuracion-turnos/ # Config turnos
  │   ├── turnos/             # Gestión de turnos
  │   └── reportes/           # Reportes CSV
  └── layout/                 # Componentes de layout
      ├── header/             # Header con usuario (VACÍA - T3.03)
      ├── navmenu/            # Sidebar navegación (VACÍA - T3.03)
      └── footer/             # Footer (opcional)
  ```
- **Comando**: Usar `mkdir` o crear manualmente
- **IMPORTANTE**: Solo crear carpetas, NO archivos TypeScript en:
  - `core/services/`
  - `core/guards/`
  - `core/interceptors/`
  - `layout/header/`
  - `layout/navmenu/`
  - `layout/footer/`
- **Resultado esperado**: Estructura completa de carpetas creada

### 6. Configurar environment files
- **Descripción**: Crear archivos de configuración para development y production
- **Archivos a crear/modificar**:
  - `src/environments/environment.ts` (development)
  - `src/environments/environment.prod.ts` (production)
- **Contenido**:
  ```typescript
  // environment.ts (development)
  export const environment = {
    production: false,
    apiBaseUrl: 'http://localhost:3000/api',
    apiTimeout: 30000, // 30 segundos
    appName: 'Sistema de Gestión de Turnos',
    appVersion: '1.0.0'
  };

  // environment.prod.ts (production)
  export const environment = {
    production: true,
    apiBaseUrl: '/api', // Proxy en producción
    apiTimeout: 30000,
    appName: 'Sistema de Gestión de Turnos',
    appVersion: '1.0.0'
  };
  ```
- **Resultado esperado**: Variables de entorno configuradas

### 7. Configurar estilos globales
- **Descripción**: Configurar tema Material, variables SCSS y reset CSS
- **Archivos a modificar**:
  - `src/styles.scss`
- **Contenido**:
  ```scss
  // Importar tema Material (ya incluido por ng add @angular/material)
  @import '@angular/material/prebuilt-themes/indigo-pink.css';

  // Variables globales
  $primary-color: #3f51b5; // Indigo
  $accent-color: #ff4081;  // Pink
  $warn-color: #f44336;    // Red

  // Reset CSS básico
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: Roboto, "Helvetica Neue", sans-serif;
    margin: 0;
  }

  // Utilidades
  .full-width {
    width: 100%;
  }

  .text-center {
    text-align: center;
  }

  .mt-1 { margin-top: 8px; }
  .mt-2 { margin-top: 16px; }
  .mt-3 { margin-top: 24px; }

  .mb-1 { margin-bottom: 8px; }
  .mb-2 { margin-bottom: 16px; }
  .mb-3 { margin-bottom: 24px; }
  ```
- **Resultado esperado**: Estilos globales configurados

### 8. Configurar proxy de desarrollo
- **Descripción**: Crear proxy.conf.json para evitar CORS en desarrollo
- **Archivo a crear**: `frontend/proxy.conf.json`
- **Contenido**:
  ```json
  {
    "/api": {
      "target": "http://localhost:3000",
      "secure": false,
      "changeOrigin": true,
      "logLevel": "debug"
    }
  }
  ```
- **Explicación**:
  - Todas las peticiones a `/api/*` se redirigen a `http://localhost:3000/api/*`
  - `changeOrigin: true`: Cambia el header Origin para evitar CORS
  - `logLevel: debug`: Muestra logs del proxy en consola
- **Resultado esperado**: Archivo proxy.conf.json creado

### 9. Actualizar angular.json
- **Descripción**: Configurar proxy y otras opciones en angular.json
- **Archivo a modificar**: `frontend/angular.json`
- **Cambios**:
  ```json
  {
    "projects": {
      "frontend": {
        "architect": {
          "serve": {
            "options": {
              "proxyConfig": "proxy.conf.json"
            }
          }
        }
      }
    }
  }
  ```
- **Resultado esperado**: Proxy configurado en angular.json

### 10. Actualizar README.md
- **Descripción**: Crear README.md del frontend con comandos de desarrollo
- **Archivo a crear/actualizar**: `frontend/README.md`
- **Contenido**:
  ```markdown
  # OperacionesRanger - Frontend

  Sistema de Gestión de Turnos - Aplicación Angular 20

  ## Comandos de Desarrollo

  ### Instalar dependencias
  ```bash
  npm install
  ```

  ### Iniciar servidor de desarrollo
  ```bash
  npm start
  # Corre en http://localhost:4200
  # Proxy configurado: /api -> http://localhost:3000/api
  ```

  ### Build para producción
  ```bash
  npm run build
  # Output en dist/
  ```

  ### Tests
  ```bash
  npm test
  ```

  ## Estructura del Proyecto

  - `src/app/core/`: Servicios singleton, guards, interceptors
  - `src/app/shared/`: Componentes y pipes reutilizables
  - `src/app/modules/`: Módulos de features (CRUDs, turnos, reportes)
  - `src/app/layout/`: Componentes de layout (header, navmenu)
  - `src/environments/`: Configuración de entornos

  ## Dependencias Principales

  - Angular 20+
  - Angular Material
  - jwt-decode: Manejo de JWT tokens
  - date-fns: Manipulación de fechas

  ## Configuración

  - **API Base URL** (development): `http://localhost:3000/api`
  - **Proxy**: Configurado en `proxy.conf.json`
  - **Tema Material**: Indigo/Pink

  ## Notas

  - El backend debe estar corriendo en puerto 3000
  - Proxy automático evita problemas de CORS en desarrollo
  ```
- **Resultado esperado**: README.md completo con documentación

### 11. Verificar compilación
- **Descripción**: Ejecutar `npm start` y verificar que no haya errores
- **Comando**:
  ```bash
  cd frontend
  npm start
  ```
- **Verificaciones**:
  - ✅ Compila sin errores
  - ✅ Corre en http://localhost:4200
  - ✅ Muestra página por defecto de Angular
  - ✅ No hay errores en consola del navegador
- **Resultado esperado**: Aplicación Angular corriendo sin errores

### 12. Documentar resultado
- **Descripción**: Crear archivo de completitud con todos los detalles
- **Archivo a crear**: `docs/completed/T3.01_proyecto_angular.md`
- **Contenido**: Ver sección "Criterios de Aceptación Cumplidos"
- **Resultado esperado**: Tarea completamente documentada

## Criterios de Aceptación (checklist)

- [ ] Proyecto Angular creado y compilando sin errores
- [ ] Angular Material instalado y configurado
- [ ] Estructura de carpetas creada (carpetas vacías para otros subagentes)
- [ ] Environment files configurados con API base URL
- [ ] Estilos globales aplicados (tema Material)
- [ ] Proxy configurado para desarrollo
- [ ] `npm start` ejecuta sin errores en http://localhost:4200
- [ ] README.md actualizado con comandos de desarrollo

## Archivos a Generar

- `frontend/` - Proyecto Angular completo
- `frontend/package.json` - Con dependencias
- `frontend/angular.json` - Con configuración de proxy
- `frontend/proxy.conf.json` - Configuración de proxy
- `frontend/src/environments/environment.ts` - Config development
- `frontend/src/environments/environment.prod.ts` - Config production
- `frontend/src/styles.scss` - Estilos globales
- `frontend/README.md` - Documentación del frontend
- `frontend/src/app/core/` - Estructura de carpetas (vacías)
- `frontend/src/app/shared/` - Estructura de carpetas
- `frontend/src/app/modules/` - Estructura de carpetas (vacías)
- `frontend/src/app/layout/` - Estructura de carpetas (vacías para T3.03)
- `docs/completed/T3.01_proyecto_angular.md` - Resultado documentado

## Riesgos y Consideraciones

### Riesgo 1: Versión de Angular
- **Descripción**: Angular 20 puede no estar disponible (última versión conocida es 17)
- **Mitigación**: Usar última versión estable disponible (17 o superior)

### Riesgo 2: Conflictos con @angular/flex-layout
- **Descripción**: @angular/flex-layout puede estar deprecated
- **Mitigación**: Si no funciona, usar CSS Grid/Flexbox nativo

### Riesgo 3: Ejecución en paralelo con T3.02 y T3.03
- **Descripción**: Otros subagentes crearán archivos en `core/services/`, `core/guards/`, `layout/`
- **Mitigación**: Solo crear carpetas vacías, NO archivos TypeScript

### Riesgo 4: Tiempo de instalación
- **Descripción**: `ng new` y `npm install` pueden tomar varios minutos
- **Mitigación**: Ser paciente, puede tomar 5-10 minutos total

## Notas Adicionales

- **Carpetas vacías**: Crear solo la estructura, otros subagentes llenarán el contenido
- **No crear**:
  - `src/app/core/services/auth.service.ts` (T3.02 lo creará)
  - `src/app/core/guards/auth.guard.ts` (T3.02 lo creará)
  - `src/app/layout/navmenu/*` (T3.03 lo creará)
  - `src/app/layout/header/*` (T3.03 lo creará)
- **Backend**: Debe estar corriendo en puerto 3000 para que proxy funcione
- **CORS**: El proxy evita problemas de CORS en desarrollo
- **Material Design**: Usar componentes Material en todo el proyecto para consistencia
