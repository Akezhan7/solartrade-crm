import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru as ruLocale } from 'date-fns/locale';

import MainLayout from './components/layouts/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetails from './pages/ClientDetails';
import DealDetails from './pages/DealDetails';
import TaskDetails from './pages/TaskDetails';
import Deals from './pages/Deals';
import Tasks from './pages/Tasks';
import Settings from './pages/Settings';
import Users from './pages/Users';
import NotFound from './pages/NotFound';
import Login from './pages/auth/Login';
import theme from './utils/theme';

// Настройки будущей совместимости для React Router v7
const router = createBrowserRouter(
  [
    // Публичные маршруты
    { path: "/login", element: <Login /> },
    
    // Защищенные маршруты
    {
      element: <ProtectedRoute />,
      children: [
        {
          element: <MainLayout />,
          children: [            { path: "/", element: <Dashboard /> },
            { path: "clients", element: <Clients /> },
            { path: "clients/:id", element: <ClientDetails /> },
            { path: "deals", element: <Deals /> },            { path: "deals/:id", element: <DealDetails /> },            { path: "tasks", element: <Tasks /> },
            { path: "tasks/:id", element: <TaskDetails /> },
            { path: "tasks/new", element: <Tasks /> },
            { path: "settings", element: <Settings /> },            // Маршрут доступен только для администраторов
            { 
              path: "users",
              element: <ProtectedRoute requiredRole="ADMIN" />,
              children: [
                { path: "", element: <Users /> }
              ]
            }
          ]
        }
      ]
    },
    
    // Страница 404
    { path: "*", element: <NotFound /> }
  ],
  {
    // Добавляем доступные флаги совместимости для текущей версии
    future: {
      v7_relativeSplatPath: true
    }
  }
);

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ruLocale}>
        <CssBaseline />
        <RouterProvider router={router} />
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default App;