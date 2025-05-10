/**
 * Файл с мок-данными для разработки
 * ВНИМАНИЕ: Этот файл сохранен для обратной совместимости и будет удален в будущих версиях.
 * Пожалуйста, используйте реальное API вместо мок-данных.
 */

import { Client, Deal, Task, TaskStatus, TaskPriority, Interaction } from '../types';

// Определяем TaskPriority локально если отсутствует в импорте
// enum TaskPriority {
//   LOW = 'LOW',
//   MEDIUM = 'MEDIUM',
//   HIGH = 'HIGH'
// }

// Мок-пользователи для обратной совместимости
export const mockUsers = [
  { id: '1', name: 'Иван Иванов', email: 'ivan@example.com', role: 'MANAGER' },
  { id: '2', name: 'Петр Петров', email: 'petr@example.com', role: 'SALES' },
  { id: '3', name: 'Мария Сидорова', email: 'maria@example.com', role: 'SALES' },
  { id: '4', name: 'Администратор', email: 'admin@example.com', role: 'ADMIN' }
];

// Мок-клиенты
export const mockClients: Client[] = [
  {
    id: 'client-001',
    name: 'ООО "Солнечный дом"',
    phone: '+7 (495) 123-45-67',
    email: 'info@solnechnydom.ru',
    company: {
      id: 'company-001',
      name: 'ООО "Солнечный дом"',
      inn: '7701234567',
      kpp: '770101001',
      address: 'г. Москва, ул. Солнечная, д. 1',
      bankDetails: 'р/с 40702810123456789012 в ПАО "Сбербанк"',
      clientId: 'client-001'
    },
    createdAt: '2023-04-10T12:00:00Z',
    updatedAt: '2023-04-10T12:00:00Z'
  },
  {
    id: 'client-002',
    name: 'Иванов Алексей Петрович',
    phone: '+7 (903) 987-65-43',
    email: 'ivanov@example.com',
    company: null,
    createdAt: '2023-04-15T10:30:00Z',
    updatedAt: '2023-04-15T10:30:00Z'
  },
  {
    id: 'client-003',
    name: 'ООО "ТехноСтрой"',
    phone: '+7 (499) 765-43-21',
    email: 'info@technostroy.ru',
    company: {
      id: 'company-003',
      name: 'ООО "ТехноСтрой"',
      inn: '7709876543',
      kpp: '770901001',
      address: 'г. Москва, ул. Строительная, д. 10',
      bankDetails: 'р/с 40702810987654321098 в АО "Альфа-Банк"',
      clientId: 'client-003'
    },
    createdAt: '2023-04-20T14:15:00Z',
    updatedAt: '2023-04-20T14:15:00Z'
  }
];

// Мок-сделки
export const mockDeals: Deal[] = [
  {
    id: 'deal-001',
    title: 'Установка солнечных панелей',
    description: 'Установка солнечных панелей на крыше офисного здания',
    status: 'NEGOTIATION',
    amount: 450000,
    clientId: 'client-001',
    clientName: 'ООО "Солнечный дом"',
    managerId: '1',
    managerName: 'Иван Иванов',
    estimatedClosingDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
    probability: 70,
    productInfo: 'Солнечные панели SolarMax, 15 шт.',
    source: 'Рекомендация',
    createdAt: '2023-05-01T09:00:00Z',
    updatedAt: '2023-05-05T11:30:00Z'
  },
  {
    id: 'deal-002',
    title: 'Проект солнечной электростанции',
    description: 'Разработка и монтаж солнечной электростанции для строительного объекта',
    status: 'PROPOSAL',
    amount: 1250000,
    clientId: 'client-003',
    clientName: 'ООО "ТехноСтрой"',
    managerId: '2',
    managerName: 'Петр Петров',
    estimatedClosingDate: new Date(new Date().setDate(new Date().getDate() + 45)).toISOString(),
    probability: 60,
    productInfo: 'Солнечная электростанция мощностью 50 кВт',
    source: 'Выставка "ЭнергоЭкспо 2023"',
    createdAt: '2023-05-03T10:15:00Z',
    updatedAt: '2023-05-06T14:20:00Z'
  },
  {
    id: 'deal-003',
    title: 'Солнечные панели для частного дома',
    description: 'Установка солнечных панелей и системы хранения энергии',
    status: 'NEW',
    amount: 350000,
    clientId: 'client-002',
    clientName: 'Иванов Алексей Петрович',
    managerId: '1',
    managerName: 'Иван Иванов',
    estimatedClosingDate: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString(),
    probability: 40,
    productInfo: 'Солнечные панели HomeSolar, 10 штук + система хранения 10 кВт*ч',
    source: 'Сайт компании',
    createdAt: '2023-05-08T11:00:00Z',
    updatedAt: '2023-05-08T11:00:00Z'
  }
];

// Мок-задачи
export const mockTasks: Task[] = [
  { 
    id: 'task-001',
    title: 'Позвонить клиенту ООО "Солнечный дом"',
    description: 'Обсудить детали заказа солнечных панелей',
    status: 'NEW',
    priority: 'HIGH',
    dueDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString(), // завтра
    assigneeId: '1',
    assigneeName: 'Иван Иванов',
    clientId: 'client-001',
    clientName: 'ООО "Солнечный дом"',
    dealId: 'deal-001',
    dealName: 'Установка солнечных панелей',
    createdById: '1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  { 
    id: 'task-002',
    title: 'Подготовить коммерческое предложение',
    description: 'Подготовить КП для ООО "ТехноСтрой"',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    dueDate: new Date().toISOString(), // сегодня
    assigneeId: '2',
    assigneeName: 'Петр Петров',
    clientId: 'client-003',
    clientName: 'ООО "ТехноСтрой"',
    dealId: 'deal-002',
    dealName: 'Проект солнечной электростанции',
    createdById: '1',
    createdAt: new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  { 
    id: 'task-003',
    title: 'Встреча с руководителем ООО "ТехноСтрой"',
    description: 'Обсудить проект солнечной электростанции',
    status: 'NEW',
    priority: 'HIGH',
    dueDate: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // через 3 дня
    assigneeId: '1',
    assigneeName: 'Иван Иванов',
    clientId: 'client-003',
    clientName: 'ООО "ТехноСтрой"',
    dealId: 'deal-002',
    dealName: 'Проект солнечной электростанции',
    createdById: '1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  { 
    id: 'task-004',
    title: 'Отправить счет на оплату',
    description: 'Счет за монтаж солнечных панелей',
    status: 'COMPLETED',
    priority: 'LOW',
    dueDate: new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 дня назад
    assigneeId: '2',
    assigneeName: 'Петр Петров',
    clientId: 'client-001',
    clientName: 'ООО "Солнечный дом"',
    dealId: 'deal-001',
    dealName: 'Установка солнечных панелей',
    completedAt: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdById: '1',
    createdAt: new Date(new Date().getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  { 
    id: 'task-005',
    title: 'Подготовить презентацию для клиента',
    description: 'Презентация солнечных панелей для частного дома',
    status: 'POSTPONED',
    priority: 'MEDIUM',
    dueDate: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // вчера
    assigneeId: '3',
    assigneeName: 'Мария Сидорова',
    clientId: 'client-002',
    clientName: 'Иванов Алексей Петрович',
    dealId: 'deal-003',
    dealName: 'Солнечные панели для частного дома',
    createdById: '2',
    createdAt: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Мок-взаимодействия с клиентами
export const mockInteractions: Interaction[] = [

];

// Статистика для дашборда
export const mockDashboardStats = {
  activeTasks: 15,
  completedTasks: 32,
  activeDeals: 8,
  dealsValue: 4250000,
  clientsTotal: 27,
  newClientsThisMonth: 5,
  conversionRate: 65,
  averageDealValue: 531250
};
