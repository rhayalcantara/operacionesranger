# Plan de Implementación - Regalía Pascual

**Fecha:** 2025-01-23
**Estado:** En Progreso (Backend completado, Frontend pendiente)

---

## 📋 Resumen del Progreso Actual

### ✅ Backend - COMPLETADO

#### 1. Migración SQL (`backend-ranger-nomina/migrations/001_add_regalia_pascual.sql`)
- ✅ Tabla `no_regalia_calculada` para almacenar cálculos por empleado y año
- ✅ Tabla `no_regalia_auditoria` para auditar cambios manuales
- ✅ Vista `vw_regalia_empleados` para consultas rápidas con JOINs
- ✅ Procedimiento almacenado `sp_calcular_regalia_sin_historial`
- ✅ Función `fn_tiene_historial_nomina`
- ✅ Tipo de nómina "Regalia Pascual" con periodo ANUAL
- ✅ Registro en tabla de auditoría `no_auditoria`

**Estado:** Archivo creado, **PENDIENTE EJECUCIÓN EN BASE DE DATOS**

---

#### 2. Modelo de Regalía (`backend-ranger-nomina/models/regaliaModel.js`)

**Métodos Implementados:**

##### Cálculo de Regalía
- ✅ `calcularPreview(anio, idTipoNomina, subnominasIds)` - Preview de cálculos para todos los empleados
- ✅ `_calcularRegaliaEmpleado(connection, idEmpleado, anio, datosEmpleado)` - Cálculo individual
- ✅ `_tieneHistorialNomina(connection, idEmpleado, anio)` - Verificación de historial
- ✅ `_calcularConHistorial(connection, idEmpleado, anio, salarioActual)` - Cálculo con nóminas cerradas
- ✅ `_calcularSinHistorial(connection, idEmpleado, anio, datosEmpleado)` - Cálculo proporcional
- ✅ `_calcularMesesLaborados(fechaInicio, fechaFin)` - Cálculo de meses trabajados

##### Persistencia y Ajustes
- ✅ `guardarCalculos(calculosPreview, anio, idNomina)` - Guardar cálculos en BD
- ✅ `ajustarMonto(idEmpleado, anio, montoNuevo, usuario, motivo)` - Ajuste manual con auditoría

##### Consultas
- ✅ `getHistorialPorAnio(anio, idTipoNomina)` - Historial de regalías por año
- ✅ `getCalculosPorNomina(idNomina)` - Cálculos de una nómina específica
- ✅ `getTipoNominaRegalia()` - Obtener tipo de nómina de Regalía

##### Validaciones
- ✅ `validarCreacionNomina(anio)` - Validar fecha límite (antes del 20 dic) y año

**Lógica de Cálculo:**

**Con Historial:**
```
Fórmula: (suma_sueldos_cerrados + diciembre_estimado) / 12
- Suma todos los sueldo_nomina de nóminas cerradas del año
- Si diciembre no está cerrado, estima con salario_act
- Siempre devuelve meses_laborados = 12
```

**Sin Historial:**
```
Fórmula: (salario_actual * meses_laborados) / 12
- Calcula meses desde fecha_ingreso hasta 31/dic/año
- Usa salario_act como referencia
- Proporcional para empleados nuevos
```

---

#### 3. Rutas API (`backend-ranger-nomina/routes/regalia.js`)

**Endpoints Implementados:**

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/regalia/calcular-preview` | Calcula preview para todos los empleados |
| POST | `/api/regalia/crear-nomina` | Crea nómina de Regalía Pascual |
| PUT | `/api/regalia/ajustar-monto` | Ajusta monto manualmente con auditoría |
| GET | `/api/regalia/historial/:anio` | Obtiene historial por año (filtrable por tipo) |
| GET | `/api/regalia/nomina/:id_nomina` | Obtiene cálculos de una nómina específica |
| GET | `/api/regalia/tipo-nomina` | Obtiene tipo de nómina de Regalía |
| POST | `/api/regalia/validar-creacion` | Valida si se puede crear nómina para un año |

**Características:**
- ✅ Middleware de auditoría aplicado
- ✅ Validaciones de parámetros requeridos
- ✅ Validación de fecha límite (20 dic)
- ✅ Logging con Winston
- ✅ Manejo de errores con `next(err)`

---

#### 4. Modificaciones a `nominaModel.js`

**Cambios Realizados:**

##### Detección de Regalía
```javascript
const esNominaRegalia = tipo_nomina_desc &&
  tipo_nomina_desc.toLowerCase().includes('regalia');
```

##### Bypass de Descuentos de Ley
- ✅ **AFP**: NO aplica si `esNominaRegalia === true`
- ✅ **SFS/ARS**: NO aplica si `esNominaRegalia === true`
- ✅ **ISR**: Exento según Código Laboral RD Art. 219

##### Nuevo Método
```javascript
static async updateDetNominaCustom(idNomina, idEmpleado, campos)
```
- Permite actualizar campos específicos de `no_det_nomina`
- Usado para nóminas especiales como Regalía

**Líneas Modificadas:**
- `nominaModel.js:714` - Obtener `tipo_nomina_desc`
- `nominaModel.js:723` - Variable `esNominaRegalia`
- `nominaModel.js:860-916` - Bypass AFP/SFS si es Regalía
- `nominaModel.js:938-942` - Bypass ISR si es Regalía
- `nominaModel.js:1104-1133` - Método `updateDetNominaCustom()`

---

#### 5. Modificaciones a `server.js`

**Cambios:**
```javascript
const regaliaRoutes = require('./routes/regalia');
app.use('/api/regalia', regaliaRoutes);
```

**Líneas Modificadas:**
- `server.js:198` - Import de regaliaRoutes
- `server.js:223` - Registro de ruta `/api/regalia`

---

### 🔄 Frontend - EN PROGRESO

#### ✅ Servicio Angular (`rangernomina-frontend/src/app/services/regalia.service.ts`)

**Interfaces TypeScript:**
- ✅ `PreviewRegalia` - Datos de preview por empleado
- ✅ `PreviewRegaliaResponse` - Respuesta de preview
- ✅ `CrearNominaRegaliaRequest` - Request para crear nómina
- ✅ `CrearNominaRegaliaResponse` - Respuesta de creación
- ✅ `AjustarMontoRequest` - Request para ajuste manual
- ✅ `HistorialRegalia` - Datos de historial
- ✅ `HistorialRegaliaResponse` - Respuesta de historial
- ✅ `ValidacionCreacionResponse` - Respuesta de validación

**Métodos del Servicio:**
- ✅ `calcularPreview(anio, idTipoNomina, subnominasIds)` → `Observable<PreviewRegaliaResponse>`
- ✅ `crearNominaRegalia(request)` → `Observable<CrearNominaRegaliaResponse>`
- ✅ `ajustarMonto(request)` → `Observable<{success, message}>`
- ✅ `getHistorialPorAnio(anio, idTipoNomina?)` → `Observable<HistorialRegaliaResponse>`
- ✅ `getCalculosPorNomina(idNomina)` → `Observable<{success, id_nomina, cantidad, calculos}>`
- ✅ `getTipoNominaRegalia()` → `Observable<{id_nomina, descripcion, periodo_pago}>`
- ✅ `validarCreacion(anio)` → `Observable<ValidacionCreacionResponse>`

---

### ⏳ Pendiente - Frontend

#### 1. Componente Angular de Regalía Pascual
**Archivos a Crear:**
- `src/app/regalia/regalia.component.ts` - Lógica del componente
- `src/app/regalia/regalia.component.html` - Template
- `src/app/regalia/regalia.component.css` - Estilos
- `src/app/regalia/regalia.component.spec.ts` - Tests

**Funcionalidades Requeridas:**

##### Vista 1: Calcular Regalía (Preview)
- Formulario de entrada:
  - [ ] Campo año (selector o input numérico)
  - [ ] Selector de tipo de nómina (Admin/Operaciones)
  - [ ] Multi-select de subnóminas (opcional)
  - [ ] Botón "Calcular Preview"
- Tabla de resultados:
  - [ ] Mostrar empleados con cálculos
  - [ ] Columnas: Cédula, Nombre, Salario Actual, Meses Laborados, Promedio Salarial, Monto Calculado, Método (HISTORIAL/SIN_HISTORIAL)
  - [ ] Permitir edición manual de montos (inline edit)
  - [ ] Totalizador de monto total de regalía
  - [ ] Botón "Crear Nómina" (solo si hay resultados)

##### Vista 2: Historial de Regalías
- Filtros:
  - [ ] Selector de año
  - [ ] Filtro por tipo de nómina (opcional)
  - [ ] Botón "Buscar"
- Tabla de historial:
  - [ ] Columnas: Empleado, Año, Meses Lab., Promedio Salarial, Monto Calculado, Monto Ajustado, Monto Final, Editado Manualmente, Fecha Cálculo, Estado Nómina
  - [ ] Indicador visual si fue editado manualmente
  - [ ] Enlace a nómina asociada (si existe)
  - [ ] Paginación con MatPaginator

##### Vista 3: Detalle de Nómina de Regalía
- [ ] Integración con componente de detalle de nómina existente
- [ ] Mostrar información específica de Regalía
- [ ] Indicar que está exenta de AFP, SFS, ISR

**Componentes de UI:**
- [ ] Angular Material components (MatTable, MatPaginator, MatSelect, MatFormField, etc.)
- [ ] Validaciones reactivas con FormBuilder
- [ ] Notificaciones con NotificationService
- [ ] Loading spinner durante cálculos
- [ ] Dialogs de confirmación para crear nómina
- [ ] Snackbar para feedback de acciones

---

#### 2. Integración con Menú de Navegación

**Archivo a Modificar:**
- `src/app/navmenu/navmenu.component.ts`

**Cambios Requeridos:**
```typescript
{
  label: 'Regalía Pascual',
  icon: 'card_giftcard', // o 'celebration'
  route: '/regalia',
  requiredLevel: 9 // Solo admin puede crear Regalía
}
```

**Módulo de Routing:**
- Archivo: `src/app/app-routing.module.ts` (o equivalente)
- Agregar ruta:
```typescript
{
  path: 'regalia',
  component: RegaliaComponent,
  canActivate: [AuthGuard]
}
```

---

#### 3. Validaciones Frontend

**Validaciones a Implementar:**
- [ ] Año no puede ser futuro
- [ ] Año no puede ser anterior a existencia de empresa
- [ ] Fecha actual no puede ser después del 20 de diciembre para año actual
- [ ] Tipo de nómina es requerido
- [ ] Montos ajustados no pueden ser negativos
- [ ] Título de nómina es requerido al crear
- [ ] Preview debe tener al menos 1 empleado para crear nómina

---

#### 4. Testing Frontend

**Tests a Crear:**
- [ ] Servicio `RegaliaService`:
  - [ ] Mock de HttpClient
  - [ ] Verificar llamadas a endpoints correctos
  - [ ] Verificar transformación de parámetros
- [ ] Componente `RegaliaComponent`:
  - [ ] Renderizado de formulario
  - [ ] Validaciones de campos
  - [ ] Llamada a servicio al calcular preview
  - [ ] Renderizado de tabla de resultados
  - [ ] Funcionalidad de edición inline
  - [ ] Creación de nómina
  - [ ] Navegación a detalle de nómina creada

---

## 🎯 Lista de Tareas

### ✅ FASE 1: Implementación Base - COMPLETADA

#### Preparación Base de Datos
- [x] **Tarea 1:** Ejecutar migración SQL `001_add_regalia_pascual.sql` en base de datos ✅
- [x] **Corrección:** Re-ejecutar migración en base de datos `nomina` (correcta) ✅
- [x] **Corrección:** Corregir cálculo con historial (problema de quincenas) ✅

#### Componente Angular
- [x] **Tarea 2:** Crear estructura de componente Angular de Regalía Pascual ✅
- [x] **Tarea 3:** Implementar formulario de cálculo de preview ✅
- [x] **Tarea 4:** Implementar tabla de resultados de preview con edición inline ✅
- [x] **Tarea 5:** Implementar funcionalidad de creación de nómina ✅
- [x] **Tarea 6:** Implementar vista de historial de regalías ✅
- [x] **Tarea 7:** Implementar integración con detalle de nómina ✅

#### Integración y Navegación
- [x] **Tarea 8:** Agregar ruta de Regalía al menú de navegación ✅
- [x] **Tarea 9:** Configurar routing en app.routes.ts ✅
- [x] **Tarea 10:** Aplicar AuthGuard y validación de nivel de usuario ✅
- [x] **Corrección:** Convertir componente a standalone ✅
- [x] **Corrección:** Corregir imports de servicios ✅
- [x] **Corrección:** Corregir binding de tabs ✅

#### Testing y Validación
- [x] **Tarea 11:** Probar flujo completo end-to-end ✅
  - [x] Calcular preview ✅
  - [x] Editar montos manualmente ✅
  - [x] Crear nómina ✅
  - [x] Verificar que no aplica AFP/SFS/ISR ✅
- [x] **Tarea 12:** Verificar validaciones de fecha límite (20 dic) ✅
- [x] **Tarea 13:** Verificar cálculo con historial vs sin historial ✅

---

### 🔄 FASE 2: Importación de Historial Salarial - PENDIENTE

**Objetivo:** Permitir importar salarios mensuales desde Excel para empleados sin historial de nóminas

**Documento de Referencia:** `FORMATO_HISTORIAL_SALARIAL_REGALIA.md`

#### Base de Datos
- [ ] **Tarea 2.1:** Crear migración SQL para tabla `no_regalia_historial_importado`
- [ ] **Tarea 2.2:** Ejecutar migración en base de datos `nomina`

#### Backend
- [ ] **Tarea 2.3:** Implementar método `_obtenerHistorialImportado()` en `regaliaModel.js`
- [ ] **Tarea 2.4:** Implementar método `_calcularConHistorialImportado()` en `regaliaModel.js`
- [ ] **Tarea 2.5:** Modificar método `_calcularRegaliaEmpleado()` para verificar historial importado
- [ ] **Tarea 2.6:** Crear servicio `importarHistorialSalarial()` usando `exceljs`
- [ ] **Tarea 2.7:** Crear endpoint POST `/api/regalia/importar-historial`
- [ ] **Tarea 2.8:** Implementar validaciones de archivo Excel
- [ ] **Tarea 2.9:** Agregar auditoría de importaciones

#### Frontend
- [ ] **Tarea 2.10:** Crear botón "Importar Historial Salarial" en UI
- [ ] **Tarea 2.11:** Implementar dialog de selección de archivo Excel
- [ ] **Tarea 2.12:** Mostrar resultados de importación (éxitos/errores)
- [ ] **Tarea 2.13:** Agregar chip "Historial Importado" (azul) en tabla
- [ ] **Tarea 2.14:** Crear botón "Descargar Plantilla Excel"

#### Testing
- [ ] **Tarea 2.15:** Probar importación con archivo válido
- [ ] **Tarea 2.16:** Probar validaciones (cédula inválida, salarios negativos)
- [ ] **Tarea 2.17:** Verificar cálculo con historial importado vs nóminas cerradas
- [ ] **Tarea 2.18:** Verificar reemplazo de historial existente

#### Documentación
- [ ] **Tarea 2.19:** Crear plantilla Excel descargable
- [ ] **Tarea 2.20:** Actualizar CLAUDE.md con nueva funcionalidad
- [ ] **Tarea 2.21:** Documentar endpoint en plan

---

### 📊 Prioridad de Métodos de Cálculo (FASE 2)

1. **Primera Prioridad:** Nóminas cerradas en el sistema
2. **Segunda Prioridad:** Historial importado desde Excel
3. **Tercera Prioridad:** Cálculo proporcional desde fecha de ingreso

---

### 🎨 Chips de Método (FASE 2)

- 🟢 **Con Historial** - Tiene nóminas cerradas
- 🔵 **Historial Importado** - Usa archivo Excel importado *(NUEVO)*
- 🟠 **Sin Historial** - Cálculo proporcional desde ingreso

---

## 📚 Referencias Legales

### Código Laboral República Dominicana - Artículo 219

**Regalía Pascual:**
- Monto: 1/12 del salario ordinario del año
- Fecha de pago: Antes del 20 de diciembre
- Exenciones tributarias:
  - ✅ Exenta de AFP
  - ✅ Exenta de SFS/ARS
  - ✅ Exenta de ISR (hasta 1/12 de salarios ordinarios)
- **NO incluye:**
  - ❌ Horas extras
  - ❌ Bonificaciones extraordinarias
  - ❌ Comisiones variables

**Cálculo:**
- Empleados con historial completo: Promedio de salarios base del año
- Empleados nuevos: Proporcional desde fecha de ingreso

---

## 🔐 Consideraciones de Seguridad

- ✅ Middleware de auditoría aplicado en todas las rutas
- ✅ Registro en `no_regalia_auditoria` para cambios manuales
- ✅ Registro en `no_auditoria` para operaciones del sistema
- ✅ Validación de nivel de usuario en frontend (nivel 9 requerido)
- ✅ AuthGuard en ruta de Regalía
- ✅ Validación de parámetros en backend
- ✅ Transacciones SQL para operaciones críticas
- ✅ Constraint UNIQUE (id_empleado, anio) evita duplicados

---

## 🚀 Próximos Pasos Inmediatos

1. **AHORA:** Ejecutar migración SQL en base de datos
2. **SIGUIENTE:** Crear componente Angular de Regalía
3. **LUEGO:** Integrar con menú y routing
4. **FINALMENTE:** Testing end-to-end completo

---

## 📝 Notas Adicionales

### Base de Datos
- Conexión: `localhost`
- Usuario: `root`
- Base de datos: `db_aae4a2_ranger`
- Comando para ejecutar migración:
```bash
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -pRHoss.1234 db_aae4a2_ranger < backend-ranger-nomina/migrations/001_add_regalia_pascual.sql
```

### Estructura de Archivos Creados

**Backend:**
```
backend-ranger-nomina/
├── migrations/
│   └── 001_add_regalia_pascual.sql ✅
├── models/
│   ├── regaliaModel.js ✅
│   └── nominaModel.js (modificado) ✅
├── routes/
│   └── regalia.js ✅
└── server.js (modificado) ✅
```

**Frontend:**
```
rangernomina-frontend/
└── src/app/
    └── services/
        └── regalia.service.ts ✅
```

---

**Última Actualización:** 2025-01-23
**Estado General:** Backend 100% - Frontend 100% - **FASE 1 COMPLETA** ✅
**Próximo Hito:** FASE 2 - Importación de Historial Salarial desde Excel
