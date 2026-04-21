@echo off
echo ===================================================
echo Iniciando Servidor de Control de Inventario...
echo ===================================================
echo.
echo Por favor, NO CIERRES esta ventana mientras estes usando el sistema.
echo.
echo Abriendo el navegador...
start http://localhost:3000
node server.js
pause
