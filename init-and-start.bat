@echo off
echo ======================================================
echo   Инициализация проекта SolarTrade CRM
echo ======================================================

echo.
echo [1/6] Установка npm-пакетов для бэкенда...
cd backend
call npm install
if %ERRORLEVEL% neq 0 (
    echo Ошибка установки пакетов для бэкенда
    pause
    exit /b 1
)

echo.
echo [2/6] Установка npm-пакетов для фронтенда...
cd ..\frontend
call npm install
if %ERRORLEVEL% neq 0 (
    echo Ошибка установки пакетов для фронтенда
    pause
    exit /b 1
)

echo.
echo [3/6] Генерация клиента Prisma...
cd ..\backend
call npx prisma generate
if %ERRORLEVEL% neq 0 (
    echo Ошибка генерации клиента Prisma
    pause
    exit /b 1
)

echo.
echo [4/6] Запуск миграций базы данных...
call npx prisma migrate deploy
if %ERRORLEVEL% neq 0 (
    echo Ошибка выполнения миграций базы данных
    pause
    exit /b 1
)

echo.
echo [5/6] Заполнение базы данных тестовыми данными...
call npx ts-node prisma/seed.ts
if %ERRORLEVEL% neq 0 (
    echo Ошибка заполнения базы данных
    pause
    exit /b 1
)

echo.
echo [6/6] Запуск сервера и клиента...
start cmd /k "cd ..\backend && npm run start:dev"
start cmd /k "cd ..\frontend && npm start"

echo.
echo ======================================================
echo   Проект успешно инициализирован и запущен!
echo ======================================================
echo.
echo Бэкенд доступен по адресу: http://localhost:3001/api
echo Фронтенд доступен по адресу: http://localhost:3000
echo Документация API: http://localhost:3001/api/docs
echo.
echo Учетные записи для входа:
echo.
echo Администратор: admin@solartrade.com / admin123
echo Менеджер: manager@solartrade.com / manager123
echo Продавец: sales@solartrade.com / sales123
echo.
echo ======================================================
pause
