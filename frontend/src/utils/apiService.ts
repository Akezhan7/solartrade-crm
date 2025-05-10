import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosHeaders, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { createBrowserHistory } from 'history';

/**
 * Конфигурация API клиента
 */
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const history = createBrowserHistory();

// Расширяем тип InternalAxiosRequestConfig для возможности добавления _retry поля
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Интерфейс для данных авторизации
export interface LoginRequest {
  email: string;
  password: string;
}

// Интерфейс для ответа с токеном доступа
export interface AuthResponse {
  access_token: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

/**
 * API сервис для взаимодействия с бэкендом
 */
class ApiService {
  private axios: AxiosInstance;
  private isRefreshingToken = false;
  private failedQueue: any[] = [];
  
  constructor() {
    this.axios = axios.create({
      baseURL: API_URL,
      headers: new AxiosHeaders({
        'Content-Type': 'application/json'
      })
    });

    // Перехватчик запросов для добавления токена авторизации
    this.axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          if (!config.headers) {
            config.headers = new AxiosHeaders();
          }
          // Правильный формат для Bearer токена - с пробелом после Bearer
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Перехватчик ответов для обработки ошибок авторизации
    this.axios.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as ExtendedAxiosRequestConfig;
        
        // Если нет ответа от сервера вообще
        if (!error.response) {
          console.error('Ошибка сети - сервер недоступен');
          return Promise.reject(error);
        }
        
        // Получаем данные об ошибке
        const { status, data } = error.response;
        
        if (status === 401) {
          // Пытаемся получить информацию об ошибке
          const errorMsg = data && typeof data === 'object' && 'message' in data 
            ? data.message 
            : 'Ошибка авторизации';
          
          console.warn(`Ошибка авторизации: ${errorMsg}`);
          
          // Если это не запрос на авторизацию и не повторный запрос
          if (originalRequest && originalRequest.url !== '/auth/login' && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
              // Пытаемся обновить токен через refresh
              const refreshToken = localStorage.getItem('refreshToken');
              if (refreshToken) {
                const response = await axios.post(`${API_URL}/auth/refresh`, {
                  refresh_token: refreshToken
                });
                
                if (response.data && response.data.access_token) {
                  localStorage.setItem('authToken', response.data.access_token);
                  if (response.data.refresh_token) {
                    localStorage.setItem('refreshToken', response.data.refresh_token);
                  }
                  
                  if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;
                  }
                  return this.axios(originalRequest);
                }
              }
              
              // Если не удалось обновить, выходим
              this.logout(true);
              return Promise.reject(error);
            } catch (refreshError) {
              console.error('Не удалось обновить токен:', refreshError);
              this.logout(true);
              return Promise.reject(error);
            }
          }
          
          // Если это не запрос на логин, выходим
          if (!originalRequest?.url?.includes('/auth/login')) {
            this.logout(true);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Метод для выхода из системы
   */
  public logout(redirect = true): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    if (redirect) {
      history.replace('/login');
      window.location.href = '/login';
    }
  }

  /**
   * Метод для авторизации пользователя
   */
  public async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await this.axios.post<AuthResponse>('/auth/login', credentials);
      const { access_token, user } = response.data;
      
      // Сохраняем токен в localStorage
      localStorage.setItem('authToken', access_token);
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }
      
      return response.data;
    } catch (error) {
      console.error('Ошибка авторизации:', error);
      throw error;
    }
  }

  /**
   * Проверяет, авторизован ли пользователь
   */
  public isAuthenticated(): boolean {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    return !!token && !!user;
  }

  /**
   * Универсальный метод для GET-запросов
   */
  public async get(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse> {
    return this.axios.get(url, config);
  }

  /**
   * Универсальный метод для POST-запросов
   */
  public async post(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse> {
    return this.axios.post(url, data, config);
  }

  /**
   * Универсальный метод для PUT-запросов
   */
  public async put(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse> {
    return this.axios.put(url, data, config);
  }

  /**
   * Универсальный метод для DELETE-запросов
   */
  public async delete(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse> {
    return this.axios.delete(url, config);
  }

  // API методы для работы с клиентами
  public async getClients() {
    const response = await this.axios.get('/clients');
    return response.data;
  }

  public async getClientById(id: string) {
    const response = await this.axios.get(`/clients/${id}`);
    return response.data;
  }

  public async createClient(clientData: any) {
    const response = await this.axios.post('/clients', clientData);
    return response.data;
  }

  public async updateClient(id: string, clientData: any) {
    const response = await this.axios.patch(`/clients/${id}`, clientData);
    return response.data;
  }

  public async deleteClient(id: string) {
    const response = await this.axios.delete(`/clients/${id}`);
    return response.data;
  }

  // API методы для работы с задачами
  public async getTasks() {
    const response = await this.axios.get('/tasks');
    return response.data;
  }
  public async getTaskById(id: string) {
    console.log(`Fetching task with ID: ${id}`);
    const response = await this.axios.get(`/tasks/${id}`);
    console.log("API task response:", response.data);
    return response.data;
  }

  public async createTask(taskData: any) {
    const response = await this.axios.post('/tasks', taskData);
    return response.data;
  }  public async updateTask(id: string, taskData: any) {
    console.log(`Updating task ${id} with data:`, taskData);
    try {
      const response = await this.axios.patch(`/tasks/${id}`, taskData);
      console.log("Task update response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Error updating task:", error.response?.data || error.message);
      throw error;
    }
  }

  public async deleteTask(id: string) {
    const response = await this.axios.delete(`/tasks/${id}`);
    return response.data;
  }

  // API методы для работы со сделками
  public async getDeals() {
    const response = await this.axios.get('/deals');
    return response.data;
  }
  public async getDealById(id: string) {
    console.log(`Fetching deal with ID: ${id}`);
    const response = await this.axios.get(`/deals/${id}`);
    console.log("API deal response:", response.data);
    return response.data;
  }

  public async createDeal(dealData: any) {
    const response = await this.axios.post('/deals', dealData);
    return response.data;
  }  public async updateDeal(id: string, dealData: any) {
    console.log(`Updating deal ${id} with data:`, dealData);
    try {
      const response = await this.axios.patch(`/deals/${id}`, dealData);
      console.log("Deal update response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Error updating deal:", error.response?.data || error.message);
      throw error;
    }
  }

  public async deleteDeal(id: string) {
    const response = await this.axios.delete(`/deals/${id}`);
    return response.data;
  }

  // API методы для работы с пользователями
  public async getUsers() {
    const response = await this.axios.get('/users');
    return response.data;
  }

  public async getUserById(id: string) {
    const response = await this.axios.get(`/users/${id}`);
    return response.data;
  }
  // API методы для работы с дашбордом
  public async getDashboardData() {
    // Используем endpoint /dashboard/ вместо /dashboard/stats для получения всех данных сразу
    const dashboardResponse = await this.axios.get('/dashboard');
    return dashboardResponse.data;
  }
  
  public async getLatestTasks(limit: number = 5) {
    const response = await this.axios.get(`/dashboard/latest-tasks?limit=${limit}`);
    return response.data;
  }
  
  public async getLatestClients(limit: number = 5) {
    const response = await this.axios.get(`/dashboard/latest-clients?limit=${limit}`);
    return response.data;
  }

  // API методы для работы с взаимодействиями
  public async getInteractions(clientId: string) {
    const response = await this.axios.get(`/interactions?clientId=${clientId}`);
    return response.data;
  }

  public async createInteraction(interactionData: any) {
    const response = await this.axios.post('/interactions', interactionData);
    return response.data;
  }

  // API методы для работы с настройками Telegram
  public async getTelegramSettings() {
    const response = await this.axios.get('/telegram/settings');
    return response.data;
  }

  public async updateTelegramSettings(settingsData: any) {
    const response = await this.axios.patch('/telegram/settings', settingsData);
    return response.data;
  }

  public async testTelegramNotification() {
    const response = await this.axios.post('/telegram/test');
    return response.data;
  }
}

export default new ApiService();