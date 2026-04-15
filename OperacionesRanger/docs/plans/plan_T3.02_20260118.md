# Plan: T3.02 - Implementar AuthService, Guards e Interceptors

**Fecha**: 2026-01-18
**Tarea padre**: T3.02
**Fase**: Fase 3 - Frontend Base
**Estimación**: 4-5 horas

## Objetivo

Crear el sistema completo de autenticación para la aplicación Angular, incluyendo el servicio de autenticación (AuthService), guards de protección de rutas (AuthGuard, RoleGuard), e interceptors HTTP (AuthInterceptor, ErrorInterceptor) con soporte para auto-refresh de tokens JWT.

## Contexto

Esta tarea se ejecuta en PARALELO con T3.01 (proyecto Angular) y T3.03 (layout). Dado que el proyecto Angular puede no existir aún, crearemos los archivos TypeScript de todas formas siguiendo la estructura estándar de Angular.

Los endpoints del backend ya están implementados en la Fase 2:
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/refresh
- POST /api/auth/change-password

El backend usa JWT con tokens de acceso (15 min) y refresh tokens (7 días), bcrypt para hashing de passwords, y roles ADMIN, SUPERVISOR, CONSULTA.

## Subtareas

### 1. Crear interfaces TypeScript y modelos

**Descripción**: Definir todas las interfaces TypeScript para autenticación, usuarios y JWT.

**Archivos a crear**:
- `frontend/src/app/core/models/auth.model.ts`

**Interfaces a definir**:
```typescript
- LoginCredentials (username, password)
- AuthResponse (accessToken, refreshToken, user)
- User (id, username, rol, nombre_completo, email, activo, ultimo_acceso)
- JWTPayload (sub, username, rol, iat, exp)
- UserRole (type: 'ADMIN' | 'SUPERVISOR' | 'CONSULTA')
- ChangePasswordRequest (currentPassword, newPassword)
```

**Resultado esperado**: Archivo con todas las interfaces exportadas

### 2. Implementar AuthService completo

**Descripción**: Crear servicio singleton de autenticación con todos los métodos requeridos.

**Archivos a crear**:
- `frontend/src/app/core/services/auth.service.ts`

**Métodos a implementar**:
- `login(credentials: LoginCredentials): Observable<AuthResponse>` - POST /api/auth/login
- `logout(): Observable<void>` - POST /api/auth/logout + limpiar localStorage
- `refreshToken(): Observable<{ accessToken: string }>` - POST /api/auth/refresh
- `changePassword(currentPassword, newPassword): Observable<void>` - POST /api/auth/change-password
- `isAuthenticated(): boolean` - verificar si hay token válido
- `getCurrentUser(): User | null` - obtener usuario actual desde localStorage
- `getAccessToken(): string | null` - obtener access token
- `getRefreshToken(): string | null` - obtener refresh token
- `hasRole(...roles: UserRole[]): boolean` - verificar si usuario tiene alguno de los roles

**Almacenamiento localStorage**:
- `access_token` - Access token JWT
- `refresh_token` - Refresh token JWT
- `current_user` - JSON string del usuario

**Dependencias**:
- HttpClient de @angular/common/http
- jwt-decode para decodificar tokens
- BehaviorSubject para estado del usuario autenticado

**Resultado esperado**: Servicio completo con manejo de autenticación y tokens

### 3. Implementar AuthGuard

**Descripción**: Guard para proteger rutas que requieren autenticación.

**Archivos a crear**:
- `frontend/src/app/core/guards/auth.guard.ts`

**Lógica**:
1. Verificar si usuario está autenticado (isAuthenticated())
2. Si SÍ autenticado → permitir acceso (return true)
3. Si NO autenticado:
   - Verificar si access token expiró pero hay refresh token
   - Intentar auto-refresh del token
   - Si refresh exitoso → permitir acceso
   - Si falla → redirigir a /login, return false

**Implementación**:
- Implementar interface `CanActivate` de @angular/router
- Inyectar AuthService y Router
- Retornar Observable<boolean> o boolean

**Resultado esperado**: Guard funcional que protege rutas

### 4. Implementar RoleGuard

**Descripción**: Guard para verificar que el usuario tenga el rol requerido.

**Archivos a crear**:
- `frontend/src/app/core/guards/role.guard.ts`

**Lógica**:
1. Leer roles requeridos desde route.data.roles
2. Verificar autenticación primero
3. Obtener usuario actual (getCurrentUser())
4. Verificar si usuario tiene alguno de los roles requeridos
5. Si tiene rol → permitir acceso (return true)
6. Si NO tiene rol → redirigir a /unauthorized, return false

**Implementación**:
- Implementar interface `CanActivate`
- Inyectar AuthService y Router
- Acceder a `route.data['roles']` para obtener roles permitidos

**Uso en rutas**:
```typescript
{
  path: 'usuarios',
  component: UsuariosComponent,
  canActivate: [AuthGuard, RoleGuard],
  data: { roles: ['ADMIN'] }
}
```

**Resultado esperado**: Guard funcional que valida roles

### 5. Implementar AuthInterceptor

**Descripción**: Interceptor HTTP para agregar token a requests y manejar auto-refresh.

**Archivos a crear**:
- `frontend/src/app/core/interceptors/auth.interceptor.ts`

**Funcionalidad**:

**Request Interceptor**:
1. Interceptar todas las HTTP requests
2. Obtener access token (getAccessToken())
3. Si hay token:
   - Agregar header: `Authorization: Bearer {token}`
   - Clonar request y agregar header
4. Continuar con request

**Response Interceptor (401 Unauthorized)**:
1. Interceptar respuestas 401
2. Intentar refresh token automáticamente
3. Si refresh exitoso:
   - Actualizar access token en localStorage
   - Retry request original con nuevo token
4. Si refresh falla:
   - Hacer logout
   - Redirigir a /login

**Implementación**:
- Implementar interface `HttpInterceptor` de @angular/common/http
- Inyectar AuthService y Router
- Usar RxJS operators (catchError, switchMap) para manejar errores
- Evitar refresh loop (solo 1 intento de refresh)

**Resultado esperado**: Interceptor que maneja autenticación automática

### 6. Implementar ErrorInterceptor

**Descripción**: Interceptor para manejo global de errores HTTP.

**Archivos a crear**:
- `frontend/src/app/core/interceptors/error.interceptor.ts`

**Funcionalidad**:
1. Interceptar errores HTTP (4xx, 5xx)
2. Formatear mensajes de error amigables
3. Mostrar notificaciones (por ahora console.error, después MatSnackBar)
4. Log de errores en modo development
5. Retornar error formateado

**Manejo por status code**:
- 400 Bad Request → "Datos inválidos"
- 401 Unauthorized → "No autorizado" (manejado por AuthInterceptor)
- 403 Forbidden → "Acceso prohibido"
- 404 Not Found → "Recurso no encontrado"
- 500 Internal Server Error → "Error del servidor"
- Network error → "Error de conexión"

**Implementación**:
- Implementar interface `HttpInterceptor`
- Usar catchError para capturar errores
- Crear método privado para formatear mensajes

**Resultado esperado**: Interceptor que maneja errores globalmente

### 7. Documentar en archivo de resultado

**Descripción**: Crear documentación completa de la tarea.

**Archivos a crear**:
- `docs/completed/T3.02_auth_guards_interceptors.md`

**Contenido**:
- Resumen de lo implementado
- Archivos generados
- Interfaces definidas
- Métodos implementados
- Ejemplos de uso
- Configuración requerida en app.module.ts (providers)
- Criterios de aceptación cumplidos
- Notas sobre integración con T3.01

**Resultado esperado**: Documentación completa

## Criterios de Aceptación (checklist)

- [ ] Interfaces TypeScript definidas (LoginCredentials, AuthResponse, User, JWTPayload, UserRole, ChangePasswordRequest)
- [ ] AuthService implementado con todos los métodos (login, logout, refreshToken, changePassword, isAuthenticated, getCurrentUser, getAccessToken, getRefreshToken, hasRole)
- [ ] Tokens almacenados en localStorage (access_token, refresh_token, current_user)
- [ ] AuthGuard protege rutas correctamente (verifica autenticación, intenta refresh)
- [ ] RoleGuard valida roles desde route.data.roles
- [ ] AuthInterceptor agrega header Authorization a requests
- [ ] AuthInterceptor maneja 401 con auto-refresh y retry
- [ ] ErrorInterceptor formatea errores HTTP
- [ ] Logout limpia localStorage completamente
- [ ] Decodificación de JWT con jwt-decode
- [ ] Documentación completa en docs/completed/

## Archivos a Generar

1. `frontend/src/app/core/models/auth.model.ts` - Interfaces TypeScript
2. `frontend/src/app/core/services/auth.service.ts` - Servicio de autenticación
3. `frontend/src/app/core/guards/auth.guard.ts` - Guard de autenticación
4. `frontend/src/app/core/guards/role.guard.ts` - Guard de roles
5. `frontend/src/app/core/interceptors/auth.interceptor.ts` - Interceptor de autenticación
6. `frontend/src/app/core/interceptors/error.interceptor.ts` - Interceptor de errores
7. `docs/plans/plan_T3.02_20260118.md` - Este archivo (plan)
8. `docs/completed/T3.02_auth_guards_interceptors.md` - Resultado documentado

## Riesgos y Consideraciones

### Riesgo 1: Proyecto Angular aún no existe (T3.01 en paralelo)
**Mitigación**: Crear los archivos TypeScript con la estructura correcta. Se integrarán cuando T3.01 complete. Los archivos son válidos TypeScript standalone.

### Riesgo 2: Dependencias (HttpClient, Router) no disponibles sin Angular
**Mitigación**: Importar desde @angular/common/http y @angular/router. Los imports serán válidos, solo se usarán cuando el proyecto Angular esté creado.

### Riesgo 3: jwt-decode no instalado
**Mitigación**: T3.01 instalará jwt-decode. Por ahora, incluir imports asumiendo que estará disponible.

### Riesgo 4: Refresh token loop (auto-refresh infinito)
**Mitigación**: Implementar flag para evitar múltiples intentos de refresh simultáneos. Solo 1 refresh a la vez.

### Riesgo 5: localStorage no es seguro (XSS)
**Mitigación**: Documentar que es una decisión de diseño. Para mayor seguridad, usar httpOnly cookies (requiere cambio en backend).

## Notas Adicionales

### Configuración requerida en app.module.ts (o app.config.ts en Angular 20)

Para Angular 20 con standalone components, agregar en `app.config.ts`:

```typescript
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { ErrorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([AuthInterceptor, ErrorInterceptor])
    ),
    AuthService,
    // ...otros providers
  ]
};
```

### Endpoints Backend (ya implementados en Fase 2)

- POST /api/auth/login → Body: {username, password} → Response: {accessToken, refreshToken, user}
- POST /api/auth/logout → Headers: Authorization Bearer token → Response: 204 No Content
- POST /api/auth/refresh → Body: {refreshToken} → Response: {accessToken}
- POST /api/auth/change-password → Headers: Authorization, Body: {currentPassword, newPassword} → Response: 200 OK

### Formato de JWT Token

```json
{
  "sub": 1,
  "username": "admin",
  "rol": "ADMIN",
  "iat": 1705579200,
  "exp": 1705580100
}
```

### Flujo de Auto-Refresh

1. Usuario hace request
2. AuthInterceptor agrega token
3. Si 401 Unauthorized:
   - AuthInterceptor llama AuthService.refreshToken()
   - Backend retorna nuevo accessToken
   - AuthService actualiza localStorage
   - AuthInterceptor reintenta request original con nuevo token
4. Si refresh falla (refresh token expirado):
   - AuthService hace logout
   - Redirect a /login

## Dependencias de otras tareas

**Ninguna**: Esta tarea puede ejecutarse completamente en paralelo con T3.01 y T3.03.

**Tareas que dependen de esta**:
- T3.04 - Dashboard (usará AuthGuard)
- T3.05-T3.16 - Todos los CRUDs (usarán AuthGuard y RoleGuard)
- T3.17 - Login Component (usará AuthService)

## Tiempo Estimado por Subtarea

1. Crear interfaces → 30 min
2. Implementar AuthService → 1h 30min
3. Implementar AuthGuard → 45 min
4. Implementar RoleGuard → 30 min
5. Implementar AuthInterceptor → 1h 15min
6. Implementar ErrorInterceptor → 30 min
7. Documentar resultado → 30 min

**Total estimado**: 5 horas

---

**Estado**: Plan creado, listo para ejecución
**Fecha de creación**: 2026-01-18
**Subagente**: Especializado en Frontend (Auth)
