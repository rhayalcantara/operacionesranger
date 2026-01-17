# Guía de Usuario: Configuración de ISR por Quincena

**Fecha:** 2025-10-08
**Versión:** 1.0

---

## 📋 ¿Qué es esta funcionalidad?

El sistema ahora permite **controlar en qué quincena se calcula y aplica el ISR (Impuesto Sobre la Renta)**.

Anteriormente, el ISR se calculaba automáticamente en todas las nóminas. Ahora usted puede:
- ✅ **Activar** el cálculo de ISR en una nómina específica
- ❌ **Desactivar** el cálculo de ISR si no desea retenerlo en esa quincena
- 🔗 **Vincular** dos quincenas para cálculo mensual acumulativo

---

## 🎯 Casos de Uso Comunes

### Caso 1: ISR solo en 2da Quincena (Recomendado para RD)

**Configuración recomendada para empresas dominicanas:**

#### Nómina de 1ra Quincena:
1. Al crear la nómina, **desmarque** la opción "Calcular ISR en esta nómina"
2. Deje el campo "Nómina para cálculo acumulativo" vacío

**Resultado:** Los empleados NO tendrán retención de ISR en la 1ra quincena

#### Nómina de 2da Quincena:
1. Al crear la nómina, **marque** la opción "Calcular ISR en esta nómina"
2. En "Nómina para cálculo acumulativo", **seleccione la 1ra quincena del mes**

**Resultado:** El ISR se calculará sobre los ingresos totales del mes (1ra + 2da quincena) y se retendrá COMPLETO en la 2da quincena

#### Ejemplo Práctico:

**Empleado Juan Pérez:**
- Salario mensual: RD$50,000
- Ingreso por quincena: RD$25,000

**Con configuración recomendada:**
```
1ra Quincena Enero:
  Ingreso bruto: RD$25,000
  ISR retenido: RD$0 ← SIN RETENCIÓN
  Neto a pagar: RD$25,000 (menos AFP/ARS)

2da Quincena Enero:
  Ingreso bruto: RD$25,000
  ISR calculado sobre: RD$50,000 (total mes)
  ISR retenido: RD$3,500 ← RETENCIÓN MENSUAL COMPLETA
  Neto a pagar: RD$21,500 (menos AFP/ARS)
```

---

### Caso 2: ISR Distribuido (Ambas Quincenas)

**Para empresas que prefieren retener ISR en cada quincena:**

#### Nómina de 1ra Quincena:
1. **Marque** "Calcular ISR en esta nómina"
2. Deje "Nómina para cálculo acumulativo" como "Ninguna"

**Resultado:** ISR calculado sobre ingresos de la 1ra quincena solamente

#### Nómina de 2da Quincena:
1. **Marque** "Calcular ISR en esta nómina"
2. **Seleccione** la 1ra quincena en "Nómina para cálculo acumulativo"

**Resultado:** ISR calculado sobre ingresos mensuales, pero se descuenta lo ya retenido en 1ra quincena

#### Ejemplo Práctico:

**Empleado María González:**
- Salario mensual: RD$50,000

```
1ra Quincena:
  Ingreso: RD$25,000
  ISR retenido: RD$1,200 ← Retención quincenal

2da Quincena:
  Ingreso acumulado: RD$50,000
  ISR total mensual: RD$3,500
  ISR ya retenido: RD$1,200
  ISR a retener ahora: RD$2,300 ← Diferencia
```

---

### Caso 3: Sin ISR (Salarios Exentos)

**Para empleados con salarios bajo el mínimo exento:**

#### Ambas Quincenas:
1. **Desmarque** "Calcular ISR en esta nómina"
2. Deje "Nómina para cálculo acumulativo" vacío

**Resultado:** Sin retención de ISR en ninguna quincena

---

## 🖥️ Cómo Configurar en el Sistema

### Paso 1: Crear/Editar Nómina

1. Vaya a **Nóminas** → **Crear Nómina** (o edite una existente)
2. Complete los campos básicos:
   - Título de nómina
   - Tipo de nómina
   - Quincena (1 o 2)
   - Fechas de período

### Paso 2: Configurar ISR

Busque la sección de **ISR** en el formulario:

#### Opción 1: Calcular ISR
![Checkbox marcado]
```
☑ Calcular ISR en esta nómina
```
**Significado:** El sistema calculará y aplicará ISR

#### Opción 2: NO calcular ISR
![Checkbox desmarcado]
```
☐ Calcular ISR en esta nómina
```
**Significado:** ISR será RD$0 para todos los empleados

### Paso 3: Seleccionar Nómina Anterior (Opcional)

Si marcó "Calcular ISR", aparecerá un selector:

```
Nómina para Cálculo Acumulativo:
[Seleccionar...▼]
  - Ninguna (calcular solo esta quincena)
  - Enero 2025 - 1ra quincena
  - Diciembre 2024 - 2da quincena
  ...
```

**¿Cuándo seleccionar una nómina anterior?**
- ✅ **Sí:** Si es la 2da quincena y desea cálculo mensual
- ❌ **No:** Si es la 1ra quincena o desea cálculo independiente

### Paso 4: Guardar

Click en **"Crear Nómina"** o **"Actualizar Nómina"**

---

## ⚠️ Advertencias y Validaciones

### Validación 1: Coherencia de Configuración

❌ **ERROR:** Si desmarca "Calcular ISR" pero selecciona una nómina anterior

```
No puede vincular una nómina anterior si no va a calcular ISR
```

**Solución:** Marque "Calcular ISR" o quite la nómina anterior

### Validación 2: Orden Lógico

⚠️ **IMPORTANTE:** Procese las nóminas en orden:

1. **Primero:** Cierre la 1ra quincena
2. **Después:** Cree y procese la 2da quincena

Si crea la 2da quincena antes de cerrar la 1ra, el sistema no podrá vincularlas correctamente.

### Validación 3: Nóminas Cerradas

🔒 Una vez **cerrada** una nómina, no puede cambiar su configuración de ISR.

Si necesita modificar:
1. Reabra la nómina
2. Modifique la configuración
3. Recalcule
4. Cierre nuevamente

---

## 📊 Escenarios Especiales

### Escenario A: Cambio de Configuración a Mitad de Mes

**Situación:**
- Procesó 1ra quincena CON ISR
- Ahora quiere 2da quincena SIN ISR

**Problema:**
- El ISR de 1ra quincena YA fue retenido
- NO se puede "devolver" automáticamente

**Solución:**
1. Configure 2da quincena sin ISR (desmarcado)
2. El ISR solo se retendrá en 1ra quincena
3. **O** ajuste manualmente con un ingreso/descuento manual

---

### Escenario B: Empleado Nuevo a Mitad de Mes

**Situación:**
- Empleado ingresa en 2da quincena
- No hay 1ra quincena para vincular

**Configuración:**
1. Marque "Calcular ISR en esta nómina"
2. Seleccione "Ninguna" en nómina anterior
3. El ISR se calculará solo sobre la 2da quincena

---

### Escenario C: Nómina Extra (13er Mes, Bono)

**Situación:**
- Nómina especial fuera de quincena regular

**Configuración:**
1. Marque "Calcular ISR en esta nómina"
2. **Vincule** a la última quincena del mes si desea cálculo acumulativo
3. **O** deje como "Ninguna" para cálculo independiente

---

## 🔄 Flujo de Trabajo Recomendado

### Para ISR solo en 2da Quincena:

```
1. Crear 1ra Quincena
   ☐ Calcular ISR

2. Agregar empleados a 1ra Quincena

3. Recalcular 1ra Quincena
   → ISR = 0 para todos

4. Cerrar 1ra Quincena

5. Crear 2da Quincena
   ☑ Calcular ISR
   Nómina anterior: [1ra Quincena]

6. Agregar empleados a 2da Quincena

7. Recalcular 2da Quincena
   → ISR calculado sobre mes completo

8. Cerrar 2da Quincena
```

---

## 🆘 Preguntas Frecuentes

### ¿Qué pasa si olvido desmarcar ISR en 1ra quincena?

**R:** El sistema calculará ISR en ambas quincenas. Puede:
1. Reabrir la 1ra quincena
2. Desmarcar "Calcular ISR"
3. Recalcular
4. Cerrar nuevamente

### ¿Puedo cambiar la configuración después de cerrar?

**R:** No directamente. Debe:
1. Reabrir la nómina (si el sistema lo permite)
2. Modificar configuración
3. Recalcular
4. Cerrar nuevamente

### ¿El AFP y ARS también se pueden configurar por quincena?

**R:** No. AFP y ARS siempre se calculan en ambas quincenas según la ley.

### ¿Qué pasa con nóminas anteriores creadas antes de esta funcionalidad?

**R:** Por defecto, el sistema asume que calculan ISR (comportamiento antiguo). No necesita modificarlas.

---

## 📞 Soporte

Si tiene dudas o problemas con la configuración de ISR:

1. Revise esta guía
2. Consulte con el departamento de nómina
3. Contacte al administrador del sistema

---

**Última actualización:** 2025-10-08
**Versión del sistema:** 2.0
