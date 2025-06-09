# Деплой SolarTrade CRM на Timeweb.cloud

## Подготовка к деплою

### 1. Создание GitHub репозитория
1. Создайте репозиторий на GitHub
2. Загрузите код проекта в репозиторий:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/solar-trade-crm.git
git push -u origin main
```

### 2. Подготовка конфигурации

#### Backend (.env.production)
Настройте переменные окружения в файле `backend/.env.production`:
- `DATABASE_URL` - строка подключения к PostgreSQL
- `JWT_SECRET` - секретный ключ для JWT токенов
- `FRONTEND_URL` - URL фронтенда для CORS

#### Frontend (.env.production)
Настройте переменные окружения в файле `frontend/.env.production`:
- `REACT_APP_API_URL` - URL API бэкенда

## Деплой на Timeweb.cloud

### 1. Создание базы данных PostgreSQL

1. Войдите в панель управления Timeweb.cloud
2. Перейдите в раздел "Базы данных"
3. Создайте новую базу данных PostgreSQL
4. Скопируйте строку подключения

### 2. Деплой бэкенда

1. В панели управления перейдите в "Приложения"
2. Нажмите "Создать приложение"
3. Выберите "Из GitHub репозитория"
4. Укажите настройки:
   - **Имя**: solartrade-backend
   - **Репозиторий**: ваш GitHub репозиторий
   - **Ветка**: main
   - **Root Directory**: backend
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npx prisma migrate deploy && npm run start:prod`
   - **Port**: 3001

5. Настройте переменные окружения:
   - `DATABASE_URL`: строка подключения к PostgreSQL
   - `JWT_SECRET`: сгенерируйте сложный ключ
   - `JWT_EXPIRATION`: 86400
   - `NODE_ENV`: production
   - `FRONTEND_URL`: (добавите после деплоя фронтенда)

### 3. Деплой фронтенда

1. Создайте еще одно приложение
2. Укажите настройки:
   - **Имя**: solartrade-frontend
   - **Репозиторий**: тот же GitHub репозиторий
   - **Ветка**: main
   - **Root Directory**: frontend
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `serve -s build -l $PORT`

3. Добавьте переменную окружения:
   - `REACT_APP_API_URL`: URL бэкенда

### 4. Настройка CORS

1. Вернитесь к настройкам бэкенда
2. Добавьте переменную `FRONTEND_URL` с URL фронтенда
3. Перезапустите бэкенд

### 5. Инициализация базы данных

После успешного деплоя бэкенда:
1. Подключитесь к серверу через SSH или терминал приложения
2. Выполните команды:
```bash
npx prisma migrate deploy
npx ts-node prisma/seed.ts
```

## Проверка работоспособности

1. Откройте URL фронтенда
2. Войдите в систему:
   - **Администратор**: admin@solartrade.com / admin123
   - **Менеджер**: manager@solartrade.com / manager123
   - **Продавец**: sales@solartrade.com / sales123

3. Проверьте API документацию: `[backend-url]/api/docs`

## Возможные проблемы

### Ошибки сборки
- Убедитесь, что в `package.json` есть все необходимые скрипты
- Проверьте совместимость версий Node.js

### Проблемы с базой данных
- Проверьте корректность строки подключения
- Убедитесь, что база данных доступна

### CORS ошибки
- Убедитесь, что `FRONTEND_URL` правильно настроена в бэкенде
- Проверьте настройки CORS в `main.ts`

## Дополнительные настройки

### Telegram уведомления
1. Создайте бота через @BotFather
2. Получите ID чата через @userinfobot
3. Добавьте переменные:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`

### SSL сертификат
Timeweb.cloud автоматически предоставляет SSL сертификаты для всех приложений.

### Мониторинг
Используйте встроенные инструменты мониторинга Timeweb.cloud для отслеживания производительности и ошибок.
