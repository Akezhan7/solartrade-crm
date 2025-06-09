# Чек-лист готовности SolarTrade CRM к деплою на Timeweb.cloud

## ✅ ГОТОВО

### Структура проекта
- ✅ Backend: NestJS приложение с правильными скриптами build/start
- ✅ Frontend: React приложение с настроенной сборкой
- ✅ База данных: PostgreSQL с Prisma ORM и миграциями
- ✅ Конфигурационные файлы: .env.production для backend и frontend

### Скрипты и команды
- ✅ `npm run build` - сборка приложений
- ✅ `npm run start:prod` - запуск production сервера (backend)
- ✅ `npx prisma migrate deploy` - применение миграций
- ✅ `npx prisma generate` - генерация Prisma клиента
- ✅ `npx ts-node prisma/seed.ts` - заполнение базы тестовыми данными

### Функциональность
- ✅ Аутентификация и авторизация (JWT)
- ✅ CRUD операции для клиентов, сделок, задач
- ✅ API документация (Swagger)
- ✅ CORS настройки для production
- ✅ Telegram интеграция (опционально)
- ✅ Тестовые пользователи для демо

## 📋 ТРЕБУЕТСЯ НАСТРОЙКА НА TIMEWEB.CLOUD

### 1. Создание приложений
- [ ] Создать Node.js приложение для backend
- [ ] Создать Static Site приложение для frontend
- [ ] Создать PostgreSQL базу данных

### 2. Настройка переменных окружения

#### Backend:
```bash
DATABASE_URL="postgresql://user:pass@host:port/db_name"
JWT_SECRET="your_secure_secret_key"
JWT_EXPIRATION=86400
NODE_ENV=production
PORT=3001
FRONTEND_URL="https://your-frontend.timeweb.cloud"
```

#### Frontend:
```bash
REACT_APP_API_URL="https://your-backend.timeweb.cloud/api"
```

### 3. Команды деплоя

#### Backend:
- Build Command: `npm install && npx prisma generate && npm run build`
- Start Command: `npx prisma migrate deploy && npm run start:prod`
- Root Directory: `backend`

#### Frontend:
- Build Command: `npm install && npm run build`
- Output Directory: `build`
- Root Directory: `frontend`

### 4. После деплоя
- [ ] Применить миграции базы данных
- [ ] Заполнить базу тестовыми данными (если нужно)
- [ ] Проверить работу API по адресу: `https://your-backend.timeweb.cloud/api/docs`
- [ ] Проверить работу фронтенда

## 🔐 ТЕСТОВЫЕ УЧЕТНЫЕ ДАННЫЕ

- **Администратор**: admin@solartrade.com / admin123
- **Менеджер**: manager@solartrade.com / manager123
- **Продавец**: sales@solartrade.com / sales123

## 🎯 ВЫВОД

**Проект ГОТОВ к деплою на Timeweb.cloud!**

Все необходимые файлы конфигурации созданы, скрипты настроены, база данных подготовлена. Остается только:

1. Создать приложения на Timeweb.cloud
2. Настроить переменные окружения
3. Подключить GitHub репозиторий
4. Запустить деплой

Подробная инструкция находится в файле `DEPLOY_TO_TIMEWEB.md`
