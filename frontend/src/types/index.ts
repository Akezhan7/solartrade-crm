// Типы для сущностей приложения

// Типы для клиентов
export interface Company {
  id: string;
  name: string;
  inn: string;
  kpp: string;
  address: string;
  bankDetails: string;
  clientId: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  company: Company | null;
  companyName?: string; // Added for dashboard display
  dealsCount?: number; // Number of deals for this client
  createdAt: string;
  updatedAt: string;
}

// Типы для сделок
export type DealStatus = 'NEW' | 'NEGOTIATION' | 'PROPOSAL' | 'AGREEMENT' | 'PAID' | 'INSTALLATION' | 'COMPLETED' | 'CANCELLED';

export interface Deal {
  id: string;
  title: string;
  description: string;
  status: DealStatus;
  amount: number;
  currency?: string;
  clientId: string;
  clientName: string;
  managerId: string;
  managerName: string;
  estimatedClosingDate?: string;
  actualClosingDate?: string;
  probability: number;
  productInfo?: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
}

// Типы для задач
export type TaskStatus = 'NEW' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'POSTPONED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assigneeId: string;
  assigneeName: string;
  clientId: string | null;
  clientName: string | null;
  dealId: string | null;
  dealName: string | null;
  completedAt?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

// Типы для взаимодействий с клиентами
export type InteractionType = 'NOTE' | 'DEAL' | 'TASK' | 'EMAIL' | 'CALL';

export interface Interaction {
  id: string;
  type: InteractionType;
  content: string;
  clientId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

// Типы для пользователей
export type UserRole = 'ADMIN' | 'MANAGER' | 'SALES';

export interface User {
  id: string;
  name: string;
  email: string;
  position?: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Типы для настроек Telegram
export interface TelegramSettings {
  id: string;
  botToken: string;
  chatId: string;
  notifyNewClients: boolean;
  notifyNewDeals: boolean;
  notifyNewTasks: boolean;
  notifyTaskDeadlines: boolean;
  taskReminderHours: number[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Интерфейс для статистики дашборда
export interface DashboardStats {
  totalClients: number;
  newClients: number;
  newClientsGrowth: number;
  activeDeals: number;
  activeDealsGrowth: number;
  revenue: number;
  revenueGrowth: number;
  activeTasks: number;
  completedTasksToday: number;
  monthlySales: {
    labels: string[];
    data: number[];
  };
  dealsByStatus: {
    labels: string[];
    data: number[];
  };
  recentDeals: Deal[];
  recentTasks: Task[];
  recentClients: Client[];
}