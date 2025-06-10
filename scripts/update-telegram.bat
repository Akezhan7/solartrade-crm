@echo off
echo ======================================================
echo   Обновление настроек Telegram для SolarTrade CRM
echo ======================================================

echo.
echo Введите токен Telegram бота (получите его у @BotFather):
set /p TELEGRAM_BOT_TOKEN="> "

echo.
echo Введите ID чата для отправки уведомлений (добавьте @userinfobot в чат, чтобы узнать):
set /p TELEGRAM_CHAT_ID="> "

echo.
echo Сохранение настроек в .env файл...
echo.

set ENV_FILE=..\backend\.env
set FOUND_BOT_TOKEN=0
set FOUND_CHAT_ID=0

:: Обновляем существующие переменные
(
for /f "tokens=1,* delims==" %%a in ('type "%ENV_FILE%"') do (
    if "%%a"=="TELEGRAM_BOT_TOKEN" (
        echo TELEGRAM_BOT_TOKEN="%TELEGRAM_BOT_TOKEN%"
        set FOUND_BOT_TOKEN=1
    ) else if "%%a"=="TELEGRAM_CHAT_ID" (
        echo TELEGRAM_CHAT_ID="%TELEGRAM_CHAT_ID%"
        set FOUND_CHAT_ID=1
    ) else (
        echo %%a=%%b
    )
)
) > "%ENV_FILE%.tmp"

:: Добавляем переменные, если они не существуют
if %FOUND_BOT_TOKEN%==0 (
    echo TELEGRAM_BOT_TOKEN="%TELEGRAM_BOT_TOKEN%" >> "%ENV_FILE%.tmp"
)
if %FOUND_CHAT_ID%==0 (
    echo TELEGRAM_CHAT_ID="%TELEGRAM_CHAT_ID%" >> "%ENV_FILE%.tmp"
)

move /y "%ENV_FILE%.tmp" "%ENV_FILE%" > nul

echo Настройки успешно сохранены в .env файл
echo.
echo ======================================================
echo Перезапустите сервер для применения изменений
echo ======================================================
pause
