# Tareas para Modificación de Nómina de Operaciones

## Backend (`backend-ranger-nomina`)

### Base de Datos
- [x] **Modificar `no_det_nomina`:**
    - [x] Agregar columna `horas_regulares` (DECIMAL).
    - [x] Agregar columna `horas_extra_diurnas` (DECIMAL).
    - [x] Agregar columna `horas_extra_nocturnas` (DECIMAL).
    - [x] Agregar columna `monto_horas_extra_diurnas` (DECIMAL).
    - [x] Agregar columna `monto_horas_extra_nocturnas` (DECIMAL).

### API y Lógica de Negocio
- [x] **Instalar Dependencia:**
    - [x] Añadir `xlsx` al `package.json` (`npm install xlsx`).
- [x] **Crear Nueva Ruta:**
    - [x] Crear el archivo `routes/import_horas.js`.
    - [x] Definir el endpoint `POST /api/nomina/:id/import-horas`.
    - [x] Integrar la ruta en `server.js`.
- [x] **Crear Nuevo Servicio de Importación:**
    - [x] Crear el archivo `services/importService.js`.
    - [x] Implementar la función para leer y parsear el archivo Excel.
    - [x] Implementar la lógica para obtener el salario de cada empleado.
    - [x] Implementar el cálculo del sueldo bruto (horas regulares, extras diurnas, extras nocturnas).
    - [x] Implementar la lógica para guardar o actualizar los datos en `no_det_nomina`.

## Frontend (`rangernomina-frontend`)

### Componentes y Servicios
- [x] **Crear Nuevo Componente de Importación:**
    - [x] Generar el componente `import-horas` (ej. `ng generate component importaciones/import-horas`).
    - [x] Diseñar el formulario en el HTML del componente.
    - [x] Añadir un `select` para listar y seleccionar nóminas activas.
    - [x] Añadir un `<input type="file">` para la selección del archivo `.xlsx`.
    - [x] Añadir un botón "Procesar".
    - [x] Añadir un área de notificaciones para mostrar éxito o errores.
- [x] **Crear Nuevo Servicio de Frontend:**
    - [x] Generar el servicio `import` (ej. `ng generate service importaciones/import`).
    - [x] Implementar el método que llama al endpoint `POST /api/nomina/:id/import-horas` del backend.

### Navegación y Rutas
- [x] **Agregar Ruta:**
    - [x] Añadir la ruta `/importar-horas` en `src/app/app.routes.ts` apuntando al nuevo componente.
- [x] **Actualizar Menú:**
    - [x] Agregar un enlace en el menú de navegación (`navmenu`) que dirija a `/importar-horas`.

## Pruebas
- [ ] **Pruebas Unitarias (Backend):**
    - [ ] Probar la lógica de cálculo de sueldo en `importService.js`.
- [ ] **Pruebas de Integración:**
    - [ ] Realizar una prueba completa del flujo: subir archivo -> procesar en backend -> verificar datos en DB.
- [ ] **Pruebas de UI (Frontend):**
    - [ ] Verificar que el componente de importación se renderiza correctamente.
    - [ ] Probar la subida del archivo y la interacción con el servicio.