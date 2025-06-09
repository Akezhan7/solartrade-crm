import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  IconButton, 
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs,
  Card,
  CardContent,
  Chip,
  Stack,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
  Divider,
  useMediaQuery,
  useTheme,
  Autocomplete,
  Fab,
  Badge,
  Avatar,
  Tooltip
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FlagIcon from '@mui/icons-material/Flag';
import { format, isToday, isYesterday, addDays, isBefore, isAfter } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Task, TaskStatus, TaskPriority } from '../types';
import telegramService from '../utils/telegramService';
import apiService from '../utils/apiService';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

// Статусы задач для отображения
const taskStatusMap: Record<TaskStatus, { label: string; color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' }> = {
  NEW: { label: 'Новая', color: 'info' },
  IN_PROGRESS: { label: 'В работе', color: 'warning' },
  COMPLETED: { label: 'Завершена', color: 'success' },
  CANCELLED: { label: 'Отменена', color: 'error' },
  POSTPONED: { label: 'Отложена', color: 'default' }
};

// Приоритеты задач для отображения
const taskPriorityMap: Record<TaskPriority, { label: string; color: string; icon: string }> = {
  LOW: { label: 'Низкий', color: '#2ECC71', icon: '🟢' },
  MEDIUM: { label: 'Средний', color: '#F39C12', icon: '🟠' },
  HIGH: { label: 'Высокий', color: '#E74C3C', icon: '🔴' }
};

// Статусы сделок для отображения
const dealStatusMap: Record<string, { label: string; color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' }> = {
  NEW: { label: 'Новая', color: 'info' },
  NEGOTIATION: { label: 'Переговоры', color: 'primary' },
  PROPOSAL: { label: 'Предложение', color: 'secondary' },
  AGREEMENT: { label: 'Договор', color: 'info' },
  PAID: { label: 'Оплата', color: 'warning' },
  INSTALLATION: { label: 'Монтаж', color: 'warning' },
  COMPLETED: { label: 'Завершена', color: 'success' },
  CANCELLED: { label: 'Отменена', color: 'error' }
};

// Интерфейс для фильтров задач
interface TaskFilters {
  status: TaskStatus | 'ALL';
  assigneeId: string | 'ALL';
  priority: TaskPriority | 'ALL';
}

// Use React.FC without explicit return type
const Tasks = (): JSX.Element => {
  const navigate = useNavigate();
  const { id: taskId } = useParams<{ id: string }>();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isSmallMobile = useMediaQuery('(max-width:360px)');
  
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');  
  const [filters, setFilters] = useState<TaskFilters>({
    status: 'ALL',
    assigneeId: 'ALL',
    priority: 'ALL'
  });
  const [openNewTaskDialog, setOpenNewTaskDialog] = useState(false);
  const [openTaskDetailsDialog, setOpenTaskDetailsDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
    // Состояние для создания/редактирования задачи
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    status: 'NEW' as TaskStatus,
    priority: 'MEDIUM' as TaskPriority,
    dueDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString(), // Завтра
    assigneeId: '',
    clientId: '',
    dealId: ''
  });
  
  // Состояние для отправки уведомления в Telegram
  const [sendNotification, setSendNotification] = useState(true);
    // Состояние для уведомлений
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  // Получение списка задач
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const tasksResponse = await apiService.getTasks();
      setTasks(tasksResponse);
      setLoading(false);
      
      // Если указан ID задачи в URL, открываем диалог с деталями
      if (taskId) {
        const task = tasksResponse.find((t: Task) => t.id === taskId);
        if (task) {
          setSelectedTask(task);
          setOpenTaskDetailsDialog(true);
        }
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setLoading(false);
      setNotification({
        open: true,
        message: 'Ошибка при загрузке задач',
        severity: 'error'
      });
    }
  }, [taskId]);

  // Получение данных при загрузке компонента
  useEffect(() => {
    fetchTasks();
    fetchUsers();
    fetchClients();
    fetchDeals();
  }, [fetchTasks]);
  
  // Получение списка пользователей системы
  const fetchUsers = async () => {
    try {
      const response = await apiService.getUsers();
      setUsers(response);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };
  
  // Получение списка клиентов
  const fetchClients = async () => {
    try {
      const response = await apiService.getClients();
      setClients(response);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };
  
  // Получение списка сделок
  const fetchDeals = async () => {
    try {
      const response = await apiService.getDeals();
      setDeals(response);
    } catch (error) {
      console.error('Error fetching deals:', error);
    }  };
  
  // Изменение вкладки
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Обработка изменения поиска
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  
  // Обработка изменения фильтров
  const handleFilterChange = (field: keyof TaskFilters, value: any) => {
    setFilters({
      ...filters,
      [field]: value
    });
  };
  
  // Обработка изменения формы создания/редактирования задачи
  const handleTaskFormChange = (field: string, value: any) => {
    setTaskForm({
      ...taskForm,
      [field]: value
    });
  };
    // Открытие диалога создания новой задачи
  const handleOpenNewTaskDialog = () => {
    // Сброс формы и установка текущего пользователя как исполнителя по умолчанию
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    setTaskForm({
      title: '',
      description: '',
      status: 'NEW',
      priority: 'MEDIUM',
      dueDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString(), // Завтра
      assigneeId: currentUser.id || '',
      clientId: '',
      dealId: ''
    });
    
    // По умолчанию включаем отправку уведомлений при открытии диалога
    setSendNotification(true);
    
    setOpenNewTaskDialog(true);
  };
  
  // Закрытие диалога создания задачи
  const handleCloseNewTaskDialog = () => {
    setOpenNewTaskDialog(false);
  };
  
  // Создание новой задачи
  const handleCreateTask = async () => {
    if (!taskForm.title || !taskForm.assigneeId || !taskForm.dueDate) {
      setNotification({
        open: true,
        message: 'Пожалуйста, заполните все обязательные поля',
        severity: 'error'
      });
      return;
    }
    
    try {
      await apiService.createTask(taskForm);
      
      // Закрытие диалога
      handleCloseNewTaskDialog();
      
      // Обновление списка задач
      await fetchTasks();      // Отправка уведомления в Telegram, только если включено
      if (sendNotification) {
        try {
          await telegramService.sendNewTaskNotification({
            taskId: 'new', // Временный ID для совместимости
            taskTitle: taskForm.title,
            dueDate: taskForm.dueDate,
            assigneeName: users.find(u => u.id === taskForm.assigneeId)?.name || 'Неизвестный пользователь',
            clientName: taskForm.clientId ? clients.find(c => c.id === taskForm.clientId)?.name || null : null,
            priority: taskForm.priority
          });
        } catch (telegramError) {
          console.warn('Failed to send Telegram notification:', telegramError);
        }
      } else {
        console.log('Telegram notification was disabled by user');
      }
      
      setNotification({
        open: true,
        message: 'Задача успешно создана',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error creating task:', error);
      setNotification({
        open: true,
        message: 'Ошибка при создании задачи',
        severity: 'error'
      });
    }
  };
  
  // Открытие диалога с деталями задачи
  const handleOpenTaskDetails = (task: Task) => {
    setSelectedTask(task);
    setOpenTaskDetailsDialog(true);
    
    // Обновляем URL без перезагрузки страницы
    navigate(`/tasks/${task.id}`, { replace: true });
  };
  
  // Закрытие диалога с деталями задачи
  const handleCloseTaskDetails = () => {
    setOpenTaskDetailsDialog(false);
    setSelectedTask(null);
    
    // Возвращаем URL к списку задач
    navigate('/tasks', { replace: true });
  };
  
  // Обработка изменения статуса задачи
  const handleChangeTaskStatus = async (task: Task, newStatus: TaskStatus) => {
    try {
      await apiService.updateTask(task.id, { status: newStatus });
      
      // Обновление списка задач
      await fetchTasks();
      
      // Закрытие диалога с деталями
      handleCloseTaskDetails();
      
      setNotification({
        open: true,
        message: 'Статус задачи изменен',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      setNotification({
        open: true,
        message: 'Ошибка при изменении статуса задачи',
        severity: 'error'
      });
    }
  };
  
  // Форматирование даты для отображения
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isToday(date)) {
        return 'Сегодня, ' + format(date, 'HH:mm', { locale: ru });
      } else if (isYesterday(date)) {
        return 'Вчера, ' + format(date, 'HH:mm', { locale: ru });
      } else if (isAfter(date, new Date()) && isBefore(date, addDays(new Date(), 7))) {
        return format(date, 'EEEE, HH:mm', { locale: ru });
      } else {
        return format(date, 'dd MMMM, HH:mm', { locale: ru });
      }
    } catch (e) {
      return 'Неизвестная дата';
    }
  };
  
  // Фильтрация задач
  const getFilteredTasks = () => {
    let filteredTasks = [...tasks];
    
    // Фильтрация по поисковому запросу
    if (searchTerm.trim() !== '') {
      const search = searchTerm.toLowerCase();
      filteredTasks = filteredTasks.filter(task => 
        task.title.toLowerCase().includes(search) || 
        (task.description && task.description.toLowerCase().includes(search)) ||
        (task.clientName && task.clientName.toLowerCase().includes(search))
      );
    }
    
    // Фильтрация по статусу
    if (filters.status !== 'ALL') {
      filteredTasks = filteredTasks.filter(task => task.status === filters.status);
    }
    
    // Фильтрация по исполнителю
    if (filters.assigneeId !== 'ALL') {
      filteredTasks = filteredTasks.filter(task => task.assigneeId === filters.assigneeId);
    }
    
    // Фильтрация по приоритету
    if (filters.priority !== 'ALL') {
      filteredTasks = filteredTasks.filter(task => task.priority === filters.priority);
    }
    
    // Сортировка по вкладкам
    switch (tabValue) {
      case 0: // Все задачи
        break;
      case 1: // Мои задачи
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        filteredTasks = filteredTasks.filter(task => task.assigneeId === currentUser.id);
        break;
      case 2: // Просроченные
        filteredTasks = filteredTasks.filter(task => 
          task.status !== 'COMPLETED' && 
          task.status !== 'CANCELLED' &&
          new Date(task.dueDate) < new Date()
        );
        break;
      case 3: // На сегодня
        filteredTasks = filteredTasks.filter(task => 
          task.status !== 'COMPLETED' && 
          task.status !== 'CANCELLED' &&
          isToday(new Date(task.dueDate))
        );
        break;
      case 4: // Выполненные
        filteredTasks = filteredTasks.filter(task => task.status === 'COMPLETED');
        break;
    }
    
    return filteredTasks;
  };
  
  // Получение отфильтрованных задач
  const filteredTasks = getFilteredTasks();
  
  // Закрытие уведомления
  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };

  return (
    <Box sx={{ maxWidth: '100%', overflow: 'hidden' }}>
      {/* Заголовок страницы */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2,
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 2 : 0
        }}
      >
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 500,
            fontSize: { xs: '1.5rem', sm: '1.8rem' } 
          }}
        >
          Задачи
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, width: isMobile ? '100%' : 'auto' }}>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={() => setShowFilters(!showFilters)}
            startIcon={<FilterListIcon />}
            sx={{
              display: { xs: 'none', sm: 'flex' }
            }}
          >
            Фильтры
          </Button>
          {isMobile && (
            <IconButton onClick={() => setShowFilters(!showFilters)} color="primary">
              <FilterListIcon />
            </IconButton>
          )}
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={isMobile ? null : <AddIcon />}
            onClick={handleOpenNewTaskDialog}
            sx={{ 
              flexGrow: isMobile ? 1 : 0,
              minWidth: isSmallMobile ? 'initial' : '150px',
              px: isSmallMobile ? 1 : 2
            }}
          >
            {isMobile ? <AddIcon /> : 'Новая задача'}
          </Button>
        </Box>
      </Box>

      {/* Поиск */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Поиск по названию, описанию или клиенту..."
          variant="outlined"
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          size={isMobile ? "small" : "medium"}
        />
      </Box>

      {/* Фильтры */}
      {showFilters && (
        <Paper sx={{ mb: 2, p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Фильтры задач
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                <InputLabel id="status-filter-label">Статус</InputLabel>
                <Select
                  labelId="status-filter-label"
                  id="status-filter"
                  value={filters.status}
                  label="Статус"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="ALL">Все статусы</MenuItem>
                  {Object.entries(taskStatusMap).map(([status, info]) => (
                    <MenuItem key={status} value={status}>
                      <Chip 
                        label={info.label}
                        size="small"
                        color={info.color}
                        sx={{ mr: 1 }}
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                <InputLabel id="assignee-filter-label">Исполнитель</InputLabel>
                <Select
                  labelId="assignee-filter-label"
                  id="assignee-filter"
                  value={filters.assigneeId}
                  label="Исполнитель"
                  onChange={(e) => handleFilterChange('assigneeId', e.target.value)}
                >
                  <MenuItem value="ALL">Все исполнители</MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>{user.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                <InputLabel id="priority-filter-label">Приоритет</InputLabel>
                <Select
                  labelId="priority-filter-label"
                  id="priority-filter"
                  value={filters.priority}
                  label="Приоритет"
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                >
                  <MenuItem value="ALL">Все приоритеты</MenuItem>
                  {Object.entries(taskPriorityMap).map(([priority, info]) => (
                    <MenuItem key={priority} value={priority}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box 
                          sx={{ 
                            width: 12, 
                            height: 12, 
                            borderRadius: '50%', 
                            bgcolor: info.color,
                            mr: 1
                          }} 
                        />
                        {info.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Вкладки */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : false}
          allowScrollButtonsMobile
          aria-label="task tabs"
          sx={{
            '.MuiTab-root': {
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              textTransform: 'none',
              minWidth: isMobile ? '80px' : '120px'
            }
          }}
        >
          <Tab label="Все задачи" />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography component="span">Мои задачи</Typography>
                {isMobile ? null : (
                  <Badge style={{ marginLeft: 18 }}
                    badgeContent={tasks.filter(task => {
                      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                      return task.assigneeId === currentUser.id && task.status !== 'COMPLETED' && task.status !== 'CANCELLED';
                    }).length} 
                    color="error" 
                    sx={{ ml: 1 }}
                  >
                    <Box />
                  </Badge>
                )}
              </Box>
            }
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography component="span">Просроченные</Typography>
                {isMobile ? null : (
                  <Badge 
                    badgeContent={tasks.filter(task => 
                      task.status !== 'COMPLETED' && 
                      task.status !== 'CANCELLED' &&
                      new Date(task.dueDate) < new Date()
                    ).length} 
                    color="error" 
                    sx={{ ml: 1 }}
                  >
                    <Box />
                  </Badge>
                )}
              </Box>
            } 
          />
          <Tab label="На сегодня" />
          <Tab label="Выполненные" />
        </Tabs>
      </Box>

      {/* Список задач */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {filteredTasks.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="textSecondary">
                Задачи не найдены
              </Typography>
              <Button 
                startIcon={<AddIcon />} 
                variant="outlined" 
                color="primary" 
                onClick={handleOpenNewTaskDialog}
                sx={{ mt: 2 }}
              >
                Создать новую задачу
              </Button>
            </Paper>
          ) : (
            <>
              {isMobile ? (
                // Мобильный вид - карточки
                <Box sx={{ p: 0 }}>
                  <Stack spacing={2}>
                    {filteredTasks.map((task) => {
                      const statusInfo = taskStatusMap[task.status];
                      const priorityInfo = taskPriorityMap[task.priority];
                      const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED' && task.status !== 'CANCELLED';
                      
                      return (
                        <Card 
                          key={task.id} 
                          sx={{ 
                            borderRadius: '8px',
                            boxShadow: isOverdue ? `0 0 0 2px ${theme.palette.error.main}` : 'none'
                          }}
                          onClick={() => handleOpenTaskDetails(task)}
                        >
                          <CardContent sx={{ p: '14px' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography 
                                variant="body1" 
                                sx={{ 
                                  fontWeight: 500, 
                                  fontSize: '1rem',
                                  mb: 1,
                                  width: '70%',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                              >
                                {task.title}
                              </Typography>
                              <Box>
                                <Tooltip title={priorityInfo.label}>
                                  <Box 
                                    sx={{ 
                                      width: 10,
                                      height: 10,
                                      borderRadius: '50%',
                                      backgroundColor: priorityInfo.color,
                                      display: 'inline-block'
                                    }} 
                                  />
                                </Tooltip>
                              </Box>
                            </Box>
                            
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                              <Chip 
                                label={statusInfo.label} 
                                size="small" 
                                color={statusInfo.color} 
                                variant="outlined"
                                sx={{ height: 22 }}
                              />
                              <Chip 
                                icon={<CalendarTodayIcon sx={{ fontSize: '0.8rem' }} />}
                                label={formatDate(task.dueDate)}
                                size="small"
                                variant="outlined"
                                color={isOverdue ? "error" : "default"}
                                sx={{ height: 22, fontSize: '0.75rem' }}
                              />
                            </Box>
                            
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              {task.clientName ? (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Avatar 
                                    sx={{ 
                                      width: 24, 
                                      height: 24, 
                                      mr: 1, 
                                      bgcolor: theme.palette.primary.main,
                                      fontSize: '0.75rem'
                                    }}
                                  >
                                    {task.clientName.charAt(0)}
                                  </Avatar>
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      color: 'text.secondary',
                                      fontSize: '0.75rem',
                                      maxWidth: '130px',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis'
                                    }}
                                  >
                                    {task.clientName}
                                  </Typography>
                                </Box>
                              ) : (
                                <Box />
                              )}
                              
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: 'text.secondary',
                                  fontSize: '0.75rem',
                                  fontStyle: 'italic'
                                }}
                              >
                                {task.assigneeName}
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Stack>
                </Box>
              ) : (
                // Десктопный вид - таблица и карточки
                <Grid container spacing={2}>
                  {filteredTasks.map((task) => {
                    const statusInfo = taskStatusMap[task.status];
                    const priorityInfo = taskPriorityMap[task.priority];
                    const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED' && task.status !== 'CANCELLED';
                    
                    return (
                      <Grid item xs={12} sm={6} md={4} lg={4} key={task.id}>
                        <Card 
                          sx={{ 
                            height: '100%', 
                            cursor: 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            '&:hover': {
                              transform: 'translateY(-3px)',
                              boxShadow: 3
                            },
                            borderLeft: `4px solid ${priorityInfo.color}`,
                            boxShadow: isOverdue ? `0 0 0 1px ${theme.palette.error.main}` : 'none'
                          }}
                          onClick={() => handleOpenTaskDetails(task)}
                        >
                          <CardContent sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 500 }}>
                                {task.title}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Tooltip title={priorityInfo.label}>
                                  <Box 
                                    sx={{ 
                                      width: 12,
                                      height: 12,
                                      borderRadius: '50%',
                                      backgroundColor: priorityInfo.color
                                    }} 
                                  />
                                </Tooltip>
                              </Box>
                            </Box>
                            
                            <Divider sx={{ my: 1 }} />
                            
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
                              <Chip 
                                label={statusInfo.label} 
                                size="small" 
                                color={statusInfo.color} 
                                variant="outlined"
                              />
                              <Chip 
                                icon={<CalendarTodayIcon fontSize="small" />}
                                label={formatDate(task.dueDate)}
                                size="small"
                                variant="outlined"
                                color={isOverdue ? "error" : "default"}
                              />
                            </Box>
                            
                            {task.description && (
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  mb: 1.5,
                                  color: 'text.secondary',
                                  display: '-webkit-box',
                                  overflow: 'hidden',
                                  WebkitBoxOrient: 'vertical',
                                  WebkitLineClamp: 2,
                                  height: '40px'
                                }}
                              >
                                {task.description}
                              </Typography>
                            )}
                            
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              {task.clientName ? (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Avatar 
                                    sx={{ 
                                      width: 24, 
                                      height: 24, 
                                      mr: 1, 
                                      bgcolor: theme.palette.primary.main,
                                      fontSize: '0.75rem'
                                    }}
                                  >
                                    {task.clientName.charAt(0)}
                                  </Avatar>
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      color: 'text.secondary',
                                      maxWidth: '130px',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis'
                                    }}
                                  >
                                    {task.clientName}
                                  </Typography>
                                </Box>
                              ) : (
                                <Box />
                              )}
                              
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: 'text.secondary',
                                  fontStyle: 'italic'
                                }}
                              >
                                {task.assigneeName}
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </>
          )}
        </>
      )}
      
      {/* Плавающая кнопка для создания задачи на мобильных */}
      {isMobile && (
        <Fab 
          color="primary" 
          aria-label="Новая задача" 
          onClick={handleOpenNewTaskDialog}
          sx={{ 
            position: 'fixed', 
            bottom: 16, 
            right: 16,
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Диалог создания новой задачи */}
      <Dialog 
        open={openNewTaskDialog} 
        onClose={handleCloseNewTaskDialog} 
        maxWidth="md" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          {isMobile ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton 
                edge="start" 
                color="inherit" 
                onClick={handleCloseNewTaskDialog}
                sx={{ mr: 1 }}
              >
                <ChevronLeftIcon />
              </IconButton>
              <Typography variant="h6">Новая задача</Typography>
            </Box>
          ) : (
            "Создание новой задачи"
          )}
        </DialogTitle>
        <DialogContent dividers sx={{ p: isMobile ? 2 : 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Название задачи"
                variant="outlined"
                fullWidth
                required
                value={taskForm.title}
                onChange={(e) => handleTaskFormChange('title', e.target.value)}
                autoFocus={!isMobile}
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Описание"
                variant="outlined"
                fullWidth
                multiline
                rows={3}
                value={taskForm.description}
                onChange={(e) => handleTaskFormChange('description', e.target.value)}
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required size={isMobile ? "small" : "medium"}>
                <InputLabel id="priority-label">Приоритет</InputLabel>
                <Select
                  labelId="priority-label"
                  id="priority"
                  value={taskForm.priority}
                  label="Приоритет"
                  onChange={(e) => handleTaskFormChange('priority', e.target.value)}
                >
                  {Object.entries(taskPriorityMap).map(([priority, info]) => (
                    <MenuItem key={priority} value={priority}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box 
                          sx={{ 
                            width: 12, 
                            height: 12, 
                            borderRadius: '50%', 
                            bgcolor: info.color,
                            mr: 1
                          }} 
                        />
                        {info.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required size={isMobile ? "small" : "medium"}>
                <InputLabel id="status-label">Статус</InputLabel>
                <Select
                  labelId="status-label"
                  id="status"
                  value={taskForm.status}
                  label="Статус"
                  onChange={(e) => handleTaskFormChange('status', e.target.value)}
                >
                  {Object.entries(taskStatusMap).map(([status, info]) => (
                    <MenuItem key={status} value={status}>
                      {info.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required size={isMobile ? "small" : "medium"}>
                <DateTimePicker 
                  label="Срок выполнения"
                  value={new Date(taskForm.dueDate)}
                  onChange={(newValue) => {
                    if (newValue) {
                      handleTaskFormChange('dueDate', newValue.toISOString());
                    }
                  }}
                  slotProps={{ textField: { size: isMobile ? "small" : "medium" } }}
                />
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required size={isMobile ? "small" : "medium"}>
                <InputLabel id="assignee-label">Исполнитель</InputLabel>
                <Select
                  labelId="assignee-label"
                  id="assignee"
                  value={taskForm.assigneeId}
                  label="Исполнитель"
                  onChange={(e) => handleTaskFormChange('assigneeId', e.target.value)}
                >
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>{user.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
              <Grid item xs={12} sm={6}>              <Autocomplete
                id="client-select"
                options={clients}
                getOptionLabel={(option) => option.name || ''}
                value={clients.find(client => client.id === taskForm.clientId) || null}
                onChange={(_, newValue) => {
                  handleTaskFormChange('clientId', newValue?.id || '');
                  // Сбросить выбранную сделку, если изменился клиент
                  if (taskForm.dealId && taskForm.dealId !== '') {
                    handleTaskFormChange('dealId', '');
                  }
                }}
                clearOnBlur={false}
                clearOnEscape
                filterOptions={(options, state) => {
                  // Фильтрация по частичному совпадению в имени, телефоне или email
                  const inputValue = state.inputValue.toLowerCase().trim();
                  return options.filter(client => 
                    client.id === '' || // Всегда включать "Нет клиента"
                    client.name.toLowerCase().includes(inputValue) || 
                    (client.phone && client.phone.toLowerCase().includes(inputValue)) ||
                    (client.email && client.email.toLowerCase().includes(inputValue))
                  );
                }}                renderOption={(props, option) => (
                  <li {...props}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong>{option.name}</strong>
                      <small>
                        {option.phone && `Тел: ${option.phone}`}
                        {option.email && option.phone && ' | '}
                        {option.email && `Email: ${option.email}`}
                      </small>
                    </div>
                  </li>
                )}                renderInput={(params) => <TextField 
                  {...params} 
                  label="Клиент" 
                  variant="outlined" 
                  size={isMobile ? "small" : "medium"}
                  placeholder="Выберите клиента"
                />}
              />
            </Grid>
              <Grid item xs={12} sm={6}>              <Autocomplete
                id="deal-select"
                options={deals.filter(deal => !taskForm.clientId || deal.clientId === taskForm.clientId)}
                getOptionLabel={(option) => option.title || ''}
                value={deals.find(deal => deal.id === taskForm.dealId) || null}
                onChange={(_, newValue) => {
                  handleTaskFormChange('dealId', newValue?.id || '');
                }}
                disabled={!taskForm.clientId} // Деактивировано, если не выбран клиент
                clearOnBlur={false}
                clearOnEscape
                filterOptions={(options, state) => {
                  // Фильтрация по частичному совпадению в названии и описании
                  const inputValue = state.inputValue.toLowerCase().trim();
                  return options.filter(deal => 
                    deal.id === '' || // Всегда включать "Нет сделки"
                    deal.title.toLowerCase().includes(inputValue) ||
                    (deal.description && deal.description.toLowerCase().includes(inputValue))
                  );
                }}                renderOption={(props, option) => (
                  <li {...props}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong>{option.title}</strong>
                      {option.amount && (
                        <small>
                          {new Intl.NumberFormat('ru-RU', {
                            style: 'currency',
                            currency: 'RUB',
                            maximumFractionDigits: 0
                          }).format(option.amount)}
                          {option.status && ` • ${dealStatusMap[option.status]?.label || option.status}`}
                        </small>
                      )}
                    </div>
                  </li>
                )}                renderInput={(params) => <TextField 
                  {...params} 
                  label="Сделка" 
                  variant="outlined" 
                  size={isMobile ? "small" : "medium"}
                  placeholder={taskForm.clientId ? "Выберите сделку" : ""}
                  helperText={!taskForm.clientId ? "Сначала выберите клиента" : ""}
                />}
              />
            </Grid>
            
            <Grid item xs={12}>              <FormControlLabel
                control={
                  <Switch 
                    checked={sendNotification} 
                    onChange={(e) => setSendNotification(e.target.checked)}
                    color="primary"
                  />
                }
                label="Отправить уведомление в Telegram"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseNewTaskDialog}>Отмена</Button>
          <Button 
            onClick={handleCreateTask}
            variant="contained" 
            color="primary"
            disabled={!taskForm.title || !taskForm.assigneeId}
          >
            Создать
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Диалог с деталями задачи */}
      {selectedTask && (
        <Dialog 
          open={openTaskDetailsDialog} 
          onClose={handleCloseTaskDetails} 
          maxWidth="md" 
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle>
            {isMobile ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton 
                  edge="start" 
                  color="inherit" 
                  onClick={handleCloseTaskDetails}
                  sx={{ mr: 1 }}
                >
                  <ChevronLeftIcon />
                </IconButton>
                <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
                  {selectedTask.title}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">{selectedTask.title}</Typography>
                <Box>
                  <Chip 
                    label={taskStatusMap[selectedTask.status].label}
                    color={taskStatusMap[selectedTask.status].color}
                    variant="outlined"
                    size="small"
                  />
                </Box>
              </Box>
            )}
          </DialogTitle>
          <DialogContent dividers sx={{ p: isMobile ? 2 : 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <FlagIcon sx={{ color: taskPriorityMap[selectedTask.priority].color, mr: 1 }} />
                  <Typography variant="body2">
                    Приоритет: <strong>{taskPriorityMap[selectedTask.priority].label}</strong>
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AccessTimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    Срок: <strong>{formatDate(selectedTask.dueDate)}</strong>
                    {new Date(selectedTask.dueDate) < new Date() && 
                     selectedTask.status !== 'COMPLETED' && 
                     selectedTask.status !== 'CANCELLED' && (
                      <Chip 
                        label="Просрочено" 
                        size="small" 
                        color="error" 
                        sx={{ ml: 1 }} 
                      />
                    )}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    Исполнитель: <strong>{selectedTask.assigneeName}</strong>
                  </Typography>
                </Box>
                
                {selectedTask.description && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Описание:
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 1.5 }}>
                      <Typography variant="body2">
                        {selectedTask.description}
                      </Typography>
                    </Paper>
                  </Box>
                )}
                
                <Divider sx={{ my: 2 }} />
                
                <Grid container spacing={2}>
                  {selectedTask.clientName && (
                    <Grid item xs={12} sm={6}>
                      <Paper variant="outlined" sx={{ p: 1.5 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Клиент:
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            sx={{ 
                              width: 24, 
                              height: 24, 
                              bgcolor: theme.palette.primary.main,
                              fontSize: '0.75rem',
                              mr: 1 
                            }}
                          >
                            {selectedTask.clientName.charAt(0)}
                          </Avatar>
                          <Typography variant="body2">
                            {selectedTask.clientName}
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                  )}
                  
                  {selectedTask.dealName && (
                    <Grid item xs={12} sm={6}>
                      <Paper variant="outlined" sx={{ p: 1.5 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Сделка:
                        </Typography>
                        <Typography variant="body2">
                          {selectedTask.dealName}
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            {selectedTask.status !== 'CANCELLED' && selectedTask.status !== 'COMPLETED' && (
              <>
                <Button 
                  onClick={() => handleChangeTaskStatus(selectedTask, 'COMPLETED')}
                  color="success"
                  variant="outlined"
                  sx={{ mr: 'auto' }}
                >
                  Завершить
                </Button>
                
                <Button 
                  onClick={() => handleChangeTaskStatus(selectedTask, 'CANCELLED')}
                  color="error"
                  variant="outlined"
                >
                  Отменить
                </Button>
              </>
            )}
            
            <Button 
              onClick={handleCloseTaskDetails}
              variant={selectedTask.status === 'CANCELLED' || selectedTask.status === 'COMPLETED' ? "contained" : "outlined"}
              color="primary"
            >
              {selectedTask.status === 'CANCELLED' || selectedTask.status === 'COMPLETED' ? 'Закрыть' : 'Назад'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
      
      {/* Уведомления (снекбар) */}
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity} 
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Tasks;
