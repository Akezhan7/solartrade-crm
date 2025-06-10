import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  Grid,
  Divider,
  Snackbar,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import TelegramIcon from '@mui/icons-material/Telegram';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import apiService from '../utils/apiService';
import telegramService from '../utils/telegramService';

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
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Компонент настроек Telegram
const TelegramSettings = () => {
  const [loading, setLoading] = useState(false);
  const [telegramConfig, setTelegramConfig] = useState({
    botToken: '',
    chatId: '',
    notifyNewClients: true,
    notifyNewDeals: true,
    notifyNewTasks: true,
    notifyTaskDeadlines: true
  });
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  useEffect(() => {    // Загрузка настроек с сервера
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const response = await apiService.get('/telegram/settings');
        const data = response.data;
        if (data) {
          setTelegramConfig({
            botToken: data.botToken || '',
            chatId: data.chatId || '',
            notifyNewClients: data.notifyNewClients !== undefined ? data.notifyNewClients : true,
            notifyNewDeals: data.notifyNewDeals !== undefined ? data.notifyNewDeals : true,
            notifyNewTasks: response.data.notifyNewTasks !== undefined ? response.data.notifyNewTasks : true,
            notifyTaskDeadlines: response.data.notifyTaskDeadlines !== undefined ? response.data.notifyTaskDeadlines : true,
          });
        }
      } catch (e) {
        console.error('Ошибка при загрузке настроек Telegram с сервера:', e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setTelegramConfig({
      ...telegramConfig,
      [name]: type === 'checkbox' ? checked : value
    });
  };  const handleSaveConfig = async () => {
    setLoading(true);
    
    try {
      // Отправляем настройки на сервер
      await apiService.put('/telegram/settings', {
        botToken: telegramConfig.botToken,
        chatId: telegramConfig.chatId,
        isActive: true,
        notifyNewClients: telegramConfig.notifyNewClients,
        notifyNewDeals: telegramConfig.notifyNewDeals,
        notifyNewTasks: telegramConfig.notifyNewTasks,
        notifyTaskDeadlines: telegramConfig.notifyTaskDeadlines
      });
      
      // Обновляем настройки в клиентском сервисе для тестов
      telegramService.updateSettings({
        botToken: telegramConfig.botToken,
        chatId: telegramConfig.chatId
      });
      
      setTestResult({
        success: true,
        message: 'Настройки Telegram успешно сохранены'
      });
      
      setTimeout(() => {
        setTestResult(null);
      }, 3000);
    } catch (e) {
      setTestResult({
        success: false,
        message: 'Ошибка при сохранении настроек'
      });
    } finally {
      setLoading(false);
    }
  };
  const handleTest = async () => {
    setLoading(true);    try {
      // Отправляем запрос на тестовое сообщение
      const response = await apiService.post('/telegram/test');
      const data = response.data;
      
      setTestResult({
        success: data.success,
        message: data.success 
          ? 'Тестовое сообщение успешно отправлено' 
          : `Ошибка: ${data.message || 'Неизвестная ошибка'}`
      });
      
      setTimeout(() => {
        setTestResult(null);
      }, 5000);
    } catch (e) {
      setTestResult({
        success: false,
        message: 'Ошибка при отправке тестового сообщения'
      });
    } finally {
      setLoading(false);
    }
  };
};

interface TelegramSettings {
  botToken: string;
  chatId: string;
  notifyNewTask: boolean;
  notifyTaskDeadline: boolean;
  notifyNewDeal: boolean;
}

const Settings: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [telegramSettings, setTelegramSettings] = useState<TelegramSettings>({
    botToken: '',
    chatId: '',
    notifyNewTask: true,
    notifyTaskDeadline: true,
    notifyNewDeal: true
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        // В реальном приложении здесь будет запрос к API
        // const response = await apiService.getTelegramSettings();
        // setTelegramSettings(response.data);
        
        // Имитация загрузки данных
        setTimeout(() => {
          setTelegramSettings({
            botToken: process.env.REACT_APP_TELEGRAM_BOT_TOKEN || localStorage.getItem('telegram_bot_token') || '',
            chatId: process.env.REACT_APP_TELEGRAM_CHAT_ID || localStorage.getItem('telegram_chat_id') || '',
            notifyNewTask: localStorage.getItem('notify_new_task') !== 'false',
            notifyTaskDeadline: localStorage.getItem('notify_task_deadline') !== 'false',
            notifyNewDeal: localStorage.getItem('notify_new_deal') !== 'false'
          });
          setLoading(false);
        }, 1000);
        
      } catch (error) {
        console.error('Error fetching telegram settings:', error);
        setSnackbar({
          open: true,
          message: 'Ошибка при загрузке настроек Telegram',
          severity: 'error'
        });
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    setTelegramSettings({
      ...telegramSettings,
      [name]: name.startsWith('notify') ? checked : value
    });
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // В реальном приложении здесь будет запрос к API
      // await apiService.updateTelegramSettings(telegramSettings);
      
      // Сохраняем настройки в localStorage для демо
      localStorage.setItem('telegram_bot_token', telegramSettings.botToken);
      localStorage.setItem('telegram_chat_id', telegramSettings.chatId);
      localStorage.setItem('notify_new_task', String(telegramSettings.notifyNewTask));
      localStorage.setItem('notify_task_deadline', String(telegramSettings.notifyTaskDeadline));
      localStorage.setItem('notify_new_deal', String(telegramSettings.notifyNewDeal));
      
      // Обновление локального сервиса
      telegramService.updateSettings({
        botToken: telegramSettings.botToken,
        chatId: telegramSettings.chatId
      });
      
      setSnackbar({
        open: true,
        message: 'Настройки успешно сохранены',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error saving telegram settings:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка при сохранении настроек',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async () => {
    setTesting(true);
    try {
      // Обновление настроек в телеграм-сервисе перед тестированием
      telegramService.updateSettings({
        botToken: telegramSettings.botToken,
        chatId: telegramSettings.chatId
      });
        const result = await telegramService.testConnection();
      
      if (result.success) {
        setSnackbar({
          open: true,
          message: 'Тестовое уведомление успешно отправлено',
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: `Ошибка при отправке уведомления: ${result.error}`,
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка при отправке тестового уведомления',
        severity: 'error'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 150px)' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
        Настройки
      </Typography>
      
      <Paper sx={{ width: '100%', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            icon={<SettingsIcon />} 
            iconPosition="start" 
            label={
              <Typography sx={{ display: { xs: 'none', sm: 'block' } }}>Общие настройки</Typography>
            } 
          />
          <Tab 
            icon={<TelegramIcon />} 
            iconPosition="start" 
            label={
              <Typography sx={{ display: { xs: 'none', sm: 'block' } }}>Уведомления Telegram</Typography>
            } 
          />
          <Tab 
            icon={<HelpOutlineIcon />} 
            iconPosition="start" 
            label={
              <Typography sx={{ display: { xs: 'none', sm: 'block' } }}>Помощь</Typography>
            } 
          />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Общие настройки системы
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card elevation={0} variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Информация о пользователе</strong>
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar>A</Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary="Администратор" 
                        secondary="admin@example.com" 
                      />
                    </ListItem>
                  </List>
                  <Box mt={1}>
                    <Button variant="outlined" size="small">
                      Изменить профиль
                    </Button>
                  </Box>
                </CardContent>
              </Card>
              
              <Card elevation={0} variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Настройки интерфейса</strong>
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={true}
                        name="darkMode"
                        color="primary"
                      />
                    }
                    label="Темный режим"
                  />
                  <Box mt={2}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={true}
                          name="compactView"
                          color="primary"
                        />
                      }
                      label="Компактный вид списков"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card elevation={0} variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Региональные настройки</strong>
                  </Typography>
                  <Grid container spacing={2} mt={1}>
                    <Grid item xs={12}>
                      <TextField
                        select
                        fullWidth
                        label="Часовой пояс"
                        value="Europe/Moscow"
                        SelectProps={{
                          native: true,
                        }}
                      >
                        <option value="Europe/Moscow">Москва (GMT+3)</option>
                        <option value="Asia/Yekaterinburg">Екатеринбург (GMT+5)</option>
                        <option value="Asia/Novosibirsk">Новосибирск (GMT+7)</option>
                      </TextField>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        select
                        fullWidth
                        label="Формат даты"
                        value="dd.MM.yyyy"
                        SelectProps={{
                          native: true,
                        }}
                      >
                        <option value="dd.MM.yyyy">DD.MM.YYYY</option>
                        <option value="MM/dd/yyyy">MM/DD/YYYY</option>
                        <option value="yyyy-MM-dd">YYYY-MM-DD</option>
                      </TextField>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              
              <Card elevation={0} variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Настройки безопасности</strong>
                  </Typography>
                  <Box mt={2}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={true}
                          name="emailNotifications"
                          color="primary"
                        />
                      }
                      label="Уведомления по email"
                    />
                  </Box>
                  <Box mt={2}>
                    <Button 
                      variant="contained" 
                      color="secondary"
                    >
                      Изменить пароль
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                Настройки уведомлений Telegram
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Токен бота Telegram"
                    name="botToken"
                    value={telegramSettings.botToken}
                    onChange={handleSettingsChange}
                    placeholder="Введите токен бота"
                    helperText={
                      <Typography variant="caption">
                        Создайте бота через BotFather и скопируйте токен
                        <Button 
                          variant="text" 
                          size="small" 
                          component="a" 
                          href="https://t.me/BotFather" 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          Открыть BotFather
                        </Button>
                      </Typography>
                    }
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="ID чата или группы"
                    name="chatId"
                    value={telegramSettings.chatId}
                    onChange={handleSettingsChange}
                    placeholder="Введите ID чата или группы"
                    helperText="Для получения ID чата или группы напишите боту @getmyid_bot"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Типы уведомлений
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={telegramSettings.notifyNewTask}
                          onChange={handleSettingsChange}
                          name="notifyNewTask"
                          color="primary"
                        />
                      }
                      label="Новые задачи"
                    />
                  </Box>
                  
                  <Box sx={{ mt: 1 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={telegramSettings.notifyTaskDeadline}
                          onChange={handleSettingsChange}
                          name="notifyTaskDeadline"
                          color="primary"
                        />
                      }
                      label="Приближающиеся сроки задач"
                    />
                  </Box>
                  
                  <Box sx={{ mt: 1 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={telegramSettings.notifyNewDeal}
                          onChange={handleSettingsChange}
                          name="notifyNewDeal"
                          color="primary"
                        />
                      }
                      label="Новые сделки"
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveSettings}
                    disabled={saving}
                    fullWidth
                  >
                    {saving ? <CircularProgress size={24} /> : 'Сохранить настройки'}
                  </Button>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<NotificationsIcon />}
                    onClick={handleTestNotification}
                    disabled={testing || !telegramSettings.botToken || !telegramSettings.chatId}
                    fullWidth
                  >
                    {testing ? <CircularProgress size={24} /> : 'Отправить тестовое уведомление'}
                  </Button>
                </Grid>
              </Grid>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Инструкция по настройке Telegram-бота
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="body2" paragraph>
                    <strong>Шаг 1:</strong> Создайте нового бота через @BotFather в Telegram
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Шаг 2:</strong> Получите токен бота и вставьте его в поле "Токен бота Telegram"
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Шаг 3:</strong> Добавьте бота в чат или группу, куда нужно отправлять уведомления
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Шаг 4:</strong> Получите ID чата через @getmyid_bot и вставьте его в поле "ID чата или группы"
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Шаг 5:</strong> Нажмите "Сохранить настройки" и протестируйте отправку уведомлений
                  </Typography>
                  
                  <Typography variant="subtitle2" sx={{ mt: 2 }} color="primary">
                    Важно:
                  </Typography>
                  <Typography variant="body2">
                    Не забудьте выдать боту права администратора в группе, если хотите отправлять уведомления в группу Telegram.
                  </Typography>
                </CardContent>
              </Card>
              
              <Box mt={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Пример уведомления
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    <Paper 
                      elevation={0} 
                      variant="outlined"
                      sx={{ 
                        p: 2, 
                        borderRadius: 2,
                        bgcolor: '#F5F5F5'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <Avatar sx={{ mr: 1, bgcolor: 'primary.main' }}>
                          <NotificationsIcon fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            🔔 Новая задача в CRM
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>Задача:</strong> Позвонить клиенту<br />
                            <strong>Ответственный:</strong> Иванов И.И.<br />
                            <strong>Срок:</strong> 10.05.2025 15:00<br />
                            <strong>Клиент:</strong> ООО "Солнечный Дом"<br />
                            <strong>ID задачи:</strong> TASK-123
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </CardContent>
                </Card>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Справка по работе с системой
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} gutterBottom>
                    Документация API
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Полная документация по API системы доступна через Swagger UI.
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary"
                    component="a"
                    href="/api/docs"
                    target="_blank"
                  >
                    Открыть документацию API
                  </Button>
                </CardContent>
              </Card>
              
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} gutterBottom>
                    Контактная информация
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Техническая поддержка" 
                        secondary="support@solartrade.com" 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Телефон" 
                        secondary="+7 (999) 123-45-67" 
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} gutterBottom>
                    Часто задаваемые вопросы
                  </Typography>
                  
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 2 }}>
                    Как добавить нового клиента?
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Перейдите в раздел "Клиенты" и нажмите кнопку "Добавить клиента". Заполните необходимые поля и сохраните изменения.
                  </Typography>
                  
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 2 }}>
                    Как создать новую задачу?
                  </Typography>
                  <Typography variant="body2" paragraph>
                    В разделе "Задачи" нажмите кнопку "Создать задачу". Укажите название, описание, дедлайн и ответственного. При необходимости привяжите задачу к клиенту или сделке.
                  </Typography>
                  
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 2 }}>
                    Как настроить уведомления?
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Перейдите в раздел "Настройки" и выберите вкладку "Уведомления Telegram". Следуйте инструкции по созданию и настройке бота.
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <Chip
                      label="Версия системы: 1.0.0"
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
      
      <Snackbar 
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;