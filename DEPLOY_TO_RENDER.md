# Пошаговое руководство по деплою SolarTrade CRM на Render

## Предварительные шаги

1. Создайте аккаунт на [Render](https://render.com/)
2. Разместите код проекта на GitHub

## 1. Подготовка к деплою

### Подготовка бэкенда

1. Откройте PowerShell и выполните:
   ```powershell
   cd "d:\Рабочая\Freelance\SolarTrade CRM\solar-trade-crm\backend"
   ```

2. Проверьте настройки скриптов в package.json:
   ```powershell
   (Get-Content -Path package.json | ConvertFrom-Json).scripts
   ```

3. Убедитесь, что есть скрипты `build` и `start:prod`. Если нет, добавьте:
   ```powershell
   $packageJson = Get-Content -Path package.json | ConvertFrom-Json
   $packageJson.scripts | Add-Member -Name "build" -Value "nest build" -MemberType NoteProperty -Force
   $packageJson.scripts | Add-Member -Name "start:prod" -Value "node dist/main" -MemberType NoteProperty -Force
   $packageJson | ConvertTo-Json -Depth 10 | Set-Content -Path package.json
   ```

### Подготовка фронтенда

1. Перейдите в директорию фронтенда:
   ```powershell
   cd "d:\Рабочая\Freelance\SolarTrade CRM\solar-trade-crm\frontend"
   ```

2. Создайте файл .env.production:
   ```powershell
   @"
   REACT_APP_API_URL=https://solartrade-backend.onrender.com/api
   "@ | Out-File -FilePath .env.production -Encoding utf8
   ```

## 2. Создание базы данных PostgreSQL

1. Перейдите на [dashboard.render.com](https://dashboard.render.com)
2. Нажмите кнопку "New" → "PostgreSQL"
3. Заполните форму:
   - **Name**: solartrade-db
   - **Database**: solartrade
   - **User**: solartrade
   - **Plan**: Free
4. Нажмите "Create Database"
5. После создания БД, **скопируйте Internal Database URL** (понадобится позже)

## 3. Деплой бэкенда

1. Перейдите на [dashboard.render.com](https://dashboard.render.com)
2. Нажмите кнопку "New" → "Web Service"
3. Выберите опцию "Build and deploy from a Git repository"
4. Подключите ваш GitHub репозиторий, если еще не подключен
5. Выберите репозиторий с проектом
6. Заполните форму:
   - **Name**: solartrade-backend
   - **Root Directory**: backend
   - **Environment**: Node
   - **Build Command**: npm install && npx prisma generate && npm run build
   - **Start Command**: npx prisma migrate deploy && npm run start:prod
   - **Plan**: Free
7. В секции "Environment Variables" добавьте:
   - **DATABASE_URL**: [вставьте скопированный Internal Database URL]
   - **JWT_SECRET**: [придумайте сложный секретный ключ, например `openssl rand -base64 32`]
   - **JWT_EXPIRATION**: 86400
   - **NODE_ENV**: production
   - **FRONTEND_URL**: (добавите позже, после деплоя фронтенда)
8. Нажмите "Create Web Service"

## 4. Деплой фронтенда

1. Перейдите на [dashboard.render.com](https://dashboard.render.com)
2. Нажмите кнопку "New" → "Static Site"
3. Выберите тот же GitHub репозиторий
4. Заполните форму:
   - **Name**: solartrade-frontend
   - **Root Directory**: frontend
   - **Build Command**: npm install && npm run build
   - **Publish Directory**: build
5. В секции "Environment Variables" добавьте:
   - **REACT_APP_API_URL**: https://solartrade-backend.onrender.com/api
6. Нажмите "Create Static Site"
7. После деплоя фронтенда, скопируйте его URL

## 5. Настройка CORS для бэкенда

1. Вернитесь на страницу бэкенд-сервиса
2. Перейдите во вкладку "Environment"
3. Добавьте переменную:
   - **FRONTEND_URL**: [вставьте URL фронтенда]
4. Нажмите "Save Changes"
5. Нажмите "Manual Deploy" → "Deploy latest commit"

## 6. Применение миграций и заполнение базы данных

1. На странице бэкенд-сервиса перейдите на вкладку "Shell"
2. Выполните команды:
   ```bash
   npx prisma migrate deploy
   npx ts-node prisma/seed.ts
   ```

## 7. Проверка работоспособности

1. Откройте URL фронтенд-сервиса в браузере
2. Войдите в систему, используя тестовые учетные данные:
   - **Администратор**: admin@solartrade.com / admin123
   - **Менеджер**: manager@solartrade.com / manager123
   - **Продавец**: sales@solartrade.com / sales123
3. Проверьте Swagger документацию API: https://solartrade-backend.onrender.com/api/docs

## Устранение возможных проблем

### Проблема с подключением к базе данных

1. Проверьте правильность строки подключения:
   ```bash
   echo $DATABASE_URL | grep "postgresql://"
   ```
2. Если строка некорректна, обновите переменную DATABASE_URL в настройках бэкенда

### Ошибки при сборке фронтенда

1. Проверьте логи сборки на странице фронтенд-сервиса
2. Если есть проблемы с зависимостями, выполните:
   ```bash
   npm install --legacy-peer-deps
   ```
   и добавьте этот флаг в команду сборки

### CORS ошибки

1. Убедитесь, что URL фронтенда правильно указан в переменной FRONTEND_URL бэкенда
2. Проверьте, что в main.ts бэкенда CORS настроен правильно:
   ```typescript
   app.enableCors({
     origin: process.env.FRONTEND_URL || 'http://localhost:3000',
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
     credentials: true,
   });
   ```
