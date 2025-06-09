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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  IconButton,
  Snackbar,
  Alert,
  FormControlLabel,
  Switch,
  Card,
  CardContent,
  Chip,
  useTheme,
  useMediaQuery
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
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { Client, Task, Deal, Interaction, Contact, InteractionType, TaskStatus, DealStatus, TaskPriority, User } from '../types';
import ClientInteractionHistory from '../components/clients/ClientInteractionHistory';
import ClientInteractionHistoryEnhanced from '../components/clients/ClientInteractionHistoryEnhanced';
import ClientRequisites from '../components/clients/ClientRequisites';
import ClientDeals from '../components/clients/ClientDeals';
import ClientContacts from '../components/clients/ClientContacts';
import apiService from '../utils/apiService';
import telegramService from '../utils/telegramService';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

// Mock data has been removed

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
      id={`client-tabpanel-${index}`}
      aria-labelledby={`client-tab-${index}`}
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

const ClientDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<Client | null>(null);
  const [clientTasks, setClientTasks] = useState<Task[]>([]);
  const [clientDeals, setClientDeals] = useState<Deal[]>([]);
  const [clientInteractions, setClientInteractions] = useState<Interaction[]>([]);
  const [clientContacts, setClientContacts] = useState<Contact[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [openNewNoteDialog, setOpenNewNoteDialog] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [managers, setManagers] = useState<User[]>([]);
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);
  const [openNewTaskDialog, setOpenNewTaskDialog] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    assigneeId: '1', // По умолчанию текущий пользователь
    priority: 'MEDIUM' as TaskPriority // По умолчанию средний приоритет
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });
  const [sendTelegramNotification, setSendTelegramNotification] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  useEffect(() => {
    const isAdmin = apiService.isAdmin();
    setIsCurrentUserAdmin(isAdmin);
    
    // Fetch managers if admin
    if (isAdmin) {
      const fetchManagers = async () => {
        try {
          const users = await apiService.getUsers();
          // Filter only managers and admin users
          const managerUsers = users.filter((user: User) => 
            user.role === 'MANAGER' || user.role === 'ADMIN'
          );
          setManagers(managerUsers);
        } catch (error) {
          console.error('Error fetching managers:', error);
        }
      };
      
      fetchManagers();
    }
    
    const fetchClientData = async () => {
      try {
        // Запрашиваем данные с сервера через API
        const clientResponse = await apiService.getClientById(id!);
        setClient(clientResponse);
        // Получаем задачи для клиента
        const tasksResponse = await apiService.getTasks();
        const filteredTasks = tasksResponse.filter((task: any) => task.clientId === id);
        setClientTasks(filteredTasks);
        // Получаем сделки для клиента
        const dealsResponse = await apiService.getDeals();
        const filteredDeals = dealsResponse.filter((deal: any) => deal.clientId === id);
        setClientDeals(filteredDeals);

        // Получаем историю взаимодействий для клиента
        const interactionsResponse = await apiService.getInteractions(id!);
        setClientInteractions(interactionsResponse);

        // Получаем контакты для клиента (если они есть)
        try {
          const contactsResponse = await apiService.getClientContacts(id!);
          setClientContacts(contactsResponse || []);
        } catch (contactsError) {
          console.log('Контакты еще не реализованы на сервере или произошла ошибка загрузки контактов');
          // Используем пустой массив, если API для контактов еще не готово
          setClientContacts([]);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching client data:', error);
        setSnackbar({
          open: true,
          message: 'Ошибка загрузки данных клиента',
          severity: 'error'
        });
        setLoading(false);
      }
    };

    if (id) {
      fetchClientData();
    }
  }, [id]);

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
  const handleCreateNote = () => {
    // В реальном приложении здесь будет запрос к API для создания заметки
    const newInteraction: Interaction = {
      id: (clientInteractions.length + 1).toString(),
      type: 'NOTE' as InteractionType,
      content: newNote,
      clientId: id || '',
      createdById: '1', // ID текущего пользователя
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setClientInteractions([newInteraction, ...clientInteractions]);
    handleCloseNewNoteDialog();
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
      priority: 'MEDIUM' as TaskPriority
    });
  };

  const handleNewTaskChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewTask({
      ...newTask,
      [name]: value
    });
  };
  const handleCreateTask = async () => {
    const newTaskData: Task = {
      id: (clientTasks.length + 1).toString(),
      title: newTask.title,
      description: newTask.description,
      status: 'NEW' as TaskStatus,
      priority: newTask.priority as TaskPriority, // Добавляем приоритет
      dueDate: newTask.dueDate,
      assigneeId: newTask.assigneeId,
      assigneeName: 'Иван Иванов',
      clientId: id || '',
      clientName: client?.name || '',
      dealId: null,
      dealName: null,
      createdById: '1', // Добавляем ID создателя задачи
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      setClientTasks([...clientTasks, newTaskData]);

      const newInteraction: Interaction = {
        id: (clientInteractions.length + 1).toString(),
        type: 'TASK' as InteractionType,
        content: `Создана задача: ${newTask.title}`,
        clientId: id || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdById: '1'
      };

      setClientInteractions([newInteraction, ...clientInteractions]);

      if (sendTelegramNotification && telegramService.isBotConfigured()) {
        try {
          const result = await telegramService.sendNewTaskNotification({
            taskId: newTaskData.id,
            taskTitle: newTaskData.title,
            dueDate: newTaskData.dueDate,
            assigneeName: newTaskData.assigneeName,
            clientName: newTaskData.clientName || undefined,
            priority: newTaskData.priority // Передаем приоритет задачи
          });

          if (result.success) {
            setSnackbar({
              open: true,
              message: 'Уведомление о новой задаче отправлено в Telegram',
              severity: 'success'
            });
          }
        } catch (error) {
          console.error('Error sending notification:', error);
        }
      }

      handleCloseNewTaskDialog();
      setSnackbar({
        open: true,
        message: 'Задача успешно создана',
        severity: 'success'
      });

    } catch (error) {
      console.error('Error creating task:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка при создании задачи',
        severity: 'error'
      });
    }
  };
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };
  const handleSave = async () => {
    if (!client) return;

    try {
      const updatedClient = await apiService.updateClient(client.id, client);
      setClient(updatedClient);
      setIsEditing(false);
      setSnackbar({
        open: true,
        message: 'Данные клиента успешно обновлены',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating client:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка при обновлении данных клиента',
        severity: 'error'
      });
    }
  };
  const handleClientChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { name?: string; value: unknown }>) => {
    if (!client) return;

    const { name, value } = e.target;
    setClient({
      ...client,
      [name as string]: value
    });
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!client || !client.company) return;

    const { name, value } = e.target;
    setClient({
      ...client,
      company: {
        ...client.company,
        [name]: value
      }
    });
  };

  const handleManagerChange = (event: SelectChangeEvent<string>) => {
    if (!client) return;
    
    setClient({
      ...client,
      managerId: event.target.value
    });
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  // Обработчики для контактов
  const handleAddContact = async (contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Делаем запрос к API для сохранения контакта
      const response = await apiService.createContact(contactData);

      // Обновляем список контактов с данными с сервера
      setClientContacts([...clientContacts, response]);
      setSnackbar({
        open: true,
        message: 'Контакт успешно добавлен',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error adding contact:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка при добавлении контакта',
        severity: 'error'
      });
    }
  };  const handleEditContact = async (updatedContact: Contact) => {
    try {
      // Отправляем только необходимые поля без createdAt/updatedAt
      const contactUpdateData: any = {
        firstName: updatedContact.firstName,
        lastName: updatedContact.lastName,
        phone: updatedContact.phone,
        email: updatedContact.email,
        birthDate: updatedContact.birthDate,
        position: updatedContact.position,
        notes: updatedContact.notes,
        clientId: updatedContact.clientId
      };

      // Очищаем пустые поля для корректной валидации
      Object.keys(contactUpdateData).forEach(key => {
        if (contactUpdateData[key] === '' || contactUpdateData[key] === null) {
          delete contactUpdateData[key];
        }
      });

      // Делаем запрос к API для обновления контакта
      const response = await apiService.updateContact(updatedContact.id, contactUpdateData);

      // Обновляем контакт в локальном состоянии с данными с сервера
      const updatedContacts = clientContacts.map(contact =>
        contact.id === response.id ? response : contact
      );

      setClientContacts(updatedContacts);
      setSnackbar({
        open: true,
        message: 'Контакт успешно обновлен',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating contact:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка при обновлении контакта',
        severity: 'error'
      });
    }
  };
  const handleDeleteContact = async (contactId: string) => {
    try {
      // Делаем запрос к API для удаления контакта
      await apiService.deleteContact(contactId);

      // Удаляем контакт из локального состояния
      const filteredContacts = clientContacts.filter(contact => contact.id !== contactId);

      setClientContacts(filteredContacts);
      setSnackbar({
        open: true,
        message: 'Контакт успешно удален',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting contact:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка при удалении контакта',
        severity: 'error'
      });
    }
  };

  const getDealStatusChip = (status: string) => {
    let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'default';
    let label = 'Неизвестно';

    switch (status) {
      case 'new':
        color = 'info';
        label = 'Новая';
        break;
      case 'in_progress':
        color = 'primary';
        label = 'В работе';
        break;
      case 'negotiation':
        color = 'warning';
        label = 'Переговоры';
        break;
      case 'completed':
        color = 'success';
        label = 'Завершена';
        break;
      case 'cancelled':
        color = 'error';
        label = 'Отменена';
        break;
    }

    return <Chip size={isMobile ? "small" : "medium"} label={label} color={color} />;
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <PhoneIcon />;
      case 'email':
        return <EmailIcon />;
      case 'meeting':
        return <EventNoteIcon />;
      default:
        return <AssignmentIcon />;
    }
  };

  if (loading || !client) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <Paper sx={{
        mb: 3,
        borderRadius: 2,
        overflow: 'hidden'
      }}>
        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 2,
            mb: { xs: 2, sm: 0 }
          }}
        >
          <Box>
            <Typography variant="h4" sx={{
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
            }}>
              {client.name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {client.company ? 'Юридическое лицо' : 'Физическое лицо'}
            </Typography>
          </Box>

          {isEditing ? (
            <Box sx={{
              display: 'flex',
              gap: 1,
              flexDirection: { xs: 'column', sm: 'row' },
              width: { xs: '100%', sm: 'auto' }
            }}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={handleEditToggle}
                fullWidth={isMobile}
              >
                Отменить
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                fullWidth={isMobile}
              >
                Сохранить
              </Button>
            </Box>
          ) : (
            <Button
              variant="contained"
              color="primary"
              startIcon={<EditIcon />}
              onClick={handleEditToggle}
              fullWidth={isMobile}
            >
              Редактировать
            </Button>
          )}
        </Box>

        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant={isMobile ? "scrollable" : "fullWidth"}
          scrollButtons={isMobile ? "auto" : undefined}
        >
          <Tab label="Информация" />
          <Tab label="Сделки" />
          <Tab label="Взаимодействия" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Контактная информация
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        label="Наименование"
                        name="name"
                        value={client.name}
                        fullWidth
                        disabled={!isEditing}
                        margin="normal"
                        size={isMobile ? "small" : "medium"}
                        onChange={handleClientChange}
                      />
                    </Grid>
                    {isCurrentUserAdmin && (
                      <Grid item xs={12}>
                        <FormControl fullWidth margin="normal" size={isMobile ? "small" : "medium"}>
                          <InputLabel id="manager-select-label">Менеджер</InputLabel>
                          <Select
                            labelId="manager-select-label"
                            id="manager-select"
                            name="managerId"
                            value={client.managerId || ''}
                            label="Менеджер"
                            onChange={handleManagerChange}
                            disabled={!isEditing}
                          >
                            {managers.map((manager) => (
                              <MenuItem key={manager.id} value={manager.id}>
                                {manager.name} ({manager.role === 'ADMIN' ? 'Администратор' : 'Менеджер'})
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    )}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Телефон"
                        name="phone"
                        value={client.phone}
                        fullWidth
                        disabled={!isEditing}
                        margin="normal"
                        size={isMobile ? "small" : "medium"}
                        onChange={handleClientChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Email"
                        name="email"
                        value={client.email}
                        fullWidth
                        disabled={!isEditing}
                        margin="normal"
                        size={isMobile ? "small" : "medium"}
                        onChange={handleClientChange}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            {client.company && (
              <Grid item xs={12} md={6}>
                <ClientRequisites
                  company={client.company}
                  isEditing={isEditing}
                  onCompanyChange={(field, value) => {
                    if (client.company) {
                      setClient({
                        ...client,
                        company: {
                          ...client.company,
                          [field]: value
                        }
                      });
                    }
                  }}
                />
              </Grid>
            )}

            {!client.company && isEditing && (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Добавить реквизиты компании
                    </Typography>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => {
                        setClient({
                          ...client,
                          company: {
                            id: '',
                            name: client.name,
                            inn: '',
                            kpp: '',
                            address: '',
                            bankDetails: '',
                            clientId: client.id
                          }
                        });
                      }}
                      fullWidth
                      sx={{ mt: 2 }}
                    >
                      Добавить данные компании
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            )}
            {/* Отображаем контакты для всех клиентов, не только для компаний */}
            <Grid item xs={12} md={6}>
              <ClientContacts
                clientId={client.id}
                contacts={clientContacts}
                isEditing={isEditing}
                onAddContact={handleAddContact}
                onEditContact={handleEditContact}
                onDeleteContact={handleDeleteContact}
              />
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Создан: {formatDate(client.createdAt)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Последнее обновление: {formatDate(client.updatedAt)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => navigate(`/deals/new?clientId=${id}`)}
            >
              Добавить сделку
            </Button>
          </Box>
          <ClientDeals
            deals={clientDeals}
            loading={loading}
            onAddDeal={() => navigate(`/deals/new?clientId=${client.id}`)}
            onEditDeal={(deal) => navigate(`/deals/${deal.id}?edit=true`)}
            onDeleteDeal={async (dealId) => {
              try {
                await apiService.deleteDeal(dealId);
                setClientDeals(clientDeals.filter(deal => deal.id !== dealId));
                setSnackbar({
                  open: true,
                  message: 'Сделка успешно удалена',
                  severity: 'success'
                });
              } catch (error) {
                console.error('Error deleting deal:', error);
                setSnackbar({
                  open: true,
                  message: 'Ошибка при удалении сделки',
                  severity: 'error'
                });
              }
            }}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenNewNoteDialog}
            >
              Добавить взаимодействие
            </Button>
          </Box>
          <ClientInteractionHistoryEnhanced clientId={id || ''} />
        </TabPanel>
      </Paper>

      <Dialog open={openNewNoteDialog} onClose={handleCloseNewNoteDialog} maxWidth="md" fullWidth>
        <DialogTitle>Добавление заметки</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="note"
            label="Текст заметки"
            fullWidth
            multiline
            rows={4}
            value={newNote}
            onChange={handleNewNoteChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewNoteDialog}>Отмена</Button>
          <Button
            onClick={handleCreateNote}
            variant="contained"
            color="primary"
            disabled={!newNote.trim()}
          >
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openNewTaskDialog} onClose={handleCloseNewTaskDialog} maxWidth="md" fullWidth>
        <DialogTitle>Создание задачи</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="title"
                label="Название задачи"
                fullWidth
                required
                value={newTask.title}
                onChange={handleNewTaskChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Описание задачи"
                fullWidth
                multiline
                rows={3}
                value={newTask.description}
                onChange={handleNewTaskChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="dueDate"
                label="Срок выполнения"
                type="datetime-local"
                fullWidth
                value={newTask.dueDate}
                onChange={handleNewTaskChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="assignee-label">Ответственный</InputLabel>
                <Select
                  labelId="assignee-label"
                  name="assigneeId"
                  value={newTask.assigneeId}
                  label="Ответственный"
                  onChange={handleNewTaskChange as any}
                >
                  <MenuItem value="1">Иван Иванов</MenuItem>
                  <MenuItem value="2">Петр Петров</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="priority-label">Приоритет</InputLabel>
                <Select
                  labelId="priority-label"
                  name="priority"
                  value={newTask.priority}
                  label="Приоритет"
                  onChange={handleNewTaskChange as any}
                >
                  <MenuItem value="LOW">
                    <Chip size="small" label="Низкий" color="success" sx={{ mr: 1 }} />
                    Низкий
                  </MenuItem>
                  <MenuItem value="MEDIUM">
                    <Chip size="small" label="Средний" color="warning" sx={{ mr: 1 }} />
                    Средний
                  </MenuItem>
                  <MenuItem value="HIGH">
                    <Chip size="small" label="Высокий" color="error" sx={{ mr: 1 }} />
                    Высокий
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={sendTelegramNotification}
                    onChange={(e) => setSendTelegramNotification(e.target.checked)}
                    color="primary"
                  />
                }
                label="Отправить уведомление в Telegram"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewTaskDialog}>Отмена</Button>
          <Button
            onClick={handleCreateTask}
            variant="contained"
            color="primary"
            disabled={!newTask.title.trim() || !newTask.dueDate}
          >
            Создать
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ClientDetails;