import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Tabs,
  Tab,
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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import BusinessIcon from '@mui/icons-material/Business';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import EventIcon from '@mui/icons-material/Event';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import { Deal, Task, Interaction, InteractionType, TaskStatus, TaskPriority, DealStatus } from '../types';
import apiService from '../utils/apiService';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`deal-tabpanel-${index}`}
      aria-labelledby={`deal-tab-${index}`}
      style={{ width: '100%' }}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: { xs: 1, sm: 3 } }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const DealDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(true);
  const [deal, setDeal] = useState<Deal | null>(null);
  const [dealTasks, setDealTasks] = useState<Task[]>([]);
  const [dealInteractions, setDealInteractions] = useState<Interaction[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [openNewNoteDialog, setOpenNewNoteDialog] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [openNewTaskDialog, setOpenNewTaskDialog] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    assigneeId: '1',
    priority: 'MEDIUM' as TaskPriority
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });
  const [isEditing, setIsEditing] = useState(false);  // Make sure we display the correct deal based on the route ID
  useEffect(() => {
    console.log("Deal ID from URL:", id);
  }, [id]);
    useEffect(() => {
    const fetchDealData = async () => {
      try {
        setLoading(true);
        console.log(`Загрузка данных сделки с ID: ${id}`);
        
        // Запрашиваем данные сделки с сервера через API
        const dealResponse = await apiService.getDealById(id!);
        console.log('Loaded deal data:', dealResponse); // Для отладки
        
        // Проверка правильности загружаемых данных
        if (!dealResponse || !dealResponse.id) {
          console.error('Invalid deal data received:', dealResponse);
          throw new Error('Получены некорректные данные сделки');
        }
        
        if (dealResponse.id !== id) {
          console.error(`Deal ID mismatch: expected ${id}, got ${dealResponse.id}`);
        }
        
        // Загружаем дополнительные данные для обогащения сделки
        console.log('Загрузка данных клиента и менеджера');
        let clientName = 'Неизвестный клиент';
        let managerName = 'Неизвестный менеджер';
        
        try {
          if (dealResponse.clientId) {
            const clientResponse = await apiService.getClientById(dealResponse.clientId);
            if (clientResponse && clientResponse.name) {
              clientName = clientResponse.name;
            }
          }
        } catch (clientError) {
          console.error('Error loading client data:', clientError);
        }
        
        try {
          if (dealResponse.managerId) {
            const usersResponse = await apiService.getUsers();
            const manager = usersResponse.find((user: any) => user.id === dealResponse.managerId);
            if (manager && manager.name) {
              managerName = manager.name;
            }
          }
        } catch (managerError) {
          console.error('Error loading manager data:', managerError);
        }
        
        // Обогащаем данные сделки
        const enrichedDeal = {
          ...dealResponse,
          clientName,
          managerName
        };
        
        console.log('Обогащенные данные сделки:', enrichedDeal);
        setDeal(enrichedDeal);
        
        // Получаем задачи для сделки
        console.log('Загрузка связанных задач');
        try {
          const tasksResponse = await apiService.getTasks();
          
          // Фильтруем задачи по ID сделки и обогащаем их данными
          const filteredTasks = tasksResponse
            .filter((task: any) => task.dealId === id)
            .map((task: any) => {
              // Добавляем название сделки
              return {
                ...task,
                dealName: enrichedDeal.title // Используем title сделки
              };
            });
          
          console.log(`Найдено ${filteredTasks.length} задач для сделки ID ${id}`);
          setDealTasks(filteredTasks);
        } catch (tasksError) {
          console.error('Error loading related tasks:', tasksError);
        }
        
        // Получаем историю взаимодействий для клиента сделки
        console.log('Загрузка истории взаимодействий');
        try {
          if (dealResponse.clientId) {
            const interactionsResponse = await apiService.getInteractions(dealResponse.clientId);
            setDealInteractions(interactionsResponse);
            console.log(`Загружено ${interactionsResponse.length} взаимодействий`);
          }
        } catch (interactionsError) {
          console.error('Error loading interactions:', interactionsError);
        }
        
        setLoading(false);
      } catch (error: any) {
        console.error('Error fetching deal data:', error);
        setSnackbar({
          open: true,
          message: `Ошибка загрузки данных сделки: ${error.response?.data?.message || error.message || 'Неизвестная ошибка'}`,
          severity: 'error'
        });
        setLoading(false);
        // Перенаправляем на страницу сделок при ошибке
        navigate('/deals');
      }
    };

    if (id) {
      fetchDealData();
    } else {
      setLoading(false);
      setSnackbar({
        open: true,
        message: 'Не указан ID сделки',
        severity: 'error'
      });
      // Перенаправляем на страницу сделок, если нет ID
      navigate('/deals');
    }
  }, [id, navigate]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenNewNoteDialog = () => {
    setOpenNewNoteDialog(true);
  };

  const handleCloseNewNoteDialog = () => {
    setOpenNewNoteDialog(false);
    setNewNote('');
  };

  const handleNewNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewNote(e.target.value);
  };

  const handleOpenNewTaskDialog = () => {
    setOpenNewTaskDialog(true);
  };

  const handleCloseNewTaskDialog = () => {
    setOpenNewTaskDialog(false);
    setNewTask({
      title: '',
      description: '',
      dueDate: '',
      assigneeId: '1',
      priority: 'MEDIUM'
    });
  };

  const handleNewTaskChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewTask(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNewTaskSelectChange = (e: any) => {
    const { name, value } = e.target;
    setNewTask(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatDate = (date: string): string => {
    try {
      return format(new Date(date), 'dd MMMM yyyy', { locale: ru });
    } catch (error) {
      console.error('Ошибка форматирования даты:', error);
      return 'Некорректная дата';
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB'
    }).format(amount);
  };

  const handleDeleteDeal = async () => {
    if (!deal || !window.confirm('Вы уверены, что хотите удалить эту сделку?')) return;
    
    try {
      await apiService.deleteDeal(deal.id);
      setSnackbar({
        open: true,
        message: 'Сделка успешно удалена',
        severity: 'success'
      });
      navigate('/deals');
    } catch (error) {
      console.error('Error deleting deal:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка при удалении сделки',
        severity: 'error'
      });
    }
  };  const handleSaveDeal = async () => {
    if (!deal) return;
    
    try {
      console.log('Saving deal with data:', deal); // Для отладки
      
      // Подготавливаем данные для обновления с учетом ожидаемых полей DTO
      // Только фактически измененные поля
      const dealDataToUpdate: any = {};
      
      if (deal.title) dealDataToUpdate.title = deal.title;
      if (deal.description !== undefined) dealDataToUpdate.description = deal.description;
      if (deal.amount !== undefined) dealDataToUpdate.amount = Number(deal.amount);
      if (deal.status) dealDataToUpdate.status = deal.status;
      if (deal.clientId) dealDataToUpdate.clientId = deal.clientId;
      if (deal.managerId) dealDataToUpdate.managerId = deal.managerId;
      
      // Если дата есть, преобразуем в строку ISO (как ожидает бэкенд)
      if (deal.estimatedClosingDate) {
        dealDataToUpdate.estimatedClosingDate = new Date(deal.estimatedClosingDate).toISOString();
      }
      
      if (deal.actualClosingDate) {
        dealDataToUpdate.actualClosingDate = new Date(deal.actualClosingDate).toISOString();
      }
      
      if (deal.probability !== undefined) {
        dealDataToUpdate.probability = Number(deal.probability);
      }
      
      if (deal.productInfo !== undefined) dealDataToUpdate.productInfo = deal.productInfo;
      if (deal.source !== undefined) dealDataToUpdate.source = deal.source;
      
      console.log('Sending deal data to API:', dealDataToUpdate); // Для отладки
      
      const updatedDeal = await apiService.updateDeal(deal.id, dealDataToUpdate);
      console.log('Received updated deal:', updatedDeal); // Для отладки
      
      // Сохраняем дополнительные данные, которые могли не вернуться с бэкенда
      const enrichedUpdatedDeal = {
        ...updatedDeal,
        clientName: deal.clientName,
        managerName: deal.managerName
      };
      
      // Обновляем состояние с полученными от сервера данными
      setDeal(enrichedUpdatedDeal);
      setIsEditing(false);
      setSnackbar({
        open: true,
        message: 'Сделка успешно обновлена',
        severity: 'success'
      });
        // Если есть связанные задачи и были изменения в имени сделки, нужно обновить их тоже
      if (dealTasks.length > 0 && deal.title !== updatedDeal.title) {
        console.log('Обновление связанных задач из-за изменения названия сделки');
        dealTasks.forEach(async (task) => {
          try {
            const taskUpdateData = {
              dealId: task.dealId // Сохраняем связь с сделкой
            };
            
            await apiService.updateTask(task.id, taskUpdateData);
            
            // Локально обновляем имя сделки в задачах для отображения
            setDealTasks(dealTasks.map(t => 
              t.id === task.id 
                ? {...t, dealName: updatedDeal.title} 
                : t
            ));
          } catch (taskError) {
            console.error(`Ошибка при обновлении задачи ${task.id}:`, taskError);
          }
        });
      }
    } catch (error) {
      console.error('Error updating deal:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка при обновлении сделки',
        severity: 'error'
      });
    }
  };  const handleDealChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!deal) return;
    
    const { name, value } = e.target;
    console.log('Deal field change:', name, value); // Для отладки
    
    // Для числовых полей преобразуем значение
    if (name === 'amount' || name === 'probability') {
      setDeal({
        ...deal,
        [name]: value === '' ? 0 : Number(value)
      });
    } else if (name.includes('Date')) {
      // Для дат сохраняем в формате ISO
      if (value) {
        const newDate = new Date(value);
        // Проверяем, что дата валидна
        if (!isNaN(newDate.getTime())) {
          setDeal({
            ...deal,
            [name]: newDate.toISOString()
          });
        } else {
          console.error('Invalid date:', value);
        }
      } else {
        setDeal({
          ...deal,
          [name]: null
        });
      }
    } else {
      setDeal({
        ...deal,
        [name]: value
      });
    }  };
  
  const handleDealSelectChange = (e: any) => {
    if (!deal) return;
    
    const { name, value } = e.target;
    console.log('Deal select change:', name, value); // Для отладки
    
    // Проверяем, если это статус - обрабатываем особенно
    if (name === 'status') {
      // При смене статуса на COMPLETED, устанавливаем вероятность 100%
      if (value === 'COMPLETED' && deal.status !== 'COMPLETED') {
        setDeal({
          ...deal,
          status: value as DealStatus,
          probability: 100
        });
        return;
      }
      // При смене статуса на CANCELLED, устанавливаем вероятность 0%
      else if (value === 'CANCELLED' && deal.status !== 'CANCELLED') {
        setDeal({
          ...deal,
          status: value as DealStatus,
          probability: 0
        });
        return;
      }
    }
    
    // Для всех остальных изменений
    setDeal({
      ...deal,
      [name]: value
    });
    
    console.log('Updated deal state after select change:', {
      ...deal,
      [name]: value
    });
  };

  const handleAddInteraction = async () => {
    if (!deal || !newNote.trim()) return;
    
    try {
      const newInteraction = {
        type: 'NOTE' as InteractionType,
        content: newNote,
        clientId: deal.clientId
      };
      
      const createdInteraction = await apiService.createInteraction(newInteraction);
      setDealInteractions([createdInteraction, ...dealInteractions]);
      
      handleCloseNewNoteDialog();
      setSnackbar({
        open: true,
        message: 'Заметка успешно добавлена',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error adding interaction:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка при добавлении заметки',
        severity: 'error'
      });
    }
  };

  const handleAddTask = async () => {
    if (!deal) return;
    
    try {
      const taskData = {
        ...newTask,
        clientId: deal.clientId,
        clientName: deal.clientName,
        dealId: deal.id,
        dealName: deal.title
      };
      
      const createdTask = await apiService.createTask(taskData);
      setDealTasks([createdTask, ...dealTasks]);
      
      handleCloseNewTaskDialog();
      setSnackbar({
        open: true,
        message: 'Задача успешно добавлена',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error adding task:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка при добавлении задачи',
        severity: 'error'
      });
    }
  };
  // Функция отображения статуса сделки
  const getDealStatusChip = () => {
    if (!deal) return null;
    
    let color;    switch (deal.status) {
      case 'NEW':
        color = 'info';
        break;
      case 'NEGOTIATION':
        color = 'warning';
        break;
      case 'PROPOSAL':
        color = 'primary';
        break;
      case 'AGREEMENT':
        color = 'secondary';
        break;
      case 'PAID':
        color = 'info';
        break;
      case 'INSTALLATION':
        color = 'warning';
        break;
      case 'COMPLETED':
        color = 'success';
        break;
      case 'CANCELLED':
        color = 'error';
        break;
      default:
        color = 'default';
    }
    
    return (
      <Chip
        label={
          deal.status === 'NEW' ? 'Новая' :
          deal.status === 'NEGOTIATION' ? 'На переговорах' :
          deal.status === 'PROPOSAL' ? 'Предложение' :
          deal.status === 'AGREEMENT' ? 'Согласование' :
          deal.status === 'PAID' ? 'Оплачена' :
          deal.status === 'INSTALLATION' ? 'Монтаж' :
          deal.status === 'COMPLETED' ? 'Завершена' :
          deal.status === 'CANCELLED' ? 'Отменена' : 'В процессе'
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

  if (!deal) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5">Сделка не найдена</Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
          onClick={() => navigate('/deals')}
        >
          Вернуться к списку сделок
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
        <IconButton 
          sx={{ mr: 1 }}
          onClick={() => navigate('/deals')}
        >
          <ArrowBackIcon />
        </IconButton>
        
        {isEditing ? (
          <TextField
            name="title"
            value={deal.title}
            onChange={handleDealChange}
            fullWidth
            sx={{ flexGrow: 1, maxWidth: 'calc(100% - 160px)' }}
          />
        ) : (
          <Typography variant="h5" sx={{ flexGrow: 1 }}>
            {deal.title}
          </Typography>
        )}
        
        <Box sx={{ display: 'flex', ml: { xs: 0, sm: 2 }, mt: { xs: 1, sm: 0 }, width: { xs: '100%', sm: 'auto' } }}>
          {isEditing ? (
            <>
              <Button
                startIcon={<SaveIcon />}
                variant="contained"
                color="primary"
                onClick={handleSaveDeal}
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
                onClick={handleDeleteDeal}
              >
                Удалить
              </Button>
            </>
          )}
        </Box>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ mb: 3, p: 2 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange}
                variant={isMobile ? "scrollable" : "standard"}
                scrollButtons={isMobile ? "auto" : undefined}
                aria-label="Deal information tabs"
              >
                <Tab label="Информация" />
                <Tab label="Задачи" />
                <Tab label="История взаимодействий" />
              </Tabs>
            </Box>
            
            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Основные данные
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Статус
                        </Typography>
                        {isEditing ? (
                          <FormControl fullWidth margin="dense">
                            <InputLabel>Статус</InputLabel>                            <Select
                              name="status"
                              value={deal.status}
                              onChange={handleDealSelectChange}
                              label="Статус"
                            >
                              <MenuItem value="NEW">Новая</MenuItem>
                              <MenuItem value="NEGOTIATION">На переговорах</MenuItem>
                              <MenuItem value="PROPOSAL">Предложение</MenuItem>
                              <MenuItem value="AGREEMENT">Согласование</MenuItem>
                              <MenuItem value="PAID">Оплачена</MenuItem>
                              <MenuItem value="INSTALLATION">Монтаж</MenuItem>
                              <MenuItem value="COMPLETED">Завершена</MenuItem>
                              <MenuItem value="CANCELLED">Отменена</MenuItem>
                            </Select>
                          </FormControl>
                        ) : (
                          getDealStatusChip()
                        )}
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Сумма сделки
                        </Typography>
                        {isEditing ? (
                          <TextField
                            name="amount"
                            value={deal.amount}
                            onChange={handleDealChange}
                            type="number"
                            fullWidth
                          />
                        ) : (
                          <Typography variant="body1">
                            {formatCurrency(deal.amount)}
                          </Typography>
                        )}
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Вероятность закрытия
                        </Typography>
                        {isEditing ? (
                          <TextField
                            name="probability"
                            value={deal.probability}
                            onChange={handleDealChange}
                            type="number"
                            inputProps={{ min: 0, max: 100 }}
                            fullWidth
                          />
                        ) : (
                          <Typography variant="body1">
                            {deal.probability}%
                          </Typography>
                        )}
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Ожидаемая дата закрытия
                        </Typography>
                        {isEditing ? (
                          <TextField
                            name="estimatedClosingDate"
                            value={deal.estimatedClosingDate ? deal.estimatedClosingDate.split('T')[0] : ''}
                            onChange={handleDealChange}
                            type="date"
                            fullWidth
                          />
                        ) : (
                          <Typography variant="body1">
                            {deal.estimatedClosingDate ? formatDate(deal.estimatedClosingDate) : 'Не указано'}
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Клиент
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      
                      <List dense>
                        <ListItem>
                          <ListItemIcon>
                            <BusinessIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary="Название компании"
                            secondary={deal.clientName || 'Не указано'}
                          />
                        </ListItem>
                        
                        <ListItem 
                          button 
                          sx={{ mt: 1 }}
                          onClick={() => navigate(`/clients/${deal.clientId}`)}
                        >
                          <ListItemText 
                            primary={
                              <Typography color="primary">
                                Перейти на страницу клиента
                              </Typography>
                            } 
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                  
                  <Card variant="outlined" sx={{ mt: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Ответственный
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body1">
                          {deal.managerName || 'Не назначен'}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Описание
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      
                      {isEditing ? (
                        <TextField
                          name="description"
                          value={deal.description || ''}
                          onChange={handleDealChange}
                          multiline
                          rows={4}
                          fullWidth
                        />
                      ) : (
                        <Typography variant="body1">
                          {deal.description || 'Описание отсутствует'}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>
            
            <TabPanel value={tabValue} index={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Задачи по сделке
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  variant="contained"
                  onClick={handleOpenNewTaskDialog}
                >
                  Новая задача
                </Button>
              </Box>
              
              {dealTasks.length > 0 ? (
                <List>
                  {dealTasks.map((task) => (
                    <Paper 
                      key={task.id} 
                      variant="outlined"
                      sx={{ 
                        mb: 2, 
                        p: 2,
                        '&:hover': {
                          boxShadow: 1,
                          cursor: 'pointer'
                        }
                      }}
                      onClick={() => navigate(`/tasks/${task.id}`)}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1">
                          {task.title}
                        </Typography>
                        <Box>
                          <Chip
                            label={
                              task.status === 'NEW' ? 'Новая' :
                              task.status === 'IN_PROGRESS' ? 'В работе' :
                              task.status === 'COMPLETED' ? 'Завершена' : 'Неизвестно'
                            }
                            color={
                              task.status === 'NEW' ? 'info' :
                              task.status === 'IN_PROGRESS' ? 'warning' :
                              task.status === 'COMPLETED' ? 'success' : 'default'
                            }
                            size="small"
                            sx={{ mr: 1 }}
                          />
                          <Chip
                            label={
                              task.priority === 'LOW' ? 'Низкий' :
                              task.priority === 'MEDIUM' ? 'Средний' :
                              task.priority === 'HIGH' ? 'Высокий' : 'Не указан'
                            }
                            color={
                              task.priority === 'LOW' ? 'success' :
                              task.priority === 'MEDIUM' ? 'info' :
                              task.priority === 'HIGH' ? 'error' : 'default'
                            }
                            size="small"
                          />
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {task.description?.substring(0, 100) || 'Нет описания'}
                        {task.description?.length > 100 ? '...' : ''}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Ответственный: {task.assigneeName || 'Не назначен'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {task.dueDate ? `Срок: ${formatDate(task.dueDate)}` : 'Без срока'}
                        </Typography>
                      </Box>
                    </Paper>
                  ))}
                </List>
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                  Задач по этой сделке пока нет
                </Typography>
              )}
            </TabPanel>
            
            <TabPanel value={tabValue} index={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  История взаимодействий
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  variant="contained"
                  onClick={handleOpenNewNoteDialog}
                >
                  Добавить заметку
                </Button>
              </Box>
              
              {dealInteractions.length > 0 ? (
                <List>
                  {dealInteractions.map((interaction) => (
                    <Paper key={interaction.id} variant="outlined" sx={{ mb: 2, p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Chip                            label={
                              interaction.type === 'CALL' ? 'Звонок' :
                              interaction.type === 'EMAIL' ? 'Email' :
                              interaction.type === 'TASK' ? 'Задача' :
                              interaction.type === 'NOTE' ? 'Заметка' : 'Неизвестно'
                            }
                            color={
                              interaction.type === 'CALL' ? 'info' :
                              interaction.type === 'EMAIL' ? 'warning' :
                              interaction.type === 'TASK' ? 'success' :
                              interaction.type === 'NOTE' ? 'default' : 'default'
                            }
                            size="small"
                            sx={{ mr: 1 }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {interaction.createdAt ? formatDate(interaction.createdAt) : 'Неизвестная дата'}
                        </Typography>
                      </Box>
                      <Typography variant="body1">
                        {interaction.content}
                      </Typography>
                    </Paper>
                  ))}
                </List>
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                  История взаимодействий пуста
                </Typography>
              )}
            </TabPanel>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Сводка
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AttachMoneyIcon color="primary" sx={{ mr: 1 }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Сумма сделки
                </Typography>
                <Typography variant="body1">
                  {formatCurrency(deal.amount)}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <EventIcon color="primary" sx={{ mr: 1 }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Планируемая дата закрытия
                </Typography>
                <Typography variant="body1">
                  {deal.estimatedClosingDate ? formatDate(deal.estimatedClosingDate) : 'Не указано'}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AssignmentTurnedInIcon color="primary" sx={{ mr: 1 }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Задачи
                </Typography>
                <Typography variant="body1">
                  {dealTasks.length} задач
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Диалог для добавления новой заметки */}
      <Dialog open={openNewNoteDialog} onClose={handleCloseNewNoteDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Добавить заметку</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Текст заметки"
            value={newNote}
            onChange={handleNewNoteChange}
            fullWidth
            multiline
            rows={4}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewNoteDialog}>Отмена</Button>
          <Button onClick={handleAddInteraction} variant="contained" disabled={!newNote.trim()}>Добавить</Button>
        </DialogActions>
      </Dialog>
      
      {/* Диалог для добавления новой задачи */}
      <Dialog open={openNewTaskDialog} onClose={handleCloseNewTaskDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Создать новую задачу</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Название задачи"
            name="title"
            value={newTask.title}
            onChange={handleNewTaskChange}
            fullWidth
            required
          />
          <TextField
            margin="dense"
            label="Описание"
            name="description"
            value={newTask.description}
            onChange={handleNewTaskChange}
            fullWidth
            multiline
            rows={3}
          />
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Дата выполнения"
                name="dueDate"
                type="date"
                value={newTask.dueDate}
                onChange={handleNewTaskChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Приоритет</InputLabel>
                <Select
                  name="priority"
                  value={newTask.priority}
                  label="Приоритет"
                  onChange={handleNewTaskSelectChange}
                >
                  <MenuItem value="LOW">Низкий</MenuItem>
                  <MenuItem value="MEDIUM">Средний</MenuItem>
                  <MenuItem value="HIGH">Высокий</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewTaskDialog}>Отмена</Button>
          <Button 
            onClick={handleAddTask} 
            variant="contained"
            disabled={!newTask.title.trim()}
          >
            Создать
          </Button>
        </DialogActions>
      </Dialog>
      
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

export default DealDetails;
