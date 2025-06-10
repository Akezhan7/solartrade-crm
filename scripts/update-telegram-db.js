import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateTelegramSettings() {
  console.log('🔄 Обновление настроек Telegram...');
  
  const telegramToken = '7727558901:AAErOxCwJAeyQaFLgdHOXuktqFbVOhcslYE';
  const telegramChatId = '-1002441953151';
  
  try {
    // Проверяем, есть ли уже настройки в базе
    const settings = await prisma.telegramSettings.findFirst();
    
    if (settings) {
      // Обновляем существующие настройки
      const updated = await prisma.telegramSettings.update({
        where: { id: settings.id },
        data: {
          botToken: telegramToken,
          chatId: telegramChatId,
          isActive: true,
          notifyNewClients: true,
          notifyNewDeals: true,
          notifyNewTasks: true,
          notifyTaskDeadlines: true,
          taskReminderHours: [24, 8, 1],
        },
      });
      console.log('✅ Настройки Telegram успешно обновлены!');
      console.log(updated);
    } else {
      // Создаем новые настройки
      const created = await prisma.telegramSettings.create({
        data: {
          botToken: telegramToken,
          chatId: telegramChatId,
          isActive: true,
          notifyNewClients: true,
          notifyNewDeals: true,
          notifyNewTasks: true,
          notifyTaskDeadlines: true,
          taskReminderHours: [24, 8, 1],
        },
      });
      console.log('✅ Настройки Telegram успешно созданы!');
      console.log(created);
    }
  } catch (error) {
    console.error('❌ Ошибка при обновлении настроек Telegram:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateTelegramSettings();
