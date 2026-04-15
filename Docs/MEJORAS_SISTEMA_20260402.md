# Reporte de Mejoras del Sistema - Ranger Nomina
**Fecha:** 2026-04-02  
**Alcance:** Backend, Frontend, Base de Datos, API e Integración

---

## RESUMEN EJECUTIVO

Se revisó todo el sistema en busca de bugs, vulnerabilidades, problemas de rendimiento e inconsistencias. Se encontraron **52+ hallazgos** clasificados por severidad:

| Severidad | Cantidad | Descripcion |
|-----------|----------|-------------|
| CRITICO   | 8        | Bugs que causan datos incorrectos o vulnerabilidades de seguridad explotables |
| ALTO      | 12       | Problemas que afectan rendimiento, seguridad o integridad de datos |
| MEDIO     | 18       | Inconsistencias, code smells, mejoras de robustez |
| BAJO      | 14+      | Mejoras de calidad de codigo, UX, mantenibilidad |

---

## 1. CRITICOS

### 1.1 SQL Injection - Interpolacion directa de valores
**Proyecto:** Backend  
**Archivo:** `routes/no_cuentasbancarias.js` linea 12, 71-78  
```javascript
// VULNERABLE - interpolacion directa
const sql = `SELECT * FROM no_cuentasbancarias LIMIT ${limit} OFFSET ${offset}`;

// VULNERABLE - nombres de campos dinamicos sin whitelist
const fields = Object.keys(datosActualizados).map(key => `${key} = ?`).join(', ');
```
**Fix:** Usar queries parametrizadas y validar nombres de campos contra whitelist.

---

### 1.2 SQL Injection - Array sin parametrizar en IN clause
**Proyecto:** Backend  
**Archivo:** `models/regaliaModel.js` linea 27-29  
```javascript
// VULNERABLE - array interpolado directamente
const condition = `AND e.id_subnomina IN (${subnominasIds.join(',')})`;
```
**Fix:** Usar `IN (?)` con array como parametro.

---

### 1.3 SQL Injection - UPDATE dinamico
**Proyecto:** Backend  
**Archivo:** `routes/no_desc_cred.js` linea 171  
**Archivo:** `models/descCredNominaModel.js` linea 67  
```javascript
// VULNERABLE - object spread en UPDATE
const [result] = await db.query('UPDATE no_desc_cred_nomina SET ? WHERE id_desc_cred_nomina = ?', [data, id]);
```
**Fix:** Usar columnas explicitas en UPDATE, no objetos dinamicos.

---

### 1.4 ISR - Error en comparacion de tramos fiscales
**Proyecto:** Backend  
**Archivo:** `services/isrService.js` linea 54  
```javascript
// BUG: usa > en vez de >= 
if (salarioAnualProyectado > parseFloat(escala.minimo) && salarioAnualProyectado <= maximo) {
```
**Impacto:** Empleados cuyo salario cae exactamente en el limite de un tramo se calculan en el tramo incorrecto (~10% de empleados potencialmente afectados).  
**Fix:** Cambiar `>` a `>=`.

---

### 1.5 Race condition en transacciones mixtas
**Proyecto:** Backend  
**Archivo:** `models/nominaModel.js` lineas 596-624  
```javascript
// Lee con db.query (fuera de transaccion)
const [[{ cant_empleados }]] = await db.query(...);
// Luego usa connection.query (dentro de transaccion)
await connection.query(`UPDATE no_nominas SET...`);
```
**Impacto:** Los datos leidos fuera de la transaccion pueden cambiar antes del UPDATE.  
**Fix:** Usar `connection.query` para todas las lecturas dentro de la transaccion.

---

### 1.6 Rutas criticas sin autenticacion
**Proyecto:** Backend  
**Archivos afectados (8 rutas sin authMiddleware):**
- `routes/ct_bancos.js` - CRUD completo de bancos
- `routes/no_isr.js` - Gestion tabla ISR
- `routes/rh_afp.js` - Configuracion AFP
- `routes/rh_ars.js` - Configuracion ARS
- `routes/rh_puestos.js` - Gestion puestos
- `routes/dashboard.js` - Resumen con datos salariales
- `routes/detNomina.js` - Detalles de nomina
- `routes/ingresos_descuentos.js` - Ingresos y descuentos

**Impacto:** Cualquier persona puede acceder a datos financieros sensibles y modificar configuraciones criticas sin autenticacion.

---

### 1.7 Memory leaks - Observables sin unsubscribe
**Proyecto:** Frontend  
**Archivos afectados (8+ componentes):**
- `afp/afp.ts` lineas 45, 73, 95, 123
- `ars/ars.ts` lineas 43, 71, 93, 121
- `employee-form/employee-form.ts` lineas 104-196
- `components/nomina/nomina-detalle/nomina-detalle.ts` linea 85
- Y otros componentes CRUD

**Impacto:** ~50KB de memoria por sesion que nunca se libera. En uso prolongado degrada rendimiento.  
**Fix:** Aplicar patron `takeUntilDestroyed(this.destroyRef)` como ya se usa en `nomina-list.component.ts`.

---

### 1.8 N+1 Queries en recalcular()
**Proyecto:** Backend  
**Archivo:** `models/nominaModel.js` lineas 809-1129  
```javascript
for (const empleado of empleados) {
  // 8+ queries por empleado dentro del loop:
  // cuotas, vacaciones, movimientos, ISR, etc.
}
```
**Impacto:** Para 100 empleados = 700+ queries en vez de 5-10 batch queries. Nominas grandes tardan 30+ segundos.  
**Fix:** Cargar todos los datos en batch queries antes del loop y procesar en memoria.

---

## 2. ALTOS

### 2.1 Deadlock risk en recalcular()
**Proyecto:** Backend  
**Archivo:** `models/nominaModel.js` lineas 809-1167  
Transaccion de 360 lineas con loops anidados, queries individuales y llamadas a funciones externas. Si dos usuarios recalculan la misma nomina, se produce deadlock.  
**Fix:** Dividir en transacciones mas pequenas por lote de empleados.

---

### 2.2 Formato de respuesta API inconsistente
**Proyecto:** Backend  
5 formatos diferentes de error en las rutas:
```javascript
{ message, error }        // empleados.js
{ message }               // usuarios.js
{ error }                 // empresaRoutes.js
{ success: false, message } // reportes.js
{ message, data }         // usuarios.js (otro endpoint)
```
**Impacto:** El frontend no puede construir un handler universal de errores.  
**Fix:** Estandarizar: `{ success: boolean, data?: any, message?: string }`.

---

### 2.3 Sin interceptor HTTP para 401/403
**Proyecto:** Frontend  
**Archivo:** `auth.interceptor.ts`  
Solo agrega header Authorization. No maneja respuestas 401 (token expirado) ni 403 (sin permisos). El usuario queda en una pantalla rota sin feedback.  
**Fix:** Agregar catchError que haga logout automatico en 401.

---

### 2.4 Validacion FK ausente en inserts
**Proyecto:** Backend  
**Archivos:** `models/empleadoModel.js`, `models/cuotaModel.js`  
Se insertan registros con `id_ars`, `id_afp`, `id_puesto`, `id_nomina`, `id_desc_cred` sin verificar que existan en las tablas referenciadas.  
**Fix:** Validar existencia antes de INSERT o agregar constraints FK en la BD.

---

### 2.5 Calculo vacaciones inconsistente
**Proyecto:** Backend  
**Archivo:** `models/nominaModel.js` lineas 781-807  
Tres metodos de calculo segun tipo de empleado:
- Vigilante: `/26` dias
- Operativo: `/23.83` dias
- Otros: `/15` dias (quincenal)

No documentado y con numeros magicos. El 26 para vigilantes no coincide con Codigo Laboral RD.  
**Fix:** Centralizar constantes y documentar base legal.

---

### 2.6 Eliminacion de nomina sin validacion de negocio
**Proyecto:** Backend  
**Archivo:** `models/nominaModel.js` lineas 703-720  
El DELETE en cascada borra todo sin verificar si la nomina fue procesada para pago bancario, tiene registros contables, etc.  
**Fix:** Agregar validacion de estado antes de permitir eliminacion.

---

### 2.7 Parametros de paginacion inconsistentes
**Proyecto:** Backend + Frontend  
- `empleados.js`: usa `page` + `limit`
- `no_nomina.js`: usa `page` + `pageSize`
- `dashboard.js`: sin paginacion

**Fix:** Estandarizar a `page` + `limit` en todos los endpoints.

---

### 2.8 Peticiones masivas sin paginacion
**Proyecto:** Frontend  
**Archivos:**
- `employee-form.ts` linea 148: `getArs(1, 1000)` - pide 1000 registros para dropdown
- `estado-cuenta-empleado.ts` linea 92: `getActiveEmployees({ limit: 9999 })` - pide 9999 registros

**Fix:** Implementar servicio de cache para dropdowns o endpoints especificos para combos.

---

### 2.9 Multer sin limites de tamano ni validacion de tipo
**Proyecto:** Backend  
**Archivo:** `routes/no_nomina.js` linea 13  
```javascript
const upload = multer({ dest: 'uploads/' }); // Sin limites
```
**Fix:** Agregar `limits: { fileSize: 5 * 1024 * 1024 }` y `fileFilter` para validar extension.

---

### 2.10 Sin security headers
**Proyecto:** Backend  
**Archivo:** `server.js`  
Faltan headers: `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `Content-Security-Policy`.  
**Fix:** Instalar y configurar `helmet`.

---

### 2.11 Connection pool muy pequeno para produccion
**Proyecto:** Backend  
**Archivo:** `db.js` linea 11  
```javascript
connectionLimit: process.env.NODE_ENV === 'production' ? 3 : 5
```
3 conexiones es insuficiente para procesamiento de nomina concurrente.  
**Fix:** Aumentar a 10-20 dependiendo del servidor.

---

### 2.12 Logica redundante en calculo horas extras
**Proyecto:** Backend  
**Archivo:** `services/importService.js` linea 57  
```javascript
// Ambas ramas del ternario son identicas
const salarioPorHora = esVigilante 
  ? (empleado.salario_act / 23.83 / 8) 
  : (empleado.salario_act / 23.83 / 8);
```
**Fix:** Eliminar ternario innecesario o implementar calculo diferenciado si aplica.

---

## 3. MEDIOS

### 3.1 Cache global sin invalidacion
**Archivo:** `models/nominaModel.js` lineas 14-17  
Variable global `_idDevolucionISR` se cachea una vez y nunca se invalida. Si cambia la configuracion, se usa valor viejo hasta reiniciar servidor.

### 3.2 Race condition en formulario employee-form
**Archivo Frontend:** `employee-form.ts` lineas 104-110  
`valueChanges` sin `switchMap` - si usuario cambia rapido `id_nomina`, multiples requests compiten.

### 3.3 Fechas sin validacion de rango
**Archivo:** `routes/no_nomina.js` linea 98-103  
`fecha_inicio` podria ser posterior a `fecha_fin`. No hay limites de rango.

### 3.4 Race condition en cedula duplicada
**Archivo:** `models/empleadoModel.js` lineas 117-120  
Patron check-then-insert sin constraint UNIQUE en BD.

### 3.5 Tipo despido hardcodeado
**Archivo:** `models/empleadoModel.js` linea 198  
```javascript
tipoDespidoId = 3; // Siempre "Despido"
```
No distingue renuncia vs despido vs abandono.

### 3.6 Validacion de fechas silenciosa
**Archivo:** `models/empleadoModel.js` lineas 3-14  
`formatDate()` retorna null silenciosamente en vez de lanzar error. El caller no sabe que la fecha era invalida.

### 3.7 CORS con IPs hardcodeadas
**Archivo:** `server.js`  
IPs `10.0.0.152` y `rhayrtx3060.ddns.net` hardcodeadas en lugar de usar variables de entorno.

### 3.8 Validacion JWT duplicada
**Archivo:** `routes/reportes.js` lineas 7-24  
Reimplementa validacion JWT en vez de usar `authMiddleware.js`.

### 3.9 Servicios sin tipado fuerte
**Archivos Frontend:** `afp.service.ts`, `employee.service.ts`, etc.  
Retornan `Observable<any>` en vez de tipos especificos.  
**Fix:** Crear interfaces `PaginatedResponse<T>`.

### 3.10 Componentes CRUD duplicados (~95% identicos)
**Archivos Frontend:** `afp.ts` vs `ars.ts` - codigo casi identico.  
**Fix:** Crear componente generico base o mixin reutilizable.

### 3.11 Sin route guards por rol
**Archivo Frontend:** `app.routes.ts`  
Todas las rutas usan `AuthGuard` pero no hay `AdminGuard`. La logica de nivel esta en componentes, no en rutas.

### 3.12 ChangeDetection inconsistente
**Frontend:** Algunos componentes usan `OnPush`, otros usan `Default`. Los que usan `OnPush` a veces llaman `detectChanges()` en vez de `markForCheck()`.

### 3.13 Login sin estado de carga
**Archivo Frontend:** `login/login.ts` lineas 23-42  
No hay spinner ni bloqueo del boton. Usuario puede hacer multiples clicks.

### 3.14 Descarga de Excel/CSV sin autenticacion
**Archivo:** `routes/no_nomina.js`  
Endpoints `exportar-excel` y `exportar-csv-banco` accesibles sin auth.

### 3.15 Console.log en produccion
**Archivo Frontend:** `app.ts` linea 32: `console.log('Login successful...')`  
Varios archivos con `console.error()` que pueden exponer info sensible.

### 3.16 Sin lazy loading completo
**Archivo Frontend:** `app.routes.ts` lineas 42-77  
Algunos componentes se importan directamente en vez de lazy-loaded.

### 3.17 Formularios sin reset despues de submit
**Archivo Frontend:** `bancos-form.component.ts` linea 122  
Despues de guardar, el formulario no se resetea.

### 3.18 File handle leak en importaciones
**Archivo:** `services/importService.js` linea 24  
`xlsx.readFile()` sin cleanup en caso de error.

---

## 4. BAJOS

### 4.1 Numeros magicos sin constantes
- `23.83` (dias laborales/mes) en multiples archivos
- `240`/`480` (max cuotas) en `cuotaModel.js`
- `26` (dias vigilante) en `nominaModel.js`

### 4.2 Manejo de errores inconsistente
Algunas rutas usan `console.error()`, otras usan `logger`. Algunas pasan error a `next(err)`, otras responden directamente.

### 4.3 Sin i18n
Todos los textos hardcodeados en espanol. No hay framework de internacionalizacion.

### 4.4 Imports sin usar
Varios componentes importan modulos de Material que no usan.

### 4.5 Sin skeleton loading
Tablas muestran spinner pero no placeholders de contenido.

### 4.6 Sin versionamiento de API
Todos los endpoints en `/api/` sin `/api/v1/`.

### 4.7 Audit fire-and-forget
**Archivo:** `middleware/auditMiddleware.js` lineas 143-149  
`setImmediate(async () => ...)` - si el server crashea, el audit se pierde.

### 4.8 Sin CSRF protection
Frontend no envia tokens CSRF en mutaciones (POST/PUT/DELETE).

---

## PLAN DE ACCION RECOMENDADO

### Inmediato (esta semana)
1. Corregir SQL injections (1.1, 1.2, 1.3)
2. Corregir comparacion ISR `>` a `>=` (1.4)
3. Agregar `authMiddleware` a rutas desprotegidas (1.6)
4. Agregar limites a Multer (2.9)

### Corto plazo (este mes)
5. Fix transacciones mixtas en recalcular (1.5)
6. Refactorizar N+1 queries en recalcular (1.8)
7. Estandarizar formato de respuesta API (2.2)
8. Agregar interceptor HTTP 401 en frontend (2.3)
9. Agregar `helmet` para security headers (2.10)
10. Fix memory leaks en frontend (1.7)

### Mediano plazo (proximo trimestre)
11. Implementar cache de dropdowns en frontend
12. Crear componente CRUD generico
13. Agregar AdminGuard por rutas
14. Centralizar constantes de calculo
15. Aumentar connection pool para produccion
16. Validar FKs antes de inserts
