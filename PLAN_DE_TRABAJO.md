# Análisis del Proyecto y Plan de Trabajo - Ranger Nomina

## 1. Resumen del Proyecto

El proyecto consiste en la modernización del sistema de nómina de Ranger, migrando de sistemas anteriores a una nueva arquitectura web. La tecnología seleccionada es:

*   **Backend:** Node.js con Express.js, utilizando MySQL (`mysql2`) para la base de datos.
*   **Frontend:** Angular con Angular Material para la interfaz de usuario.

Actualmente, se ha establecido una base sólida para ambos proyectos. El backend cuenta con una estructura modular (modelos, rutas, configuración de base de datos) y un sistema de autenticación inicial. El frontend tiene una estructura de componentes bien definida, enrutamiento y servicios para comunicarse con el backend.

Este plan se enfoca en analizar el estado actual, identificar áreas críticas de mejora y proponer un camino estructurado para el desarrollo.

## 2. Análisis y Observaciones

### Puntos Fuertes

*   **Estructura Modular:** Tanto el backend (modelos, rutas) como el frontend (componentes, servicios) están bien organizados, lo que facilita la escalabilidad y el mantenimiento.
*   **Tecnologías Modernas:** El uso de Node.js y Angular permite un desarrollo ágil y un producto final robusto y moderno.
*   **Lógica de Negocio Avanzada:** El modelo `nominaModel.js` ya contiene lógica de negocio compleja y crucial, como el uso de transacciones SQL para garantizar la integridad de los datos al crear y actualizar nóminas.
*   **Documentación Existente:** Archivos como `logicacapturanomina.md` y `mejoras.md` proporcionan un excelente punto de partida y demuestran una planificación previa.
*   **UI Consistente:** El uso de Angular Material en el frontend asegura una experiencia de usuario coherente y profesional.

### Áreas de Mejora y Riesgos

1.  **CRÍTICO - Falla de Seguridad en Autenticación:** En `backend-ranger-nomina/server.js`, la contraseña se compara en texto plano (`password === user.clave`). La dependencia `bcryptjs` está instalada pero no se utiliza para la verificación. **Esta es la máxima prioridad a corregir.**
2.  **Seguridad - Secretos en Código:** Las credenciales de la base de datos (`db.js`) y el secreto del JWT (`server.js`) están hardcodeados. Deben moverse a variables de entorno.
3.  **Lógica de Negocio Incompleta:** La lógica para calcular descuentos de ley (`_generarDescuentosDeLey` en `nominaModel.js`) parece estar en desarrollo y necesita ser completada y validada.
4.  **Robustez del Frontend:** El `AuthGuard` solo verifica la existencia de un token, pero no su validez o expiración, lo que podría permitir que un token expirado dé acceso.
5.  **Falta de Pruebas (Testing):** El `package.json` del backend muestra que no hay un script de pruebas configurado (`"test": "echo \"Error: no test specified\" && exit 1"`). La ausencia de pruebas automatizadas es un riesgo para la estabilidad a largo plazo.
6.  **Manejo de Errores:** Aunque existe un logger, el manejo de errores en las rutas puede ser más consistente y centralizado para evitar código repetitivo.

## 3. Plan de Trabajo Propuesto

Se propone un plan de trabajo dividido en fases para abordar primero los problemas críticos y luego construir sobre una base sólida.

### Fase 1: Seguridad y Fundamentos (Prioridad Inmediata)

El objetivo es cerrar las brechas de seguridad críticas y establecer las bases para un desarrollo de calidad.

1.  **Corregir Autenticación:** Implementar hashing y verificación de contraseñas con `bcryptjs`.
2.  **Variables de Entorno:** Mover todos los secretos (credenciales de DB, JWT secret) a un archivo `.env`.
3.  **Mejorar Guardia de Rutas:** Actualizar el `AuthGuard` de Angular para validar la expiración del token.
4.  **Configurar Entorno de Pruebas:** Implementar un framework de testing (ej. Jest para el backend) y escribir pruebas unitarias para la lógica de autenticación.

### Fase 2: Completar Módulos de Mantenimiento

Finalizar todos los módulos de "mantenimiento" que sirven de base para la nómina.

1.  **Revisar y Completar CRUDs:** Asegurar que todos los mantenimientos (AFP, ARS, Puestos, Departamentos, Bancos, etc.) estén 100% funcionales en el frontend y backend.
2.  **Mejorar UI/UX:** Unificar el estilo de los formularios y tablas, y mejorar la retroalimentación al usuario (notificaciones de éxito/error).

### Fase 3: Desarrollo del Módulo Principal de Nómina

Con la base sólida, enfocarse en el corazón del sistema.

1.  **Implementar Lógica de Cálculo:** Completar y validar todas las funciones de cálculo en `nominaModel.js` (`_generarDescuentosDeLey`, cálculos de ISR, etc.).
2.  **Flujo de Creación/Edición:** Desarrollar la interfaz de usuario para el flujo completo de creación y edición de nóminas, basándose en `logicacapturanomina.md`.
3.  **Visualización de Detalles:** Crear las vistas para ver los detalles de una nómina procesada, incluyendo el volante de pago de cada empleado.

### Fase 4: Funcionalidades Adicionales y Despliegue

1.  **Módulo de Reportes:** Diseñar y desarrollar un sistema para generar reportes (ej. listados para bancos, reportes para contabilidad).
2.  **Dashboard:** Crear un panel principal (`/home`) con estadísticas y accesos directos relevantes.
3.  **Preparación para Producción:** Configurar el proyecto para despliegue (builds de producción, configuración de servidor web, etc.).

## 4. Lista de Tareas Detallada

### Fase 1: Seguridad y Fundamentos

*   [ ] **Backend:** Modificar la ruta `/login` para usar `bcrypt.compare()` en la verificación de contraseñas.
*   [ ] **Backend:** Crear una ruta o script para hashear las contraseñas existentes en la base de datos.
*   [ ] **Backend:** Instalar `dotenv` (`npm install dotenv`).
*   [ ] **Backend:** Crear un archivo `.env` en la raíz de `backend-ranger-nomina` y mover las credenciales de `db.js` y el `JWT_SECRET` de `server.js` a este archivo.
*   [ ] **Backend:** Añadir `.env` al archivo `.gitignore`.
*   [ ] **Frontend:** En `auth-guard.ts`, añadir lógica para decodificar el JWT y verificar su fecha de expiración (`exp`). Redirigir a login si ha expirado.
*   [ ] **Proyecto:** Configurar un framework de pruebas como Jest para el backend.
*   [ ] **Proyecto:** Escribir las primeras pruebas unitarias para la lógica de autenticación y para una función clave de `nominaModel.js`.

### Fase 2: Módulos de Mantenimiento

*   [ ] **Frontend:** Revisar y completar el CRUD para:
    *   [ ] Departamentos
    *   [ ] Bancos
    *   [ ] Tipos de Nómina
    *   [ ] Sub-Nóminas
    *   [ ] Descuentos/Créditos (`no_desc_cred`)
    *   [ ] ISR
*   [ ] **Frontend:** Implementar un servicio de notificaciones (ej. usando Angular Material Snackbar) para mostrar mensajes de "Guardado con éxito" o "Error".
*   [ ] **UI/UX:** Unificar el diseño de todos los formularios de mantenimiento para que sigan el estilo moderno del formulario de Empleados.

### Fase 3: Módulo de Nómina

*   [ ] **Backend:** Validar y completar la función `_generarDescuentosDeLey` en `nominaModel.js`.
*   [ ] **Backend:** Implementar la lógica para el cálculo del ISR basado en la tabla `no_isr`.
*   [ ] **Frontend:** Diseñar y construir el formulario de "Creación de Nómina" (`nomina-form.component.ts`) siguiendo los pasos de `logicacapturanomina.md`.
*   [ ] **Frontend:** Crear una vista de detalle de nómina donde se listen los empleados incluidos.
*   [ ] **Frontend:** Diseñar y mostrar un "volante de pago" para cada empleado dentro de una nómina.

### Fase 4: Funcionalidades Adicionales

*   [ ] **Backend/Frontend:** Crear un endpoint y una vista para un reporte de pago para bancos.
*   [ ] **Frontend:** Diseñar el componente `home` para que sea un Dashboard útil con tarjetas de información (ej. total empleados activos, próxima nómina a procesar, etc.).
*   [ ] **Documentación:** Crear un `README.md` para el proyecto `backend-ranger-nomina` explicando cómo configurar el `.env` y cómo iniciar el servidor.
