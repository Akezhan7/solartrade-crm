import { Client, Deal, Task, Interaction } from '../types';

// Ключи для хранения в localStorage
const STORAGE_KEYS = {
  CLIENTS: 'solar_trade_clients',
  DEALS: 'solar_trade_deals',
  TASKS: 'solar_trade_tasks',
  INTERACTIONS: 'solar_trade_interactions',
  AUTH_TOKEN: 'authToken',
  USER: 'user',
};

/**
 * Сервис для локального хранения данных (временная замена бэкенда)
 */
class StorageService {
  // Методы для авторизации
  public clearAuth(): void {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }

  // Методы для работы с клиентами
  public getClients(): Client[] {
    const clientsJson = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    return clientsJson ? JSON.parse(clientsJson) : [];
  }

  public getClient(id: string): Client | null {
    const clients = this.getClients();
    return clients.find(client => client.id === id) || null;
  }

  public saveClient(client: Client): Client {
    const clients = this.getClients();
    const existingIndex = clients.findIndex(c => c.id === client.id);
    
    if (existingIndex >= 0) {
      // Обновляем существующего клиента
      clients[existingIndex] = { 
        ...client, 
        updatedAt: new Date().toISOString() 
      };
    } else {
      // Добавляем нового клиента
      clients.push({
        ...client,
        id: client.id || Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
    return client;
  }

  public deleteClient(id: string): boolean {
    const clients = this.getClients();
    const newClients = clients.filter(client => client.id !== id);
    
    if (newClients.length !== clients.length) {
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(newClients));
      return true;
    }
    
    return false;
  }

  // Методы для работы со сделками
  public getDeals(): Deal[] {
    const dealsJson = localStorage.getItem(STORAGE_KEYS.DEALS);
    return dealsJson ? JSON.parse(dealsJson) : [];
  }

  public getDeal(id: string): Deal | null {
    const deals = this.getDeals();
    return deals.find(deal => deal.id === id) || null;
  }

  public saveDeal(deal: Deal): Deal {
    const deals = this.getDeals();
    const existingIndex = deals.findIndex(d => d.id === deal.id);
    
    if (existingIndex >= 0) {
      // Обновляем существующую сделку
      deals[existingIndex] = { 
        ...deal, 
        updatedAt: new Date().toISOString() 
      };
    } else {
      // Добавляем новую сделку
      deals.push({
        ...deal,
        id: deal.id || Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    localStorage.setItem(STORAGE_KEYS.DEALS, JSON.stringify(deals));
    return deal;
  }

  public deleteDeal(id: string): boolean {
    const deals = this.getDeals();
    const newDeals = deals.filter(deal => deal.id !== id);
    
    if (newDeals.length !== deals.length) {
      localStorage.setItem(STORAGE_KEYS.DEALS, JSON.stringify(newDeals));
      return true;
    }
    
    return false;
  }

  // Методы для работы с задачами
  public getTasks(): Task[] {
    const tasksJson = localStorage.getItem(STORAGE_KEYS.TASKS);
    return tasksJson ? JSON.parse(tasksJson) : [];
  }

  public getTask(id: string): Task | null {
    const tasks = this.getTasks();
    return tasks.find(task => task.id === id) || null;
  }

  public saveTask(task: Task): Task {
    const tasks = this.getTasks();
    const existingIndex = tasks.findIndex(t => t.id === task.id);
    
    if (existingIndex >= 0) {
      // Обновляем существующую задачу
      tasks[existingIndex] = { 
        ...task, 
        updatedAt: new Date().toISOString() 
      };
    } else {
      // Добавляем новую задачу
      tasks.push({
        ...task,
        id: task.id || Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    return task;
  }

  public deleteTask(id: string): boolean {
    const tasks = this.getTasks();
    const newTasks = tasks.filter(task => task.id !== id);
    
    if (newTasks.length !== tasks.length) {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(newTasks));
      return true;
    }
    
    return false;
  }

  // Методы для работы с взаимодействиями
  public getInteractions(): Interaction[] {
    const interactionsJson = localStorage.getItem(STORAGE_KEYS.INTERACTIONS);
    return interactionsJson ? JSON.parse(interactionsJson) : [];
  }

  public getClientInteractions(clientId: string): Interaction[] {
    const interactions = this.getInteractions();
    return interactions.filter(interaction => interaction.clientId === clientId);
  }

  public saveInteraction(interaction: Interaction): Interaction {
    const interactions = this.getInteractions();
    const existingIndex = interactions.findIndex(i => i.id === interaction.id);
    
    if (existingIndex >= 0) {
      // Обновляем существующее взаимодействие
      interactions[existingIndex] = { 
        ...interaction, 
        updatedAt: new Date().toISOString() 
      };
    } else {
      // Добавляем новое взаимодействие
      interactions.push({
        ...interaction,
        id: interaction.id || Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    localStorage.setItem(STORAGE_KEYS.INTERACTIONS, JSON.stringify(interactions));
    return interaction;
  }

  // Инициализация начальных данных, если локальное хранилище пусто
  public initializeStorage(clients?: Client[], deals?: Deal[], tasks?: Task[], interactions?: Interaction[]): void {
    if (clients && this.getClients().length === 0) {
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
    }
    
    if (deals && this.getDeals().length === 0) {
      localStorage.setItem(STORAGE_KEYS.DEALS, JSON.stringify(deals));
    }
    
    if (tasks && this.getTasks().length === 0) {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    }
    
    if (interactions && this.getInteractions().length === 0) {
      localStorage.setItem(STORAGE_KEYS.INTERACTIONS, JSON.stringify(interactions));
    }
  }
}

const storageService = new StorageService();
export default storageService;