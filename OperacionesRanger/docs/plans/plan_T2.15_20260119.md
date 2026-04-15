# Plan de Ejecución - T2.15: Seed Datos Maestros

**Tarea**: T2.15 - Crear seeds de datos de prueba para maestros
**Fecha**: 2026-01-19
**Estimación**: 3h 30min
**Tipo**: Implementación

## Objetivo

Crear script `seed-maestros.ts` para cargar datos de prueba realistas de todas las entidades maestras (Clientes, Ubicaciones, Puestos, Incentivos) con datos reales de República Dominicana.

## Contexto

**Estado actual**:
- Existe script `seed-usuarios.ts` como referencia de patrón
- Existe script `seed-feriados.ts` para feriados
- Todos los CRUDs maestros están implementados (T2.07-T2.12)
- Base de datos operacional con esquema completo

**Datos a crear**:
1. **Clientes** (3): Banco Popular, Supermercados Nacional, Ágora Mall
2. **Ubicaciones** (5-6): 2 por cliente con direcciones reales de RD
3. **Puestos** (10-12): 2-3 por ubicación con nombres descriptivos
4. **Incentivos** (3-5): Incentivos para diferentes puestos

## Análisis de Dependencias

**Tablas involucradas**:
```
clientes (tabla raíz)
  ↓
ubicaciones (FK: cliente_id)
  ↓
puestos (FK: ubicacion_id)
  ↓
incentivos_puesto (FK: puesto_id)
```

**Orden de inserción obligatorio**:
1. Clientes (sin dependencias)
2. Ubicaciones (requiere cliente_id)
3. Puestos (requiere ubicacion_id)
4. Incentivos (requiere puesto_id)

**Restricciones**:
- Solo ejecutable en `NODE_ENV=development`
- No debe ejecutarse en producción
- Debe validar conexión DB antes de insertar
- Opción `--clean` para limpiar datos previos

## Plan de Implementación

### Paso 1: Análisis de Scripts Existentes (30min)

**Archivos a revisar**:
- `backend/scripts/seed-usuarios.ts` (patrón de referencia)
- `backend/scripts/seed-feriados.ts` (patrón alternativo)
- `backend/src/config/database.ts` (conexión DB)
- `backend/src/config/env.ts` (validación NODE_ENV)

**Patrones a extraer**:
- Estructura del script (imports, funciones, main)
- Manejo de conexiones DB
- Validación de entorno (development only)
- Manejo de errores y logging
- Formato de salida (colores, mensajes)

### Paso 2: Diseño de Datos de Prueba (1h)

**Clientes (3)**:
```typescript
const clientes = [
  {
    codigo: 'BP001',
    nombre: 'Banco Popular Dominicano',
    rnc: '101-02224-3',
    telefono: '809-544-5000',
    email: 'contacto@bpd.com.do',
    direccion: 'Av. John F. Kennedy No. 20, Ens. Miraflores, Santo Domingo',
    contacto_principal: 'María Pérez',
    activo: true
  },
  {
    codigo: 'SN001',
    nombre: 'Supermercados Nacional',
    rnc: '101-91897-7',
    telefono: '809-566-7777',
    email: 'info@nacional.com.do',
    direccion: 'Av. 27 de Febrero esq. Tiradentes, Santo Domingo',
    contacto_principal: 'Carlos Martínez',
    activo: true
  },
  {
    codigo: 'AM001',
    nombre: 'Ágora Mall',
    rnc: '130-26847-9',
    telefono: '809-955-6200',
    email: 'administracion@agoramall.com.do',
    direccion: 'Av. Abraham Lincoln No. 1000, Santo Domingo',
    contacto_principal: 'Ana Rodríguez',
    activo: true
  }
];
```

**Ubicaciones (6)** - 2 por cliente:
```typescript
const ubicaciones = [
  // Banco Popular (2)
  {
    codigo: 'BP-SD-001',
    nombre: 'Sucursal Casa Matriz',
    direccion: 'Av. John F. Kennedy No. 20, Ens. Miraflores, Santo Domingo',
    provincia: 'Distrito Nacional',
    municipio: 'Santo Domingo',
    telefono: '809-544-5000',
    activo: true
    // cliente_id: se asigna dinámicamente
  },
  {
    codigo: 'BP-STG-001',
    nombre: 'Sucursal Santiago',
    direccion: 'Calle del Sol No. 56, Santiago de los Caballeros',
    provincia: 'Santiago',
    municipio: 'Santiago',
    telefono: '809-583-2000',
    activo: true
  },
  // Supermercados Nacional (2)
  {
    codigo: 'SN-NV-001',
    nombre: 'Nacional Naco',
    direccion: 'Av. Tiradentes esq. Roberto Pastoriza, Naco, Santo Domingo',
    provincia: 'Distrito Nacional',
    municipio: 'Santo Domingo',
    telefono: '809-566-7788',
    activo: true
  },
  {
    codigo: 'SN-BP-001',
    nombre: 'Nacional Blue Mall',
    direccion: 'Av. Winston Churchill, Blue Mall, Piantini, Santo Domingo',
    provincia: 'Distrito Nacional',
    municipio: 'Santo Domingo',
    telefono: '809-566-7799',
    activo: true
  },
  // Ágora Mall (2)
  {
    codigo: 'AM-E1-001',
    nombre: 'Ágora Mall - Entrada Principal',
    direccion: 'Av. Abraham Lincoln No. 1000, Santo Domingo',
    provincia: 'Distrito Nacional',
    municipio: 'Santo Domingo',
    telefono: '809-955-6201',
    activo: true
  },
  {
    codigo: 'AM-PK-001',
    nombre: 'Ágora Mall - Estacionamiento',
    direccion: 'Av. Abraham Lincoln No. 1000, Parqueo Nivel C, Santo Domingo',
    provincia: 'Distrito Nacional',
    municipio: 'Santo Domingo',
    telefono: '809-955-6202',
    activo: true
  }
];
```

**Puestos (12)** - 2-3 por ubicación:
```typescript
const puestos = [
  // BP-SD-001: Casa Matriz (3 puestos)
  { codigo: 'BP-SD-001-REC', nombre: 'Recepción Principal', descripcion: 'Control de acceso entrada principal', turno_requerido: 'DIURNO', activo: true },
  { codigo: 'BP-SD-001-BOV', nombre: 'Bóveda', descripcion: 'Vigilancia de bóveda bancaria', turno_requerido: 'AMBOS', activo: true },
  { codigo: 'BP-SD-001-PK', nombre: 'Parqueo', descripcion: 'Control de estacionamiento', turno_requerido: 'NOCTURNO', activo: true },

  // BP-STG-001: Santiago (2 puestos)
  { codigo: 'BP-STG-001-REC', nombre: 'Recepción', descripcion: 'Control de acceso principal', turno_requerido: 'DIURNO', activo: true },
  { codigo: 'BP-STG-001-ATM', nombre: 'Cajeros ATM', descripcion: 'Vigilancia zona de cajeros', turno_requerido: 'AMBOS', activo: true },

  // SN-NV-001: Nacional Naco (2 puestos)
  { codigo: 'SN-NV-001-ENT', nombre: 'Entrada Principal', descripcion: 'Control de acceso clientes', turno_requerido: 'AMBOS', activo: true },
  { codigo: 'SN-NV-001-ALM', nombre: 'Almacén', descripcion: 'Vigilancia zona de carga/descarga', turno_requerido: 'NOCTURNO', activo: true },

  // SN-BP-001: Nacional Blue Mall (2 puestos)
  { codigo: 'SN-BP-001-ENT', nombre: 'Entrada Tienda', descripcion: 'Control acceso supermercado', turno_requerido: 'AMBOS', activo: true },
  { codigo: 'SN-BP-001-CAJ', nombre: 'Área de Cajas', descripcion: 'Supervisión zona de pago', turno_requerido: 'DIURNO', activo: true },

  // AM-E1-001: Ágora Entrada (2 puestos)
  { codigo: 'AM-E1-001-ACC', nombre: 'Control de Acceso', descripcion: 'Puerta principal del mall', turno_requerido: 'AMBOS', activo: true },
  { codigo: 'AM-E1-001-INFO', nombre: 'Información', descripcion: 'Punto de información y seguridad', turno_requerido: 'DIURNO', activo: true },

  // AM-PK-001: Ágora Parqueo (1 puesto)
  { codigo: 'AM-PK-001-CAB', nombre: 'Cabina Parqueo', descripcion: 'Control vehicular nivel C', turno_requerido: 'NOCTURNO', activo: true }
];
```

**Incentivos (5)** - Diferentes montos y períodos:
```typescript
const incentivos = [
  // Incentivo para bóveda (alto riesgo)
  { monto: 5000.00, quincena: 1, anio: 2026, observaciones: 'Incentivo por vigilancia de bóveda', activo: true }, // BP-SD-001-BOV

  // Incentivo para entrada mall (alto tráfico)
  { monto: 3000.00, quincena: 1, anio: 2026, observaciones: 'Incentivo por alto flujo de visitantes', activo: true }, // AM-E1-001-ACC

  // Incentivo para turno nocturno almacén
  { monto: 3500.00, quincena: 1, anio: 2026, observaciones: 'Incentivo nocturno almacén', activo: true }, // SN-NV-001-ALM

  // Incentivo para cajeros ATM
  { monto: 2500.00, quincena: 2, anio: 2026, observaciones: 'Incentivo por seguridad ATM', activo: true }, // BP-STG-001-ATM

  // Incentivo general área de cajas
  { monto: 2000.00, quincena: 2, anio: 2026, observaciones: 'Incentivo supervisión cajas', activo: true } // SN-BP-001-CAJ
];
```

### Paso 3: Implementación del Script (1h 30min)

**Archivo**: `backend/scripts/seed-maestros.ts`

**Estructura del script**:
```typescript
// 1. Imports
import { turnosPool } from '../src/config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// 2. Interfaces TypeScript
interface Cliente { codigo: string; nombre: string; /* ... */ }
interface Ubicacion { codigo: string; nombre: string; /* ... */ }
// ...

// 3. Datos de prueba (constantes)
const clientes: Omit<Cliente, 'id'>[] = [ /* ... */ ];
const ubicaciones: Omit<Ubicacion, 'id' | 'cliente_id'>[] = [ /* ... */ ];
// ...

// 4. Funciones auxiliares
async function limpiarDatos(): Promise<void> { /* ... */ }
async function insertarClientes(): Promise<number[]> { /* ... */ }
async function insertarUbicaciones(clienteIds: number[]): Promise<number[]> { /* ... */ }
async function insertarPuestos(ubicacionIds: number[]): Promise<number[]> { /* ... */ }
async function insertarIncentivos(puestoIds: number[]): Promise<void> { /* ... */ }

// 5. Función principal
async function seedMaestros(clean: boolean = false): Promise<void> { /* ... */ }

// 6. Ejecución CLI
if (require.main === module) { /* ... */ }
```

**Validaciones a implementar**:
- Verificar `NODE_ENV === 'development'` antes de ejecutar
- Verificar conexión a base de datos antes de insertar
- Orden correcto de inserción (Clientes → Ubicaciones → Puestos → Incentivos)
- Capturar IDs generados para asignar FKs
- Manejo de errores con rollback si es necesario

**Logging y UX**:
- Usar colores (chalk o console colors)
- Mostrar progreso: "✓ 3 clientes creados", "✓ 6 ubicaciones creadas", etc.
- Mostrar IDs generados para referencia
- Advertencias claras si se usa `--clean`

### Paso 4: Actualización de package.json (15min)

**Agregar comando**:
```json
{
  "scripts": {
    "db:seed:maestros": "tsx scripts/seed-maestros.ts",
    "db:seed:maestros:clean": "tsx scripts/seed-maestros.ts --clean"
  }
}
```

### Paso 5: Documentación (30min)

**Actualizar README.md** (sección Database Setup Commands):
```markdown
### Seed Data Commands

# Load holiday data
npm run db:seed              # Load 2026 holidays

# Load master data (clients, locations, posts, incentives)
npm run db:seed:maestros     # Append test data
npm run db:seed:maestros:clean  # Clean before loading (⚠️ deletes existing data)
```

**Crear archivo de resultado**: `docs/completed/T2.15_seed_maestros.md`

**Contenido del resultado**:
- Descripción del script implementado
- Estructura de datos creados
- Comandos de uso
- Ejemplos de salida
- Advertencias y consideraciones
- Código completo del script

### Paso 6: Actualización de Estado (15min)

**Actualizar**: `docs/tasks/tareas_fase2_backend_core_20260118.md`

```markdown
- [✓] **T2.15** - Crear seeds de datos de prueba para maestros (3h 30min) ✅ 2026-01-19
```

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Violación de FKs por orden incorrecto | Media | Alto | Respetar orden estricto: Clientes → Ubicaciones → Puestos → Incentivos |
| Ejecución accidental en producción | Baja | Crítico | Validación obligatoria `NODE_ENV === 'development'` |
| Datos duplicados en múltiples ejecuciones | Media | Medio | Opción `--clean` opcional, mensajes claros al usuario |
| IDs hardcodeados en lugar de dinámicos | Media | Alto | Capturar `insertId` de cada INSERT y usar para FKs |

## Criterios de Aceptación

- [ ] Script `seed-maestros.ts` funcional y ejecutable
- [ ] Datos de prueba realistas (direcciones, RNC, teléfonos de RD)
- [ ] Relaciones FK correctas (cliente_id, ubicacion_id, puesto_id)
- [ ] Solo ejecutable en `NODE_ENV=development` (validación estricta)
- [ ] Opción `--clean` implementada y documentada
- [ ] Comando `npm run db:seed:maestros` agregado a package.json
- [ ] Documentación completa en README.md
- [ ] Archivo de resultado `T2.15_seed_maestros.md` creado
- [ ] Estado de tarea actualizado a [✓] Completada

## Entregables

1. **Código**:
   - `backend/scripts/seed-maestros.ts` (script completo)
   - `backend/package.json` (comando agregado)

2. **Documentación**:
   - `docs/completed/T2.15_seed_maestros.md` (resultado detallado)
   - `backend/README.md` (sección actualizada)

3. **Tracking**:
   - `docs/tasks/tareas_fase2_backend_core_20260118.md` (estado actualizado)

## Estimación Detallada

| Fase | Tiempo Estimado |
|------|-----------------|
| Análisis de scripts existentes | 30min |
| Diseño de datos de prueba | 1h |
| Implementación del script | 1h 30min |
| Actualización package.json | 15min |
| Documentación | 30min |
| Actualización de estado | 15min |
| **TOTAL** | **4h** |

## Notas de Implementación

- **Patrón de referencia**: Seguir estructura de `seed-usuarios.ts` existente
- **Datos reales**: Usar RNCs, direcciones y teléfonos reales de empresas dominicanas reconocidas
- **Colores en terminal**: Considerar usar `chalk` o códigos ANSI para mejor UX
- **Manejo de errores**: Capturar errores de DB y mostrar mensajes claros
- **Testing manual**: NO ejecutar automáticamente (requiere DB configurada)

---

**Fecha creación**: 2026-01-19
**Autor**: Claude (Subagent)
**Estado**: Aprobado para ejecución
