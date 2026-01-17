# PLAN DE MODIFICACIÓN DEL VOLANTE DE PAGO

**Fecha:** 2025-12-30
**Estado:** Pendiente de Aprobación
**Objetivo:** Rediseñar el volante de pago con columnas dinámicas de desc_cred y formato de dos copias por página

---

## 📋 ANÁLISIS DE LA SITUACIÓN ACTUAL

### Estructura Actual del Volante
- **Tamaño de página:** LETTER (8.5" × 11")
- **Copias por página:** 1
- **Márgenes:** 40pt todos los lados
- **Ubicación del código:** `rangernomina-frontend/src/app/components/volante-pago/volante-pago.service.ts`

### Datos Actuales Mostrados

**INGRESOS (Columna Izquierda - Fijos):**
- Sueldo Nómina
- Horas Extras (15%)
- Horas Extras (35%)
- Vacaciones
- Otros Ingresos
- **Subtotal:** TOTAL INGRESOS

**DEDUCCIONES (Columna Derecha - Fijos):**
- ISR
- AFP
- SFS (ARS)
- Otros Descuentos
- Préstamos (hardcoded a $0)
- **Subtotal:** TOTAL DEDUCCIONES

**TOTAL FINAL:**
- SALARIO NETO A PAGAR (destacado con fondo azul)

### Problema Identificado
1. ❌ Las columnas son **fijas** (no dinámicas)
2. ❌ **No se muestran** todos los desc_cred individualmente
3. ❌ Los valores se agrupan en "Otros Ingresos" y "Otros Descuentos"
4. ❌ **Una sola copia** por página (desperdicia papel)
5. ❌ Tamaño carta completo (innecesariamente grande)

---

## 🎯 REQUERIMIENTOS DEL NUEVO DISEÑO

### 1. Dimensiones y Layout

| Aspecto | Valor Actual | Valor Nuevo |
|---------|--------------|-------------|
| **Tamaño de recibo** | 8.5" × 11" | 8.5" × 5.5" (medio carta horizontal) |
| **Copias por página** | 1 | 2 (una encima de otra) |
| **Márgenes** | 40pt | 20pt (reducidos para optimizar espacio) |
| **Página PDF** | LETTER | LETTER (contiene 2 recibos) |

### 2. Datos Dinámicos a Mostrar

#### BLOQUE DE INGRESOS
**Columnas fijas:**
- Sueldo Nómina
- Vacaciones

**Columnas dinámicas (desc_cred con origen='I'):**
- Solo mostrar desc_cred que tengan `valor > 0`
- Ejemplos: "Horas Extras 15%", "Horas Extras 35%", "Bonos", "Comisiones", etc.
- Obtener desde: `no_desc_cred_nomina` JOIN `no_desc_cred`

**Total:**
- **TOTAL INGRESOS** (suma de todo lo anterior)

#### BLOQUE DE DEDUCCIONES
**Columnas fijas de ley:**
- AFP
- SFS (ARS)
- ISR

**Columnas dinámicas (desc_cred con origen='D'):**
- Solo mostrar desc_cred que tengan `valor > 0`
- Ejemplos: "Préstamos", "Cooperativa", "Seguro de Vida", "Cuotas", etc.
- Obtener desde: `no_desc_cred_nomina` JOIN `no_desc_cred`

**Total:**
- **TOTAL DEDUCCIONES** (suma de todo lo anterior)

### 3. Totales a Mostrar

❌ **ELIMINAR:**
- Subtotales internos por agrupación
- Líneas de agrupación como "Otros Ingresos" y "Otros Descuentos"

✅ **MANTENER:**
- **TOTAL INGRESOS** (al final del bloque de ingresos)
- **TOTAL DEDUCCIONES** (al final del bloque de descuentos)
- **TOTAL A PAGAR / NETO** (destacado al final)

### 4. Propósito de las Dos Copias

**Copia Superior:**
- Etiqueta: **"COPIA PARA EL EMPLEADO"**
- Sin espacio para firma

**Copia Inferior:**
- Etiqueta: **"COPIA PARA ARCHIVO - FIRMA DEL EMPLEADO"**
- Con línea para firma: `_________________________`
- Con texto: "Firma del Empleado"

**Línea de corte entre copias:**
- Línea punteada con texto: "✂ CORTAR AQUÍ ✂"

---

## 🏗️ ARQUITECTURA DE LA SOLUCIÓN

### Backend - Cambios Necesarios

#### 1. Endpoint Actual
```
GET /api/det_nomina/:nominaId/empleado/:empleadoId
```

**Respuesta Actual:**
```json
{
  "sueldo_nomina": 25000,
  "he15": 1500,
  "he35": 2000,
  "vacaciones": 0,
  "otros_ingresos": 3500,  // ❌ Agrupado
  "total_ingreso": 32000,
  "desc_isr": 1200,
  "desc_afp": 717.25,
  "desc_sfs": 760,
  "desc_otros": 5000,  // ❌ Agrupado
  "total_descuento": 7677.25,
  "total_pagar": 24322.75
}
```

#### 2. Nuevo Endpoint Necesario

**OPCIÓN A: Modificar el endpoint existente** (RECOMENDADA)

```
GET /api/det_nomina/:nominaId/empleado/:empleadoId?includeDescCred=true
```

**Respuesta Nueva:**
```json
{
  "sueldo_nomina": 25000,
  "vacaciones": 0,
  "total_ingreso": 32000,
  "desc_afp": 717.25,
  "desc_sfs": 760,
  "desc_isr": 1200,
  "total_descuento": 7677.25,
  "total_pagar": 24322.75,

  // ✅ NUEVO: Desglose de desc_cred
  "ingresos_detalle": [
    {
      "id_desc_cred": 6,
      "descripcion": "Horas Extras 15%",
      "valor": 1500
    },
    {
      "id_desc_cred": 7,
      "descripcion": "Horas Extras 35%",
      "valor": 2000
    },
    {
      "id_desc_cred": 10,
      "descripcion": "Bonificación",
      "valor": 3500
    }
  ],

  "descuentos_detalle": [
    {
      "id_desc_cred": 15,
      "descripcion": "Préstamos",
      "valor": 2000
    },
    {
      "id_desc_cred": 16,
      "descripcion": "Cooperativa",
      "valor": 1500
    },
    {
      "id_desc_cred": 20,
      "descripcion": "Seguro de Vida",
      "valor": 1500
    }
  ]
}
```

**OPCIÓN B: Crear nuevo endpoint especializado**

```
GET /api/det_nomina/:nominaId/empleado/:empleadoId/volante-completo
```

### Frontend - Cambios Necesarios

#### Archivos a Modificar:

**1. `volante-pago.service.ts` (Principal)**
- Modificar `VolanteData` interface para incluir arrays de desc_cred
- Actualizar `loadVolanteData()` para usar nuevo endpoint
- Reescribir `buildPdfDefinition()` con:
  - Tamaño personalizado: 8.5" × 5.5" (612 × 396 puntos)
  - Generar 2 copias del recibo
  - Tablas dinámicas basadas en desc_cred
  - Línea de corte entre copias

**2. Lógica del PDF:**
```typescript
buildPdfDefinition() {
  return {
    pageSize: 'LETTER', // 612 × 792 puntos
    pageMargins: [0, 0, 0, 0], // Sin márgenes en la página

    content: [
      // RECIBO 1 (Superior) - Copia para empleado
      generarRecibo(volante, empleado, empresa, 'EMPLEADO', false),

      // Línea de corte
      generarLineaCorte(),

      // RECIBO 2 (Inferior) - Copia para archivo con firma
      generarRecibo(volante, empleado, empresa, 'ARCHIVO', true)
    ]
  };
}

generarRecibo(volante, empleado, empresa, tipo, conFirma) {
  return {
    pageBreak: tipo === 'ARCHIVO' ? undefined : 'after', // NO break si es el segundo
    margin: [20, 20, 20, 20], // Márgenes internos del recibo

    stack: [
      // Header compacto
      generarHeader(empresa),

      // Título
      { text: `COPIA PARA ${tipo}`, alignment: 'right', fontSize: 8, italics: true },
      { text: 'VOLANTE DE PAGO', style: 'title' },

      // Info empleado (compacta)
      generarInfoEmpleado(empleado, volante),

      // Dos columnas: Ingresos y Deducciones
      {
        columns: [
          generarBloqueIngresos(volante),
          generarBloqueDeducciones(volante)
        ]
      },

      // Total a Pagar (destacado)
      generarTotalPagar(volante.total_pagar),

      // Firma (solo si conFirma = true)
      conFirma ? generarEspacioFirma() : null
    ]
  };
}

generarBloqueIngresos(volante) {
  const filas = [];

  // Ingresos fijos
  if (volante.sueldo_nomina > 0) {
    filas.push(['Sueldo Base', formatCurrency(volante.sueldo_nomina)]);
  }
  if (volante.vacaciones > 0) {
    filas.push(['Vacaciones', formatCurrency(volante.vacaciones)]);
  }

  // Ingresos dinámicos (solo con valor > 0)
  volante.ingresos_detalle.forEach(ing => {
    if (ing.valor > 0) {
      filas.push([ing.descripcion, formatCurrency(ing.valor)]);
    }
  });

  // TOTAL
  filas.push([
    { text: 'TOTAL INGRESOS', bold: true, fillColor: '#e8f5e9' },
    { text: formatCurrency(volante.total_ingreso), bold: true, fillColor: '#e8f5e9' }
  ]);

  return {
    table: {
      widths: ['*', 'auto'],
      body: filas
    },
    layout: 'lightHorizontalLines'
  };
}

generarBloqueDeducciones(volante) {
  const filas = [];

  // Descuentos de ley
  if (volante.desc_afp > 0) {
    filas.push(['AFP', formatCurrency(volante.desc_afp)]);
  }
  if (volante.desc_sfs > 0) {
    filas.push(['SFS', formatCurrency(volante.desc_sfs)]);
  }
  if (volante.desc_isr > 0) {
    filas.push(['ISR', formatCurrency(volante.desc_isr)]);
  }

  // Descuentos dinámicos (solo con valor > 0)
  volante.descuentos_detalle.forEach(desc => {
    if (desc.valor > 0) {
      filas.push([desc.descripcion, formatCurrency(desc.valor)]);
    }
  });

  // TOTAL
  filas.push([
    { text: 'TOTAL DEDUCCIONES', bold: true, fillColor: '#ffebee' },
    { text: formatCurrency(volante.total_descuento), bold: true, fillColor: '#ffebee' }
  ]);

  return {
    table: {
      widths: ['*', 'auto'],
      body: filas
    },
    layout: 'lightHorizontalLines'
  };
}

generarLineaCorte() {
  return {
    margin: [0, 10, 0, 10],
    canvas: [
      {
        type: 'line',
        x1: 0, y1: 0,
        x2: 612, y2: 0,
        dash: { length: 5 },
        lineWidth: 1,
        lineColor: '#999999'
      }
    ],
    text: '✂ CORTAR AQUÍ ✂',
    alignment: 'center',
    fontSize: 8,
    color: '#999999',
    margin: [0, -6, 0, 0] // Centrar texto sobre la línea
  };
}

generarEspacioFirma() {
  return {
    margin: [0, 30, 0, 0],
    columns: [
      { width: '*', text: '' },
      {
        width: 200,
        stack: [
          {
            canvas: [
              {
                type: 'line',
                x1: 0, y1: 0,
                x2: 200, y2: 0,
                lineWidth: 1,
                lineColor: '#000000'
              }
            ]
          },
          {
            text: 'Firma del Empleado',
            alignment: 'center',
            fontSize: 8,
            margin: [0, 5, 0, 0]
          }
        ]
      },
      { width: '*', text: '' }
    ]
  };
}
```

---

## 📐 DIMENSIONES Y CÁLCULOS

### Conversión de Unidades (pdfMake usa puntos)
- **1 pulgada = 72 puntos**
- **Página LETTER:** 612 × 792 puntos (8.5" × 11")
- **Medio carta:** 612 × 396 puntos (8.5" × 5.5")

### Distribución en Página LETTER:
```
┌─────────────────────────────────────┐
│  RECIBO 1 (Copia Empleado)          │ 396 puntos
│  - Sin firma                         │ (5.5")
│  - Márgenes: 20pt                    │
├─────────────────────────────────────┤
│  ✂ CORTAR AQUÍ ✂                    │ ~20 puntos
├─────────────────────────────────────┤
│  RECIBO 2 (Copia Archivo)           │ 376 puntos
│  - Con firma                         │ (~5.22")
│  - Márgenes: 20pt                    │
└─────────────────────────────────────┘
Total: 792 puntos (11")
```

### Consideraciones de Espacio:
- **Header:** ~60pt (logo + empresa)
- **Info empleado:** ~80pt
- **Tablas ingresos/deducciones:** ~150-200pt (dinámico)
- **Total a pagar:** ~40pt
- **Firma (si aplica):** ~50pt
- **Márgenes internos:** 40pt (20 + 20)

**TOTAL APROXIMADO:** ~350-380 puntos ✅ Cabe en 396pt

---

## 🔄 FLUJO DE DATOS

```
1. Usuario hace clic en "Ver Volante" desde nomina-detalle
   ↓
2. Frontend llama: loadVolanteData(nominaId, empleadoId)
   ↓
3. Backend ejecuta:
   a) Obtiene datos básicos de no_det_nomina
   b) Obtiene desc_cred de no_desc_cred_nomina WHERE id_nomina AND codigo_empleado
   c) Filtra solo desc_cred con valor > 0
   d) Agrupa en arrays: ingresos_detalle[] y descuentos_detalle[]
   ↓
4. Frontend recibe datos completos
   ↓
5. buildPdfDefinition() construye dos recibos idénticos excepto:
   - Recibo 1: "COPIA PARA EMPLEADO", sin firma
   - Recibo 2: "COPIA PARA ARCHIVO", con línea de firma
   ↓
6. pdfMake genera PDF con ambos recibos en una página LETTER
   ↓
7. Usuario descarga/imprime → Corta por la línea punteada
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Backend
- [ ] Modificar endpoint `/api/det_nomina/:nominaId/empleado/:empleadoId`
- [ ] Agregar query de desc_cred:
  ```sql
  SELECT dcn.id_desc_cred, dc.descripcion, dcn.valor, dc.origen
  FROM no_desc_cred_nomina dcn
  JOIN no_desc_cred dc ON dcn.id_desc_cred = dc.id_desc_cred
  WHERE dcn.id_nomina = ? AND dcn.codigo_empleado = ?
  ```
- [ ] Filtrar solo registros con `valor > 0`
- [ ] Separar en arrays `ingresos_detalle` y `descuentos_detalle`
- [ ] Actualizar respuesta JSON

### Frontend - Interface
- [ ] Actualizar `VolanteData` interface:
  ```typescript
  export interface DescCredDetalle {
    id_desc_cred: number;
    descripcion: string;
    valor: number;
  }

  export interface VolanteData {
    // ... campos existentes
    ingresos_detalle: DescCredDetalle[];
    descuentos_detalle: DescCredDetalle[];
  }
  ```

### Frontend - PDF Generation
- [ ] Modificar `buildPdfDefinition()`:
  - [ ] Cambiar márgenes de página a `[0, 0, 0, 0]`
  - [ ] Crear función `generarRecibo()`
  - [ ] Crear función `generarBloqueIngresos()` con lógica dinámica
  - [ ] Crear función `generarBloqueDeducciones()` con lógica dinámica
  - [ ] Crear función `generarLineaCorte()`
  - [ ] Crear función `generarEspacioFirma()`
  - [ ] Reducir tamaños de fuente para optimizar espacio
  - [ ] Ajustar header y footer más compactos

### Frontend - Layout
- [ ] Header compacto (1 línea con logo pequeño)
- [ ] Info empleado en 2 líneas compactas
- [ ] Tablas sin bordes gruesos (lightHorizontalLines)
- [ ] Total a pagar destacado pero compacto

### Testing
- [ ] Probar con empleado que tiene muchos desc_cred (>10)
- [ ] Probar con empleado que solo tiene ingresos base
- [ ] Probar con empleado sin descuentos adicionales
- [ ] Verificar que las dos copias son idénticas excepto firma
- [ ] Verificar que cabe en una página
- [ ] Imprimir y verificar que la línea de corte queda en el medio

---

## 🎨 MOCKUP VISUAL

```
┌──────────────────────────────────────────────────────────────┐
│ [Logo] RANGER, SRL         RNC: 1-1111111-1    Fecha: 30/12/2025│
├──────────────────────────────────────────────────────────────┤
│                                    COPIA PARA EMPLEADO       │
│                      VOLANTE DE PAGO                          │
│                                                               │
│ Empleado: Juan Pérez     Cédula: 001-1234567-8               │
│ Cargo: Desarrollador     Depto: TI      Período: 01-15/12/25 │
├─────────────────────────────┬────────────────────────────────┤
│      INGRESOS               │       DEDUCCIONES              │
├─────────────────────────────┼────────────────────────────────┤
│ Sueldo Base       $25,000.00│ AFP               $717.25      │
│ HE 15%             $1,500.00│ SFS               $760.00      │
│ HE 35%             $2,000.00│ ISR             $1,200.00      │
│ Bonificación       $3,500.00│ Préstamos       $2,000.00      │
│                             │ Cooperativa     $1,500.00      │
├─────────────────────────────┼────────────────────────────────┤
│ TOTAL INGRESOS   $32,000.00 │ TOTAL DEDUCCIONES $6,177.25    │
└─────────────────────────────┴────────────────────────────────┘
│                                                               │
│        ╔═══════════════════════════════════════╗             │
│        ║  TOTAL A PAGAR:  $25,822.75          ║             │
│        ╚═══════════════════════════════════════╝             │
│                                                               │
│ Este documento es un comprobante oficial de pago             │
├───────────────────────────────────────────────────────────────┤
│              ✂  ✂  ✂  CORTAR AQUÍ  ✂  ✂  ✂                  │
├───────────────────────────────────────────────────────────────┤
│ [Logo] RANGER, SRL         RNC: 1-1111111-1    Fecha: 30/12/2025│
├──────────────────────────────────────────────────────────────┤
│                    COPIA PARA ARCHIVO - FIRMA DEL EMPLEADO   │
│                      VOLANTE DE PAGO                          │
│                                                               │
│ Empleado: Juan Pérez     Cédula: 001-1234567-8               │
│ Cargo: Desarrollador     Depto: TI      Período: 01-15/12/25 │
├─────────────────────────────┬────────────────────────────────┤
│      INGRESOS               │       DEDUCCIONES              │
├─────────────────────────────┼────────────────────────────────┤
│ Sueldo Base       $25,000.00│ AFP               $717.25      │
│ HE 15%             $1,500.00│ SFS               $760.00      │
│ HE 35%             $2,000.00│ ISR             $1,200.00      │
│ Bonificación       $3,500.00│ Préstamos       $2,000.00      │
│                             │ Cooperativa     $1,500.00      │
├─────────────────────────────┼────────────────────────────────┤
│ TOTAL INGRESOS   $32,000.00 │ TOTAL DEDUCCIONES $6,177.25    │
└─────────────────────────────┴────────────────────────────────┘
│                                                               │
│        ╔═══════════════════════════════════════╗             │
│        ║  TOTAL A PAGAR:  $25,822.75          ║             │
│        ╚═══════════════════════════════════════╝             │
│                                                               │
│                  ____________________________                 │
│                      Firma del Empleado                       │
└──────────────────────────────────────────────────────────────┘
```

---

## 🚀 ESTIMACIÓN DE ESFUERZO

| Tarea | Tiempo Estimado | Complejidad |
|-------|-----------------|-------------|
| Modificar endpoint backend | 30 min | Baja |
| Actualizar interfaces TypeScript | 10 min | Baja |
| Reescribir buildPdfDefinition() | 2 horas | Media-Alta |
| Crear funciones auxiliares del PDF | 1 hora | Media |
| Ajustar estilos y diseño | 1 hora | Media |
| Testing y ajustes finales | 30 min | Baja |
| **TOTAL** | **~5 horas** | **Media** |

---

## ⚠️ CONSIDERACIONES Y RIESGOS

### Potenciales Problemas:
1. **Overflow de contenido:** Si un empleado tiene >15 desc_cred, puede no caber
   - **Solución:** Reducir tamaño de fuente dinámicamente
   - **Alternativa:** Paginar en múltiples páginas si excede

2. **Nombres de desc_cred muy largos:** Pueden romper el layout
   - **Solución:** Truncar a 30 caracteres con "..."
   - **Alternativa:** Usar `wordBreak: true`

3. **Totales desbalanceados:** Si ingresos tiene 2 items y descuentos 10
   - **Solución:** Usar `layout: 'lightHorizontalLines'` que ajusta automáticamente

### Compatibilidad:
- ✅ **pdfMake:** Soporta contenido dinámico sin problemas
- ✅ **Impresoras:** Carta es estándar en RD
- ✅ **Navegadores:** PDF se genera client-side (JavaScript)

---

## 📝 NOTAS ADICIONALES

1. **Conservar funcionalidad actual:**
   - Los métodos `downloadPDF()` y `openPDF()` NO cambian
   - Solo cambia la lógica interna de `buildPdfDefinition()`

2. **Backward compatibility:**
   - Si el backend no devuelve `ingresos_detalle` o `descuentos_detalle`, usar arrays vacíos
   - Mostrar solo los campos fijos como fallback

3. **Futuras mejoras (no en este sprint):**
   - Opción para generar una copia simple (sin duplicado)
   - Opción para cambiar tamaño de fuente desde configuración
   - Soporte para otros tamaños de papel (A4, etc.)

---

## ✅ CRITERIOS DE ACEPTACIÓN

El volante estará LISTO cuando:
- [ ] Se generan **2 copias idénticas** en una página LETTER
- [ ] Solo se muestran **desc_cred con valor > 0**
- [ ] Las columnas son **dinámicas** (no fijas)
- [ ] Se eliminaron **todos los subtotales** excepto los 3 requeridos
- [ ] La **línea de corte** es visible y clara
- [ ] La **segunda copia tiene espacio para firma**
- [ ] El diseño **cabe completo** en medio carta (5.5")
- [ ] El PDF se **imprime correctamente** en impresoras estándar
- [ ] **No se pierde información** (todos los desc_cred se muestran)

---

**¿Apruebas este plan para proceder con la implementación?**
