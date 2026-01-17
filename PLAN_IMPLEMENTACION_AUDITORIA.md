# PLAN DE IMPLEMENTACIÓN - SISTEMA DE AUDITORÍA
## Ranger Nómina - Sistema de Registro de Actividades

**Fecha:** 2025-11-09
**Versión:** 1.0
**Estado:** Propuesta para Revisión

---

## 1. RESUMEN EJECUTIVO

Este documento presenta el plan completo para implementar un **sistema de auditoría integral** en Ranger Nómina que registrará todas las actividades críticas del sistema, incluyendo:

- **Usuario** que ejecuta la acción
- **Fecha y hora** exacta de la operación
- **Componente/Módulo** donde se realizó la acción
- **Acción específica** ejecutada (Crear, Modificar, Eliminar, Consultar, Exportar, Cerrar, etc.)
- **Detalles del registro** afectado (ID, descripción)
- **Valores anteriores y nuevos** (para operaciones de actualización)
- **Dirección IP** del cliente
- **Resultado** de la operación (éxito/fallo)

---

## 2. OBJETIVOS

### 2.1 Objetivos Principales

1. **Trazabilidad Completa:** Rastrear todas las operaciones críticas del sistema
2. **Cumplimiento Normativo:** Satisfacer requisitos de auditoría laboral y fiscal
3. **Seguridad:** Detectar accesos no autorizados y actividades sospechosas
4. **Resolución de Disputas:** Proporcionar evidencia en caso de inconsistencias
5. **Análisis de Uso:** Generar reportes de actividad del sistema

### 2.2 Alcance

**Módulos a Auditar:**
- ✅ Autenticación (login/logout)
- ✅ Gestión de Usuarios (CRUD)
- ✅ Gestión de Empleados (CRUD, cambios de estado, fotos)
- ✅ Nóminas (creación, modificación, recálculo, cierre)
- ✅ Detalles de Nómina (modificaciones manuales)
- ✅ Descuentos/Créditos de Nómina (CRUD, importaciones)
- ✅ Vacaciones (CRUD, pagos)
- ✅ Cuotas (CRUD, aplicaciones)
- ✅ Mantenimientos (AFP, ARS, ISR, Bancos, Departamentos, Puestos, Tipos de Nómina, Subnóminas)
- ✅ Importaciones Excel (horas extras, vacaciones)
- ✅ Reportes y Exportaciones (Excel, PDF)

---

## 3. ANÁLISIS DE LA ARQUITECTURA ACTUAL

### 3.1 Backend (Node.js + Express + MySQL)

**Estructura de Modelos:**
- Modelos Sequelize (`*SequelizeModel.js`): Operaciones CRUD simples
- Modelos Raw SQL (`*Model.js`): Operaciones complejas con transacciones
- Servicios especializados: `isrService.js`, `importService.js`, `excelExportService.js`

**Middleware Actual:**
- `authMiddleware.js`: Valida JWT y extrae usuario (`req.user`)
- `adminMiddleware.js`: Valida nivel de permisos

**Rutas Principales:**
- `/api/usuarios` - Gestión de usuarios
- `/api/empleados` - Gestión de empleados
- `/api/no_nomina` - Nóminas
- `/api/descCredNomina` - Descuentos/Créditos
- `/api/vacaciones` - Vacaciones
- `/api/cuotaRoutes` - Cuotas
- Múltiples rutas de mantenimiento

### 3.2 Frontend (Angular 20 + Material)

**Servicios HTTP:**
- `auth.service.ts`: Gestión de autenticación
- `employee.service.ts`, `nomina.service.ts`, `desc-cred-nomina.service.ts`, etc.
- `notification.service.ts`: Feedback al usuario

**Interceptores:**
- HTTP Interceptor (no documentado explícitamente, presumiblemente agrega JWT)

---

## 4. DISEÑO DE LA SOLUCIÓN

### 4.1 Esquema de Base de Datos

#### Tabla Principal: `sys_auditoria`

```sql
CREATE TABLE sys_auditoria (
  id_auditoria BIGINT AUTO_INCREMENT PRIMARY KEY,

  -- Información del Usuario
  usuario VARCHAR(50) NOT NULL,                -- idusuario del usuario autenticado
  nombre_completo VARCHAR(200),                -- nombres + apellidos del usuario
  nivel_usuario INT,                           -- nivel de permisos (1-9)

  -- Información de la Acción
  fecha_hora DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),  -- Timestamp con milisegundos
  modulo VARCHAR(100) NOT NULL,                -- Ej: 'EMPLEADOS', 'NOMINAS', 'USUARIOS'
  accion VARCHAR(50) NOT NULL,                 -- Ej: 'CREAR', 'MODIFICAR', 'ELIMINAR', 'CONSULTAR', 'CERRAR_NOMINA'
  descripcion TEXT,                            -- Descripción legible de la acción

  -- Información del Registro Afectado
  tabla_afectada VARCHAR(100),                 -- Nombre de la tabla principal afectada
  id_registro VARCHAR(100),                    -- ID del registro afectado (puede ser compuesto)

  -- Detalles de la Operación
  valores_anteriores JSON,                     -- Estado antes de la modificación (UPDATE/DELETE)
  valores_nuevos JSON,                         -- Estado después de la modificación (INSERT/UPDATE)

  -- Información Técnica
  ip_cliente VARCHAR(45),                      -- Dirección IP (IPv4/IPv6)
  user_agent TEXT,                             -- Navegador/dispositivo
  metodo_http VARCHAR(10),                     -- GET, POST, PUT, DELETE
  url_endpoint VARCHAR(500),                   -- Ruta del endpoint llamado

  -- Resultado de la Operación
  resultado ENUM('EXITO', 'FALLO') NOT NULL DEFAULT 'EXITO',
  mensaje_error TEXT,                          -- Mensaje de error si resultado = 'FALLO'

  -- Índices para búsquedas rápidas
  INDEX idx_usuario (usuario),
  INDEX idx_fecha_hora (fecha_hora),
  INDEX idx_modulo (modulo),
  INDEX idx_accion (accion),
  INDEX idx_tabla_id (tabla_afectada, id_registro),
  INDEX idx_usuario_fecha (usuario, fecha_hora)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Tabla de Sesiones de Usuario (Opcional, para auditar login/logout)

```sql
CREATE TABLE sys_sesiones_auditoria (
  id_sesion BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario VARCHAR(50) NOT NULL,
  tipo_evento ENUM('LOGIN', 'LOGOUT', 'TOKEN_EXPIRADO', 'SESION_INVALIDA') NOT NULL,
  fecha_hora DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ip_cliente VARCHAR(45),
  user_agent TEXT,
  resultado ENUM('EXITO', 'FALLO') NOT NULL,
  detalle_fallo TEXT,

  INDEX idx_usuario_sesion (usuario),
  INDEX idx_fecha_sesion (fecha_hora)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 4.2 Categorización de Acciones por Módulo

#### Clasificación de Módulos

| Módulo | Tabla(s) Principal(es) | Acciones Principales |
|--------|------------------------|----------------------|
| **USUARIOS** | `sys_usuarios` | CREAR, MODIFICAR, ELIMINAR, CAMBIAR_PASSWORD, LISTAR |
| **EMPLEADOS** | `rh_empleado`, `rh_estado_empleado` | CREAR, MODIFICAR, ELIMINAR, ACTIVAR, DESACTIVAR, SUBIR_FOTO, LISTAR |
| **NOMINAS** | `no_nominas`, `no_det_nomina` | CREAR, MODIFICAR, ELIMINAR, RECALCULAR, CERRAR, REABRIR, EXPORTAR_EXCEL, GENERAR_VOUCHER, LISTAR |
| **DESC_CRED_NOMINA** | `no_desc_cred_nomina` | CREAR, MODIFICAR, ELIMINAR, IMPORTAR_EXCEL, LISTAR |
| **VACACIONES** | `no_vacaciones` | CREAR, MODIFICAR, ELIMINAR, PAGAR, IMPORTAR, LISTAR |
| **CUOTAS** | `no_cuotas`, `no_cuota_aplicaciones` | CREAR, MODIFICAR, ELIMINAR, APLICAR_CUOTA, LISTAR |
| **AFP** | `rh_afp` | CREAR, MODIFICAR, ELIMINAR, LISTAR |
| **ARS** | `rh_ars` | CREAR, MODIFICAR, ELIMINAR, LISTAR |
| **ISR** | `no_isr` | CREAR, MODIFICAR, ELIMINAR, LISTAR |
| **BANCOS** | `ct_bancos` | CREAR, MODIFICAR, ELIMINAR, LISTAR |
| **DEPARTAMENTOS** | `rh_departamentos` | CREAR, MODIFICAR, ELIMINAR, LISTAR |
| **PUESTOS** | `rh_puestos` | CREAR, MODIFICAR, ELIMINAR, LISTAR |
| **TIPOS_NOMINA** | `no_tipo_nomina` | CREAR, MODIFICAR, ELIMINAR, LISTAR |
| **SUBNOMINAS** | `no_subnomina` | CREAR, MODIFICAR, ELIMINAR, LISTAR |
| **NO_DESC_CRED** | `no_desc_cred` | CREAR, MODIFICAR, ELIMINAR, LISTAR |
| **AUTENTICACION** | `sys_usuarios` | LOGIN, LOGOUT |
| **REPORTES** | N/A | EXPORTAR_EXCEL, EXPORTAR_PDF, GENERAR_REPORTE |

---

## 5. COMPONENTES A DESARROLLAR

### 5.1 Backend

#### 5.1.1 Modelo de Auditoría (`backend-ranger-nomina/models/auditoriaModel.js`)

```javascript
/**
 * Modelo para el registro de auditoría
 * Maneja la escritura de logs de todas las operaciones del sistema
 */
class AuditoriaModel {
  /**
   * Registra una acción en la auditoría
   * @param {Object} params - Parámetros de auditoría
   * @param {string} params.usuario - ID del usuario
   * @param {string} params.nombre_completo - Nombre completo del usuario
   * @param {number} params.nivel_usuario - Nivel de permisos
   * @param {string} params.modulo - Módulo del sistema
   * @param {string} params.accion - Tipo de acción
   * @param {string} params.descripcion - Descripción legible
   * @param {string} params.tabla_afectada - Tabla de BD afectada
   * @param {string} params.id_registro - ID del registro afectado
   * @param {Object} params.valores_anteriores - Estado anterior (opcional)
   * @param {Object} params.valores_nuevos - Estado nuevo (opcional)
   * @param {string} params.ip_cliente - IP del cliente
   * @param {string} params.user_agent - User agent del navegador
   * @param {string} params.metodo_http - Método HTTP
   * @param {string} params.url_endpoint - URL del endpoint
   * @param {string} params.resultado - 'EXITO' o 'FALLO'
   * @param {string} params.mensaje_error - Mensaje de error (opcional)
   */
  static async registrar(params) {
    // Implementación con INSERT a sys_auditoria
  }

  /**
   * Consulta logs de auditoría con filtros
   */
  static async consultar({
    fecha_desde,
    fecha_hasta,
    usuario,
    modulo,
    accion,
    resultado,
    page,
    limit
  }) {
    // Implementación con SELECT paginado
  }
}
```

#### 5.1.2 Middleware de Auditoría (`backend-ranger-nomina/middleware/auditMiddleware.js`)

```javascript
/**
 * Middleware para capturar automáticamente información de contexto
 * Se inserta DESPUÉS de authMiddleware en las rutas
 */
const auditMiddleware = (modulo) => {
  return (req, res, next) => {
    // Captura información del request
    req.auditContext = {
      usuario: req.user?.id || 'ANONIMO',
      nombre_completo: `${req.user?.nombres || ''} ${req.user?.apellidos || ''}`.trim(),
      nivel_usuario: req.user?.nivel || 0,
      modulo: modulo,
      ip_cliente: req.ip || req.connection.remoteAddress,
      user_agent: req.headers['user-agent'],
      metodo_http: req.method,
      url_endpoint: req.originalUrl
    };

    // Intercepta res.json para capturar respuestas exitosas
    const originalJson = res.json.bind(res);
    res.json = function(data) {
      req.auditContext.resultado = 'EXITO';
      req.auditContext.response_data = data;
      return originalJson(data);
    };

    next();
  };
};

/**
 * Helper para registrar auditoría desde rutas
 */
const registrarAuditoria = async (req, accion, descripcion, detalles = {}) => {
  const AuditoriaModel = require('../models/auditoriaModel');

  await AuditoriaModel.registrar({
    ...req.auditContext,
    accion,
    descripcion,
    tabla_afectada: detalles.tabla_afectada,
    id_registro: detalles.id_registro,
    valores_anteriores: detalles.valores_anteriores,
    valores_nuevos: detalles.valores_nuevos,
    mensaje_error: detalles.mensaje_error
  });
};

module.exports = { auditMiddleware, registrarAuditoria };
```

#### 5.1.3 Rutas de Auditoría (`backend-ranger-nomina/routes/auditoria.js`)

```javascript
/**
 * Endpoints para consultar logs de auditoría
 * Solo accesible por administradores (nivel 9)
 */
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  // GET /api/auditoria?fecha_desde=...&fecha_hasta=...&usuario=...&modulo=...
  // Retorna logs paginados
});

router.get('/reporte/excel', authMiddleware, adminMiddleware, async (req, res) => {
  // GET /api/auditoria/reporte/excel
  // Exporta logs a Excel
});

router.get('/dashboard/estadisticas', authMiddleware, adminMiddleware, async (req, res) => {
  // GET /api/auditoria/dashboard/estadisticas
  // Retorna estadísticas agregadas (acciones por día, usuarios más activos, etc.)
});
```

#### 5.1.4 Integración en Rutas Existentes

**Patrón de Implementación:**

```javascript
// Ejemplo: backend-ranger-nomina/routes/empleados.js

const { auditMiddleware, registrarAuditoria } = require('../middleware/auditMiddleware');

// Aplicar middleware de auditoría
router.use(auditMiddleware('EMPLEADOS'));

// POST - Crear empleado
router.post('/', async (req, res) => {
  try {
    const nuevoEmpleado = await Empleado.create(req.body);

    // Registrar en auditoría
    await registrarAuditoria(req, 'CREAR',
      `Empleado creado: ${req.body.nombres} ${req.body.apellidos}`, {
      tabla_afectada: 'rh_empleado',
      id_registro: nuevoEmpleado.id_empleado,
      valores_nuevos: nuevoEmpleado
    });

    res.status(201).json(nuevoEmpleado);
  } catch (err) {
    // Registrar fallo
    await registrarAuditoria(req, 'CREAR',
      `Fallo al crear empleado`, {
      tabla_afectada: 'rh_empleado',
      mensaje_error: err.message
    });
    res.status(500).json({ message: err.message });
  }
});

// PUT - Actualizar empleado
router.put('/:id', async (req, res) => {
  try {
    const empleadoAnterior = await Empleado.getById(req.params.id);
    const actualizado = await Empleado.update(req.params.id, req.body);

    await registrarAuditoria(req, 'MODIFICAR',
      `Empleado modificado: ${empleadoAnterior.nombres} ${empleadoAnterior.apellidos}`, {
      tabla_afectada: 'rh_empleado',
      id_registro: req.params.id,
      valores_anteriores: empleadoAnterior,
      valores_nuevos: req.body
    });

    res.json({ message: 'Empleado actualizado' });
  } catch (err) {
    // Manejar error...
  }
});
```

### 5.2 Frontend

#### 5.2.1 Servicio de Auditoría (`rangernomina-frontend/src/app/services/auditoria.service.ts`)

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LogAuditoria {
  id_auditoria: number;
  usuario: string;
  nombre_completo: string;
  fecha_hora: Date;
  modulo: string;
  accion: string;
  descripcion: string;
  tabla_afectada: string;
  id_registro: string;
  valores_anteriores: any;
  valores_nuevos: any;
  ip_cliente: string;
  resultado: 'EXITO' | 'FALLO';
  mensaje_error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuditoriaService {
  private apiUrl = `${environment.apiUrl}/auditoria`;

  constructor(private http: HttpClient) {}

  consultarLogs(filtros: {
    fecha_desde?: string;
    fecha_hasta?: string;
    usuario?: string;
    modulo?: string;
    accion?: string;
    resultado?: string;
    page?: number;
    limit?: number;
  }): Observable<{ data: LogAuditoria[], total: number }> {
    let params = new HttpParams();
    Object.keys(filtros).forEach(key => {
      if (filtros[key]) {
        params = params.set(key, filtros[key]);
      }
    });
    return this.http.get<{ data: LogAuditoria[], total: number }>(
      this.apiUrl, { params }
    );
  }

  exportarExcel(filtros: any): Observable<Blob> {
    // Exportar logs a Excel
    return this.http.get(`${this.apiUrl}/reporte/excel`, {
      params: filtros,
      responseType: 'blob'
    });
  }

  obtenerEstadisticas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard/estadisticas`);
  }
}
```

#### 5.2.2 Componente de Consulta de Auditoría (`rangernomina-frontend/src/app/auditoria/auditoria.component.ts`)

Componente con:
- Filtros de búsqueda (fecha, usuario, módulo, acción)
- Tabla paginada con resultados
- Detalles expandibles (valores anteriores/nuevos)
- Botón de exportación a Excel
- Gráficos de estadísticas (opcional)

#### 5.2.3 HTTP Interceptor (Mejorado)

```typescript
// Agregar headers adicionales si es necesario (IP del cliente ya se captura en backend)
// No requiere cambios significativos
```

---

## 6. PLAN DE IMPLEMENTACIÓN PASO A PASO

### FASE 1: Fundamentos (Semana 1)

**Objetivo:** Crear la infraestructura base de auditoría

#### Tareas Backend:

1. **Crear tabla de auditoría en base de datos**
   - Ejecutar script SQL de creación de `sys_auditoria`
   - Ejecutar script SQL de creación de `sys_sesiones_auditoria` (opcional)
   - Verificar índices y rendimiento

2. **Implementar `auditoriaModel.js`**
   - Método `registrar()` con INSERT a `sys_auditoria`
   - Método `consultar()` con SELECT paginado
   - Método `obtenerEstadisticas()` para dashboard
   - Pruebas unitarias con Jest

3. **Implementar `auditMiddleware.js`**
   - Función `auditMiddleware(modulo)`
   - Función helper `registrarAuditoria()`
   - Documentación de uso

4. **Crear rutas `/api/auditoria`**
   - Endpoint GET `/` - Consultar logs (admin only)
   - Endpoint GET `/reporte/excel` - Exportar (admin only)
   - Endpoint GET `/dashboard/estadisticas` - Estadísticas (admin only)
   - Registrar rutas en `app.js`

#### Tareas Frontend:

5. **Crear servicio `auditoria.service.ts`**
   - Métodos de consulta
   - Método de exportación
   - Interfaces TypeScript

6. **Pruebas de integración**
   - Probar INSERT manual desde backend
   - Verificar que los logs se escriben correctamente

**Entregables:**
- ✅ Tabla `sys_auditoria` creada
- ✅ Modelo, middleware y rutas funcionando
- ✅ Servicio Angular creado
- ✅ Documentación técnica actualizada

---

### FASE 2: Auditoría de Autenticación y Usuarios (Semana 2)

**Objetivo:** Auditar login, logout y gestión de usuarios

#### Tareas:

1. **Auditar login/logout**
   - Modificar endpoint de login para registrar evento LOGIN
   - Agregar endpoint de logout (si no existe) con auditoría
   - Registrar intentos fallidos de login

2. **Auditar gestión de usuarios (`/api/usuarios`)**
   - Aplicar `auditMiddleware('USUARIOS')` en todas las rutas
   - Registrar en cada endpoint (POST, PUT, DELETE, GET):
     - CREAR_USUARIO
     - MODIFICAR_USUARIO
     - ELIMINAR_USUARIO
     - CAMBIAR_PASSWORD
     - LISTAR_USUARIOS

3. **Pruebas funcionales**
   - Crear usuario → verificar log
   - Modificar usuario → verificar valores anteriores/nuevos
   - Eliminar usuario → verificar log
   - Cambiar contraseña → verificar log (sin exponer contraseña)

**Entregables:**
- ✅ Autenticación auditada
- ✅ CRUD de usuarios auditado
- ✅ Pruebas pasadas

---

### FASE 3: Auditoría de Empleados (Semana 3)

**Objetivo:** Auditar operaciones CRUD de empleados

#### Tareas:

1. **Auditar `/api/empleados`**
   - Aplicar `auditMiddleware('EMPLEADOS')`
   - Registrar acciones:
     - CREAR_EMPLEADO
     - MODIFICAR_EMPLEADO
     - ELIMINAR_EMPLEADO (o DESACTIVAR_EMPLEADO)
     - ACTIVAR_EMPLEADO
     - SUBIR_FOTO (sin guardar el blob en auditoría, solo indicar que se subió)
     - LISTAR_EMPLEADOS (opcional, puede generar muchos logs)

2. **Consideraciones especiales:**
   - Para fotos: No guardar el Base64 completo en auditoría, solo indicar cambio
   - Para desactivación: Registrar fecha de despido y observación

3. **Pruebas funcionales**

**Entregables:**
- ✅ CRUD de empleados auditado
- ✅ Cambios de estado auditados

---

### FASE 4: Auditoría de Nóminas (Semana 4-5)

**Objetivo:** Auditar el ciclo completo de nóminas

#### Tareas:

1. **Auditar `/api/no_nomina`**
   - Aplicar `auditMiddleware('NOMINAS')`
   - Registrar acciones:
     - CREAR_NOMINA
     - MODIFICAR_NOMINA
     - ELIMINAR_NOMINA
     - **RECALCULAR_NOMINA** (crítico)
     - **CERRAR_NOMINA** (crítico - incluir snapshot de totales)
     - REABRIR_NOMINA (si existe)
     - EXPORTAR_EXCEL
     - GENERAR_VOUCHER
     - LISTAR_NOMINAS

2. **Auditar detalles de nómina (`/api/detNomina`)**
   - Modificaciones manuales de montos
   - Registrar valores anteriores/nuevos de campos críticos (ISR, AFP, ARS, total_pagar)

3. **Consideraciones especiales:**
   - **CERRAR_NOMINA:** Registrar estado completo antes del cierre (totales, cantidad de empleados)
   - **RECALCULAR:** Registrar trigger del recálculo

4. **Pruebas funcionales**

**Entregables:**
- ✅ Ciclo de nómina auditado
- ✅ Cierre de nómina con evidencia completa

---

### FASE 5: Auditoría de Descuentos/Créditos y Vacaciones (Semana 6)

**Objetivo:** Auditar ingresos/descuentos y vacaciones

#### Tareas:

1. **Auditar `/api/descCredNomina`**
   - CREAR_DESC_CRED
   - MODIFICAR_DESC_CRED
   - ELIMINAR_DESC_CRED
   - IMPORTAR_EXCEL (registrar cantidad de registros importados)

2. **Auditar `/api/vacaciones`**
   - CREAR_VACACION
   - MODIFICAR_VACACION
   - ELIMINAR_VACACION
   - PAGAR_VACACION
   - IMPORTAR_VACACIONES

3. **Auditar `/api/cuotaRoutes`**
   - CREAR_CUOTA
   - MODIFICAR_CUOTA
   - ELIMINAR_CUOTA
   - APLICAR_CUOTA_A_NOMINA

**Entregables:**
- ✅ Desc/Cred auditados
- ✅ Vacaciones auditadas
- ✅ Cuotas auditadas

---

### FASE 6: Auditoría de Mantenimientos (Semana 7)

**Objetivo:** Auditar tablas maestras

#### Tareas:

1. **Auditar módulos de mantenimiento:**
   - `/api/rh_afp` → Módulo: AFP
   - `/api/rh_ars` → Módulo: ARS
   - `/api/no_isr` → Módulo: ISR
   - `/api/ct_bancos` → Módulo: BANCOS
   - `/api/rh_departamentos` → Módulo: DEPARTAMENTOS
   - `/api/rh_puestos` → Módulo: PUESTOS
   - `/api/no_tipo_nomina` → Módulo: TIPOS_NOMINA
   - `/api/no_subnomina` → Módulo: SUBNOMINAS
   - `/api/no_desc_cred` → Módulo: NO_DESC_CRED

2. **Patrón repetitivo:**
   - Aplicar middleware
   - Registrar CRUD estándar (CREAR, MODIFICAR, ELIMINAR, LISTAR)

**Entregables:**
- ✅ Todos los mantenimientos auditados

---

### FASE 7: Auditoría de Reportes e Importaciones (Semana 8)

**Objetivo:** Auditar exportaciones y reportes

#### Tareas:

1. **Auditar exportaciones Excel**
   - Registrar cuando un usuario exporta nómina a Excel
   - Registrar cuando se genera reporte de descuentos/ingresos
   - Módulo: REPORTES, Acción: EXPORTAR_EXCEL

2. **Auditar generación de PDFs**
   - Vouchers de pago
   - Reportes agrupados
   - Módulo: REPORTES, Acción: EXPORTAR_PDF

3. **Auditar importaciones**
   - Importación de horas extras
   - Importación de vacaciones
   - Registrar cantidad de registros procesados

**Entregables:**
- ✅ Exportaciones auditadas
- ✅ Importaciones auditadas

---

### FASE 8: Frontend - Interfaz de Consulta (Semana 9)

**Objetivo:** Crear interfaz para consultar logs

#### Tareas:

1. **Crear módulo de Auditoría**
   - `rangernomina-frontend/src/app/auditoria/`
   - Componente principal con tabla paginada
   - Filtros de búsqueda (fecha, usuario, módulo, acción)

2. **Implementar tabla de logs**
   - Angular Material Table
   - Paginación server-side
   - Columnas: Fecha/Hora, Usuario, Módulo, Acción, Descripción, Resultado
   - Fila expandible con detalles (valores anteriores/nuevos)

3. **Implementar exportación a Excel**
   - Botón "Exportar a Excel"
   - Descarga archivo con logs filtrados

4. **Agregar al menú de navegación**
   - Solo visible para usuarios nivel 9 (admin)

**Entregables:**
- ✅ Componente de auditoría funcional
- ✅ Filtros y paginación operativos
- ✅ Exportación a Excel

---

### FASE 9: Dashboard de Auditoría (Semana 10)

**Objetivo:** Visualización de estadísticas

#### Tareas:

1. **Crear componente de dashboard**
   - Gráfico de barras: Acciones por día
   - Gráfico de torta: Distribución de acciones por módulo
   - Tabla: Usuarios más activos
   - Tabla: Acciones fallidas recientes

2. **Integrar con backend**
   - Endpoint `/api/auditoria/dashboard/estadisticas`
   - Cachear resultados por 5 minutos

**Entregables:**
- ✅ Dashboard visual con estadísticas

---

### FASE 10: Pruebas Integrales y Optimización (Semana 11)

**Objetivo:** Garantizar rendimiento y estabilidad

#### Tareas:

1. **Pruebas de carga**
   - Simular 1000 operaciones concurrentes
   - Medir impacto de auditoría en rendimiento
   - Optimizar índices de base de datos si es necesario

2. **Pruebas de integridad**
   - Verificar que TODAS las operaciones críticas se auditan
   - Probar escenarios de error (BD caída, etc.)
   - Verificar que fallos en auditoría no bloquean operaciones

3. **Implementar manejo de errores robusto**
   - Si falla la auditoría, registrar en logs de aplicación pero continuar operación
   - Mecanismo de retry para escritura de auditoría

4. **Documentación final**
   - Actualizar CLAUDE.md con información de auditoría
   - Crear guía de uso para administradores
   - Documentar formato de valores_anteriores/valores_nuevos por módulo

**Entregables:**
- ✅ Sistema auditado completo
- ✅ Documentación técnica y de usuario
- ✅ Pruebas pasadas

---

### FASE 11: Capacitación y Despliegue (Semana 12)

**Objetivo:** Poner en producción

#### Tareas:

1. **Capacitar a usuarios administradores**
   - Cómo consultar logs
   - Cómo exportar reportes
   - Interpretación de datos de auditoría

2. **Despliegue en producción**
   - Backup de base de datos
   - Ejecutar scripts de creación de tablas
   - Desplegar backend y frontend
   - Monitoreo post-despliegue

3. **Plan de retención de logs**
   - Definir política de retención (ej: mantener logs por 5 años)
   - Script de archivado/purga de logs antiguos

**Entregables:**
- ✅ Sistema en producción
- ✅ Usuarios capacitados
- ✅ Plan de mantenimiento de logs

---

## 7. CONSIDERACIONES TÉCNICAS

### 7.1 Rendimiento

**Problema:** La auditoría puede ralentizar las operaciones.

**Soluciones:**
1. **Escritura asíncrona:** No bloquear la respuesta al usuario esperando que se escriba el log
   - Usar `setImmediate()` o sistema de colas (ej: Bull con Redis)
2. **Índices optimizados:** Los índices en `sys_auditoria` aceleran consultas
3. **Campos JSON:** MySQL 5.7+ soporta JSON de forma eficiente, pero evitar consultas complejas sobre estos campos
4. **Auditoría selectiva de LISTAR:** No auditar cada GET de listado, solo operaciones de modificación

### 7.2 Seguridad

**Protección de Datos Sensibles:**
- **NO** guardar contraseñas en `valores_anteriores` o `valores_nuevos`
- Cifrar campos sensibles si es necesario (ej: números de cuenta bancaria)
- Acceso a logs solo para nivel 9 (administradores)

### 7.3 Privacidad

**Cumplimiento con Ley de Protección de Datos (si aplica):**
- Informar a empleados que sus acciones son auditadas
- No almacenar datos personales innecesarios
- Política de retención clara

### 7.4 Escalabilidad

**Crecimiento de la tabla:**
- `sys_auditoria` crecerá rápidamente (millones de registros)
- **Particionamiento por fecha:** Considerar particiones mensuales/anuales en MySQL
- **Archivado:** Mover logs > 1 año a tabla de archivo o almacenamiento externo

### 7.5 Manejo de Errores

**Fallos en auditoría:**
- La auditoría **NO debe bloquear** operaciones críticas
- Si falla `registrarAuditoria()`, loguear en `logger.error()` pero continuar operación
- Implementar circuit breaker si la tabla de auditoría está caída

```javascript
async function registrarAuditoriaSafe(req, accion, descripcion, detalles) {
  try {
    await registrarAuditoria(req, accion, descripcion, detalles);
  } catch (err) {
    logger.error('Fallo al registrar auditoría:', err);
    // No re-lanzar error, continuar operación normal
  }
}
```

---

## 8. RIESGOS Y MITIGACIONES

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| **Rendimiento degradado** | Media | Alto | Escritura asíncrona, índices optimizados, auditoría selectiva |
| **Crecimiento descontrolado de BD** | Alta | Medio | Particionamiento, archivado automático, política de retención |
| **Fallo de auditoría bloquea operaciones** | Baja | Crítico | Manejo de errores robusto, circuit breaker |
| **Datos sensibles expuestos en logs** | Media | Alto | No guardar contraseñas, cifrar campos críticos, acceso restringido |
| **Usuarios rechazan auditoría** | Baja | Medio | Comunicación clara, política de privacidad, cumplimiento legal |

---

## 9. MÉTRICAS DE ÉXITO

### Indicadores Clave:

1. **Cobertura:** 100% de operaciones críticas auditadas
2. **Disponibilidad:** 99.9% uptime del sistema de auditoría
3. **Rendimiento:** Impacto < 5% en tiempo de respuesta de endpoints
4. **Utilidad:** Resolución exitosa de al menos 1 disputa/inconsistencia usando logs
5. **Cumplimiento:** Aprobación en auditoría externa (si aplica)

---

## 10. CRONOGRAMA RESUMIDO

| Fase | Duración | Fechas Estimadas | Entregables Clave |
|------|----------|------------------|-------------------|
| 1 - Fundamentos | 1 semana | Semana 1 | Tabla, modelo, middleware, rutas |
| 2 - Auth/Usuarios | 1 semana | Semana 2 | Login/logout auditado |
| 3 - Empleados | 1 semana | Semana 3 | CRUD empleados auditado |
| 4 - Nóminas | 2 semanas | Semanas 4-5 | Ciclo completo de nómina auditado |
| 5 - Desc/Cred/Vac | 1 semana | Semana 6 | Módulos secundarios auditados |
| 6 - Mantenimientos | 1 semana | Semana 7 | Tablas maestras auditadas |
| 7 - Reportes/Import | 1 semana | Semana 8 | Exportaciones auditadas |
| 8 - Frontend Consulta | 1 semana | Semana 9 | Interfaz de consulta funcional |
| 9 - Dashboard | 1 semana | Semana 10 | Dashboard visual |
| 10 - Pruebas | 1 semana | Semana 11 | Pruebas integrales pasadas |
| 11 - Despliegue | 1 semana | Semana 12 | Sistema en producción |

**Duración Total:** 12 semanas (3 meses)

---

## 11. RECURSOS NECESARIOS

### Humanos:
- 1 Desarrollador Full-Stack (Backend + Frontend)
- 1 DBA (para optimización de BD)
- 1 QA Tester (para pruebas integrales)

### Técnicos:
- Entorno de desarrollo con MySQL 5.7+
- Servidor de staging para pruebas
- Herramientas de monitoreo (ej: New Relic, DataDog)

### Documentación:
- Especificación funcional (este documento)
- Guía de usuario para administradores
- Documentación técnica de APIs

---

## 12. PRESUPUESTO ESTIMADO

*(Ajustar según contexto local)*

- **Desarrollo:** 12 semanas × tasa semanal
- **Infraestructura:** Almacenamiento adicional para logs (estimar 10GB/año)
- **Capacitación:** Material + sesiones de entrenamiento
- **Contingencia:** 15% del total

**Total Estimado:** *[A definir según tarifas locales]*

---

## 13. APÉNDICES

### Apéndice A: Script SQL Completo de Creación de Tablas

```sql
-- Crear tabla principal de auditoría
CREATE TABLE sys_auditoria (
  id_auditoria BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario VARCHAR(50) NOT NULL,
  nombre_completo VARCHAR(200),
  nivel_usuario INT,
  fecha_hora DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  modulo VARCHAR(100) NOT NULL,
  accion VARCHAR(50) NOT NULL,
  descripcion TEXT,
  tabla_afectada VARCHAR(100),
  id_registro VARCHAR(100),
  valores_anteriores JSON,
  valores_nuevos JSON,
  ip_cliente VARCHAR(45),
  user_agent TEXT,
  metodo_http VARCHAR(10),
  url_endpoint VARCHAR(500),
  resultado ENUM('EXITO', 'FALLO') NOT NULL DEFAULT 'EXITO',
  mensaje_error TEXT,
  INDEX idx_usuario (usuario),
  INDEX idx_fecha_hora (fecha_hora),
  INDEX idx_modulo (modulo),
  INDEX idx_accion (accion),
  INDEX idx_tabla_id (tabla_afectada, id_registro),
  INDEX idx_usuario_fecha (usuario, fecha_hora)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla de sesiones (opcional)
CREATE TABLE sys_sesiones_auditoria (
  id_sesion BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario VARCHAR(50) NOT NULL,
  tipo_evento ENUM('LOGIN', 'LOGOUT', 'TOKEN_EXPIRADO', 'SESION_INVALIDA') NOT NULL,
  fecha_hora DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ip_cliente VARCHAR(45),
  user_agent TEXT,
  resultado ENUM('EXITO', 'FALLO') NOT NULL,
  detalle_fallo TEXT,
  INDEX idx_usuario_sesion (usuario),
  INDEX idx_fecha_sesion (fecha_hora)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Apéndice B: Ejemplo de Registro de Auditoría (JSON)

```json
{
  "id_auditoria": 12345,
  "usuario": "admin",
  "nombre_completo": "Juan Pérez",
  "nivel_usuario": 9,
  "fecha_hora": "2025-11-09T14:32:15.123Z",
  "modulo": "NOMINAS",
  "accion": "CERRAR_NOMINA",
  "descripcion": "Nómina cerrada: Quincena 1 - Enero 2025",
  "tabla_afectada": "no_nominas",
  "id_registro": "145",
  "valores_anteriores": {
    "status": 1,
    "total_a_Pagar": 1500000.00
  },
  "valores_nuevos": {
    "status": 0,
    "fecha_cerrada": "2025-11-09T14:32:15",
    "total_a_Pagar": 1500000.00
  },
  "ip_cliente": "192.168.1.100",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
  "metodo_http": "PUT",
  "url_endpoint": "/api/no_nomina/145/cerrar",
  "resultado": "EXITO",
  "mensaje_error": null
}
```

### Apéndice C: Glosario de Acciones por Módulo

*(Ver sección 4.2 "Categorización de Acciones por Módulo")*

---

## 14. CONCLUSIÓN

Este plan de implementación proporciona una guía completa y detallada para desarrollar un **sistema de auditoría robusto** en Ranger Nómina. La implementación en fases permite:

1. **Validación temprana:** Probar la infraestructura en Fase 1 antes de escalar
2. **Priorización:** Auditar primero los módulos críticos (Auth, Nóminas)
3. **Iteración:** Ajustar el enfoque basado en feedback de fases tempranas
4. **Riesgo controlado:** Desplegar gradualmente sin afectar el sistema en producción

**Próximos Pasos:**
1. ✅ Revisar y aprobar este plan
2. ✅ Asignar recursos y equipo
3. ✅ Iniciar Fase 1 con creación de tablas y modelo base
4. ✅ Establecer ceremonias de seguimiento (ej: reunión semanal de avance)

---

**Documento preparado por:** Claude Code
**Fecha de creación:** 2025-11-09
**Versión:** 1.0
**Estado:** Esperando Aprobación
