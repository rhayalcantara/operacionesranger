# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Ranger Nomina** is a payroll management system for the Dominican Republic consisting of:
- **Backend**: Node.js + Express.js + MySQL (using Sequelize ORM and raw SQL for complex operations)
- **Frontend**: Angular 20 + Angular Material

The system handles employee payroll processing including salary calculations, statutory deductions (AFP, ARS, ISR), vacation management, overtime hours, and generates payment vouchers.

## Development Commands

### Backend (`backend-ranger-nomina/`)
```bash
# Start backend server
npm start                    # Runs on port 3333 (configured in .env)

# Run tests
npm test                     # Jest test suite with Supertest for API testing

# Direct database access (for debugging)
# MySQL connection via command line:
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -pRHoss.1234 -e "USE db_aae4a2_ranger; SHOW TABLES;"
```

### Frontend (`rangernomina-frontend/`)
```bash
# Start development server
npm start                    # Runs ng serve on http://localhost:4200

# Build for production
npm run build               # Creates optimized build in dist/

# Build and watch for changes
npm run watch               # ng build --watch --configuration development

# Run tests
npm test                    # Karma + Jasmine
```

## Architecture & Key Concepts

### Backend Structure

**Dual Model Pattern**: The backend uses both **Sequelize ORM models** and **raw SQL models**:
- **Sequelize models** (`*SequelizeModel.js`): Used for simple CRUD operations and authentication
- **Raw SQL models** (`*Model.js`): Used for complex payroll calculations requiring transactions
  - `nominaModel.js`: Core payroll processing logic with transaction management
  - `empleadoModel.js`: Employee operations including salary calculations
  - Rationale: Complex payroll operations need explicit transaction control and multi-step SQL operations

**Key Models:**
- `nominaModel.js`: Handles payroll creation, calculation, and closure. Contains critical business logic:
  - `_generarDescuentosDeLey()`: Calculates AFP, ARS, and ISR deductions (ISR deducts TSS first)
  - `recalcular()`: Recalculates all payroll amounts (uses transactions)
  - `cerrar()`: Closes payroll and creates immutable snapshot in `rh_emplado_nomina`
  - `_calcularMontoVacaciones()`: Calculates vacation pay based on business days (Mon-Fri only)
- `empleadoModel.js`: Employee management, salary calculations, `getSalarioPromedio()` for vacation calculations
- `isrService.js`: ISR (income tax) calculation based on Dominican tax brackets (table: `no_isr`), deducts AFP+ARS before applying progressive rates
- `importService.js`: Handles Excel import for overtime hours and vacations using ExcelJS
- `excelExportService.js`: Generates Excel reports for bank payments and payroll data

**Database Tables:**
- `sys_usuarios`: System users and authentication (nivel 9 = admin)
- `rh_empleado`: Active employee data (foto stored as Base64 LONGBLOB)
- `rh_emplado_nomina`: Historical employee snapshot when payroll is closed (ensures immutability)
- `no_nominas`: Payroll header (estado = 'abierto'/'cerrado')
- `no_det_nomina`: Payroll details per employee with calculated amounts
- `no_desc_cred_nomina`: Manual income/deductions and imported overtime hours
- `no_vacaciones`: Vacation records (estado, dias_disfrutados, monto_a_pagar)
- `no_isr`: ISR tax brackets configuration
- `rh_afp`: AFP configuration (porcentaje, tope_salarial)
- `rh_ars`: ARS configuration (porcentaje, tope_salarial)
- `no_tipo_nomina`: Payroll types with periodo_pago (Mensual, Quincenal, Semanal)
- `no_subnomina`: Sub-payroll classifications
- `no_desc_cred`: Master catalog of income/deduction types
- `rh_departamentos`: Department master data
- `rh_puestos`: Job position master data
- `ct_bancos`: Bank master data
- `no_empresa`: Company data (singleton - only one record allowed) with logo stored as Base64 LONGBLOB
- `no_auditoria`: Audit trail for operations

### Frontend Structure

**Component Organization:**
- **Maintenance modules** (`afp/`, `ars/`, `departamento/`, etc.): CRUD operations for master data
- **Employee management** (`employee/`, `employee-form/`): Employee CRUD with photo upload (stored as Base64 LONGBLOB)
- **Company module** (`empresa/`): Singleton configuration for company data (name, RNC, logo, address, legal representative) - only nivel 9 can edit
- **Payroll** (`nomina/`): Payroll creation, detail view, payment voucher generation
- **Importations** (`importaciones/`): Unified component for Excel imports (overtime, vacations)
- **Security** (`auth.service.ts`, `auth-guard.ts`): JWT-based authentication with expiration validation

**Services:**
- `auth.service.ts`: Login, token management, JWT expiration validation
- `employee.service.ts`: Employee API calls including `getActiveEmployees()`
- `notification.service.ts`: Global feedback using Angular Material Snackbar
- `user.service.ts`: User level/permission management (nivel 9 = admin)
- `nomina.service.ts`: Payroll operations (create, recalculate, close)
- `importacion.service.ts`: Excel import for overtime and vacations
- `desc-cred-nomina.service.ts`: Manual income/deduction management
- `vacaciones.service.ts`: Vacation management
- `reportes.service.ts`: Report generation
- `auditoria.service.ts`: Audit trail access
- `file-download.service.ts`: Helper for downloading Excel/PDF files
- `form-error-messages.service.ts`: Centralized form validation messages

**Key Patterns:**
- All forms use Angular Material components (Material Design)
- Dialogs (`MAT_DIALOG_DATA`) for create/edit operations instead of separate routes
- Paginated tables with search functionality (server-side pagination with `MatPaginator`)
- User permissions control visibility (`nivel` property determines access, nivel 9 = full admin)
- Image handling: Photos and logos stored as Base64 in LONGBLOB fields, `DomSanitizer` for safe display
- PDF generation using `pdfmake` for payment vouchers and reports
- Excel operations using `xlsx` library (frontend) and `exceljs` (backend)

### Payroll Calculation Flow

1. **Create Payroll** (`no_nominas`): Select type, date range, employees
2. **Generate Detail** (`no_det_nomina`): Create one record per employee with base salary
3. **Add Manual Items** (`no_desc_cred_nomina`): Overtime, bonuses, deductions
4. **Recalculate**: Run `nominaModel.recalcular(id_nomina)` to compute:
   - AFP deduction (capped at RD$9,932.40)
   - ARS deduction (capped at RD$9,932.40)
   - ISR calculation (deducts TSS first, then applies tax brackets)
   - Overtime amounts (35% and 15% rates)
   - Vacation pay (based on average salary, business days only)
   - Total income, total deductions, net pay
5. **Close Payroll**: Creates historical snapshot, makes payroll immutable

### Important Business Rules

- **AFP/ARS Calculation**: 2.87% and 3.04% respectively, capped at max salary of RD$9,932.40 (configurable in `rh_afp` and `rh_ars` tables)
- **ISR Calculation**: Progressive tax brackets defined in `no_isr`, **MUST** deduct TSS (AFP+ARS) before applying tax rates
- **Vacation Pay**: Based on average salary of last 3 months (using `empleadoModel.getSalarioPromedio()`), calculated on **business days only (Mon-Fri)**, excluding weekends
- **Overtime**: Imported from Excel via `importService.js`, stored as separate income items in `no_desc_cred_nomina` (35% and 15% rates)
- **Payroll Closure**: Once closed (`estado = 'cerrado'`), payroll is **immutable**. Historical snapshot created in `rh_emplado_nomina`, all modifications blocked
- **User Levels**: Only `nivel = 9` can access user management, company settings, and sensitive operations
- **Employee Status**: Active employees (`status = 1`), inactive/terminated (`status = 0`)
- **Company Data**: `no_empresa` is a singleton table (only one record allowed), contains company info and logo

## Environment Configuration

Both projects require `.env` files:

**Backend `.env`:**
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=RHoss.1234
DB_NAME=db_aae4a2_ranger
PORT=3333
JWT_SECRET=<secret>
FRONTEND_URL=http://localhost:4200
```

**Frontend** uses `environment.ts` files in `src/environments/` for API base URL configuration

**CORS Configuration:** Backend allows specific origins defined in `server.js` (`allowedOrigins` array)

## Testing

- Backend uses **Jest** for unit tests and **Supertest** for API integration tests
- Key test files in `backend-ranger-nomina/tests/`
- Important test coverage:
  - `auth.test.js`: Authentication and JWT validation
  - `isrService.test.js`: ISR calculation with various salary brackets
- Run `npm test` to execute test suite
- Frontend uses **Karma** and **Jasmine** for component testing

## Common Workflows

### Adding New Maintenance CRUD

1. **Backend**:
   - Create Sequelize model in `models/*SequelizeModel.js` for simple CRUD
   - Create route file in `routes/*.js` with full CRUD endpoints
   - Add server-side pagination support (`page`, `pageSize`, `search` parameters)
2. **Frontend**:
   - Create component folder with list and form components
   - Create service in `services/*.service.ts` with TypeScript interfaces
   - Use dialog pattern (`MAT_DIALOG_DATA`) for create/edit forms
   - Implement `MatPaginator` for pagination
   - Add CSS classes: `save-button`, `cancel-button` with proper styling
3. **Navigation**: Add entry to `menuItems` array in `navmenu.component.ts`
4. **Validation**: Test all CRUD operations, pagination, and search functionality

### Modifying Payroll Calculations

1. **Edit Model**: Modify `backend-ranger-nomina/models/nominaModel.js`
2. **Transactions**: Always use database transactions for multi-step operations (see existing pattern)
3. **Update Functions**: Modify these functions as needed:
   - `_generarDescuentosDeLey()`: For AFP, ARS, ISR calculation logic
   - `recalcular()`: For overall payroll recalculation flow
   - `_calcularMontoVacaciones()`: For vacation pay calculations
4. **ISR Changes**: If modifying ISR, edit `services/isrService.js` and update tests
5. **Write Tests**: Create/update unit tests in `tests/` directory
6. **Test Immutability**: Verify closed payrolls (`estado = 'cerrado'`) cannot be modified
7. **Verify Query**: Check that `no_nominas` vs `no_nomina` table name is correct (use `no_nominas`)

### Excel Import Features

1. **Backend**: Add logic to `services/importService.js` (uses `exceljs` library)
2. **Frontend**: Add import type to `importaciones.component.ts` dropdown
3. **Validation**:
   - Validate Excel structure before processing
   - Validate `id_nomina` is selected and is a valid number
   - Check column names match expected format
4. **Storage**: Store import results in `no_desc_cred_nomina` with appropriate `id_desc_cred` type
5. **Error Handling**: Provide clear feedback to user via `NotificationService`

## Security Notes

- **Password Security**: All passwords hashed with `bcryptjs` (10 rounds) before storage
- **Authentication**: JWT tokens with expiration, validated in both backend middleware and frontend `AuthGuard`
- **Authorization**: User level (`nivel`) controls menu visibility and feature access (nivel 9 = admin)
- **Data Immutability**: Closed payrolls (`estado = 'cerrado'`) are immutable, enforced in backend
- **Environment Variables**: `.env` files contain sensitive data and are in `.gitignore`
- **CORS**: Configured with whitelist of allowed origins in `server.js`
- **Image Upload**: Base64 encoding for photos/logos with 50MB limit
- **Token Storage**: JWT stored in `localStorage` with key `jwt_token`
- **SQL Injection Prevention**: Prepared statements used in Sequelize and raw SQL queries

## Project Documentation

- **`TAREAS.md`**: Comprehensive task tracking with implementation status for all phases
- **`logicacapturanomina.md`**: Backend logic for payroll creation/update workflow
- **`mejoras.md`**: List of potential improvements for server.js and backend architecture
- **`Docs/`**: Additional technical documentation and screenshots
- **Admin Credentials**: Default admin password is `RHoss.1234`

## Common Issues & Solutions

1. **Table Name Errors**: Use `no_nominas` (plural), not `no_nomina` (singular)
2. **Import Validation**: Always validate `id_nomina` is a valid number before Excel imports
3. **ISR Calculation**: Must deduct TSS (AFP+ARS) before applying tax brackets
4. **Vacation Calculation**: Only counts business days (Mon-Fri), excludes weekends
5. **Dialog Data**: Use `MAT_DIALOG_DATA` injection for passing data to form dialogs, not `ActivatedRoute`
6. **Pagination**: Backend must return `{ data: [], total: number }` format for frontend pagination
7. **Image Display**: Use `DomSanitizer.bypassSecurityTrustUrl()` for Base64 images in Angular