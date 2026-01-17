
# Reporte de Creación de Usuario

## Resumen

Se intentó crear un nuevo usuario a través de la interfaz de usuario del frontend, pero se encontraron problemas de navegación que impidieron completar el proceso. Como alternativa, se creó el usuario directamente a través de la API del backend.

## Pasos Realizados

1.  **Intento de Creación de Usuario a través del Frontend:**
    *   Se navegó a la página de login.
    *   Se introdujeron las credenciales de administrador.
    *   Se navegó a la sección de "Usuarios".
    *   Se hizo clic en el botón "Agregar un Usuarios".
    *   **Resultado:** La aplicación no navegó a la página de creación de usuarios, impidiendo continuar con el proceso.

2.  **Creación de Usuario a través de la API del Backend:**
    *   Se obtuvo el token de autenticación JWT del local storage del navegador.
    *   Se construyó una solicitud POST a la API del backend en el endpoint `/api/usuarios`.
    *   Se incluyó el token de autenticación en la cabecera `Authorization`.
    *   Se envió la solicitud con los datos del nuevo usuario.
    *   **Resultado:** El usuario fue creado exitosamente en la base de datos.

## Datos del Usuario Creado

| Campo       | Valor          |
|-------------|----------------|
| ID Usuario  | cdelossantos   |
| Nombres     | Candida        |
| Apellidos   | De los Santos  |
| Nivel       | 9              |
| Password    | RHoss.1234     |

## Conclusión

El usuario **cdelossantos** ha sido creado exitosamente en el sistema. Se recomienda investigar y solucionar el problema de navegación en el frontend para permitir la creación de usuarios a través de la interfaz de usuario en el futuro.
