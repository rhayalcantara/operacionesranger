# Contexto General del Proyecto: Ranger Nomina

## Resumen y Arquitectura
El objetivo es modernizar el sistema de nómina de Ranger a una arquitectura web con un **Backend en Node.js/Express** y un **Frontend en Angular/Angular Material**, utilizando MySQL como base de datos. La estructura de ambos proyectos es modular y está bien organizada.

## Puntos Críticos y Prioridades
1.  **FALLA DE SEGURIDAD CRÍTICA (Máxima Prioridad):** La autenticación en `backend-ranger-nomina/server.js` compara contraseñas en **texto plano**. La dependencia `bcryptjs` está instalada pero no se utiliza, lo cual debe corregirse de inmediato.
2.  **Secretos Expuestos:** Las credenciales de la base de datos y el secreto del JWT están hardcodeados. Deben moverse a variables de entorno (`.env`).
3.  **Lógica Incompleta:** La lógica de negocio para cálculos clave (descuentos de ley, ISR) está incompleta.
4.  **AuthGuard Débil:** El `AuthGuard` del frontend no valida la expiración de los tokens.
5.  **Ausencia de Pruebas:** No hay un framework de testing configurado, lo que representa un riesgo para la estabilidad.

## Plan de Trabajo General
- **Fase 1 (Inmediata):** Solucionar la falla de seguridad, externalizar secretos a `.env`, mejorar el `AuthGuard` y configurar un entorno de pruebas (Jest).
- **Fase 2:** Completar todos los módulos CRUD de mantenimiento (AFP, ARS, Bancos, etc.).
- **Fase 3:** Desarrollar el módulo principal de creación y cálculo de nóminas.
- **Fase 4:** Implementar reportes, un dashboard y preparar para producción.

---
- **Resumen de la sesión:** Se agregó el campo `observacion_despido` a la tabla `rh_empleado`. Se modificó el backend para incluir este campo en el modelo y las rutas de empleados. Se actualizó el frontend para agregar el campo al formulario de empleados. Se implementó la funcionalidad para maximizar la foto del empleado al hacer clic sobre ella. Finalmente, se actualizaron los archivos `TAREAS.md` y `RESUMEN_SESION.md` para reflejar los cambios.
