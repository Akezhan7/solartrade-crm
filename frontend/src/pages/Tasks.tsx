import React, { useState, useEffect } from 'react';
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
  useTheme
} from '@mui/material';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Task, TaskStatus, TaskPriority } from '../types';
import telegramService from '../utils/telegramService';
import apiService from '../utils/apiService';

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

// Интерфейс для фильтров задач
interface TaskFilters {
  status: TaskStatus | 'ALL';
  assigneeId: string | 'ALL';
  priority: TaskPriority | 'ALL';
}

const Tasks: React.FC = () => {
  const navigate = useNavigate();
  const { id: taskId } = useParams<{ id: string }>();
  const location = useLocation();
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
  
  // Состояние для уведомлений
  const [sendTelegramNotification, setSendTelegramNotification] = useState(true);
  const [notificationSnackbar, setNotificationSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });
  // Форма создания новой задачи
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'MEDIUM' as TaskPriority,
    assigneeId: '',
    clientId: '',
    clientName: '',
    dealId: '',
    dealName: ''
  });
  
  // Состояние для пользователей
  const [users, setUsers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  
  // Загрузка данных при монтировании компонента
  useEffect(() => {
    fetchTasksAndUsers();
  }, [taskId]);

  const fetchTasksAndUsers = async () => {
    setLoading(true);
    try {
      // Загрузка задач
      const tasksResponse = await apiService.getTasks();
      setTasks(tasksResponse);
      
      // Загрузка пользователей
      const usersResponse = await apiService.getUsers();
      setUsers(usersResponse);
      
      // Загрузка клиентов
      const clientsResponse = await apiService.getClients();
      setClients(clientsResponse);
      
      // Загрузка сделок
      const dealsResponse = await apiService.getDeals();
      setDeals(dealsResponse);

      // Если есть идентификатор задачи в URL и это страница просмотра задачи
      if (taskId) {
        try {
          const taskResponse = await apiService.getTaskById(taskId);
          setSelectedTask(taskResponse);
          setOpenTaskDetailsDialog(true);
        } catch (taskError) {
          console.error('Error fetching task details:', taskError);
          // Если задача не найдена, перенаправляем на страницу со списком задач
          navigate('/tasks');
        }
      }
      
      setLoading(false);
      
      // Запускаем проверку приближающихся сроков
      checkUpcomingDeadlines();
    } catch (error: any) {
      console.error('Error fetching data:', error);
      
      // Показываем ошибку пользователю
      setNotificationSnackbar({
        open: true,
        message: 'Ошибка загрузки данных. Пожалуйста, проверьте подключение к серверу.',
        severity: 'error'
      });
      
      setLoading(false);
    }
  };

  // Проверка приближающихся сроков
  const checkUpcomingDeadlines = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const upcomingTasks = tasks.filter(task => {
      if (task.status === 'COMPLETED' || task.status === 'CANCELLED') {
        return false;
      }
      
      const dueDate = new Date(task.dueDate);
      return dueDate <= tomorrow && dueDate >= now;
    });
    
    if (upcomingTasks.length > 0) {
      setNotificationSnackbar({
        open: true,
        message: `Внимание! У вас ${upcomingTasks.length} задач(и) со сроком выполнения в ближайшие 24 часа.`,
        severity: 'warning'
      });
    }
  };

  // Обработчик создания новой задачи
  const handleCreateTask = async () => {
    try {
      // Проверка обязательных полей
      if (!newTask.title || !newTask.dueDate || !newTask.assigneeId) {
        setNotificationSnackbar({
          open: true,
          message: 'Пожалуйста, заполните все обязательные поля.',
          severity: 'error'
        });
        return;
      }

      const taskData = {
        title: newTask.title,
        description: newTask.description,
        dueDate: newTask.dueDate,
        priority: newTask.priority,
        assigneeId: newTask.assigneeId,
        clientId: newTask.clientId || null,
        dealId: newTask.dealId || null
      };

      // Отправка запроса на создание задачи
      const createdTask = await apiService.createTask(taskData);
      
      // Обновляем список задач
      setTasks([...tasks, createdTask]);
        // Отправляем уведомление в Telegram, если включено
      if (sendTelegramNotification) {
        try {
          await telegramService.sendNewTaskNotification({
            taskId: createdTask.id,
            taskTitle: createdTask.title,
            dueDate: createdTask.dueDate,
            assigneeName: users.find(user => user.id === createdTask.assigneeId)?.name || createdTask.assigneeId,
            clientName: createdTask.clientName,
            priority: createdTask.priority
          });
        } catch (telegramError) {
          console.error('Error sending Telegram notification:', telegramError);
        }
      }
      
      // Закрываем диалог и очищаем форму
      setOpenNewTaskDialog(false);
      setNewTask({
        title: '',
        description: '',
        dueDate: '',
        priority: 'MEDIUM',
        assigneeId: '',
        clientId: '',
        clientName: '',
        dealId: '',
        dealName: ''
      });
      
      // Показываем уведомление об успешном создании
      setNotificationSnackbar({
        open: true,
        message: 'Задача успешно создана!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error creating task:', error);
      setNotificationSnackbar({
        open: true,
        message: 'Ошибка при создании задачи.',
        severity: 'error'
      });
    }
  };

  // Обработчик обновления статуса задачи
  const handleUpdateTaskStatus = async (id: string, newStatus: TaskStatus) => {
    try {
      const updatedTask = await apiService.updateTask(id, { status: newStatus });
      
      // Обновляем задачу в списке
      setTasks(tasks.map(task => task.id === id ? updatedTask : task));
      
      // Если задача выбрана, обновляем ее
      if (selectedTask && selectedTask.id === id) {
        setSelectedTask(updatedTask);
      }
      
      setNotificationSnackbar({
        open: true,
        message: 'Статус задачи обновлен.',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      setNotificationSnackbar({
        open: true,
        message: 'Ошибка при обновлении статуса задачи.',
        severity: 'error'
      });
    }
  };

  // Обработчик удаления задачи
  const handleDeleteTask = async (id: string) => {
    try {
      await apiService.deleteTask(id);
      
      // Удаляем задачу из списка
      setTasks(tasks.filter(task => task.id !== id));
      
      // Если удаляем выбранную задачу, закрываем диалог
      if (selectedTask && selectedTask.id === id) {
        setSelectedTask(null);
        setOpenTaskDetailsDialog(false);
      }
      
      setNotificationSnackbar({
        open: true,
        message: 'Задача успешно удалена.',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      setNotificationSnackbar({
        open: true,
        message: 'Ошибка при удалении задачи.',
        severity: 'error'
      });
    }
  };

  // Фильтрация задач
  const filteredTasks = tasks.filter(task => {
    // Фильтр по поиску
    const matchesSearch = 
      !searchTerm || 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Фильтр по статусу
    const matchesStatus = filters.status === 'ALL' || task.status === filters.status;
    
    // Фильтр по исполнителю
    const matchesAssignee = filters.assigneeId === 'ALL' || task.assigneeId === filters.assigneeId;
    
    // Фильтр по приоритету
    const matchesPriority = filters.priority === 'ALL' || task.priority === filters.priority;
    
    return matchesSearch && matchesStatus && matchesAssignee && matchesPriority;
  });

  // Определяем активные задачи для дашборда
  const activeTasks = tasks.filter(task => 
    task.status !== 'COMPLETED' && task.status !== 'CANCELLED'
  );

  // Закрытие диалогов
  const handleCloseDialogs = () => {
    setOpenNewTaskDialog(false);
    setOpenTaskDetailsDialog(false);
    setSelectedTask(null);
    
    // Если был открыт диалог задачи через URL, обновляем URL
    if (taskId) {
      navigate('/tasks');
    }
  };

  // Открытие диалога создания задачи
  const handleOpenNewTaskDialog = () => {
    setOpenNewTaskDialog(true);
  };

  // Открытие диалога просмотра задачи
  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setOpenTaskDetailsDialog(true);
    
    // Обновляем URL для возможности прямого перехода
    navigate(`/tasks/${task.id}`);
  };

  // Обработка изменения значения в форме новой задачи
  const handleNewTaskChange = (field: string, value: any) => {
    setNewTask({
      ...newTask,
      [field]: value
    });
  };

  // Отображение компонента
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Задачи
      </Typography>
      
      {/* Показываем индикатор загрузки при загрузке данных */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Инструменты управления */}
          <Box sx={{ mb: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}>
            <TextField
              label="Поиск задач"
              variant="outlined"
              size="small"
              fullWidth={isMobile}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1, maxWidth: { sm: 300 } }}
            />
            
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenNewTaskDialog}
              sx={{ whiteSpace: 'nowrap' }}
            >
              {isSmallMobile ? 'Новая' : 'Новая задача'}
            </Button>
          </Box>
          
          {/* Статистика и фильтры */}
          <Paper sx={{ mb: 3, p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {activeTasks.length} активных задач
            </Typography>
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Статус</InputLabel>
                  <Select
                    label="Статус"
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value as TaskStatus | 'ALL' })}
                  >
                    <MenuItem value="ALL">Все статусы</MenuItem>
                    {Object.keys(taskStatusMap).map((status) => (
                      <MenuItem key={status} value={status}>
                        {taskStatusMap[status as TaskStatus].label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Исполнитель</InputLabel>
                  <Select
                    label="Исполнитель"
                    value={filters.assigneeId}
                    onChange={(e) => setFilters({ ...filters, assigneeId: e.target.value as string })}
                  >
                    <MenuItem value="ALL">Все исполнители</MenuItem>
                    {users.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Приоритет</InputLabel>
                  <Select
                    label="Приоритет"
                    value={filters.priority}
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value as TaskPriority | 'ALL' })}
                  >
                    <MenuItem value="ALL">Все приоритеты</MenuItem>
                    {Object.keys(taskPriorityMap).map((priority) => (
                      <MenuItem key={priority} value={priority}>
                        {taskPriorityMap[priority as TaskPriority].icon} {taskPriorityMap[priority as TaskPriority].label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Список задач */}
          {filteredTasks.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">
                Нет задач, соответствующих указанным критериям
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {filteredTasks.map((task) => (
                <Grid item xs={12} sm={6} md={4} key={task.id}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': {
                        boxShadow: 6
                      }
                    }}
                    onClick={() => handleViewTask(task)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="h6" sx={{ wordBreak: 'break-word' }}>
                          {task.title}
                        </Typography>
                        <Chip 
                          label={taskStatusMap[task.status].label} 
                          color={taskStatusMap[task.status].color}
                          size="small" 
                        />
                      </Box>
                      
                      <Typography variant="caption" display="block" color="text.secondary">
                        Срок: {format(new Date(task.dueDate), 'dd MMMM yyyy', { locale: ru })}
                      </Typography>
                      
                      <Typography variant="caption" display="block" color="text.secondary">
                        Исполнитель: {users.find(user => user.id === task.assigneeId)?.name || task.assigneeId}
                      </Typography>
                      
                      <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                        <Box 
                          component="span" 
                          sx={{ 
                            width: 10, 
                            height: 10, 
                            borderRadius: '50%', 
                            backgroundColor: taskPriorityMap[task.priority].color,
                            display: 'inline-block',
                            mr: 1
                          }}
                        />
                        <Typography variant="caption">
                          {taskPriorityMap[task.priority].label} приоритет
                        </Typography>
                      </Box>
                      
                      {task.description && (
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            mt: 1, 
                            opacity: 0.8,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {task.description}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
          
          {/* Диалог создания новой задачи */}
          <Dialog open={openNewTaskDialog} onClose={handleCloseDialogs} maxWidth="md" fullWidth>
            <DialogTitle>Создание новой задачи</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    label="Название задачи"
                    variant="outlined"
                    fullWidth
                    required
                    value={newTask.title}
                    onChange={(e) => handleNewTaskChange('title', e.target.value)}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Описание"
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={4}
                    value={newTask.description}
                    onChange={(e) => handleNewTaskChange('description', e.target.value)}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Срок выполнения"
                    variant="outlined"
                    fullWidth
                    required
                    type="datetime-local"
                    value={newTask.dueDate}
                    onChange={(e) => handleNewTaskChange('dueDate', e.target.value)}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Приоритет</InputLabel>
                    <Select
                      label="Приоритет"
                      value={newTask.priority}
                      onChange={(e) => handleNewTaskChange('priority', e.target.value)}
                    >
                      {Object.keys(taskPriorityMap).map((priority) => (
                        <MenuItem key={priority} value={priority}>
                          {taskPriorityMap[priority as TaskPriority].icon} {taskPriorityMap[priority as TaskPriority].label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Исполнитель</InputLabel>
                    <Select
                      label="Исполнитель"
                      value={newTask.assigneeId}
                      onChange={(e) => handleNewTaskChange('assigneeId', e.target.value)}
                    >
                      {users.map((user) => (
                        <MenuItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Клиент</InputLabel>
                    <Select
                      label="Клиент"
                      value={newTask.clientId}                      onChange={(e) => {
                        const clientId = e.target.value;
                        const selectedClient = clients.find(client => client.id === clientId);
                        handleNewTaskChange('clientId', clientId);
                        handleNewTaskChange('clientName', selectedClient ? selectedClient.name : '');
                        
                        // Проверяем, нужно ли сбросить сделку
                        if (newTask.dealId) {
                          const selectedDeal = deals.find(deal => deal.id === newTask.dealId);
                          // Если выбрана сделка и она не принадлежит новому клиенту, сбрасываем её
                          if (!clientId || (selectedDeal && selectedDeal.clientId !== clientId)) {
                            handleNewTaskChange('dealId', '');
                            handleNewTaskChange('dealName', '');
                          }
                        }
                      }}
                    >
                      <MenuItem value="">Нет</MenuItem>
                      {clients.map((client) => (
                        <MenuItem key={client.id} value={client.id}>
                          {client.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Сделка</InputLabel>
                    <Select
                      label="Сделка"
                      value={newTask.dealId}
                      onChange={(e) => {
                        const selectedDeal = deals.find(deal => deal.id === e.target.value);
                        handleNewTaskChange('dealId', e.target.value);
                        handleNewTaskChange('dealName', selectedDeal ? selectedDeal.title : '');
                      }}
                    >
                      <MenuItem value="">Нет</MenuItem>                      {deals
                        .filter(deal => !newTask.clientId || deal.clientId === newTask.clientId)
                        .map((deal) => (
                          <MenuItem key={deal.id} value={deal.id}>
                            {deal.title}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={sendTelegramNotification}
                        onChange={(e) => setSendTelegramNotification(e.target.checked)}
                      />
                    }
                    label="Отправить уведомление в Telegram"
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialogs}>Отмена</Button>
              <Button variant="contained" onClick={handleCreateTask}>Создать</Button>
            </DialogActions>
          </Dialog>
          
          {/* Диалог просмотра задачи */}
          {selectedTask && (
            <Dialog open={openTaskDetailsDialog} onClose={handleCloseDialogs} maxWidth="md" fullWidth>
              <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">{selectedTask.title}</Typography>
                  <Chip 
                    label={taskStatusMap[selectedTask.status].label} 
                    color={taskStatusMap[selectedTask.status].color}
                  />
                </Box>
              </DialogTitle>
              <DialogContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    {selectedTask.description && (
                      <Typography variant="body1" paragraph>
                        {selectedTask.description}
                      </Typography>
                    )}
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">
                      Срок выполнения:
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {format(new Date(selectedTask.dueDate), 'dd MMMM yyyy HH:mm', { locale: ru })}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">
                      Приоритет:
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box 
                        component="span" 
                        sx={{ 
                          width: 10, 
                          height: 10, 
                          borderRadius: '50%', 
                          backgroundColor: taskPriorityMap[selectedTask.priority].color,
                          display: 'inline-block',
                          mr: 1
                        }}
                      />
                      <Typography variant="body1">
                        {taskPriorityMap[selectedTask.priority].label}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">
                      Исполнитель:
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {users.find(user => user.id === selectedTask.assigneeId)?.name || selectedTask.assigneeId}
                    </Typography>
                  </Grid>
                  
                  {selectedTask.clientId && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary">
                        Клиент:
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {selectedTask.clientName}
                      </Typography>
                    </Grid>
                  )}
                  
                  {selectedTask.dealId && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary">
                        Сделка:
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {selectedTask.dealName}
                      </Typography>
                    </Grid>
                  )}
                  
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Изменить статус
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
                      {Object.entries(taskStatusMap).map(([status, info]) => (
                        <Button
                          key={status}
                          variant={selectedTask.status === status ? 'contained' : 'outlined'}
                          color={info.color === 'default' ? 'primary' : info.color}
                          disabled={selectedTask.status === status}
                          onClick={() => handleUpdateTaskStatus(selectedTask.id, status as TaskStatus)}
                          sx={{ mb: 1 }}
                        >
                          {info.label}
                        </Button>
                      ))}
                    </Stack>
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button 
                  color="error" 
                  onClick={() => {
                    // Подтверждение перед удалением
                    if(window.confirm('Вы уверены, что хотите удалить эту задачу?')) {
                      handleDeleteTask(selectedTask.id);
                    }
                  }}
                >
                  Удалить
                </Button>
                <Button onClick={handleCloseDialogs}>Закрыть</Button>
              </DialogActions>
            </Dialog>
          )}
        </>
      )}
      
      {/* Снэкбар для уведомлений */}
      <Snackbar
        open={notificationSnackbar.open}
        autoHideDuration={6000}
        onClose={() => setNotificationSnackbar({ ...notificationSnackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setNotificationSnackbar({ ...notificationSnackbar, open: false })} 
          severity={notificationSnackbar.severity} 
          sx={{ width: '100%' }}
        >
          {notificationSnackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Tasks;
