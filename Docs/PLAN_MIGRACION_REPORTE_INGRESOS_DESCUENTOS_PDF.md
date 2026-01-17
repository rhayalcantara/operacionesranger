# Plan de Migración: Reporte Ingresos/Descuentos a PDFMake

**Fecha de creación:** 2025-11-17
**Responsable:** Claude Code
**Objetivo:** Migrar el reporte de ingresos y descuentos de `window.print()` a generación profesional de PDF usando pdfMake

---

## 1. Problema Identificado

### Situación Actual
El componente `reporte-ingresos-descuentos` ubicado en:
```
rangernomina-frontend/src/app/components/reporte-ingresos-descuentos/
```

**Problema:**
- Utiliza `window.print()` para generar reportes (línea 103 del archivo TypeScript)
- Esto abre el diálogo de impresión del navegador
- Genera una "captura de pantalla" de la vista HTML actual
- No produce un PDF estructurado ni profesional
- Carece de formato, encabezados, paginación automática y totales

**Evidencia:**
- Imagen `Docs/desc_cred_grupo.png` muestra diálogo de impresión con mensaje "No se encontraron ingresos para esta nómina"
- No tiene estructura profesional como la imagen `Docs/reporte_empleados.png`

---

## 2. Solución Propuesta

### Enfoque
Migrar a **pdfMake** siguiendo el patrón ya establecido en el componente:
```
rangernomina-frontend/src/app/reportes/reporte-empleados-tipo-nomina/
```

Este componente ya implementa correctamente pdfMake y sirve como referencia arquitectural.

---

## 3. Análisis de Código

### 3.1 Código Actual (reporte-ingresos-descuentos.ts)

**Estructura existente:**
- ✅ Selección de nómina (lista desplegable)
- ✅ Servicio `DescCredNominaService` con método `getReporteAgrupado()`
- ✅ Modelo de datos `ReporteAgrupadoResponse` con estructura:
  ```typescript
  {
    ingresos: {
      grupos: Array<{ id_no_desc_cred, nombre_completo, items[], total }>
    },
    descuentos: {
      grupos: Array<{ id_no_desc_cred, nombre_completo, items[], total }>
    }
  }
  ```
- ✅ Formateadores: `formatearMoneda()`, `formatearFecha()`
- ❌ Método `imprimir()` usa `window.print()` (REEMPLAZAR)

**Líneas de código relevantes:**
- Línea 102-104: Método actual de impresión
- Línea 84-89: Formateador de moneda (reutilizable)
- Línea 91-95: Formateador de fecha (reutilizable)
- Línea 68-82: Servicio de reporte agrupado

### 3.2 Código de Referencia (reporte-empleados-tipo-nomina.component.ts)

**Implementación pdfMake exitosa:**
- Línea 18-19: Imports de pdfMake y pdfFonts
- Línea 128-153: Método `exportarPDF()` con:
  - Validación de datos
  - Configuración de fuentes VFS
  - Creación y descarga del PDF
  - Manejo de errores
- Línea 155-328: Método `crearDefinicionPDF()` que define:
  - Configuración de página (tamaño, orientación, márgenes)
  - Header dinámico con nombre y paginación
  - Contenido estructurado (título, metadata, tablas)
  - Footer con fecha
  - Estilos profesionales
- Línea 341-360: Métodos auxiliares (formateo, nombres de archivo)

**Características destacadas:**
- Orientación `landscape` para tablas anchas
- Colores alternos en filas para mejor lectura
- Márgenes configurables
- Paginación automática
- Descarga con nombre de archivo descriptivo

---

## 4. Diseño de Estructura del PDF

### 4.1 Configuración de Página
```typescript
{
  pageSize: 'LETTER',
  pageOrientation: 'portrait',  // Vertical, suficiente para 3 columnas
  pageMargins: [40, 80, 40, 60]  // [izq, arriba, der, abajo]
}
```

### 4.2 Encabezado (Header)
```
┌────────────────────────────────────────────────────┐
│ Ranger Nómina                    Página X de Y     │
└────────────────────────────────────────────────────┘
```

### 4.3 Contenido Principal

**Título:**
```
Reporte de Ingresos y Descuentos por Nómina
```

**Metadata:**
```
Nómina: [Descripción de la nómina - Período]
Fecha de generación: [DD/MM/YYYY HH:MM:SS]
```

**Sección Ingresos:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INGRESOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Nombre del Grupo 1 - Ej: "Horas Extras 35%"]
┌──────────────────────────┬────────────┬───────────────┐
│ Empleado                 │ Fecha      │ Valor         │
├──────────────────────────┼────────────┼───────────────┤
│ Juan Pérez               │ 15/11/2025 │ RD$1,500.00   │
│ María García             │ 16/11/2025 │ RD$2,300.00   │
└──────────────────────────┴────────────┴───────────────┘
                              Subtotal: RD$3,800.00

[Nombre del Grupo 2 - Ej: "Bonificaciones"]
┌──────────────────────────┬────────────┬───────────────┐
│ Empleado                 │ Fecha      │ Valor         │
├──────────────────────────┼────────────┼───────────────┤
│ Pedro López              │ 17/11/2025 │ RD$5,000.00   │
└──────────────────────────┴────────────┴───────────────┘
                              Subtotal: RD$5,000.00

                 TOTAL GENERAL INGRESOS: RD$8,800.00
```

**Sección Descuentos:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DESCUENTOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Similar estructura que ingresos]

                 TOTAL GENERAL DESCUENTOS: RD$4,200.00
```

### 4.4 Pie de Página (Footer)
```
┌────────────────────────────────────────────────────┐
│   Generado por Ranger Nómina - [17/11/2025]       │
└────────────────────────────────────────────────────┘
```

### 4.5 Manejo de Casos Especiales

**Si no hay ingresos:**
```
INGRESOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
No se encontraron ingresos para esta nómina.
```

**Si no hay descuentos:**
```
DESCUENTOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
No se encontraron descuentos para esta nómina.
```

---

## 5. Cambios Técnicos Requeridos

### 5.1 Imports (Agregar al inicio del archivo)
```typescript
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
```

### 5.2 Nuevos Métodos en el Componente

#### A. `exportarPDF(): void`
**Ubicación:** Después del método `limpiar()`
**Propósito:** Punto de entrada para generar el PDF
**Responsabilidades:**
1. Validar que `this.reporte` tiene datos
2. Configurar pdfMake con fuentes VFS
3. Crear definición del PDF
4. Descargar archivo con nombre descriptivo
5. Manejar errores y notificar al usuario

**Pseudocódigo:**
```typescript
exportarPDF(): void {
  if (!this.reporte) {
    this.notificationService.showError('No hay datos...');
    return;
  }

  try {
    // Configurar fuentes
    pdfMake.vfs = pdfFonts.pdfMake.vfs;

    // Crear y descargar
    const docDef = this.crearDefinicionPDF();
    pdfMake.createPdf(docDef).download('reporte-ingresos-descuentos-[fecha].pdf');

    this.notificationService.showSuccess('PDF generado');
  } catch (error) {
    this.notificationService.showError('Error al generar PDF');
  }
}
```

#### B. `crearDefinicionPDF(): any`
**Ubicación:** Método privado después de `exportarPDF()`
**Propósito:** Construir la definición completa del documento PDF
**Estructura de retorno:**
```typescript
{
  pageSize: 'LETTER',
  pageOrientation: 'portrait',
  pageMargins: [40, 80, 40, 60],
  header: (currentPage, pageCount) => { ... },
  content: [
    // Título
    // Metadata
    // Sección Ingresos
    // Sección Descuentos
  ],
  footer: (currentPage, pageCount) => { ... },
  styles: { ... },
  defaultStyle: { fontSize: 9 }
}
```

#### C. `crearSeccionIngresos(): any[]`
**Propósito:** Generar contenido de la sección de ingresos
**Lógica:**
1. Agregar título de sección con estilo destacado
2. Iterar sobre `this.reporte.ingresos.grupos`
3. Para cada grupo:
   - Agregar subtítulo con nombre del grupo
   - Crear tabla con columnas: Empleado | Fecha | Valor
   - Agregar filas con datos de `items[]`
   - Mostrar subtotal del grupo
4. Agregar total general de ingresos
5. Si no hay grupos, mostrar mensaje informativo

**Retorno:** Array de elementos de contenido pdfMake

#### D. `crearSeccionDescuentos(): any[]`
**Propósito:** Generar contenido de la sección de descuentos
**Lógica:** Idéntica a `crearSeccionIngresos()` pero para descuentos

#### E. `crearTablaGrupo(items: any[]): any`
**Propósito:** Crear definición de tabla para un grupo específico
**Parámetros:**
- `items`: Array de items del grupo con estructura:
  ```typescript
  {
    nombre_completo: string,
    fecha: string,
    valor: number
  }
  ```

**Retorno:**
```typescript
{
  table: {
    headerRows: 1,
    widths: ['*', 'auto', 'auto'],  // Empleado flexible, Fecha/Valor auto
    body: [
      // Encabezado
      [
        { text: 'Empleado', style: 'tableHeader' },
        { text: 'Fecha', style: 'tableHeader' },
        { text: 'Valor', style: 'tableHeader' }
      ],
      // Filas de datos
      ...items.map(item => [
        item.nombre_completo,
        this.formatearFecha(item.fecha),
        this.formatearMoneda(item.valor)
      ])
    ]
  },
  layout: {
    fillColor: (rowIndex) => rowIndex === 0 ? '#e0e0e0' : (rowIndex % 2 === 0 ? '#f5f5f5' : null),
    hLineWidth: () => 0.5,
    vLineWidth: () => 0.5,
    hLineColor: () => '#cccccc',
    vLineColor: () => '#cccccc'
  }
}
```

#### F. `obtenerNombreNomina(): string`
**Propósito:** Obtener descripción legible de la nómina seleccionada
**Lógica:**
```typescript
const nomina = this.nominas.find(n => n.id_nomina === this.nominaSeleccionada);
return nomina ? `${nomina.descripcion} - ${nomina.periodo}` : 'N/A';
```

#### G. `obtenerFechaArchivo(): string`
**Propósito:** Generar timestamp para nombre de archivo
**Formato:** `YYYY-MM-DD`
**Ejemplo:** `2025-11-17`

### 5.3 Estilos del Documento

```typescript
styles: {
  documentHeader: {
    fontSize: 10,
    color: '#666666'
  },
  pageNumber: {
    fontSize: 9,
    color: '#666666'
  },
  title: {
    fontSize: 16,
    bold: true,
    margin: [0, 0, 0, 10],
    alignment: 'center'
  },
  sectionTitle: {
    fontSize: 14,
    bold: true,
    margin: [0, 15, 0, 10],
    fillColor: '#e3f2fd',
    color: '#1976d2'
  },
  groupTitle: {
    fontSize: 11,
    bold: true,
    margin: [0, 10, 0, 5],
    color: '#424242'
  },
  metadata: {
    fontSize: 10,
    margin: [0, 2, 0, 2]
  },
  tableHeader: {
    bold: true,
    fontSize: 10,
    color: 'black',
    fillColor: '#e0e0e0'
  },
  subtotal: {
    fontSize: 10,
    bold: true,
    alignment: 'right',
    margin: [0, 5, 0, 0]
  },
  totalGeneral: {
    fontSize: 12,
    bold: true,
    alignment: 'right',
    margin: [0, 10, 0, 5],
    color: '#1976d2'
  },
  noData: {
    fontSize: 10,
    italics: true,
    color: '#666666',
    margin: [0, 5, 0, 10]
  },
  footer: {
    fontSize: 8,
    color: '#666666',
    margin: [0, 10, 0, 0]
  }
}
```

### 5.4 Cambios en el Template HTML

**Archivo:** `reporte-ingresos-descuentos.html`

**Cambio 1: Botón de exportación**
```html
<!-- ANTES -->
<button mat-raised-button color="primary" (click)="imprimir()">
  <mat-icon>print</mat-icon>
  Imprimir
</button>

<!-- DESPUÉS -->
<button mat-raised-button color="primary" (click)="exportarPDF()">
  <mat-icon>picture_as_pdf</mat-icon>
  Exportar PDF
</button>
```

**Cambio 2: Directivas de impresión (ELIMINAR)**
```html
<!-- ELIMINAR clases @media print si existen -->
```

### 5.5 Cambios en el CSS

**Archivo:** `reporte-ingresos-descuentos.css`

**Acción:** Eliminar o comentar reglas `@media print` si existen, ya que no serán necesarias.

---

## 6. Casos de Prueba

### 6.1 Caso 1: Nómina con Ingresos y Descuentos
**Input:**
- Nómina seleccionada: ID 123
- Ingresos: 2 grupos con 5 items totales
- Descuentos: 1 grupo con 3 items

**Output esperado:**
- PDF descargado con nombre: `reporte-ingresos-descuentos-2025-11-17.pdf`
- Sección de ingresos con 2 tablas + subtotales + total general
- Sección de descuentos con 1 tabla + subtotal + total general
- Paginación correcta si excede una página
- Notificación de éxito

### 6.2 Caso 2: Nómina Solo con Ingresos
**Input:**
- Ingresos: 1 grupo con 2 items
- Descuentos: array vacío

**Output esperado:**
- Sección de ingresos con datos
- Sección de descuentos con mensaje: "No se encontraron descuentos para esta nómina"
- PDF generado correctamente

### 6.3 Caso 3: Nómina Sin Datos
**Input:**
- Ingresos: array vacío
- Descuentos: array vacío

**Output esperado:**
- Ambas secciones muestran mensaje de "no encontrados"
- PDF se genera de todas formas
- Notificación informativa

### 6.4 Caso 4: Sin Nómina Seleccionada
**Input:**
- Click en "Exportar PDF" sin seleccionar nómina

**Output esperado:**
- Notificación de error: "No hay datos para exportar"
- No se genera PDF

### 6.5 Caso 5: Error en Generación
**Input:**
- Datos corruptos o error en pdfMake

**Output esperado:**
- Catch del error
- Notificación de error al usuario
- Log en consola para debugging

---

## 7. Ventajas de la Solución

### 7.1 Técnicas
- ✅ **Consistencia arquitectural**: Usa el mismo patrón que reporte-empleados
- ✅ **Reutilización de código**: Aprovecha formateadores existentes
- ✅ **Escalabilidad**: Fácil agregar nuevas secciones o columnas
- ✅ **Mantenibilidad**: Código organizado en métodos con responsabilidad única
- ✅ **Type safety**: TypeScript valida estructuras de datos

### 7.2 Funcionales
- ✅ **PDF profesional**: Formato estructurado y visualmente atractivo
- ✅ **Portabilidad**: PDF funciona en cualquier dispositivo
- ✅ **Trazabilidad**: Nombre de archivo incluye fecha de generación
- ✅ **Usabilidad**: Un solo click para descargar
- ✅ **Accesibilidad**: Tablas bien estructuradas, fáciles de leer

### 7.3 De Negocio
- ✅ **Auditabilidad**: Reportes formales para compliance
- ✅ **Distribución**: Fácil enviar por email o sistemas documentales
- ✅ **Impresión opcional**: Usuario decide si imprimir el PDF
- ✅ **Branding**: Encabezado/pie de página con nombre del sistema

---

## 8. Cronograma de Implementación

### Fase 1: Preparación (5 minutos)
- [x] Analizar código actual
- [x] Revisar código de referencia
- [ ] Crear documento de plan (este archivo)

### Fase 2: Desarrollo (15 minutos)
- [ ] Agregar imports de pdfMake
- [ ] Implementar método `exportarPDF()`
- [ ] Implementar método `crearDefinicionPDF()`
- [ ] Implementar métodos auxiliares de secciones
- [ ] Implementar método `crearTablaGrupo()`
- [ ] Definir estilos del documento

### Fase 3: Integración (5 minutos)
- [ ] Modificar template HTML (botón)
- [ ] Actualizar CSS (eliminar print media queries)
- [ ] Eliminar método `imprimir()` antiguo

### Fase 4: Pruebas (10 minutos)
- [ ] Probar con nómina completa (ingresos + descuentos)
- [ ] Probar con solo ingresos
- [ ] Probar con solo descuentos
- [ ] Probar sin datos
- [ ] Probar manejo de errores
- [ ] Verificar paginación en reportes largos

### Fase 5: Documentación (5 minutos)
- [ ] Actualizar comentarios en código
- [ ] Documentar cambios en CHANGELOG (si existe)
- [ ] Marcar tarea como completada en TAREAS.md

**Tiempo total estimado:** 40 minutos

---

## 9. Riesgos y Mitigaciones

### Riesgo 1: Dependencias de pdfMake no instaladas
**Probabilidad:** Baja
**Impacto:** Alto
**Mitigación:** Verificar `package.json` y ejecutar `npm install` si es necesario

### Riesgo 2: Datos con caracteres especiales
**Probabilidad:** Media
**Impacto:** Bajo
**Mitigación:** pdfMake maneja UTF-8 automáticamente, pero validar con nombres con tildes

### Riesgo 3: Tablas muy largas en una página
**Probabilidad:** Media
**Impacto:** Bajo
**Mitigación:** pdfMake tiene paginación automática, pero considerar `pageBreak: 'after'` entre grupos

### Riesgo 4: Rendimiento con muchos datos
**Probabilidad:** Baja
**Impacto:** Medio
**Mitigación:** pdfMake es eficiente, pero si hay >1000 items considerar loader

---

## 10. Criterios de Aceptación

### Funcionales
- [ ] El botón "Exportar PDF" descarga un archivo PDF
- [ ] El PDF contiene todas las secciones definidas (header, content, footer)
- [ ] Los datos de ingresos se muestran correctamente agrupados
- [ ] Los datos de descuentos se muestran correctamente agrupados
- [ ] Los totales y subtotales son correctos
- [ ] El formato de moneda es consistente (RD$)
- [ ] Las fechas están en formato DD/MM/YYYY
- [ ] Se manejan correctamente casos sin datos

### No Funcionales
- [ ] El PDF se genera en menos de 2 segundos
- [ ] El código sigue los estándares del proyecto
- [ ] No se generan errores en consola
- [ ] El componente es responsive (aunque el PDF es fijo)
- [ ] La UX incluye notificaciones de éxito/error

### Técnicos
- [ ] No se usa `window.print()`
- [ ] Se reutilizan formateadores existentes
- [ ] Los tipos TypeScript son correctos
- [ ] El código está comentado adecuadamente
- [ ] No hay código duplicado

---

## 11. Rollback Plan

En caso de que la implementación falle:

### Opción 1: Revertir Cambios (Recomendada)
```bash
git checkout -- rangernomina-frontend/src/app/components/reporte-ingresos-descuentos/
```

### Opción 2: Mantener Ambos Métodos Temporalmente
- Mantener `imprimir()` con `window.print()`
- Agregar `exportarPDF()` como funcionalidad adicional
- Dos botones en UI: "Imprimir" y "Exportar PDF"
- Deprecar `window.print()` en versión futura

---

## 12. Referencias

### Documentación
- [pdfMake Documentation](http://pdfmake.org)
- [pdfMake Playground](http://pdfmake.org/playground.html)

### Archivos del Proyecto
- **Referencia exitosa:** `rangernomina-frontend/src/app/reportes/reporte-empleados-tipo-nomina/`
- **A modificar:** `rangernomina-frontend/src/app/components/reporte-ingresos-descuentos/`
- **Servicio usado:** `rangernomina-frontend/src/app/services/desc-cred-nomina.service.ts`
- **Imágenes de referencia:**
  - `Docs/desc_cred_grupo.png` (estado actual - problema)
  - `Docs/reporte_empleados.png` (estado deseado - solución)

### Modelos de Datos
```typescript
interface ReporteAgrupadoResponse {
  ingresos: {
    grupos: Array<{
      id_no_desc_cred: number;
      nombre_completo: string;
      items: Array<{
        nombre_completo: string;
        fecha: string;
        valor: number;
      }>;
      total: number;
    }>;
    total_general: number;
  };
  descuentos: {
    // Misma estructura que ingresos
  };
}
```

---

## 13. Aprobación

**Plan creado por:** Claude Code
**Fecha:** 2025-11-17
**Estado:** ⏳ Pendiente de aprobación

**Para aprobar este plan, el usuario debe:**
1. Revisar todas las secciones
2. Validar que el enfoque es correcto
3. Aprobar o solicitar ajustes
4. Dar luz verde para proceder con la implementación

---

## Notas Adicionales

- Este plan está basado en el análisis de código real del proyecto
- Sigue las mejores prácticas de Angular y TypeScript
- Mantiene consistencia con patrones ya establecidos en el proyecto
- Prioriza mantenibilidad y escalabilidad sobre soluciones rápidas
- Documenta todos los cambios para auditoría futura

**Próximo paso:** Esperar aprobación del usuario para proceder con la implementación.
