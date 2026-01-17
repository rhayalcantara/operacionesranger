# Plan de Implementación: Reporte de Empleados por Tipo de Nómina

**Fecha:** 2025-11-11
**Módulo:** Reportes
**Funcionalidad:** Reporte de empleados filtrados por tipo de nómina con exportación a PDF

---

## 1. Resumen Ejecutivo

Implementar un reporte que permita visualizar y exportar a PDF la lista de empleados filtrados por:
- **Un tipo de nómina específico** (por ejemplo: "Quincenal", "Mensual", etc.)
- **Todos los tipos de nómina** (opción "Todos")

El reporte incluirá datos relevantes del empleado (cédula, nombre, puesto, salario, tipo de nómina, estado) y será exportable a PDF con formato profesional utilizando **pdfmake** o biblioteca similar.

---

## 2. Análisis de Estructura Actual

### 2.1 Tablas Involucradas

**Backend:**
- `rh_empleado`: Contiene datos de empleados
  - Campos clave: `id_empleado`, `cedula_empleado`, `nombres`, `apellidos`, `id_puesto`, `id_nomina` (tipo de nómina), `salario_act`, `status`
- `no_tipo_nomina`: Catálogo de tipos de nómina
  - Campos: `id_nomina`, `descripcion`, `periodo_pago`
- `rh_puestos`: Catálogo de puestos
  - Campos: `idpuestos`, `descripcion`

### 2.2 Servicios y Modelos Existentes

**Backend:**
- `empleadoModel.js`: Tiene método `getAll()` que ya filtra por `id_nomina`
- `tipoNominaModel.js`: Manejo de tipos de nómina

**Frontend:**
- `no-tipo-nomina.service.ts`: Servicio para obtener tipos de nómina
- `employee.service.ts`: Servicio para operaciones de empleados

---

## 3. Alcance del Desarrollo

### 3.1 Backend (Node.js + Express)

**Archivo:** `backend-ranger-nomina/routes/reportes.js` (nuevo)

#### Endpoints a crear:

1. **GET `/api/reportes/empleados-por-tipo-nomina`**
   - **Parámetros query:**
     - `id_tipo_nomina` (opcional): ID del tipo de nómina. Si no se envía o es "todos", devuelve todos los empleados
     - `status` (opcional): Filtrar por estado (0 = inactivo, 1 = activo). Por defecto todos.
     - `formato` (opcional): "json" o "pdf" (aunque el PDF se generará en frontend)

   - **Respuesta JSON:**
     ```json
     {
       "success": true,
       "data": {
         "empleados": [
           {
             "id_empleado": 1,
             "cedula_empleado": "001-1234567-8",
             "nombre_completo": "Juan Pérez",
             "puesto": "Desarrollador",
             "tipo_nomina": "Quincenal",
             "periodo_pago": "15 días",
             "salario_act": 45000.00,
             "fecha_ingreso": "2023-01-15",
             "status": 1,
             "status_texto": "Activo"
           },
           // ...
         ],
         "tipo_nomina_filtro": "Quincenal",
         "total_empleados": 25,
         "total_salarios": 1125000.00,
         "fecha_generacion": "2025-11-11 14:30:00"
       }
     }
     ```

   - **Lógica:**
     - JOIN entre `rh_empleado`, `no_tipo_nomina`, `rh_puestos`
     - Filtrar por `id_nomina` si se proporciona
     - Ordenar por tipo de nómina, luego por apellido
     - Calcular totales (cantidad de empleados, suma de salarios)

**Archivo:** `backend-ranger-nomina/models/reportesModel.js` (nuevo)

- Método: `getEmpleadosPorTipoNomina(id_tipo_nomina, status)`

---

### 3.2 Frontend (Angular 20 + Angular Material)

#### 3.2.1 Componente Principal

**Archivo:** `rangernomina-frontend/src/app/reportes/reporte-empleados-tipo-nomina/reporte-empleados-tipo-nomina.component.ts` (nuevo)

**Funcionalidades:**
1. **Selector de Tipo de Nómina:**
   - Dropdown (`mat-select`) con:
     - Opción "Todos los tipos" (valor: null o "todos")
     - Lista de tipos de nómina desde `no_tipo_nomina` (Quincenal, Mensual, etc.)

2. **Filtro de Estado:**
   - Radio buttons o checkbox para:
     - Todos los empleados
     - Solo activos
     - Solo inactivos

3. **Botón "Generar Reporte":**
   - Llama al endpoint del backend
   - Muestra la tabla de resultados

4. **Botón "Exportar a PDF":**
   - Genera PDF usando **pdfmake** con:
     - Encabezado con logo y título del reporte
     - Filtros aplicados
     - Tabla con columnas: Cédula, Nombre, Puesto, Tipo Nómina, Salario, Estado
     - Totales al final (cantidad de empleados, suma de salarios)
     - Fecha y hora de generación
     - Pie de página con número de página

5. **Tabla de Resultados:**
   - `MatTable` con columnas:
     - Cédula
     - Nombre Completo
     - Puesto
     - Tipo de Nómina
     - Periodo de Pago
     - Salario
     - Fecha de Ingreso
     - Estado (badge con color)

   - Paginación local (sin llamadas al backend por cada página)
   - Ordenamiento por columnas

#### 3.2.2 Servicio

**Archivo:** `rangernomina-frontend/src/app/services/reportes.service.ts` (nuevo)

```typescript
export interface ReporteEmpleadosTipoNomina {
  empleados: EmpleadoReporte[];
  tipo_nomina_filtro: string;
  total_empleados: number;
  total_salarios: number;
  fecha_generacion: string;
}

export interface EmpleadoReporte {
  id_empleado: number;
  cedula_empleado: string;
  nombre_completo: string;
  puesto: string;
  tipo_nomina: string;
  periodo_pago: string;
  salario_act: number;
  fecha_ingreso: string;
  status: number;
  status_texto: string;
}
```

Métodos:
- `getReporteEmpleadosPorTipoNomina(id_tipo_nomina?, status?): Observable<ReporteEmpleadosTipoNomina>`

#### 3.2.3 Biblioteca PDF: **pdfmake**

**Instalación:**
```bash
npm install pdfmake
npm install --save-dev @types/pdfmake
```

**Configuración de Fuentes:**
- Usar fuentes estándar de pdfmake (Roboto)
- Opcional: Agregar logo de la empresa (Base64)

**Estructura del PDF:**
```typescript
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

(pdfMake as any).vfs = pdfFonts.pdfMake.vfs;

const documentDefinition = {
  pageSize: 'LETTER',
  pageOrientation: 'landscape', // Para tabla ancha
  pageMargins: [40, 60, 40, 60],
  header: {
    // Logo y título
  },
  content: [
    { text: 'Reporte de Empleados por Tipo de Nómina', style: 'header' },
    { text: `Filtro: ${filtro}`, style: 'subheader' },
    { text: `Fecha: ${fecha}`, style: 'subheader' },
    {
      table: {
        headerRows: 1,
        widths: ['auto', '*', '*', 'auto', 'auto', 'auto', 'auto'],
        body: [
          ['Cédula', 'Nombre', 'Puesto', 'Tipo Nómina', 'Salario', 'Ingreso', 'Estado'],
          // ... filas de datos
        ]
      },
      layout: 'lightHorizontalLines'
    },
    { text: `Total Empleados: ${total}`, style: 'totals' },
    { text: `Total Salarios: RD$ ${suma}`, style: 'totals' }
  ],
  footer: (currentPage, pageCount) => {
    return { text: `Página ${currentPage} de ${pageCount}`, alignment: 'center' };
  },
  styles: {
    header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
    subheader: { fontSize: 12, margin: [0, 0, 0, 5] },
    totals: { fontSize: 12, bold: true, margin: [0, 10, 0, 0] }
  }
};

pdfMake.createPdf(documentDefinition).download('reporte-empleados.pdf');
```

---

## 4. Diseño de UI/UX

### 4.1 Layout del Componente

```
┌──────────────────────────────────────────────────────────┐
│  Reporte de Empleados por Tipo de Nómina                │
├──────────────────────────────────────────────────────────┤
│  [Card con filtros]                                       │
│                                                           │
│  Tipo de Nómina: [Dropdown ▼]  Estado: (•) Todos        │
│                                         ( ) Activos       │
│                                         ( ) Inactivos     │
│                                                           │
│  [Generar Reporte]  [Exportar PDF] (deshabilitado)      │
│                                                           │
├──────────────────────────────────────────────────────────┤
│  [Tabla de resultados - MatTable]                        │
│  Cédula | Nombre | Puesto | Tipo N. | Salario | Estado  │
│  ------------------------------------------------         │
│  001-... | Juan P | Desar. | Quinc.  | 45,000 | [Activo]│
│  ...                                                      │
│                                                           │
│  Total Empleados: 25 | Total Salarios: RD$ 1,125,000    │
│                                                           │
│  [< Anterior] [1] [2] [3] [Siguiente >]                 │
└──────────────────────────────────────────────────────────┘
```

### 4.2 Navegación

- Agregar ítem en menú: **"Reportes" > "Empleados por Tipo de Nómina"**
- Ruta: `/reportes/empleados-tipo-nomina`
- Permisos: Accesible para usuarios con `nivel >= 5` (supervisores y administradores)

---

## 5. Desglose de Tareas (Estimación)

### Backend (4-5 horas)

1. **Crear modelo de reportes** (`reportesModel.js`) - 1h
   - Método `getEmpleadosPorTipoNomina()`
   - Query SQL con JOINs
   - Cálculo de totales
   - Formateo de respuesta

2. **Crear ruta de reportes** (`routes/reportes.js`) - 1h
   - Endpoint GET con validaciones
   - Manejo de errores
   - Autenticación JWT

3. **Pruebas con Postman/Thunder Client** - 0.5h
   - Probar diferentes filtros
   - Validar estructura de respuesta

4. **Pruebas unitarias (Jest)** - 1.5h
   - Test del modelo
   - Test del endpoint
   - Cobertura de casos (todos, específico, sin resultados)

### Frontend (8-10 horas)

1. **Crear servicio de reportes** (`reportes.service.ts`) - 1h
   - Interfaces TypeScript
   - Métodos de llamada al API

2. **Crear componente principal** - 3h
   - Formulario de filtros (tipo nómina, estado)
   - Lógica de generación de reporte
   - Manejo de estados (loading, error, success)

3. **Implementar tabla de resultados** - 2h
   - MatTable con columnas
   - Paginación local
   - Ordenamiento
   - Badges de estado
   - Formateo de moneda (RD$)

4. **Implementar exportación a PDF** - 3h
   - Instalar y configurar pdfmake
   - Crear definición del documento
   - Formatear tabla de datos
   - Agregar encabezados, totales, pie de página
   - Manejar orientación landscape
   - Pruebas de generación

5. **Agregar al menú y routing** - 0.5h
   - Actualizar `app-routing.module.ts`
   - Agregar ítem en `navmenu.component.ts`

6. **Styling y UX** - 1h
   - Diseño responsive
   - Mensajes de feedback (loading, sin datos)
   - Validación de filtros

7. **Pruebas E2E** - 1h
   - Probar flujo completo
   - Validar PDF generado
   - Probar con diferentes filtros

### Documentación (1 hora)

1. **Actualizar TAREAS.md** - 0.5h
2. **Comentarios en código** - 0.5h

---

## 6. Estructura de Archivos a Crear/Modificar

### Backend

```
backend-ranger-nomina/
├── models/
│   └── reportesModel.js                    [NUEVO]
├── routes/
│   └── reportes.js                         [NUEVO]
├── tests/
│   └── reportes.test.js                    [NUEVO]
└── app.js                                  [MODIFICAR] - agregar ruta
```

### Frontend

```
rangernomina-frontend/src/app/
├── reportes/                               [NUEVA CARPETA]
│   ├── reporte-empleados-tipo-nomina/
│   │   ├── reporte-empleados-tipo-nomina.component.ts
│   │   ├── reporte-empleados-tipo-nomina.component.html
│   │   ├── reporte-empleados-tipo-nomina.component.css
│   │   └── reporte-empleados-tipo-nomina.component.spec.ts
│   └── reportes-routing.module.ts
├── services/
│   └── reportes.service.ts                 [NUEVO]
├── app-routing.module.ts                   [MODIFICAR]
└── navmenu/
    └── navmenu.component.ts                [MODIFICAR]
```

---

## 7. Consideraciones Técnicas

### 7.1 Performance

- **Backend:** El reporte puede devolver muchos empleados. Considerar:
  - Límite razonable (¿500 empleados máximo?)
  - Si crece mucho, implementar paginación en backend

- **Frontend:**
  - Paginación local funciona bien hasta ~1000 registros
  - Para más, considerar paginación del servidor

### 7.2 Seguridad

- Validar permisos en backend (JWT)
- Sanitizar inputs (evitar SQL injection, aunque usamos parámetros preparados)
- No exponer datos sensibles innecesarios

### 7.3 Usabilidad

- Mensaje claro si no hay datos: "No se encontraron empleados para el filtro seleccionado"
- Botón de exportar PDF deshabilitado hasta que se genere el reporte
- Loading spinner mientras se carga la data
- Formatear salarios con separadores de miles y símbolo RD$

### 7.4 Extensibilidad

Este reporte sienta las bases para futuros reportes:
- Reporte de nóminas por período
- Reporte de vacaciones
- Reporte de deducciones/ingresos
- Dashboard de métricas (en fase futura)

---

## 8. Flujo de Usuario

1. Usuario navega a **"Reportes" > "Empleados por Tipo de Nómina"**
2. Selecciona filtros:
   - Tipo de nómina: "Quincenal" (o "Todos")
   - Estado: "Activos"
3. Hace clic en **"Generar Reporte"**
4. Sistema muestra tabla con resultados y totales
5. Usuario hace clic en **"Exportar PDF"**
6. Se descarga archivo `reporte-empleados-tipo-nomina-YYYY-MM-DD.pdf`

---

## 9. Criterios de Aceptación

- [ ] Backend devuelve lista de empleados filtrada por tipo de nómina
- [ ] Backend devuelve opción "Todos" (sin filtro)
- [ ] Backend calcula totales correctamente (cantidad, suma salarios)
- [ ] Frontend muestra tabla con datos del reporte
- [ ] Frontend permite filtrar por tipo de nómina y estado
- [ ] Frontend exporta a PDF con formato profesional
- [ ] PDF incluye encabezado, tabla, totales y pie de página
- [ ] PDF se genera en orientación landscape
- [ ] Reporte respeta permisos de usuario
- [ ] Código está documentado y testeado
- [ ] UI es responsive y tiene buen UX

---

## 10. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| pdfmake no se integra bien con Angular 20 | Baja | Alto | Probar instalación temprano, usar alternativa (jsPDF) si falla |
| Performance con muchos empleados | Media | Medio | Implementar paginación en backend si supera 500 registros |
| Formato de PDF no se ve bien | Baja | Bajo | Prototipar diseño antes de implementar lógica completa |
| Incompatibilidad de versiones de Node/npm | Baja | Medio | Documentar versiones exactas, usar package-lock.json |

---

## 11. Próximos Pasos

1. **Revisión del plan** con el usuario
2. **Aprobación** del diseño de UI y estructura de datos
3. **Inicio del desarrollo** según orden de tareas
4. **Revisiones incrementales** (mostrar avances)
5. **Pruebas finales** y ajustes de UX
6. **Deploy** y documentación final

---

## 12. Notas Adicionales

- **Biblioteca alternativa a pdfmake:** Si hay problemas, considerar:
  - **jsPDF** + **jspdf-autotable** (más sencillo, menos flexible)
  - **html2pdf.js** (convierte HTML a PDF, fácil pero menos control)

- **Mejoras futuras:**
  - Exportar también a Excel (usando exceljs)
  - Enviar reporte por email
  - Programar reportes automáticos
  - Agregar gráficos (Chart.js en PDF)

---

**Estimación Total:** 13-16 horas
**Prioridad:** Media
**Dependencias:** Ninguna (módulo independiente)

---

**Preparado por:** Claude Code
**Fecha:** 2025-11-11
