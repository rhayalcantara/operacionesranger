# Formato de Importación - Historial Salarial para Regalía Pascual

**Versión:** 1.0
**Fecha:** 2025-01-23
**Propósito:** Importar salarios mensuales de enero a noviembre para empleados sin historial de nóminas

---

## 📋 **Formato del Archivo Excel**

### **Nombre del Archivo:**
`Historial_Salarial_Regalia_2025.xlsx`

### **Estructura de Columnas:**

| Columna | Nombre | Tipo | Descripción | Ejemplo | Obligatorio |
|---------|---------|------|-------------|---------|-------------|
| A | `cedula` | Texto | Cédula del empleado (sin guiones) | 00118129550 | ✅ Sí |
| B | `enero` | Numérico | Salario del mes de enero | 5000.00 | ❌ No |
| C | `febrero` | Numérico | Salario del mes de febrero | 5000.00 | ❌ No |
| D | `marzo` | Numérico | Salario del mes de marzo | 5000.00 | ❌ No |
| E | `abril` | Numérico | Salario del mes de abril | 5000.00 | ❌ No |
| F | `mayo` | Numérico | Salario del mes de mayo | 5000.00 | ❌ No |
| G | `junio` | Numérico | Salario del mes de junio | 5000.00 | ❌ No |
| H | `julio` | Numérico | Salario del mes de julio | 5000.00 | ❌ No |
| I | `agosto` | Numérico | Salario del mes de agosto | 5000.00 | ❌ No |
| J | `septiembre` | Numérico | Salario del mes de septiembre | 5000.00 | ❌ No |
| K | `octubre` | Numérico | Salario del mes de octubre | 5000.00 | ❌ No |
| L | `noviembre` | Numérico | Salario del mes de noviembre | 5000.00 | ❌ No |

---

## 📄 **Ejemplo de Archivo**

### **Plantilla Excel:**

```
| cedula        | enero    | febrero  | marzo    | abril    | mayo     | junio    | julio    | agosto   | septiembre | octubre  | noviembre |
|---------------|----------|----------|----------|----------|----------|----------|----------|----------|------------|----------|-----------|
| 00118129550   | 5000.00  | 5000.00  | 5000.00  | 5000.00  | 5000.00  | 5000.00  | 5000.00  | 5000.00  | 5000.00    | 5000.00  | 5000.00   |
| 40245161332   | 45000.00 | 45000.00 | 45000.00 | 45000.00 | 45000.00 | 45000.00 | 45000.00 | 45000.00 | 45000.00   | 45000.00 | 45000.00  |
| 00118314731   | 20000.00 | 20000.00 | 20000.00 | 20000.00 | 20000.00 | 20000.00 | 20000.00 |          |            |          |           |
| 40218904254   |          |          |          |          |          | 33000.00 | 33000.00 | 33000.00 | 33000.00   | 33000.00 | 33000.00  |
```

### **Explicación del Ejemplo:**

1. **Empleado 00118129550:**
   - Salario constante de RD$ 5,000 todo el año
   - Tiene 11 meses completos
   - **Cálculo:** (5,000 × 11 + 5,000_estimado_diciembre) / 12 = **RD$ 5,000**

2. **Empleado 40245161332:**
   - Salario constante de RD$ 45,000 todo el año
   - **Cálculo:** (45,000 × 11 + 45,000_estimado) / 12 = **RD$ 45,000**

3. **Empleado 00118314731:**
   - Trabajó de enero a julio (7 meses)
   - Salario: RD$ 20,000
   - **Cálculo:** (20,000 × 7) / 12 = **RD$ 11,666.67**

4. **Empleado 40218904254:**
   - Ingresó en junio (6 meses: junio-noviembre)
   - Salario: RD$ 33,000
   - **Cálculo:** (33,000 × 6) / 12 = **RD$ 16,500**

---

## 🔍 **Reglas de Validación**

### **Validaciones del Backend:**

1. **Cédula:**
   - ✅ Debe existir en la tabla `rh_empleado`
   - ✅ Debe ser empleado activo (`status = 1`)
   - ✅ No puede estar vacía
   - ❌ Error si la cédula no existe

2. **Salarios:**
   - ✅ Deben ser números positivos
   - ✅ Pueden estar vacíos (NULL) para meses no trabajados
   - ✅ Máximo 2 decimales
   - ❌ Error si son negativos

3. **Año:**
   - ✅ Solo se pueden importar salarios del año de la regalía
   - ✅ No se permite importar años futuros

4. **Duplicados:**
   - ⚠️ Si ya existe historial importado para un empleado/año, se REEMPLAZA
   - ✅ Se registra en auditoría

---

## 🗄️ **Estructura de Base de Datos**

### **Nueva Tabla: `no_regalia_historial_importado`**

```sql
CREATE TABLE IF NOT EXISTS no_regalia_historial_importado (
  id_historial INT PRIMARY KEY AUTO_INCREMENT,
  id_empleado INT NOT NULL,
  anio YEAR NOT NULL,

  -- Salarios por mes
  salario_enero DECIMAL(10,2) DEFAULT NULL,
  salario_febrero DECIMAL(10,2) DEFAULT NULL,
  salario_marzo DECIMAL(10,2) DEFAULT NULL,
  salario_abril DECIMAL(10,2) DEFAULT NULL,
  salario_mayo DECIMAL(10,2) DEFAULT NULL,
  salario_junio DECIMAL(10,2) DEFAULT NULL,
  salario_julio DECIMAL(10,2) DEFAULT NULL,
  salario_agosto DECIMAL(10,2) DEFAULT NULL,
  salario_septiembre DECIMAL(10,2) DEFAULT NULL,
  salario_octubre DECIMAL(10,2) DEFAULT NULL,
  salario_noviembre DECIMAL(10,2) DEFAULT NULL,

  -- Metadata
  fecha_importacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  usuario_importacion VARCHAR(100),
  archivo_origen VARCHAR(255),

  -- Claves foráneas
  FOREIGN KEY (id_empleado) REFERENCES rh_empleado(id_empleado)
    ON DELETE CASCADE ON UPDATE CASCADE,

  -- Constraint único: un empleado solo puede tener un historial por año
  UNIQUE KEY uk_empleado_anio (id_empleado, anio),

  INDEX idx_anio (anio)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Historial salarial importado para cálculo de Regalía Pascual';
```

---

## 🔄 **Flujo de Importación**

### **Pasos del Proceso:**

1. **Usuario selecciona archivo Excel** desde la UI de Regalía Pascual
2. **Backend valida estructura** del archivo
3. **Valida cada fila:**
   - Cédula existe y empleado está activo
   - Salarios son números válidos
   - Al menos un mes tiene valor
4. **Inserta/Actualiza en `no_regalia_historial_importado`**
5. **Registra en auditoría:** cantidad de registros, usuario, fecha
6. **Recalcula preview** automáticamente con el nuevo historial

---

## 📊 **Cálculo con Historial Importado**

### **Lógica Modificada en `regaliaModel.js`:**

```javascript
// 1. Verificar si tiene historial en nóminas cerradas
const tieneHistorialNominas = await _tieneHistorialNomina(connection, idEmpleado, anio);

// 2. Si NO tiene historial en nóminas, buscar historial importado
if (!tieneHistorialNominas) {
  const historialImportado = await _obtenerHistorialImportado(connection, idEmpleado, anio);

  if (historialImportado) {
    // Usar historial importado para calcular
    return _calcularConHistorialImportado(historialImportado, salarioActual);
  }
}

// 3. Si no tiene ningún historial, calcular sin historial (proporcional)
return _calcularSinHistorial(connection, idEmpleado, anio, datosEmpleado);
```

### **Nuevo Método: `_calcularConHistorialImportado()`**

```javascript
static _calcularConHistorialImportado(historial, salarioActual) {
  const meses = [
    'salario_enero', 'salario_febrero', 'salario_marzo', 'salario_abril',
    'salario_mayo', 'salario_junio', 'salario_julio', 'salario_agosto',
    'salario_septiembre', 'salario_octubre', 'salario_noviembre'
  ];

  let totalSalarios = 0;
  let mesesConSalario = 0;

  // Sumar salarios de los meses con valor
  for (const mes of meses) {
    if (historial[mes] && historial[mes] > 0) {
      totalSalarios += parseFloat(historial[mes]);
      mesesConSalario++;
    }
  }

  // Estimar diciembre con salario actual
  totalSalarios += salarioActual;
  mesesConSalario++;

  const promedioSalarial = totalSalarios / mesesConSalario;
  const montoCalculado = totalSalarios / 12;

  return {
    montoCalculado,
    mesesLaborados: 12,
    promedioSalarial,
    tiene_historial: true,
    metodo_calculo: 'HISTORIAL_IMPORTADO'
  };
}
```

---

## 🎨 **Cambios en la UI**

### **Nueva Opción en Tab "Calcular Regalía":**

```html
<!-- Botón para importar historial -->
<button mat-raised-button color="accent" (click)="importarHistorial()">
  <mat-icon>upload_file</mat-icon>
  Importar Historial Salarial (Excel)
</button>
```

### **Nuevo Chip para Método:**

- 🟢 **Con Historial** - Tiene nóminas cerradas
- 🔵 **Historial Importado** - Usa archivo Excel importado
- 🟠 **Sin Historial** - Cálculo proporcional desde ingreso

---

## 📝 **Endpoint de API**

### **POST `/api/regalia/importar-historial`**

**Request:**
```javascript
// FormData
{
  file: Excel file,
  anio: 2025,
  usuario: "admin"
}
```

**Response:**
```javascript
{
  success: true,
  message: "Historial importado exitosamente",
  registros_procesados: 34,
  registros_nuevos: 30,
  registros_actualizados: 4,
  errores: []
}
```

**Errores Posibles:**
```javascript
{
  success: false,
  message: "Errores en la importación",
  errores: [
    { fila: 2, cedula: "00112345678", error: "Empleado no encontrado" },
    { fila: 5, cedula: "00187654321", error: "Salario de marzo es negativo" }
  ]
}
```

---

## 🔐 **Seguridad**

- ✅ Solo usuarios nivel 9 (admin) pueden importar historial
- ✅ Auditoría completa de todas las importaciones
- ✅ Validación de tipo de archivo (solo .xlsx)
- ✅ Límite de tamaño: 5 MB
- ✅ Límite de registros: 1000 empleados por archivo

---

## 📌 **Notas Importantes**

1. **Diciembre NO se incluye** en el archivo porque se estima con el salario actual
2. **Meses vacíos** se interpretan como "no trabajado ese mes"
3. **Salarios variables** se promedian automáticamente
4. **Reemplazo de datos:** Si se importa dos veces, se reemplaza el historial anterior
5. **Prioridad:** Nóminas cerradas > Historial importado > Sin historial

---

## 🎯 **Beneficios**

✅ **Soluciona el problema** de empleados sin historial de nóminas
✅ **Flexibilidad** para importar salarios de cualquier fuente (nómina manual, otro sistema)
✅ **Precisión** en el cálculo de regalía basado en salarios reales del año
✅ **Auditoría** completa de qué se importó y cuándo
✅ **Reutilizable** para años futuros

---

## 📋 **Checklist de Implementación**

- [ ] Crear migración SQL para tabla `no_regalia_historial_importado`
- [ ] Implementar método `_obtenerHistorialImportado()` en `regaliaModel.js`
- [ ] Implementar método `_calcularConHistorialImportado()` en `regaliaModel.js`
- [ ] Modificar método `_calcularRegaliaEmpleado()` para verificar historial importado
- [ ] Crear servicio de importación `importarHistorialSalarial()` usando `exceljs`
- [ ] Crear endpoint POST `/api/regalia/importar-historial`
- [ ] Crear botón "Importar Historial" en UI de Regalía
- [ ] Implementar dialog de selección de archivo
- [ ] Mostrar resultados de importación (éxitos/errores)
- [ ] Agregar chip "Historial Importado" en tabla de resultados
- [ ] Actualizar tests unitarios
- [ ] Crear archivo de plantilla Excel descargable
- [ ] Documentar en PLAN_REGALIA_PASCUAL.md

---

**Fecha de Creación:** 2025-01-23
**Estado:** Propuesta - Pendiente de Aprobación
