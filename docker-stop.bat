@echo off
echo ========================================
echo Ranger Nomina - Docker Stop Script
echo ========================================
echo.

echo Deteniendo todos los servicios...
docker-compose down

echo.
echo ========================================
echo Servicios detenidos correctamente!
echo ========================================
echo.
echo Los datos de la base de datos se mantienen en el volumen 'mysql_data'
echo.
echo Para eliminar tambien los datos:
echo   docker-compose down -v
echo.
pause
