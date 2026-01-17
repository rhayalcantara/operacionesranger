# Plan de Testing Integral - Fase 1 Completa
## 28 Componentes Corregidos - Ranger Nómina Frontend

**Fecha:** 2025-10-22
**Componentes a Probar:** 28
**Prioridad:** Alta (validación antes de producción)

---

## Objetivos del Testing

1. ✅ Validar que todas las correcciones funcionan correctamente
2. ✅ Verificar que no hay regresiones en funcionalidad existente
3. ✅ Confirmar eliminación de memory leaks
4. ✅ Validar mejoras de UX (loading/error/empty states)
5. ✅ Verificar accesibilidad WCAG 2.1 AA
6. ✅ Confirmar que el build es estable

---

## Checklist Global de Validación

Antes de comenzar el testing individual, verificar:

### Build y Compilación
- [ ] `npm run build` exitoso sin errores
- [ ] No hay warnings críticos de TypeScript
- [ ] Bundle size dentro de límites aceptables (<2MB)
- [ ] Todas las dependencias resueltas correctamente

### Entorno de Testing
- [ ] Backend corriendo en localhost:3333
- [ ] Frontend corriendo en localhost:4200
- [ ] Base de datos con datos de prueba
- [ ] Chrome DevTools abierto (para monitoreo de memoria)

### Herramientas Requeridas
- [ ] Chrome DevTools (Performance, Memory tabs)
- [ ] Lighthouse para accessibility
- [ ] Extensión axe DevTools (opcional)
- [ ] Screen reader (NVDA o JAWS) para tests de accesibilidad

---

## Prioridades de Testing

### 🔴 CRÍTICO (Probar PRIMERO - Día 1)
Componentes core del negocio que afectan funcionalidad principal

### 🟠 ALTO (Probar Segunda - Día 2)
Componentes importantes pero no bloqueantes

### 🟡 MEDIO (Probar Tercera - Día 3)
Componentes de soporte y utilidad

### 🟢 BAJO (Probar Última - Día 4)
Componentes secundarios y edge cases

---

## Testing por Prioridad

## 🔴 PRIORIDAD CRÍTICA (8 componentes)

Estos componentes son esenciales para las operaciones de nómina y usuarios.

### 1. user-form & user-list (Gestión de Usuarios)
**Prioridad:** 🔴 CRÍTICA
**Tiempo Estimado:** 45 min
**Riesgo:** Alto - Afecta autenticación y autorización

**Correcciones Aplicadas:**
- Validación nivel 9 implementada
- Prevención de auto-eliminación
- Validación de contraseñas fuertes
- Memory leaks eliminados

**Checklist de Testing:**

**user-form:**
- [ ] **Seguridad Crítica:**
  - [ ] Intentar acceder como usuario nivel < 9 → debe redirigir a dashboard
  - [ ] Intentar acceder como usuario nivel = 9 → debe permitir acceso
  - [ ] Intentar crear contraseña débil ("123456") → debe mostrar error
  - [ ] Contraseña sin mayúsculas → debe mostrar error específico
  - [ ] Contraseña sin números → debe mostrar error específico
  - [ ] Contraseña sin caracteres especiales → debe mostrar error específico
  - [ ] Contraseña mínimo 8 caracteres → debe validar correctamente
  - [ ] Confirmación de contraseña no coincide → debe mostrar error

- [ ] **Funcionalidad:**
  - [ ] Crear nuevo usuario → debe guardar correctamente
  - [ ] Editar usuario existente → debe actualizar datos
  - [ ] Cambiar nivel de usuario → debe persistir
  - [ ] Cancelar con cambios → debe preguntar confirmación
  - [ ] Formulario muestra errores de validación en tiempo real

- [ ] **UX:**
  - [ ] Loading spinner aparece durante guardado
  - [ ] Botón deshabilitado durante operación
  - [ ] Notificación de éxito después de guardar
  - [ ] Notificación de error si falla

**user-list:**
- [ ] **Seguridad Crítica:**
  - [ ] Intentar acceder como usuario nivel < 9 → debe redirigir
  - [ ] Intentar eliminar propio usuario → debe mostrar error y prevenir
  - [ ] Eliminar otro usuario (nivel 9) → debe pedir confirmación con MatDialog
  - [ ] Confirmar eliminación → debe ejecutar y notificar éxito

- [ ] **Funcionalidad:**
  - [ ] Tabla carga correctamente con usuarios
  - [ ] Paginación funciona (cambiar página)
  - [ ] Búsqueda filtra usuarios
  - [ ] Botón "Agregar Usuario" abre formulario
  - [ ] Botón "Editar" abre formulario con datos

- [ ] **Estados:**
  - [ ] Loading state aparece al cargar datos
  - [ ] Empty state si no hay usuarios
  - [ ] Error state si falla carga (desconectar backend)
  - [ ] Botón "Reintentar" recarga datos

- [ ] **Memory Leaks:**
  - [ ] Abrir Chrome DevTools → Performance → Memory
  - [ ] Tomar snapshot inicial
  - [ ] Navegar a user-list, abrir/cerrar dialogs 10 veces
  - [ ] Navegar a otra página
  - [ ] Tomar snapshot final
  - [ ] Comparar → no debe haber aumento significativo (< 5MB)

---

### 2. nomina-form & nomina-list (Gestión de Nóminas)
**Prioridad:** 🔴 CRÍTICA
**Tiempo Estimado:** 60 min
**Riesgo:** Muy Alto - Core del sistema

**Correcciones Aplicadas:**
- Validaciones de rangos de fechas
- 6 memory leaks corregidos
- Estados de carga implementados
- Manejo de errores robusto

**Checklist de Testing:**

**nomina-form:**
- [ ] **Validaciones:**
  - [ ] Fecha fin < fecha inicio → debe mostrar error
  - [ ] Quincena inválida (0, 3) → debe validar
  - [ ] Título vacío → debe requerir
  - [ ] Días de trabajo > 31 → debe validar
  - [ ] Número de quincena > 24 → debe validar

- [ ] **Funcionalidad:**
  - [ ] Crear nómina nueva → debe guardar
  - [ ] Editar nómina existente → debe actualizar
  - [ ] Seleccionar tipo de nómina → debe cargar parámetros
  - [ ] Cambiar empleados → debe actualizar contadores
  - [ ] Banner de nómina cerrada se muestra correctamente

- [ ] **Carga de Datos:**
  - [ ] Loading overlay aparece al cargar
  - [ ] Todos los dropdowns cargan (tipos, subnóminas, etc.)
  - [ ] Error si falla carga → muestra notificación

- [ ] **Memory Leaks (CRÍTICO):**
  - [ ] Abrir formulario → cerrar → repetir 10 veces
  - [ ] Verificar en DevTools que memoria no crece
  - [ ] Cambiar tipo de nómina 20 veces → no debe aumentar memoria

**nomina-list:**
- [ ] **Funcionalidad:**
  - [ ] Tabla carga nóminas correctamente
  - [ ] Paginación funciona
  - [ ] Búsqueda filtra nóminas
  - [ ] Botón "Eliminar" solo visible si estado = 'abierta'
  - [ ] Exportar CSV descarga archivo
  - [ ] Exportar Excel descarga archivo
  - [ ] Generar comprobante descarga PDF

- [ ] **Estados:**
  - [ ] Loading spinner durante carga
  - [ ] Empty state si no hay nóminas
  - [ ] Error state con retry funciona
  - [ ] Botón exportar muestra loading durante descarga

- [ ] **Seguridad:**
  - [ ] Descarga de archivos valida tipo (no ejecutables)
  - [ ] Descarga tiene límite de tamaño (50MB)
  - [ ] Filename está sanitizado (sin caracteres peligrosos)

---

### 3. isr-form (Configuración ISR)
**Prioridad:** 🔴 CRÍTICA
**Tiempo Estimado:** 30 min
**Riesgo:** Alto - Bug crítico corregido

**Bug Crítico Corregido:**
- ✅ Línea 40: `data.id` → `data.id_isr` (edición no funcionaba)

**Checklist de Testing:**

- [ ] **Bug Fix Validation (CRÍTICO):**
  - [ ] Crear nuevo registro ISR → debe guardar
  - [ ] **EDITAR registro existente** → debe cargar datos correctamente
  - [ ] **Modificar y guardar** → debe actualizar (no crear duplicado)
  - [ ] Verificar en BD que NO se crearon registros duplicados

- [ ] **Validaciones:**
  - [ ] Mínimo >= máximo → debe mostrar error
  - [ ] Porcentaje > 100 → debe validar
  - [ ] Valores negativos → debe prevenir
  - [ ] Rangos superpuestos → debe validar (si backend implementado)

- [ ] **UX:**
  - [ ] Campos muestran errores de validación
  - [ ] Hints informativos aparecen
  - [ ] Loading durante guardado
  - [ ] Notificación de éxito/error

- [ ] **Accesibilidad:**
  - [ ] ARIA labels en todos los campos
  - [ ] Navegación por teclado (Tab)
  - [ ] Screen reader anuncia errores

---

### 4. gestion-vacaciones & vacaciones-form
**Prioridad:** 🔴 CRÍTICA
**Tiempo Estimado:** 45 min
**Riesgo:** Alto - Cálculos de vacaciones

**Correcciones Aplicadas:**
- Validación de rangos de fechas
- Cálculo automático de monto habilitado
- Memory leaks eliminados
- Sanitización de búsqueda

**Checklist de Testing:**

**gestion-vacaciones:**
- [ ] **Funcionalidad:**
  - [ ] Tabla carga vacaciones
  - [ ] Filtro por empleado funciona
  - [ ] Estados visuales (Programada, Aprobada, etc.) correctos
  - [ ] Botón "Solicitar Vacaciones" abre formulario
  - [ ] Editar vacación carga datos

- [ ] **Seguridad:**
  - [ ] Búsqueda con caracteres especiales (`<script>`) → debe sanitizar
  - [ ] Búsqueda muy larga (>100 chars) → debe limitar

**vacaciones-form:**
- [ ] **Validaciones Críticas:**
  - [ ] Fecha fin < fecha inicio → debe mostrar error visual
  - [ ] Días exceden máximo (30 días) → debe validar
  - [ ] Monto negativo → debe prevenir
  - [ ] Empleado requerido → debe validar

- [ ] **Cálculo Automático:**
  - [ ] Cambiar fecha inicio → debe recalcular días
  - [ ] Cambiar fecha fin → debe recalcular días
  - [ ] Cambiar empleado → debe calcular monto (si habilitado)
  - [ ] Indicador de cálculo aparece

- [ ] **Memory Leaks:**
  - [ ] Cambiar fechas 50 veces → no debe aumentar memoria
  - [ ] Buscar empleados múltiples veces → cleanup correcto

---

### 5. cuotas & cuota-form-dialog
**Prioridad:** 🔴 CRÍTICA
**Tiempo Estimado:** 45 min
**Riesgo:** Alto - XSS corregido

**Correcciones Aplicadas:**
- XSS vulnerability eliminado (window.confirm con datos usuario)
- Memory leaks eliminados
- 1000 empleados issue documentado

**Checklist de Testing:**

**cuotas:**
- [ ] **Seguridad (XSS Fix):**
  - [ ] Crear cuota con descripción: `<script>alert('XSS')</script>`
  - [ ] Intentar cancelar → MatDialog debe mostrar descripción escapada
  - [ ] Verificar que NO se ejecuta JavaScript
  - [ ] Dialog debe mostrar mensaje sanitizado

- [ ] **Funcionalidad:**
  - [ ] Tabla carga cuotas activas
  - [ ] Barra de progreso muestra correctamente
  - [ ] Cancelar cuota pide confirmación
  - [ ] Ver detalle abre dialog

- [ ] **Estados:**
  - [ ] Loading state
  - [ ] Empty state
  - [ ] Error state con retry

**cuota-form-dialog:**
- [ ] **Funcionalidad:**
  - [ ] Seleccionar empleado carga correctamente
  - [ ] Seleccionar tipo desc/cred funciona
  - [ ] Cálculo de monto por cuota actualiza en tiempo real
  - [ ] Validaciones numéricas funcionan

- [ ] **Performance (Documentado - No Fix):**
  - [ ] ⚠️ Nota: Carga 1000 empleados sin paginación
  - [ ] Medir tiempo de carga del dropdown
  - [ ] Documentar si hay lag al abrir (aceptable por ahora)

---

### 6. departamento & departamento-form
**Prioridad:** 🟠 ALTA
**Tiempo Estimado:** 30 min

**Checklist de Testing:**

- [ ] **departamento (lista):**
  - [ ] Tabla carga departamentos
  - [ ] CRUD completo funciona
  - [ ] TrackBy mejora performance (verificar en DevTools)
  - [ ] MatDialog en lugar de window.confirm()

- [ ] **departamento-form:**
  - [ ] Crear departamento → guardar
  - [ ] Editar departamento → actualizar
  - [ ] Asignar jefe carga empleados
  - [ ] ⚠️ Nota: Carga 1000 empleados (documentado)

---

### 7. image-dialog (Visor de Fotos)
**Prioridad:** 🔴 CRÍTICA (Seguridad)
**Tiempo Estimado:** 20 min
**Riesgo:** Alto - XSS vulnerability corregida

**Corrección Aplicada:**
- Eliminado `bypassSecurityTrustUrl()` peligroso
- Implementada sanitización correcta

**Checklist de Testing:**

- [ ] **Seguridad (XSS Fix):**
  - [ ] Intentar cargar URL maliciosa como foto empleado
  - [ ] Verificar que sanitizer rechaza URLs peligrosas
  - [ ] Solo debe aceptar data:image/* o https://

- [ ] **Funcionalidad:**
  - [ ] Ver foto de empleado → debe abrir dialog
  - [ ] Foto base64 carga correctamente
  - [ ] Error state si imagen no carga
  - [ ] Loading spinner mientras carga

---

### 8. change-password
**Prioridad:** 🔴 CRÍTICA
**Tiempo Estimado:** 20 min
**Riesgo:** BLOQUEADO - Backend faltante

**⚠️ BLOQUEADO - Backend Endpoint No Existe:**

**Testing Limitado:**
- [ ] **UI y Validaciones:**
  - [ ] Formulario carga correctamente
  - [ ] Validación de contraseña fuerte funciona
  - [ ] Confirmación de contraseña valida
  - [ ] Botón deshabilitado si inválido

- [ ] **⚠️ NO PROBAR:**
  - ❌ NO intentar cambiar contraseña (fallará con 500)
  - ❌ Backend endpoint no implementado

- [ ] **Acción Requerida:**
  - [ ] Documentar en Jira/Trello: "Implementar backend changePassword()"
  - [ ] Ver análisis report línea 456-591 para código sugerido

---

## 🟠 PRIORIDAD ALTA (8 componentes)

### 9. bancos & bancos-form
**Tiempo Estimado:** 25 min

- [ ] Tabla carga bancos
- [ ] CRUD completo funciona
- [ ] Validación RNC dominicano (9 u 11 dígitos)
- [ ] Loading states
- [ ] TrackBy optimiza tabla

---

### 10. no-desc-cred (3 componentes: wrapper, list, form)
**Tiempo Estimado:** 40 min

**no-desc-cred-list:**
- [ ] Tabla carga ingresos/descuentos
- [ ] Paginación funciona
- [ ] Permisos: solo nivel 9 puede eliminar
- [ ] MatDialog confirmación
- [ ] Loading/error/empty states

**no-desc-cred-form:**
- [ ] Validaciones custom funcionan (empleado XOR compania)
- [ ] Validación tope para porcentajes
- [ ] Error messages específicos
- [ ] Loading durante guardado

**no-desc-cred-search-dialog:**
- [ ] Búsqueda filtra correctamente
- [ ] Chips muestran contadores correctos
- [ ] Paginación funciona
- [ ] Performance mejorada (funciones de template eliminadas)

---

### 11. no-tipo-nomina & no-tipo-nomina-form
**Tiempo Estimado:** 25 min

- [ ] CRUD completo
- [ ] Migración a Reactive Forms funciona
- [ ] Validaciones (required, minLength)
- [ ] MatDialog confirmación

---

### 12. employee-bank-account-form
**Tiempo Estimado:** 20 min

- [ ] Migración a Reactive Forms
- [ ] Validación número de cuenta (10-20 dígitos)
- [ ] Solo números permitidos
- [ ] ARIA accesibilidad implementada

---

### 13. mantenimiento-desc-cred-nomina
**Tiempo Estimado:** 30 min

- [ ] Carga detalles de nómina
- [ ] Filtros por tipo funcionan
- [ ] Console.log eliminados (7 total)
- [ ] Estados loading/error

---

## 🟡 PRIORIDAD MEDIA (4 componentes)

### 14. cuota-detalle-dialog
**Tiempo Estimado:** 15 min

- [ ] Muestra detalle de cuota
- [ ] Tabla de pagos carga
- [ ] Progreso calcula correctamente
- [ ] TrackBy en tabla de pagos

---

### 15. vacaciones-list
**Tiempo Estimado:** 20 min

- [ ] Historial de vacaciones carga
- [ ] Búsqueda con debounce (400ms)
- [ ] Interfaces TypeScript implementadas
- [ ] Estados loading/error/empty

---

### 16. confirmation-dialog (shared)
**Tiempo Estimado:** 10 min

- [ ] Duplicación eliminada (solo versión shared existe)
- [ ] Dialog abre correctamente
- [ ] Botones funcionan
- [ ] Textos personalizables

---

### 17. titulo-listados
**Tiempo Estimado:** 15 min

- [ ] **Seguridad:**
  - [ ] Input sanitización funciona
  - [ ] Inputs con `<script>` son escapados

- [ ] **Funcionalidad:**
  - [ ] Título se muestra
  - [ ] Caption se muestra
  - [ ] Botones renderizan
  - [ ] Evento click funciona

- [ ] **CSS:**
  - [ ] Gradiente de texto funciona (webkit-text-fill-color: transparent)
  - [ ] Accesibilidad mejorada

---

## Testing de Memory Leaks (Global)

**Herramienta:** Chrome DevTools → Performance → Memory

**Proceso:**
1. Abrir Chrome DevTools
2. Ir a Memory tab
3. Tomar "Heap Snapshot" inicial
4. Navegar y usar componente intensivamente (20+ interacciones)
5. Navegar fuera del componente
6. Esperar 10 segundos
7. Forzar garbage collection (ícono de basurero)
8. Tomar "Heap Snapshot" final
9. Comparar snapshots

**Criterio de Éxito:**
- ✅ Diferencia < 5MB después de GC
- ✅ No hay listeners crecientes
- ✅ Detached DOM nodes < 100

**Componentes Críticos para Testing de Memoria:**
- nomina-form (6 subscriptions corregidas)
- cuotas (3+ subscriptions)
- gestion-vacaciones (3 subscriptions)
- user-form (4 subscriptions)

---

## Testing de Accesibilidad (WCAG 2.1 AA)

**Herramienta:** Lighthouse + axe DevTools

**Proceso:**
1. Abrir Chrome DevTools → Lighthouse
2. Seleccionar "Accessibility"
3. Generar reporte
4. Objetivo: Score > 90

**Checklist Manual:**
- [ ] Navegación por teclado (Tab, Enter, Escape)
- [ ] Screen reader (NVDA/JAWS) anuncia elementos
- [ ] Contraste de colores WCAG AA
- [ ] Tamaños de touch targets > 44px
- [ ] ARIA labels presentes

**Componentes Críticos:**
- employee-bank-account-form (WCAG AA implementado)
- titulo-listados (accesibilidad mejorada)
- Todos los formularios (ARIA attributes)

---

## Testing de Performance

**Métricas a Validar:**

### Change Detection
**Herramienta:** Angular DevTools

- [ ] Componentes usan OnPush (28/28)
- [ ] Ciclos de detection < 15/seg en idle

### Render Performance
**Herramienta:** Chrome DevTools → Performance

- [ ] TrackBy reduce re-renders (validar con listas grandes)
- [ ] Tiempo de render < 16ms (60 FPS)

### Bundle Size
```bash
npm run build -- --