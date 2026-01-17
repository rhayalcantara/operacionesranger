@echo off
echo ========================================
echo Ranger Nomina - Docker Logs Viewer
echo ========================================
echo.
echo Mostrando logs de todos los servicios...
echo Presiona Ctrl+C para salir
echo.

docker-compose logs -f --tail=100
