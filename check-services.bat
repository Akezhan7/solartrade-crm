@echo off
echo ======================================================
echo   Проверка служб SolarTrade CRM
echo ======================================================

echo.
echo [1/3] Проверка базы данных PostgreSQL...
powershell -Command "$output = & psql -U postgres -c '\l' 2>&1; if($?) { Write-Host 'База данных PostgreSQL работает нормально' -ForegroundColor Green } else { Write-Host 'ОШИБКА: PostgreSQL не запущен или недоступен' -ForegroundColor Red; Write-Host $output }"

echo.
echo [2/3] Проверка доступности бэкенда...
powershell -Command "$response = try { Invoke-WebRequest -Uri 'http://localhost:3001/api/health' -UseBasicParsing -ErrorAction Stop } catch { $null }; if($response -and $response.StatusCode -eq 200) { Write-Host 'Бэкенд работает нормально' -ForegroundColor Green } else { Write-Host 'ОШИБКА: Бэкенд не запущен или недоступен' -ForegroundColor Red }"

echo.
echo [3/3] Проверка доступности фронтенда...
powershell -Command "$response = try { Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -ErrorAction Stop } catch { $null }; if($response -and $response.StatusCode -eq 200) { Write-Host 'Фронтенд работает нормально' -ForegroundColor Green } else { Write-Host 'ОШИБКА: Фронтенд не запущен или недоступен' -ForegroundColor Red }"

echo.
echo ======================================================
echo   Результаты проверки
echo ======================================================
echo.
echo Если какие-либо службы не работают, запустите:
echo   init-and-start.bat - для запуска всех компонентов
echo   backend\scripts\db-update.bat - для обновления базы данных
echo.
pause
