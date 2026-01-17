# Lista de Tareas Detallada - Ranger Nomina

Este archivo contiene la lista de tareas extraída del plan de trabajo principal. Está organizada por fases para facilitar el seguimiento y asegurar la calidad a través de pruebas.

## Fase 1: Seguridad y Fundamentos (Prioridad Inmediata) - COMPLETADA

*   **Tarea: Implementar `bcrypt.compare()` en Login (Backend)**
    *   [x] **Implementación:** Modificar la ruta `/login` para usar `bcrypt.compare()` para comparar de forma segura la contraseña enviada con el hash almacenado.
    *   [x] **Validación:** (Verificado en código) La lógica de comparación segura ya está implementada.

*   **Tarea: Hashear Contraseñas Existentes (Backend)**
    *   [x] **Implementación:** Crear un script único para migrar todas las contraseñas de texto plano en la BD a formato hasheado.
    *   [x] **Validación:** Ejecutar el script en un entorno de prueba y verificar que un usuario puede hacer login con su contraseña original después de la migración.

*   **Tarea: Configurar Variables de Entorno (Backend)**
    *   [x] **Implementación:** Instalar `dotenv` y mover todas las credenciales (`db.js`) y secretos (`JWT_SECRET`) a un nuevo archivo `.env`.
    *   [x] **Validación:** (Verificado en código) El servidor ya carga la configuración desde un archivo `.env`.
    *   [x] **Implementación:** Añadir `.env` al archivo `.gitignore`.
    *   [x] **Validación:** (Verificado en código) El archivo `.gitignore` ya ignora los archivos `.env`.

*   **Tarea: Validar Expiración de JWT (Frontend)**
    *   [x] **Implementación:** En `auth-guard.ts`, añadir lógica para decodificar el JWT y verificar su fecha de expiración (`exp`). Redirigir a login si ha expirado.
    *   [x] **Validación:** (Verificado en código) El `AuthGuard` ya implementa la validación de expiración del token.

*   **Tarea: Configurar Entorno de Pruebas (Proyecto)**
    *   [x] **Implementación:** Configurar un framework de pruebas como Jest para el backend.
    *   [x] **Validación:** (Verificado en código) El proyecto ya cuenta con Jest, Supertest, un script de prueba y una suite de pruebas de autenticación.

*   **Tarea: Robustecer la Gestión de Sesión del Usuario (Frontend)**
    *   [x] **Implementación:** Al expirar el token JWT, asegurar que tanto el token como la información del usuario sean eliminados del `localStorage`.
    *   [x] **Implementación:** Estandarizar el uso de la clave `jwt_token` en todo el `localStorage` para evitar inconsistencias.
    *   [x] **Validación:** Verificar que al cerrar sesión o cuando el token expira, el usuario es redirigido al login y toda la información de sesión es eliminada.

*   **Tarea: Delimitar opciones por nivel de usuario (Frontend)**
    *   [x] **Implementación:** Guardar el usuario en `localStorage` al iniciar sesión.
    *   [x] **Implementación:** Crear un `UserService` para obtener el nivel del usuario.
    *   [x] **Implementación:** En el formulario de empleado, ocultar la sección de despido para usuarios que no sean nivel 9.
    *   [x] **Validación:** Iniciar sesión con un usuario de nivel diferente a 9 y verificar que la sección de despido no es visible. Iniciar sesión con un usuario de nivel 9 y verificar que la sección es visible.

## Fase 2: Módulos de Mantenimiento

*   **Tarea: Crear Mantenimiento de Usuarios (Fullstack)**
    *   [x] **Implementación:** Desarrollar rutas (backend) y componentes (frontend) para Crear, Leer, Actualizar y Eliminar usuarios del sistema (`sys_usuarios`).
    *   [x] **Implementación:** Asegurar que las contraseñas se hasheen con `bcrypt.hash()` antes de ser almacenadas o actualizadas en la base de datos.
    *   [x] **Validación:** Probar todas las operaciones CRUD para usuarios, incluyendo la creación y actualización de contraseñas, y verificar que el login funciona con las nuevas credenciales.

*   **Tarea: Corregir error 500 en listado de usuarios (Fullstack)**
    *   [x] **Implementación (Backend):** Corregir la llamada a `Usuario.getAll()` por `Usuario.findAll()` en la ruta `GET /api/usuarios`.
    *   [x] **Implementación (Backend):** Añadir logging de errores en la ruta para capturar y registrar excepciones del servidor.
    *   [x] **Validación:** Acceder al listado de usuarios y verificar que la tabla se carga correctamente sin errores 500 en la consola.

*   **Tarea: Completar CRUDs de Mantenimiento (Frontend)**
    *   [x] **Implementación:** Revisar y completar las operaciones de Crear, Leer, Actualizar y Borrar para todos los módulos de mantenimiento.
    *   [x] **Validación:** Para cada módulo, realizar manualmente las 4 operaciones CRUD y verificar que los cambios se reflejan correctamente.
    *   Módulos a verificar: [x] Departamentos, [x] Bancos, [x] Tipos de Nómina, [x] Sub-Nóminas, [x] Descuentos/Créditos, [x] ISR.

*   **Tarea: Implementar Servicio de Notificaciones (Frontend)**
    *   [x] **Implementación:** Crear un servicio global (usando Angular Material Snackbar) para dar feedback visual al usuario.
    *   [x] **Validación:** Al guardar o eliminar un registro en un CRUD, verificar que aparezca la notificación correspondiente.

*   **Tarea: Unificar Diseño de Formularios (UI/UX)**
    *   [x] **Implementación:** Aplicar el estilo visual del formulario de Empleados a todos los demás formularios CRUD.
    *   [x] **Validación:** Revisar visualmente cada formulario y confirmar que todos comparten la misma estructura y componentes.

*   **Tarea: Estandarizar el formato del listado de  Gestión de Cuotas utiliza el formato del listado de empleados (UI/UX)**
    *   [x] **Implementación:** Aplicar el estilo visual del listado de empleados al listado de Gestión de Cuotas.
    *   [x] **Validación:** Revisar visualmente el listado y confirmar que comparte la misma estructura y componentes.

*   **Tarea: Agregar campo `observacion_despido` a la tabla `rh_empleado` (Fullstack)**
    *   [x] **Implementación:** Agregar el campo `observacion_despido` a la tabla `rh_empleado` en la base de datos.
    *   [x] **Implementación:** Actualizar el backend para incluir el nuevo campo en los modelos y rutas de empleados.
    *   [x] **Implementación:** Actualizar el frontend para incluir el nuevo campo en el formulario de empleados.
    *   [x] **Validación:** Probar que el campo se guarda y se muestra correctamente en la aplicación.

*   **Tarea: Corregir subida y visualización de foto de empleado (Fullstack)**
    *   [x] **Implementación:** Modificar el tipo de dato del campo `foto` a `LONGBLOB` en la base de datos.
    *   [x] **Implementación:** Ajustar el backend para decodificar la imagen Base64 a `blob` al guardar y codificarla a Base64 al leer.
    *   [x] **Implementación:** Utilizar `DomSanitizer` en el frontend para mostrar la imagen de forma segura.
    *   [x] **Validación:** Subir, guardar y visualizar la foto de un empleado para confirmar que el ciclo completo funciona.

*   **Tarea: Maximizar foto de empleado al hacer click (Frontend)**
    *   [x] **Implementación:** Agregar un evento de clic a la foto del empleado en el formulario.
    *   [x] **Implementación:** Crear una función que abra la foto en una nueva pestaña del navegador.
    *   [x] **Validación:** Hacer clic en la foto de un empleado y verificar que se abre en una nueva pestaña y se muestra correctamente.

*   **Tarea: Añadir filtro de seleccionados en tabla de empleados (Frontend)**
    *   [x] **Implementación:** Añadir un checkbox "Mostrar solo seleccionados" y un contador en el componente de selección de empleados.
    *   [x] **Implementación:** Implementar la lógica en el componente para filtrar la tabla y mostrar solo los empleados seleccionados.
    *   [x] **Validación:** En una pantalla que utilice el selector de empleados (ej. Ingresos/Descuentos Manuales), seleccionar varios empleados y activar el filtro para verificar que solo se muestran los seleccionados y el contador es correcto.

*   **Tarea: Filtrar empleados activos en el selector de vacaciones (Frontend)**
    *   [x] **Implementación:** Crear un nuevo endpoint en el backend (`/api/empleados/activos`) que devuelve solo los empleados con `status = 1`.
    *   [x] **Implementación:** Modificar el servicio `EmployeeService` en el frontend para incluir un método `getActiveEmployees` que consuma el nuevo endpoint.
    *   [x] **Implementación:** Actualizar el componente del formulario de vacaciones (`vacaciones-form.component.ts`) para que utilice el nuevo método y solo cargue empleados activos en el selector.
    *   [x] **Validación:** Acceder al formulario de programación de vacaciones y verificar que en el selector de empleados solo aparecen aquellos que están activos en el sistema.

*   **Tarea: Corregir error en listado de ARS (Frontend)**
    *   [x] **Implementación:** Se modificó el componente `ars.ts` y `employee-form.ts` para manejar correctamente la respuesta del API, ya sea un array de objetos o un objeto con una propiedad `data`.
    *   [x] **Validación:** Se verificó que el listado de ARS se muestra correctamente en el mantenimiento de ARS y en el formulario de empleados.

*   **Tarea: Implementar paginador en mantenimiento de ARS (Fullstack)**
    *   [x] **Implementación (Backend):** Se modificó el modelo `arsModel.js` para que el método `getAll` siempre devuelva una respuesta paginada, con valores por defecto para la página y el límite.
    *   [x] **Implementación (Frontend):** Se añadió el `MatPaginatorModule` y `MatProgressSpinnerModule` al componente `ars.ts`.
    *   [x] **Implementación (Frontend):** Se añadió el paginador y un spinner de carga al template `ars.html`.
    *   [x] **Implementación (Frontend):** Se actualizó el componente `ars.ts` para manejar los eventos del paginador y el estado de carga.
    *   [x] **Implementación (Frontend):** Se actualizó el servicio `ars.service.ts` para que el método `getArs` acepte parámetros de paginación.
    *   [x] **Implementación (Frontend):** Se actualizó el componente `employee-form.ts` para que siga obteniendo la lista completa de ARS.
    *   [x] **Validación:** Se verificó que el paginador funciona correctamente en el mantenimiento de ARS.

*   **Tarea: Implementar paginador en mantenimiento de AFP (Fullstack)**
    *   [x] **Implementación (Backend):** Se modificó el modelo `afpModel.js` para que el método `getAll` siempre devuelva una respuesta paginada, con valores por defecto para la página y el límite.
    *   [x] **Implementación (Frontend):** Se añadió el `MatPaginatorModule` y `MatProgressSpinnerModule` al componente `afp.ts`.
    *   [x] **Implementación (Frontend):** Se añadió el paginador y un spinner de carga al template `afp.html`.
    *   [x] **Implementación (Frontend):** Se actualizó el componente `afp.ts` para manejar los eventos del paginador y el estado de carga.
    *   [x] **Implementación (Frontend):** Se actualizó el servicio `afp.service.ts` para que el método `getAfps` acepte parámetros de paginación.
    *   [x] **Implementación (Frontend):** Se actualizó el componente `employee-form.ts` para que siga obteniendo la lista completa de AFPs.
    *   [x] **Validación:** Se verificó que el paginador funciona correctamente en el mantenimiento de AFP.

*   **Tarea: Corregir formulario de ARS que no muestra datos al editar (Frontend)**
    *   [x] **Implementación:** Se refactorizó el componente `ars-form.ts` para recibir datos a través de `MAT_DIALOG_DATA` en lugar de `ActivatedRoute` cuando se abre en un diálogo.
    *   [x] **Implementación:** Se ajustó el componente para poblar el formulario con los datos inyectados, solucionando el problema de que el formulario aparecía vacío en modo de edición.
    *   [x] **Validación:** Se verificó que al hacer clic en "Editar" en un registro de ARS, el formulario de diálogo ahora muestra correctamente la descripción del registro seleccionado.

*   **Tarea: Corregir visibilidad y estilo de botones en formulario ARS (Frontend)**
    *   [x] **Implementación:** Se agregaron clases CSS específicas (`save-button`, `cancel-button`) a los botones de "Guardar" y "Cancelar" en `ars-form.html`.
    *   [x] **Implementación:** Se modificó `ars-form.css` para aplicar estilos de fondo (verde para guardar, rojo para cancelar) y color de texto (negro) a estos botones, eliminando el borde para mejorar la visibilidad.
    *   [x] **Validación:** Se verificó que los botones "Guardar" y "Cancelar" ahora son claramente visibles en el formulario de ARS con los estilos solicitados.

*   **Tarea: Corregir formulario de AFP que no muestra datos al editar y estilo de botones (Frontend)**
    *   [x] **Implementación:** Se refactorizó el componente `afp-form.ts` para recibir datos a través de `MAT_DIALOG_DATA` en lugar de `ActivatedRoute` cuando se abre en un diálogo.
    *   [x] **Implementación:** Se ajustó el componente para poblar el formulario con los datos inyectados, solucionando el problema de que el formulario aparecía vacío en modo de edición.
    *   [x] **Implementación:** Se agregaron clases CSS específicas (`save-button`, `cancel-button`) a los botones de "Guardar" y "Cancelar" en `form-container.html` (que es utilizado por el formulario AFP).
    *   [x] **Implementación:** Se modificó `form-container.css` para aplicar estilos de fondo (verde para guardar, rojo para cancelar) y color de texto (negro) a estos botones, eliminando el borde para mejorar la visibilidad.
    *   [x] **Validación:** Se verificó que al hacer clic en "Editar" en un registro de AFP, el formulario de diálogo ahora muestra correctamente la descripción del registro seleccionado y que los botones "Guardar" y "Cancelar" son claramente visibles con los estilos solicitados.

*   **Tarea: Corregir error 'afpId' no existe en AfpFormComponent (Frontend)**
    *   [x] **Implementación:** Se modificó `afp-form.html` para usar la propiedad `isEditMode` en lugar de `afpId` para determinar el título del formulario, ya que `afpId` fue eliminado durante la refactorización.
    *   [x] **Validación:** Se verificó que el error `TS2339` ya no aparece en la consola y que el título del formulario se muestra correctamente en modo de edición y adición.

*   **Tarea: Corregir formulario de Puesto que no muestra datos al editar y estilo de botones (Frontend)**
    *   [x] **Implementación:** Se refactorizó el componente `puesto-form.ts` para recibir datos a través de `MAT_DIALOG_DATA` en lugar de `ActivatedRoute` cuando se abre en un diálogo.
    *   [x] **Implementación:** Se ajustó el componente para poblar el formulario con los datos inyectados, solucionando el problema de que el formulario aparecía vacío en modo de edición.
    *   [x] **Implementación:** Se agregaron clases CSS específicas (`save-button`, `cancel-button`) a los botones de "Guardar" y "Cancelar" en `puesto-form.html`.
    *   [x] **Implementación:** Se modificó `puesto-form.css` para aplicar estilos de fondo (verde para guardar, rojo para cancelar) y color de texto (negro) a estos botones, eliminando el borde para mejorar la visibilidad.
    *   [x] **Validación:** Se verificó que al hacer clic en "Editar" en un registro de Puesto, el formulario de diálogo ahora muestra correctamente la descripción del registro seleccionado y que los botones "Guardar" y "Cancelar" son claramente visibles con los estilos solicitados.

*   **Tarea: Corregir formulario de ISR que no muestra datos al editar y estilo de botones (Frontend)**
    *   [x] **Implementación:** Se verificó que el componente `isr-form.component.ts` ya utilizaba `MAT_DIALOG_DATA` para recibir y poblar los datos del formulario en modo de edición.
    *   [x] **Implementación:** Se agregaron clases CSS específicas (`save-button`, `cancel-button`) a los botones de "Guardar" y "Cancelar" en `isr-form.component.html`.
    *   [x] **Implementación:** Se creó y modificó `isr-form.component.css` para aplicar estilos de fondo (verde para guardar, rojo para cancelar) y color de texto (negro) a estos botones, eliminando el borde para mejorar la visibilidad.
    *   [x] **Validación:** Se verificó que al hacer clic en "Editar" en un registro de ISR, el formulario de diálogo ahora muestra correctamente los datos del registro seleccionado y que los botones "Guardar" y "Cancelar" son claramente visibles con los estilos solicitados.

*   **Tarea: Corregir datos no desplegados en formulario ISR al editar (Frontend)**
    *   [x] **Implementación:** Se renombró la propiedad `id_isr` a `id` en la interfaz `Isr` en `isr.service.ts` para que coincidiera con la estructura de datos recibida del backend.
    *   [x] **Implementación:** Se actualizó la condición en `ngOnInit` de `isr-form.component.ts` para verificar `this.data.id` en lugar de `this.data.id_isr`, asegurando que el formulario se cargue correctamente en modo de edición.
    *   [x] **Validación:** Se verificó que al hacer clic en "Editar" en un registro de ISR, el formulario de diálogo ahora muestra correctamente todos los datos del registro seleccionado.

## Fase 3: Módulo de Nómina

*   **Tarea: Completar Cálculo de Descuentos de Ley (Backend)**
    *   [x] **Implementación:** Validar y completar la función `_generarDescuentosDeLey` en `nominaModel.js` para AFP y ARS.
    *   [x] **Validación:** Escribir una prueba unitaria que pase diferentes salarios (por debajo, en medio y por encima del tope) y verifique que el descuento es correcto.

*   **Tarea: Implementar Cálculo de ISR (Backend)**
    *   [x] **Implementación:** Desarrollar la lógica que calcula el Impuesto Sobre la Renta basado en la tabla `no_isr`.
    *   [x] **Validación:** Crear una prueba unitaria con salarios de cada tramo de la escala de ISR y verificar que el impuesto retenido es correcto.

*   **Tarea: Construir Formulario de Creación de Nómina (Frontend)**
    *   [x] **Implementación:** Diseñar y desarrollar el componente `nomina-form.component.ts` para iniciar un nuevo ciclo de nómina.
    *   [x] **Validación:** Crear una nómina de prueba, seleccionar tipo y fechas, y verificar que se genera el registro de nómina.

*   **Tarea: Crear Vista de Detalle de Nómina (Frontend)**
    *   [x] **Implementación:** Desarrollar una pantalla que muestre un resumen de una nómina creada con su lista de empleados.
    *   [x] **Validación:** Acceder al detalle de la nómina creada y verificar que la lista de empleados y los montos son correctos.

*   **Tarea: Diseñar Volante de Pago (Frontend)**
    *   [x] **Implementación:** Crear un componente visual que presente el desglose de pago para un empleado.
    *   [x] **Validación:** Dentro del detalle de nómina, hacer clic en un empleado y verificar que se muestra su volante con el desglose correcto.

*   **Tarea: Mantenimiento de Ingresos y Descuentos Manuales (Fullstack)**
    *   [x] **Implementación:** Crear la funcionalidad para agregar manualmente ingresos y descuentos a los empleados de una nómina específica.
    *   [x] **Implementación:** Desarrollar las rutas del backend y los componentes del frontend necesarios.
    *   [x] **Validación:** Probar la funcionalidad completa: seleccionar nómina, empleados, ingreso/descuento, agregar valor y guardar. Verificar que los datos se muestran correctamente y se pueden eliminar.

*   **Tarea: Implementar Paginación en Detalle de Nómina (Fullstack)**
    *   [x] **Implementación:** Modificar el backend para que el endpoint de detalles de nómina acepte parámetros de paginación (`page`, `pageSize`).
    *   [x] **Implementación:** Actualizar la consulta a la base de datos para que utilice `LIMIT` y `OFFSET` y devuelva el total de registros.
    *   [x] **Implementación:** Modificar el frontend para enviar los parámetros de paginación en la solicitud a la API.
    *   [x] **Implementación:** Conectar el `MatPaginator` de Angular Material para que funcione con la paginación del servidor.
    *   [x] **Validación:** Navegar al detalle de una nómina con un gran número de empleados y verificar que la paginación funciona correctamente, cargando los datos por páginas.

*   **Tarea: Corregir Búsqueda en Detalle de Nómina (Fullstack)**
    *   [x] **Implementación:** Modificar el backend para que el endpoint de detalles de nómina acepte un parámetro de búsqueda.
    *   [x] **Implementación:** Actualizar la consulta a la base de datos para que filtre por nombre, departamento o código de empleado.
    *   [x] **Implementación:** Modificar el frontend para que envíe el término de búsqueda al backend en lugar de filtrar en el cliente.
    *   [x] **Validación:** Realizar una búsqueda en el detalle de una nómina y verificar que los resultados se filtran correctamente.

*   **Tarea: Refactorizar Cálculo de Nómina para Incluir Horas Extras (Fullstack)**
    *   [x] **Implementación (Backend):** Modificar la función `recalcular` en `nominaModel.js` para que consulte y sume las horas extras desde `no_desc_cred_nomina` al `total_ingreso`.
    *   [x] **Implementación (Backend):** Actualizar la inserción y actualización en `no_det_nomina` para guardar los montos de horas extras en los campos correspondientes.
    *   [x] **Implementación (Frontend):** Actualizar el modelo `DetalleNomina` para incluir los campos de montos de horas extras.
    *   [x] **Implementación (Frontend):** Añadir las nuevas columnas a la tabla de detalle de nómina para visualizar los montos de horas extras.
    *   [x] **Validación:** Importar horas extras para un empleado, recalcular la nómina y verificar en la vista de detalle que los montos de horas extras y el total a pagar son correctos.

*   **Tarea: Corregir Importación de Horas Extras (Backend)**
    *   [x] **Implementación:** Corregir la lógica en `importService.js` para leer la columna correcta (`'HORAS 15%'`) y para utilizar los montos de horas extras (`'HORAS 35%'`, `'HORAS 15%'`) directamente del archivo Excel sin recalcularlos.
    *   [ ] **Validación:** Importar un archivo de horas extras y verificar en la "Auditoría de Ingresos y Descuentos" que los valores para "horas extras 35" y "horas extras 15" se registran correctamente.

*   **Tarea: Implementar Cierre de Nómina (Fullstack)**
    *   [x] **Implementación (Backend):** Crear endpoint y lógica transaccional para cerrar la nómina, cambiando su estado y creando un snapshot histórico de los empleados en `rh_emplado_nomina`.
    *   [x] **Implementación (Backend):** Asegurar la inmutabilidad de las nóminas cerradas, impidiendo modificaciones a través de la API.
    *   [x] **Implementación (Backend):** Ajustar las consultas de detalles de nómina para usar los datos del snapshot si la nómina está cerrada.
    *   [x] **Implementación (Frontend):** Añadir botón y flujo de confirmación para cerrar la nómina en la vista de detalle.
    *   [x] **Implementación (Frontend):** Deshabilitar controles y acciones de modificación en la interfaz para nóminas cerradas.
    *   [x] **Validación:** El flujo completo de cierre de nómina ha sido implementado y protege la integridad de los datos históricos.

*   **Tarea: Ajustar Cálculo de Monto de Vacaciones a Días Laborales (Backend)**
    *   [x] **Implementación:** Se modificó la función `_calcularMontoVacaciones` en `nominaModel.js` para contar únicamente los días de lunes a viernes dentro del período de vacaciones.
    *   [x] **Validación:** El cálculo del monto a pagar por vacaciones ahora excluye los fines de semana, reflejando correctamente los días laborables.

*   **Tarea: Permitir Modificación Manual del Monto de Vacaciones (Frontend)**
    *   [x] **Implementación:** Se habilitó el campo "Monto a Pagar" en el formulario de vacaciones y se deshabilitó el cálculo automático para permitir la entrada manual del usuario.
    *   [x] **Validación:** El campo de monto ahora es editable y el valor ingresado por el usuario se conserva sin ser sobreescrito.

## Implementación ISR

### Fase 1: Base de Datos
*   [x] **DB:** (Verificado) Se utilizará la tabla existente `no_isr`.

### Fase 2: Backend
*   [x] **Backend:** Crear el modelo de Sequelize `NoISR.js` para la tabla `no_isr`.
*   [x] **Backend:** Crear el archivo de servicio `src/services/isrService.js`.
*   [x] **Backend:** Implementar la función `calcularISR(salarioBruto, periodoDePago)` en `isrService.js`.
*   [x] **Backend:** Integrar el servicio `isrService.calcularISR` en el proceso principal de cálculo de nómina (`_generarDescuentosDeLey`).

### Fase 3: Frontend
*   [x] **Frontend:** (Verificado) El campo "Retención ISR" ya existe en la vista de detalle de la nómina.
*   [x] **Frontend:** (Verificado) El modelo de datos de la nómina en el frontend ya incluye la propiedad `desc_isr`.

### Fase 4: Pruebas
*   [x] **Pruebas:** Crear pruebas unitarias para `isrService.js` que cubran salarios en cada tramo de la escala.
*   [x] **Pruebas:** Realizar pruebas de integración completas para verificar el cálculo y la visualización del ISR en una nómina real.

## Fase 4: Funcionalidades Adicionales y Documentación

*   **Tarea: Crear Reporte de Pago para Bancos (Fullstack)**
    *   [ ] **Implementación:** Desarrollar un endpoint (backend) y una vista (frontend) que genere el reporte.
    *   [ ] **Validación:** Generar un reporte para una nómina cerrada y verificar que el archivo/tabla contiene los datos correctos.

*   **Tarea: Diseñar Dashboard Principal (Frontend)**
    *   [ ] **Implementación:** Transformar la página de inicio en un panel informativo con tarjetas de datos.
    *   [ ] **Validación:** Navegar a la página de inicio y verificar que las tarjetas muestran datos coherentes.

*   **Tarea: Crear `README.md` para Backend (Documentación)**
    *   [ ] **Implementación:** Redactar instrucciones claras para la configuración del entorno de desarrollo del backend.
    *   [ ] **Validación:** Pedir a otro desarrollador que siga las instrucciones y confirme que puede levantar el servidor sin problemas.

---

## Fase 5: Mejoras de UI/UX

*   **Tarea: Estandarizar color de enlaces del encabezado a negro (Frontend)**
    *   [x] **Implementación:** Se modificaron los enlaces del encabezado y del menú lateral en `navmenu.html` para usar la clase `text-black` de Tailwind CSS.
    *   [x] **Validación:** Se verificó que todos los enlaces del encabezado y del menú lateral ahora se muestran en color negro.

*   **Tarea: Estandarizar estilo del listado de nóminas (Frontend)**
    *   [x] **Implementación:** Aplicar el estilo visual del listado de empleados al listado de nóminas, incluyendo la integración de Angular Material para paginación y búsqueda.
    *   [x] **Validación:** Verificar visualmente que el listado de nóminas tiene el mismo aspecto que el listado de empleados y que la paginación y búsqueda funcionan correctamente.

*   **Tarea: Estandarizar estilo del historial de vacaciones (Frontend y Backend)**
    *   [x] **Implementación:** Aplicar el estilo visual del listado de empleados al historial de vacaciones, incluyendo la integración de Angular Material para paginación y búsqueda.
    *   [x] **Validación:** Verificar visualmente que el historial de vacaciones tiene el mismo aspecto que el listado de empleados y que la paginación y búsqueda funcionan correctamente.

## Tareas Completadas

*   **Tarea: Modificar tabla `no_vacaciones` y refactorizar rutas (Backend)**
    *   [x] **Implementación:** Añadir los campos `dias_disfrutados` y `fecha_creacion`.
    *   [x] **Implementación:** Cambiar el campo `pagada` por `estado` (VARCHAR).
    *   [x] **Implementación:** Eliminar los campos innecesarios (`ano`, `status`, `id_vac`, `id_afp`, `id_sfs`).
    *   [x] **Implementación:** Actualizar el modelo de Sequelize `vacacionesModel.js`.
    *   [x] **Implementación:** Refactorizar `routes/vacaciones.js` para usar Sequelize y añadir rutas CRUD completas.
    *   [x] **Implementación:** Refactorizar `server.js` y `usuarioModel.js` para usar Sequelize en la autenticación.
    *   [x] **Validación:** La nueva estructura de la tabla y las rutas del backend han sido implementadas.

*   **Tarea: Unificar y hacer plegable el menú de navegación (Frontend)**
    *   [x] **Implementación:** Refactorizar el componente `navmenu` para usar una única fuente de datos (`menuItems`) tanto para el menú del encabezado como para el menú lateral.
    *   [x] **Implementación:** Generar dinámicamente los elementos del menú lateral a partir de la nueva estructura de datos, asegurando que ambos menús estén siempre sincronizados.
    *   [x] **Implementación:** Añadir un botón en el encabezado para ocultar y mostrar el menú lateral (`toggleSidebar`), mejorando la usabilidad en diferentes tamaños de pantalla.
    *   [x] **Validación:** Verificar que el menú lateral y el del encabezado muestran las mismas opciones y que el botón para ocultar/mostrar el menú funciona correctamente.

*   **Tarea: Implementar Módulo de Vacaciones (Fullstack)**
    *   [x] **Implementación:** Crear la tabla `no_vacaciones` y adaptar el backend para manejar la lógica de negocio según el Código de Trabajo de RD (cálculo de AFP/SFS).
    *   [x] **Implementación:** Crear un script para actualizar el estado de los empleados que regresan de vacaciones.
    *   [x] **Implementación:** Desarrollar componentes en el frontend para importar un Excel con las vacaciones y para ver el historial.
    *   [x] **Validación:** Probar el flujo completo: importar archivo, verificar que el empleado cambia de estado, verificar que los descuentos se registran y que el historial se muestra.

*   **Tarea: Refactorizar Módulos de Importación (Frontend)**
    *   [x] **Implementación:** Crear un componente central `ImportacionesComponent` para unificar la subida de archivos (Horas Extras, Vacaciones).
    *   [x] **Implementación:** Crear un `ImportacionService` para centralizar la lógica de llamada a los endpoints del backend.
    *   [x] **Implementación:** Eliminar los componentes antiguos (`ImportarHorasExtrasComponent`, `VacacionesImportComponent`) y actualizar las rutas y el menú de navegación.
    *   [x] **Validación:** Probar la importación de Horas Extras y de Vacaciones desde el nuevo componente central y verificar que ambas funcionalidades operan correctamente.

*   **Tarea: Crear Mantenimiento de Usuarios y Cambio de Clave (Fullstack)**
    *   [x] **Implementación:** Desarrollar rutas (backend) y componentes (frontend) para Crear, Leer, Actualizar y Eliminar usuarios.
    *   [x] **Implementación:** Asegurar que las contraseñas se hasheen con `bcrypt.hash()` antes de ser almacenadas o actualizadas.
    *   [x] **Implementación:** Crear un formulario seguro para que los usuarios cambien su propia contraseña.
    *   [x] **Implementación:** Corregir errores de carga de datos en el formulario de edición y reemplazar el campo `email` por `nivel`.
    *   [x] **Validación:** Probar todas las operaciones CRUD para usuarios y la funcionalidad de cambio de clave.

*   **Tarea: Mejorar UI/UX y Seguridad del Menú de Navegación (Frontend)**
    *   [x] **Implementación:** Ocultar el menú de "Usuarios" para roles no autorizados (nivel != 9).
    *   [x] **Implementación:** Hacer el menú reactivo al estado de login para cerrar brechas de seguridad visual.
    *   [x] **Implementación:** Mostrar el nombre del usuario autenticado en la cabecera.
    *   [x] **Implementación:** Corregir la visibilidad del menú para que no aparezca en la pantalla de login.
    *   [x] **Validación:** Verificar que el menú y la información del usuario se muestran y ocultan correctamente según el estado de autenticación.

*   **Tarea: Refactorizar Cálculo de ISR y CRUD de Tipo de Nómina (Fullstack)**
    *   [x] **Backend:** Modificar `isrService` para deducir TSS (AFP/SFS) antes de calcular el ISR.
    *   [x] **Backend:** Crear prueba unitaria para validar la nueva lógica de cálculo de ISR.
    *   [x] **Backend:** Corregir la función `recalcular` en `nominaModel.js` para que aplique la nueva lógica de ISR y no duplique ingresos.
    *   [x] **DB:** Añadir campo `periodo_pago` a la tabla `no_tipo_nomina` para eliminar la dependencia de la descripción.
    *   [x] **Backend:** Refactorizar la lógica de cálculo para usar el nuevo campo `periodo_pago`.
    *   [x] **Frontend:** Actualizar el formulario de "Tipo de Nómina" para usar un selector (`mat-select`) para el período de pago.
    *   [x] **Frontend:** Añadir la columna "Período de Pago" a la tabla de "Tipos de Nómina".
    *   [x] **Validación:** Confirmado por el usuario que el cálculo de ISR y el recálculo de la nómina ahora funcionan correctamente. El CRUD de Tipo de Nómina está verificado.

*   **Tarea: Corregir Error de `id_nomina=undefined` en Importación de Horas Extras (Frontend)**
    *   [x] **Implementación:** Se añadió una validación robusta en `importaciones.ts` para asegurar que el `id_nomina` sea un número válido y mayor que cero antes de llamar al servicio de importación.
    *   [x] **Implementación:** Se convirtió explícitamente el `id_nomina` a número para prevenir errores de tipo.
    *   [x] **Validación:** Se verificó que al intentar importar sin seleccionar una nómina, el sistema muestra una alerta y no realiza la llamada a la API, previniendo el error `Truncated incorrect DOUBLE value`.

*   **Tarea: Corregir error `Table 'db_aae4a2_ranger.no_nomina' doesn't exist` en cálculo de salario promedio (Backend)**
    *   [x] **Implementación:** Se corrigió el nombre de la tabla `no_nomina` a `no_nominas` en la consulta SQL dentro de la función `getSalarioPromedio` en el archivo `empleadoModel.js`.
    *   [x] **Validación:** Se verificó que la consulta ahora se ejecuta correctamente y el error ha sido resuelto.

*   **Tarea: Eliminar Enlace Redundante de 'Importar Horas' (Frontend)**
    *   [x] **Implementación:** Se eliminó el enlace 'Importar Horas' del menú desplegable 'Payroll' para evitar duplicidad con el centro de 'Importaciones'.
    *   [x] **Validación:** Se verificó que el enlace ya no aparece en el menú de navegación.