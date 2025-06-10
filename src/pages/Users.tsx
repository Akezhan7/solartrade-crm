import React, { useState, useEffect } from 'react';
import { 
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
  FormHelperText
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { User, UserRole } from '../types';
import apiService from '../utils/apiService';

// Карта для отображения ролей пользователей
const userRoleMap: Record<UserRole, { label: string, color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' }> = {
  ADMIN: { label: 'Администратор', color: 'error' },
  MANAGER: { label: 'Менеджер', color: 'primary' },
  SALES: { label: 'Продажи', color: 'success' }
};

const Users: React.FC = (): JSX.Element => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    position: '',
    role: 'MANAGER' as UserRole
  } as {
    name: string;
    email: string;
    password?: string;
    position: string;
    role: UserRole;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  // Загрузка пользователей при монтировании компонента
  useEffect(() => {
    fetchUsers();
  }, []);

  // Получение текущего пользователя для проверки прав доступа
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = currentUser.role === 'ADMIN';

  // Загрузка списка пользователей
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await apiService.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Ошибка при загрузке пользователей:', error);
      setSnackbar({
        open: true,
        message: 'Не удалось загрузить список пользователей',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Открытие диалога для создания нового пользователя
  const handleOpenCreateDialog = () => {
    setEditingUser(null);
    setNewUser({
      name: '',
      email: '',
      password: '',
      position: '',
      role: 'MANAGER'
    });
    setErrors({});
    setOpenDialog(true);
  };

  // Открытие диалога для редактирования пользователя
  const handleOpenEditDialog = (user: User) => {
    setEditingUser(user);
    setNewUser({
      name: user.name,
      email: user.email,
      password: '', // Не заполняем пароль при редактировании
      position: user.position || '',
      role: user.role
    });
    setErrors({});
    setOpenDialog(true);
  };

  // Закрытие диалога
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  // Изменение полей формы для текстовых инпутов
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target as { name: string; value: string };
    setNewUser({
      ...newUser,
      [name]: value
    });
    
    // Очищаем ошибку поля при изменении
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
    // Изменение полей формы для селектов
  const handleSelectChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const name = e.target.name as string;
    const value = e.target.value as UserRole;
    
    setNewUser({
      ...newUser,
      [name]: value
    });
    
    // Очищаем ошибку поля при изменении
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  // Валидация формы
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!newUser.name.trim()) {
      newErrors.name = 'Имя обязательно для заполнения';
    }
    
    if (!newUser.email.trim()) {
      newErrors.email = 'Email обязателен для заполнения';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(newUser.email)) {
      newErrors.email = 'Некорректный формат email';
    }
    
    // Проверяем пароль только при создании нового пользователя
    const password = newUser.password || '';
    if (!editingUser && !password.trim()) {
      newErrors.password = 'Пароль обязателен для заполнения';
    } else if (!editingUser && password.length < 6) {
      newErrors.password = 'Пароль должен содержать не менее 6 символов';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  // Сохранение пользователя (создание или обновление)
  const handleSaveUser = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      if (editingUser) {
        // Обновление существующего пользователя
        // Создаем копию текущих данных пользователя
        const userData = { ...newUser };
        
        // Если пароль пустой, удаляем его из объекта запроса
        if (!userData.password) {
          const { password, ...dataWithoutPassword } = userData;
          await apiService.updateUser(editingUser.id, dataWithoutPassword);
        } else {
          // Иначе отправляем с паролем
          await apiService.updateUser(editingUser.id, userData);
        }
        
        setSnackbar({
          open: true,
          message: 'Пользователь успешно обновлен',
          severity: 'success'
        });
      } else {
        // Создание нового пользователя
        await apiService.createUser(newUser);
        
        setSnackbar({
          open: true,
          message: 'Пользователь успешно создан',
          severity: 'success'
        });
      }
      
      handleCloseDialog();
      fetchUsers(); // Обновляем список пользователей
      
    } catch (error: any) {
      console.error('Ошибка при сохранении пользователя:', error);
      
      // Обрабатываем возможные ошибки от сервера
      if (error.response?.data?.message) {
        if (typeof error.response.data.message === 'string') {
          setSnackbar({
            open: true,
            message: `Ошибка: ${error.response.data.message}`,
            severity: 'error'
          });
        } else if (Array.isArray(error.response.data.message)) {
          // Для случаев, когда возвращается массив ошибок валидации
          setSnackbar({
            open: true,
            message: `Ошибка: ${error.response.data.message[0]}`,
            severity: 'error'
          });
        }
      } else {
        setSnackbar({
          open: true,
          message: 'Произошла ошибка при сохранении пользователя',
          severity: 'error'
        });
      }
    }
  };  // Удаление пользователя
  const handleDeactivateUser = async (user: User) => {
    if (!window.confirm(`Вы уверены, что хотите удалить пользователя ${user.name}?`)) {
      return;
    }
    
    try {
      const response = await apiService.deleteUser(user.id);
      
      let message = 'Пользователь удален';
      if (response.type === 'deactivated') {
        message = 'Пользователь деактивирован (есть связанные записи)';
      } else if (response.type === 'deleted') {
        message = 'Пользователь полностью удален';
      }
      
      setSnackbar({
        open: true,
        message: message,
        severity: 'success'
      });
      
      fetchUsers(); // Обновляем список пользователей
      
    } catch (error) {
      console.error('Ошибка при удалении пользователя:', error);
      setSnackbar({
        open: true,
        message: 'Не удалось удалить пользователя',
        severity: 'error'
      });
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Управление пользователями
      </Typography>
      
      {isAdmin && (
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PersonAddIcon />}
            onClick={handleOpenCreateDialog}
          >
            Добавить пользователя
          </Button>
        </Box>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Имя</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Должность</TableCell>
                <TableCell>Роль</TableCell>
                <TableCell>Статус</TableCell>
                {isAdmin && <TableCell align="right">Действия</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.position || '—'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={userRoleMap[user.role]?.label || user.role} 
                      color={userRoleMap[user.role]?.color || 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={user.isActive ? 'Активен' : 'Неактивен'} 
                      color={user.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  {isAdmin && (
                    <TableCell align="right">
                      <IconButton 
                        color="primary" 
                        onClick={() => handleOpenEditDialog(user)}
                        disabled={!isAdmin}
                      >
                        <EditIcon />
                      </IconButton>                      <IconButton 
                        color="error"
                        onClick={() => handleDeactivateUser(user)}
                        disabled={!isAdmin || user.id === currentUser.id} // Нельзя удалить самого себя
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Диалог создания/редактирования пользователя */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUser ? 'Редактирование пользователя' : 'Создание нового пользователя'}
        </DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            name="name"
            label="Имя пользователя"
            type="text"
            fullWidth
            variant="outlined"
            value={newUser.name}
            onChange={handleInputChange}
            error={!!errors.name}
            helperText={errors.name}
            required
            sx={{ mb: 2, mt: 2 }}
          />
          
          <TextField
            margin="dense"
            name="email"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={newUser.email}
            onChange={handleInputChange}
            error={!!errors.email}
            helperText={errors.email}
            required
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            name="password"
            label={editingUser ? "Новый пароль (оставьте пустым, чтобы не менять)" : "Пароль"}
            type="password"
            fullWidth
            variant="outlined"
            value={newUser.password}
            onChange={handleInputChange}
            error={!!errors.password}
            helperText={errors.password}
            required={!editingUser}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            name="position"
            label="Должность"
            type="text"
            fullWidth
            variant="outlined"
            value={newUser.position}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />            <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Роль</InputLabel>
            <Select<UserRole>
              name="role"
              value={newUser.role}
              label="Роль"
              onChange={(e) => {
                const value = e.target.value as UserRole;
                setNewUser({
                  ...newUser,
                  role: value
                });
                
                // Очищаем ошибку поля при изменении
                if (errors.role) {
                  setErrors({
                    ...errors,
                    role: ''
                  });
                }
              }}
            >
              <MenuItem value="ADMIN">Администратор</MenuItem>
              <MenuItem value="MANAGER">Менеджер</MenuItem>
              <MenuItem value="SALES">Продажи</MenuItem>
            </Select>
            <FormHelperText>
              {newUser.role === 'ADMIN' && 'Полный доступ ко всем функциям системы, включая управление пользователями'}
              {newUser.role === 'MANAGER' && 'Доступ к клиентам, сделкам и задачам'}
              {newUser.role === 'SALES' && 'Базовый уровень доступа к системе'}
            </FormHelperText>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button onClick={handleSaveUser} variant="contained" color="primary">
            {editingUser ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Снэкбар для уведомлений */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Users;
