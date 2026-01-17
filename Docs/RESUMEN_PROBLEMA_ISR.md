# Resumen: Problema ISR en Quincenas

**Fecha:** 2025-10-08
**Estado:** 🟡 IDENTIFICADO - Pendiente implementación
**Plan detallado:** [PLAN_CONTROL_ISR_POR_QUINCENA.md](PLAN_CONTROL_ISR_POR_QUINCENA.md)

---

## 🔴 Problema

El ISR se calcula **siempre en ambas quincenas**, sin opción de control:

```
❌ Situación actual:
  1ra quincena → Calcula ISR
  2da quincena → Calcula ISR (acumulativo)

  Problema: No se puede desactivar en ninguna quincena
```

**Causa raíz:**
- ISR no es un `desc_cred`, por lo tanto no usa el filtro `quincena_aplicacion`
- El cálculo es directo en `nominaModel.js` líneas 890-912
- No respeta el campo `isr` de la tabla `no_nominas`

---

## ✅ Solución Propuesta

Usar los campos **YA EXISTENTES** en `no_nominas`:
- `isr` (TINYINT): Flag para activar/desactivar cálculo
- `id_nomina_isr` (INT): ID de nómina anterior para cálculo acumulativo

### Configuraciones Posibles

#### Escenario 1: ISR solo en 2da quincena (Común en RD)
```
Nómina 1ra: isr=0, id_nomina_isr=NULL
  → Resultado: ISR = 0

Nómina 2da: isr=1, id_nomina_isr=[ID_1ra]
  → Resultado: ISR = Total mensual
```

#### Escenario 2: ISR distribuido
```
Nómina 1ra: isr=1, id_nomina_isr=NULL
  → Resultado: ISR quincenal

Nómina 2da: isr=1, id_nomina_isr=[ID_1ra]
  → Resultado: ISR mensual - ISR 1ra
```

#### Escenario 3: Sin ISR
```
Ambas: isr=0, id_nomina_isr=NULL
  → Resultado: ISR = 0 en ambas
```

---

## 🔧 Cambios Necesarios

### 1. Backend (1 cambio simple)

**Archivo:** `models/nominaModel.js` línea 890

```javascript
// AGREGAR ESTA VALIDACIÓN:
const aplicarISR = nominaInfo.isr === 1 || nominaInfo.isr === true;

if (aplicarISR) {
  // ... lógica actual de ISR
} else {
  desc_isr = 0;
}
```

### 2. Frontend (UI para configurar)

**Archivos a modificar:**
- `nomina.service.ts` - Agregar `isr` a interface
- `nomina-form.component.ts` - FormControls
- `nomina-form.component.html` - Checkbox + Select

**UI propuesta:**
```
☑ Calcular ISR en esta nómina

Nómina para cálculo acumulativo:
[Seleccionar...▼]
  - Ninguna (solo esta quincena)
  - Enero 2025 - 1ra quincena
  - Diciembre 2024 - 2da quincena
```

---

## ⏱️ Estimación

- **Backend:** 30 min (1 cambio + validación)
- **Frontend:** 1.5 horas (form + UI)
- **Testing:** 1 hora
- **Total:** ~3 horas

---

## 🎯 Beneficios

✅ No requiere migración SQL
✅ Usa campos existentes
✅ Solución simple y elegante
✅ Control total por nómina
✅ Compatible con sistema actual

---

## 📋 Próximos Pasos

1. Revisar y aprobar plan detallado
2. Implementar cambio en backend
3. Crear UI en frontend
4. Testing con casos reales
5. Documentar para usuarios

---

**Ver plan completo:** [PLAN_CONTROL_ISR_POR_QUINCENA.md](PLAN_CONTROL_ISR_POR_QUINCENA.md)
