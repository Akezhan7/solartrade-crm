import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper,
  Container,
  Avatar,
  Link,
  CircularProgress,
  Alert,
  Divider,
  Chip
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import DeveloperModeIcon from '@mui/icons-material/DeveloperMode';
import { useNavigate, useLocation } from 'react-router-dom';
import apiService from '../../utils/apiService';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const isDevMode = process.env.NODE_ENV === 'development';

  // Проверяем, есть ли сообщение об ошибке в параметрах URL (например, после редиректа)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const errorMsg = searchParams.get('error');
    if (errorMsg) {
      setError(decodeURIComponent(errorMsg));
    }
    
    const fromPath = searchParams.get('from');
    if (fromPath) {
      setSuccess(`После успешного входа вы будете перенаправлены на: ${fromPath}`);
    }
    
    // Если пользователь уже авторизован, перенаправляем на главную
    if (apiService.isAuthenticated()) {
      const redirectTo = fromPath || '/';
      navigate(redirectTo);
    }
  }, [location, navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {      // Реальный запрос к API для аутентификации
      const response = await apiService.login({ email, password });
      
      // Сохраняем токен в localStorage
      if (response && response.access_token) {
        setSuccess('Авторизация успешна! Перенаправляем...');
        
        // Переходим на главную страницу или предыдущую страницу через небольшую задержку
        setTimeout(() => {
          const from = new URLSearchParams(location.search).get('from') || '/';
          navigate(from);
        }, 1000);
      } else {
        setError('Ошибка авторизации: Токен не получен');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Обработка различных ошибок API
      if (err.response) {
        // Ошибка ответа от сервера
        if (err.response.status === 401) {
          setError('Неверный email или пароль');
        } else if (err.response.data && err.response.data.message) {
          setError(`Ошибка авторизации: ${err.response.data.message}`);
        } else {
          setError(`Ошибка сервера: ${err.response.status}`);
        }
      } else if (err.request) {
        setError('Сервер недоступен. Проверьте соединение или повторите позже.');
        
        if (isDevMode) {
          // Показываем дополнительное сообщение для режима разработки
          setSuccess('В режиме разработки: вы можете использовать тестовые данные для продолжения работы');
        }
      } else {
        // Другие ошибки
        setError('Ошибка авторизации. Повторите попытку позже.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Функция для быстрого входа с тестовыми данными в режиме разработки
  const handleDevLogin = async () => {
    if (!isDevMode) return;
    
    setLoading(true);
    setError('');
    setEmail('dev@example.com');
    setPassword('devpassword');
    
    try {
      const response = await apiService.login({ 
        email: 'dev@example.com', 
        password: 'devpassword' 
      });
      
      setSuccess('Вход с тестовыми данными успешен! Перенаправляем...');
      
      setTimeout(() => {
        const from = new URLSearchParams(location.search).get('from') || '/';
        navigate(from);
      }, 1000);
    } catch (err) {
      console.error('Dev login error:', err);
      setError('Ошибка при использовании тестового входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper 
        elevation={3}
        sx={{
          p: 4,
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
          <LockOutlinedIcon />
        </Avatar>
        
        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
          SolarTrade CRM
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
            {success}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Пароль"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, py: 1 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Войти'}
          </Button>
          
          {isDevMode && (
            <>
              <Divider sx={{ my: 2 }}>
                <Chip 
                  icon={<DeveloperModeIcon />} 
                  label="Режим разработки" 
                  variant="outlined" 
                  color="primary" 
                />
              </Divider>
              
              <Button
                fullWidth
                variant="outlined"
                color="secondary"
                onClick={handleDevLogin}
                disabled={loading}
                sx={{ mb: 1 }}
              >
                Тестовый вход для разработки
              </Button>
              
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
                Это создаст тестовый токен, который работает только в режиме разработки
              </Typography>
            </>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Для демо-доступа: admin@example.com / password123
            </Typography>
          </Box>
        </Box>
      </Paper>
      
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Solar Trade CRM — Система управления клиентами
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          © {new Date().getFullYear()} SolarTrade
        </Typography>
      </Box>
    </Container>
  );
};

export default Login;