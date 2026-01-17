# Plan de Implementación: Exportación CSV Bancaria

**Fecha de Creación:** 2025-10-15
**Versión:** 1.0
**Autor:** Claude Code
**Estado:** Planificación

---

## 1. Objetivo

Implementar funcionalidad para generar y exportar archivos CSV con los datos de nómina formateados para el envío al **Banco de Reservas**, permitiendo la automatización del proceso de pago de nómina.

---

## 2. Alcance

### 2.1 Funcionalidades a Implementar

- **Backend**: Endpoint REST para generar CSV con datos bancarios de una nómina específica
- **Backend**: Método en modelo de nómina para ejecutar query SQL y formatear datos en CSV
- **Frontend**: Servicio para consumir endpoint de exportación
- **Frontend**: Botón en listado de nóminas para descargar CSV
- **Frontend**: Lógica para descarga automática del archivo en el navegador

### 2.2 Restricciones

- Solo disponible para nóminas **cerradas** (estado = 0)
- Requiere datos completos en tabla `rh_emplado_nomina` (snapshot histórico)
- Formato CSV estándar con separación por comas
- Codificación UTF-8 para soportar caracteres especiales

---

## 3. Análisis de Datos

### 3.1 Query SQL Base

```sql
SELECT
  en.id_empleado empleado,
  en.ula_empleado cedula,
  concat(en.nombres,' ',en.apellidos) nombre,
  'BANCO DE RESERVAS' banco,
  en.cuentabancario cuenta_empleado,
  dn.total_pagar,
  n.titulo_nomina nomina,
  d.descripcion departamento,
  'PRINCIPAL' SUCURSAL,
  '10101010' CUENTA_BANCO_DESTINO,
  '6' VERIFICACDOS,
  '100011620002172' NUMEROCLIENTE,
  '1622172' CUENTA_BANCO_ORIGEN,
  n.id_nominas CODIGO_NOMINA,
  '2' tipo_cuenta_empleado,
  ' ' email,
  'CE' TIPO_IDENTIFICACION,
  'BRRDDOSD' SWIFT
FROM rh_emplado_nomina en
INNER JOIN no_nominas n ON en.id_nomina = n.id_nominas
INNER JOIN rh_empleado e ON en.id_empleado = e.id_empleado
INNER JOIN rh_puestos p ON e.id_puesto = p.idpuestos
INNER JOIN rh_departamentos d ON p.iddepartamento = d.id_departamentos
INNER JOIN no_det_nomina dn ON en.id_nomina = dn.id_nomina AND en.id_empleado = dn.id_empleado
WHERE n.id_nominas = ?
ORDER BY en.id_empleado
```

### 3.2 Tablas Involucradas

| Tabla | Descripción | Campos Utilizados |
|-------|-------------|-------------------|
| `rh_emplado_nomina` | Snapshot histórico de empleados en nómina cerrada | `id_empleado`, `ula_empleado`, `nombres`, `apellidos`, `cuentabancario` |
| `no_nominas` | Encabezado de nómina | `id_nominas`, `titulo_nomina` |
| `rh_empleado` | Datos actuales de empleados | `id_empleado`, `id_puesto` |
| `rh_puestos` | Puestos de trabajo | `idpuestos`, `iddepartamento` |
| `rh_departamentos` | Departamentos | `id_departamentos`, `descripcion` |
| `no_det_nomina` | Detalle de nómina | `id_nomina`, `id_empleado`, `total_pagar` |

### 3.3 Campos de Salida CSV

| Campo | Tipo | Fuente | Descripción |
|-------|------|--------|-------------|
| empleado | INT | `en.id_empleado` | ID interno del empleado |
| cedula | VARCHAR | `en.ula_empleado` | Cédula/RNC del empleado |
| nombre | VARCHAR | CONCAT | Nombre completo del empleado |
| banco | VARCHAR | Constante | Nombre del banco (BANCO DE RESERVAS) |
| cuenta_empleado | VARCHAR | `en.cuentabancario` | Cuenta bancaria del empleado |
| total_pagar | DECIMAL | `dn.total_pagar` | Monto neto a pagar |
| nomina | VARCHAR | `n.titulo_nomina` | Título de la nómina |
| departamento | VARCHAR | `d.descripcion` | Departamento del empleado |
| SUCURSAL | VARCHAR | Constante | Sucursal del banco |
| CUENTA_BANCO_DESTINO | VARCHAR | Constante | Cuenta destino del banco |
| VERIFICACDOS | VARCHAR | Constante | Código de verificación |
| NUMEROCLIENTE | VARCHAR | Constante | Número de cliente bancario |
| CUENTA_BANCO_ORIGEN | VARCHAR | Constante | Cuenta origen de la empresa |
| CODIGO_NOMINA | INT | `n.id_nominas` | ID de la nómina |
| tipo_cuenta_empleado | VARCHAR | Constante | Tipo de cuenta (2 = ahorro) |
| email | VARCHAR | Constante | Email (vacío) |
| TIPO_IDENTIFICACION | VARCHAR | Constante | Tipo de identificación (CE = Cédula) |
| SWIFT | VARCHAR | Constante | Código SWIFT del banco |

---

## 4. Arquitectura de la Solución

### 4.1 Flujo de Datos

```
┌─────────────┐
│   Usuario   │
│  (Frontend) │
└──────┬──────┘
       │ 1. Clic botón "CSV Banco"
       │
       ▼
┌─────────────────────┐
│ NominaListComponent │
│  exportarCSVBanco() │
└──────────┬──────────┘
           │ 2. Llama servicio
           │
           ▼
┌─────────────────┐
│ NominaService   │
│ exportarCSVBanco│
│ (id: number)    │
└────────┬────────┘
         │ 3. HTTP GET /api/no_nomina/:id/exportar-csv-banco
         │
         ▼
┌────────────────────┐
│   Backend Router   │
│ no_nomina.js       │
└─────────┬──────────┘
          │ 4. Llama modelo
          │
          ▼
┌──────────────────────┐
│   NominaModel        │
│ generarCSVBanco(id)  │
└──────────┬───────────┘
           │ 5. Ejecuta query SQL
           │
           ▼
┌────────────────────┐
│   MySQL Database   │
│ Tablas: rh_emplado_│
│ nomina, no_nominas,│
│ rh_empleado, etc.  │
└─────────┬──────────┘
          │ 6. Retorna datos
          │
          ▼
┌──────────────────────┐
│   NominaModel        │
│ Formatea como CSV    │
└──────────┬───────────┘
           │ 7. Retorna string CSV
           │
           ▼
┌────────────────────┐
│   Backend Router   │
│ Envía respuesta    │
│ Content-Type: CSV  │
└─────────┬──────────┘
          │ 8. HTTP Response (Blob)
          │
          ▼
┌─────────────────┐
│ NominaService   │
│ Recibe Blob     │
└────────┬────────┘
         │ 9. Retorna Observable<Blob>
         │
         ▼
┌─────────────────────┐
│ NominaListComponent │
│ Crea descarga       │
│ automática          │
└──────────┬──────────┘
           │ 10. Descarga archivo
           │
           ▼
┌─────────────┐
│   Usuario   │
│ Guarda CSV  │
└─────────────┘
```

### 4.2 Componentes Afectados

**Backend:**
- `backend-ranger-nomina/routes/no_nomina.js` - Nuevo endpoint
- `backend-ranger-nomina/models/nominaModel.js` - Nuevo método estático

**Frontend:**
- `rangernomina-frontend/src/app/nomina/nomina.service.ts` - Nuevo método
- `rangernomina-frontend/src/app/nomina/nomina-list.component.ts` - Nueva función
- `rangernomina-frontend/src/app/nomina/nomina-list.component.html` - Nuevo botón

---

## 5. Especificación Técnica

### 5.1 Backend - Endpoint REST

**Archivo:** `backend-ranger-nomina/routes/no_nomina.js`
**Línea de inserción:** ~337 (después del último endpoint)

```javascript
// GET CSV export for bank payroll
router.get('/:id/exportar-csv-banco', async (req, res, next) => {
  const { id } = req.params;
  try {
    const csvData = await Nomina.generarCSVBanco(id);

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="nomina_banco_${id}.csv"`);

    // Send CSV data
    res.send(csvData);

    logger.info(`CSV bancario generado exitosamente. ID Nómina: ${id}`);
  } catch (err) {
    logger.error(`Error al generar CSV bancario. ID Nómina: ${id}. Error: ${err.message}`);
    next(err);
  }
});
```

**Características:**
- **Método HTTP:** GET
- **Ruta:** `/api/no_nomina/:id/exportar-csv-banco`
- **Parámetros:** `id` (número) - ID de la nómina
- **Respuesta exitosa:** 200 OK con contenido CSV
- **Respuesta error:** 404/500 con mensaje JSON
- **Headers de respuesta:**
  - `Content-Type: text/csv; charset=utf-8`
  - `Content-Disposition: attachment; filename="nomina_banco_{id}.csv"`

### 5.2 Backend - Modelo de Datos

**Archivo:** `backend-ranger-nomina/models/nominaModel.js`
**Línea de inserción:** Al final de la clase `Nomina`

```javascript
/**
 * Genera archivo CSV con datos bancarios para una nómina específica
 * @param {number} id_nomina - ID de la nómina
 * @returns {Promise<string>} - Contenido del archivo CSV
 * @throws {Error} Si no se encuentran empleados o hay error de BD
 */
static async generarCSVBanco(id_nomina) {
  const connection = await pool.getConnection();
  try {
    // Query SQL para obtener datos bancarios
    const query = `
      SELECT
        en.id_empleado empleado,
        en.ula_empleado cedula,
        concat(en.nombres,' ',en.apellidos) nombre,
        'BANCO DE RESERVAS' banco,
        en.cuentabancario cuenta_empleado,
        dn.total_pagar,
        n.titulo_nomina nomina,
        d.descripcion departamento,
        'PRINCIPAL' SUCURSAL,
        '10101010' CUENTA_BANCO_DESTINO,
        '6' VERIFICACDOS,
        '100011620002172' NUMEROCLIENTE,
        '1622172' CUENTA_BANCO_ORIGEN,
        n.id_nominas CODIGO_NOMINA,
        '2' tipo_cuenta_empleado,
        ' ' email,
        'CE' TIPO_IDENTIFICACION,
        'BRRDDOSD' SWIFT
      FROM rh_emplado_nomina en
      INNER JOIN no_nominas n ON en.id_nomina = n.id_nominas
      INNER JOIN rh_empleado e ON en.id_empleado = e.id_empleado
      INNER JOIN rh_puestos p ON e.id_puesto = p.idpuestos
      INNER JOIN rh_departamentos d ON p.iddepartamento = d.id_departamentos
      INNER JOIN no_det_nomina dn ON en.id_nomina = dn.id_nomina AND en.id_empleado = dn.id_empleado
      WHERE n.id_nominas = ?
      ORDER BY en.id_empleado
    `;

    const [rows] = await connection.execute(query, [id_nomina]);

    if (!rows || rows.length === 0) {
      throw new Error('No se encontraron empleados para esta nómina.');
    }

    // Generar CSV (separado por comas)
    const headers = Object.keys(rows[0]);
    let csvContent = headers.join(',') + '\n';

    rows.forEach(row => {
      const values = headers.map(header => {
        let value = row[header];

        // Escape commas and quotes in values
        if (value === null || value === undefined) {
          value = '';
        } else {
          value = String(value);
          // If value contains comma, newline, or quote, wrap in quotes
          if (value.includes(',') || value.includes('\n') || value.includes('"')) {
            value = '"' + value.replace(/"/g, '""') + '"';
          }
        }
        return value;
      });

      csvContent += values.join(',') + '\n';
    });

    return csvContent;
  } catch (error) {
    logger.error(`Error al generar CSV bancario: ${error.message}`);
    throw error;
  } finally {
    connection.release();
  }
}
```

**Características:**
- **Tipo:** Método estático asíncrono
- **Parámetros:** `id_nomina` (number)
- **Retorno:** Promise<string> con contenido CSV
- **Manejo de errores:** Lanza excepción si no hay datos o error de BD
- **Escape de caracteres:** Maneja comas, comillas y saltos de línea en valores
- **Connection pool:** Usa y libera conexión de forma segura

### 5.3 Frontend - Servicio Angular

**Archivo:** `rangernomina-frontend/src/app/nomina/nomina.service.ts`
**Línea de inserción:** ~66 (después del método `importarHorasExtras`)

```typescript
/**
 * Descarga archivo CSV bancario para una nómina
 * @param id - ID de la nómina
 * @returns Observable<Blob> - Archivo CSV como blob
 */
exportarCSVBanco(id: number): Observable<Blob> {
  return this.http.get(`${this.apiUrl}/${id}/exportar-csv-banco`, {
    responseType: 'blob'
  });
}
```

**Características:**
- **Tipo:** Método de instancia
- **Parámetros:** `id` (number) - ID de la nómina
- **Retorno:** `Observable<Blob>` - Archivo binario para descarga
- **Response Type:** `blob` (necesario para archivos binarios)

### 5.4 Frontend - Componente Lista

**Archivo:** `rangernomina-frontend/src/app/nomina/nomina-list.component.ts`
**Línea de inserción:** ~57 (después del método `deleteNomina`)

```typescript
/**
 * Exporta CSV bancario para una nómina específica
 * @param id - ID de la nómina
 */
exportarCSVBanco(id: number): void {
  this.nominaService.exportarCSVBanco(id).subscribe({
    next: (blob) => {
      // Crear URL temporal para el blob
      const url = window.URL.createObjectURL(blob);

      // Crear elemento <a> temporal para descargar
      const link = document.createElement('a');
      link.href = url;
      link.download = `nomina_banco_${id}.csv`;
      link.click();

      // Limpiar URL temporal
      window.URL.revokeObjectURL(url);
    },
    error: (error) => {
      console.error('Error al exportar CSV bancario:', error);
      alert('Error al generar el archivo CSV. Por favor, intente nuevamente.');
    }
  });
}
```

**Características:**
- **Tipo:** Método público del componente
- **Parámetros:** `id` (number) - ID de la nómina
- **Funcionalidad:**
  1. Llama al servicio para obtener Blob
  2. Crea URL temporal del blob
  3. Crea elemento `<a>` con descarga automática
  4. Simula clic para iniciar descarga
  5. Limpia URL temporal para liberar memoria
  6. Maneja errores con alert al usuario

### 5.5 Frontend - Template HTML

**Archivo:** `rangernomina-frontend/src/app/nomina/nomina-list.component.html`
**Línea de modificación:** ~45-49 (columna de acciones en tabla)

**Código actual:**
```html
<td>
  <button mat-raised-button color="primary" [routerLink]="['/nominas/detalles', nomina.id_nominas]">Ver Detalles</button>
  <button mat-raised-button color="accent" [routerLink]="['/nominas/edit', nomina.id_nominas]" [disabled]="nomina.status === 0">Editar</button>
  <button mat-raised-button color="warn" (click)="deleteNomina(nomina.id_nominas)" [disabled]="nomina.status === 0">Eliminar</button>
</td>
```

**Código modificado:**
```html
<td>
  <button mat-raised-button color="primary" [routerLink]="['/nominas/detalles', nomina.id_nominas]">Ver Detalles</button>
  <button mat-raised-button color="accent" [routerLink]="['/nominas/edit', nomina.id_nominas]" [disabled]="nomina.status === 0">Editar</button>
  <button mat-raised-button color="warn" (click)="deleteNomina(nomina.id_nominas)" [disabled]="nomina.status === 0">Eliminar</button>

  <!-- NUEVO: Botón para exportar CSV bancario -->
  <button mat-raised-button
          style="background-color: #4CAF50; color: white; margin-left: 8px;"
          (click)="exportarCSVBanco(nomina.id_nominas)"
          [disabled]="nomina.status !== 0"
          matTooltip="Solo disponible para nóminas cerradas">
    <mat-icon>download</mat-icon>
    CSV Banco
  </button>
</td>
```

**Características del botón:**
- **Color:** Verde (#4CAF50) para diferenciarlo de otros botones
- **Icono:** `download` (Material Icons)
- **Estado:** Solo habilitado cuando `nomina.status === 0` (cerrada)
- **Tooltip:** Explica restricción de nóminas cerradas
- **Espaciado:** Margen izquierdo de 8px

---

## 6. Consideraciones de Seguridad

### 6.1 Autenticación y Autorización

- **JWT Token:** Verificar que el endpoint requiere autenticación (middleware existente)
- **Permisos de usuario:** Considerar restricción por nivel de usuario (nivel 9 = admin)
- **Validación de ID:** Sanitizar parámetro `id_nomina` para prevenir SQL injection

### 6.2 Protección de Datos

- **Datos sensibles:** El CSV contiene información financiera y personal
- **HTTPS:** Asegurar que producción use HTTPS para transmisión segura
- **Logs:** No registrar contenido completo del CSV en logs (solo metadatos)

### 6.3 SQL Injection Prevention

- **Prepared statements:** El código usa `connection.execute(query, [id_nomina])` con parámetros
- **Validación de entrada:** Express valida tipos automáticamente en rutas

---

## 7. Formato del Archivo CSV

### 7.1 Estructura

```
empleado,cedula,nombre,banco,cuenta_empleado,total_pagar,nomina,departamento,SUCURSAL,CUENTA_BANCO_DESTINO,VERIFICACDOS,NUMEROCLIENTE,CUENTA_BANCO_ORIGEN,CODIGO_NOMINA,tipo_cuenta_empleado,email,TIPO_IDENTIFICACION,SWIFT
1,001-1234567-8,Juan Perez,BANCO DE RESERVAS,1234567890,45000.00,Nomina Enero 2025,Administracion,PRINCIPAL,10101010,6,100011620002172,1622172,1,2, ,CE,BRRDDOSD
2,001-7654321-9,Maria Rodriguez,BANCO DE RESERVAS,9876543210,38000.00,Nomina Enero 2025,Ventas,PRINCIPAL,10101010,6,100011620002172,1622172,1,2, ,CE,BRRDDOSD
```

### 7.2 Reglas de Formato

1. **Separador:** Coma (`,`)
2. **Encoding:** UTF-8
3. **Línea de cabecera:** Incluida (nombres de columnas)
4. **Escape de valores:**
   - Si un valor contiene coma, comillas o salto de línea → encerrar entre comillas dobles
   - Si un valor contiene comillas dobles → duplicarlas (`""`)
5. **Valores nulos:** Representados como string vacío
6. **Números decimales:** Formato estándar con punto decimal

### 7.3 Ejemplo con Escape

```csv
empleado,nombre,total_pagar
1,"Perez, Juan",45000.00
2,"Maria ""La Jefa"" Rodriguez",38000.00
```

---

## 8. Pruebas

### 8.1 Casos de Prueba

| ID | Caso de Prueba | Entrada | Resultado Esperado |
|----|----------------|---------|-------------------|
| TC-01 | Exportar CSV de nómina cerrada válida | `id_nomina = 1`, estado = cerrado | Descarga archivo CSV con todos los empleados |
| TC-02 | Intentar exportar CSV de nómina abierta | `id_nomina = 2`, estado = abierto | Botón deshabilitado en UI |
| TC-03 | Exportar CSV de nómina sin empleados | `id_nomina = 3`, sin empleados | Error 500: "No se encontraron empleados" |
| TC-04 | Exportar CSV con nómina inexistente | `id_nomina = 9999` | Error 404 o 500 con mensaje apropiado |
| TC-05 | Verificar escape de caracteres especiales | Nombre con coma: "Pérez, Juan" | Valor entre comillas en CSV |
| TC-06 | Verificar encoding UTF-8 | Nombres con tildes y ñ | Caracteres correctos en archivo |
| TC-07 | Verificar montos decimales | `total_pagar = 12345.67` | Formato con 2 decimales |
| TC-08 | Probar con nómina grande | 100+ empleados | CSV completo sin truncamiento |

### 8.2 Pruebas Manuales

**Paso a Paso:**

1. **Preparar datos de prueba:**
   ```sql
   -- Verificar que existe una nómina cerrada
   SELECT id_nominas, titulo_nomina, estado FROM no_nominas WHERE estado = 'Cerrada';
   ```

2. **Iniciar aplicación:**
   ```bash
   # Terminal 1 - Backend
   cd backend-ranger-nomina
   npm start

   # Terminal 2 - Frontend
   cd rangernomina-frontend
   npm start
   ```

3. **Acceder al listado:**
   - Navegar a: `http://localhost:4200/nominas`
   - Login con usuario de prueba

4. **Probar exportación:**
   - Identificar nómina cerrada (badge rojo "Cerrada")
   - Verificar que botón "CSV Banco" está habilitado
   - Clic en botón "CSV Banco"
   - Verificar descarga automática del archivo

5. **Validar archivo:**
   - Abrir archivo en Excel/LibreOffice Calc
   - Verificar estructura de columnas
   - Verificar datos de empleados
   - Verificar caracteres especiales (tildes, ñ)
   - Verificar montos decimales

6. **Probar restricciones:**
   - Intentar con nómina abierta (botón debe estar deshabilitado)
   - Hover sobre botón deshabilitado (tooltip debe aparecer)

### 8.3 Pruebas Automatizadas (Opcional)

**Archivo de prueba:** `backend-ranger-nomina/tests/nomina-csv.test.js`

```javascript
const request = require('supertest');
const app = require('../app');

describe('CSV Bancario Export', () => {
  it('Debe generar CSV para nómina cerrada válida', async () => {
    const res = await request(app)
      .get('/api/no_nomina/1/exportar-csv-banco')
      .expect('Content-Type', /csv/)
      .expect(200);

    expect(res.text).toContain('empleado,cedula,nombre');
    expect(res.text).toContain('BANCO DE RESERVAS');
  });

  it('Debe retornar error para nómina inexistente', async () => {
    await request(app)
      .get('/api/no_nomina/99999/exportar-csv-banco')
      .expect(500);
  });
});
```

---

## 9. Configuración de Datos Bancarios

### 9.1 Datos Hardcoded Actuales

```javascript
'BANCO DE RESERVAS'       // banco
'PRINCIPAL'               // SUCURSAL
'10101010'                // CUENTA_BANCO_DESTINO
'6'                       // VERIFICACDOS
'100011620002172'         // NUMEROCLIENTE
'1622172'                 // CUENTA_BANCO_ORIGEN
'2'                       // tipo_cuenta_empleado (2 = ahorro)
' '                       // email (vacío)
'CE'                      // TIPO_IDENTIFICACION (Cédula)
'BRRDDOSD'                // SWIFT
```

### 9.2 Mejora Futura: Parametrización (Opcional)

**Crear tabla de configuración:**

```sql
CREATE TABLE no_config_banco (
  id INT PRIMARY KEY AUTO_INCREMENT,
  banco VARCHAR(100) NOT NULL,
  sucursal VARCHAR(50),
  cuenta_banco_destino VARCHAR(50),
  numero_cliente VARCHAR(50),
  cuenta_banco_origen VARCHAR(50),
  swift VARCHAR(20),
  activo BOOLEAN DEFAULT TRUE,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Ventajas:**
- Permite múltiples bancos
- Configuración sin modificar código
- Auditoría de cambios

---

## 10. Logging y Auditoría

### 10.1 Eventos a Registrar

| Evento | Nivel | Información |
|--------|-------|-------------|
| CSV generado exitosamente | INFO | `id_nomina`, usuario, timestamp, cantidad de registros |
| Error al generar CSV | ERROR | `id_nomina`, mensaje de error, stack trace |
| Nómina sin empleados | WARN | `id_nomina` |
| Nómina no encontrada | WARN | `id_nomina` solicitado |

### 10.2 Formato de Logs

```javascript
logger.info(`CSV bancario generado exitosamente. ID Nómina: ${id}, Empleados: ${rows.length}, Usuario: ${req.user?.username}`);

logger.error(`Error al generar CSV bancario. ID Nómina: ${id}. Error: ${err.message}`);
```

---

## 11. Documentación de Usuario

### 11.1 Manual de Usuario (Sección a agregar)

**Título:** Exportación de Nómina al Banco

**Pasos:**

1. Acceder al módulo "Gestión de Nóminas"
2. Localizar la nómina deseada en la lista
3. Verificar que la nómina esté en estado **"Cerrada"**
4. Hacer clic en el botón verde **"CSV Banco"** en la columna de acciones
5. El archivo se descargará automáticamente como `nomina_banco_X.csv`
6. Abrir el archivo en Excel para verificar los datos
7. Enviar el archivo al banco según el procedimiento establecido

**Notas importantes:**
- Solo las nóminas cerradas pueden ser exportadas
- El archivo contiene información sensible - manejar con cuidado
- Verificar siempre los montos antes de enviar al banco

### 11.2 Solución de Problemas

| Problema | Causa | Solución |
|----------|-------|----------|
| Botón "CSV Banco" deshabilitado | Nómina no está cerrada | Cerrar la nómina primero |
| Error al descargar archivo | Nómina sin empleados | Verificar que la nómina tenga empleados |
| Caracteres raros en archivo | Encoding incorrecto | Abrir con UTF-8 en Excel |
| Archivo vacío | Error de permisos o BD | Contactar soporte técnico |

---

## 12. Cronograma de Implementación

| Fase | Tarea | Duración Estimada | Responsable |
|------|-------|------------------|-------------|
| 1 | Implementación Backend - Modelo | 1 hora | Desarrollador |
| 2 | Implementación Backend - Ruta | 30 minutos | Desarrollador |
| 3 | Implementación Frontend - Servicio | 30 minutos | Desarrollador |
| 4 | Implementación Frontend - Componente | 1 hora | Desarrollador |
| 5 | Implementación Frontend - Template | 30 minutos | Desarrollador |
| 6 | Pruebas Funcionales | 1 hora | QA/Desarrollador |
| 7 | Pruebas con Datos Reales | 1 hora | Usuario final |
| 8 | Ajustes y Correcciones | 1 hora | Desarrollador |
| 9 | Documentación de Usuario | 30 minutos | Desarrollador |
| 10 | Despliegue a Producción | 30 minutos | DevOps |

**Total estimado:** 7.5 horas

---

## 13. Checklist de Implementación

### Backend
- [ ] Agregar método `generarCSVBanco(id_nomina)` en `nominaModel.js`
- [ ] Agregar endpoint `GET /:id/exportar-csv-banco` en `no_nomina.js`
- [ ] Configurar headers de respuesta correctamente (Content-Type, Content-Disposition)
- [ ] Implementar manejo de errores y validaciones
- [ ] Agregar logs de auditoría
- [ ] Probar endpoint con Postman/Thunder Client

### Frontend
- [ ] Agregar método `exportarCSVBanco(id: number)` en `nomina.service.ts`
- [ ] Agregar método `exportarCSVBanco(id: number)` en `nomina-list.component.ts`
- [ ] Agregar botón "CSV Banco" en `nomina-list.component.html`
- [ ] Configurar condición de deshabilitación del botón
- [ ] Agregar tooltip explicativo
- [ ] Implementar descarga automática de archivo
- [ ] Implementar manejo de errores con feedback al usuario

### Pruebas
- [ ] Probar con nómina cerrada válida
- [ ] Probar con nómina abierta (botón deshabilitado)
- [ ] Probar con nómina sin empleados
- [ ] Probar con caracteres especiales (tildes, ñ, comas en nombres)
- [ ] Probar con números decimales
- [ ] Verificar encoding UTF-8
- [ ] Probar en diferentes navegadores (Chrome, Firefox, Edge)

### Documentación
- [ ] Actualizar este plan con hallazgos de implementación
- [ ] Crear/actualizar manual de usuario
- [ ] Documentar en CHANGELOG.md
- [ ] Agregar comentarios JSDoc en código

### Despliegue
- [ ] Commit de cambios con mensaje descriptivo
- [ ] Push a repositorio
- [ ] Probar en ambiente de staging
- [ ] Desplegar a producción
- [ ] Verificar funcionamiento en producción

---

## 14. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Datos bancarios hardcoded incorrectos | Media | Alto | Validar con banco antes de producción |
| Caracteres especiales mal codificados | Baja | Medio | Usar UTF-8 explícitamente, probar con datos reales |
| Archivo CSV demasiado grande | Baja | Bajo | Query ordenado, sin límite (se asume <1000 empleados) |
| Usuario descarga CSV de nómina equivocada | Media | Alto | Incluir nombre de nómina en archivo, confirmación visual |
| Nómina cerrada sin datos en `rh_emplado_nomina` | Baja | Alto | Validar integridad del proceso de cierre |
| Error de permisos de usuario | Baja | Medio | Verificar middleware de autenticación |

---

## 15. Mejoras Futuras

### Fase 2 (Opcional)
1. **Parametrización de datos bancarios:** Crear tabla de configuración
2. **Múltiples formatos:** Soportar diferentes bancos con formatos distintos
3. **Validación bancaria:** Validar cuentas bancarias con algoritmo Luhn
4. **Email automático:** Enviar CSV por email al departamento de contabilidad
5. **Historial de exportaciones:** Registrar quién y cuándo exportó cada CSV
6. **Firma digital:** Agregar firma digital al archivo para no repudio

### Fase 3 (Avanzado)
1. **API bancaria directa:** Integración directa con API del banco
2. **Confirmación de pago:** Recibir confirmación del banco y actualizar estado
3. **Dashboard de pagos:** Visualización de estado de pagos en tiempo real

---

## 16. Referencias

### 16.1 Documentación Relacionada

- `PLAN_IMPLEMENTACION_CIERRE_NOMINA.md` - Proceso de cierre de nómina
- `PLAN_VOLANTE_PAGO.md` - Diseño de volante de pago
- `CLAUDE.md` - Arquitectura general del sistema

### 16.2 Archivos de Código Relacionados

- `backend-ranger-nomina/models/nominaModel.js` - Modelo principal de nómina
- `backend-ranger-nomina/routes/no_nomina.js` - Rutas de nómina
- `rangernomina-frontend/src/app/nomina/nomina-list.component.ts` - Lista de nóminas

### 16.3 Estándares de Formato CSV

- RFC 4180: Common Format and MIME Type for CSV Files
- https://tools.ietf.org/html/rfc4180

---

## 17. Historial de Cambios

| Versión | Fecha | Autor | Cambios |
|---------|-------|-------|---------|
| 1.0 | 2025-10-15 | Claude Code | Creación inicial del plan |

---

## 18. Aprobaciones

| Rol | Nombre | Fecha | Firma |
|-----|--------|-------|-------|
| Desarrollador | - | - | - |
| Líder Técnico | - | - | - |
| Product Owner | - | - | - |
| Usuario Final | - | - | - |

---

**Fin del documento**
