@echo off
echo ======================================================
echo   Сброс и пересоздание базы данных SolarTrade CRM
echo ======================================================

echo.
echo [1/3] Сброс базы данных...
cd backend
call npx prisma migrate reset --force
if %ERRORLEVEL% neq 0 (
    echo Ошибка сброса базы данных
    pause
    exit /b 1
)

echo.
echo [2/3] Применение миграций...
call npx prisma migrate deploy
if %ERRORLEVEL% neq 0 (
    echo Ошибка применения миграций
    pause
    exit /b 1
)

echo.
echo [3/3] Заполнение базы тестовыми данными...
call npx ts-node prisma/seed.ts
if %ERRORLEVEL% neq 0 (
    echo Ошибка заполнения базы данных
    pause
    exit /b 1
)

echo.
echo ======================================================
echo   База данных успешно пересоздана!
echo ======================================================
echo.
pause
