# Guía para Realizar Commits con el MCP GitHub

Este documento contiene las instrucciones y los comandos correctos para realizar commits en los sub-repositorios del proyecto (`backend-ranger-nomina` y `rangernomina-frontend`) utilizando la herramienta `run_shell_command`.

## Metodología

Debido a las limitaciones de la herramienta para cambiar de directorio de trabajo de forma persistente, la estrategia correcta es encadenar los comandos en una sola línea utilizando el operador `&&`.

La estructura del comando es la siguiente:
`cd "ruta/absoluta/al/proyecto" && git add . && git commit -m "Tu mensaje de commit"`

## Comandos Específicos

### 1. Para el Backend (`backend-ranger-nomina`)

Utiliza el siguiente comando para añadir todos los cambios y realizar un commit. Reemplaza el mensaje del commit según sea necesario.

```bash
cd "E:\ranger sistemas\backend-ranger-nomina" && git add . && git commit -m "feat(backend): Descripcion de los cambios"
```

### 2. Para el Frontend (`rangernomina-frontend`)

Utiliza el siguiente comando para añadir todos los cambios y realizar un commit. Reemplaza el mensaje del commit según sea necesario.

```bash
cd "E:\ranger sistemas\rangernomina-frontend" && git add . && git commit -m "feat(frontend): Descripcion de los cambios"
```
