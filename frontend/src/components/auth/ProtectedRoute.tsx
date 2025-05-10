import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import apiService from '../../utils/apiService';

interface ProtectedRouteProps {
  redirectPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  redirectPath = '/login',
}) => {
  const location = useLocation();
  
  // Проверка авторизации пользователя через apiService
  const isAuthenticated = apiService.isAuthenticated();

  // Если пользователь не авторизован, перенаправляем на страницу авторизации
  // с сохранением пути, чтобы вернуться после входа
  if (!isAuthenticated) {
    return <Navigate 
      to={`${redirectPath}?from=${encodeURIComponent(location.pathname)}`} 
      replace 
    />;
  }

  // Если пользователь авторизован, отображаем дочерние маршруты
  return <Outlet />;
};

export default ProtectedRoute;