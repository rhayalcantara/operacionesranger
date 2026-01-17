@echo off
echo ========================================
echo Ranger Nomina - Docker Startup Script
echo ========================================
echo.

REM Check if .env exists
if not exist .env (
    echo ERROR: El archivo .env no existe!
    echo.
    echo Por favor crea el archivo .env usando:
    echo   copy .env.docker.example .env
    echo.
    echo Y luego edita el archivo .env con tus credenciales.
    echo.
    pause
    exit /b 1
)

echo [1/3] Deteniendo contenedores existentes...
docker-compose down

echo.
echo [2/3] Construyendo imagenes...
docker-compose build

echo.
echo [3/3] Iniciando servicios...
docker-compose up -d

echo.
echo ========================================
echo Servicios iniciados correctamente!
echo ========================================
echo.
echo Frontend: http://localhost:80
echo Backend:  http://localhost:3333
echo MySQL:    localhost:3306
echo.
echo Para ver logs: docker-compose logs -f
echo Para detener:  docker-compose down
echo.
pause
