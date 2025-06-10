/**
 * Скрипт для тестирования соединения с Telegram API
 * Запускать из корневой директории проекта: node scripts/test-telegram.js
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const readline = require('readline');

// Создаем интерфейс для чтения ввода пользователя
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Загружаем токен из .env или запрашиваем ввод
const telegramToken = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_TOKEN || '';
const telegramChatId = process.env.TELEGRAM_CHAT_ID || '';

/**
 * Проверяет соединение с Telegram API
 */
async function checkConnection(token) {
  try {
    console.log(`\n🔍 Проверка соединения с Telegram API для токена: ${token.substring(0, 6)}...`);
    
    const url = `https://api.telegram.org/bot${token}/getMe`;
    const response = await axios.get(url);
    
    if (response.data && response.data.ok) {
      console.log(`\n✅ Соединение успешно установлено!`);
      console.log(`🤖 Информация о боте:`);
      console.log(`   Имя: ${response.data.result.first_name}`);
      console.log(`   Имя пользователя: @${response.data.result.username}`);
      console.log(`   ID: ${response.data.result.id}`);
      return true;
    } else {
      console.error(`\n❌ Ошибка проверки соединения:`);
      console.error(response.data);
      return false;
    }
  } catch (error) {
    console.error(`\n❌ Ошибка при проверке соединения:`);
    if (error.response) {
      console.error(`   Статус: ${error.response.status}`);
      console.error(`   Данные: ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(`   ${error.message}`);
    }
    return false;
  }
}

/**
 * Проверяет валидность chat_id
 */
async function checkChatId(token, chatId) {
  try {
    console.log(`\n🔍 Проверка chat_id: ${chatId}`);
    
    const url = `https://api.telegram.org/bot${token}/getChat`;
    const response = await axios.post(url, { chat_id: chatId });
    
    if (response.data && response.data.ok) {
      console.log(`\n✅ Chat ID валиден!`);
      console.log(`👥 Информация о чате:`);
      
      if (response.data.result.type === 'private') {
        console.log(`   Тип: Приватный чат`);
        console.log(`   Имя: ${response.data.result.first_name} ${response.data.result.last_name || ''}`);
        console.log(`   Имя пользователя: @${response.data.result.username || '[не указано]'}`);
      } else if (response.data.result.type === 'group' || response.data.result.type === 'supergroup') {
        console.log(`   Тип: ${response.data.result.type === 'group' ? 'Группа' : 'Супергруппа'}`);
        console.log(`   Название: ${response.data.result.title}`);
      } else if (response.data.result.type === 'channel') {
        console.log(`   Тип: Канал`);
        console.log(`   Название: ${response.data.result.title}`);
      }
      
      return true;
    } else {
      console.error(`\n❌ Ошибка проверки chat_id:`);
      console.error(response.data);
      return false;
    }
  } catch (error) {
    console.error(`\n❌ Ошибка при проверке chat_id:`);
    if (error.response) {
      console.error(`   Статус: ${error.response.status}`);
      console.error(`   Данные: ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(`   ${error.message}`);
    }
    return false;
  }
}

/**
 * Отправляет тестовое сообщение
 */
async function sendTestMessage(token, chatId) {
  try {
    console.log(`\n📤 Отправка тестового сообщения в чат: ${chatId}`);
    
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const message = `🧪 Тестовое сообщение от скрипта проверки Telegram API
    
📅 Время: ${new Date().toLocaleString()}
💻 Хост: ${require('os').hostname()}

<b>Это сообщение означает, что настройки Telegram работают корректно!</b>`;
    
    const response = await axios.post(url, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML'
    });
    
    if (response.data && response.data.ok) {
      console.log(`\n✅ Сообщение успешно отправлено!`);
      console.log(`   Message ID: ${response.data.result.message_id}`);
      return true;
    } else {
      console.error(`\n❌ Ошибка отправки сообщения:`);
      console.error(response.data);
      return false;
    }
  } catch (error) {
    console.error(`\n❌ Ошибка при отправке сообщения:`);
    if (error.response) {
      console.error(`   Статус: ${error.response.status}`);
      console.error(`   Данные: ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(`   ${error.message}`);
    }
    return false;
  }
}

/**
 * Основная функция
 */
async function main() {
  console.log('🤖 Инструмент диагностики Telegram API');
  console.log('======================================\n');

  let token = telegramToken;
  let chatId = telegramChatId;

  // Запрашиваем токен, если он не найден
  if (!token) {
    token = await new Promise(resolve => {
      rl.question('Введите токен бота Telegram: ', answer => {
        resolve(answer.trim());
      });
    });
  }

  if (!token) {
    console.error('❌ Токен не указан. Выход.');
    rl.close();
    return;
  }

  // Проверяем соединение с API
  const connectionValid = await checkConnection(token);
  
  if (!connectionValid) {
    console.log('\n❌ Проверка соединения не удалась. Проверьте токен бота.');
    rl.close();
    return;
  }

  // Если chat_id не указан, запрашиваем его
  if (!chatId) {
    chatId = await new Promise(resolve => {
      rl.question('\nВведите chat_id для отправки сообщений: ', answer => {
        resolve(answer.trim());
      });
    });
  }

  if (!chatId) {
    console.error('❌ Chat ID не указан. Выход.');
    rl.close();
    return;
  }

  // Проверяем валидность chat_id
  const chatIdValid = await checkChatId(token, chatId);
  
  if (!chatIdValid) {
    console.log('\n❌ Проверка chat_id не удалась. Проверьте правильность ID чата.');
    rl.close();
    return;
  }

  // Спрашиваем, хочет ли пользователь отправить тестовое сообщение
  const sendTest = await new Promise(resolve => {
    rl.question('\nОтправить тестовое сообщение? (y/n): ', answer => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });

  if (sendTest) {
    await sendTestMessage(token, chatId);
  }

  // Записываем значения в .env, если пользователь согласен
  const updateEnv = await new Promise(resolve => {
    rl.question('\nОбновить настройки в файле .env? (y/n): ', answer => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });

  if (updateEnv) {
    try {
      const envFile = '.env';
      let envContent = '';
      
      if (fs.existsSync(envFile)) {
        envContent = fs.readFileSync(envFile, 'utf8');
      }

      // Обновляем или добавляем настройки Telegram
      const envVars = envContent.split('\n');
      const updatedVars = [];
      let tokenUpdated = false;
      let chatIdUpdated = false;

      for (const line of envVars) {
        if (line.startsWith('TELEGRAM_BOT_TOKEN=') || line.startsWith('TELEGRAM_TOKEN=')) {
          if (!tokenUpdated) {
            updatedVars.push(`TELEGRAM_BOT_TOKEN=${token}`);
            tokenUpdated = true;
          }
        } else if (line.startsWith('TELEGRAM_CHAT_ID=')) {
          updatedVars.push(`TELEGRAM_CHAT_ID=${chatId}`);
          chatIdUpdated = true;
        } else if (line.trim() !== '') {
          updatedVars.push(line);
        }
      }

      if (!tokenUpdated) {
        updatedVars.push(`TELEGRAM_BOT_TOKEN=${token}`);
      }
      
      if (!chatIdUpdated) {
        updatedVars.push(`TELEGRAM_CHAT_ID=${chatId}`);
      }

      fs.writeFileSync(envFile, updatedVars.join('\n') + '\n');
      console.log('\n✅ Файл .env успешно обновлен!');
    } catch (error) {
      console.error(`\n❌ Ошибка при обновлении файла .env: ${error.message}`);
    }
  }

  console.log('\n👋 Диагностика завершена.');
  rl.close();
}

// Запускаем основную функцию
main().catch(error => {
  console.error(`Необработанная ошибка: ${error.message}`);
  rl.close();
});
