# OperacionesRanger - Backend

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen?style=flat-square&logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/typescript-5.3-blue?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/express-4.18-lightgrey?style=flat-square&logo=express" alt="Express">
  <img src="https://img.shields.io/badge/mysql-8.0-blue?style=flat-square&logo=mysql" alt="MySQL">
  <img src="https://img.shields.io/badge/license-ISC-green?style=flat-square" alt="License">
  <img src="https://img.shields.io/badge/status-in%20development-yellow?style=flat-square" alt="Status">
</p>

Backend del Sistema de Gestión de Turnos para Guardianes de Seguridad de Guardianes Ranger, República Dominicana.

---

## Tabla de Contenidos

- [Descripción](#descripción)
- [Características Principales](#características-principales)
- [Tecnologías](#tecnologías)
- [Quick Start](#quick-start)
- [Prerequisitos](#prerequisitos)
- [Instalación](#instalación)
- [Scripts de Utilidades de Base de Datos](#scripts-de-utilidades-de-base-de-datos)
- [Configuración Avanzada](#configuración-avanzada)
- [Cómo Ejecutar](#cómo-ejecutar)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Endpoints Disponibles](#endpoints-disponibles)
- [Variables de Entorno](#variables-de-entorno)
- [Testing](#testing)
- [Deployment](#deployment)
- [Arquitectura de Base de Datos](#arquitectura-de-base-de-datos)
- [Troubleshooting](#troubleshooting)
- [Mejores Prácticas](#mejores-prácticas)
- [API Documentation](#api-documentation)
- [Roadmap](#roadmap)
- [Contribución](#contribución)
- [Scripts Disponibles](#scripts-disponibles)
- [Referencias](#referencias)
- [Estado del Proyecto](#estado-del-proyecto)
- [Licencia y Contacto](#licencia-y-contacto)

---

## Descripción

**OperacionesRanger** es un sistema integral de gestión de turnos diseñado específicamente para guardianes de seguridad de Guardianes Ranger en la República Dominicana. El sistema automatiza el registro, seguimiento y reporte de turnos laborales, facilitando la integración con el sistema de nómina existente.

### Contexto del Negocio

Guardianes Ranger proporciona servicios de seguridad a múltiples clientes en diferentes ubicaciones. Los guardianes de seguridad trabajan en turnos rotativos que pueden ser diurnos o nocturnos, en días regulares o feriados, con horas normales y extras. El seguimiento manual de esta información es propenso a errores y consume tiempo valioso del personal administrativo.

### Problema que Resuelve

- **Registro manual ineficiente**: Elimina hojas de cálculo y registros en papel
- **Errores en cálculo de horas**: Automatiza clasificación de horas (normales/extras, día/noche)
- **Identificación de feriados**: Reconoce automáticamente días feriados nacionales y por decreto
- **Cálculo de incentivos**: Distribuye incentivos por puesto de manera proporcional
- **Integración con nómina**: Genera reportes CSV listos para importar al sistema de nómina

### Características Principales

#### API REST desarrollada con Node.js, TypeScript y Express.js que permite:

**Gestión de Turnos**:
- Registrar turnos diarios por guardián y puesto
- Clasificación automática de turnos (DIURNO/NOCTURNO según hora de entrada)
- Validación de horas máximas (12 normales + 4 extras = 16 total)
- Detección automática de días feriados
- Prevención de duplicados (mismo guardián, mismo puesto, mismo día)

**Cálculo Automatizado**:
- Horas normales y horas extras por turno
- Identificación de turnos en días feriados
- Cálculo proporcional de incentivos por puesto
- Resumen de horas por empleado y período

**Reportes para Nómina**:
- Generación de reportes quincenales (días 1-15 y 16-fin de mes)
- Formato CSV compatible con sistema de nómina existente
- Incluye: horas trabajadas, tipo de turno, feriados, incentivos
- Trazabilidad completa de turnos procesados

**Integración con Sistema de RRHH**:
- Consulta de empleados activos desde base de datos de nómina (read-only)
- Filtrado automático de guardianes de seguridad (id_puesto = 97)
- Validación de empleados activos antes de registrar turnos
- Sincronización de datos de empleados en tiempo real

**Arquitectura Escalable**:
- Dual database strategy (BD turnos + BD RRHH)
- Connection pooling para alta concurrencia
- Stored procedures para operaciones complejas
- Triggers para validación de datos
- TypeScript para type safety y mantenibilidad

### Casos de Uso Principales

1. **Supervisor registra turno**: Ingresa guardián, puesto, fecha, horas → Sistema valida y calcula automáticamente
2. **Generación de reporte quincenal**: Supervisor selecciona rango de fechas → Sistema genera CSV con todos los turnos
3. **Consulta de horas trabajadas**: Sistema muestra resumen de horas por empleado y período
4. **Asignación de incentivos**: Administrador asigna incentivo a puesto → Sistema calcula distribución proporcional
5. **Validación de feriados**: Sistema identifica automáticamente días feriados al registrar turnos

## Tecnologías

- **Runtime**: Node.js >= 16.0.0
- **Lenguaje**: TypeScript 5.3
- **Framework**: Express.js 4.18
- **Base de Datos**: MySQL 8.0
- **ORM/Query Builder**: mysql2 (conexión directa)
- **Linting**: ESLint + TypeScript ESLint
- **Formateo**: Prettier

---

## Quick Start

Para desarrolladores experimentados que quieren arrancar el proyecto rápidamente:

```bash
# 1. Clonar y navegar al backend
git clone <repository-url>
cd OperacionesRanger/backend

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de MySQL

# 4. Crear base de datos principal
cd ..
mysql -u root -p < sistema_turnos_guardianes.sql
cd backend

# 5. Probar conexiones
npm run db:test

# 6. Ejecutar en modo desarrollo
npm run dev
```

El servidor estará corriendo en `http://localhost:3000` (o el puerto configurado en `.env`).

**Verificación rápida**:
```bash
curl http://localhost:3000/health
# Debe retornar: {"status":"OK","message":"OperacionesRanger API - Sistema de Gestión de Turnos",...}
```

**Tiempo estimado**: 5-10 minutos

Para instalación detallada con explicaciones paso a paso, ver sección [Instalación](#instalación) completa.

---

## Prerequisitos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** >= 16.0.0 (recomendado: 20.x LTS)
- **npm** >= 8.0.0
- **MySQL** 8.0
- **Git**

## Instalación

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd OperacionesRanger/backend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo de ejemplo y configura tus credenciales:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus valores:

```env
# Base de datos principal - Turnos
DB_TURNOS_HOST=localhost
DB_TURNOS_PORT=3306
DB_TURNOS_NAME=turnos_guardianes
DB_TURNOS_USER=root
DB_TURNOS_PASSWORD=tu_password_aqui

# Base de datos RRHH (solo lectura)
DB_RRHH_HOST=localhost
DB_RRHH_PORT=3306
DB_RRHH_NAME=db_aae4a2_ranger
DB_RRHH_USER=root
DB_RRHH_PASSWORD=tu_password_aqui

# Servidor
NODE_ENV=development
PORT=3000
```

### 4. Crear bases de datos

El sistema requiere acceso a **dos bases de datos**:

#### 4.1. Base de datos principal (turnos_guardianes)

Esta base de datos almacena toda la información del sistema de turnos: clientes, ubicaciones, puestos, turnos, incentivos y feriados.

**Crear la base de datos**:

```bash
# Opción 1: Desde la raíz del proyecto
cd ..
mysql -u root -p < sistema_turnos_guardianes.sql

# Opción 2: Manualmente
mysql -u root -p
```

```sql
-- Crear base de datos
CREATE DATABASE IF NOT EXISTS turnos_guardianes
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- Ejecutar el script completo
SOURCE /ruta/completa/a/sistema_turnos_guardianes.sql;
```

**Verificar creación**:

```bash
mysql -u root -p -e "USE turnos_guardianes; SHOW TABLES;"
```

Deberías ver 9 tablas:
- `clientes`
- `configuracion_turnos`
- `feriados`
- `incentivos_puesto`
- `puestos`
- `turnos`
- `ubicaciones`
- 2 vistas y 4 procedimientos almacenados

#### 4.2. Base de datos RRHH (db_aae4a2_ranger) - Solo lectura

Esta base de datos ya existe en el sistema de nómina (Ranger Nomina). El sistema de turnos la consulta en **modo solo lectura** para obtener información de empleados (guardianes de seguridad).

**Verificar acceso**:

```bash
mysql -u root -p -e "USE db_aae4a2_ranger; SELECT COUNT(*) FROM rh_empleado WHERE id_puesto = 97 AND status = 1;"
```

**Nota importante**: Esta base de datos **NO debe modificarse** desde el sistema de turnos. Solo tiene permisos de lectura (SELECT).

#### 4.3. Probar conexiones

Una vez creadas las bases de datos, prueba las conexiones:

```bash
npm run db:test
```

Este script valida que:
- Las credenciales en `.env` son correctas
- Ambas bases de datos son accesibles
- Las tablas necesarias existen
- El usuario tiene los permisos adecuados

**Salida esperada**:
```
✓ Conexión a BD principal exitosa
  Base de datos: turnos_guardianes
  Versión MySQL: 8.0.x
  Tablas disponibles: 9

✓ Conexión a BD RRHH exitosa
  Base de datos: db_aae4a2_ranger
  Tabla rh_empleado encontrada
  Guardianes activos: XXX
```

---

## Scripts de Utilidades de Base de Datos

El backend incluye varios scripts utilitarios para facilitar el desarrollo y mantenimiento de las bases de datos.

### Inicializar Base de Datos

Crea la base de datos `turnos_guardianes` desde cero ejecutando el schema SQL completo.

```bash
# Crear BD si no existe
npm run db:init

# Forzar recreación de BD (CUIDADO: elimina datos existentes)
npm run db:init -- --force
```

**Advertencia**: El flag `--force` eliminará la base de datos existente y todos sus datos. Solo usar en desarrollo.

**Características**:
- Lee el archivo `sistema_turnos_guardianes.sql` de la raíz del proyecto
- Crea todas las tablas, procedimientos almacenados, triggers y vistas
- Valida que NODE_ENV no sea 'production' antes de operaciones destructivas
- Solicita confirmación antes de eliminar datos existentes
- Muestra resumen de objetos creados (tablas, procedimientos, triggers, vistas)

---

### Probar Conexiones

Valida que las conexiones a ambas bases de datos (turnos y RRHH) funcionan correctamente.

```bash
npm run db:test
```

**Salida esperada**:
- Información de conexión de ambas BDs
- Versión de MySQL
- Cantidad de tablas disponibles
- Cantidad de guardianes activos en BD RRHH

---

### Cargar Feriados

Carga feriados nacionales de República Dominicana para un año específico.

```bash
# Cargar feriados del próximo año
npm run db:seed

# Cargar feriados de un año específico
npm run db:seed -- --year=2027

# Forzar recarga (elimina existentes del año)
npm run db:seed -- --year=2027 --force
```

**Feriados incluidos**: 12 feriados nacionales de RD (incluye fechas móviles como Viernes Santo y Corpus Christi calculadas automáticamente).

**Características**:
- Calcula automáticamente fechas móviles usando el algoritmo de Computus
- Valida que el año sea >= año actual
- Evita duplicados usando INSERT IGNORE
- Permite forzar recarga eliminando feriados existentes del año
- Muestra resumen de feriados insertados vs duplicados

---

### Cargar Usuarios de Prueba

Carga usuarios de prueba en la tabla `sys_usuarios` para desarrollo y testing.

```bash
# Cargar usuarios de prueba
npm run db:seed:usuarios

# Forzar recarga (eliminar existentes)
npm run db:seed:usuarios -- --force
```

**Usuarios creados**: 3 usuarios de prueba con diferentes roles

| Username | Password | Rol | Email |
|----------|----------|-----|-------|
| admin | Admin123! | ADMIN | admin@operacionesranger.com |
| supervisor | Super123! | SUPERVISOR | supervisor@operacionesranger.com |
| consulta | Consulta123! | CONSULTA | consulta@operacionesranger.com |

**Características**:
- Passwords hasheados con bcrypt (10 rounds)
- Solo ejecutable en NODE_ENV=development o test
- INSERT IGNORE para evitar duplicados
- Opción --force para recrear usuarios
- Validación de seguridad integrada

**IMPORTANTE**: Cambiar estos passwords en producción. Estos son solo para desarrollo/testing.

---

### Cargar Datos Maestros de Prueba

Carga datos de prueba realistas de República Dominicana para clientes, ubicaciones, puestos e incentivos.

```bash
# Cargar datos maestros (clientes, ubicaciones, puestos, incentivos)
npm run db:seed:maestros

# Eliminar existentes y recargar
npm run db:seed:maestros -- --clean
```

**Datos cargados**: Datos de prueba realistas de empresas dominicanas

| Entidad | Cantidad | Descripción |
|---------|----------|-------------|
| **Clientes** | 3 | Banco Popular, Supermercados Nacional, Ágora Mall |
| **Ubicaciones** | 6 | 2 ubicaciones por cliente (Santo Domingo) |
| **Puestos** | 12 | 2 puestos por ubicación (Entrada, Caja Fuerte, etc.) |
| **Incentivos** | 5 | Incentivos quincenales para puestos críticos |

**Clientes incluidos**:

1. **Banco Popular Dominicano** (`BPD001`)
   - RUC: 101234567
   - Sucursal Centro (Zona Colonial)
   - Sucursal Naco (Av. Tiradentes)

2. **Supermercados Nacional** (`NACIO001`)
   - RUC: 102345678
   - Nacional Lope de Vega
   - Nacional Churchill

3. **Centro Comercial Ágora Mall** (`AGORA001`)
   - RUC: 103456789
   - Área Comercial
   - Estacionamientos

**Características**:
- ✅ Respeta relaciones FK (clientes → ubicaciones → puestos → incentivos)
- ✅ Datos realistas de empresas dominicanas
- ✅ Coordenadas GPS reales de Santo Domingo
- ✅ RUC en formato correcto (9 dígitos)
- ✅ Teléfonos en formato RD (809-XXX-XXXX)
- ✅ Validación NODE_ENV=development (no ejecuta en producción)
- ✅ Opción `--clean` para eliminar datos existentes con confirmación

**Verificar datos cargados**:

```sql
-- Ver clientes
SELECT codigo, nombre, email FROM clientes
WHERE codigo IN ('BPD001', 'NACIO001', 'AGORA001');

-- Ver ubicaciones con cliente
SELECT u.codigo, u.nombre, c.nombre AS cliente
FROM ubicaciones u
JOIN clientes c ON u.cliente_id = c.id;

-- Ver puestos con ubicación
SELECT p.codigo, p.nombre, u.nombre AS ubicacion, p.cantidad_guardianes
FROM puestos p
JOIN ubicaciones u ON p.ubicacion_id = u.id;

-- Ver incentivos con valor_hora calculado
SELECT i.*, p.nombre AS puesto_nombre, i.valor_hora
FROM incentivos_puesto i
JOIN puestos p ON i.puesto_id = p.id;
```

**Nota de seguridad**: Este script solo se ejecuta en ambientes de desarrollo/test. En producción retorna error automáticamente.

---

### Ejecutar Queries de Ejemplo

Ejecuta queries comunes del sistema para verificar funcionamiento y explorar datos.

```bash
npm run db:examples
```

**Queries incluidas**:
- Listar guardianes activos (BD RRHH)
- Turnos registrados últimos 30 días
- Resumen de horas por empleado (últimos 15 días)
- Puestos con incentivos activos
- Feriados del año actual
- Llamadas a procedimientos almacenados (`sp_verificar_feriado`, `sp_determinar_tipo_turno`)
- Consultas a vistas del sistema

**Características**:
- Muestra resultados en formato tabla
- Mide tiempo de ejecución de cada query
- Documenta casos de uso comunes del sistema
- Útil para validar que el sistema funciona correctamente

---

### Resetear Datos de Prueba

Limpia y recarga datos de prueba en ambiente de desarrollo.

```bash
npm run db:reset
```

**IMPORTANTE**:
- Solo funciona en `NODE_ENV=development`
- Solicita confirmación antes de eliminar datos
- Elimina: clientes, ubicaciones, puestos, turnos, incentivos
- Recarga: datos de prueba frescos para desarrollo
- NO toca: feriados, configuración de turnos

**Datos de prueba cargados**:
- 2 Clientes de ejemplo (Banco Central, Ágora Mall)
- 3 Ubicaciones de ejemplo
- 5 Puestos de vigilancia de ejemplo
- ~14 Turnos de ejemplo (últimos 7 días)
- 2 Incentivos de ejemplo para la quincena actual

---

### Resumen de Scripts

| Script | Comando | Descripción | Destructivo |
|--------|---------|-------------|-------------|
| `db:init` | `npm run db:init` | Crear BD desde schema SQL | ⚠️ Sí (con --force) |
| `db:test` | `npm run db:test` | Probar conexiones a BDs | No |
| `db:seed` | `npm run db:seed` | Cargar feriados de un año | No (inserta) |
| `db:seed:usuarios` | `npm run db:seed:usuarios` | Cargar usuarios de prueba | ⚠️ Sí (con --force) |
| `db:seed:maestros` | `npm run db:seed:maestros` | Cargar datos maestros de prueba | ⚠️ Sí (con --clean) |
| `db:examples` | `npm run db:examples` | Ejecutar queries de ejemplo | No (solo lectura) |
| `db:reset` | `npm run db:reset` | Resetear datos de prueba | ⚠️ Sí (solo dev) |

**Protecciones de seguridad**:
- Scripts destructivos validan `NODE_ENV !== 'production'`
- Solicitan confirmación antes de eliminar datos
- Muestran advertencias claras sobre operaciones destructivas
- Bloquean ejecución en producción automáticamente

---

## Configuración Avanzada

### Connection Pooling

El sistema utiliza connection pooling para optimizar el rendimiento de las conexiones a MySQL. La configuración se encuentra en `src/config/database.ts`.

**Configuración actual**:

```typescript
// Base de datos principal (turnos_guardianes) - Read/Write
connectionLimit: 10      // Máximo 10 conexiones simultáneas
queueLimit: 0           // Sin límite de cola (espera infinita)
waitForConnections: true // Esperar si no hay conexiones disponibles
enableKeepAlive: true   // Mantener conexiones vivas
keepAliveInitialDelay: 0 // Delay inicial para keep-alive

// Base de datos RRHH (db_aae4a2_ranger) - Read Only
connectionLimit: 5       // Máximo 5 conexiones (menor carga)
queueLimit: 0
waitForConnections: true
enableKeepAlive: true
keepAliveInitialDelay: 0
```

**Ajustar según carga**:

Para ambientes de alta concurrencia, incrementar `connectionLimit`:

```typescript
// En src/config/database.ts
connectionLimit: 20  // Para alta carga (más de 50 usuarios concurrentes)
connectionLimit: 50  // Para muy alta carga (más de 200 usuarios concurrentes)
```

**Nota**: Cada conexión consume recursos del servidor MySQL. Monitorear con:

```sql
SHOW STATUS LIKE 'Threads_connected';
SHOW VARIABLES LIKE 'max_connections';
```

### Timeouts y Retry Logic

**Timeouts de conexión**:

```typescript
// En src/config/database.ts
connectTimeout: 10000   // 10 segundos para establecer conexión
acquireTimeout: 10000   // 10 segundos para adquirir conexión del pool
```

**Retry logic** (implementar en Fase 2):

```typescript
// Ejemplo de retry logic para queries críticas
async function executeWithRetry(query, params, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await pool.execute(query, params);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### Optimización de Queries

**Índices de base de datos**:

El schema SQL (`sistema_turnos_guardianes.sql`) ya incluye índices optimizados:

```sql
-- Índice para búsquedas por empleado y fecha
INDEX idx_turnos_empleado_fecha (empleado_id, fecha)

-- Índice para búsquedas por puesto
INDEX idx_turnos_puesto (puesto_id)

-- Índice único para prevenir duplicados
UNIQUE KEY uk_empleado_puesto_fecha (empleado_id, puesto_id, fecha)
```

**Uso de procedimientos almacenados**:

Para operaciones complejas, usar stored procedures (ya implementados):

```typescript
// Mejor: Usar procedimiento almacenado (operación atómica)
await pool.execute('CALL sp_registrar_turno(?, ?, ?, ?, ?, ?, ?, ?)', [
  empleado_id, puesto_id, fecha, hora_entrada, hora_salida,
  horas_normales, horas_extras, created_by
]);

// Evitar: Múltiples queries separadas (más lento, menos seguro)
await pool.execute('INSERT INTO turnos ...');
await pool.execute('UPDATE turnos SET es_feriado = ...');
await pool.execute('UPDATE turnos SET tipo_turno = ...');
```

### Seguridad

**Conexiones SSL/TLS** (recomendado para producción):

```typescript
// En src/config/database.ts
ssl: {
  ca: fs.readFileSync('/path/to/ca-cert.pem'),
  rejectUnauthorized: true
}
```

**Variables de entorno seguras**:

```env
# Usar contraseñas fuertes (mínimo 16 caracteres)
DB_TURNOS_PASSWORD=MyV3ryS3cur3P@ssw0rd2026!

# Generar JWT secret aleatorio (32+ caracteres)
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

**Prevención de SQL Injection**:

El sistema usa prepared statements (automático con `mysql2/promise`):

```typescript
// Seguro: Prepared statement
await pool.execute('SELECT * FROM turnos WHERE empleado_id = ?', [empleado_id]);

// Inseguro: String concatenation (NUNCA HACER)
await pool.execute(`SELECT * FROM turnos WHERE empleado_id = ${empleado_id}`);
```

### Variables de Entorno Opcionales

Además de las variables requeridas en `.env.example`, puedes configurar:

```env
# Configuración de pool de conexiones
DB_CONNECTION_LIMIT=10
DB_QUEUE_LIMIT=0
DB_CONNECT_TIMEOUT=10000

# Configuración de logging avanzado
LOG_SQL_QUERIES=true          # Loggear queries SQL (solo desarrollo)
LOG_SQL_ERRORS_ONLY=false     # Solo loggear errores SQL

# Configuración de rendimiento
NODE_OPTIONS=--max-old-space-size=4096  # Incrementar memoria Node.js

# Configuración de timezone
TZ=America/Santo_Domingo      # Importante: coincidir con MySQL

# Configuración de CORS (múltiples orígenes)
CORS_ORIGIN=http://localhost:4200,http://localhost:4201
```

### Monitoreo y Logs

**Logs estructurados** (implementar en Fase 2):

```typescript
// Usar winston o pino para logs estructurados
logger.info('Turno registrado', {
  turno_id: result.insertId,
  empleado_id: empleado_id,
  fecha: fecha,
  duration_ms: Date.now() - startTime
});
```

**Métricas de rendimiento**:

```typescript
// Medir tiempo de queries críticas
const start = Date.now();
const result = await pool.execute(query, params);
const duration = Date.now() - start;

if (duration > 1000) {
  console.warn(`Slow query detected: ${duration}ms`);
}
```

---

## Cómo ejecutar

### Modo desarrollo (con hot-reload)

```bash
npm run dev
```

El servidor se ejecutará en `http://localhost:3000` (o el puerto especificado en `.env`)

### Compilar TypeScript a JavaScript

```bash
npm run build
```

Los archivos compilados se generan en la carpeta `dist/`

### Modo producción

```bash
npm start
```

Ejecuta el código compilado de la carpeta `dist/`

### Ejecutar tests

```bash
npm test
```

> **Nota**: Los tests se implementarán en fases posteriores del proyecto.

### Linter y formateo

```bash
# Ejecutar linter
npm run lint

# Formatear código con Prettier
npm run format
```

## Estructura del proyecto

```
backend/
├── src/
│   ├── config/           # Configuración (database, env, etc.)
│   ├── controllers/      # Controladores de rutas
│   ├── models/           # Modelos de datos (interfaces TypeScript)
│   ├── services/         # Lógica de negocio
│   ├── routes/           # Definición de rutas
│   ├── middlewares/      # Middlewares (auth, validation, etc.)
│   ├── utils/            # Utilidades y helpers
│   ├── types/            # Tipos TypeScript globales
│   └── server.ts         # Punto de entrada del servidor
├── tests/                # Tests unitarios e integración
├── scripts/              # Scripts de utilidad
├── dist/                 # Código compilado (generado)
├── node_modules/         # Dependencias (generado)
├── .env                  # Variables de entorno (NO COMMITEAR)
├── .env.example          # Ejemplo de variables de entorno
├── .gitignore            # Archivos ignorados por Git
├── tsconfig.json         # Configuración de TypeScript
├── eslint.config.js      # Configuración de ESLint
├── prettier.config.js    # Configuración de Prettier
├── package.json          # Dependencias y scripts
└── README.md             # Este archivo
```

## Modelos de Datos

### Modelos de Autenticación

El sistema utiliza 3 tablas para gestionar autenticación y autorización:

#### 1. `sys_usuarios`

Usuarios del sistema con roles y permisos.

**Campos principales**:
- `id_usuario`: Identificador único (INT, PK, AUTO_INCREMENT)
- `username`: Nombre de usuario (VARCHAR(50), UNIQUE, NOT NULL)
- `password_hash`: Hash bcrypt de la contraseña (VARCHAR(255), NOT NULL)
- `email`: Email del usuario (VARCHAR(100), UNIQUE, NULLABLE)
- `nombre_completo`: Nombre completo del usuario (VARCHAR(150), NOT NULL)
- `rol`: Rol del usuario - ENUM('ADMIN', 'SUPERVISOR', 'CONSULTA')
- `activo`: Estado del usuario (BOOLEAN, DEFAULT TRUE)
- `ultimo_login`: Fecha del último login exitoso (TIMESTAMP, NULLABLE)
- `intentos_fallidos`: Contador de intentos fallidos de login (INT, DEFAULT 0)
- `bloqueado_hasta`: Fecha hasta la cual está bloqueado (TIMESTAMP, NULLABLE)

**Roles**:
- **ADMIN**: Control total del sistema (usuarios, configuración, todos los módulos)
- **SUPERVISOR**: Operación diaria (registro de turnos, gestión, reportes)
- **CONSULTA**: Solo lectura (visualización de turnos y reportes)

**Seguridad**:
- Bloqueo temporal tras 5 intentos fallidos (15 minutos)
- Passwords hasheados con bcrypt (10 rounds)
- Auditoría de creación y modificación (created_by, modified_by)

#### 2. `sys_refresh_tokens`

Tokens de renovación para mantener sesiones activas.

**Campos principales**:
- `id_token`: Identificador único (INT, PK, AUTO_INCREMENT)
- `id_usuario`: Usuario propietario del token (INT, FK → sys_usuarios)
- `token_hash`: Hash SHA-256 del refresh token (VARCHAR(255), UNIQUE, NOT NULL)
- `fecha_emision`: Fecha de emisión (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- `fecha_expiracion`: Fecha de expiración (TIMESTAMP, NOT NULL)
- `revocado`: Indica si el token fue revocado (BOOLEAN, DEFAULT FALSE)
- `ip_address`: IP desde donde se emitió (VARCHAR(45), NULLABLE)
- `user_agent`: User agent del navegador (TEXT, NULLABLE)

**Características**:
- Expiración: 7 días por defecto
- Revocación manual: permite invalidar tokens (logout)
- Almacenamiento seguro: solo hash, nunca plaintext
- Límite de tokens activos: máximo 5 por usuario

#### 3. `sys_auditoria_auth`

Registro de todos los eventos de autenticación.

**Campos principales**:
- `id_auditoria`: Identificador único (INT, PK, AUTO_INCREMENT)
- `id_usuario`: Usuario relacionado (INT, FK → sys_usuarios, NULLABLE)
- `username`: Username del intento (VARCHAR(50), NOT NULL)
- `evento`: Tipo de evento - ENUM('LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'TOKEN_REFRESH', 'PASSWORD_CHANGE')
- `ip_address`: IP desde donde se originó (VARCHAR(45), NULLABLE)
- `user_agent`: User agent del navegador (TEXT, NULLABLE)
- `detalles`: Información adicional en JSON (TEXT, NULLABLE)
- `fecha_evento`: Timestamp del evento (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)

**Eventos auditados**:
- LOGIN_SUCCESS: Login exitoso
- LOGIN_FAILED: Intento fallido de login
- LOGOUT: Cierre de sesión
- TOKEN_REFRESH: Renovación de access token
- PASSWORD_CHANGE: Cambio de contraseña

### Schemas de Validación

El sistema utiliza **Zod** para validación de datos de entrada en tiempo de ejecución.

**Ubicación**: `src/schemas/auth.schema.ts`

**Schemas disponibles**:
- `loginSchema`: Validación de login (username + password)
- `refreshTokenSchema`: Validación de refresh token
- `changePasswordSchema`: Validación de cambio de contraseña
- `createUserSchema`: Validación de creación de usuario
- `updateUserSchema`: Validación de actualización de usuario
- `paginationQuerySchema`: Validación de parámetros de paginación

**Ejemplo de uso**:

```typescript
import { loginSchema } from '@schemas/auth.schema';

// Validar request body
const result = loginSchema.safeParse(req.body);

if (!result.success) {
  // Manejar errores de validación
  return res.status(400).json({
    error: 'Datos inválidos',
    details: result.error.errors
  });
}

// Usar datos validados
const { username, password } = result.data;
```

### TypeScript Interfaces

**Ubicación**: `src/models/auth.model.ts`

**Interfaces principales**:
- `Usuario`: Modelo completo de usuario
- `RefreshToken`: Modelo de refresh token
- `AuditoriaAuth`: Modelo de auditoría
- `LoginDTO`: DTO para login request
- `LoginResponseDTO`: DTO para login response
- `UserSafeDTO`: Usuario sin password_hash (para responses)
- `CreateUserDTO`: DTO para crear usuario
- `UpdateUserDTO`: DTO para actualizar usuario

**Enums y Types**:
- `UserRole`: 'ADMIN' | 'SUPERVISOR' | 'CONSULTA'
- `AuthEvent`: Eventos de auditoría
- `JWTPayload`: Payload del JWT

**Type Guards y Helpers**:
- `isValidUserRole(role)`: Verifica si un rol es válido
- `hasRole(user, role)`: Verifica si un usuario tiene un rol específico
- `hasPermission(user, permission)`: Verifica si un usuario tiene un permiso
- `isUserLocked(user)`: Verifica si un usuario está bloqueado
- `toUserSafeDTO(user)`: Convierte Usuario a UserSafeDTO (sin password_hash)

Ver archivo `src/models/auth.model.ts` para documentación completa.

---

## Endpoints disponibles

### Health Check

```
GET /health
```

Verifica que el servidor está corriendo correctamente.

**Respuesta**:
```json
{
  "status": "OK",
  "message": "OperacionesRanger API - Sistema de Gestión de Turnos",
  "timestamp": "2026-01-17T21:00:00.000Z",
  "environment": "development"
}
```

### API Info

```
GET /
```

Información general de la API.

**Respuesta**:
```json
{
  "name": "OperacionesRanger API",
  "version": "1.0.0",
  "description": "Sistema de Gestión de Turnos para Guardianes de Seguridad - Guardianes Ranger",
  "endpoints": {
    "health": "/health"
  }
}
```

> **Nota**: Los endpoints de negocio (clientes, ubicaciones, puestos, turnos, reportes) se implementarán en las siguientes fases del proyecto.

## Variables de entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `NODE_ENV` | Ambiente de ejecución (development, production, test) | `development` |
| `PORT` | Puerto del servidor | `3000` |
| `LOG_LEVEL` | Nivel de logging (error, warn, info, debug) | `debug` |
| `DB_TURNOS_HOST` | Host de la BD de turnos | `localhost` |
| `DB_TURNOS_PORT` | Puerto de MySQL | `3306` |
| `DB_TURNOS_NAME` | Nombre de la BD de turnos | `turnos_guardianes` |
| `DB_TURNOS_USER` | Usuario de la BD | `root` |
| `DB_TURNOS_PASSWORD` | Contraseña de la BD | - |
| `DB_RRHH_HOST` | Host de la BD de RRHH | `localhost` |
| `DB_RRHH_PORT` | Puerto de MySQL | `3306` |
| `DB_RRHH_NAME` | Nombre de la BD de RRHH | `db_aae4a2_ranger` |
| `DB_RRHH_USER` | Usuario de la BD | `root` |
| `DB_RRHH_PASSWORD` | Contraseña de la BD | - |
| `CORS_ORIGIN` | Origen permitido para CORS | `http://localhost:4200` |
| `TZ` | Zona horaria | `America/Santo_Domingo` |
| `LOG_LEVEL` | Nivel de logging | `info` |
| `LOG_FILE_PATH` | Ruta de archivos de logs | `logs` |
| `AUDIT_ENABLED` | Habilitar auditoría | `true` |

---

## Logging y Auditoría

El sistema incluye un sistema completo de logging con **Winston** y auditoría de operaciones en base de datos.

### Sistema de Logging

#### Configuración

El logger está configurado con múltiples niveles y transports:

**Niveles de log disponibles**:
- `error`: Errores críticos
- `warn`: Advertencias
- `info`: Información general (recomendado para producción)
- `debug`: Información detallada de debugging (recomendado para desarrollo)

**Transports**:
- **Consola**: Siempre habilitado, formato pretty-print en desarrollo, JSON en producción
- **Archivo combinado**: `logs/combined-YYYY-MM-DD.log` (todos los niveles)
- **Archivo de errores**: `logs/error-YYYY-MM-DD.log` (solo errores, retención 14 días)

**Rotación de logs**:
- Rotación diaria automática
- Tamaño máximo por archivo: 50MB
- Retención: 7 días (combined), 14 días (errors)

#### Uso en Código

```typescript
import logger from '@/config/logger';

// Información general
logger.info('Usuario creado exitosamente', { userId: 123, username: 'admin' });

// Advertencias
logger.warn('Rate limit exceeded', { ip: req.ip, endpoint: req.path });

// Errores
logger.error('Database connection failed', {
  error: err.message,
  stack: err.stack,
  dbHost: env.dbTurnos.host
});

// Debugging (solo en desarrollo)
logger.debug('SQL query executed', { query: 'SELECT * FROM users', duration: 45 });
```

#### Sanitización de Datos Sensibles

El logger automáticamente remueve información sensible de los logs:
- Passwords (`password`, `password_hash`, `newPassword`, etc.)
- Tokens (`token`, `refreshToken`, `accessToken`, `jwt`)
- Secretos (`secret`, `JWT_SECRET`, `authorization`)

```typescript
// Esto:
logger.info('Login attempt', {
  username: 'admin',
  password: 'secret123', // Será sanitizado
  token: 'jwt.token.here' // Será sanitizado
});

// Se loguea como:
logger.info('Login attempt', {
  username: 'admin',
  password: '***REDACTED***',
  token: '***REDACTED***'
});
```

#### Configuración desde Variables de Entorno

```bash
# Nivel de log (error | warn | info | debug)
LOG_LEVEL=info

# Directorio de archivos de logs (relativo o absoluto)
LOG_FILE_PATH=logs
```

### Sistema de Auditoría

#### Descripción

El sistema de auditoría registra todas las operaciones de escritura (CREATE, UPDATE, DELETE) en la tabla `sys_auditoria` para trazabilidad y cumplimiento.

#### Tabla sys_auditoria

```sql
CREATE TABLE sys_auditoria (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,                  -- Usuario que realizó la acción
  accion ENUM('CREATE', 'UPDATE', 'DELETE') NOT NULL,
  entidad VARCHAR(100) NOT NULL,         -- Nombre de la tabla/recurso
  entidad_id INT NULL,                   -- ID del registro afectado
  ip_address VARCHAR(45) NULL,           -- IP del cliente
  datos_anteriores JSON NULL,            -- Datos antes del cambio (UPDATE/DELETE)
  datos_nuevos JSON NULL,                -- Datos después del cambio (CREATE/UPDATE)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES sys_usuarios(id_usuario)
);
```

#### Middleware de Auditoría

El middleware `auditMiddleware` se aplica automáticamente a todas las rutas de escritura:

```typescript
// Ejemplo de aplicación en rutas
router.post('/', authMiddleware, requireRole('ADMIN'), auditMiddleware('clientes'), createController);
router.put('/:id', authMiddleware, requireRole('ADMIN'), auditMiddleware('clientes'), updateController);
router.delete('/:id', authMiddleware, requireRole('ADMIN'), auditMiddleware('clientes'), deleteController);
```

#### Qué se Audita

**Operaciones registradas**:
- `CREATE` (POST): Registra datos nuevos
- `UPDATE` (PUT/PATCH): Registra datos anteriores y nuevos
- `DELETE` (DELETE): Registra datos anteriores

**NO se auditan**:
- Operaciones GET (solo lectura)
- Operaciones cuando el usuario no está autenticado
- Operaciones cuando `AUDIT_ENABLED=false`

#### Consultas de Auditoría

**Ver operaciones recientes de un usuario**:
```sql
SELECT
  a.id,
  a.accion,
  a.entidad,
  a.entidad_id,
  u.username,
  a.ip_address,
  a.created_at
FROM sys_auditoria a
JOIN sys_usuarios u ON a.user_id = u.id_usuario
WHERE a.user_id = 1
ORDER BY a.created_at DESC
LIMIT 20;
```

**Ver historial de cambios de un registro**:
```sql
SELECT
  a.accion,
  a.datos_anteriores,
  a.datos_nuevos,
  u.username,
  a.created_at
FROM sys_auditoria a
JOIN sys_usuarios u ON a.user_id = u.id_usuario
WHERE a.entidad = 'clientes'
  AND a.entidad_id = 5
ORDER BY a.created_at DESC;
```

**Resumen de operaciones por entidad** (últimos 30 días):
```sql
SELECT
  entidad,
  accion,
  COUNT(*) as total_operaciones,
  COUNT(DISTINCT user_id) as usuarios_unicos
FROM sys_auditoria
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY entidad, accion
ORDER BY total_operaciones DESC;
```

#### Sanitización en Auditoría

Similar al logger, el sistema de auditoría remueve automáticamente campos sensibles antes de guardarlos:
- Passwords
- Tokens de autenticación
- Secretos y claves

#### Configuración

```bash
# Habilitar/deshabilitar auditoría
AUDIT_ENABLED=true  # Default: true

# En producción, mantener siempre habilitado para cumplimiento
```

#### Performance

El middleware de auditoría está diseñado para no bloquear requests:
- Inserts asíncronos (fire-and-forget)
- Si falla el insert de auditoría, el request continúa normalmente
- Los errores de auditoría se loguean pero no rompen el flujo

#### Mejores Prácticas

1. **Revisar auditoría regularmente**: Monitorear operaciones sospechosas
2. **Retención de datos**: Definir política de retención (ej: 1 año)
3. **Backup de auditoría**: Incluir sys_auditoria en backups regulares
4. **Análisis periódico**: Generar reportes mensuales de actividad
5. **Cumplimiento**: Usar auditoría como evidencia para auditorías externas

---

## Testing

### Framework de Testing

El proyecto usa **Jest** + **Supertest** para testing completo del backend.

<p align="center">
  <img src="https://img.shields.io/badge/coverage->70%25-brightgreen?style=flat-square" alt="Coverage">
  <img src="https://img.shields.io/badge/tests-350+-blue?style=flat-square" alt="Tests">
</p>

### Suite de Tests Actual

- **✅ 350+ tests implementados**
- **✅ Tests unitarios**: Servicios, middlewares, utilidades
- **✅ Tests de integración**: Todos los endpoints API con BD real
- **✅ Cobertura >70%**: En código crítico del sistema
- **✅ Helpers compartidos**: Reutilizables para simplificar tests
- **✅ Setup/teardown global**: Configuración automática de BD de prueba

### Comandos Principales

```bash
# Ejecutar TODOS los tests
npm test

# Ejecutar en modo watch (auto-rerun al cambiar archivos)
npm run test:watch

# Generar reporte de cobertura
npm run test:coverage

# Solo tests UNITARIOS (servicios, middlewares, utils)
npm run test:unit

# Solo tests de INTEGRACIÓN (API endpoints)
npm run test:integration

# Tests por módulo específico
npm run test:integration:auth        # Autenticación
npm run test:integration:crud        # CRUDs maestros
npm run test:integration:rrhh        # Integración RRHH
npm run test:integration:turnos      # Turnos
npm run test:integration:reportes    # Reportes

# Para CI/CD
npm run test:ci
```

### Estructura de Tests

```
backend/tests/
├── helpers/                    # 🔧 Utilidades compartidas
│   ├── auth.helpers.ts         # Crear usuarios, login, tokens
│   ├── database.helpers.ts     # Limpiar tablas, seed data
│   └── request.helpers.ts      # Requests autenticados, parseo CSV
├── setup/                      # ⚙️ Setup/teardown global
│   ├── global-setup.ts         # Verificar BD, crear tablas
│   └── global-teardown.ts      # Limpiar datos de prueba
├── integration/                # 🌐 Tests de integración (API)
│   ├── auth.test.ts            # 12 tests - Autenticación
│   ├── usuarios.test.ts        # 25+ tests - CRUD usuarios
│   ├── clientes.test.ts        # 22 tests - CRUD clientes
│   ├── ubicaciones.test.ts     # 30+ tests - CRUD ubicaciones
│   ├── puestos.test.ts         # 24 tests - CRUD puestos
│   ├── feriados.test.ts        # 14 tests - CRUD feriados
│   ├── config-turnos.test.ts   # 20 tests - Config turnos
│   ├── incentivos.integration.test.ts  # 20 tests - Incentivos
│   ├── rrhh.test.ts            # 22 tests - Integración RRHH
│   ├── turnos.integration.test.ts      # 48+ tests - Turnos
│   ├── reportes.integration.test.ts    # 14 tests - CSV
│   ├── reportes-historial.integration.test.ts  # 12 tests
│   └── reportes-resumen.integration.test.ts    # 18 tests
├── services/                   # 🔬 Tests unitarios de servicios
│   ├── password.service.test.ts    # 22 tests - Hashing
│   ├── jwt.service.test.ts         # 29 tests - JWT tokens
│   └── cache.service.test.ts       # 18 tests - Caché
├── middlewares/                # 🛡️ Tests de middlewares
│   ├── auth.middleware.test.ts     # 20 tests - Autenticación
│   ├── role.middleware.test.ts     # 19 tests - Autorización
│   ├── audit.middleware.test.ts    # 31 tests - Auditoría
│   └── ... (error-handler, pagination, validation)
├── unit/                       # ⚡ Tests unitarios varios
│   └── turno.validation.test.ts    # 24 tests - Validaciones
└── README.md                   # 📖 Guía completa de testing
```

### Configuración de BD de Prueba

**IMPORTANTE**: Los tests usan bases de datos **SEPARADAS** de desarrollo/producción.

#### 1. Crear BDs de Prueba

```bash
mysql -u root -p
```

```sql
CREATE DATABASE turnos_guardianes_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE db_aae4a2_ranger_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 2. Cargar Schema

```bash
mysql -u root -p turnos_guardianes_test < sistema_turnos_guardianes.sql
```

#### 3. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.test.example .env.test

# Editar con tus credenciales
nano .env.test
```

### Helpers Compartidos

Los tests usan helpers compartidos para evitar duplicación:

```typescript
// Ejemplo de uso de helpers
import {
  createTestAdmin,
  loginAsAdmin,
  cleanupTestUsers,
} from '@tests/helpers/auth.helpers';
import {
  cleanTable,
  seedTestClientes,
} from '@tests/helpers/database.helpers';
import {
  authGet,
  expectPaginatedResponse,
} from '@tests/helpers/request.helpers';

describe('Mi Test', () => {
  let token: string;

  beforeAll(async () => {
    await createTestAdmin();
    token = await loginAsAdmin();
  });

  beforeEach(async () => {
    await cleanTable('clientes');
    await seedTestClientes();
  });

  it('debe obtener lista de clientes', async () => {
    const response = await authGet('/api/clientes', token);
    expectPaginatedResponse(response);
    expect(response.body.data.length).toBe(2);
  });
});
```

### Coverage Actual

**Objetivo de cobertura**: >= 70% en código crítico

```bash
npm run test:coverage
# Reporte HTML generado en: coverage/lcov-report/index.html
```

### Documentación Completa

Para documentación detallada de testing, ver:

📖 **[tests/README.md](tests/README.md)**

Incluye:
- Guía completa de todos los helpers disponibles
- Ejemplos de cómo crear nuevos tests
- Troubleshooting de problemas comunes
- Mejores prácticas de testing

### Buenas Prácticas

1. **Tests aislados**: Cada test debe ser independiente
2. **Nombres descriptivos**: `debe [acción esperada] cuando [condición]`
3. **AAA Pattern**: Arrange (preparar), Act (actuar), Assert (verificar)
4. **Usar helpers**: Aprovechar helpers compartidos para evitar duplicación
5. **Tests rápidos**: Tests unitarios deben ejecutarse en < 100ms
6. **Limpiar después**: Siempre limpiar datos de prueba en `afterEach`/`afterAll`
7. **BD separada**: NUNCA usar BD de desarrollo/producción para tests

---

## Deployment

### Preparación para Producción

#### 1. Compilar TypeScript

```bash
# Compilar código TypeScript a JavaScript
npm run build

# Verificar que dist/ se generó correctamente
ls dist/
```

#### 2. Variables de Entorno

Configurar variables de producción en el servidor:

```bash
# Copiar .env.example a .env
cp .env.example .env

# Editar con valores de producción
nano .env
```

**Variables críticas de producción**:

```env
NODE_ENV=production
PORT=3000

# Credenciales de BD de producción (¡NUNCA usar credenciales de desarrollo!)
DB_TURNOS_HOST=db-prod.example.com
DB_TURNOS_PASSWORD=<strong-password-here>
DB_RRHH_PASSWORD=<strong-password-here>

# JWT secret aleatorio (generar con crypto)
JWT_SECRET=<64-character-random-string>

# CORS origen del frontend de producción
CORS_ORIGIN=https://turnos.guardianesranger.com
```

**Generar JWT secret seguro**:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 3. Optimizaciones de Node.js

```bash
# Incrementar memoria disponible para Node.js
export NODE_OPTIONS="--max-old-space-size=4096"

# Habilitar modo de producción de Node.js
export NODE_ENV=production
```

### Opciones de Deployment

#### Opción 1: VPS (Ubuntu/Debian)

**Instalación de dependencias**:

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalación
node --version  # v20.x.x
npm --version   # 10.x.x

# Instalar MySQL Server 8.0
sudo apt install -y mysql-server

# Instalar PM2 (process manager)
sudo npm install -g pm2
```

**Deployment de la aplicación**:

```bash
# Clonar repositorio
git clone <repository-url> /var/www/operaciones-ranger
cd /var/www/operaciones-ranger/backend

# Instalar dependencias de producción
npm ci --only=production

# Compilar TypeScript
npm run build

# Configurar .env
cp .env.example .env
nano .env  # Editar con valores de producción

# Crear bases de datos
mysql -u root -p < ../sistema_turnos_guardianes.sql

# Probar conexión
npm run db:test

# Iniciar con PM2
pm2 start dist/server.js --name "operaciones-ranger-api"

# Configurar PM2 para auto-inicio
pm2 startup
pm2 save

# Ver logs
pm2 logs operaciones-ranger-api
```

**Configuración de PM2** (`ecosystem.config.js`):

```javascript
module.exports = {
  apps: [{
    name: 'operaciones-ranger-api',
    script: './dist/server.js',
    instances: 2,              // 2 procesos (cluster mode)
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

Ejecutar con:

```bash
pm2 start ecosystem.config.js
```

#### Opción 2: Docker

**Dockerfile**:

```dockerfile
# Etapa 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Etapa 2: Production
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

**docker-compose.yml**:

```yaml
version: '3.8'

services:
  api:
    build: .
    container_name: operaciones-ranger-api
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
    env_file:
      - .env
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: mysql:8.0
    container_name: operaciones-ranger-db
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_TURNOS_PASSWORD}
      MYSQL_DATABASE: turnos_guardianes
    volumes:
      - mysql-data:/var/lib/mysql
      - ../sistema_turnos_guardianes.sql:/docker-entrypoint-initdb.d/schema.sql
    ports:
      - "3306:3306"
    restart: unless-stopped

volumes:
  mysql-data:
```

**Ejecutar con Docker**:

```bash
# Build y ejecutar
docker-compose up -d

# Ver logs
docker-compose logs -f api

# Detener
docker-compose down
```

#### Opción 3: Servicios Cloud

**AWS Elastic Beanstalk**:

```bash
# Instalar EB CLI
pip install awsebcli

# Inicializar
eb init

# Crear ambiente
eb create production-env

# Desplegar
eb deploy
```

**Heroku**:

```bash
# Login
heroku login

# Crear app
heroku create operaciones-ranger-api

# Configurar add-ons
heroku addons:create jawsdb:kitefin  # MySQL

# Configurar variables de entorno
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=<secret>

# Desplegar
git push heroku main
```

### Nginx como Reverse Proxy

**Instalación**:

```bash
sudo apt install -y nginx
```

**Configuración** (`/etc/nginx/sites-available/operaciones-ranger`):

```nginx
server {
    listen 80;
    server_name api.turnos.guardianesranger.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Activar configuración**:

```bash
sudo ln -s /etc/nginx/sites-available/operaciones-ranger /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL/TLS con Let's Encrypt

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificado SSL
sudo certbot --nginx -d api.turnos.guardianesranger.com

# Auto-renovación (ya configurada por defecto)
sudo certbot renew --dry-run
```

### Backup de Base de Datos

**Script de backup automático** (`backup-db.sh`):

```bash
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backups/mysql"
DB_NAME="turnos_guardianes"

mkdir -p $BACKUP_DIR

mysqldump -u root -p$DB_PASSWORD $DB_NAME > $BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql

# Mantener solo backups de últimos 7 días
find $BACKUP_DIR -name "${DB_NAME}_*.sql" -mtime +7 -delete

echo "Backup completado: ${DB_NAME}_${TIMESTAMP}.sql"
```

**Programar con cron**:

```bash
# Editar crontab
crontab -e

# Agregar backup diario a las 2 AM
0 2 * * * /path/to/backup-db.sh
```

### Monitoreo y Logs

**PM2 Monitoring**:

```bash
# Ver status
pm2 status

# Ver logs en tiempo real
pm2 logs operaciones-ranger-api

# Monitoreo en tiempo real
pm2 monit
```

**Logs centralizados**:

```bash
# Configurar log rotation
pm2 install pm2-logrotate

# Configurar retención
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

**Alertas de errores** (configurar en Fase 2):

- **Sentry**: Para tracking de errores
- **NewRelic**: Para monitoreo de performance
- **Datadog**: Para métricas y logs

### Checklist de Deployment

- [ ] Compilar código TypeScript (`npm run build`)
- [ ] Configurar variables de entorno de producción
- [ ] Crear bases de datos en servidor de producción
- [ ] Ejecutar schema SQL (`sistema_turnos_guardianes.sql`)
- [ ] Probar conexiones (`npm run db:test`)
- [ ] Configurar PM2 para auto-restart
- [ ] Configurar Nginx como reverse proxy
- [ ] Obtener certificado SSL con Let's Encrypt
- [ ] Configurar backup automático de base de datos
- [ ] Configurar monitoreo de logs y errores
- [ ] Verificar CORS está configurado con origen de producción
- [ ] Verificar que `.env` no está en repositorio (.gitignore)
- [ ] Configurar firewall (permitir solo puertos 80, 443, 22)
- [ ] Ejecutar tests de carga (opcional)
- [ ] Documentar proceso de rollback

---

## Troubleshooting

### Error: Puerto ocupado (EADDRINUSE)

**Problema**: El puerto 3000 ya está en uso.

**Solución**: Cambia el puerto en el archivo `.env`:
```env
PORT=3333
```

### Error: Cannot connect to database

**Problema**: No se puede conectar a MySQL.

**Soluciones**:

1. **Verifica que MySQL esté corriendo**:
   ```bash
   # Windows
   net start MySQL80

   # Conexión manual
   mysql -u root -p
   ```

2. **Verifica las credenciales en `.env`**:
   - `DB_TURNOS_HOST` debe ser `localhost` (o la IP del servidor MySQL)
   - `DB_TURNOS_PORT` debe ser `3306` (puerto por defecto)
   - `DB_TURNOS_USER` y `DB_TURNOS_PASSWORD` deben ser correctos

3. **Verifica que las bases de datos existan**:
   ```bash
   mysql -u root -p -e "SHOW DATABASES LIKE 'turnos%';"
   mysql -u root -p -e "SHOW DATABASES LIKE 'db_aae4a2_ranger';"
   ```

4. **Verifica permisos del usuario**:
   ```sql
   -- Conectar a MySQL
   mysql -u root -p

   -- Ver permisos
   SHOW GRANTS FOR 'root'@'localhost';
   ```

5. **Ejecuta el script de prueba para más detalles**:
   ```bash
   npm run db:test
   ```

   Este script mostrará exactamente qué conexión falla y por qué.

### Error: Variable de entorno no configurada

**Problema**: Error al iniciar: `Variable de entorno DB_TURNOS_PASSWORD no está configurada`.

**Solución**:

1. Verifica que el archivo `.env` existe en la carpeta `backend/`
2. Verifica que la variable está configurada correctamente (sin comillas):
   ```env
   DB_TURNOS_PASSWORD=tu_password_real
   ```
3. No dejes espacios alrededor del `=`
4. Si el password contiene caracteres especiales, puede que necesites escaparlos

### Error: Access denied for user

**Problema**: `Access denied for user 'root'@'localhost' (using password: YES)`

**Solución**:

1. **Password incorrecto**: Verifica el password en `.env`
2. **Usuario no existe**: Crea el usuario en MySQL
3. **Permisos insuficientes**: Otorga permisos al usuario

   ```sql
   -- Crear usuario (si no existe)
   CREATE USER 'root'@'localhost' IDENTIFIED BY 'tu_password';

   -- Otorgar permisos a BD principal
   GRANT ALL PRIVILEGES ON turnos_guardianes.* TO 'root'@'localhost';

   -- Otorgar permisos de solo lectura a BD RRHH
   GRANT SELECT ON db_aae4a2_ranger.* TO 'root'@'localhost';

   -- Aplicar cambios
   FLUSH PRIVILEGES;
   ```

### Base de datos no encontrada

**Problema**: `Unknown database 'turnos_guardianes'`

**Solución**:

1. Crea la base de datos ejecutando el script SQL:
   ```bash
   cd ..
   mysql -u root -p < sistema_turnos_guardianes.sql
   ```

2. Verifica que se creó correctamente:
   ```bash
   mysql -u root -p -e "USE turnos_guardianes; SHOW TABLES;"
   ```

### Error: MODULE_NOT_FOUND

**Problema**: Faltan dependencias.

**Solución**:
```bash
rm -rf node_modules
npm install
```

### Error de TypeScript al compilar

**Problema**: Errores de tipos al ejecutar `npm run build`

**Solución**:
1. Verifica que la versión de TypeScript sea correcta
2. Ejecuta: `npm run lint` para ver errores específicos
3. Revisa la configuración de `tsconfig.json`

### Error: ECONNREFUSED al hacer requests

**Problema**: `connect ECONNREFUSED 127.0.0.1:3000`

**Causas posibles**:

1. **Servidor no está corriendo**:
   ```bash
   # Verificar si el servidor está corriendo
   curl http://localhost:3000/health

   # Iniciar servidor
   npm run dev
   ```

2. **Puerto incorrecto**:
   - Verifica el puerto en `.env`
   - Verifica que estás usando el mismo puerto en tus requests

3. **Firewall bloqueando**:
   ```bash
   # Windows: Agregar excepción en Windows Defender
   # Linux: Verificar iptables
   sudo iptables -L
   ```

### Error: Charset/Encoding incorrecto

**Problema**: Caracteres especiales (ñ, á, é) aparecen como `�` o símbolos extraños

**Solución**:

1. **Verificar charset de BD**:
   ```sql
   SHOW VARIABLES LIKE 'character_set%';
   -- Debe ser utf8mb4 en todas las variables
   ```

2. **Configurar charset en conexión** (ya configurado en `src/config/database.ts`):
   ```typescript
   charset: 'utf8mb4'
   ```

3. **Verificar tablas**:
   ```sql
   SHOW CREATE TABLE turnos;
   -- Debe incluir: DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
   ```

### Error: Timezone incorrecto

**Problema**: Fechas/horas guardadas con timezone incorrecto (ej: UTC en vez de RD)

**Solución**:

1. **Configurar TZ en `.env`**:
   ```env
   TZ=America/Santo_Domingo
   ```

2. **Verificar timezone de MySQL**:
   ```sql
   SELECT @@global.time_zone, @@session.time_zone;
   -- Configurar si es necesario:
   SET GLOBAL time_zone = 'America/Santo_Domingo';
   ```

3. **Reiniciar servidor Node.js** después de cambiar TZ

### Error: Node.js Out of Memory

**Problema**: `FATAL ERROR: JavaScript heap out of memory`

**Solución**:

1. **Incrementar memoria de Node.js**:
   ```bash
   # En desarrollo
   export NODE_OPTIONS="--max-old-space-size=4096"
   npm run dev

   # O configurar en package.json
   {
     "scripts": {
       "dev": "NODE_OPTIONS='--max-old-space-size=4096' nodemon ..."
     }
   }
   ```

2. **Identificar memory leaks**:
   ```bash
   # Usar --inspect para debugging
   node --inspect --max-old-space-size=4096 dist/server.js

   # Conectar Chrome DevTools a chrome://inspect
   ```

### Error: npm install falla

**Problema**: Errores al instalar dependencias

**Soluciones**:

1. **Limpiar cache de npm**:
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Verificar versión de Node.js**:
   ```bash
   node --version
   # Debe ser >= 16.0.0
   # Actualizar con nvm si es necesario:
   nvm install 20
   nvm use 20
   ```

3. **Permisos insuficientes**:
   ```bash
   # Linux/Mac: Evitar usar sudo
   # Configurar npm para usar directorio de usuario
   mkdir ~/.npm-global
   npm config set prefix '~/.npm-global'
   echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.profile
   source ~/.profile
   ```

### Error: Path aliases no resuelven

**Problema**: TypeScript no encuentra imports con `@config/*`, `@models/*`, etc.

**Solución**:

1. **Verificar tsconfig.json**:
   ```json
   {
     "compilerOptions": {
       "baseUrl": "./src",
       "paths": {
         "@config/*": ["config/*"],
         "@models/*": ["models/*"],
         // ...
       }
     }
   }
   ```

2. **Reiniciar TypeScript server** (VS Code):
   - Ctrl+Shift+P → "TypeScript: Restart TS Server"

3. **Recompilar**:
   ```bash
   rm -rf dist/
   npm run build
   ```

### Performance: Queries lentas

**Problema**: Queries toman mucho tiempo (> 1 segundo)

**Soluciones**:

1. **Usar EXPLAIN para analizar query**:
   ```sql
   EXPLAIN SELECT * FROM turnos WHERE empleado_id = 1001;
   -- Verificar que use índices (key column no debe ser NULL)
   ```

2. **Agregar índices faltantes**:
   ```sql
   -- Ejemplo: índice para búsquedas por fecha
   CREATE INDEX idx_turnos_fecha ON turnos(fecha);
   ```

3. **Usar procedimientos almacenados**:
   - Para operaciones complejas, usar `sp_*` procedures (ya implementados)

4. **Incrementar connection pool**:
   ```typescript
   // En src/config/database.ts
   connectionLimit: 20  // Incrementar de 10 a 20
   ```

5. **Optimizar MySQL**:
   ```sql
   -- Incrementar buffer pool size (50-70% de RAM disponible)
   SET GLOBAL innodb_buffer_pool_size = 2147483648;  -- 2GB
   ```

### Error: CORS bloqueado por navegador

**Problema**: `Access to XMLHttpRequest at 'http://localhost:3000' from origin 'http://localhost:4200' has been blocked by CORS policy`

**Solución**:

1. **Verificar CORS_ORIGIN en `.env`**:
   ```env
   CORS_ORIGIN=http://localhost:4200
   ```

2. **Múltiples orígenes**:
   ```env
   CORS_ORIGIN=http://localhost:4200,http://localhost:4201
   ```

3. **Verificar configuración de CORS** (ya configurado en `src/server.ts`):
   ```typescript
   app.use(cors({
     origin: process.env.CORS_ORIGIN,
     credentials: true
   }));
   ```

### Troubleshooting con db:test

El script `npm run db:test` es tu herramienta principal para diagnosticar problemas de conexión:

```bash
npm run db:test
```

**Salidas posibles**:

- **Éxito**: Muestra información de ambas BDs
- **Error de conexión**: Indica problema con credenciales o MySQL no corriendo
- **Error de BD no encontrada**: Indica que falta ejecutar schema SQL
- **Error de permisos**: Indica que usuario no tiene acceso a BD

### FAQs

**P: ¿Puedo usar MySQL 5.7 en vez de 8.0?**
R: Técnicamente sí, pero MySQL 8.0 es recomendado. MySQL 5.7 no soporta algunas features del schema (ej: `GENERATED ALWAYS AS`). Si usas 5.7, deberás modificar el schema SQL.

**P: ¿Funciona con MariaDB?**
R: Sí, MariaDB 10.3+ debería funcionar. Verifica compatibilidad de stored procedures y triggers.

**P: ¿Cómo debuggeo queries SQL?**
R: Configura `LOG_SQL_QUERIES=true` en `.env` (feature pendiente en Fase 2). Mientras tanto, usa MySQL slow query log o `SHOW PROCESSLIST`.

**P: ¿Cuántas conexiones simultáneas soporta?**
R: Por defecto 10 para BD principal, 5 para BD RRHH. Ajustar según carga (ver [Configuración Avanzada](#configuración-avanzada)).

**P: ¿Cómo escalo horizontalmente?**
R: Usar PM2 cluster mode (ver [Deployment](#deployment)). Para más de 1 servidor, considerar load balancer (Nginx, HAProxy).

**P: ¿Puedo usar ORM (Sequelize, TypeORM)?**
R: El proyecto usa mysql2 directamente para mejor control. Agregar ORM sería refactor significativo (no recomendado en Fase 1).

**P: ¿Cómo actualizo a nueva versión de Node.js?**
R: Usar nvm: `nvm install 20 && nvm use 20 && npm rebuild`. Verificar compatibilidad antes de actualizar en producción.

---

## Scripts disponibles

### Scripts principales

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Ejecuta el servidor en modo desarrollo con hot-reload |
| `npm run build` | Compila TypeScript a JavaScript en `dist/` |
| `npm start` | Ejecuta el servidor en modo producción |
| `npm test` | Ejecuta los tests (por implementar) |
| `npm run lint` | Ejecuta ESLint para verificar código |
| `npm run format` | Formatea el código con Prettier |

### Scripts de base de datos

| Comando | Descripción |
|---------|-------------|
| `npm run db:test` | Prueba las conexiones a ambas bases de datos |

**Script `db:test`**: Valida que las conexiones a BD funcionan correctamente. Útil para:
- Verificar credenciales después de configurar `.env`
- Debugging de problemas de conexión
- Verificar que las bases de datos existen
- Validar permisos del usuario MySQL

```bash
# Ejemplo de uso
npm run db:test

# Salida esperada:
# ✓ Conexión a BD principal exitosa
# ✓ Conexión a BD RRHH exitosa
```

---

## Mejores Prácticas

### Manejo de Errores

**Estructura de respuestas de error**:

```typescript
// Error HTTP estándar
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Horas extras exceden el máximo permitido",
    "details": {
      "field": "horas_extras",
      "value": 5,
      "max": 4
    },
    "timestamp": "2026-01-17T21:00:00.000Z"
  }
}
```

**Captura de errores en controladores**:

```typescript
// Patrón recomendado
export const crearTurno = async (req: Request, res: Response) => {
  try {
    const turno = await turnoService.crear(req.body);
    res.status(201).json({ turno });
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.toJSON() });
    } else if (error instanceof DatabaseError) {
      res.status(500).json({ error: 'Error de base de datos' });
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};
```

### Logging Efectivo

**Niveles de log**:

- `error`: Errores críticos que requieren atención inmediata
- `warn`: Advertencias que deben monitorearse
- `info`: Información general de operaciones (recomendado para producción)
- `debug`: Información detallada para debugging (solo desarrollo)

**Qué loggear**:

```typescript
// SÍ: Loggear operaciones importantes
logger.info('Turno creado', { turno_id: 123, empleado_id: 1001 });

// SÍ: Loggear errores con contexto
logger.error('Error al crear turno', { error: err.message, data: req.body });

// NO: Loggear información sensible
logger.info('Login', { password: '...' });  // NUNCA

// NO: Loggear en cada línea de código
logger.debug('Variable x:', x);
logger.debug('Entrando a función');
```

### Seguridad

**Prevención de SQL Injection**:

```typescript
// SEGURO: Prepared statements (siempre usar)
const [rows] = await pool.execute(
  'SELECT * FROM turnos WHERE empleado_id = ?',
  [empleado_id]
);

// INSEGURO: String concatenation (NUNCA HACER)
const query = `SELECT * FROM turnos WHERE empleado_id = ${empleado_id}`;
await pool.execute(query);
```

**Validación de entrada**:

```typescript
// Validar TODOS los inputs del usuario
import { body, validationResult } from 'express-validator';

const validarTurno = [
  body('empleado_id').isInt({ min: 1 }),
  body('puesto_id').isInt({ min: 1 }),
  body('fecha').isISO8601(),
  body('horas_normales').isFloat({ min: 0, max: 12 }),
  body('horas_extras').isFloat({ min: 0, max: 4 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

app.post('/api/turnos', validarTurno, crearTurno);
```

**Sanitización de datos**:

```typescript
// Escapar HTML en respuestas
import xss from 'xss';

const comentarioSeguro = xss(req.body.comentario);
```

**Secrets management**:

```typescript
// SÍ: Variables de entorno
const jwtSecret = process.env.JWT_SECRET;

// NO: Hardcodear secrets
const jwtSecret = 'my-secret-key-123';  // NUNCA
```

### Performance

**Optimización de queries**:

```typescript
// SÍ: Usar procedimientos almacenados para operaciones complejas
await pool.execute('CALL sp_registrar_turno(?, ?, ?, ?, ?, ?, ?, ?)', params);

// NO: Múltiples queries separadas
await pool.execute('INSERT INTO turnos ...');
await pool.execute('UPDATE turnos SET es_feriado ...');
await pool.execute('UPDATE turnos SET tipo_turno ...');
```

**Paginación**:

```typescript
// SÍ: Implementar paginación para listas largas
const limit = parseInt(req.query.limit) || 20;
const offset = parseInt(req.query.offset) || 0;

const [turnos] = await pool.execute(
  'SELECT * FROM turnos ORDER BY fecha DESC LIMIT ? OFFSET ?',
  [limit, offset]
);
```

**Caching** (implementar en Fase 2):

```typescript
// Cachear datos que no cambian frecuentemente
import NodeCache from 'node-cache';
const cache = new NodeCache({ stdTTL: 600 }); // 10 minutos

const getFeriados = async (year: number) => {
  const cacheKey = `feriados-${year}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const [rows] = await pool.execute('SELECT * FROM feriados WHERE YEAR(fecha) = ?', [year]);
  cache.set(cacheKey, rows);
  return rows;
};
```

### Code Review Checklist

Antes de crear Pull Request, verificar:

- [ ] Código compila sin errores (`npm run build`)
- [ ] Linter pasa sin warnings (`npm run lint`)
- [ ] Código formateado con Prettier (`npm run format`)
- [ ] Tests pasan (cuando se implementen)
- [ ] No hay console.log olvidados
- [ ] No hay código comentado innecesariamente
- [ ] Variables de entorno agregadas a `.env.example`
- [ ] Funciones documentadas con JSDoc si son complejas
- [ ] Manejo de errores implementado en todos los endpoints
- [ ] Validación de inputs implementada
- [ ] No hay secrets hardcodeados
- [ ] Queries usan prepared statements
- [ ] README actualizado si hay cambios relevantes
- [ ] Commits siguen convención (Conventional Commits)

---

## API Documentation

### 📚 Documentación Interactiva con Swagger/OpenAPI

El sistema cuenta con documentación interactiva completa de todos los endpoints usando **Swagger UI** con especificación **OpenAPI 3.0**.

**Acceder a la documentación**:

```
http://localhost:3000/api-docs
```

**Características de la documentación**:

- ✅ **60+ endpoints documentados** completamente
- ✅ Todos los **schemas** de request/response definidos
- ✅ **Códigos de respuesta HTTP** documentados (200, 400, 401, 403, 404, 500)
- ✅ **Autenticación JWT** integrada - probar endpoints directamente desde la UI
- ✅ **Ejemplos de requests** para cada endpoint
- ✅ Organizado por **tags** (Auth, Usuarios, Clientes, Ubicaciones, Puestos, Feriados, Configuración Turnos, Incentivos, RRHH, Turnos, Reportes)
- ✅ **Schemas reutilizables** para reducir duplicación

**Cómo usar Swagger UI**:

1. Iniciar el servidor: `npm run dev`
2. Abrir en navegador: `http://localhost:3000/api-docs`
3. Para endpoints protegidos:
   - Click en el botón **"Authorize"** (arriba a la derecha)
   - Hacer login en `/api/auth/login` para obtener un token
   - Copiar el `accessToken` de la respuesta
   - Pegar en el campo "Value" del modal de autorización (con prefijo `Bearer`)
   - Click en **"Authorize"**
   - Ahora puedes probar endpoints protegidos directamente desde la UI

**Ejemplo de autenticación**:

```
1. POST /api/auth/login con body:
   {
     "username": "admin",
     "password": "Admin123!"
   }

2. Copiar accessToken de la respuesta:
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

3. Click en "Authorize" y pegar en formato:
   Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

4. Ahora todos los endpoints protegidos están disponibles
```

**Ventajas de Swagger UI**:

- 🔍 Explorar todos los endpoints sin leer código
- 🧪 Probar requests sin Postman ni herramientas externas
- 📖 Ver ejemplos de requests y responses
- 🔐 Autenticar y probar endpoints protegidos en segundos
- 📝 Validar schemas de datos antes de implementar frontend
- 🚀 Ideal para onboarding de nuevos desarrolladores

---

### Formato de Endpoints

**Estructura general**:

```
[MÉTODO] /api/[recurso]/[id]
```

**Métodos HTTP**:

- `GET`: Obtener recursos (listar, detalle)
- `POST`: Crear nuevo recurso
- `PUT`: Actualizar recurso completo
- `PATCH`: Actualizar parcialmente recurso
- `DELETE`: Eliminar recurso

### Endpoints Planificados (Fase 2)

#### Clientes

```
GET    /api/clientes          Listar clientes
GET    /api/clientes/:id      Obtener cliente por ID
POST   /api/clientes          Crear nuevo cliente
PUT    /api/clientes/:id      Actualizar cliente
DELETE /api/clientes/:id      Eliminar cliente
```

#### Ubicaciones

```
GET    /api/ubicaciones              Listar ubicaciones
GET    /api/ubicaciones/:id          Obtener ubicación por ID
GET    /api/clientes/:id/ubicaciones Listar ubicaciones de un cliente
POST   /api/ubicaciones              Crear nueva ubicación
PUT    /api/ubicaciones/:id          Actualizar ubicación
DELETE /api/ubicaciones/:id          Eliminar ubicación
```

#### Puestos

```
GET    /api/puestos                     Listar puestos
GET    /api/puestos/:id                 Obtener puesto por ID
GET    /api/ubicaciones/:id/puestos     Listar puestos de una ubicación
POST   /api/puestos                     Crear nuevo puesto
PUT    /api/puestos/:id                 Actualizar puesto
DELETE /api/puestos/:id                 Eliminar puesto
```

#### Turnos

```
GET    /api/turnos                      Listar turnos (con paginación)
GET    /api/turnos/:id                  Obtener turno por ID
GET    /api/empleados/:id/turnos        Listar turnos de un empleado
POST   /api/turnos                      Registrar nuevo turno
PUT    /api/turnos/:id                  Actualizar turno (solo si no procesado)
DELETE /api/turnos/:id                  Eliminar turno (solo si no procesado)
```

#### Reportes

```
POST   /api/reportes/nomina             Generar reporte quincenal CSV
GET    /api/reportes/resumen            Resumen de horas por período
GET    /api/reportes/empleado/:id       Reporte individual de empleado
```

#### Incentivos

```
GET    /api/incentivos                  Listar incentivos
GET    /api/puestos/:id/incentivos      Listar incentivos de un puesto
POST   /api/incentivos                  Crear nuevo incentivo
PUT    /api/incentivos/:id              Actualizar incentivo
DELETE /api/incentivos/:id              Eliminar incentivo
```

#### Empleados (RRHH)

```
GET    /api/empleados                   Listar guardianes activos
GET    /api/empleados/:id               Obtener guardián por ID
```

**Nota**: Endpoints de empleados son read-only (BD RRHH es solo lectura).

### Ejemplo de Request/Response

**POST /api/turnos**:

```http
POST /api/turnos
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "empleado_id": 1001,
  "puesto_id": 42,
  "fecha": "2026-01-20",
  "hora_entrada": "06:00:00",
  "hora_salida": "16:00:00",
  "horas_normales": 10,
  "horas_extras": 0
}
```

**Response 201 Created**:

```json
{
  "turno": {
    "id": 5678,
    "empleado_id": 1001,
    "puesto_id": 42,
    "fecha": "2026-01-20",
    "hora_entrada": "06:00:00",
    "hora_salida": "16:00:00",
    "horas_normales": 10,
    "horas_extras": 0,
    "tipo_turno": "DIURNO",
    "es_feriado": false,
    "created_at": "2026-01-17T21:00:00.000Z"
  }
}
```

**Response 400 Bad Request**:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Horas extras exceden el máximo permitido",
    "details": {
      "field": "horas_extras",
      "max": 4,
      "provided": 5
    }
  }
}
```

### Autenticación (Fase 2)

Todos los endpoints (excepto `/health` y `/`) requerirán autenticación JWT.

**Header requerido**:

```
Authorization: Bearer <jwt-token>
```

**Obtener token**:

```http
POST /api/auth/login
Content-Type: application/json

{
  "usuario": "admin",
  "password": "secreto"
}
```

**Response**:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": "24h",
  "usuario": {
    "id": 1,
    "usuario": "admin",
    "rol": "ADMIN"
  }
}
```

### Swagger/OpenAPI (Futuro)

La documentación interactiva estará disponible en:

```
GET /api-docs
```

Usar **Swagger UI** para explorar y probar endpoints.

---

## Roadmap

### Fase 1: Fundación del Proyecto (ACTUAL) - 100% Completada

- [x] Decisiones arquitectónicas (Node.js + TypeScript + Express)
- [x] Diseño de base de datos (dual connection strategy)
- [x] Setup de proyecto backend
- [x] Configuración de TypeScript, ESLint, Prettier
- [x] Conexión a bases de datos (turnos + RRHH)
- [x] Scripts de utilidades (db:init, db:test, db:seed, db:examples, db:reset)
- [x] Variables de entorno y validación
- [x] Documentación completa (README, CLAUDE.md, Metodología)

**Duración**: 3 semanas
**Tareas completadas**: 11/11

---

### Fase 2: Backend Core - Próxima Fase

**Objetivos**: Implementar endpoints REST y lógica de negocio

**Tareas principales**:

- [ ] **Autenticación y autorización**:
  - Implementar JWT (JSON Web Tokens)
  - Middleware de autenticación
  - Sistema de roles (ADMIN, SUPERVISOR, CONSULTA)
  - Endpoints de login/logout

- [ ] **CRUD de maestros**:
  - Endpoints de clientes
  - Endpoints de ubicaciones
  - Endpoints de puestos
  - Endpoints de incentivos

- [ ] **Gestión de turnos**:
  - Endpoint para registrar turno (POST /api/turnos)
  - Endpoint para listar turnos con paginación
  - Endpoint para actualizar turno (validar que no esté procesado)
  - Endpoint para eliminar turno (validar que no esté procesado)
  - Integración con procedimiento almacenado `sp_registrar_turno`

- [ ] **Reportes**:
  - Endpoint para generar reporte quincenal CSV
  - Endpoint para resumen de horas por empleado
  - Endpoint para estadísticas generales

- [ ] **Integración con BD RRHH**:
  - Endpoint para listar guardianes activos
  - Endpoint para obtener guardián por ID
  - Validación de empleados antes de crear turnos

- [ ] **Validaciones y manejo de errores**:
  - Validación de inputs con express-validator
  - Manejo centralizado de errores
  - Logs estructurados con winston/pino

- [ ] **Testing**:
  - Tests unitarios de servicios
  - Tests de integración de API
  - Setup de Jest y Supertest
  - Coverage mínimo 80%

**Duración estimada**: 4-6 semanas
**Tareas estimadas**: 25-30

---

### Fase 3: Frontend - Angular

**Objetivos**: Interfaz de usuario para el sistema de turnos

**Tareas principales**:

- [ ] Setup de proyecto Angular 20
- [ ] Configuración de Angular Material
- [ ] Módulo de autenticación (login, guards)
- [ ] Módulo de maestros (clientes, ubicaciones, puestos)
- [ ] Módulo de turnos (calendario, registro, edición)
- [ ] Módulo de incentivos (asignación, cálculo)
- [ ] Módulo de reportes (generación CSV, visualización)
- [ ] Módulo de empleados (consulta, búsqueda)
- [ ] Dashboard con estadísticas
- [ ] Diseño responsive (mobile-friendly)

**Duración estimada**: 6-8 semanas
**Tareas estimadas**: 30-40

---

### Fase 4: Integración y Testing

**Objetivos**: Integración completa y testing end-to-end

**Tareas principales**:

- [ ] Integración frontend ↔ backend
- [ ] Tests end-to-end con Cypress
- [ ] Validación de flujo completo (registro turno → reporte → nómina)
- [ ] Testing de seguridad (penetration testing)
- [ ] Optimización de performance (caching, CDN)
- [ ] User Acceptance Testing (UAT)
- [ ] Deployment a producción
- [ ] Capacitación de usuarios
- [ ] Documentación de usuario final

**Duración estimada**: 3-4 semanas
**Tareas estimadas**: 15-20

---

### Features Futuras (Post-MVP)

- [ ] Notificaciones por email/SMS
- [ ] Exportación de reportes a PDF
- [ ] Integración directa con sistema de nómina (API)
- [ ] Aplicación móvil para guardianes (registro de entrada/salida)
- [ ] Dashboard analítico con gráficas
- [ ] Geolocalización de turnos
- [ ] Sistema de alertas (turnos no cubiertos, conflictos)
- [ ] Historial de cambios (auditoría completa)
- [ ] Multi-tenancy (múltiples empresas)
- [ ] API pública para integraciones

---

## Contribución

### Git Workflow

El proyecto usa **Git Flow** simplificado:

**Branches principales**:

- `main`: Código en producción (estable)
- `develop`: Código en desarrollo (integración)

**Branches de feature/bugfix**:

```bash
# Crear branch de feature desde develop
git checkout develop
git pull origin develop
git checkout -b feature/T002-endpoint-turnos

# Desarrollar feature...
git add .
git commit -m "feat(turnos): agregar endpoint POST /api/turnos"

# Actualizar con develop antes de PR
git checkout develop
git pull origin develop
git checkout feature/T002-endpoint-turnos
git merge develop

# Push y crear Pull Request
git push origin feature/T002-endpoint-turnos
```

**Tipos de branches**:

- `feature/`: Nuevas funcionalidades
- `bugfix/`: Corrección de bugs
- `hotfix/`: Correcciones urgentes en producción
- `docs/`: Cambios solo en documentación
- `refactor/`: Refactorización de código

**Naming convention**:

```
[tipo]/[id-tarea]-[descripcion-breve]

Ejemplos:
feature/T012-autenticacion-jwt
bugfix/T025-corregir-validacion-horas
hotfix/cors-produccion
docs/actualizar-readme
refactor/database-connection
```

### Estilo de Código

- **Indentación**: 2 espacios
- **Comillas**: Simples (`'`)
- **Punto y coma**: Siempre
- **Ancho máximo**: 100 caracteres
- **Naming**:
  - Variables/funciones: `camelCase`
  - Clases/interfaces: `PascalCase`
  - Constantes: `UPPER_SNAKE_CASE`
  - Archivos: `kebab-case.ts`

**Configuración automática**:

El proyecto usa ESLint y Prettier para mantener consistencia.

```bash
# Formatear código antes de commit
npm run format

# Verificar linting
npm run lint

# Auto-fix de linting
npm run lint -- --fix
```

### Commits (Conventional Commits)

**Formato**:

```
tipo(alcance): descripción breve en minúsculas

[Descripción detallada opcional]

[Footer opcional: Breaking changes, issues cerrados]
```

**Tipos**:

- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Cambios en documentación
- `style`: Cambios de formato (no afectan el código)
- `refactor`: Refactorización (no es feat ni fix)
- `test`: Agregar o modificar tests
- `chore`: Cambios en build, configuración, etc.
- `perf`: Mejoras de performance

**Ejemplos**:

```bash
# Feature
git commit -m "feat(turnos): agregar endpoint POST /api/turnos"

# Bug fix
git commit -m "fix(database): corregir leak de conexiones en pool"

# Documentation
git commit -m "docs(readme): agregar sección de deployment"

# Breaking change
git commit -m "feat(api): cambiar formato de respuesta de turnos

BREAKING CHANGE: Response de /api/turnos ahora retorna { turnos: [...] } en vez de array directo"

# Cerrar issue
git commit -m "fix(auth): corregir expiración de token JWT

Closes #123"
```

### Pull Request Template

Cuando crees un PR, incluir:

```markdown
## Descripción
[Descripción clara de los cambios]

## Tipo de cambio
- [ ] Bug fix
- [ ] Nueva feature
- [ ] Breaking change
- [ ] Documentación

## Checklist
- [ ] Código compila (`npm run build`)
- [ ] Linter pasa (`npm run lint`)
- [ ] Tests pasan (`npm test`)
- [ ] Documentación actualizada
- [ ] Variables de entorno agregadas a .env.example
- [ ] Code review checklist completado

## Testing
[Descripción de tests ejecutados]

## Screenshots (si aplica)
[Capturas de pantalla]

## Issues relacionados
Closes #123
```

### Code Review Process

1. **Self-review**: Revisar tu propio código antes de crear PR
2. **Create PR**: Asignar a reviewer(s)
3. **Review**: Reviewer comenta cambios sugeridos
4. **Address comments**: Autor implementa cambios
5. **Approval**: Reviewer aprueba PR
6. **Merge**: Merge a `develop` (squash commits si hay muchos)

**Criterios de aprobación**:

- Código cumple estándares de estilo
- Tests pasan
- No hay código duplicado
- Funciones tienen JSDoc si son complejas
- Sin console.log olvidados
- Sin secrets hardcodeados

---

## Referencias

- **Documentación del proyecto**: Ver archivo `CLAUDE.md` en la raíz del repositorio
- **Metodología de desarrollo**: Ver archivo `Metodologia.md`
- **Especificaciones del sistema**: Ver archivo `especificaciones_sistema_turnos.md`
- **Diagrama ER**: Ver archivo `diagrama_er_turnos.md`
- **Schema de base de datos**: Ver archivo `sistema_turnos_guardianes.sql`

## Arquitectura de Base de Datos

El sistema utiliza **dos bases de datos MySQL**:

### 1. Base de Datos Principal (turnos_guardianes)

**Propósito**: Almacenar toda la información del sistema de turnos.

**Permisos**: Lectura y Escritura (SELECT, INSERT, UPDATE, DELETE, EXECUTE)

**Tablas principales**:
- `configuracion_turnos`: Configuración de rangos horarios (diurno/nocturno)
- `clientes`: Empresas que contratan servicios de seguridad
- `ubicaciones`: Lugares físicos donde se presta el servicio
- `puestos`: Puntos de vigilancia específicos dentro de cada ubicación
- `feriados`: Días feriados nacionales y por decreto
- `turnos`: **Tabla principal** - Registro diario de turnos de guardianes
- `incentivos_puesto`: Incentivos por puesto y período quincenal

**Características**:
- Utiliza procedimientos almacenados para operaciones complejas
- Triggers para validación de horas máximas
- Vistas para reportes optimizados
- Charset: utf8mb4 (soporte completo Unicode)

### 2. Base de Datos RRHH (db_aae4a2_ranger)

**Propósito**: Consultar información de empleados desde el sistema de nómina existente.

**Permisos**: Solo Lectura (SELECT únicamente)

**Tabla utilizada**:
- `rh_empleado`: Información de empleados del sistema de nómina
  - Filtro de guardianes: `WHERE id_puesto = 97 AND status = 1`

**Integración**:
- No se modifica desde el sistema de turnos
- Proporciona datos de empleados (nombres, cédula, status)
- Validación de empleados activos al registrar turnos

### Estrategia de Conexión

**Connection Pooling**: Se utilizan pools de conexión para optimizar el rendimiento:

- **BD Principal**: Pool con hasta 10 conexiones simultáneas (alta carga)
- **BD RRHH**: Pool con hasta 5 conexiones simultáneas (solo lectura, carga baja)

**Configuración**:
- Timeout de conexión: 10 segundos
- Keep-alive habilitado para mantener conexiones vivas
- Charset: utf8mb4
- Timezone: UTC

**Singleton Pattern**: Los pools se crean una sola vez y se reutilizan durante toda la ejecución del servidor.

## Estado del Proyecto

**Fase actual**: Fase 1 - Fundación del Proyecto **[100% COMPLETADA]**

### Tareas Completadas (11/11)

**Fase 1A: Decisiones Arquitectónicas**:
- [x] T001 - Decidir stack tecnológico (Node.js + TypeScript + Express.js)
- [x] T002 - Investigar tabla de empleados en sistema RRHH
- [x] T011 - Crear ADR para decisión de autenticación (JWT)

**Fase 1B: Setup de Base de Datos**:
- [x] T003 - Crear base de datos MySQL para turnos
- [x] T004 - Cargar datos iniciales (feriados y configuración)
- [x] T005 - Validar procedimientos almacenados y triggers

**Fase 1C: Setup de Proyecto Backend**:
- [x] T006 - Crear estructura de proyecto backend
- [x] T007 - Configurar conexión a base de datos (dual connection)
- [x] T008 - Crear scripts de inicialización y pruebas de DB

**Fase 1D: Configuración y Documentación**:
- [x] T009 - Configurar variables de entorno y .env.example
- [x] T010 - Crear README.md del proyecto con guía de instalación

### Progreso por Fase

| Fase | Tareas | Completadas | Progreso |
|------|--------|-------------|----------|
| Fase 1: Fundación | 11 | 11 | 100% ✅ |
| Fase 2: Backend Core | 25-30 | 0 | 0% |
| Fase 3: Frontend | 30-40 | 0 | 0% |
| Fase 4: Integración | 15-20 | 0 | 0% |

### Próxima Fase

**Fase 2: Backend Core** (inicio proyectado: próxima semana)

Objetivos principales:
- Implementar autenticación JWT
- Desarrollar endpoints REST CRUD
- Crear lógica de negocio
- Implementar tests
- Documentar API con Swagger

Ver sección [Roadmap](#roadmap) para detalles completos.

### Métricas del Proyecto

- **Tiempo invertido Fase 1**: ~23 horas (estimado: 30-40 horas)
- **Eficiencia**: 8% más rápido de lo estimado
- **Líneas de código backend**: ~1,500 (config, scripts, estructura)
- **Líneas de documentación**: ~2,500 (README, CLAUDE.md, plans, completed)
- **Cobertura de tests**: 0% (tests planificados para Fase 2 y 4)

---

## Licencia y Contacto

### Licencia

Este proyecto está licenciado bajo la **Licencia ISC** (ISC License).

```
Copyright (c) 2026, Guardianes Ranger

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

### Autores y Contribuyentes

**Organización**: Guardianes Ranger, República Dominicana

**Equipo de Desarrollo**:
- Claude Sonnet 4.5 (AI Assistant) - Desarrollo coordinado del sistema

**Metodología de Desarrollo**: Agentes coordinados (ver `Metodologia.md`)

### Contacto y Soporte

**Issues y Bug Reports**:
- Crear issue en el repositorio de GitHub
- Incluir pasos para reproducir
- Adjuntar logs relevantes
- Especificar entorno (OS, versiones de Node.js/MySQL)

**Preguntas y Discusiones**:
- Usar GitHub Discussions para preguntas generales
- Consultar documentación en `CLAUDE.md` y `README.md`
- Revisar sección [Troubleshooting](#troubleshooting) primero

**Contribuciones**:
- Leer sección [Contribución](#contribución) antes de contribuir
- Seguir Git workflow y convenciones de commits
- Crear Pull Request con descripción detallada
- Esperar code review antes de merge

**Contacto Directo**:
- Email: (Pendiente de configurar)
- Sitio web: (Pendiente de publicar)

### Agradecimientos

- **Anthropic** por Claude Sonnet 4.5, el AI assistant que desarrolló este sistema
- **Comunidad de código abierto** por las librerías utilizadas (Node.js, Express, MySQL2, TypeScript)
- **Guardianes Ranger** por la oportunidad de desarrollar esta solución

---

**Última actualización**: 2026-01-17
**Versión del README**: 2.0 (Fase 1 completada - Expandido y mejorado)
**Líneas de documentación**: ~2,600 líneas (vs ~550 líneas iniciales)
**Próxima revisión**: Al completar Fase 2 (Backend Core)
