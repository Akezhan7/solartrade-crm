@echo off
echo ======================================================
echo   Обновление настроек Telegram для SolarTrade CRM
echo ======================================================

REM Проверка наличия аргументов
if "%1"=="" (
    echo Ошибка: Не указан токен Telegram бота
    echo Использование: update-telegram-args.bat "ВАШ_ТОКЕН" "ВАШ_CHAT_ID"
    goto :exit
)

if "%2"=="" (
    echo Ошибка: Не указан ID чата
    echo Использование: update-telegram-args.bat "ВАШ_ТОКЕН" "ВАШ_CHAT_ID"
    goto :exit
)

set TELEGRAM_BOT_TOKEN=%1
set TELEGRAM_CHAT_ID=%2

echo.
echo Сохранение настроек в .env файл...
echo.

set ENV_FILE=..\.env
set FOUND_BOT_TOKEN=0
set FOUND_CHAT_ID=0

:: Обновляем существующие переменные
(
for /f "tokens=1,* delims==" %%a in ('type "%ENV_FILE%"') do (
    if "%%a"=="TELEGRAM_BOT_TOKEN" (
        echo TELEGRAM_BOT_TOKEN=%TELEGRAM_BOT_TOKEN%
        set FOUND_BOT_TOKEN=1
    ) else if "%%a"=="TELEGRAM_CHAT_ID" (
        echo TELEGRAM_CHAT_ID=%TELEGRAM_CHAT_ID%
        set FOUND_CHAT_ID=1
    ) else (
        echo %%a=%%b
    )
)
) > "%ENV_FILE%.tmp"

:: Добавляем переменные, если они не существуют
if %FOUND_BOT_TOKEN%==0 (
    echo TELEGRAM_BOT_TOKEN=%TELEGRAM_BOT_TOKEN% >> "%ENV_FILE%.tmp"
)
if %FOUND_CHAT_ID%==0 (
    echo TELEGRAM_CHAT_ID=%TELEGRAM_CHAT_ID% >> "%ENV_FILE%.tmp"
)

move /y "%ENV_FILE%.tmp" "%ENV_FILE%" > nul

echo Настройки успешно сохранены в .env файл
echo.
echo Токен: %TELEGRAM_BOT_TOKEN%
echo ID чата: %TELEGRAM_CHAT_ID%
echo.
echo ======================================================
echo Перезапустите сервер для применения изменений
echo ======================================================

:exit
