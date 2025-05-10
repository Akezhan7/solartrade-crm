import apiService from '../utils/apiService';

// Интерфейс для пользователя
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  position?: string;
}

/**
 * Сервис для работы с пользователями
 */
class UserService {  /**
   * Получить список всех пользователей
   */
  async getUsers(): Promise<User[]> {
    try {
      const response = await apiService.getUsers();
      return response;
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  /**
   * Получить пользователя по ID
   */
  async getUserById(id: string): Promise<User | null> {
    try {
      const response = await apiService.getUserById(id);
      return response;
    } catch (error) {
      console.error(`Error fetching user with ID ${id}:`, error);
      return null;
    }
  }
}

// Экспортируем синглтон сервиса
export default new UserService();
