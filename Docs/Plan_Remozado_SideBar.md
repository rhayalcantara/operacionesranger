# Plan de Remozado del Sidebar (NavMenu)

## Fecha: 2025-12-30

---

## Diagnóstico del Estado Actual

### Problemas Identificados:

1. **Inconsistencia de Colores**
   - Header usa gradiente: `#dae3f6` (azul claro) a `#e0f4ba` (verde claro)
   - Sidebar usa blanco plano sin ninguna relación visual con el header
   - Dashboard usa `#1976d2`, estilos globales usan `#3f51b5`
   - Estado activo usa `bg-blue-50` genérico

2. **Falta de Iconos**
   - Los items del menú tienen divs vacíos con `data-icon` pero sin iconos reales
   - El archivo ejemplo muestra SVGs de Phosphor Icons pero no están implementados

3. **Diseño Plano**
   - Sidebar muy plano y sin personalidad
   - Falta sombra interna y profundidad
   - Las secciones no tienen separación visual clara

4. **UX Mejorable**
   - Los dropdowns en sidebar se muestran como secciones expandidas siempre
   - No hay indicadores visuales de navegación
   - El botón de logout no destaca como acción importante

---

## Paleta de Colores Propuesta (Basada en Header)

```css
/* Colores Primarios (del gradiente del header) */
--primary-blue: #4a6fa5;        /* Azul principal */
--primary-blue-light: #dae3f6;  /* Azul claro del gradiente */
--primary-green-light: #e0f4ba; /* Verde claro del gradiente */

/* Colores del Sidebar */
--sidebar-bg: #f8fafc;          /* Fondo muy claro */
--sidebar-header-bg: linear-gradient(135deg, #dae3f6 0%, #e8f5e3 100%);
--sidebar-item-hover: #e7edf3;
--sidebar-item-active-bg: #dae3f6;
--sidebar-item-active-text: #2563eb;

/* Colores de Texto */
--text-primary: #0e141b;
--text-secondary: #4e7397;
--text-muted: #6b7280;

/* Colores de Acento */
--accent-blue: #2563eb;
--accent-danger: #dc2626;
```

---

## Tareas de Implementación

### Tarea 1: Actualizar Variables de Color (CSS)
- [ ] Crear variables CSS en navmenu.css
- [ ] Reemplazar colores hardcodeados por variables

### Tarea 2: Rediseñar Fondo del Sidebar
- [ ] Agregar gradiente sutil al fondo del sidebar
- [ ] Mejorar el área del logo con fondo distintivo
- [ ] Agregar sombra interior para profundidad

### Tarea 3: Implementar Iconos Material
- [ ] Reemplazar placeholders de iconos por mat-icon
- [ ] Agregar iconos a todos los items del menú
- [ ] Definir iconos para cada sección (Dashboard, Payroll, RRHH, etc.)

### Tarea 4: Mejorar Estados de Items
- [ ] Rediseñar estado hover con transición suave
- [ ] Mejorar estado activo con indicador lateral (barra)
- [ ] Agregar animación sutil al cambiar de estado

### Tarea 5: Mejorar Secciones del Sidebar
- [ ] Agregar separadores visuales entre grupos
- [ ] Mejorar títulos de secciones dropdown
- [ ] Agregar padding y márgenes consistentes

### Tarea 6: Estilizar Footer del Sidebar
- [ ] Destacar botón de logout con color de peligro
- [ ] Agregar separador visual antes del footer
- [ ] Mejorar disposición de elementos inferiores

### Tarea 7: Sincronizar con Dashboard
- [ ] Asegurar que colores primarios coincidan
- [ ] Verificar consistencia en toda la aplicación

---

## Diseño Visual Propuesto

### Sidebar Cerrado:
- Ancho: 280px
- Fondo: Gradiente sutil de arriba hacia abajo (#f8fafc a #f1f5f9)
- Borde derecho: 1px solid #e2e8f0

### Header del Sidebar:
- Fondo: Gradiente que refleje el header principal
- Logo y nombre de empresa prominentes
- Subtítulo "Payroll System" en color secundario

### Items de Menú:
```
┌─────────────────────────────┐
│ ▪ [icon] Dashboard          │  <- Activo (con barra lateral azul)
├─────────────────────────────┤
│   [icon] Payroll      ▼     │  <- Dropdown
│   [icon] RRHH         ▼     │
│   [icon] Importaciones      │
│   [icon] Reportes     ▼     │
│   [icon] Mantenimientos ▼   │
├─────────────────────────────┤
│   PAYROLL                   │  <- Título de sección expandida
│     • Nominas               │
│     • Ingresos/Descuentos   │
│     • Cuotas                │
├─────────────────────────────┤
│   [icon] Cambiar Contraseña │
│   [icon] Logout             │  <- Rojo/danger
└─────────────────────────────┘
```

### Estados de Item:
- **Normal**: Texto #374151, icono #6b7280
- **Hover**: Fondo #e7edf3, texto #0e141b
- **Activo**: Fondo #dae3f6, texto #2563eb, barra lateral azul 3px

---

## Archivos a Modificar

1. `src/app/navmenu/navmenu.css` - Estilos principales
2. `src/app/navmenu/navmenu.html` - Estructura HTML
3. `src/app/navmenu/navmenu.ts` - Agregar iconos a menuItems

---

## Notas Adicionales

- Mantener responsive design actual
- Conservar funcionalidad de toggle sidebar
- No modificar lógica de autenticación
- Usar Angular Material icons (mat-icon) ya importado
