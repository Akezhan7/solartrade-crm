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
  Card,
  CardContent,
  Chip,
  Stack,
  Divider,
  Snackbar,
  Alert,
  FormControlLabel,
  Switch,
  LinearProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';
import { Deal, DealStatus, Client } from '../types';
import apiService from '../utils/apiService';
import telegramService from '../utils/telegramService';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

// Карта статусов сделок
const dealStatusMap: Record<DealStatus, { label: string; color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' }> = {
  NEW: { label: 'Новая', color: 'info' },
  NEGOTIATION: { label: 'Переговоры', color: 'primary' },
  PROPOSAL: { label: 'Предложение', color: 'secondary' },
  AGREEMENT: { label: 'Договор', color: 'info' },
  PAID: { label: 'Оплата', color: 'warning' },
  INSTALLATION: { label: 'Монтаж', color: 'warning' },
  COMPLETED: { label: 'Завершена', color: 'success' },
  CANCELLED: { label: 'Отменена', color: 'error' }
};

// Интерфейс фильтров сделок
interface DealFilters {
  status: DealStatus | 'ALL';
  managerId: string | 'ALL';
  clientId: string | 'ALL';
}

const Deals: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<DealFilters>({
    status: 'ALL',
    managerId: 'ALL',
    clientId: 'ALL'
  });
  
  // Состояние для модальных окон
  const [openNewDealDialog, setOpenNewDealDialog] = useState(false);
  const [openDealDetailsDialog, setOpenDealDetailsDialog] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  
  // Состояния для списков сущностей
  const [clients, setClients] = useState<Client[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  
  // Состояние для уведомлений
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });
  
  // Состояние для новой сделки
  const [newDeal, setNewDeal] = useState({
    title: '',
    description: '',
    amount: '',
    clientId: '',
    managerId: '',
    status: 'NEW' as DealStatus,
    probability: 50,
    estimatedClosingDate: '',
    source: '',
    sendTelegramNotification: true
  });

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    fetchData();
  }, []);

  // Эффект для открытия сделки по ID из URL
  useEffect(() => {
    if (id && deals.length > 0) {
      const deal = deals.find(deal => deal.id === id);
      if (deal) {
        setSelectedDeal(deal);
        setOpenDealDetailsDialog(true);
      }
    }
  }, [id, deals]);
  // Загрузка данных с сервера
  const fetchData = async () => {
    setLoading(true);
    try {
      // Загружаем клиентов и пользователей до сделок, так как нам нужна эта информация
      // для обогащения данных сделок
      console.log('Загрузка данных клиентов...');
      const clientsResponse = await apiService.getClients();
      setClients(clientsResponse);
      console.log(`Загружено ${clientsResponse.length} клиентов`);
      
      console.log('Загрузка данных пользователей...');
      const usersResponse = await apiService.getUsers();
      setManagers(usersResponse);
      console.log(`Загружено ${usersResponse.length} пользователей`);
      
      // Теперь загружаем сделки и обогащаем их данными о клиентах и менеджерах
      console.log('Загрузка данных сделок...');
      const dealsResponse = await apiService.getDeals();
      console.log(`Загружено ${dealsResponse.length} сделок:`, dealsResponse);
      
      // Обогащаем данные сделок
      const enrichedDeals = dealsResponse.map((deal: any) => {
        const client = clientsResponse.find((client: any) => client.id === deal.clientId);
        const manager = usersResponse.find((user: any) => user.id === deal.managerId);
        
        return {
          ...deal,
          clientName: client?.name || 'Неизвестный клиент',
          managerName: manager?.name || 'Неизвестный менеджер'
        };
      });
      
      console.log('Обогащенные данные сделок:', enrichedDeals);
      setDeals(enrichedDeals);
      setLoading(false);
    } catch (error: any) {
      console.error('Error loading data:', error);
      setNotification({
        open: true,
        message: `Ошибка при загрузке данных: ${error.response?.data?.message || error.message || 'Неизвестная ошибка'}`,
        severity: 'error'
      });
      setLoading(false);
    }
  };
  // Обработчик создания новой сделки
  const handleCreateDeal = async () => {
    // Проверяем обязательные поля
    if (!newDeal.title || !newDeal.clientId || !newDeal.managerId || !newDeal.amount) {
      setNotification({
        open: true,
        message: 'Пожалуйста, заполните все обязательные поля',
        severity: 'error'
      });
      return;
    }

    try {
      // Создаем объект с данными сделки для API
      const dealData = {
        title: newDeal.title,
        description: newDeal.description,
        amount: parseFloat(newDeal.amount),
        clientId: newDeal.clientId,
        managerId: newDeal.managerId,
        status: newDeal.status,
        probability: newDeal.probability,
        estimatedClosingDate: newDeal.estimatedClosingDate || undefined,
        source: newDeal.source || undefined
      };
      
      console.log('Отправляем данные для создания сделки:', dealData);
      
      // Отправляем запрос на создание сделки
      const createdDeal = await apiService.createDeal(dealData);
      console.log('Созданная сделка:', createdDeal);
      
      // Дополняем данные сделки для отображения в UI
      const clientName = clients.find(c => c.id === createdDeal.clientId)?.name || 'Неизвестный клиент';
      const managerName = managers.find(m => m.id === createdDeal.managerId)?.name || 'Неизвестный менеджер';
      
      const enrichedDeal = {
        ...createdDeal,
        clientName,
        managerName
      };
      
      // Отправляем уведомление в Telegram, если включено
      if (newDeal.sendTelegramNotification) {
        try {
          // Используем новый метод для отправки уведомления о сделке
          await telegramService.sendNewDealNotification({
            dealId: createdDeal.id,
            dealTitle: createdDeal.title,
            amount: parseFloat(newDeal.amount),
            clientName,
            managerName
          });
        } catch (telegramError) {
          console.error('Error sending Telegram notification:', telegramError);
        }
      }
      
      // Обновляем список сделок
      setDeals([...deals, enrichedDeal]);
      
      // Закрываем диалог и сбрасываем форму
      setOpenNewDealDialog(false);
      setNewDeal({
        title: '',
        description: '',
        amount: '',
        clientId: '',
        managerId: '',
        status: 'NEW',
        probability: 50,
        estimatedClosingDate: '',
        source: '',
        sendTelegramNotification: true
      });
      
      // Показываем уведомление об успехе
      setNotification({
        open: true,
        message: 'Сделка успешно создана',
        severity: 'success'
      });
    } catch (error: any) {
      console.error('Error creating deal:', error);
      setNotification({
        open: true,
        message: `Ошибка при создании сделки: ${error.response?.data?.message || error.message || 'Неизвестная ошибка'}`,
        severity: 'error'
      });
    }
  };
  // Обработчик обновления статуса сделки
  const handleUpdateDealStatus = async (dealId: string, newStatus: DealStatus) => {
    try {
      console.log(`Обновление статуса сделки ${dealId} на ${newStatus}`);
      
      // Находим текущую сделку для сохранения ее данных
      const currentDeal = deals.find(deal => deal.id === dealId);
      if (!currentDeal) {
        throw new Error(`Сделка с ID ${dealId} не найдена`);
      }
      
      // Обновляем статус сделки через API
      const updatedDeal = await apiService.updateDeal(dealId, { status: newStatus });
      
      // Убеждаемся, что у обновленной сделки сохранены clientName и managerName
      const enrichedUpdatedDeal = {
        ...updatedDeal,
        clientName: currentDeal.clientName,
        managerName: currentDeal.managerName
      };
      
      console.log('Обновленная сделка:', enrichedUpdatedDeal);
      
      // Обновляем список сделок
      setDeals(deals.map(deal => deal.id === dealId ? enrichedUpdatedDeal : deal));
      
      // Если обновляемая сделка выбрана, обновляем и ее
      if (selectedDeal && selectedDeal.id === dealId) {
        setSelectedDeal(enrichedUpdatedDeal);
      }
      
      setNotification({
        open: true,
        message: `Статус сделки изменен на "${dealStatusMap[newStatus].label}"`,
        severity: 'success'
      });
    } catch (error: any) {
      console.error('Error updating deal status:', error);
      setNotification({
        open: true,
        message: `Ошибка при обновлении статуса сделки: ${error.response?.data?.message || error.message || 'Неизвестная ошибка'}`,
        severity: 'error'
      });
    }
  };
  // Обработчик удаления сделки
  const handleDeleteDeal = async (dealId: string) => {
    // Подтверждение удаления
    if (!window.confirm('Вы уверены, что хотите удалить эту сделку?')) {
      return;
    }
    
    try {
      console.log(`Удаление сделки с ID: ${dealId}`);
      
      // Находим сделку для отображения информации в уведомлении
      const dealToDelete = deals.find(deal => deal.id === dealId);
      
      if (!dealToDelete) {
        throw new Error(`Сделка с ID ${dealId} не найдена`);
      }
      
      // Отправляем запрос на удаление сделки
      const result = await apiService.deleteDeal(dealId);
      console.log('Ответ при удалении сделки:', result);
      
      // Обновляем список сделок
      setDeals(deals.filter(deal => deal.id !== dealId));
      
      // Если удаляемая сделка выбрана, закрываем диалог
      if (selectedDeal && selectedDeal.id === dealId) {
        setSelectedDeal(null);
        setOpenDealDetailsDialog(false);
        navigate('/deals');
      }
      
      setNotification({
        open: true,
        message: `Сделка "${dealToDelete.title}" успешно удалена`,
        severity: 'success'
      });
    } catch (error: any) {
      console.error('Error deleting deal:', error);
      setNotification({
        open: true,
        message: `Ошибка при удалении сделки: ${error.response?.data?.message || error.message || 'Неизвестная ошибка'}`,
        severity: 'error'
      });
    }
  };
  // Фильтрация сделок
  const filteredDeals = deals.filter(deal => {
    // Проверка на корректность данных
    if (!deal) return false;
    
    // Фильтр по поиску с защитой от undefined
    const searchMatch = !searchTerm || 
      (deal.title && deal.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (deal.description && deal.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (deal.clientName && deal.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (deal.source && deal.source.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (deal.productInfo && deal.productInfo.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Фильтр по статусу
    const statusMatch = filters.status === 'ALL' || deal.status === filters.status;
    
    // Фильтр по менеджеру
    const managerMatch = filters.managerId === 'ALL' || deal.managerId === filters.managerId;
    
    // Фильтр по клиенту
    const clientMatch = filters.clientId === 'ALL' || deal.clientId === filters.clientId;
    
    return searchMatch && statusMatch && managerMatch && clientMatch;
  });

  // Форматирование суммы сделки
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Колонки для таблицы сделок
  const columns: GridColDef[] = [
    {
      field: 'title',
      headerName: 'Название',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'clientName',
      headerName: 'Клиент',
      flex: 0.8,
      minWidth: 150,
    },
    {
      field: 'amount',
      headerName: 'Сумма',
      flex: 0.5,
      minWidth: 120,
      valueFormatter: (params) => formatAmount(params.value),
    },
    {
      field: 'status',
      headerName: 'Статус',
      flex: 0.5,
      minWidth: 120,
      renderCell: (params) => (
        <Chip 
          label={dealStatusMap[params.value as DealStatus].label} 
          color={dealStatusMap[params.value as DealStatus].color}
          size="small" 
        />
      ),
    },
    {
      field: 'estimatedClosingDate',
      headerName: 'Дата закрытия',
      flex: 0.6,
      minWidth: 120,
      valueFormatter: (params) => params.value ? format(new Date(params.value), 'dd.MM.yyyy') : '',
    },
    {
      field: 'managerName',
      headerName: 'Менеджер',
      flex: 0.6,
      minWidth: 130,
    },
    {
      field: 'actions',
      headerName: 'Действия',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton 
          color="primary" 
          onClick={() => {
            const deal = deals.find(deal => deal.id === params.row.id);
            if (deal) {
              setSelectedDeal(deal);
              setOpenDealDetailsDialog(true);
              navigate(`/deals/${deal.id}`);
            }
          }}
        >
          <VisibilityIcon />
        </IconButton>
      ),
    },
  ];

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Сделки
      </Typography>

      <Box sx={{ mb: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}>
        <TextField
          label="Поиск сделок"
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
          onClick={() => setOpenNewDealDialog(true)}
        >
          Новая сделка
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Фильтры
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Статус</InputLabel>
              <Select
                value={filters.status}
                label="Статус"
                onChange={(e) => setFilters({ ...filters, status: e.target.value as DealStatus | 'ALL' })}
              >
                <MenuItem value="ALL">Все статусы</MenuItem>
                {Object.entries(dealStatusMap).map(([status, info]) => (
                  <MenuItem key={status} value={status}>
                    {info.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Менеджер</InputLabel>
              <Select
                value={filters.managerId}
                label="Менеджер"
                onChange={(e) => setFilters({ ...filters, managerId: e.target.value as string })}
              >
                <MenuItem value="ALL">Все менеджеры</MenuItem>
                {managers.map((manager) => (
                  <MenuItem key={manager.id} value={manager.id}>
                    {manager.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Клиент</InputLabel>
              <Select
                value={filters.clientId}
                label="Клиент"
                onChange={(e) => setFilters({ ...filters, clientId: e.target.value as string })}
              >
                <MenuItem value="ALL">Все клиенты</MenuItem>
                {clients.map((client) => (
                  <MenuItem key={client.id} value={client.id}>
                    {client.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ height: 'calc(100vh - 300px)', width: '100%' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {isMobile ? (
              // Мобильный вид - карточки
              <Box sx={{ p: 1 }}>
                {filteredDeals.length === 0 ? (
                  <Typography variant="body1" sx={{ p: 2, textAlign: 'center' }}>
                    Сделки не найдены
                  </Typography>
                ) : (
                  <Stack spacing={2}>
                    {filteredDeals.map((deal) => (
                      <Card 
                        key={deal.id} 
                        sx={{ cursor: 'pointer' }} 
                        onClick={() => {
                          setSelectedDeal(deal);
                          setOpenDealDetailsDialog(true);
                          navigate(`/deals/${deal.id}`);
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Typography variant="h6" sx={{ mr: 2 }}>
                              {deal.title}
                            </Typography>
                            <Chip 
                              label={dealStatusMap[deal.status].label} 
                              color={dealStatusMap[deal.status].color}
                              size="small" 
                            />
                          </Box>
                          
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {deal.clientName}
                          </Typography>
                          
                          <Typography variant="h6" color="primary">
                            {formatAmount(deal.amount)}
                          </Typography>
                          
                          <Divider sx={{ my: 1 }} />
                          
                          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                            <Typography variant="caption">
                              Менеджер: {deal.managerName}
                            </Typography>
                            
                            {deal.estimatedClosingDate && (
                              <Typography variant="caption">
                                {format(new Date(deal.estimatedClosingDate), 'dd.MM.yyyy')}
                              </Typography>
                            )}
                          </Stack>
                          
                          <Box sx={{ mt: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={deal.probability} 
                              color={deal.probability > 75 ? 'success' : deal.probability > 50 ? 'primary' : 'warning'}
                            />
                            <Typography variant="caption" display="block" sx={{ textAlign: 'right', mt: 0.5 }}>
                              Вероятность: {deal.probability}%
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Box>
            ) : (
              // Десктопный вид - таблица
              <DataGrid
                rows={filteredDeals}
                columns={columns}
                initialState={{
                  pagination: {
                    paginationModel: { page: 0, pageSize: 25 },
                  },
                  sorting: {
                    sortModel: [{ field: 'updatedAt', sort: 'desc' }],
                  },
                }}
                pageSizeOptions={[10, 25, 50]}
                disableRowSelectionOnClick
                autoHeight
              />
            )}
          </>
        )}
      </Paper>

      {/* Диалог создания новой сделки */}
      <Dialog open={openNewDealDialog} onClose={() => setOpenNewDealDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Создание новой сделки</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Название сделки"
                variant="outlined"
                fullWidth
                required
                value={newDeal.title}
                onChange={(e) => setNewDeal({ ...newDeal, title: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Описание"
                variant="outlined"
                fullWidth
                multiline
                rows={3}
                value={newDeal.description}
                onChange={(e) => setNewDeal({ ...newDeal, description: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Сумма"
                variant="outlined"
                fullWidth
                required
                type="number"
                InputProps={{
                  endAdornment: <InputAdornment position="end">₽</InputAdornment>,
                }}
                value={newDeal.amount}
                onChange={(e) => setNewDeal({ ...newDeal, amount: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Статус</InputLabel>
                <Select
                  value={newDeal.status}
                  label="Статус"
                  onChange={(e) => setNewDeal({ ...newDeal, status: e.target.value as DealStatus })}
                >
                  {Object.entries(dealStatusMap).map(([status, info]) => (
                    <MenuItem key={status} value={status}>
                      {info.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Клиент</InputLabel>
                <Select
                  value={newDeal.clientId}
                  label="Клиент"
                  onChange={(e) => setNewDeal({ ...newDeal, clientId: e.target.value })}
                >
                  <MenuItem value="">Выберите клиента</MenuItem>
                  {clients.map((client) => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Менеджер</InputLabel>
                <Select
                  value={newDeal.managerId}
                  label="Менеджер"
                  onChange={(e) => setNewDeal({ ...newDeal, managerId: e.target.value })}
                >
                  <MenuItem value="">Выберите менеджера</MenuItem>
                  {managers.map((manager) => (
                    <MenuItem key={manager.id} value={manager.id}>
                      {manager.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Планируемая дата закрытия"
                variant="outlined"
                fullWidth
                type="date"
                InputLabelProps={{ shrink: true }}
                value={newDeal.estimatedClosingDate}
                onChange={(e) => setNewDeal({ ...newDeal, estimatedClosingDate: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Вероятность закрытия (%)"
                variant="outlined"
                fullWidth
                type="number"
                value={newDeal.probability}
                onChange={(e) => setNewDeal({ ...newDeal, probability: parseInt(e.target.value) || 0 })}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Источник сделки"
                variant="outlined"
                fullWidth
                placeholder="Например: Реклама в интернете, Рекомендация, Холодный звонок и т.д."
                value={newDeal.source}
                onChange={(e) => setNewDeal({ ...newDeal, source: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newDeal.sendTelegramNotification}
                    onChange={(e) => setNewDeal({ ...newDeal, sendTelegramNotification: e.target.checked })}
                  />
                }
                label="Отправить уведомление в Telegram"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewDealDialog(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleCreateDeal}>Создать</Button>
        </DialogActions>
      </Dialog>      {/* Диалог просмотра сделки */}
      {selectedDeal && (
        <Dialog 
          open={openDealDetailsDialog} 
          onClose={() => {
            setOpenDealDetailsDialog(false);
            setSelectedDeal(null);
            navigate('/deals');
          }} 
          maxWidth="md" 
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">{selectedDeal.title}</Typography>
              <Chip 
                label={dealStatusMap[selectedDeal.status].label} 
                color={dealStatusMap[selectedDeal.status].color}
              />
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              {selectedDeal.description && (
                <Grid item xs={12}>
                  <Typography variant="body1" paragraph>
                    {selectedDeal.description}
                  </Typography>
                  <Divider />
                </Grid>
              )}
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Клиент:
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedDeal.clientName}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Менеджер:
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedDeal.managerName}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Сумма:
                </Typography>
                <Typography variant="h6" color="primary" gutterBottom>
                  {formatAmount(selectedDeal.amount)}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Вероятность закрытия:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                  <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={selectedDeal.probability} 
                      color={selectedDeal.probability > 75 ? 'success' : selectedDeal.probability > 50 ? 'primary' : 'warning'}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {selectedDeal.probability}%
                  </Typography>
                </Box>
              </Grid>
              
              {selectedDeal.estimatedClosingDate && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Планируемая дата закрытия:
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {format(new Date(selectedDeal.estimatedClosingDate), 'dd MMMM yyyy', { locale: ru })}
                  </Typography>
                </Grid>
              )}
              
              {selectedDeal.actualClosingDate && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Фактическая дата закрытия:
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {format(new Date(selectedDeal.actualClosingDate), 'dd MMMM yyyy', { locale: ru })}
                  </Typography>
                </Grid>
              )}
              
              {selectedDeal.source && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Источник:
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedDeal.source}
                  </Typography>
                </Grid>
              )}
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Изменить статус
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
                  {Object.entries(dealStatusMap).map(([status, info]) => (
                    <Button
                      key={status}
                      variant={selectedDeal.status === status ? 'contained' : 'outlined'}
                      color={info.color === 'default' ? 'primary' : info.color}
                      disabled={selectedDeal.status === status}
                      onClick={() => handleUpdateDealStatus(selectedDeal.id, status as DealStatus)}
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
              onClick={() => handleDeleteDeal(selectedDeal.id)}
            >
              Удалить
            </Button>
            <Button onClick={() => {
              setOpenDealDetailsDialog(false);
              setSelectedDeal(null);
              navigate('/deals');
            }}>
              Закрыть
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Уведомления */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setNotification({ ...notification, open: false })} 
          severity={notification.severity} 
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Deals;