import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import apiService from '../../utils/apiService';

interface ProtectedRouteProps {
  redirectPath?: string;
  requiredRole?: 'ADMIN' | 'MANAGER' | 'SALES';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  redirectPath = '/login',
  requiredRole
}) => {
  const location = useLocation();
  
  // Проверка авторизации пользователя через apiService
  const isAuthenticated = apiService.isAuthenticated();
  
  // Получаем данные о пользователе из localStorage
  let currentUser = null;
  try {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      currentUser = JSON.parse(userJson);
    }
  } catch (error) {
    console.error('Ошибка при получении данных пользователя:', error);
  }

  // Если пользователь не авторизован, перенаправляем на страницу авторизации
  // с сохранением пути, чтобы вернуться после входа
  if (!isAuthenticated) {
    return <Navigate 
      to={`${redirectPath}?from=${encodeURIComponent(location.pathname)}`} 
      replace 
    />;
  }
  
  // Если требуется определенная роль и пользователь не имеет её или не загружен
  if (requiredRole && (!currentUser || currentUser.role !== requiredRole)) {
    // Для страницы пользователей (/users) нужна роль ADMIN
    if (location.pathname === '/users' && (!currentUser || currentUser.role !== 'ADMIN')) {
      return <Navigate to="/" replace />;
    }
  }

  // Если пользователь авторизован и имеет нужные права, отображаем дочерние маршруты
  return <Outlet />;
};

export default ProtectedRoute;