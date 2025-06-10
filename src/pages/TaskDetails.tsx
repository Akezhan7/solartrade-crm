import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Divider,
  CircularProgress,
  IconButton,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Chip,
  useTheme,
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import EventIcon from '@mui/icons-material/Event';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import AssignmentIcon from '@mui/icons-material/Assignment';
import FlagIcon from '@mui/icons-material/Flag';
import { Task, TaskStatus, TaskPriority } from '../types';
import apiService from '../utils/apiService';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const TaskDetails: React.FC = () => {  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<Task | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });  useEffect(() => {
    const fetchTaskData = async () => {
      try {
        setLoading(true);
        // Запрашиваем данные с сервера через API
        const taskResponse = await apiService.getTaskById(id!);
        console.log('Loaded task data:', taskResponse); // Для отладки
        
        // Проверка правильности загружаемых данных
        if (!taskResponse || !taskResponse.id) {
          console.error('Invalid task data received:', taskResponse);
          throw new Error('Received invalid task data');
        }
        
        if (taskResponse.id !== id) {
          console.error(`Task ID mismatch: expected ${id}, got ${taskResponse.id}`);
        }
          // Загружаем список клиентов, сделок и пользователей для возможности редактирования
        const [clientsResponse, dealsResponse, usersResponse] = await Promise.all([
          apiService.getClients(),
          apiService.getDeals(),
          apiService.getUsers()
        ]);
        
        setClients(clientsResponse);
        setDeals(dealsResponse);
        setUsers(usersResponse);
        
        // Добавляем имена клиента, сделки и исполнителя для отображения
        let enrichedTask = {...taskResponse};
        
        // Добавление имени клиента
        if (taskResponse.clientId && clientsResponse) {
          const client = clientsResponse.find((c: any) => c.id === taskResponse.clientId);
          if (client) {
            enrichedTask.clientName = client.name;
            console.log(`Found client name: ${client.name} for clientId: ${taskResponse.clientId}`);
          } else {
            console.log(`Client not found for ID: ${taskResponse.clientId}`);
          }
        }
          // Добавление названия сделки
        if (taskResponse.dealId && dealsResponse) {
          const deal = dealsResponse.find((d: any) => d.id === taskResponse.dealId);
          if (deal) {
            enrichedTask.dealName = deal.title;
            console.log(`Found deal name: ${deal.title} for dealId: ${taskResponse.dealId}`);
          } else {
            console.log(`Deal not found for ID: ${taskResponse.dealId}`);
          }
        }
        
        // Добавление имени исполнителя
        if (taskResponse.assigneeId && usersResponse) {
          const assignee = usersResponse.find((u: any) => u.id === taskResponse.assigneeId);
          if (assignee) {
            enrichedTask.assigneeName = assignee.name;
            console.log(`Found assignee name: ${assignee.name} for assigneeId: ${taskResponse.assigneeId}`);
          } else {
            console.log(`Assignee not found for ID: ${taskResponse.assigneeId}`);
          }
        }
        
        setTask(enrichedTask);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching task data:', error);
        setSnackbar({
          open: true,
          message: 'Ошибка загрузки данных задачи',
          severity: 'error'
        });
        setLoading(false);
      }
    };

    if (id) {
      fetchTaskData();
    } else {
      setLoading(false);
      setSnackbar({
        open: true,
        message: 'Не указан ID задачи',
        severity: 'error'
      });
    }
  }, [id]);
  const formatDate = (date: string): string => {
    try {
      return format(new Date(date), 'dd MMMM yyyy', { locale: ru });
    } catch (error) {
      console.error('Ошибка форматирования даты:', error);
      return 'Некорректная дата';
    }
  };
  
  // Make sure we display the correct content based on the route ID
  useEffect(() => {
    console.log("Task ID from URL:", id);
  }, [id]);

  const handleDeleteTask = async () => {
    if (!task || !window.confirm('Вы уверены, что хотите удалить эту задачу?')) return;
    
    try {
      await apiService.deleteTask(task.id);
      setSnackbar({
        open: true,
        message: 'Задача успешно удалена',
        severity: 'success'
      });
      navigate('/tasks');
    } catch (error) {
      console.error('Error deleting task:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка при удалении задачи',
        severity: 'error'
      });
    }
  };  const handleSaveTask = async () => {
    if (!task) return;
    
    try {
      console.log('Saving task with data:', task); // Для отладки
        // Сохраняем имена для отображения на фронте
      let clientName = null;
      let dealName = null;
      let assigneeName = null;
      
      // Если был изменен клиент, обновляем имя клиента
      if (task.clientId) {
        const client = clients.find(c => c.id === task.clientId);
        if (client) {
          clientName = client.name;
        }
      }
      
      // Если была изменена сделка, обновляем название сделки
      if (task.dealId) {
        const deal = deals.find(d => d.id === task.dealId);
        if (deal) {
          dealName = deal.title;
        }
      }
        // Обновляем имя исполнителя
      if (task.assigneeId) {
        const assignee = users.find(u => u.id === task.assigneeId);
        if (assignee) {
          assigneeName = assignee.name;
          console.log(`Found assignee name: ${assignee.name} for assigneeId: ${task.assigneeId}`);
        } else {
          console.log(`Assignee not found for ID: ${task.assigneeId}`);
        }
      } else {
        console.log('No assigneeId provided');
      }
      
      // Подготавливаем данные для отправки на сервер (только то, что ожидает API)
      const taskDataToUpdate = {
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        assigneeId: task.assigneeId,
        clientId: task.clientId || null,
        dealId: task.dealId || null,
      };
      
      console.log('Sending task data to API:', taskDataToUpdate); // Для отладки
      
      const updatedTask = await apiService.updateTask(task.id, taskDataToUpdate);      console.log('Received updated task:', updatedTask); // Для отладки
      
      // Обновляем локальный объект задачи с данными от сервера плюс имена
      const fullUpdatedTask = {
        ...updatedTask,
        clientName: clientName,
        dealName: dealName,
        assigneeName: assigneeName
      };
      
      setTask(fullUpdatedTask);
      setIsEditing(false);
      setSnackbar({
        open: true,
        message: 'Задача успешно обновлена',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating task:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка при обновлении задачи',
        severity: 'error'
      });
    }
  };
  const handleTaskChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!task) return;
    
    const { name, value } = e.target;
    console.log('Task field change:', name, value); // Для отладки
    
    // Обновляем задачу со специальной обработкой для определенных полей
    setTask({
      ...task,
      [name]: value,
      updatedAt: new Date().toISOString() // Обновляем время последнего изменения
    });
  };const handleTaskSelectChange = (e: any) => {
    if (!task) return;
    
    const { name, value } = e.target;
    console.log('Select change:', name, value); // Для отладки
    
    // Если изменился клиент, сбрасываем сделку, если она не принадлежит этому клиенту
    if (name === 'clientId') {
      if (value) {
        // Находим информацию о выбранном клиенте
        const selectedClient = clients.find(client => client.id === value);
        const clientDeals = deals.filter(deal => deal.clientId === value);
        
        // Если текущая сделка не принадлежит выбранному клиенту, сбрасываем её
        if (task.dealId && !clientDeals.find(deal => deal.id === task.dealId)) {
          setTask({
            ...task,
            [name]: value,
            clientName: selectedClient ? selectedClient.name : '',
            dealId: '',
            dealName: ''
          });
          return;
        } else {
          // Только обновляем имя клиента
          setTask({
            ...task,
            [name]: value,
            clientName: selectedClient ? selectedClient.name : ''
          });
          return;
        }
      } else {
        // Если клиент не выбран, сбрасываем и клиента, и сделку
        setTask({
          ...task,
          clientId: '',
          clientName: '',
          dealId: '',
          dealName: ''
        });
        return;
      }
    }
    
    // Если изменилась сделка
    if (name === 'dealId' && value) {
      const selectedDeal = deals.find(deal => deal.id === value);
      setTask({
        ...task,
        [name]: value,
        dealName: selectedDeal ? selectedDeal.title : ''
      });
      return;
    } else if (name === 'dealId') {
      // Если сделка сброшена
      setTask({
        ...task,
        dealId: '',
        dealName: ''
      });
      return;
    }
      // Для исполнителя
    if (name === 'assigneeId') {
      const selectedUser = users.find(user => user.id === value);
      setTask({
        ...task,
        assigneeId: value,
        assigneeName: selectedUser ? selectedUser.name : ''
      });
      return;
    }
  
    // Для всех остальных изменений
    setTask({
      ...task,
      [name]: value
    });
  };

  // Функция отображения статуса задачи
  const getTaskStatusChip = () => {
    if (!task) return null;
    
    let color;
    switch (task.status) {
      case 'NEW':
        color = 'info';
        break;
      case 'IN_PROGRESS':
        color = 'warning';
        break;
      case 'COMPLETED':
        color = 'success';
        break;
      default:
        color = 'default';
    }
    
    return (
      <Chip
        label={
          task.status === 'NEW' ? 'Новая' :
          task.status === 'IN_PROGRESS' ? 'В работе' :
          task.status === 'COMPLETED' ? 'Завершена' : 'Неизвестно'
        }
        color={color as any}
        size="small"
      />
    );
  };

  // Функция отображения приоритета задачи
  const getTaskPriorityChip = () => {
    if (!task) return null;
    
    let color;
    switch (task.priority) {
      case 'LOW':
        color = 'success';
        break;
      case 'MEDIUM':
        color = 'info';
        break;
      case 'HIGH':
        color = 'error';
        break;
      default:
        color = 'default';
    }
    
    return (
      <Chip
        label={
          task.priority === 'LOW' ? 'Низкий' :
          task.priority === 'MEDIUM' ? 'Средний' :
          task.priority === 'HIGH' ? 'Высокий' : 'Не указан'
        }
        color={color as any}
        size="small"
      />
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!task) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5">Задача не найдена</Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
          onClick={() => navigate('/tasks')}
        >
          Вернуться к списку задач
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
        <IconButton 
          sx={{ mr: 1 }}
          onClick={() => navigate('/tasks')}
        >
          <ArrowBackIcon />
        </IconButton>
        
        {isEditing ? (
          <TextField
            name="title"
            value={task.title}
            onChange={handleTaskChange}
            fullWidth
            sx={{ flexGrow: 1, maxWidth: 'calc(100% - 160px)' }}
          />
        ) : (
          <Typography variant="h5" sx={{ flexGrow: 1 }}>
            {task.title}
          </Typography>
        )}
        
        <Box sx={{ display: 'flex', ml: { xs: 0, sm: 2 }, mt: { xs: 1, sm: 0 }, width: { xs: '100%', sm: 'auto' } }}>
          {isEditing ? (
            <>
              <Button
                startIcon={<SaveIcon />}
                variant="contained"
                color="primary"
                onClick={handleSaveTask}
                sx={{ mr: 1 }}
              >
                Сохранить
              </Button>
              <Button
                startIcon={<CancelIcon />}
                variant="outlined"
                onClick={() => setIsEditing(false)}
              >
                Отмена
              </Button>
            </>
          ) : (
            <>
              <Button
                startIcon={<EditIcon />}
                variant="outlined"
                onClick={() => setIsEditing(true)}
                sx={{ mr: 1 }}
              >
                Редактировать
              </Button>
              <Button
                startIcon={<DeleteIcon />}
                variant="outlined"
                color="error"
                onClick={handleDeleteTask}
              >
                Удалить
              </Button>
            </>
          )}
        </Box>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Информация о задаче
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Описание
              </Typography>
              {isEditing ? (
                <TextField
                  name="description"
                  value={task.description || ''}
                  onChange={handleTaskChange}
                  multiline
                  rows={4}
                  fullWidth
                />
              ) : (
                <Typography variant="body1">
                  {task.description || 'Описание отсутствует'}
                </Typography>
              )}
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Статус
                  </Typography>
                  {isEditing ? (
                    <FormControl fullWidth>
                      <InputLabel>Статус</InputLabel>
                      <Select
                        name="status"
                        value={task.status}
                        onChange={handleTaskSelectChange}
                        label="Статус"
                      >
                        <MenuItem value="NEW">Новая</MenuItem>
                        <MenuItem value="IN_PROGRESS">В работе</MenuItem>
                        <MenuItem value="COMPLETED">Завершена</MenuItem>
                      </Select>
                    </FormControl>
                  ) : (
                    getTaskStatusChip()
                  )}
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Приоритет
                  </Typography>
                  {isEditing ? (
                    <FormControl fullWidth>
                      <InputLabel>Приоритет</InputLabel>
                      <Select
                        name="priority"
                        value={task.priority}
                        onChange={handleTaskSelectChange}
                        label="Приоритет"
                      >
                        <MenuItem value="LOW">Низкий</MenuItem>
                        <MenuItem value="MEDIUM">Средний</MenuItem>
                        <MenuItem value="HIGH">Высокий</MenuItem>
                      </Select>
                    </FormControl>
                  ) : (
                    getTaskPriorityChip()
                  )}
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Срок выполнения
                  </Typography>
                  {isEditing ? (
                    <TextField
                      name="dueDate"
                      value={task.dueDate ? task.dueDate.split('T')[0] : ''}
                      onChange={handleTaskChange}
                      type="date"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  ) : (
                    <Typography variant="body1">
                      {task.dueDate ? formatDate(task.dueDate) : 'Не указано'}
                    </Typography>
                  )}
                </Box>
              </Grid>
                <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Ответственный
                  </Typography>
                  {isEditing ? (
                    <FormControl fullWidth>
                      <InputLabel>Исполнитель</InputLabel>
                      <Select
                        name="assigneeId"
                        value={task.assigneeId || ""}
                        onChange={handleTaskSelectChange}
                        label="Исполнитель"
                      >
                        <MenuItem value="">Не назначен</MenuItem>
                        {users.map((user) => (
                          <MenuItem key={user.id} value={user.id}>
                            {user.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    <Typography variant="body1">
                      {task.assigneeName || 'Не назначен'}
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Связанные данные */}          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Связанные данные
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {isEditing ? (
              <Grid container spacing={2}>
                <Grid item xs={12} mb={2}>
                  <FormControl fullWidth>
                    <InputLabel>Клиент</InputLabel>
                    <Select
                      name="clientId"
                      value={task.clientId || ""}
                      onChange={handleTaskSelectChange}
                      label="Клиент"
                    >
                      <MenuItem value="">Нет клиента</MenuItem>
                      {clients.map((client) => (
                        <MenuItem key={client.id} value={client.id}>
                          {client.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Сделка</InputLabel>
                    <Select
                      name="dealId"
                      value={task.dealId || ""}
                      onChange={handleTaskSelectChange}
                      label="Сделка"
                    >
                      <MenuItem value="">Нет сделки</MenuItem>                      {deals
                        .filter(deal => !task.clientId || deal.clientId === task.clientId)
                        .map((deal) => (
                          <MenuItem key={deal.id} value={deal.id}>
                            {deal.title}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            ) : (
              <List>
                {task.clientId && (
                  <ListItem 
                    button 
                    onClick={() => navigate(`/clients/${task.clientId}`)}
                    sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 2 }}
                  >
                    <ListItemIcon>
                      <BusinessIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Клиент"
                      secondary={task.clientName || task.clientId}
                    />
                  </ListItem>
                )}
                
                {task.dealId && (
                  <ListItem 
                    button 
                    onClick={() => navigate(`/deals/${task.dealId}`)}
                    sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                  >
                    <ListItemIcon>
                      <AssignmentIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Сделка"
                      secondary={task.dealName || task.dealId}
                    />
                  </ListItem>
                )}
                
                {!task.clientId && !task.dealId && (
                  <Typography variant="body1" color="text.secondary" sx={{ p: 1, textAlign: 'center' }}>
                    Нет связанных данных
                  </Typography>
                )}
              </List>            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Сводка
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <FlagIcon color="primary" sx={{ mr: 1 }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Статус и приоритет
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  {getTaskStatusChip()}
                  <Box component="span" sx={{ mx: 0.5 }} />
                  {getTaskPriorityChip()}
                </Box>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <EventIcon color="primary" sx={{ mr: 1 }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Срок выполнения
                </Typography>
                <Typography variant="body1">
                  {task.dueDate ? formatDate(task.dueDate) : 'Не указано'}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PersonIcon color="primary" sx={{ mr: 1 }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Ответственный
                </Typography>
                <Typography variant="body1">
                  {task.assigneeName || 'Не назначен'}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Создана
                </Typography>
                <Typography variant="body1">
                  {task.createdAt ? formatDate(task.createdAt) : 'Неизвестно'}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
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

export default TaskDetails;
