# Fix - Regalía Pascual: Error de Zona Horaria

**Fecha:** 2025-12-15
**Problema:** Cálculo incorrecto mostrando 13 meses en lugar de 12
**Estado:** ✅ RESUELTO

---

## Síntomas

- **Meses Laborados:** 13 (incorrecto, debería ser 12)
- **Monto Calculado:** RD$ 32,500 para salario de RD$ 30,000 (debería ser RD$ 30,000)
- **Afectaba:** Todos los empleados sin historial importado
- **Método de cálculo afectado:** `SIN_HISTORIAL` (empleados nuevos o año 2025)

---

## Causa Raíz

**Problema de zona horaria GMT-4 (República Dominicana)** al crear objetos `Date` con strings:

```javascript
// CÓDIGO INCORRECTO:
const fechaInicioAnio = new Date(`${anio}-01-01`);  // Se interpreta como 2024-12-31 20:00
const fechaFinAnio = new Date(`${anio}-12-31`);     // Se interpreta como 2025-12-31 20:00

// Resultado:
// Inicio: Año 2024, Mes 11 (diciembre) ❌
// Fin:    Año 2025, Mes 11 (diciembre)
// Meses = (2025 - 2024) * 12 + (11 - 11) + 1 = 13 ❌
```

---

## Solución

**Archivo:** `backend-ranger-nomina/models/regaliaModel.js`

### Cambio 1: Función `_calcularSinHistorial` (Líneas 237-239)

```javascript
// ANTES (INCORRECTO):
static async _calcularSinHistorial(connection, idEmpleado, anio, datosEmpleado) {
  const fechaIngreso = new Date(datosEmpleado.fecha_ingreso);
  const fechaInicioAnio = new Date(`${anio}-01-01`);
  const fechaFinAnio = new Date(`${anio}-12-31`);
  // ...
}

// DESPUÉS (CORRECTO):
static async _calcularSinHistorial(connection, idEmpleado, anio, datosEmpleado) {
  const fechaIngreso = new Date(datosEmpleado.fecha_ingreso);
  // FIX: Usar constructor de Date con parámetros para evitar problemas de zona horaria
  const fechaInicioAnio = new Date(anio, 0, 1);   // año, mes (0=enero), día
  const fechaFinAnio = new Date(anio, 11, 31);    // año, mes (11=diciembre), día
  // ...
}
```

### Cambio 2: Función `validarCreacionNomina` (Línea 432)

```javascript
// ANTES:
const fechaLimite = new Date(`${añoActual}-12-20`);

// DESPUÉS:
const fechaLimite = new Date(añoActual, 11, 20);  // año, mes (11=diciembre), día 20
```

---

## Resultado

**Ahora el cálculo es correcto:**

```
Empleado: Carlos Manuel Berbere Tapia
Salario Actual: RD$ 30,000.00
Meses Laborados: 12 ✓
Promedio Salarial: RD$ 30,000.00
Monto a Pagar: RD$ 30,000.00 ✓

Fórmula correcta: (Salario × 12 meses) / 12 = Salario mensual (1/12 del salario anual)
```

---

## Lecciones Aprendidas

### ❌ **NO USAR:**
```javascript
new Date('2025-01-01')  // Problema de zona horaria
new Date(`${año}-${mes}-${día}`)  // Problema de zona horaria
```

### ✅ **USAR:**
```javascript
new Date(2025, 0, 1)    // año, mes (0-11), día
new Date(año, mes - 1, día)  // mes en base 0 (enero = 0)
```

### Meses en JavaScript:
- Enero = 0
- Febrero = 1
- ...
- Diciembre = 11

---

## Archivos Modificados

1. `backend-ranger-nomina/models/regaliaModel.js` (2 cambios)
   - Línea 237-239: `_calcularSinHistorial`
   - Línea 432: `validarCreacionNomina`

---

## Testing

**Casos de prueba verificados:**

1. ✅ Empleado con todo el año laborado → 12 meses
2. ✅ Empleado con salario RD$ 30,000 → Regalía RD$ 30,000
3. ✅ Cálculo proporcional funciona correctamente
4. ✅ Validación de fecha límite (20 de diciembre) funciona

---

## Impacto

- **Afecta:** Empleados sin historial de nóminas cerradas en el año
- **No afecta:** Empleados con historial importado desde Excel
- **No afecta:** Empleados con nóminas cerradas del año (método `HISTORIAL`)

---

## Prevención Futura

**Regla para el equipo:**
> Siempre usar el constructor `new Date(year, month, day)` con parámetros numéricos cuando se trabaje con fechas específicas. **NUNCA** usar strings tipo ISO (`'YYYY-MM-DD'`) para crear fechas en JavaScript cuando se necesita precisión de año/mes/día.

---

**Verificado por:** Claude Code
**Estado:** ✅ Producción
**Servidor reiniciado:** Sí
