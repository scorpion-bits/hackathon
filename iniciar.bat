@echo off
rem AgroBits - de dois cliques para subir tudo (Docker Desktop precisa estar aberto).
rem Opcoes: iniciar.bat atualizar ^| resetar ^| sincronizar ^| logs ^| parar
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0iniciar.ps1" %*
if errorlevel 1 (pause & exit /b 1)
if "%~1"=="" pause
