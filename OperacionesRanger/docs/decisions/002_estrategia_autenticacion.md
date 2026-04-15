# ADR-002: Estrategia de Autenticación y Autorización

**Estado**: Aceptado
**Fecha**: 2026-01-17
**Autor**: Equipo de Desarrollo OperacionesRanger
**Decisión**: T011 - Fase 1 Fundación del Proyecto

---

## Contexto

El Sistema de Gestión de Turnos para Guardianes de Seguridad requiere un mecanismo de autenticación y autorización para controlar el acceso a la aplicación y proteger datos sensibles de empleados.

### Características del Sistema

**Arquitectura**:
- Backend: Node.js + TypeScript + Express.js (API RESTful stateless)
- Frontend: Angular (Single Page Application)
- Base de datos: MySQL 8.0
- Despliegue: Separación frontend/backend

**Usuarios del Sistema**:
- Administradores: Gestión completa (usuarios, configuración, reportes)
- Supervisores: Registro de turnos, gestión operativa, reportes
- Consulta: Visualización de información (solo lectura)

**Requisitos de Seguridad**:
- Protección de datos personales de empleados (tabla `rh_empleado` en sistema RRHH)
- Control de acceso basado en roles (RBAC)
- Auditoría de operaciones críticas (registro, modificación, reportes)
- Expiración de sesiones por inactividad
- Prevención de accesos no autorizados

**Características del Entorno**:
- Sistema interno de Guardianes Ranger (República Dominicana)
- Base de usuarios pequeña/media (10-50 usuarios concurrentes estimados)
- No requiere integración con proveedores externos de autenticación
- Red interna corporativa (posibilidad de HTTPS interno)

---

## Opciones Consideradas

### Opción 1: JWT (JSON Web Tokens) - Stateless

**Descripción**: Tokens firmados digitalmente que contienen claims (información del usuario) y se envían en cada petición HTTP mediante header `Authorization: Bearer <token>`.

**Características**:
- Stateless: El servidor no almacena sesiones, toda la información está en el token
- Self-contained: El token incluye información del usuario (id, rol, permisos)
- Firmado con secret (HMAC) o clave privada (RSA)
- Expirable (claim `exp`)
- Estándar RFC 7519

**Flujo de autenticación**:
1. Usuario envía credenciales (usuario/password) a `/auth/login`
2. Backend valida credenciales contra BD
3. Backend genera JWT firmado con información del usuario
4. Backend retorna token al cliente
5. Cliente almacena token (localStorage/sessionStorage)
6. Cliente incluye token en header `Authorization` en cada petición
7. Backend valida token en middleware y extrae información del usuario

**Pros**:
- ✅ Stateless: Escala horizontalmente sin problemas (no requiere sesiones compartidas)
- ✅ CORS-friendly: Funciona perfectamente con frontend separado (Angular)
- ✅ Ecosistema maduro: Librerías sólidas en Node.js (`jsonwebtoken`, `passport-jwt`)
- ✅ Soporte nativo en Angular: Interceptores HTTP, guards
- ✅ Mobile-friendly: Fácil de usar en apps móviles futuras
- ✅ Información portable: El token incluye roles/permisos (reduce queries a BD)
- ✅ Estándar de industria: Ampliamente usado en APIs REST modernas
- ✅ Performance: No requiere lookups de sesión en cada request

**Contras**:
- ❌ No revocable directamente: Una vez emitido, el token es válido hasta expiración (mitigable con refresh tokens y blacklist)
- ❌ Tamaño: El token puede ser grande si incluye muchos claims (típicamente 200-500 bytes)
- ❌ Almacenamiento en cliente: Vulnerable a XSS si se guarda en localStorage (mitigable con httpOnly cookies)
- ❌ Rotación de secrets: Cambiar secret invalida todos los tokens (requiere estrategia de rotación)

### Opción 2: Sessions con Cookies (Stateful)

**Descripción**: El servidor crea una sesión al autenticar y almacena información en memoria/BD. El cliente recibe un ID de sesión en cookie httpOnly.

**Características**:
- Stateful: El servidor mantiene estado de sesiones activas
- Cookie httpOnly y secure (no accesible desde JavaScript)
- Sesión almacenada en memoria, Redis, o base de datos
- Express-session es la librería estándar

**Pros**:
- ✅ Revocación inmediata: Eliminar sesión de BD = logout instantáneo
- ✅ Seguridad: httpOnly cookies protegen contra XSS
- ✅ Control total: El servidor controla completamente las sesiones
- ✅ Implementación tradicional: Patrón conocido y probado

**Contras**:
- ❌ No stateless: Requiere almacenamiento de sesiones (memoria/Redis/BD)
- ❌ Escalabilidad: Dificulta escalado horizontal (requiere sesiones compartidas)
- ❌ CORS complicado: Requiere configuración específica de CORS con credentials
- ❌ Cookie-based: Problemas con CORS en dominios cruzados
- ❌ No mobile-friendly: Cookies no funcionan bien en apps móviles nativas

### Opción 3: OAuth 2.0 / OpenID Connect

**Descripción**: Delegar autenticación a un proveedor externo (Google, Microsoft, Okta) o implementar propio servidor OAuth.

**Características**:
- Estándar de industria para autorización delegada
- Flujos: Authorization Code, Implicit, Client Credentials, Resource Owner Password
- OpenID Connect añade capa de identidad sobre OAuth 2.0

**Pros**:
- ✅ Autenticación robusta: Proveedores externos manejan seguridad
- ✅ Single Sign-On (SSO): Un login para múltiples aplicaciones
- ✅ MFA nativo: Proveedores ofrecen autenticación multifactor
- ✅ No almacenar contraseñas: Delegar a proveedor confiable

**Contras**:
- ❌ Complejidad alta: Implementación compleja para sistema interno simple
- ❌ Dependencia externa: Requiere conectividad a proveedor (no ideal para red interna)
- ❌ Costo: Proveedores comerciales tienen costo por usuario
- ❌ Overkill: Demasiado complejo para sistema interno pequeño
- ❌ Implementación propia compleja: Crear servidor OAuth es proyecto en sí mismo

### Opción 4: API Keys

**Descripción**: Cada usuario/aplicación tiene una clave estática que envía en cada petición.

**Características**:
- Clave generada aleatoriamente (UUID, hash)
- Enviada en header `X-API-Key` o `Authorization: ApiKey <key>`
- Validada en middleware contra BD

**Pros**:
- ✅ Simplicidad: Muy fácil de implementar
- ✅ Stateless: No requiere sesiones
- ✅ Ideal para APIs programáticas: Machine-to-machine

**Contras**:
- ❌ No expirable: Las keys son permanentes (requiere rotación manual)
- ❌ No información contextual: No incluye información del usuario/rol
- ❌ UX pobre: No hay concepto de "login/logout" para usuarios humanos
- ❌ Seguridad limitada: Si se filtra la key, no hay forma de revocarla sin cambiarla
- ❌ No adecuado para usuarios finales: Diseñado para integraciones, no UIs

### Opción 5: Integración con Active Directory / LDAP

**Descripción**: Autenticar contra directorio corporativo existente (Windows Active Directory, OpenLDAP).

**Características**:
- Usuarios y credenciales gestionados centralmente
- Protocolo LDAP para autenticación
- Librerías: `ldapjs`, `passport-ldapauth`

**Pros**:
- ✅ Centralización: Una sola fuente de verdad para usuarios corporativos
- ✅ Sincronización automática: Cambios en AD se reflejan automáticamente
- ✅ Políticas de contraseñas: Heredadas de políticas corporativas de AD
- ✅ SSO potencial: Integración con Windows Authentication

**Contras**:
- ❌ Dependencia: Requiere que Guardianes Ranger tenga Active Directory configurado
- ❌ Complejidad: Integración LDAP puede ser complicada
- ❌ Red interna: Requiere conectividad constante a servidor AD
- ❌ Permisos duales: Roles de AD pueden no alinearse con roles del sistema
- ❌ Desconocimiento: No sabemos si Guardianes Ranger usa AD

---

## Decisión

**Estrategia seleccionada**: **JWT (JSON Web Tokens) con Refresh Tokens**

### Arquitectura de Autenticación

```
┌─────────────────────────────────────────────────────────────────┐
│                     FLUJO DE AUTENTICACIÓN JWT                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. LOGIN                                                        │
│     Usuario → [POST /auth/login] → Backend                      │
│     { username, password }                                       │
│              ↓                                                   │
│     Backend valida credenciales (bcrypt)                         │
│              ↓                                                   │
│     Backend genera:                                              │
│       - Access Token (15-30 min expiración)                      │
│       - Refresh Token (7 días expiración)                        │
│              ↓                                                   │
│     Backend retorna:                                             │
│     {                                                            │
│       accessToken: "eyJhbGc...",                                 │
│       refreshToken: "eyJhbGc...",                                │
│       user: { id, username, rol, permisos }                      │
│     }                                                            │
│              ↓                                                   │
│     Cliente almacena tokens (localStorage)                       │
│                                                                  │
│  2. PETICIONES AUTENTICADAS                                      │
│     Cliente → [GET /api/turnos]                                  │
│     Header: Authorization: Bearer <accessToken>                  │
│              ↓                                                   │
│     Backend middleware verifica token:                           │
│       - Firma válida (secret)                                    │
│       - No expirado (claim exp)                                  │
│       - No en blacklist (opcional)                               │
│              ↓                                                   │
│     Backend extrae información:                                  │
│       req.user = { id, username, rol }                           │
│              ↓                                                   │
│     Controller procesa request con contexto de usuario          │
│              ↓                                                   │
│     Backend retorna respuesta                                    │
│                                                                  │
│  3. RENOVACIÓN DE TOKEN (Access Token expiró)                    │
│     Cliente → [POST /auth/refresh]                               │
│     { refreshToken: "eyJhbGc..." }                               │
│              ↓                                                   │
│     Backend valida refresh token                                 │
│              ↓                                                   │
│     Backend genera nuevo access token                            │
│              ↓                                                   │
│     Backend retorna:                                             │
│     { accessToken: "eyJhbGc..." }                                │
│              ↓                                                   │
│     Cliente actualiza access token                               │
│                                                                  │
│  4. LOGOUT                                                       │
│     Cliente → [POST /auth/logout]                                │
│     { refreshToken: "eyJhbGc..." }                               │
│              ↓                                                   │
│     Backend añade refresh token a blacklist (opcional)           │
│              ↓                                                   │
│     Cliente elimina tokens de localStorage                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Estructura de JWT

**Access Token** (expiración corta: 15-30 minutos):
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "12345",          // User ID
    "username": "supervisor1",
    "rol": "SUPERVISOR",
    "permisos": ["TURNOS_CREAR", "TURNOS_EDITAR", "REPORTES_VER"],
    "iat": 1705500000,       // Issued at
    "exp": 1705501800        // Expires (30 min después)
  },
  "signature": "..." // HMAC SHA256 con JWT_SECRET
}
```

**Refresh Token** (expiración larga: 7 días):
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "12345",          // User ID
    "type": "refresh",       // Tipo de token
    "iat": 1705500000,       // Issued at
    "exp": 1706104800        // Expires (7 días después)
  },
  "signature": "..."
}
```

---

## Justificación

### Por qué JWT

1. **Alineación con Arquitectura Stateless**
   - El backend Express está diseñado como API REST stateless
   - JWT permite escalar horizontalmente sin gestión de sesiones compartidas
   - Cada request es independiente y auto-contenido

2. **Compatibilidad con Frontend Angular**
   - Angular SPA requiere autenticación sin cookies (CORS-friendly)
   - Interceptores HTTP simplifican el envío de tokens
   - Guards de Angular funcionan perfectamente con JWT
   - Ecosistema maduro: `@auth0/angular-jwt`, `angular2-jwt`

3. **Experiencia con Stack Relacionado**
   - El sistema Ranger Nomina (Guardianes Ranger) ya usa JWT exitosamente
   - Misma arquitectura (Node.js + Express + Angular)
   - Reutilización de conocimiento y código
   - Consistencia entre sistemas de la organización

4. **Ecosistema Node.js Maduro**
   - `jsonwebtoken`: 9M+ descargas/semana, muy estable
   - `passport-jwt`: Estrategia de autenticación probada
   - `bcryptjs`: Hashing de contraseñas estándar de industria
   - Amplia documentación y ejemplos

5. **Performance y Escalabilidad**
   - Sin lookups de sesión en base de datos en cada request
   - Información del usuario disponible inmediatamente en el token
   - Escalado horizontal trivial (sin sticky sessions)
   - Reducción de carga en base de datos

6. **Seguridad Adecuada para el Contexto**
   - Firma criptográfica previene manipulación de tokens
   - Expiración automática reduce ventana de vulnerabilidad
   - Refresh tokens permiten revocación controlada
   - Compatible con HTTPS (requerido en producción)

### Por qué NO las otras opciones

**Sessions**: Statefulness complica escalado y contradice arquitectura REST stateless diseñada en ADR-001.

**OAuth 2.0**: Complejidad innecesaria para sistema interno pequeño. No hay necesidad de SSO con múltiples aplicaciones externas.

**API Keys**: No adecuado para usuarios humanos. No hay concepto de login/logout. Pobre experiencia de usuario.

**Active Directory**: Desconocemos si Guardianes Ranger tiene AD. Añade dependencia externa. Complejidad de integración LDAP no justificada para base pequeña de usuarios.

---

## Consecuencias

### Consecuencias Positivas

1. **Desarrollo Rápido**
   - Librerías maduras y documentadas aceleran implementación
   - Patrón conocido por equipo (experiencia en Ranger Nomina)
   - Menos código custom de seguridad

2. **Escalabilidad sin Esfuerzo Adicional**
   - Stateless permite agregar servidores backend sin configuración
   - No requiere Redis o almacenamiento de sesiones compartido
   - CDN y balanceadores de carga funcionan sin modificaciones

3. **Flexibilidad Futura**
   - Fácil añadir aplicaciones móviles (Android/iOS)
   - Posibilidad de crear APIs públicas para terceros
   - Compatible con microservicios si se requiere modularización

4. **Separación de Responsabilidades**
   - Backend solo valida firma y expiration
   - Frontend maneja almacenamiento y envío de tokens
   - Cada capa es independiente y testeable

5. **Auditoría Simplificada**
   - El token incluye información del usuario en cada request
   - Logs tienen contexto completo sin queries adicionales
   - Middleware de auditoría accede fácilmente a `req.user`

### Consecuencias Negativas

1. **Revocación No Inmediata**
   - **Problema**: Un token válido sigue funcionando hasta expiración, incluso si el usuario es desactivado
   - **Mitigación**:
     - Access tokens de corta duración (15-30 min)
     - Implementar blacklist de refresh tokens en BD
     - Validar status de usuario en operaciones críticas
     - Considerar tabla `token_blacklist` para logout forzado

2. **Almacenamiento en Cliente (XSS)**
   - **Problema**: Tokens en localStorage son vulnerables a ataques XSS
   - **Mitigación**:
     - Sanitización estricta de inputs en Angular
     - Content Security Policy (CSP) headers
     - HTTPS obligatorio
     - Considerar httpOnly cookies como alternativa (aunque complica CORS)
     - Tokens de corta duración limitan exposición

3. **Gestión de Secrets**
   - **Problema**: Cambiar `JWT_SECRET` invalida todos los tokens activos
   - **Mitigación**:
     - Rotación planificada de secrets (fuera de horas)
     - Considerar múltiples secrets con versionado (kid claim)
     - Documentar procedimiento de rotación
     - Backups seguros de secrets

4. **Tamaño de Token**
   - **Problema**: Tokens con muchos claims aumentan tamaño de headers HTTP
   - **Mitigación**:
     - Incluir solo información esencial (id, rol, permisos críticos)
     - Evitar arrays grandes de permisos (usar códigos)
     - Típicamente 200-500 bytes es aceptable

5. **Complejidad de Refresh Tokens**
   - **Problema**: Implementar refresh tokens añade complejidad
   - **Mitigación**:
     - Implementar en Fase 2 paso a paso
     - Usar librerías como `express-jwt` y `jsonwebtoken`
     - Seguir ejemplos de Ranger Nomina
     - Tests exhaustivos del flujo de renovación

---

## Modelo de Roles y Permisos (RBAC)

### Roles Definidos

| Rol | Código | Descripción | Nivel Jerárquico |
|-----|--------|-------------|------------------|
| **Administrador** | `ADMIN` | Control total del sistema. Gestión de usuarios, configuración global, acceso a todos los módulos. | 3 (Máximo) |
| **Supervisor** | `SUPERVISOR` | Operación diaria del sistema. Registro de turnos, gestión de guardias, generación de reportes. | 2 (Medio) |
| **Consulta** | `CONSULTA` | Solo lectura. Visualización de turnos y reportes. Sin capacidad de modificación. | 1 (Básico) |

### Matriz de Permisos

| Recurso / Operación | Administrador | Supervisor | Consulta |
|---------------------|---------------|------------|----------|
| **Usuarios** | | | |
| Crear usuario | ✅ | ❌ | ❌ |
| Editar usuario | ✅ | ❌ | ❌ |
| Eliminar usuario | ✅ | ❌ | ❌ |
| Ver usuarios | ✅ | ❌ | ❌ |
| Cambiar roles | ✅ | ❌ | ❌ |
| **Clientes** | | | |
| Crear cliente | ✅ | ✅ | ❌ |
| Editar cliente | ✅ | ✅ | ❌ |
| Eliminar cliente | ✅ | ❌ | ❌ |
| Ver clientes | ✅ | ✅ | ✅ |
| **Ubicaciones** | | | |
| Crear ubicación | ✅ | ✅ | ❌ |
| Editar ubicación | ✅ | ✅ | ❌ |
| Eliminar ubicación | ✅ | ❌ | ❌ |
| Ver ubicaciones | ✅ | ✅ | ✅ |
| **Puestos** | | | |
| Crear puesto | ✅ | ✅ | ❌ |
| Editar puesto | ✅ | ✅ | ❌ |
| Eliminar puesto | ✅ | ❌ | ❌ |
| Ver puestos | ✅ | ✅ | ✅ |
| **Turnos** | | | |
| Registrar turno | ✅ | ✅ | ❌ |
| Editar turno | ✅ | ✅ | ❌ |
| Eliminar turno | ✅ | ❌ | ❌ |
| Ver turnos | ✅ | ✅ | ✅ |
| Marcar como procesado | ✅ | ❌ | ❌ |
| **Incentivos** | | | |
| Crear incentivo | ✅ | ✅ | ❌ |
| Editar incentivo | ✅ | ✅ | ❌ |
| Eliminar incentivo | ✅ | ❌ | ❌ |
| Ver incentivos | ✅ | ✅ | ✅ |
| **Reportes** | | | |
| Generar reporte nómina | ✅ | ✅ | ❌ |
| Ver reportes | ✅ | ✅ | ✅ |
| Exportar CSV | ✅ | ✅ | ❌ |
| **Configuración** | | | |
| Configuración turnos | ✅ | ❌ | ❌ |
| Gestionar feriados | ✅ | ❌ | ❌ |
| Ver configuración | ✅ | ✅ | ✅ |
| **Auditoría** | | | |
| Ver logs de auditoría | ✅ | ❌ | ❌ |

### Modelo de Datos (Base de Datos)

#### Tabla: `usuarios`

```sql
CREATE TABLE usuarios (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,  -- bcrypt hash
    email VARCHAR(100) UNIQUE,
    nombre_completo VARCHAR(150) NOT NULL,
    rol ENUM('ADMIN', 'SUPERVISOR', 'CONSULTA') NOT NULL DEFAULT 'CONSULTA',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ultimo_login TIMESTAMP NULL,
    intentos_fallidos INT DEFAULT 0,       -- Seguridad: bloqueo por intentos
    bloqueado_hasta TIMESTAMP NULL,        -- Seguridad: bloqueo temporal
    created_by INT NULL,                   -- ID del usuario que creó
    modified_by INT NULL,                  -- ID del último que modificó

    INDEX idx_username (username),
    INDEX idx_rol (rol),
    INDEX idx_activo (activo),
    FOREIGN KEY (created_by) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    FOREIGN KEY (modified_by) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Tabla: `refresh_tokens` (Opcional - para mejor control)

```sql
CREATE TABLE refresh_tokens (
    id_token INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,  -- Hash del refresh token
    fecha_emision TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP NOT NULL,
    revocado BOOLEAN DEFAULT FALSE,
    fecha_revocacion TIMESTAMP NULL,
    ip_address VARCHAR(45),                    -- IPv4 o IPv6
    user_agent TEXT,

    INDEX idx_usuario (id_usuario),
    INDEX idx_token_hash (token_hash),
    INDEX idx_expiracion (fecha_expiracion),
    INDEX idx_revocado (revocado),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Tabla: `auditoria_auth` (Registro de eventos de autenticación)

```sql
CREATE TABLE auditoria_auth (
    id_auditoria INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NULL,                       -- NULL si login falló
    username VARCHAR(50),                      -- Username intentado
    evento ENUM('LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'TOKEN_REFRESH', 'PASSWORD_CHANGE') NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    detalles TEXT,                             -- JSON con información adicional
    fecha_evento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_usuario (id_usuario),
    INDEX idx_evento (evento),
    INDEX idx_fecha (fecha_evento),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Códigos de Permisos (Para Granularidad Futura)

Si en el futuro se requiere permisos más granulares que roles estáticos:

```typescript
// backend/src/types/permisos.ts
export enum Permiso {
    // Usuarios
    USUARIOS_VER = 'USUARIOS_VER',
    USUARIOS_CREAR = 'USUARIOS_CREAR',
    USUARIOS_EDITAR = 'USUARIOS_EDITAR',
    USUARIOS_ELIMINAR = 'USUARIOS_ELIMINAR',

    // Clientes
    CLIENTES_VER = 'CLIENTES_VER',
    CLIENTES_CREAR = 'CLIENTES_CREAR',
    CLIENTES_EDITAR = 'CLIENTES_EDITAR',
    CLIENTES_ELIMINAR = 'CLIENTES_ELIMINAR',

    // Ubicaciones
    UBICACIONES_VER = 'UBICACIONES_VER',
    UBICACIONES_CREAR = 'UBICACIONES_CREAR',
    UBICACIONES_EDITAR = 'UBICACIONES_EDITAR',
    UBICACIONES_ELIMINAR = 'UBICACIONES_ELIMINAR',

    // Puestos
    PUESTOS_VER = 'PUESTOS_VER',
    PUESTOS_CREAR = 'PUESTOS_CREAR',
    PUESTOS_EDITAR = 'PUESTOS_EDITAR',
    PUESTOS_ELIMINAR = 'PUESTOS_ELIMINAR',

    // Turnos
    TURNOS_VER = 'TURNOS_VER',
    TURNOS_CREAR = 'TURNOS_CREAR',
    TURNOS_EDITAR = 'TURNOS_EDITAR',
    TURNOS_ELIMINAR = 'TURNOS_ELIMINAR',
    TURNOS_PROCESAR = 'TURNOS_PROCESAR',

    // Incentivos
    INCENTIVOS_VER = 'INCENTIVOS_VER',
    INCENTIVOS_CREAR = 'INCENTIVOS_CREAR',
    INCENTIVOS_EDITAR = 'INCENTIVOS_EDITAR',
    INCENTIVOS_ELIMINAR = 'INCENTIVOS_ELIMINAR',

    // Reportes
    REPORTES_VER = 'REPORTES_VER',
    REPORTES_GENERAR = 'REPORTES_GENERAR',
    REPORTES_EXPORTAR = 'REPORTES_EXPORTAR',

    // Configuración
    CONFIG_VER = 'CONFIG_VER',
    CONFIG_EDITAR = 'CONFIG_EDITAR',

    // Auditoría
    AUDITORIA_VER = 'AUDITORIA_VER'
}

// Mapeo de roles a permisos
export const PERMISOS_POR_ROL: Record<string, Permiso[]> = {
    ADMIN: Object.values(Permiso), // Todos los permisos

    SUPERVISOR: [
        // Clientes
        Permiso.CLIENTES_VER,
        Permiso.CLIENTES_CREAR,
        Permiso.CLIENTES_EDITAR,

        // Ubicaciones
        Permiso.UBICACIONES_VER,
        Permiso.UBICACIONES_CREAR,
        Permiso.UBICACIONES_EDITAR,

        // Puestos
        Permiso.PUESTOS_VER,
        Permiso.PUESTOS_CREAR,
        Permiso.PUESTOS_EDITAR,

        // Turnos
        Permiso.TURNOS_VER,
        Permiso.TURNOS_CREAR,
        Permiso.TURNOS_EDITAR,

        // Incentivos
        Permiso.INCENTIVOS_VER,
        Permiso.INCENTIVOS_CREAR,
        Permiso.INCENTIVOS_EDITAR,

        // Reportes
        Permiso.REPORTES_VER,
        Permiso.REPORTES_GENERAR,
        Permiso.REPORTES_EXPORTAR,

        // Configuración (solo ver)
        Permiso.CONFIG_VER
    ],

    CONSULTA: [
        // Solo lectura
        Permiso.CLIENTES_VER,
        Permiso.UBICACIONES_VER,
        Permiso.PUESTOS_VER,
        Permiso.TURNOS_VER,
        Permiso.INCENTIVOS_VER,
        Permiso.REPORTES_VER,
        Permiso.CONFIG_VER
    ]
};
```

---

## Consideraciones de Seguridad

### 1. Almacenamiento Seguro de Contraseñas

**Estrategia**: Hashing con bcrypt

```typescript
// Nunca almacenar contraseñas en texto plano
import bcrypt from 'bcryptjs';

// Al crear usuario
const saltRounds = 10;
const passwordHash = await bcrypt.hash(plainPassword, saltRounds);

// Al validar login
const isValid = await bcrypt.compare(plainPassword, storedHash);
```

**Requisitos de contraseña**:
- Mínimo 8 caracteres
- Al menos una mayúscula
- Al menos una minúscula
- Al menos un número
- Al menos un carácter especial (opcional, según política)

**Políticas adicionales**:
- Expiración de contraseñas: 90 días (configurable)
- No reutilizar últimas 5 contraseñas
- Bloqueo temporal tras 5 intentos fallidos (15 minutos)

### 2. Protección de Tokens

**HTTPS Obligatorio**:
- Todos los tokens DEBEN transmitirse sobre HTTPS en producción
- Configurar HSTS (HTTP Strict Transport Security)
- Redireccionar HTTP → HTTPS automáticamente

**Almacenamiento en Cliente**:
- **Opción 1 (Recomendada)**: localStorage
  - Pros: Simple, funciona con CORS
  - Contras: Vulnerable a XSS
  - Mitigación: CSP headers, sanitización estricta

- **Opción 2 (Más Segura)**: httpOnly cookies
  - Pros: Protegido contra XSS
  - Contras: Complica CORS, requiere sameSite=none
  - Requiere: CORS con credentials enabled

**Content Security Policy (CSP)**:
```typescript
// Configurar en Express
app.use((req, res, next) => {
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"
    );
    next();
});
```

### 3. Expiración y Renovación de Tokens

**Access Token**:
- Expiración corta: 15-30 minutos
- Incluye claim `exp` (Unix timestamp)
- Verificación automática en middleware

**Refresh Token**:
- Expiración larga: 7 días
- Almacenado en BD (tabla `refresh_tokens`)
- Permite renovar access token sin re-login
- Revocable (campo `revocado`)

**Flujo de renovación**:
```typescript
// Cliente detecta access token expirado (401)
// → Envía refresh token a /auth/refresh
// → Backend valida refresh token
// → Backend genera nuevo access token
// → Cliente actualiza token y reintenta petición original
```

### 4. Prevención de Ataques Comunes

#### Cross-Site Scripting (XSS)
- Sanitización de todos los inputs en frontend (Angular)
- Escapado de outputs en templates (Angular hace esto por defecto)
- CSP headers
- No usar `innerHTML` con datos de usuario
- Validación de tipos en backend (TypeScript)

#### SQL Injection
- Usar prepared statements (mysql2 con placeholders `?`)
- Validación de inputs con librerías (`express-validator`, `joi`)
- TypeScript para type safety

```typescript
// BUENO: Prepared statement
const query = 'SELECT * FROM usuarios WHERE username = ?';
const [rows] = await connection.execute(query, [username]);

// MALO: Concatenación de strings
const query = `SELECT * FROM usuarios WHERE username = '${username}'`; // ❌ NUNCA
```

#### Cross-Site Request Forgery (CSRF)
- JWT en header `Authorization` NO es vulnerable a CSRF (cookies sí)
- Si se usan cookies: implementar tokens CSRF (`csurf` middleware)

#### Rate Limiting
- Limitar intentos de login: 5 por minuto por IP
- Limitar peticiones a API: 100 por minuto por usuario
- Usar `express-rate-limit`

```typescript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 intentos
    message: 'Demasiados intentos de login. Intente más tarde.'
});

app.post('/auth/login', loginLimiter, loginController);
```

#### Brute Force Protection
- Bloqueo progresivo: 5 intentos = 15 min, 10 intentos = 1 hora
- Almacenar `intentos_fallidos` y `bloqueado_hasta` en BD
- Resetear intentos tras login exitoso

### 5. Validación de Inputs

**Backend**:
```typescript
import { body, validationResult } from 'express-validator';

const loginValidation = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 50 })
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username inválido'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password debe tener al menos 8 caracteres')
];

app.post('/auth/login', loginValidation, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    // ... continuar con lógica de login
});
```

### 6. Logging de Eventos de Autenticación

**Eventos a registrar**:
- Login exitoso (usuario, IP, timestamp)
- Login fallido (username, IP, timestamp, razón)
- Logout (usuario, IP, timestamp)
- Renovación de token (usuario, IP, timestamp)
- Cambio de contraseña (usuario, IP, timestamp)
- Creación/modificación de usuarios (admin, usuario afectado)

**Almacenamiento**: Tabla `auditoria_auth`

**Monitoreo**:
- Alertas por múltiples logins fallidos desde misma IP
- Alertas por login desde ubicaciones inusuales (opcional)
- Revisión periódica de logs por administradores

### 7. Variables de Entorno Seguras

```bash
# .env (NUNCA COMMITEAR)
JWT_SECRET=<generar con: openssl rand -base64 64>
JWT_ACCESS_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=7d

# Ejemplo de secret fuerte
JWT_SECRET=XpZvK9mN2bQ8jL4hR7cT6wY3fU1gS5dA0oI8eP7xZ2vN5bM4hG3kJ6lR9tY2qW1s
```

**Rotación de secrets**:
- Programar rotación cada 90 días
- Mantener secret anterior por 1 día (ventana de gracia)
- Usar versionado de secrets (claim `kid` - key ID)

### 8. Seguridad de Refresh Tokens

**Almacenamiento en BD**:
- No almacenar token completo, almacenar hash (SHA-256)
- Permite verificación sin exponer token
- Permite revocación por ID

```typescript
import crypto from 'crypto';

// Generar refresh token
const refreshToken = jwt.sign({ sub: userId, type: 'refresh' }, SECRET, { expiresIn: '7d' });

// Almacenar hash en BD
const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
await db.execute(
    'INSERT INTO refresh_tokens (id_usuario, token_hash, fecha_expiracion) VALUES (?, ?, ?)',
    [userId, tokenHash, expirationDate]
);

// Validar refresh token
const receivedHash = crypto.createHash('sha256').update(receivedToken).digest('hex');
const [rows] = await db.execute(
    'SELECT * FROM refresh_tokens WHERE token_hash = ? AND revocado = FALSE',
    [receivedHash]
);
```

**Límite de tokens activos**:
- Máximo 5 refresh tokens activos por usuario
- Al llegar al límite, revocar el más antiguo
- Previene acumulación infinita de tokens

---

## Plan de Implementación para Fase 2

### Tareas de Implementación (Estimación: 12-16 horas)

#### T2.1: Crear Tablas de Autenticación (2 horas)
- Crear tabla `usuarios`
- Crear tabla `refresh_tokens`
- Crear tabla `auditoria_auth`
- Crear script de seed de usuario admin inicial
- Pruebas de integridad referencial

**Entregables**:
- `database/migrations/002_create_auth_tables.sql`
- `database/seeds/seed_admin_user.sql`

#### T2.2: Implementar Hashing de Contraseñas (2 horas)
- Instalar `bcryptjs`
- Crear utilidad `src/utils/password.ts`
- Funciones: `hashPassword()`, `comparePassword()`
- Tests unitarios de hashing

**Entregables**:
- `src/utils/password.ts`
- `tests/unit/password.test.ts`

#### T2.3: Implementar Generación y Validación de JWT (3 horas)
- Instalar `jsonwebtoken`
- Crear servicio `src/services/auth.service.ts`
- Funciones:
  - `generateAccessToken(user)`
  - `generateRefreshToken(user)`
  - `verifyAccessToken(token)`
  - `verifyRefreshToken(token)`
- Tests unitarios de tokens

**Entregables**:
- `src/services/auth.service.ts`
- `tests/unit/auth.service.test.ts`

#### T2.4: Crear Endpoints de Autenticación (4 horas)
- Controller: `src/controllers/auth.controller.ts`
- Endpoints:
  - `POST /auth/login` - Login con username/password
  - `POST /auth/logout` - Logout (revoca refresh token)
  - `POST /auth/refresh` - Renovar access token
  - `POST /auth/change-password` - Cambiar contraseña
- Validaciones con `express-validator`
- Tests de integración

**Entregables**:
- `src/controllers/auth.controller.ts`
- `src/routes/auth.routes.ts`
- `tests/integration/auth.test.ts`

#### T2.5: Implementar Middleware de Autenticación (3 horas)
- Middleware: `src/middlewares/authenticate.ts`
- Extrae token de header `Authorization`
- Verifica firma y expiración
- Carga información de usuario en `req.user`
- Middleware: `src/middlewares/authorize.ts`
- Verifica rol del usuario
- Verifica permisos específicos
- Tests de middlewares

**Entregables**:
- `src/middlewares/authenticate.ts`
- `src/middlewares/authorize.ts`
- `tests/unit/middlewares.test.ts`

#### T2.6: Proteger Endpoints Existentes (2 horas)
- Aplicar middleware `authenticate` a rutas protegidas
- Aplicar middleware `authorize` según matriz de permisos
- Ejemplos:
  ```typescript
  router.get('/turnos', authenticate, authorize(['ADMIN', 'SUPERVISOR', 'CONSULTA']), getTurnos);
  router.post('/turnos', authenticate, authorize(['ADMIN', 'SUPERVISOR']), createTurno);
  router.delete('/usuarios/:id', authenticate, authorize(['ADMIN']), deleteUsuario);
  ```

**Entregables**:
- Rutas actualizadas con autenticación
- Documentación de endpoints protegidos

#### T2.7: Implementar Rate Limiting (2 horas)
- Instalar `express-rate-limit`
- Configurar limitador para login (5/15min)
- Configurar limitador global API (100/min)
- Tests de rate limiting

**Entregables**:
- `src/middlewares/rateLimiter.ts`
- Configuración aplicada en `server.ts`

#### T2.8: Implementar Auditoría de Autenticación (2 horas)
- Servicio: `src/services/auditoria.service.ts`
- Funciones:
  - `logLoginSuccess(userId, ip, userAgent)`
  - `logLoginFailed(username, ip, reason)`
  - `logLogout(userId, ip)`
  - `logTokenRefresh(userId, ip)`
- Integrar en controladores de auth

**Entregables**:
- `src/services/auditoria.service.ts`
- Logs en tabla `auditoria_auth`

### Librerías a Instalar (Fase 2)

```bash
# Autenticación
npm install jsonwebtoken bcryptjs

# Validación
npm install express-validator joi

# Rate Limiting
npm install express-rate-limit

# Types
npm install --save-dev @types/jsonwebtoken @types/bcryptjs
```

### Variables de Entorno Adicionales (Fase 2)

Actualizar `.env.example`:
```bash
# JWT Configuration
JWT_SECRET=<generar con: openssl rand -base64 64>
JWT_ACCESS_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=10
MAX_LOGIN_ATTEMPTS=5
LOGIN_RATE_LIMIT_WINDOW_MS=900000  # 15 minutos
LOGIN_RATE_LIMIT_MAX_REQUESTS=5

# Password Policy
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBER=true
PASSWORD_REQUIRE_SPECIAL=false
PASSWORD_EXPIRATION_DAYS=90
```

### Frontend (Angular) - Fase 2

**Módulos a crear**:
- `auth.module.ts` - Módulo de autenticación
- `auth.service.ts` - Servicio de autenticación
- `auth-guard.ts` - Guard para rutas protegidas
- `auth-interceptor.ts` - Interceptor para agregar token a requests
- `login.component.ts` - Componente de login

**Flujo en Angular**:
1. Usuario ingresa credenciales en `login.component`
2. `auth.service.login()` envía POST a `/auth/login`
3. Backend retorna access token y refresh token
4. `auth.service` almacena tokens en localStorage
5. `auth-interceptor` agrega token a header de todas las peticiones
6. `auth-guard` protege rutas según rol del usuario
7. Si access token expira, `auth-interceptor` llama a `/auth/refresh`

**Librerías Angular**:
- `@auth0/angular-jwt` - Helpers para JWT en Angular
- `angular2-jwt` - Alternativa

---

## Referencias

### Documentación Oficial
- **JWT**: [https://jwt.io/](https://jwt.io/)
- **RFC 7519 (JWT)**: [https://tools.ietf.org/html/rfc7519](https://tools.ietf.org/html/rfc7519)
- **OWASP Authentication Cheat Sheet**: [https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

### Librerías Node.js
- **jsonwebtoken**: [https://github.com/auth0/node-jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)
- **bcryptjs**: [https://github.com/dcodeIO/bcrypt.js](https://github.com/dcodeIO/bcrypt.js)
- **passport-jwt**: [http://www.passportjs.org/packages/passport-jwt/](http://www.passportjs.org/packages/passport-jwt/)
- **express-validator**: [https://express-validator.github.io/](https://express-validator.github.io/)

### Artículos y Guías
- "The Ultimate Guide to handling JWTs on frontend clients (GraphQL)" - [Hasura](https://hasura.io/blog/best-practices-of-using-jwt-with-graphql/)
- "Stop using JWT for sessions" - [joepie91](http://cryto.net/~joepie91/blog/2016/06/13/stop-using-jwt-for-sessions/)
- "Where to Store your JWTs – Cookies vs HTML5 Web Storage" - [Stormpath](https://stormpath.com/blog/where-to-store-your-jwts-cookies-vs-html5-web-storage)

### Sistemas Relacionados
- **Ranger Nomina (Guardianes Ranger)**: Sistema existente con autenticación JWT en Node.js + Express + Angular (referencia de implementación)

---

**Estado**: Aceptado
**Próxima revisión**: Al finalizar implementación en Fase 2
**Actualización prevista**: Según lecciones aprendidas en producción
