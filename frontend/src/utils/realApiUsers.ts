/**
 * Вспомогательные функции для работы с пользователями из API вместо мок-данных
 */

// Дефолтные пользователи для случаев, когда API недоступен
export const defaultUsers = [
  { id: '1', name: 'Иван Иванов', email: 'ivan@example.com', role: 'MANAGER' },
  { id: '2', name: 'Петр Петров', email: 'petr@example.com', role: 'SALES' },
  { id: '3', name: 'Мария Сидорова', email: 'maria@example.com', role: 'SALES' },
  { id: '4', name: 'Администратор', email: 'admin@example.com', role: 'ADMIN' }
];
