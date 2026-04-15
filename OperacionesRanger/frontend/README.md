# OperacionesRanger - Frontend

Sistema de Gestión de Turnos para Guardianes de Seguridad - Aplicación Angular

## Descripción

Aplicación frontend desarrollada en Angular 21+ con Angular Material para la gestión de turnos de guardianes de seguridad. Integra con el backend Node.js + TypeScript para autenticación JWT, gestión de maestros (clientes, ubicaciones, puestos, feriados, incentivos) y módulo completo de turnos con reportes CSV.

## Tecnologías

- **Angular**: 21.1.0
- **Angular Material**: Componentes UI (tema Indigo-Pink)
- **TypeScript**: 5.7+
- **SCSS**: Preprocesador de estilos
- **jwt-decode**: Decodificación de tokens JWT
- **date-fns**: Manipulación de fechas

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
# Output en dist/frontend/
```

### Build para desarrollo (watch mode)

```bash
npm run watch
# Build continuo con cambios automáticos
```

### Ejecutar tests

```bash
npm test
# Vitest test runner
```

## Estructura del Proyecto

```
src/app/
├── core/                   # Servicios singleton, guards, interceptors
│   ├── guards/             # AuthGuard, RoleGuard
│   ├── interceptors/       # HTTP Interceptors (Auth, Error)
│   └── services/           # Services core (Auth, etc.)
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
│   ├── usuarios/           # CRUD Usuarios (solo ADMIN)
│   ├── incentivos/         # CRUD Incentivos por puesto
│   ├── configuracion-turnos/ # Configuración de turnos (día/noche)
│   ├── turnos/             # Gestión de turnos (registro, lista, resumen)
│   └── reportes/           # Generación de reportes CSV
└── layout/                 # Componentes de layout
    ├── header/             # Header con usuario y menú
    ├── navmenu/            # Sidebar de navegación
    └── footer/             # Footer (opcional)
```

## Configuración

### Environment Files

- **Development** (`src/environments/environment.ts`):
  - API Base URL: `http://localhost:3000/api`
  - Production: `false`

- **Production** (`src/environments/environment.prod.ts`):
  - API Base URL: `/api` (proxy en producción)
  - Production: `true`

### Proxy de Desarrollo

El archivo `proxy.conf.json` está configurado para redirigir todas las peticiones a `/api` al backend en `http://localhost:3000`:

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

Esto evita problemas de CORS durante el desarrollo.

## Tema y Estilos

- **Tema Material**: Indigo-Pink (pre-built theme)
- **Primary Color**: #3f51b5 (Indigo)
- **Accent Color**: #ff4081 (Pink)
- **Warn Color**: #f44336 (Red)
- **Tipografía**: Roboto

### Utilidades CSS Disponibles

- Espaciado: `.mt-1`, `.mt-2`, `.mb-1`, `.mb-2`, `.p-1`, `.p-2`, etc.
- Flexbox: `.d-flex`, `.flex-column`, `.justify-center`, `.align-center`
- Texto: `.text-center`, `.text-right`, `.full-width`

## Integración con Backend

El frontend consume los siguientes endpoints del backend:

### Autenticación
- `POST /api/auth/login` - Login con username/password
- `POST /api/auth/logout` - Cerrar sesión
- `POST /api/auth/refresh` - Renovar access token
- `POST /api/auth/change-password` - Cambiar contraseña

### Usuarios (solo ADMIN)
- `GET /api/usuarios` - Lista de usuarios
- `POST /api/usuarios` - Crear usuario
- `PUT /api/usuarios/:id` - Actualizar usuario
- `DELETE /api/usuarios/:id` - Eliminar usuario
- `POST /api/usuarios/:id/reset-password` - Reset password

### Maestros
- Clientes: `/api/clientes`
- Ubicaciones: `/api/ubicaciones`
- Puestos: `/api/puestos`
- Feriados: `/api/feriados`
- Incentivos: `/api/incentivos`
- Configuración Turnos: `/api/configuracion-turnos`

### Turnos
- `POST /api/turnos` - Registrar turno
- `GET /api/turnos` - Lista de turnos (con filtros)
- `PUT /api/turnos/:id` - Actualizar turno
- `DELETE /api/turnos/:id` - Eliminar turno
- `GET /api/turnos/empleado/:id/resumen` - Resumen por guardián

### RRHH (integración)
- `GET /api/rrhh/guardianes` - Lista de guardianes activos
- `GET /api/rrhh/guardianes/buscar/:search` - Buscar guardián

### Reportes
- `POST /api/reportes/nomina` - Generar CSV para nómina

## Autenticación y Seguridad

- **JWT Tokens**: Access token (15min) + Refresh token (7 días)
- **Storage**: Tokens guardados en `localStorage`
- **Guards**: `AuthGuard` protege rutas autenticadas
- **Role Guard**: `RoleGuard` valida permisos por rol (ADMIN, SUPERVISOR, CONSULTA)
- **Interceptors**:
  - `AuthInterceptor`: Agrega token a requests
  - `ErrorInterceptor`: Maneja errores HTTP globalmente

## Roles de Usuario

- **ADMIN**: Acceso completo (usuarios, configuración, todos los CRUDs)
- **SUPERVISOR**: Gestión de turnos, maestros, reportes
- **CONSULTA**: Solo lectura (dashboard, consulta de turnos)

## Notas Importantes

- El backend debe estar corriendo en `http://localhost:3000` antes de iniciar el frontend
- El proxy solo funciona en modo desarrollo (`npm start`)
- En producción, usar un proxy inverso (Nginx, Apache) para `/api`
- Angular Material requiere que se importen módulos específicos en cada módulo feature

## Troubleshooting

### Errores de CORS
- Verificar que el backend tenga CORS habilitado para `http://localhost:4200`
- Verificar que `proxy.conf.json` esté configurado correctamente
- Verificar que `angular.json` incluya `"proxyConfig": "proxy.conf.json"`

### Token expirado
- El `AuthInterceptor` intenta renovar automáticamente el token con el refresh token
- Si el refresh token también expiró, el usuario es redirigido a `/login`

### Problemas de build
- Limpiar cache: `npm cache clean --force`
- Reinstalar dependencias: `rm -rf node_modules && npm install`
- Verificar versión de Node.js: `node --version` (requiere Node 20.19+ o 22.12+)

## Recursos Adicionales

- [Angular CLI Documentation](https://angular.dev/tools/cli)
- [Angular Material Components](https://material.angular.io/components)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Última actualización**: 2026-01-18
**Versión**: 1.0.0
**Estado**: Proyecto base creado - Sprint 1 Fase 3
