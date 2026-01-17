# Plan de Refactorización de Importaciones

## 1. Crear el Componente Central de Importación
- **Acción:** Generar un nuevo componente `standalone` llamado `ImportacionesComponent` en `src/app/importaciones`.
- **Contenido del Componente:**
    - Un **selector (dropdown)** para que el usuario elija el tipo de importación (ej: "Horas Extras", "Vacaciones").
    - Un único **input de tipo `file`** para seleccionar el archivo.
    - Un botón para "Procesar Archivo".
    - Un área de feedback para mostrar mensajes de éxito o error.
    - Un enlace para descargar una plantilla de Excel para el tipo de importación seleccionado.

## 2. Crear un Servicio Central de Importación
- **Acción:** Crear un nuevo servicio `ImportacionService`.
- **Propósito:** Centralizar las llamadas a los diferentes endpoints del backend.
- **Métodos:**
    - `importarHorasExtras(file: File): Observable<any>`
    - `importarVacaciones(file: File): Observable<any>`

## 3. Implementar la Lógica del Componente
- **Acción:** Conectar el `ImportacionesComponent` con el `ImportacionService`.
- **Lógica:**
    - Usar una estructura `switch` en el componente que, basándose en la opción seleccionada en el dropdown, llame al método correspondiente del servicio.

## 4. Eliminar Componentes Redundantes
- **Acción:** Una vez que el nuevo componente central esté funcionando y probado, eliminar los siguientes componentes antiguos:
    - `ImportarHorasExtrasComponent`
    - `VacacionesImportComponent`

## 5. Actualizar Rutas y Navegación
- **Acción:** Modificar la estructura de navegación de la aplicación.
- **Cambios:**
    - **`app.routes.ts`:**
        - Eliminar las rutas que apuntaban a los componentes viejos.
        - Añadir una única ruta nueva (ej: `/importaciones`) que cargue el `ImportacionesComponent`.
    - **`navmenu.html`:**
        - Eliminar los enlaces "Importar Horas Extras" e "Importar Vacaciones".
        - Reemplazarlos por un único enlace "Importaciones".
