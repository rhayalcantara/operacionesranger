# Plan: T2.15 - Crear seeds de datos de prueba para maestros

**Fecha**: 2026-01-18
**Tarea padre**: T2.15
**Fase**: Fase 2 - Backend Core
**Estimación**: 2-3 horas
**Sprint**: Sprint 2 - Maestros CRUD (finalizando)

---

## Objetivo

Crear script de seed para cargar datos de prueba realistas de República Dominicana para las tablas maestras del sistema: `clientes`, `ubicaciones`, `puestos` e `incentivos_puesto`. El script debe respetar las relaciones FK, validar NODE_ENV=development, y permitir limpieza opcional de datos existentes con flag `--clean`.

---

## Contexto

### Tareas Previas Completadas

- **T2.07**: CRUD Clientes - Estructura de tabla conocida
- **T2.08**: CRUD Ubicaciones - Relación FK con clientes
- **T2.09**: CRUD Puestos - Relación FK con ubicaciones
- **T2.12**: CRUD Incentivos - Relación FK con puestos

### Scripts de Referencia Existentes

- `scripts/seed-usuarios.ts` (T2.06) - Patrón de estructura, validación NODE_ENV, mensajes
- `scripts/seed-feriados.ts` (Fase 1) - Manejo de BD, transacciones, readline

### Estructura de Tablas

**1. clientes**:
```sql
id, codigo, nombre, ruc, direccion, telefono, email, contacto_nombre, activo, created_at, updated_at
```

**2. ubicaciones**:
```sql
id, cliente_id, codigo, nombre, direccion, provincia, municipio, latitud, longitud, activo, created_at, updated_at
```

**3. puestos**:
```sql
id, ubicacion_id, codigo, nombre, descripcion, cantidad_guardianes, requiere_turno_diurno, requiere_turno_nocturno, activo, created_at, updated_at
```

**4. incentivos_puesto**:
```sql
id, puesto_id, anio, quincena, monto, fecha_inicio, fecha_fin, observaciones, valor_hora (GENERATED), created_at, updated_at
```

---

## Datos de Prueba de República Dominicana

### 3 Clientes (Empresas Contratantes)

**Cliente 1: Banco Popular Dominicano**
```
codigo: BPD001
nombre: Banco Popular Dominicano
ruc: 101234567
direccion: Av. John F. Kennedy No. 20, Piantini
telefono: 809-544-5000
email: seguridad@bpd.com.do
contacto_nombre: María Rodríguez García
```

**Cliente 2: Supermercados Nacional**
```
codigo: NACIO001
nombre: Supermercados Nacional
ruc: 102345678
direccion: Av. 27 de Febrero No. 1762, Ensanche Naco
telefono: 809-566-7777
email: seguridad.corporativa@nacional.com.do
contacto_nombre: Carlos Martínez Pérez
```

**Cliente 3: Centro Comercial Ágora Mall**
```
codigo: AGORA001
nombre: Centro Comercial Ágora Mall
ruc: 103456789
direccion: Av. Abraham Lincoln No. 1000, Piantini
telefono: 809-955-8000
email: seguridad@agoramall.com.do
contacto_nombre: Ana Pérez Santos
```

### 6 Ubicaciones (2 por cliente)

**BPD - Ubicación 1**:
```
codigo: SUC-CENTRO
nombre: Sucursal Centro (Calle El Conde)
direccion: Calle El Conde No. 253, Zona Colonial
provincia: Distrito Nacional
municipio: Santo Domingo de Guzmán
latitud: 18.473611
longitud: -69.885556
```

**BPD - Ubicación 2**:
```
codigo: SUC-NACO
nombre: Sucursal Naco (Av. Tiradentes)
direccion: Av. Tiradentes No. 45, Ensanche Naco
provincia: Distrito Nacional
municipio: Santo Domingo de Guzmán
latitud: 18.475000
longitud: -69.930000
```

**Nacional - Ubicación 1**:
```
codigo: LOPEVEGA
nombre: Nacional Lope de Vega
direccion: Av. Lope de Vega esq. Gustavo Mejía Ricart, Naco
provincia: Distrito Nacional
municipio: Santo Domingo de Guzmán
latitud: 18.478056
longitud: -69.931944
```

**Nacional - Ubicación 2**:
```
codigo: CHURCHILL
nombre: Nacional Churchill
direccion: Av. Winston Churchill No. 88, Piantini
provincia: Distrito Nacional
municipio: Santo Domingo de Guzmán
latitud: 18.482500
longitud: -69.936111
```

**Ágora Mall - Ubicación 1**:
```
codigo: AREACOMERCIAL
nombre: Ágora Mall - Área Comercial
direccion: Av. Abraham Lincoln No. 1000 (Interior), Piantini
provincia: Distrito Nacional
municipio: Santo Domingo de Guzmán
latitud: 18.476389
longitud: -69.932778
```

**Ágora Mall - Ubicación 2**:
```
codigo: ESTACIONAMIENTO
nombre: Ágora Mall - Estacionamientos
direccion: Av. Abraham Lincoln No. 1000 (Sótanos), Piantini
provincia: Distrito Nacional
municipio: Santo Domingo de Guzmán
latitud: 18.476200
longitud: -69.933000
```

### 12 Puestos (2 por ubicación)

**BPD Centro**:
- Puesto 1: `ENTRADA-PRIN` - Entrada Principal - 2 guardianes, 24/7
- Puesto 2: `CAJA-FUERTE` - Caja Fuerte - 1 guardián, 24/7

**BPD Naco**:
- Puesto 3: `ENTRADA-NACO` - Entrada Principal Naco - 2 guardianes, 24/7
- Puesto 4: `ATM-EXTERNO` - Cajeros Automáticos Externos - 1 guardián, 24/7

**Nacional Lope de Vega**:
- Puesto 5: `ESTAC-LOPEV` - Estacionamiento - 1 guardián, 06:00-22:00 (solo diurno y nocturno hasta 22:00)
- Puesto 6: `PISO-VENTAS` - Piso de Ventas - 2 guardianes, 06:00-22:00

**Nacional Churchill**:
- Puesto 7: `ENTRADA-CHURCH` - Entrada Churchill - 2 guardianes, 06:00-22:00
- Puesto 8: `CARGA-DESCARGA` - Área de Carga - 1 guardián, 06:00-18:00 (solo diurno)

**Ágora Mall Área Comercial**:
- Puesto 9: `MALL-ENTRADA-A` - Entrada A (Principal) - 2 guardianes, 06:00-00:00
- Puesto 10: `MALL-CENTRO` - Centro Comercial - 2 guardianes, 06:00-00:00

**Ágora Mall Estacionamientos**:
- Puesto 11: `ESTAC-NIVEL1` - Estacionamiento Nivel 1 - 1 guardián, 06:00-00:00
- Puesto 12: `ESTAC-SOTANO` - Estacionamiento Sótano - 1 guardián, 06:00-00:00

### 5 Incentivos

**Incentivo 1**: BPD Centro - Entrada Principal
```
puesto_id: (dinámico - "ENTRADA-PRIN")
anio: 2026
quincena: 1
fecha_inicio: 2026-01-01
fecha_fin: 2026-01-15
monto: 3600.00
observaciones: Incentivo zona alta peligrosidad - Zona Colonial
```

**Incentivo 2**: BPD Centro - Caja Fuerte
```
puesto_id: (dinámico - "CAJA-FUERTE")
anio: 2026
quincena: 1
fecha_inicio: 2026-01-01
fecha_fin: 2026-01-15
monto: 5400.00
observaciones: Incentivo área crítica - Manejo de efectivo
```

**Incentivo 3**: Ágora Mall - Entrada A
```
puesto_id: (dinámico - "MALL-ENTRADA-A")
anio: 2026
quincena: 1
fecha_inicio: 2026-01-01
fecha_fin: 2026-01-15
monto: 2700.00
observaciones: Incentivo alto flujo de personas
```

**Incentivo 4**: Nacional Lope de Vega - Estacionamiento
```
puesto_id: (dinámico - "ESTAC-LOPEV")
anio: 2026
quincena: 2
fecha_inicio: 2026-01-16
fecha_fin: 2026-01-31
monto: 1800.00
observaciones: Incentivo seguridad vehicular
```

**Incentivo 5**: BPD Naco - Entrada Principal
```
puesto_id: (dinámico - "ENTRADA-NACO")
anio: 2026
quincena: 2
fecha_inicio: 2026-01-16
fecha_fin: 2026-01-31
monto: 3240.00
observaciones: Incentivo zona comercial - Alto tráfico
```

---

## Subtareas

### 1. Crear archivo scripts/seed-maestros.ts
**Descripción**: Script principal con lógica de seed
**Archivos a crear**: `backend/scripts/seed-maestros.ts`
**Estimación**: 90 minutos

**Estructura del script**:
```typescript
// Imports
import { getTurnosPool, closeConnections } from '../src/config/database';
import * as readline from 'readline';

// Interfaces
interface Args { clean: boolean }
interface ClienteData { codigo, nombre, ruc, direccion, telefono, email, contacto_nombre }
interface UbicacionData { ... }
interface PuestoData { ... }
interface IncentivoData { ... }

// Funciones principales
- parseArgs(): Args
- askConfirmation(question: string): Promise<boolean>
- generarClientes(): ClienteData[]
- generarUbicaciones(clienteIds: Map<string, number>): UbicacionData[]
- generarPuestos(ubicacionIds: Map<string, number>): PuestoData[]
- generarIncentivos(puestoIds: Map<string, number>): IncentivoData[]
- insertClientes(data): Promise<Map<string, number>>
- insertUbicaciones(data, clienteIds): Promise<Map<string, number>>
- insertPuestos(data, ubicacionIds): Promise<Map<string, number>>
- insertIncentivos(data, puestoIds): Promise<void>
- cleanDatabase(pool): Promise<void>
- main(): Promise<void>
```

**Validaciones**:
- NODE_ENV !== 'production' (exit 1 si es prod)
- Flag --clean solicita confirmación (readline)
- IDs dinámicos: usar Map<codigo, id> para relaciones FK
- Orden de inserción: clientes → ubicaciones → puestos → incentivos

**Resultado esperado**: Script completo ~600-700 líneas

---

### 2. Implementar lógica de limpieza (--clean flag)
**Descripción**: Eliminar datos existentes con confirmación
**Comando**: `npm run db:seed:maestros -- --clean`
**Estimación**: 15 minutos

**Lógica**:
1. Parsear args: `process.argv` buscar `--clean`
2. Si --clean:
   - Mostrar advertencia
   - Solicitar confirmación con readline (s/n)
   - Si confirmado: DELETE en orden inverso (incentivos → puestos → ubicaciones → clientes)
   - Reportar registros eliminados
3. Si no confirmado: exit(0) sin error

**Queries DELETE**:
```sql
DELETE FROM incentivos_puesto WHERE puesto_id IN (SELECT id FROM puestos WHERE ubicacion_id IN (...))
DELETE FROM puestos WHERE ubicacion_id IN (...)
DELETE FROM ubicaciones WHERE cliente_id IN (...)
DELETE FROM clientes WHERE codigo IN ('BPD001', 'NACIO001', 'AGORA001')
```

---

### 3. Implementar inserción de clientes
**Descripción**: INSERT de 3 clientes con códigos únicos
**Estimación**: 20 minutos

**Lógica**:
```typescript
async function insertClientes(clientes: ClienteData[]): Promise<Map<string, number>> {
  const clienteIds = new Map<string, number>();

  for (const cliente of clientes) {
    try {
      // INSERT IGNORE para evitar duplicados
      const [result] = await pool.query(
        `INSERT IGNORE INTO clientes
         (codigo, nombre, ruc, direccion, telefono, email, contacto_nombre, activo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [cliente.codigo, cliente.nombre, cliente.ruc, cliente.direccion,
         cliente.telefono, cliente.email, cliente.contacto_nombre, true]
      );

      if (result.affectedRows > 0) {
        // Obtener ID insertado
        const id = result.insertId;
        clienteIds.set(cliente.codigo, id);
        console.log(`[SEED] ✓ Cliente: ${cliente.codigo.padEnd(10)} - ${cliente.nombre}`);
      } else {
        // Ya existe, obtener ID
        const [rows] = await pool.query(
          'SELECT id FROM clientes WHERE codigo = ?',
          [cliente.codigo]
        );
        clienteIds.set(cliente.codigo, rows[0].id);
        console.log(`[SEED] ⊗ Cliente: ${cliente.codigo.padEnd(10)} - ${cliente.nombre} (ya existe)`);
      }
    } catch (error) {
      console.error(`[SEED] ✗ Error insertando cliente ${cliente.codigo}:`, error.message);
    }
  }

  return clienteIds;
}
```

**Retorno**: Map con mapeo `codigo → id` para usar en ubicaciones

---

### 4. Implementar inserción de ubicaciones con FK dinámicas
**Descripción**: INSERT de 6 ubicaciones usando clienteIds
**Estimación**: 20 minutos

**Lógica**:
```typescript
async function insertUbicaciones(
  ubicaciones: UbicacionData[],
  clienteIds: Map<string, number>
): Promise<Map<string, number>> {
  const ubicacionIds = new Map<string, number>();

  for (const ubicacion of ubicaciones) {
    const cliente_id = clienteIds.get(ubicacion.cliente_codigo);

    if (!cliente_id) {
      console.error(`[SEED] ✗ Cliente ${ubicacion.cliente_codigo} no encontrado`);
      continue;
    }

    try {
      const [result] = await pool.query(
        `INSERT IGNORE INTO ubicaciones
         (cliente_id, codigo, nombre, direccion, provincia, municipio, latitud, longitud, activo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [cliente_id, ubicacion.codigo, ubicacion.nombre, ubicacion.direccion,
         ubicacion.provincia, ubicacion.municipio, ubicacion.latitud, ubicacion.longitud, true]
      );

      if (result.affectedRows > 0) {
        ubicacionIds.set(ubicacion.codigo, result.insertId);
        console.log(`[SEED] ✓ Ubicación: ${ubicacion.codigo.padEnd(15)} - ${ubicacion.nombre}`);
      } else {
        const [rows] = await pool.query(
          'SELECT id FROM ubicaciones WHERE cliente_id = ? AND codigo = ?',
          [cliente_id, ubicacion.codigo]
        );
        ubicacionIds.set(ubicacion.codigo, rows[0].id);
        console.log(`[SEED] ⊗ Ubicación: ${ubicacion.codigo.padEnd(15)} - ${ubicacion.nombre} (ya existe)`);
      }
    } catch (error) {
      console.error(`[SEED] ✗ Error insertando ubicación ${ubicacion.codigo}:`, error.message);
    }
  }

  return ubicacionIds;
}
```

**Campos importantes**:
- `cliente_id`: Obtenido de Map clienteIds
- `latitud`, `longitud`: Números decimales (DECIMAL 10,8 y 11,8)

---

### 5. Implementar inserción de puestos con FK dinámicas
**Descripción**: INSERT de 12 puestos usando ubicacionIds
**Estimación**: 20 minutos

**Lógica**:
```typescript
async function insertPuestos(
  puestos: PuestoData[],
  ubicacionIds: Map<string, number>
): Promise<Map<string, number>> {
  const puestoIds = new Map<string, number>();

  for (const puesto of puestos) {
    const ubicacion_id = ubicacionIds.get(puesto.ubicacion_codigo);

    if (!ubicacion_id) {
      console.error(`[SEED] ✗ Ubicación ${puesto.ubicacion_codigo} no encontrada`);
      continue;
    }

    try {
      const [result] = await pool.query(
        `INSERT IGNORE INTO puestos
         (ubicacion_id, codigo, nombre, descripcion, cantidad_guardianes,
          requiere_turno_diurno, requiere_turno_nocturno, activo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [ubicacion_id, puesto.codigo, puesto.nombre, puesto.descripcion,
         puesto.cantidad_guardianes, puesto.requiere_turno_diurno,
         puesto.requiere_turno_nocturno, true]
      );

      if (result.affectedRows > 0) {
        puestoIds.set(puesto.codigo, result.insertId);
        console.log(`[SEED] ✓ Puesto: ${puesto.codigo.padEnd(15)} - ${puesto.nombre}`);
      } else {
        const [rows] = await pool.query(
          'SELECT id FROM puestos WHERE ubicacion_id = ? AND codigo = ?',
          [ubicacion_id, puesto.codigo]
        );
        puestoIds.set(puesto.codigo, rows[0].id);
        console.log(`[SEED] ⊗ Puesto: ${puesto.codigo.padEnd(15)} - ${puesto.nombre} (ya existe)`);
      }
    } catch (error) {
      console.error(`[SEED] ✗ Error insertando puesto ${puesto.codigo}:`, error.message);
    }
  }

  return puestoIds;
}
```

**Campos booleanos**:
- `requiere_turno_diurno`: true si requiere cobertura diurna
- `requiere_turno_nocturno`: true si requiere cobertura nocturna

---

### 6. Implementar inserción de incentivos con FK dinámicas
**Descripción**: INSERT de 5 incentivos usando puestoIds
**Estimación**: 20 minutos

**Lógica**:
```typescript
async function insertIncentivos(
  incentivos: IncentivoData[],
  puestoIds: Map<string, number>
): Promise<void> {
  for (const incentivo of incentivos) {
    const puesto_id = puestoIds.get(incentivo.puesto_codigo);

    if (!puesto_id) {
      console.error(`[SEED] ✗ Puesto ${incentivo.puesto_codigo} no encontrado`);
      continue;
    }

    try {
      const [result] = await pool.query(
        `INSERT INTO incentivos_puesto
         (puesto_id, anio, quincena, fecha_inicio, fecha_fin, monto, observaciones)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [puesto_id, incentivo.anio, incentivo.quincena, incentivo.fecha_inicio,
         incentivo.fecha_fin, incentivo.monto, incentivo.observaciones]
      );

      if (result.affectedRows > 0) {
        console.log(`[SEED] ✓ Incentivo: ${incentivo.puesto_codigo.padEnd(15)} - ${incentivo.anio}-Q${incentivo.quincena} - $${incentivo.monto.toFixed(2)}`);
      }
    } catch (error) {
      console.error(`[SEED] ✗ Error insertando incentivo para ${incentivo.puesto_codigo}:`, error.message);
    }
  }
}
```

**Importante**: `valor_hora` NO se inserta - es columna GENERATED STORED calculada automáticamente por MySQL

---

### 7. Agregar script npm en package.json
**Descripción**: Agregar comando `db:seed:maestros`
**Archivo a modificar**: `backend/package.json`
**Estimación**: 5 minutos

**Cambio**:
```json
{
  "scripts": {
    // ... scripts existentes
    "db:seed": "ts-node scripts/seed-feriados.ts",
    "db:seed:usuarios": "ts-node scripts/seed-usuarios.ts",
    "db:seed:maestros": "ts-node scripts/seed-maestros.ts",  // <-- AGREGAR
    "db:examples": "ts-node scripts/query-examples.ts",
    // ... resto
  }
}
```

**Resultado**: Comando disponible `npm run db:seed:maestros`

---

### 8. Documentar en README.md
**Descripción**: Agregar sección de carga de datos maestros
**Archivo a modificar**: `backend/README.md`
**Estimación**: 15 minutos

**Sección a agregar** (después de sección de usuarios):

```markdown
### Cargar Datos Maestros de Prueba

Para facilitar el desarrollo y testing, se incluye un script de seed para cargar datos de prueba realistas de República Dominicana en las tablas maestras.

**Comando básico**:
```bash
npm run db:seed:maestros
```

**Opciones**:
- `--clean`: Eliminar datos existentes antes de cargar (solicita confirmación)

**Ejemplo con limpieza**:
```bash
npm run db:seed:maestros -- --clean
```

**Datos cargados**:

| Entidad | Cantidad | Descripción |
|---------|----------|-------------|
| Clientes | 3 | Banco Popular, Supermercados Nacional, Ágora Mall |
| Ubicaciones | 6 | 2 ubicaciones por cliente (Santo Domingo) |
| Puestos | 12 | 2 puestos por ubicación (Entrada, Caja Fuerte, etc.) |
| Incentivos | 5 | Incentivos quincenales para puestos críticos |

**Datos de clientes**:
1. **Banco Popular Dominicano** (`BPD001`)
   - Sucursal Centro (Zona Colonial)
   - Sucursal Naco (Av. Tiradentes)

2. **Supermercados Nacional** (`NACIO001`)
   - Nacional Lope de Vega
   - Nacional Churchill

3. **Centro Comercial Ágora Mall** (`AGORA001`)
   - Área Comercial
   - Estacionamientos

**Características**:
- ✅ Respeta relaciones FK (clientes → ubicaciones → puestos → incentivos)
- ✅ Datos realistas de empresas dominicanas
- ✅ Coordenadas GPS reales de Santo Domingo
- ✅ RUC en formato correcto (9 dígitos)
- ✅ Teléfonos en formato RD (809-XXX-XXXX)
- ✅ Validación NODE_ENV=development
- ✅ Opción de limpieza con confirmación

**Nota de seguridad**: Este script solo se ejecuta en ambientes de desarrollo. En producción, retorna error.

**Verificar datos cargados**:
```sql
-- Ver clientes
SELECT codigo, nombre, email FROM clientes WHERE codigo IN ('BPD001', 'NACIO001', 'AGORA001');

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
```

---

### 9. Probar script completo
**Descripción**: Ejecutar y validar funcionamiento
**Comando**: `npm run db:seed:maestros`
**Estimación**: 15 minutos

**Pruebas a realizar**:
1. Ejecución básica sin datos existentes
2. Re-ejecución (debe detectar duplicados)
3. Ejecución con `--clean` (confirmar y recargar)
4. Validar IDs dinámicos correctos (queries SQL)
5. Validar valor_hora calculado automáticamente

**Validaciones SQL**:
```sql
-- Verificar 3 clientes
SELECT COUNT(*) FROM clientes WHERE codigo IN ('BPD001', 'NACIO001', 'AGORA001');

-- Verificar 6 ubicaciones con FK correcta
SELECT COUNT(*) FROM ubicaciones u
JOIN clientes c ON u.cliente_id = c.id
WHERE c.codigo IN ('BPD001', 'NACIO001', 'AGORA001');

-- Verificar 12 puestos con FK correcta
SELECT COUNT(*) FROM puestos p
JOIN ubicaciones u ON p.ubicacion_id = u.id
JOIN clientes c ON u.cliente_id = c.id
WHERE c.codigo IN ('BPD001', 'NACIO001', 'AGORA001');

-- Verificar 5 incentivos con valor_hora calculado
SELECT COUNT(*), AVG(valor_hora) FROM incentivos_puesto i
JOIN puestos p ON i.puesto_id = p.id
JOIN ubicaciones u ON p.ubicacion_id = u.id
JOIN clientes c ON u.cliente_id = c.id
WHERE c.codigo IN ('BPD001', 'NACIO001', 'AGORA001');
```

**Resultado esperado**: Todas las queries deben retornar los counts esperados (3, 6, 12, 5)

---

## Criterios de Aceptación (checklist)

- [ ] Script `scripts/seed-maestros.ts` creado
- [ ] Datos realistas de República Dominicana (empresas reales)
- [ ] 3 clientes + 6 ubicaciones + 12 puestos + 5 incentivos creados
- [ ] Relaciones FK correctas (IDs dinámicos con Map)
- [ ] Opción `--clean` funcional con confirmación
- [ ] Solo ejecutable en NODE_ENV=development
- [ ] Uso de transacción para atomicidad (opcional, pero recomendado)
- [ ] Script npm `db:seed:maestros` configurado en package.json
- [ ] README.md actualizado con documentación clara
- [ ] Script probado exitosamente (ejecución manual OK)

---

## Archivos a Generar

- `backend/scripts/seed-maestros.ts` (600-700 líneas) - Script principal
- `docs/completed/T2.15_seed_maestros.md` (400+ líneas) - Documentación de resultado

## Archivos a Modificar

- `backend/package.json` (+1 línea) - Script npm
- `backend/README.md` (+80 líneas) - Documentación de uso

---

## Riesgos y Consideraciones

### Riesgo 1: IDs dinámicos entre inserciones
**Problema**: Los IDs de clientes/ubicaciones/puestos se asignan automáticamente
**Mitigación**: Usar Map<codigo, id> para trackear IDs insertados y usarlos en FK

### Riesgo 2: Duplicados al re-ejecutar
**Problema**: Script se ejecuta múltiples veces, crea duplicados
**Mitigación**: Usar `INSERT IGNORE` y verificar `affectedRows`

### Riesgo 3: Orden de eliminación con --clean
**Problema**: DELETE con FK constraints falla si no se hace en orden inverso
**Mitigación**: Eliminar en orden: incentivos → puestos → ubicaciones → clientes

### Riesgo 4: Ejecución accidental en producción
**Problema**: Seed se ejecuta en producción y corrompe datos
**Mitigación**: Validar `NODE_ENV !== 'production'`, exit(1) si es prod

### Riesgo 5: Coordenadas GPS inválidas
**Problema**: Validación de coordenadas falla si formato incorrecto
**Mitigación**: Usar coordenadas reales verificadas de Santo Domingo (Google Maps)

---

## Notas Adicionales

### Formato RUC en República Dominicana
- 9 dígitos (formato simplificado para testing)
- Formato completo: XXX-XXXXX-X (11 chars con guiones)
- Para seeds, usamos formato sin guiones: "101234567"

### Formato Teléfono RD
- Formato: 809-XXX-XXXX (12 chars con guiones)
- Código de área: 809, 829, 849
- Para empresas en Santo Domingo: mayormente 809

### Coordenadas GPS de Santo Domingo
- Centro ciudad: ~18.486058, -69.931212
- Zona Colonial: ~18.473611, -69.885556
- Piantini/Naco: ~18.475000, -69.930000
- Rango válido: lat 18.4-18.5, lng -69.9 a -70.0

### Orden de Inserción (importante)
1. Clientes (sin FK)
2. Ubicaciones (FK: cliente_id)
3. Puestos (FK: ubicacion_id)
4. Incentivos (FK: puesto_id)

**NUNCA** invertir este orden, o las FK fallarán.

### Uso de Transacciones (opcional)
El script puede usar transacciones para garantizar atomicidad:
```typescript
const connection = await pool.getConnection();
await connection.beginTransaction();
try {
  // ... inserts
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
}
```

Esto asegura que si una inserción falla, se revierten todos los cambios.

---

## Dependencias de Tareas

**Depende de**:
- T2.07 (CRUD Clientes) ✓ Completada
- T2.08 (CRUD Ubicaciones) ✓ Completada
- T2.09 (CRUD Puestos) ✓ Completada
- T2.12 (CRUD Incentivos) ✓ Completada

**Habilita**:
- Testing manual de CRUDs con datos realistas
- Desarrollo de frontend con datos de prueba
- Demos del sistema con datos coherentes

---

## Tiempo Estimado por Subtarea

| Subtarea | Estimación |
|----------|------------|
| 1. Crear archivo scripts/seed-maestros.ts | 90 min |
| 2. Implementar lógica --clean | 15 min |
| 3. Implementar inserción clientes | 20 min |
| 4. Implementar inserción ubicaciones | 20 min |
| 5. Implementar inserción puestos | 20 min |
| 6. Implementar inserción incentivos | 20 min |
| 7. Agregar script npm | 5 min |
| 8. Documentar en README | 15 min |
| 9. Probar script completo | 15 min |
| **TOTAL** | **220 min (3h 40min)** |

**Varianza**: ±20 minutos
**Rango final**: 2h 40min - 4h 0min

---

**Creado**: 2026-01-18
**Responsable**: Subagente T2.15
**Estado**: Listo para ejecución
