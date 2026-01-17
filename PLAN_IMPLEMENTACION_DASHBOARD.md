### **PLAN DE IMPLEMENTACIÓN: Dashboard Principal (Frontend)**

El objetivo es transformar la página de inicio actual en un panel informativo que ofrezca una vista rápida de los indicadores clave (KPIs) y facilite el acceso a las acciones más comunes.

---

#### **Fase 1: Preparación del Backend (Nuevos Endpoints)**

El frontend necesita una fuente de datos consolidada para el dashboard. Crearemos un único endpoint en el backend que provea toda la información necesaria en una sola llamada para ser más eficientes.

1.  **Crear Nuevo Endpoint:**
    *   **Ruta:** `GET /api/dashboard/summary`
    *   **Descripción:** Devolverá un objeto JSON con los KPIs principales.
    *   **Datos a Incluir:**
        *   `totalEmpleadosActivos`: Conteo total de empleados con `status = 1`.
        *   `ultimaNomina`: Un objeto con detalles de la última nómina cerrada (ej: `{ titulo, montoTotal, fechaFin }`).
        *   `costoNominaAnual`: Suma de los montos totales de todas las nóminas del año actual.
        *   `costoNominaMensual`: Promedio del costo de las nóminas en los últimos 12 meses.
        *   `nominasRecientes`: Un array con las últimas 3-5 nóminas generadas para una lista de acceso rápido.

---

#### **Fase 2: Estructura de Componentes en el Frontend**

Organizaremos el frontend de manera modular para facilitar el desarrollo y mantenimiento.

1.  **Crear Componente Principal:**
    *   Generar un nuevo componente: `ng generate component Dashboard`.
    *   Este componente contendrá la lógica para llamar al servicio y orquestar la presentación de los datos.

2.  **Crear Componente Reutilizable para Tarjetas (Opcional pero recomendado):**
    *   Generar un componente `DashboardCardComponent`.
    *   Este componente recibirá `(icon, title, value, trend)` como `Inputs` para mostrar los KPIs de forma consistente.

3.  **Actualizar el Enrutamiento:**
    *   Modificar `app-routing.module.ts` para que la ruta principal (`/`) después del login apunte al nuevo `DashboardComponent`.

---

#### **Fase 3: Implementación de la Interfaz de Usuario (UI/UX)**

Diseñaremos una interfaz limpia y funcional utilizando Angular Material.

1.  **Layout General:**
    *   Usar un layout de rejilla (`<mat-grid-list>`) para organizar las tarjetas y gráficos de forma responsiva.

2.  **Tarjetas de KPIs (Indicadores Clave):**
    *   Crear 4 tarjetas (`<mat-card>`) principales:
        *   **Total Empleados Activos:** Muestra el conteo total.
        *   **Monto Última Nómina:** Muestra el total pagado en la última nómina.
        *   **Costo Anual (Acumulado):** Muestra la suma de las nóminas del año.
        *   **Costo Mensual (Promedio):** Muestra el promedio mensual.

3.  **Gráfico de Costos de Nómina:**
    *   Implementar un gráfico de barras para visualizar el costo total de las nóminas de los últimos 6 meses.
    *   **Dependencia:** Se necesitará una librería de gráficos como `ngx-charts`.

4.  **Sección de "Acciones Rápidas":**
    *   Añadir botones (`<button mat-raised-button>`) para las tareas más frecuentes:
        *   "Crear Nueva Nómina"
        *   "Ver Última Nómina"
        *   "Gestionar Empleados"

5.  **Tabla de "Nóminas Recientes":**
    *   Mostrar una tabla simple (`<mat-table>`) con las últimas 3-5 nóminas, con un enlace para ver el detalle de cada una.

---

#### **Fase 4: Integración y Lógica del Frontend**

Conectaremos la interfaz de usuario con los datos del backend.

1.  **Crear Servicio de Dashboard:**
    *   Generar un nuevo servicio: `ng generate service Dashboard`.
    *   Implementar un método `getDashboardSummary()` que haga la llamada `GET` al endpoint `/api/dashboard/summary`.

2.  **Conectar Componente con Servicio:**
    *   En `dashboard.component.ts`, inyectar el `DashboardService`.
    *   En el `ngOnInit`, llamar al método `getDashboardSummary()` y asignar los datos recibidos a variables locales.

3.  **Binding de Datos:**
    *   En `dashboard.component.html`, usar interpolación (`{{ }}`) para mostrar los datos en las tarjetas, el gráfico y la tabla.

---

#### **Fase 5: Validación y Pruebas**

Nos aseguraremos de que todo funcione como se espera.

1.  **Prueba de Datos:** Verificar que los números mostrados en el dashboard coinciden con los datos reales de la base de datos.
2.  **Prueba de Navegación:** Confirmar que todos los botones de "Acciones Rápidas" y los enlaces de la tabla de nóminas recientes dirigen a las rutas correctas.
3.  **Prueba de Responsividad:** Asegurar que el layout del dashboard se vea bien en diferentes tamaños de pantalla (escritorio y móvil).
