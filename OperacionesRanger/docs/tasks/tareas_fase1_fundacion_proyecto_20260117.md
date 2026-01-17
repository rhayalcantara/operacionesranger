# Tareas: Fase 1 - Fundación del Proyecto

**Plan asociado**: `docs/plans/plan_fase1_fundacion_proyecto_20260117.md`
**Plan general**: `docs/tasks/PLAN_GENERAL_PROYECTO.md`
**Fecha de creación**: 2026-01-17
**Estado general**: En progreso

---

## Leyenda de Estados

- `[ ]` **Pendiente**: No iniciada
- `[→]` **En progreso**: Actualmente trabajando en ella
- `[✓]` **Completada**: Terminada y documentada
- `[x]` **Bloqueada**: No se puede avanzar por dependencia
- `[~]` **Cancelada**: Ya no es necesaria

---

## Resumen de Progreso

| Estado | Cantidad |
|--------|----------|
| Pendiente | 9 |
| En progreso | 0 |
| Completada | 2 |
| Bloqueada | 0 |
| Cancelada | 0 |
| **TOTAL** | **11** |

---

## Fase 1A: Decisiones Arquitectónicas

### T001 - Decidir stack tecnológico del backend
- **Estado**: [✓] Completada
- **Prioridad**: Alta
- **Estimación**: 3-4 horas
- **Iniciado**: 2026-01-17
- **Finalizado**: 2026-01-17
- **Tiempo real**: 3 horas
- **Dependencias**: Ninguna
- **Decisión**: Node.js + TypeScript + Express.js
- **Descripción**:
  Evaluar y decidir entre Node.js + Express.js vs .NET (ASP.NET Core) para el backend del sistema. Esta decisión es crítica porque afecta toda la arquitectura futura.

  **Factores considerados**:
  - Skills del equipo de desarrollo
  - Ecosistema y librerías disponibles
  - Integración con MySQL
  - Performance esperado
  - Mantenibilidad a largo plazo
  - Tiempo de desarrollo

- **Criterios de Aceptación**:
  - [✓] Análisis de pros/contras documentado
  - [✓] Decisión tomada y justificada
  - [✓] ADR-001 creado en `docs/decisions/001_eleccion_stack_backend.md`
  - [✓] Plan B identificado si la decisión no funciona

- **Archivo de Resultado**: `docs/completed/T001_decision_stack_backend.md`

---

### T002 - Investigar tabla de empleados en sistema RRHH
- **Estado**: [ ] Pendiente
- **Prioridad**: Alta
- **Estimación**: 4-5 horas
- **Dependencias**: Ninguna
- **Descripción**:
  Conectarse a la base de datos del sistema de RRHH existente e investigar la estructura de la tabla de empleados. Validar si tiene los campos necesarios para la integración con el sistema de turnos.

  **Información conocida**:
  - Base de datos: `db_aae4a2_ranger`
  - Tabla: `rh_empleado`
  - Guardianes se identifican por: `id_puesto = 97`

  **Tareas específicas**:
  - Conectar a base de datos RRHH
  - Ejecutar DESCRIBE en tabla `rh_empleado`
  - Listar todos los campos disponibles y tipos
  - Verificar campos mínimos requeridos (id, codigo, nombre, cedula, status)
  - Identificar y validar filtro de guardianes (`id_puesto = 97`)
  - Probar consulta SELECT de guardianes activos
  - Documentar estructura completa con constraints
  - Crear queries de ejemplo reutilizables

- **Criterios de Aceptación**:
  - [ ] Conexión exitosa a base de datos RRHH
  - [ ] Estructura de tabla documentada (campos, tipos, constraints)
  - [ ] Query de ejemplo funcionando para listar guardianes activos
  - [ ] Gaps identificados (campos faltantes vs requeridos)
  - [ ] Workarounds propuestos para campos faltantes
  - [ ] Documentación creada con ejemplos de queries

- **Archivo de Resultado**: `docs/completed/T002_investigacion_rrhh.md`

---

### T011 - Crear ADR para decisión de autenticación (futuro)
- **Estado**: [ ] Pendiente
- **Prioridad**: Baja
- **Estimación**: 2 horas
- **Dependencias**: T001
- **Descripción**:
  Aunque la implementación de autenticación es para Fase 2, es importante decidir la estrategia ahora para preparar la arquitectura.

  **Opciones a evaluar**:
  - JWT (stateless) - RECOMENDADO
  - Sessions (stateful)
  - OAuth 2.0 / OpenID Connect
  - API Keys
  - Integración con Active Directory (si aplica)

  **Consideraciones**:
  - Roles de usuario (Administrador, Supervisor, Consulta)
  - Permisos granulares
  - Expiración de sesión
  - Refresh tokens
  - Seguridad y encriptación

- **Criterios de Aceptación**:
  - [ ] Análisis de opciones documentado
  - [ ] Decisión tomada con justificación
  - [ ] ADR-002 creado en `docs/decisions/002_estrategia_autenticacion.md`
  - [ ] Consideraciones de seguridad documentadas
  - [ ] Plan de implementación básico (para Fase 2)
  - [ ] Definición de roles y permisos

- **Archivo de Resultado**: `docs/completed/T011_decision_autenticacion.md`

---

## Fase 1B: Setup de Base de Datos

### T003 - Crear base de datos MySQL para turnos
- **Estado**: [✓] Completada
- **Prioridad**: Alta
- **Estimación**: 1-2 horas
- **Iniciado**: 2026-01-17
- **Finalizado**: 2026-01-17
- **Tiempo real**: 45 minutos
- **Dependencias**: Ninguna
- **Descripción**:
  Crear la base de datos `turnos_guardianes` en MySQL local y ejecutar el script de schema completo.

  **Pasos ejecutados**:
  1. Conectar a MySQL como root
  2. Crear database `turnos_guardianes`
  3. Ejecutar `sistema_turnos_guardianes.sql`
  4. Verificar creación de todas las tablas
  5. Verificar procedimientos almacenados
  6. Verificar triggers
  7. Verificar vistas

- **Criterios de Aceptación**:
  - [✓] Database `turnos_guardianes` creada
  - [✓] Todas las tablas creadas (clientes, ubicaciones, puestos, turnos, etc.)
  - [✓] Procedimientos almacenados funcionando (sp_registrar_turno, sp_generar_reporte_nomina, etc.)
  - [✓] Triggers creados (trg_turnos_before_insert)
  - [✓] Vistas creadas (v_reporte_nomina, v_resumen_quincena)
  - [✓] Función fn_obtener_quincena funcionando
  - [✓] Sin errores de ejecución del script

- **Archivo de Resultado**: `docs/completed/T003_setup_database.md`
- **Notas**: Base de datos creada exitosamente con 7 tablas, 2 vistas, 4 procedimientos, 1 trigger y 1 función. Datos iniciales (2 configuraciones de turno) cargados correctamente.

---

### T004 - Cargar datos iniciales (feriados y configuración)
- **Estado**: [ ] Pendiente
- **Prioridad**: Alta
- **Estimación**: 2-3 horas
- **Dependencias**: T003
- **Descripción**:
  Cargar datos iniciales necesarios para el funcionamiento del sistema: feriados nacionales de República Dominicana para el año 2026 y validar la configuración de turnos.

  **Datos a cargar**:

  **Feriados Nacionales 2026 (República Dominicana)**:
  - 01 Enero: Año Nuevo
  - 06 Enero: Día de Reyes
  - 21 Enero: Día de Nuestra Señora de la Altagracia
  - 26 Enero: Día del Padre de la Patria (Juan Pablo Duarte)
  - 27 Febrero: Día de la Independencia
  - Semana Santa (Viernes Santo - fecha móvil)
  - 01 Mayo: Día del Trabajo
  - Corpus Christi (fecha móvil)
  - 16 Agosto: Día de la Restauración
  - 24 Septiembre: Día de Nuestra Señora de las Mercedes
  - 06 Noviembre: Día de la Constitución
  - 25 Diciembre: Navidad

  **Feriados por Decreto** (si aplican):
  - Se cargarán cuando sean decretados

  **Configuración de Turnos** (ya cargada, verificar):
  - DIURNO: 06:00-18:00
  - NOCTURNO: 18:00-06:00

  **Tareas específicas**:
  - Investigar calendario oficial RD 2026
  - Crear script SQL con INSERTs de feriados
  - Ejecutar script de carga
  - Validar que configuración de turnos está correcta
  - Documentar fuente de datos de feriados

- **Criterios de Aceptación**:
  - [ ] Feriados nacionales RD 2026 cargados (mínimo 12 días)
  - [ ] Configuración de turnos validada (DIURNO y NOCTURNO)
  - [ ] Queries de prueba ejecutadas (SELECT de feriados, configuración)
  - [ ] Script de seed documentado para futuros años
  - [ ] Fuente de datos documentada (ej: sitio oficial gobierno)
  - [ ] Procedimiento `sp_verificar_feriado` probado con fechas reales

- **Archivo de Resultado**: `docs/completed/T004_seed_data_inicial.md`

---

### T005 - Validar procedimientos almacenados y triggers
- **Estado**: [ ] Pendiente
- **Prioridad**: Alta
- **Estimación**: 3-4 horas
- **Dependencias**: T003, T004
- **Descripción**:
  Ejecutar pruebas manuales exhaustivas de todos los procedimientos almacenados y triggers para asegurar que funcionan correctamente con datos reales.

  **Procedimientos a probar**:

  **1. sp_verificar_feriado**
  ```sql
  CALL sp_verificar_feriado('2026-01-01'); -- Debe retornar 1 (Año Nuevo)
  CALL sp_verificar_feriado('2026-01-02'); -- Debe retornar 0 (día normal)
  ```

  **2. sp_determinar_tipo_turno**
  ```sql
  CALL sp_determinar_tipo_turno('08:00:00'); -- Debe retornar 'DIURNO'
  CALL sp_determinar_tipo_turno('20:00:00'); -- Debe retornar 'NOCTURNO'
  CALL sp_determinar_tipo_turno('06:00:00'); -- Debe retornar 'DIURNO' (límite)
  CALL sp_determinar_tipo_turno('18:00:00'); -- Debe retornar 'NOCTURNO' (límite)
  ```

  **3. sp_registrar_turno**
  ```sql
  -- Caso normal: turno diurno sin feriado
  CALL sp_registrar_turno(
      1,              -- empleado_id (guardián existente)
      1,              -- puesto_id (puesto creado)
      '2026-01-02',   -- fecha
      '06:00:00',     -- hora_entrada
      '16:00:00',     -- hora_salida
      10.00,          -- horas_normales
      0.00,           -- horas_extras
      1               -- created_by
  );

  -- Caso con extras: turno nocturno
  CALL sp_registrar_turno(
      1,
      1,
      '2026-01-03',
      '18:00:00',
      '06:00:00',
      10.00,
      2.00,
      1
  );

  -- Caso feriado
  CALL sp_registrar_turno(
      1,
      1,
      '2026-01-01',   -- Año Nuevo
      '08:00:00',
      '18:00:00',
      10.00,
      0.00,
      1
  );

  -- Caso debe FALLAR: duplicado
  CALL sp_registrar_turno(
      1,
      1,
      '2026-01-02',   -- Ya existe
      '06:00:00',
      '16:00:00',
      10.00,
      0.00,
      1
  );
  ```

  **4. sp_generar_reporte_nomina**
  ```sql
  -- Generar reporte de prueba
  CALL sp_generar_reporte_nomina('2026-01-01', '2026-01-15');
  ```

  **Triggers a probar**:

  **trg_turnos_before_insert**
  ```sql
  -- Caso debe FALLAR: más de 12 horas normales
  INSERT INTO turnos (empleado_id, puesto_id, fecha, hora_entrada, hora_salida, horas_normales, horas_extras, created_by)
  VALUES (1, 1, '2026-01-05', '06:00:00', '19:00:00', 13.00, 0.00, 1);

  -- Caso debe FALLAR: más de 4 horas extras
  INSERT INTO turnos (empleado_id, puesto_id, fecha, hora_entrada, hora_salida, horas_normales, horas_extras, created_by)
  VALUES (1, 1, '2026-01-06', '06:00:00', '18:00:00', 10.00, 5.00, 1);

  -- Caso debe FALLAR: más de 16 horas totales
  INSERT INTO turnos (empleado_id, puesto_id, fecha, hora_entrada, hora_salida, horas_normales, horas_extras, created_by)
  VALUES (1, 1, '2026-01-07', '06:00:00', '23:00:00', 12.00, 5.00, 1);
  ```

- **Criterios de Aceptación**:
  - [ ] sp_verificar_feriado ejecutado con éxito (3+ casos de prueba)
  - [ ] sp_determinar_tipo_turno ejecutado con éxito (4+ casos de prueba)
  - [ ] sp_registrar_turno ejecutado con datos de prueba (5+ casos)
  - [ ] sp_generar_reporte_nomina ejecutado con éxito
  - [ ] Trigger valida correctamente (rechazar turno > 12h normales)
  - [ ] Trigger valida correctamente (rechazar turno > 4h extras)
  - [ ] Trigger valida correctamente (rechazar turno > 16h totales)
  - [ ] Todos los casos edge documentados
  - [ ] Scripts de prueba guardados en `docs/completed/T005_scripts_prueba.sql`

- **Archivo de Resultado**: `docs/completed/T005_validacion_procedures.md`

---

## Fase 1C: Setup de Proyecto Backend

### T006 - Crear estructura de proyecto backend
- **Estado**: [ ] Pendiente
- **Prioridad**: Alta
- **Estimación**: 3-4 horas
- **Dependencias**: T001 (decisión de stack)
- **Descripción**:
  Crear la estructura inicial del proyecto backend Node.js + TypeScript + Express.js. Incluir carpetas, archivos base, y configuración inicial siguiendo mejores prácticas.

  **Estructura propuesta**:
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
  ├── .env.example          # Ejemplo de variables de entorno
  ├── .gitignore
  ├── tsconfig.json         # Configuración TypeScript
  ├── package.json
  ├── eslint.config.js      # Configuración ESLint
  ├── prettier.config.js    # Configuración Prettier
  └── README.md
  ```

  **Dependencias a instalar**:
  - express
  - mysql2
  - dotenv
  - cors
  - typescript
  - @types/node
  - @types/express
  - @types/cors
  - ts-node
  - nodemon (dev)
  - eslint (dev)
  - prettier (dev)

  **Scripts de package.json**:
  - `npm run dev` - Servidor en modo desarrollo con nodemon
  - `npm run build` - Compilar TypeScript a JavaScript
  - `npm start` - Iniciar servidor en producción
  - `npm test` - Ejecutar tests
  - `npm run lint` - Ejecutar linter
  - `npm run format` - Formatear código con Prettier

- **Criterios de Aceptación**:
  - [ ] Estructura de carpetas creada según propuesta
  - [ ] package.json configurado con dependencias
  - [ ] tsconfig.json configurado correctamente
  - [ ] eslint y prettier configurados
  - [ ] .gitignore apropiado (node_modules, .env, dist/)
  - [ ] Scripts de ejecución configurados y probados
  - [ ] Proyecto compila sin errores (`npm run build`)
  - [ ] Servidor arranca sin errores (`npm run dev`)
  - [ ] README.md básico creado

- **Archivo de Resultado**: `docs/completed/T006_estructura_proyecto.md`

---

### T007 - Configurar conexión a base de datos
- **Estado**: [ ] Pendiente
- **Prioridad**: Alta
- **Estimación**: 3-4 horas
- **Dependencias**: T003, T006
- **Descripción**:
  Implementar la configuración de conexión a las bases de datos MySQL desde el backend. Incluir manejo de variables de entorno, connection pooling, y pruebas de conexión.

  **Bases de datos a conectar**:
  1. **Principal**: `turnos_guardianes` (lectura/escritura)
  2. **Secundaria**: `db_aae4a2_ranger` (solo lectura - RRHH)

  **Tareas específicas**:
  - Crear archivo `src/config/database.ts`
  - Implementar connection pool para BD principal
  - Implementar connection pool para BD RRHH (read-only)
  - Leer variables de entorno desde .env
  - Crear función `testConnection()` para validar conectividad
  - Manejar errores de conexión gracefully
  - Implementar logs de conexión
  - Crear singleton para pool de conexiones

  **Variables de entorno (.env.example)**:
  ```
  # Base de datos principal - Turnos
  DB_TURNOS_HOST=localhost
  DB_TURNOS_PORT=3306
  DB_TURNOS_NAME=turnos_guardianes
  DB_TURNOS_USER=root
  DB_TURNOS_PASSWORD=password_here

  # Base de datos RRHH (read-only)
  DB_RRHH_HOST=localhost
  DB_RRHH_PORT=3306
  DB_RRHH_NAME=db_aae4a2_ranger
  DB_RRHH_USER=root
  DB_RRHH_PASSWORD=password_here

  # Configuración del servidor
  NODE_ENV=development
  PORT=3000
  LOG_LEVEL=debug
  ```

  **Connection pool config**:
  - connectionLimit: 10 (principal), 5 (RRHH)
  - queueLimit: 0
  - waitForConnections: true
  - enableKeepAlive: true

- **Criterios de Aceptación**:
  - [ ] Archivo config/database.ts creado
  - [ ] Pool de conexión principal configurado
  - [ ] Pool de conexión RRHH configurado
  - [ ] Variables de entorno funcionando (.env)
  - [ ] Función testConnection() ejecuta exitosamente
  - [ ] Manejo de errores implementado
  - [ ] Logs de conexión funcionando
  - [ ] Script de prueba ejecutado con éxito
  - [ ] Conexiones se cierran correctamente al terminar

- **Archivo de Resultado**: `docs/completed/T007_configuracion_database.md`

---

### T008 - Crear scripts de inicialización y pruebas de DB
- **Estado**: [ ] Pendiente
- **Prioridad**: Media
- **Estimación**: 2-3 horas
- **Dependencias**: T007
- **Descripción**:
  Crear scripts utilitarios para inicializar la base de datos, ejecutar queries de prueba, y facilitar el desarrollo y onboarding de nuevos desarrolladores.

  **Scripts a crear**:

  **1. scripts/init-db.ts**
  - Ejecutar schema SQL desde Node.js
  - Verificar que BD no existe antes de crear
  - Opción para forzar recreación (--force)

  **2. scripts/test-connection.ts**
  - Probar conexión a BD principal
  - Probar conexión a BD RRHH
  - Mostrar información de conexión
  - Listar tablas disponibles

  **3. scripts/seed-feriados.ts**
  - Cargar feriados de años futuros
  - Aceptar año como parámetro
  - Validar que no existan duplicados

  **4. scripts/query-examples.ts**
  - Ejemplos de queries comunes
  - Guardianes activos
  - Turnos por rango de fechas
  - Generación de reporte

  **5. scripts/reset-test-data.ts**
  - Limpiar datos de prueba
  - Cargar datos de prueba frescos
  - Solo para ambiente de desarrollo

  **npm scripts a configurar**:
  ```json
  {
    "scripts": {
      "db:init": "ts-node scripts/init-db.ts",
      "db:test": "ts-node scripts/test-connection.ts",
      "db:seed": "ts-node scripts/seed-feriados.ts",
      "db:examples": "ts-node scripts/query-examples.ts",
      "db:reset": "ts-node scripts/reset-test-data.ts"
    }
  }
  ```

- **Criterios de Aceptación**:
  - [ ] Script init-db.ts creado y funcional
  - [ ] Script test-connection.ts ejecuta correctamente
  - [ ] Script seed-feriados.ts permite agregar años
  - [ ] Script query-examples.ts documenta casos comunes
  - [ ] Script reset-test-data.ts funciona (solo dev)
  - [ ] Todos los scripts documentados con instrucciones
  - [ ] npm scripts configurados correctamente
  - [ ] Protecciones para evitar ejecución en producción

- **Archivo de Resultado**: `docs/completed/T008_scripts_utilidades.md`

---

## Fase 1D: Configuración y Documentación

### T009 - Configurar variables de entorno y .env.example
- **Estado**: [ ] Pendiente
- **Prioridad**: Alta
- **Estimación**: 1-2 horas
- **Dependencias**: T006
- **Descripción**:
  Crear archivo .env.example con todas las variables de entorno necesarias bien documentadas. Configurar .gitignore para NO commitear .env real. Implementar validación de variables en tiempo de ejecución.

  **Variables requeridas**:

  **Base de Datos**:
  - DB_TURNOS_* (host, port, name, user, password)
  - DB_RRHH_* (host, port, name, user, password)

  **Servidor**:
  - NODE_ENV (development, production, test)
  - PORT (puerto del servidor)
  - LOG_LEVEL (error, warn, info, debug)

  **Seguridad** (para Fase 2):
  - JWT_SECRET (secret para firmar tokens)
  - JWT_EXPIRES_IN (expiración de tokens)
  - CORS_ORIGIN (origen permitido para CORS)

  **Otros**:
  - TZ (timezone, ej: America/Santo_Domingo)

  **Tareas específicas**:
  - Crear .env.example con todas las variables
  - Documentar cada variable con comentarios
  - Actualizar .gitignore para incluir .env
  - Crear función de validación de env vars
  - Implementar carga de variables al inicio del servidor
  - Crear tipos TypeScript para variables de entorno

- **Criterios de Aceptación**:
  - [ ] .env.example creado con todas las variables
  - [ ] Cada variable documentada con comentario explicativo
  - [ ] .gitignore incluye .env y .env.*
  - [ ] Valores de ejemplo seguros (no passwords reales)
  - [ ] README incluye instrucciones de configuración .env
  - [ ] Validación de variables implementada
  - [ ] Servidor no arranca si faltan variables críticas

- **Archivo de Resultado**: `docs/completed/T009_variables_entorno.md`

---

### T010 - Crear README.md del proyecto con guía de instalación
- **Estado**: [ ] Pendiente
- **Prioridad**: Alta
- **Estimación**: 2-3 horas
- **Dependencias**: T006, T007, T009
- **Descripción**:
  Crear documentación completa en README.md del backend que permita a otro desarrollador configurar el entorno en menos de 30 minutos.

  **Secciones del README**:

  1. **Descripción del proyecto**
     - Qué es OperacionesRanger
     - Objetivo del sistema
     - Tecnologías utilizadas

  2. **Prerequisitos**
     - Node.js (versión mínima)
     - MySQL (versión)
     - Git
     - IDE recomendado

  3. **Instalación paso a paso**
     - Clonar repositorio
     - Instalar dependencias
     - Configurar .env
     - Crear base de datos
     - Ejecutar migraciones/scripts

  4. **Configuración de base de datos**
     - Crear BD principal
     - Acceso a BD RRHH
     - Cargar datos iniciales

  5. **Variables de entorno**
     - Copiar .env.example a .env
     - Explicación de cada variable
     - Valores por defecto

  6. **Cómo ejecutar el proyecto**
     - Modo desarrollo
     - Modo producción
     - Ejecutar tests

  7. **Scripts disponibles**
     - npm run dev
     - npm run build
     - npm test
     - npm run db:*

  8. **Estructura del proyecto**
     - Descripción de carpetas principales
     - Arquitectura general

  9. **Troubleshooting común**
     - Error de conexión a BD
     - Puerto ocupado
     - Variables de entorno faltantes

  10. **Contribución**
      - Guía de estilo de código
      - Proceso de commits
      - Branching strategy

  11. **Referencias**
      - CLAUDE.md
      - Metodologia.md
      - Especificaciones

- **Criterios de Aceptación**:
  - [ ] README.md completo y bien estructurado
  - [ ] Instrucciones claras paso a paso
  - [ ] Ejemplos de comandos incluidos
  - [ ] Sección de troubleshooting con problemas comunes
  - [ ] Links a documentación adicional
  - [ ] Badges de status (si aplica)
  - [ ] Otro desarrollador puede seguirlo exitosamente
  - [ ] Tiempo de setup < 30 minutos siguiendo el README

- **Archivo de Resultado**: `docs/completed/T010_readme_proyecto.md`

---

## Orden Sugerido de Ejecución

### Semana 1: Decisiones e Investigación (ACTUAL)
1. **T001** ✅ - Decidir stack backend (Alta prioridad, sin dependencias)
2. **T002** - Investigar tabla RRHH (Alta prioridad, sin dependencias)
3. **T011** - Decidir estrategia autenticación (Baja prioridad, depende T001)

### Semana 2: Base de Datos
4. **T003** ✅ - Crear base de datos MySQL (Alta prioridad, sin dependencias)
5. **T004** - Cargar datos iniciales (Alta prioridad, depende T003)
6. **T005** - Validar procedures (Alta prioridad, depende T003, T004)

### Semana 3: Backend Setup
7. **T006** - Crear estructura proyecto (Alta prioridad, depende T001)
8. **T009** - Configurar .env (Alta prioridad, depende T006)
9. **T007** - Configurar conexión DB (Alta prioridad, depende T003, T006)
10. **T008** - Scripts utilidades (Media prioridad, depende T007)

### Semana 4: Documentación Final
11. **T010** - README.md (Alta prioridad, depende T006, T007, T009)

---

## Notas Importantes

⚠️ **RECORDATORIO**: Después de completar CADA tarea:
1. Actualizar estado a [✓] Completada
2. Crear archivo en `docs/completed/`
3. Actualizar métricas de progreso
4. Commitear cambios con mensaje descriptivo

⚠️ **METODOLOGÍA**: Este proyecto sigue un sistema de agentes coordinados (ver `Metodologia.md`):
- **Agente Coordinador**: Lee este archivo, selecciona tareas, lanza subagentes
- **Subagentes**: Crean plan → Ejecutan → Documentan → Reportan

---

## Métricas (se actualizan conforme avanzan las tareas)

- **Fecha de inicio**: 2026-01-17
- **Fecha estimada de finalización**: 2026-02-14 (4 semanas)
- **Tiempo total estimado**: 30-40 horas
- **Tiempo real acumulado**: 3h 45min
- **Tareas completadas**: 2/11 (18%)
- **Variación tiempo**: -19% (más rápido de lo estimado)
  - T001: estimado 3-4h, real 3h (-14%)
  - T003: estimado 1-2h, real 45min (-50%)

---

## Bloqueadores Conocidos

Ninguno por el momento.

---

## Cambios al Plan

Ningún cambio por el momento. Este archivo se mantendrá actualizado conforme se descubran nuevos requisitos o cambios necesarios.

---

**Última actualización**: 2026-01-17
**Responsable**: Agente Coordinador
**Próxima revisión**: Al completar T002
