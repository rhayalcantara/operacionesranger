# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**OperacionesRanger - Sistema de Gestión de Turnos** is a shift management system for security guards (guardianes de seguridad) for Guardianes Ranger in the Dominican Republic. The system tracks daily shifts, calculates work hours (normal/overtime, day/night), identifies holidays, and generates biweekly reports for payroll integration.

**Current Status**: Phase 3 Frontend Base COMPLETED (100% complete, 17/17 tasks). Full Angular frontend with authentication, master data CRUDs, shift management, and CSV reporting. Backend also 100% complete (28/28 tasks).

**Technology Stack**:
- **Backend**: Node.js 16+ + TypeScript 5.3 + Express.js 4.18 (COMPLETED)
- **Frontend**: Angular 21 + Angular Material (COMPLETED)
- **Database**: MySQL 8.0 (schema deployed and operational)
- **Testing**: Jest + Supertest (~95% coverage on core services)

## Development Commands

### Backend (`backend/`)

```bash
# Start development server
npm run dev                    # Runs on port 3000 (or PORT from .env)

# Build TypeScript to JavaScript
npm run build                  # Compiles to dist/

# Run tests
npm test                       # Jest test suite
npm run test:watch             # Jest in watch mode
npm run test:coverage          # Generate coverage report

# Database utilities
npm run db:test                # Test database connections
npm run db:init                # Initialize database from Node.js
npm run db:seed                # Load holiday data (accepts year)
npm run db:examples            # Run example queries
npm run db:reset               # Reset test data (dev only)

# Code quality
npm run lint                   # ESLint check
npm run format                 # Prettier format
```

### Database Setup Commands

```bash
# Connect to MySQL (Windows)
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p

# Create database and load schema
mysql -u root -p < sistema_turnos_guardianes.sql

# Verify installation
mysql -u root -p -e "USE turnos_guardianes; SHOW TABLES;"
```

### Database Structure

The system uses a hierarchical structure:

```
CLIENTE (Client Company)
  └── UBICACIÓN (Physical Location)
        └── PUESTO (Guard Post/Station)
              ├── TURNO (Shift Record)
              └── INCENTIVO_PUESTO (Post Incentive)
```

**Key Tables**:
- `configuracion_turnos`: Day/night shift time ranges (configurable, default: 06:00-18:00 day, 18:00-06:00 night)
- `clientes`: Companies contracting security services
- `ubicaciones`: Physical locations where service is provided
- `puestos`: Specific posts/stations requiring guards
- `feriados`: National and decree holidays (types: NACIONAL, DECRETO)
- `turnos`: **Main table** - daily shift records per guard with auto-calculated fields
- `incentivos_puesto`: Incentive amounts per post per biweekly period

**Important**: The `turnos` table references an external `rh_empleado` table from the HR/Payroll system (`db_aae4a2_ranger` database).

### Stored Procedures

- `sp_registrar_turno`: Register a shift with auto-validation and calculations
- `sp_generar_reporte_nomina`: Generate CSV report for payroll system
- `sp_verificar_feriado`: Check if a date is a holiday
- `sp_determinar_tipo_turno`: Determine shift type (DAY/NIGHT) based on entry time

### Triggers

- `trg_turnos_before_insert`: Validates shift hours (max 12 normal + 4 extra = 16 total)

## Business Rules

### Shift Hours
- **Normal hours**: Up to 10 hours per shift
- **Overtime hours**: Up to 2 hours per shift
- **Absolute maximum**: 16 hours per shift (validated by trigger)

### Shift Classification
Automatically determined by entry time:
- **DIURNO (Day)**: Entry time 06:00-18:00 (configurable in `configuracion_turnos`)
- **NOCTURNO (Night)**: Entry time 18:00-06:00 (configurable in `configuracion_turnos`)

### Holidays
- **NACIONAL**: Annual recurring holidays (New Year, Independence Day, etc.)
- **DECRETO**: Special holidays by presidential decree
- **Note**: Sundays are normal days UNLESS explicitly marked in the `feriados` table

### Incentives
- Assigned per **post** and **biweekly period** (quincena)
- Calculation: `monto / 360 hours` (15 days × 24 hours) = hourly rate
- Each guard receives proportional incentive for hours worked at that post
- The `valor_hora` field is auto-calculated as a GENERATED column

## Integration with HR/Payroll System

### Employee Table Reference

The system integrates with an existing HR/Payroll database:

**Database**: `db_aae4a2_ranger`
**Table**: `rh_empleado`
**Connection**: Read-only access via foreign key `turnos.empleado_id`

**Required fields from HR system**:
- `id_empleado` (INT) - Primary key, referenced in `turnos` table
- `cedula_empleado` (VARCHAR) - National ID
- `nombres` + `apellidos` (VARCHAR) - Employee name
- `status` (TINYINT) - Active status (1 = active, 0 = inactive)
- `id_puesto` (INT) - Job position ID (97 = "VIGILANTE DE SEGURIDAD")

**Security Guards Filter**: `WHERE id_puesto = 97 AND status = 1`

### Payroll CSV Export Format

Generated by `sp_generar_reporte_nomina(fecha_inicio, fecha_fin)`:

```csv
fecha,empleado_id,puesto_codigo,horas_normales,horas_extras,tipo_turno,es_feriado,tipo_feriado,incentivo
2026-01-02,1001,P001,10.00,2.00,DIURNO,NO,N/A,120.00
2026-01-21,1001,P002,8.00,2.00,DIURNO,SI,NACIONAL,0.00
```

**Integration Workflow**:
1. Supervisor selects date range (biweekly period: quincena)
2. System executes `sp_generar_reporte_nomina(start_date, end_date)`
3. Export to CSV: `nomina_YYYYMMDD_YYYYMMDD.csv`
4. Payroll system processes CSV and assigns `nomina_id`
5. Update processed shifts: `procesado_nomina = TRUE`

## Development Methodology

This project follows a **coordinated agent-based development methodology** documented in `Metodologia.md`.

### Key Concepts

**Two Agent Types**:
1. **Coordinator Agent** (Main Claude): Orchestrates tasks, delegates to subagents, tracks progress
2. **Subagent**: Executes specific tasks autonomously (planning → execution → documentation)

### Directory Structure

```
OperacionesRanger/
├── CLAUDE.md                    # This file
├── Metodologia.md               # Development methodology (READ THIS)
├── especificaciones_sistema_turnos.md  # Detailed system specs
├── diagrama_er_turnos.md       # ER diagram documentation
├── sistema_turnos_guardianes.sql  # Database schema
├── docs/
│   ├── plans/                   # Task execution plans (plan_T00X_YYYYMMDD.md)
│   ├── tasks/                   # Task tracking files (tareas_faseN_YYYYMMDD.md)
│   ├── completed/               # Completed task results (T00X_nombre_tarea.md)
│   ├── decisions/               # Architecture Decision Records (ADRs)
│   ├── reports/                 # Phase completion reports
│   └── logs/                    # Coordinator logs (optional)
├── backend/                     # Backend code (Node.js + TypeScript) - TBD
└── frontend/                    # Frontend code (Angular) - TBD
```

### Task Management

**Task States**:
- `[ ]` Pendiente (Pending)
- `[→]` En progreso (In Progress)
- `[✓]` Completada (Completed)
- `[x]` Bloqueada (Blocked)
- `[~]` Cancelada (Cancelled)

**Task Files**: Located in `docs/tasks/tareas_faseN_YYYYMMDD.md`

**When Starting Work**:
1. Read `Metodologia.md` to understand workflow
2. Check latest task file in `docs/tasks/`
3. Identify next pending task with no blocked dependencies
4. If coordinator role: Create plan → Launch subagent → Validate → Update task status
5. If subagent role: Create plan → Execute → Document → Report completion

## Architecture Decisions

### ADR-001: Backend Stack Selection

**Decision**: Node.js + TypeScript + Express.js
**Date**: 2026-01-17
**Status**: Implemented
**File**: `docs/decisions/001_eleccion_stack_backend.md`

**Rationale**:
- Team expertise in JavaScript ecosystem
- Fast development cycle
- Excellent MySQL integration (mysql2)
- Strong typing with TypeScript (strict mode enabled)
- Lightweight and performant for CRUD operations

**Current Implementation**:
- TypeScript 5.3 with strict mode and path aliases
- Express.js 4.18 with async/await support
- Connection pooling (mysql2) for both databases
- Jest + Supertest for testing
- ESLint + Prettier for code quality

### ADR-002: Authentication Strategy

**Decision**: JWT (JSON Web Tokens) with Refresh Tokens
**Date**: 2026-01-17
**Status**: Implemented
**File**: `docs/decisions/002_estrategia_autenticacion.md`

**Rationale**:
- Stateless authentication (scalable)
- Short-lived access tokens (15min) for security
- Long-lived refresh tokens (7 days) for UX
- bcrypt for password hashing (10 rounds)
- Role-based access control (ADMIN, SUPERVISOR, CONSULTA)

**Current Implementation**:
- JWT access tokens: 15 minutes expiration
- Refresh tokens: 7 days expiration, stored in DB
- Password hashing: bcryptjs with 10 rounds
- Middleware: authMiddleware + roleMiddleware
- Audit trail: sys_auditoria_auth table

### Database Schema Decisions

**Dual Connection Strategy**:
- **Primary DB**: `turnos_guardianes` (new system, read/write)
- **Secondary DB**: `db_aae4a2_ranger` (HR system, read-only)

**Why Stored Procedures**:
- Complex business logic (shift type auto-detection, holiday verification)
- Automatic calculations (incentive hourly rate, processed status)
- Data integrity validation (hours limits, duplicate prevention)
- Performance optimization (batch report generation)

## Important Database Constraints

### Hours Validation (Enforced by Trigger)
```sql
-- Maximum limits per shift
Normal hours: <= 12
Extra hours: <= 4
Total hours: <= 16
```

### Auto-Calculated Fields
- `tipo_turno`: Determined by `sp_determinar_tipo_turno(hora_entrada)`
- `es_feriado`: Checked via `sp_verificar_feriado(fecha)`
- `incentivos_puesto.valor_hora`: GENERATED ALWAYS AS `monto / 360`

### Duplicate Prevention
- **Constraint**: `uk_empleado_puesto_fecha (empleado_id, puesto_id, fecha)`
- **Effect**: Cannot register same employee at same post on same date twice

## Backend Architecture

### Project Structure

```
backend/
├── src/
│   ├── config/           # Database, environment, validation
│   │   ├── database.ts   # Dual DB connection pools
│   │   └── env.ts        # Environment validation (Zod)
│   ├── controllers/      # Request handlers
│   │   ├── auth.controller.ts
│   │   └── usuarios.controller.ts
│   ├── models/           # TypeScript interfaces
│   │   └── auth.model.ts
│   ├── services/         # Business logic
│   │   ├── auth.service.ts
│   │   ├── password.service.ts
│   │   └── jwt.service.ts
│   ├── routes/           # API route definitions
│   │   ├── auth.routes.ts
│   │   └── usuarios.routes.ts
│   ├── middlewares/      # Express middlewares
│   │   ├── auth.middleware.ts
│   │   ├── role.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── validation.middleware.ts
│   ├── utils/            # Utilities and helpers
│   ├── types/            # Global TypeScript types
│   │   └── express.d.ts  # Express Request extension
│   └── server.ts         # Application entry point
├── tests/                # Jest unit/integration tests
├── scripts/              # DB utilities (init, seed, etc.)
├── database/             # SQL migrations and schemas
├── .env.example          # Environment variables template
├── tsconfig.json         # TypeScript config (strict mode)
└── package.json          # Dependencies and scripts
```

### Key Patterns

**Dual Database Strategy**:
- **Primary DB** (`turnos_guardianes`): Read/write for shift data
- **Secondary DB** (`db_aae4a2_ranger`): Read-only for HR employee data
- Connection pooling: 10 connections (primary), 5 connections (secondary)

**Authentication Flow**:
1. User sends credentials to `POST /api/auth/login`
2. AuthService validates against `sys_usuarios` table
3. PasswordService verifies hash with bcrypt
4. JWTService generates access token (15min) + refresh token (7 days)
5. Refresh token stored in `sys_refresh_tokens` table
6. Audit log created in `sys_auditoria_auth`

**Authorization Pattern**:
```typescript
router.get('/usuarios',
  authMiddleware,           // Verify JWT token
  requireRole('ADMIN'),     // Check user role
  getUsuarios               // Controller handler
);
```

**Error Handling**:
- Global error middleware catches all errors
- Custom error classes for different HTTP codes
- Validation errors via Zod schemas
- Database errors logged and sanitized

### MySQL Configuration

**Connection Details** (for development):
- Host: `localhost`
- Port: `3306` (default)
- Database: `turnos_guardianes` (primary), `db_aae4a2_ranger` (HR)
- User: `root` (development only)
- Password: Stored in environment variables (`.env`)

**Connection Pooling**:
```typescript
// Primary DB (turnos_guardianes)
connectionLimit: 10
waitForConnections: true
queueLimit: 0

// Secondary DB (RRHH)
connectionLimit: 5
waitForConnections: true
queueLimit: 0
```

**IMPORTANT**: Production credentials MUST be stored in environment variables, never in code.

## Development Phases Status

### Phase 1: Foundation (COMPLETED ✅)
**Completion**: 2026-01-17 (11/11 tasks, 28h 40min)
- [✓] Database schema design and deployment
- [✓] Architecture decisions (ADR-001, ADR-002)
- [✓] HR table investigation (515 active guards identified)
- [✓] Load initial data (12 national holidays 2026)
- [✓] Validate stored procedures (28 test cases)
- [✓] Backend project structure setup
- [✓] Database connection configuration (dual DB strategy)
- [✓] Environment variables and validation
- [✓] Utility scripts (db:init, db:seed, db:test, etc.)
- [✓] Documentation (README.md 2,655 lines)
- [✓] Methodology with parallelization (v2.0)

### Phase 2: Backend Core (COMPLETED ✅)
**Progress**: 100% (28/28 tasks, 95h 10min total)
**Completion Date**: 2026-01-19

**All Modules Completed**:
- [✓] Module 1: Authentication (6/6 tasks)
  - [✓] Authentication models and schemas (TypeScript + SQL)
  - [✓] Password hashing service (bcryptjs, 22 tests)
  - [✓] JWT service (access + refresh tokens, 29 tests)
  - [✓] Auth endpoints (login, logout, refresh, change-password)
  - [✓] Auth middleware (authMiddleware + roleMiddleware, 39 tests)
  - [✓] Users CRUD (6 endpoints, ADMIN only, 25+ tests)

- [✓] Module 2: Master Data CRUDs (9/9 tasks)
  - [✓] Clients CRUD (T2.07)
  - [✓] Locations CRUD (T2.08)
  - [✓] Posts CRUD (T2.09)
  - [✓] Holidays CRUD (T2.10)
  - [✓] Shift configuration CRUD (T2.11)
  - [✓] Post incentives CRUD (T2.12)
  - [✓] Data validation rules (T2.13)
  - [✓] Logging and audit (T2.14)
  - [✓] Seed data for master tables (T2.15)

- [✓] Module 3: HR Integration (2/2 tasks)
  - [✓] RRHH service for employees (T2.16)
  - [✓] Cache system for active guards (T2.17)

- [✓] Module 4: Shifts Management (5/5 tasks)
  - [✓] Shift model and validations (T2.18)
  - [✓] Register shift endpoint (T2.19)
  - [✓] Query shifts endpoints (T2.20)
  - [✓] Update/delete shifts endpoints (T2.21)
  - [✓] Calendar view endpoint (T2.22)

- [✓] Module 5: Reports and CSV Export (4/4 tasks)
  - [✓] CSV payroll report generation (T2.23)
  - [✓] Mark shifts as processed (T2.24)
  - [✓] Report history (T2.25)
  - [✓] Summary reports (T2.26)

- [✓] Module 6: Testing and Documentation (2/2 tasks)
  - [✓] Swagger/OpenAPI documentation (T2.27)
  - [✓] Complete integration test suite (T2.28)

### Phase 3: Frontend Base (COMPLETED ✅)
**Progress**: 100% (17/17 tasks, ~53h 15min total)
**Completion Date**: 2026-04-04

**All Modules Completed**:
- [✓] Angular 21 project setup with Material Design (T3.01)
- [✓] Authentication system: AuthGuard, RoleGuard, AuthInterceptor (T3.02)
- [✓] Layout: Sidebar navigation, header, responsive design (T3.03)
- [✓] Dashboard with statistics (T3.04)
- [✓] Master data CRUDs: Clientes (T3.05), Ubicaciones (T3.06), Puestos (T3.07), Feriados (T3.08), Usuarios (T3.09), Incentivos (T3.10)
- [✓] Shift configuration module (T3.11)
- [✓] Shift registration form with cascading selectors (T3.12)
- [✓] Shift list with filters and pagination (T3.13)
- [✓] Employee shift summary with statistics (T3.14)
- [✓] Payroll CSV report generation (T3.15)
- [✓] Password change component (T3.16)
- [✓] Login component (T3.17)

### Phase 4: Integration & Testing
- [ ] Connect to HR employee table
- [ ] CSV export validation with payroll system
- [ ] End-to-end testing
- [ ] User acceptance testing

## Common Queries

### Get Active Security Guards
```sql
SELECT
    e.id_empleado,
    e.cedula_empleado,
    CONCAT(e.nombres, ' ', e.apellidos) AS nombre_completo,
    e.status
FROM db_aae4a2_ranger.rh_empleado e
WHERE e.id_puesto = 97  -- VIGILANTE DE SEGURIDAD
  AND e.status = 1;     -- Active only
```

### Register a Shift (Using Stored Procedure)
```sql
CALL sp_registrar_turno(
    1001,              -- empleado_id
    42,                -- puesto_id
    '2026-01-15',      -- fecha
    '06:00:00',        -- hora_entrada
    '18:00:00',        -- hora_salida
    10.00,             -- horas_normales
    2.00,              -- horas_extras
    1                  -- created_by (user_id)
);
```

### Generate Payroll Report
```sql
CALL sp_generar_reporte_nomina('2026-01-01', '2026-01-15');
```

### Check Holidays for a Date
```sql
CALL sp_verificar_feriado('2026-01-01');
```

## Key Files to Reference

- **`especificaciones_sistema_turnos.md`**: Complete business requirements and system specs
- **`diagrama_er_turnos.md`**: Entity-Relationship diagram with detailed field descriptions
- **`Metodologia.md`**: Development workflow (coordinator/subagent methodology)
- **`sistema_turnos_guardianes.sql`**: Complete database schema with comments

## Development Notes

- All dates use ISO 8601 format: `YYYY-MM-DD`
- All times use 24-hour format: `HH:MM:SS`
- Database uses `utf8mb4_unicode_ci` collation
- All tables include `created_at` and `updated_at` audit timestamps
- Biweekly periods (quincenas): Days 1-15 and 16-end of month
- Security guards work schedule: Can include weekends and holidays
- Sundays are treated as normal workdays unless marked as holidays

## Important Warnings

⚠️ **Never commit**:
- `.env` files with real credentials
- Database dumps with real employee data
- API keys or authentication tokens

⚠️ **Database Safety**:
- Always use prepared statements to prevent SQL injection
- Use transactions for multi-step operations
- Never delete historical shift records (archive instead)
- Closed payroll periods (`procesado_nomina = TRUE`) should be immutable

⚠️ **Integration Considerations**:
- HR employee table (`rh_empleado`) is read-only for this system
- Do not modify employee data from the shift system
- Always validate employee exists and is active before creating shifts
- Ensure `empleado_id` references match between systems

## Testing

The project uses **Jest** with **Supertest** for testing.

### Test Structure

```
tests/
├── services/
│   ├── password.service.test.ts    # 22 tests (100% coverage)
│   └── jwt.service.test.ts         # 29 tests (100% coverage)
├── middlewares/
│   ├── auth.middleware.test.ts     # 20 tests (100% coverage)
│   └── role.middleware.test.ts     # 19 tests (100% coverage)
└── integration/
    ├── auth.routes.test.ts         # 12/14 tests passing
    └── usuarios.routes.test.ts     # 25+ tests
```

### Running Tests

```bash
# Run all tests
npm test

# Watch mode (auto-rerun on changes)
npm run test:watch

# Coverage report
npm run test:coverage

# Run specific test file
npm run test:password
npm run test:jwt
```

### Test Coverage

**Current Overall Coverage**: ~95% on core services
- **PasswordService**: 100% (22/22 tests)
- **JWTService**: 100% (29/29 tests)
- **Auth Middleware**: 100% (39/39 tests)
- **Auth Endpoints**: 85.7% (12/14 tests, 2 non-critical issues)

### Testing Best Practices

- All services have unit tests before integration
- Mock database connections in unit tests
- Use Supertest for API endpoint testing
- Test both success and error paths
- Validate TypeScript types in tests
- Maintain >80% coverage on critical paths

## Common Development Workflows

### Adding a New CRUD Endpoint

1. **Create Model Interface** (`src/models/*.model.ts`)
   ```typescript
   export interface Cliente {
     id: number;
     nombre: string;
     // ... other fields
   }
   ```

2. **Create Service** (`src/services/*.service.ts`)
   - Implement business logic
   - Use database connection from `config/database.ts`
   - Write unit tests

3. **Create Controller** (`src/controllers/*.controller.ts`)
   - Handle HTTP requests/responses
   - Call service methods
   - Return appropriate status codes

4. **Create Routes** (`src/routes/*.routes.ts`)
   ```typescript
   router.get('/', authMiddleware, requireRole('ADMIN'), getAll);
   router.post('/', authMiddleware, requireRole('ADMIN'), create);
   ```

5. **Add Validation Middleware** (if needed)
   - Use Zod schemas for input validation

6. **Write Integration Tests** (`tests/integration/*.test.ts`)
   - Test all endpoints with Supertest
   - Verify authentication/authorization
   - Test error cases

### Working with Database

**Using Stored Procedures**:
```typescript
const [rows] = await turnosPool.query(
  'CALL sp_registrar_turno(?, ?, ?, ?, ?, ?, ?, ?)',
  [empleado_id, puesto_id, fecha, hora_entrada, hora_salida, horas_normales, horas_extras, created_by]
);
```

**Raw Queries**:
```typescript
const [rows] = await turnosPool.query<RowDataPacket[]>(
  'SELECT * FROM clientes WHERE activo = 1 LIMIT ?, ?',
  [offset, limit]
);
```

**Transactions**:
```typescript
const connection = await turnosPool.getConnection();
await connection.beginTransaction();
try {
  await connection.query('INSERT INTO ...');
  await connection.query('UPDATE ...');
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
}
```

### Environment Variables

All environment variables are validated on startup using Zod schemas (`src/config/env.ts`). Server will fail fast with clear error messages if required variables are missing.

**Required Variables**:
- `DB_TURNOS_*`: Primary database credentials
- `DB_RRHH_*`: HR database credentials (read-only)
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: development | production | test
- `JWT_SECRET`: Secret for signing JWT tokens (min 32 chars)

**Optional Variables**:
- `JWT_EXPIRES_IN`: Access token expiration (default: 15m)
- `JWT_REFRESH_EXPIRES_IN`: Refresh token expiration (default: 7d)
- `LOG_LEVEL`: error | warn | info | debug
- `CORS_ORIGIN`: Allowed CORS origins

---

**Last updated**: 2026-04-04
**Project Phase**: Phase 4 - Integration & Testing (Next)
**Backend Status**: COMPLETED ✅ - All 28 tasks complete (Authentication, CRUDs, Shifts, Reports, Documentation)
**Frontend Status**: COMPLETED ✅ - All 17 tasks complete (Auth, CRUDs, Turnos, Reportes, Layout)
**Database Status**: Deployed and operational with 515 active guards
