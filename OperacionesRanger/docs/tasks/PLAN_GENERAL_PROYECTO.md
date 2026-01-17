# Plan General del Proyecto - Sistema de Gestión de Turnos OperacionesRanger

**Proyecto**: Sistema de Gestión de Turnos para Guardianes de Seguridad
**Cliente**: Guardianes Profecionales - República Dominicana
**Fecha de inicio**: 2026-01-17
**Metodología**: Desarrollo coordinado con agentes (ver `Metodologia.md`)

---

## Resumen Ejecutivo

### Objetivo del Sistema
Gestionar y registrar turnos de trabajo de guardianes de seguridad, generando reportes quincenales para integración con el sistema de nómina, incluyendo cálculo de horas (normales/extras, día/noche), identificación de feriados y cálculo de incentivos por puesto.

### Stack Tecnológico
- **Base de Datos**: MySQL 8.0
- **Backend**: Node.js + TypeScript + Express.js
- **Frontend**: Angular + Angular Material
- **Integración**: CSV export para sistema de nómina (RangerNomina)

### Arquitectura de Datos
```
CLIENTE → UBICACIÓN → PUESTO → TURNO
                         ↓
                   INCENTIVO_PUESTO
```

---

## Estructura de Fases del Proyecto

### Fase 1: Fundación del Proyecto (Semanas 1-4)
**Objetivo**: Establecer base técnica y arquitectónica
**Estado**: En Progreso
**Archivo de tareas**: `docs/tasks/tareas_fase1_fundacion_proyecto_20260117.md`

### Fase 2: Backend Core (Semanas 5-8)
**Objetivo**: Desarrollar API REST completa
**Estado**: Pendiente
**Archivo de tareas**: `docs/tasks/tareas_fase2_backend_core.md` (Por crear)

### Fase 3: Frontend Base (Semanas 9-12)
**Objetivo**: Crear módulos de gestión de maestros
**Estado**: Pendiente
**Archivo de tareas**: `docs/tasks/tareas_fase3_frontend_base.md` (Por crear)

### Fase 4: Módulo de Turnos (Semanas 13-16)
**Objetivo**: Implementar registro y gestión de turnos
**Estado**: Pendiente
**Archivo de tareas**: `docs/tasks/tareas_fase4_modulo_turnos.md` (Por crear)

### Fase 5: Reportes e Integración (Semanas 17-18)
**Objetivo**: Generar reportes CSV e integrar con nómina
**Estado**: Pendiente
**Archivo de tareas**: `docs/tasks/tareas_fase5_reportes_integracion.md` (Por crear)

### Fase 6: Testing y Ajustes (Semanas 19-20)
**Objetivo**: Pruebas integrales y correcciones
**Estado**: Pendiente
**Archivo de tareas**: `docs/tasks/tareas_fase6_testing_ajustes.md` (Por crear)

### Fase 7: Deployment y Producción (Semanas 21-22)
**Objetivo**: Despliegue en producción
**Estado**: Pendiente
**Archivo de tareas**: `docs/tasks/tareas_fase7_deployment.md` (Por crear)

---

## Fase 1: Fundación del Proyecto (DETALLE)

### Fase 1A: Decisiones Arquitectónicas
- [✓] **T001** - Decidir stack tecnológico del backend
- [ ] **T002** - Investigar tabla de empleados en sistema RRHH
- [ ] **T011** - Decidir estrategia de autenticación

### Fase 1B: Setup de Base de Datos
- [✓] **T003** - Crear base de datos MySQL para turnos
- [ ] **T004** - Cargar datos iniciales (feriados y configuración)
- [ ] **T005** - Validar procedimientos almacenados y triggers

### Fase 1C: Setup de Proyecto Backend
- [ ] **T006** - Crear estructura de proyecto backend
- [ ] **T007** - Configurar conexión a base de datos
- [ ] **T008** - Crear scripts de inicialización y pruebas de DB

### Fase 1D: Configuración y Documentación
- [ ] **T009** - Configurar variables de entorno y .env.example
- [ ] **T010** - Crear README.md del proyecto con guía de instalación

**Progreso Fase 1**: 2/11 tareas completadas (18%)

---

## Fase 2: Backend Core (RESUMEN)

### Módulos a Desarrollar
1. **Autenticación y Usuarios**
   - Login/Logout
   - Gestión de usuarios
   - Control de permisos

2. **Maestros**
   - CRUD Clientes
   - CRUD Ubicaciones
   - CRUD Puestos
   - CRUD Feriados
   - CRUD Configuración de Turnos

3. **Incentivos**
   - CRUD Incentivos por Puesto/Quincena
   - Cálculo automático de valor_hora

4. **Turnos**
   - Registro de turnos (usando `sp_registrar_turno`)
   - Consulta de turnos
   - Validaciones de negocio

5. **Integración RRHH**
   - Servicio de consulta de empleados (read-only)
   - Filtrado de guardianes activos
   - Validación de empleado antes de crear turno

6. **Reportes**
   - Generación de reporte CSV (`sp_generar_reporte_nomina`)
   - Marcado de turnos como procesados
   - Historial de reportes generados

**Tareas Estimadas**: ~25-30 tareas

---

## Fase 3: Frontend Base (RESUMEN)

### Módulos a Desarrollar
1. **Autenticación**
   - Página de login
   - Guard de rutas
   - Manejo de sesión

2. **Dashboard**
   - Panel principal con estadísticas
   - Accesos rápidos

3. **Mantenimientos (CRUD)**
   - Clientes
   - Ubicaciones (filtrado por cliente)
   - Puestos (filtrado por ubicación)
   - Feriados
   - Configuración de Turnos
   - Usuarios

4. **Incentivos**
   - Gestión de incentivos por puesto/quincena
   - Visualización de distribución

**Tareas Estimadas**: ~20-25 tareas

---

## Fase 4: Módulo de Turnos (RESUMEN)

### Funcionalidades
1. **Calendario/Agenda de Turnos**
   - Vista de calendario mensual
   - Filtros por guardián, puesto, ubicación, cliente
   - Indicadores visuales (día/noche, feriados)

2. **Registro de Turno**
   - Formulario de captura
   - Autocomplete de empleados (guardianes)
   - Selector jerárquico (Cliente → Ubicación → Puesto)
   - Auto-cálculo de tipo de turno
   - Auto-detección de feriados
   - Validaciones de horas

3. **Consultas y Reportes Visuales**
   - Resumen por guardián
   - Resumen por puesto
   - Horas trabajadas por periodo

**Tareas Estimadas**: ~15-20 tareas

---

## Fase 5: Reportes e Integración (RESUMEN)

### Funcionalidades
1. **Generación de Reporte CSV**
   - Selección de rango de fechas (quincena)
   - Vista previa de datos
   - Exportación a CSV
   - Formato: `nomina_YYYYMMDD_YYYYMMDD.csv`

2. **Gestión de Reportes**
   - Historial de reportes generados
   - Re-descarga de reportes anteriores
   - Validación de turnos procesados

3. **Integración con Nómina**
   - Callback para marcar turnos como procesados
   - Asignación de `nomina_id` por sistema externo
   - Validación de integridad

**Tareas Estimadas**: ~10-12 tareas

---

## Fase 6: Testing y Ajustes (RESUMEN)

### Actividades
1. **Testing Unitario**
   - Backend: Jest
   - Frontend: Jasmine/Karma

2. **Testing de Integración**
   - APIs completas
   - Flujos end-to-end

3. **Testing de Usuario**
   - UAT con supervisores
   - Validación de reportes con nómina

4. **Correcciones y Ajustes**
   - Bugs identificados
   - Mejoras de UX

**Tareas Estimadas**: ~15-20 tareas

---

## Fase 7: Deployment y Producción (RESUMEN)

### Actividades
1. **Preparación de Infraestructura**
   - Servidor de base de datos
   - Servidor de aplicación
   - Configuración de red

2. **Deployment**
   - Backend en producción
   - Frontend en producción
   - Configuración de SSL

3. **Migraciones**
   - Datos históricos (si existen)
   - Feriados de años futuros

4. **Capacitación**
   - Usuarios finales
   - Administradores

5. **Documentación Final**
   - Manual de usuario
   - Manual técnico
   - Procedimientos operativos

**Tareas Estimadas**: ~10-12 tareas

---

## Reglas de Negocio Críticas

### Horas de Trabajo
- **Normales**: Máximo 12 horas
- **Extras**: Máximo 4 horas
- **Total**: Máximo 16 horas (validado por trigger)

### Clasificación de Turnos
- **DIURNO**: Entrada entre 06:00-18:00 (configurable)
- **NOCTURNO**: Entrada entre 18:00-06:00 (configurable)

### Feriados
- **NACIONAL**: Días festivos anuales recurrentes
- **DECRETO**: Feriados especiales por decreto
- **Domingos**: Son días normales EXCEPTO si están en tabla `feriados`

### Incentivos
- Fórmula: `monto / 360 horas` = valor_hora
- Distribución proporcional por horas trabajadas
- Se asigna por puesto y quincena

### Integridad de Datos
- No duplicados: mismo empleado/puesto/fecha
- Empleados deben existir en sistema RRHH
- Empleados deben estar activos (`status = 1`)
- Empleados deben ser guardianes (`id_puesto = 97`)

---

## Dependencias Externas

### Sistema de RRHH/Nómina (RangerNomina)
**Base de datos**: `db_aae4a2_ranger`
**Tabla**: `rh_empleado`
**Acceso**: Solo lectura (SELECT)

**Campos requeridos**:
- `id_empleado` (INT) - PK
- `cedula_empleado` (VARCHAR) - Cédula
- `nombres`, `apellidos` (VARCHAR) - Nombre completo
- `status` (TINYINT) - 1=activo, 0=inactivo
- `id_puesto` (INT) - 97 = VIGILANTE DE SEGURIDAD

**Query de integración**:
```sql
SELECT
    e.id_empleado,
    e.cedula_empleado,
    CONCAT(e.nombres, ' ', e.apellidos) AS nombre_completo,
    e.status
FROM db_aae4a2_ranger.rh_empleado e
WHERE e.id_puesto = 97 AND e.status = 1;
```

---

## Entregables por Fase

### Fase 1
- [x] Decisión de stack tecnológico (ADR-001)
- [ ] Base de datos creada y poblada
- [ ] Estructura de proyecto backend inicializada
- [ ] Conexión a BD funcional
- [ ] README.md completo

### Fase 2
- [ ] API REST completa documentada (Swagger/OpenAPI)
- [ ] Autenticación implementada
- [ ] Todos los CRUDs funcionales
- [ ] Tests unitarios > 80% cobertura

### Fase 3
- [ ] Frontend funcional con todos los mantenimientos
- [ ] Login funcional
- [ ] Dashboard operativo

### Fase 4
- [ ] Módulo de turnos completo
- [ ] Calendario funcional
- [ ] Validaciones de negocio implementadas

### Fase 5
- [ ] Exportación CSV funcional
- [ ] Integración con nómina validada
- [ ] Flujo completo end-to-end

### Fase 6
- [ ] Tests completos ejecutados
- [ ] Bugs críticos resueltos
- [ ] UAT aprobado

### Fase 7
- [ ] Sistema en producción
- [ ] Usuarios capacitados
- [ ] Documentación entregada

---

## Riesgos Identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Cambios en estructura de BD RRHH | Media | Alto | Documentar bien la integración, crear capa de abstracción |
| Cambios en formato de reporte CSV | Baja | Alto | Validar formato temprano con equipo de nómina |
| Problemas de rendimiento con alto volumen de turnos | Media | Medio | Implementar paginación, índices apropiados |
| Complejidad en cálculo de incentivos | Baja | Medio | Validar lógica con casos de prueba extensivos |
| Usuarios no familiarizados con sistema | Alta | Bajo | Capacitación completa y manual de usuario |

---

## Métricas del Proyecto

### Estimaciones Iniciales
- **Duración total**: 22 semanas (~5.5 meses)
- **Tareas totales estimadas**: ~105-120 tareas
- **Horas estimadas**: 400-500 horas de desarrollo

### Estado Actual
- **Fase actual**: Fase 1 - Fundación
- **Tareas completadas**: 2/11 (Fase 1)
- **Progreso general**: ~2% del proyecto total
- **Tiempo invertido**: ~5h 15min

---

## Cronograma General

```
Enero 2026          │████░░░░░░░░░░░░░░░░  Fase 1: Fundación
Febrero 2026        │░░░░████████░░░░░░░░  Fase 2: Backend Core
Marzo 2026          │░░░░░░░░░░░░████████  Fase 2: Backend Core (cont.)
Abril 2026          │████████░░░░░░░░░░░░  Fase 3: Frontend Base
Mayo 2026           │░░░░░░░░████████░░░░  Fase 4: Módulo Turnos
Junio 2026          │░░░░░░░░░░░░████░░░░  Fase 5: Reportes
Junio-Julio 2026    │░░░░░░░░░░░░░░░░████  Fase 6: Testing
Julio 2026          │░░░░░░░░░░░░░░░░░░██  Fase 7: Deployment
```

---

## Próximos Pasos Inmediatos

### Esta Semana
1. Completar T002 - Investigar tabla RRHH
2. Cargar datos iniciales (T004)
3. Validar procedures y triggers (T005)

### Próxima Semana
4. Crear estructura backend (T006)
5. Configurar conexión DB (T007)
6. Crear scripts de inicialización (T008)

### Siguientes 2 Semanas
7. Configurar variables de entorno (T009)
8. Crear README completo (T010)
9. Decidir estrategia de autenticación (T011)

---

## Referencias

- **Especificaciones**: `especificaciones_sistema_turnos.md`
- **Diagrama ER**: `diagrama_er_turnos.md`
- **Schema SQL**: `sistema_turnos_guardianes.sql`
- **Metodología**: `Metodologia.md`
- **Contexto del Proyecto**: `CLAUDE.md`

---

## Notas de Implementación

### Convenciones de Código
- **Backend**: TypeScript estricto, ESLint, Prettier
- **Frontend**: Angular style guide, Material Design
- **Base de Datos**: Nombres en español, snake_case
- **Git**: Commits descriptivos, branches por feature

### Estructura de Commits
```
tipo(alcance): descripción corta

Descripción detallada si es necesaria

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

Tipos: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

### Gestión de Tareas
- Cada fase tiene su archivo de tareas en `docs/tasks/`
- Cada tarea tiene formato `T###` (3 dígitos)
- Estados: `[ ]` Pendiente, `[→]` En progreso, `[✓]` Completada, `[x]` Bloqueada, `[~]` Cancelada
- Documentación de tareas completadas en `docs/completed/`

---

**Documento vivo - Se actualiza conforme avanza el proyecto**

**Última actualización**: 2026-01-17
**Responsable**: Agente Coordinador + Equipo de Desarrollo
**Versión**: 1.0
