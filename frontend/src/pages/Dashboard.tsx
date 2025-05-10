import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Card, 
  CardContent, 
  CardHeader, 
  Divider, 
  List, 
  ListItem, 
  ListItemText, 
  Button,
  ListItemAvatar,
  Avatar,
  IconButton,
  Chip,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Skeleton,
  Tabs,
  Tab,
  Fab,
  BottomNavigation,
  BottomNavigationAction,
  CardActionArea,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  ListItemButton,
  ListItemIcon,
  TableContainer,
  Container,
  Checkbox
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { 
  PeopleAlt as PeopleAltIcon, 
  Assignment as AssignmentIcon, 
  AttachMoney as AttachMoneyIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,  ArrowForward as ArrowForwardIcon,
  Add as AddIcon,
  Dashboard as DashboardIcon,
  Refresh as RefreshIcon,
  BusinessCenter as BusinessCenterIcon,
  Person as PersonIcon,
  MoreVert as MoreVertIcon,
  BarChart as BarChartIcon,
  PhoneAndroid as PhoneAndroidIcon,
  Email as EmailIcon,
  LocalOffer as LocalOfferIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccessTime as AccessTimeIcon,
  NotificationsActive as NotificationsActiveIcon,
  CalendarToday as CalendarTodayIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement,
  LineElement,
  ArcElement,
  Title, 
  Tooltip as ChartTooltip, 
  Legend 
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

import apiService from '../utils/apiService';
import { Task, Deal, Client } from '../types';

// Регистрируем компоненты для Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend
);

// Типы для данных дашборда
interface DashboardData {
  totalClients: number;
  newClientsThisMonth: number;
  totalDeals: number;
  activeDealCount: number;
  totalRevenue: number;
  activeTaskCount: number;
  completedTaskCount: number;
  activeTasks: Task[];
  upcomingDeals: Deal[];
  topClients: Client[];
  revenueByMonth: {
    labels: string[];
    data: number[];
  };
  dealsByStatus: {
    labels: string[];
    data: number[];
  };
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery('(max-width:600px)');
  
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [tabIndex, setTabIndex] = useState(0);

  // Цвета для графиков
  const chartColors = {
    revenue: theme.palette.primary.main,
    deals: theme.palette.secondary.main,
    tasks: theme.palette.success.main,
    clients: theme.palette.info.main
  };

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    fetchDashboardData();
  }, []);  // Загрузка данных дашборда
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Получаем данные через API
      const dashboardResult = await apiService.getDashboardData();
      const latestClientsData = await apiService.getLatestClients(5);
      
      // Объединяем данные
      const dashboardData = {
        ...dashboardResult.stats,
        activeTasks: dashboardResult.activeTasks || [],
        upcomingDeals: dashboardResult.upcomingDeals || [],
        topClients: latestClientsData || [],
        revenueByMonth: dashboardResult.revenueByMonth || {
          labels: ['Янв', 'Фев', 'Март', 'Апр', 'Май', 'Июнь'],
          data: [0, 0, 0, 0, 0, 0]
        },
        dealsByStatus: dashboardResult.dealsByStatus || {
          labels: ['Новые', 'В работе', 'Завершенные', 'Отмененные'],
          data: [0, 0, 0, 0]
        }
      };
      
      console.log('Загруженные данные дашборда:', dashboardData);
      setDashboardData(dashboardData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Обработчик смены вкладки
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  // Если данные загружаются, показываем индикатор загрузки
  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Загрузка данных дашборда...
        </Typography>
      </Box>
    );
  }

  // Если данных нет (ошибка загрузки)
  if (!dashboardData) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" color="error" gutterBottom>
          Не удалось загрузить данные дашборда
        </Typography>
        <Button 
          variant="contained" 
          onClick={fetchDashboardData} 
          startIcon={<RefreshIcon />}
          sx={{ mt: 2 }}
        >
          Повторить попытку
        </Button>
      </Box>
    );
  }
  // Настройки для диаграммы выручки по месяцам
  const revenueChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return new Intl.NumberFormat('ru-RU', {
              style: 'currency',
              currency: 'RUB',
              maximumFractionDigits: 0
            }).format(context.parsed.y);
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return new Intl.NumberFormat('ru-RU', {
              style: 'currency',
              currency: 'RUB',
              notation: 'compact',
              maximumFractionDigits: 0
            }).format(value);
          }
        }
      }
    }
  };
  
  // Данные для диаграммы выручки по месяцам
  const revenueChartData = {
    labels: dashboardData.revenueByMonth.labels,
    datasets: [
      {
        label: 'Выручка',
        data: dashboardData.revenueByMonth.data,
        backgroundColor: alpha(chartColors.revenue, 0.5),
        borderColor: chartColors.revenue,
        borderWidth: 2,
      },
    ],
  };
    // Настройки для диаграммы сделок по статусам
  const dealsChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          boxWidth: 15,
          padding: 15
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const dataset = context.dataset;
            const total = dataset.data.reduce((acc: number, data: number) => acc + data, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '50%'
  };
  
  // Данные для диаграммы сделок по статусам
  const dealsChartData = {
    labels: dashboardData.dealsByStatus.labels,
    datasets: [
      {
        label: 'Сделки',
        data: dashboardData.dealsByStatus.data,
        backgroundColor: [
          '#4CAF50', // Зеленый - завершенные
          '#2196F3', // Синий - в работе
          '#FFC107', // Желтый - новые
          '#FF5722', // Оранжевый - отмененные
          '#9C27B0', // Фиолетовый
          '#607D8B', // Серый
          '#E91E63', // Розовый
          '#795548', // Коричневый
        ],
        borderWidth: 1,
        hoverOffset: 10
      },
    ],
  };
  
  // Отображение компонента
  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
      <Typography variant="h4" gutterBottom>
        Дашборд
      </Typography>

      {/* Карточки с основными показателями */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Клиенты */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Клиенты
              </Typography>
              <Avatar sx={{ bgcolor: theme.palette.info.light, width: 32, height: 32 }}>
                <PeopleAltIcon fontSize="small" />
              </Avatar>
            </Box>
            <Typography variant="h5" component="div">
              {dashboardData.totalClients}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <ArrowUpwardIcon sx={{ color: 'success.main', fontSize: '1rem' }} />
              <Typography variant="body2" sx={{ ml: 0.5, color: 'success.main' }}>
                +{dashboardData.newClientsThisMonth} в этом месяце
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        {/* Сделки */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Активные сделки
              </Typography>
              <Avatar sx={{ bgcolor: theme.palette.secondary.light, width: 32, height: 32 }}>
                <BusinessCenterIcon fontSize="small" />
              </Avatar>
            </Box>
            <Typography variant="h5" component="div">
              {dashboardData.activeDealCount}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Всего {dashboardData.totalDeals} сделок
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        {/* Выручка */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Выручка
              </Typography>
              <Avatar sx={{ bgcolor: theme.palette.primary.light, width: 32, height: 32 }}>
                <AttachMoneyIcon fontSize="small" />
              </Avatar>
            </Box>
            <Typography variant="h5" component="div">
              {new Intl.NumberFormat('ru-RU', {
                style: 'currency',
                currency: 'RUB',
                maximumFractionDigits: 0
              }).format(dashboardData.totalRevenue)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <ArrowForwardIcon sx={{ color: 'info.main', fontSize: '1rem' }} />
              <Typography variant="body2" sx={{ ml: 0.5, color: 'info.main' }}>
                Прогноз выполнен на 75%
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        {/* Задачи */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Задачи
              </Typography>
              <Avatar sx={{ bgcolor: theme.palette.success.light, width: 32, height: 32 }}>
                <AssignmentIcon fontSize="small" />
              </Avatar>
            </Box>
            <Typography variant="h5" component="div">
              {dashboardData.activeTaskCount}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <AccessTimeIcon sx={{ color: 'warning.main', fontSize: '1rem' }} />
              <Typography variant="body2" sx={{ ml: 0.5, color: 'warning.main' }}>
                {dashboardData.completedTaskCount} выполнено
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Основные графики и списки */}
      <Grid container spacing={3}>
        {/* Диаграмма выручки */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: isMobile ? 2 : 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Динамика выручки
              </Typography>
              <IconButton size="small">
                <MoreVertIcon />
              </IconButton>
            </Box>
            <Box sx={{ height: 300 }}>
              <Bar options={revenueChartOptions} data={revenueChartData} />
            </Box>
          </Paper>
        </Grid>
        
        {/* Круговая диаграмма сделок */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: isMobile ? 2 : 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Сделки по статусам
              </Typography>
              <IconButton size="small">
                <MoreVertIcon />
              </IconButton>
            </Box>
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
              <Doughnut options={dealsChartOptions} data={dealsChartData} />
            </Box>
          </Paper>
        </Grid>
        
        {/* Мобильные вкладки для контента */}
        {isMobile && (
          <Grid item xs={12}>
            <Paper sx={{ mb: 1 }}>
              <Tabs
                value={tabIndex}
                onChange={handleTabChange}
                variant="fullWidth"
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab label="Задачи" />
                <Tab label="Сделки" />
                <Tab label="Клиенты" />
              </Tabs>
            </Paper>
          </Grid>
        )}
        
        {/* Активные задачи */}
        <Grid item xs={12} md={4} sx={{ display: isMobile ? (tabIndex === 0 ? 'block' : 'none') : 'block' }}>
          <Paper sx={{ p: 0, height: '100%' }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                Активные задачи
              </Typography>
              <Button 
                size="small" 
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/tasks')}
              >
                Все
              </Button>
            </Box>
            <Divider />
            {dashboardData.activeTasks.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Нет активных задач
                </Typography>
              </Box>
            ) : (
              <List disablePadding>
                {dashboardData.activeTasks.map((task, index) => (
                  <React.Fragment key={task.id}>
                    <ListItemButton onClick={() => navigate(`/tasks/${task.id}`)}>
                      <ListItemIcon>
                        <Avatar sx={{ 
                          bgcolor: 
                            task.priority === 'HIGH' ? 'error.light' : 
                            task.priority === 'MEDIUM' ? 'warning.light' : 'success.light',
                          width: 32,
                          height: 32
                        }}>
                          {task.priority === 'HIGH' ? '!' : task.priority === 'MEDIUM' ? '•' : '-'}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText 
                        primary={task.title}
                        secondary={`Срок: ${format(new Date(task.dueDate), 'dd.MM.yyyy')}`}
                        primaryTypographyProps={{
                          variant: 'body2',
                          fontWeight: 500,
                          sx: { 
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                          }
                        }}
                        secondaryTypographyProps={{
                          variant: 'caption'
                        }}
                      />
                    </ListItemButton>
                    {index < dashboardData.activeTasks.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
          {/* Предстоящие сделки */}
        <Grid item xs={12} md={4} sx={{ display: isMobile ? (tabIndex === 1 ? 'block' : 'none') : 'block' }}>
          <Paper sx={{ p: 0, height: '100%' }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                Предстоящие сделки
              </Typography>
              <Button 
                size="small" 
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/deals')}
              >
                Все
              </Button>
            </Box>
            <Divider />
            {!dashboardData.upcomingDeals || dashboardData.upcomingDeals.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Нет предстоящих сделок
                </Typography>
              </Box>
            ) : (
              <List disablePadding>
                {dashboardData.upcomingDeals.map((deal, index) => (
                  <React.Fragment key={deal.id}>                    <ListItemButton onClick={() => navigate(`/deals/${deal.id}`)}>
                      <ListItemIcon>
                        <Avatar sx={{ 
                          bgcolor: deal.status === 'NEW' ? theme.palette.warning.light :
                                  deal.status === 'COMPLETED' ? theme.palette.success.light :
                                  deal.status === 'CANCELLED' ? theme.palette.error.light :
                                  theme.palette.secondary.light,
                          width: 32, 
                          height: 32
                        }}>
                          <BusinessCenterIcon fontSize="small" />
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText 
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography 
                              variant="body2" 
                              fontWeight={500}
                              sx={{ 
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical',
                              }}
                            >
                              {deal.title}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                fontWeight: 'bold',
                                color: theme.palette.text.primary,
                                ml: 1
                              }}
                            >
                              {new Intl.NumberFormat('ru-RU', {
                                style: 'currency',
                                currency: deal.currency || 'RUB',
                                maximumFractionDigits: 0
                              }).format(deal.amount)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                              {deal.clientName}
                            </Typography>
                            {deal.estimatedClosingDate && (
                              <Chip
                                icon={<CalendarTodayIcon style={{ fontSize: '0.7rem' }} />}
                                label={format(new Date(deal.estimatedClosingDate), 'dd.MM.yyyy')}
                                size="small"
                                sx={{ 
                                  ml: 1, 
                                  height: '18px', 
                                  fontSize: '0.65rem',
                                  '& .MuiChip-icon': { 
                                    ml: '4px',
                                    mr: '-4px'
                                  }
                                }}
                                variant="outlined"
                              />
                            )}
                          </Box>
                        }
                        primaryTypographyProps={{
                          sx: { width: '100%' }
                        }}
                      />
                    </ListItemButton>
                    {index < dashboardData.upcomingDeals.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
        
        {/* Топ клиентов */}
        <Grid item xs={12} md={4} sx={{ display: isMobile ? (tabIndex === 2 ? 'block' : 'none') : 'block' }}>
          <Paper sx={{ p: 0, height: '100%' }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                Топ клиентов
              </Typography>
              <Button 
                size="small" 
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/clients')}
              >
                Все
              </Button>
            </Box>
            <Divider />
            {dashboardData.topClients.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Нет данных о клиентах
                </Typography>
              </Box>
            ) : (
              <List disablePadding>
                {dashboardData.topClients.map((client, index) => (
                  <React.Fragment key={client.id}>                    <ListItemButton onClick={() => navigate(`/clients/${client.id}`)}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: theme.palette.info.light }}>
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography 
                              variant="body2" 
                              fontWeight={500}
                              sx={{ 
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical',
                              }}
                            >
                              {client.name}
                            </Typography>
                            {client.dealsCount !== undefined && client.dealsCount > 0 && (
                              <Chip 
                                size="small" 
                                label={`${client.dealsCount} ${client.dealsCount === 1 ? 'сделка' : 
                                  (client.dealsCount >= 2 && client.dealsCount <= 4 ? 'сделки' : 'сделок')}`} 
                                sx={{ 
                                  height: '20px', 
                                  fontSize: '0.7rem', 
                                  ml: 1,
                                  bgcolor: alpha(theme.palette.info.main, 0.1)
                                }} 
                              />
                            )}
                          </Box>
                        }
                        secondary={client.companyName || client.email}
                        secondaryTypographyProps={{
                          variant: 'caption',
                          sx: { 
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                          }
                        }}
                      />
                    </ListItemButton>
                    {index < dashboardData.topClients.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Мобильная панель навигации для быстрого доступа */}
      {isSmallMobile && (
        <Fab 
          color="primary" 
          aria-label="add" 
          sx={{ position: 'fixed', bottom: 80, right: 16 }}
          onClick={() => {
            const options = [
              { title: 'Новая задача', path: '/tasks/new' },
              { title: 'Новая сделка', path: '/deals/new' },
              { title: 'Новый клиент', path: '/clients/new' }
            ];
            const selection = window.prompt(
              'Выберите действие:\n1 - Новая задача\n2 - Новая сделка\n3 - Новый клиент'
            );
            if (selection && ['1', '2', '3'].includes(selection)) {
              const index = parseInt(selection) - 1;
              navigate(options[index].path);
            }
          }}
        >
          <AddIcon />
        </Fab>
      )}
    </Container>
  );
};

export default Dashboard;