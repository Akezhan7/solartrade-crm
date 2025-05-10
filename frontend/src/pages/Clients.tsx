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
  Card,
  CardContent,
  Stack,
  Divider,
  useMediaQuery,
  useTheme,
  Snackbar,
  Alert
} from '@mui/material';
import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import { useNavigate } from 'react-router-dom';
import { Client } from '../types';
import apiService from '../utils/apiService';

const Clients: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [openNewClientDialog, setOpenNewClientDialog] = useState(false);
  
  // Форма создания нового клиента
  const [newClient, setNewClient] = useState({
    name: '',
    phone: '',
    email: '',
    companyName: '',
    inn: '',
    kpp: '',
    address: '',
    bankDetails: ''
  });

  // Состояние для уведомлений
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      // Запрашиваем данные через API сервер
      const response = await apiService.getClients();
      setClients(response);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setLoading(false);
      setNotification({
        open: true,
        message: 'Ошибка при загрузке данных клиентов с сервера',
        severity: 'error'
      });
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleOpenNewClientDialog = () => {
    setOpenNewClientDialog(true);
  };

  const handleCloseNewClientDialog = () => {
    setOpenNewClientDialog(false);
    // Сброс формы
    setNewClient({
      name: '',
      phone: '',
      email: '',
      companyName: '',
      inn: '',
      kpp: '',
      address: '',
      bankDetails: ''
    });
  };

  const handleNewClientChange = (field: string, value: string) => {
    setNewClient({
      ...newClient,
      [field]: value
    });
  };

  const handleCreateClient = async () => {
    // Проверка обязательных полей
    if (!newClient.name || !newClient.phone || !newClient.email) {
      setNotification({
        open: true,
        message: 'Пожалуйста, заполните все обязательные поля',
        severity: 'error'
      });
      return;
    }

    // Подготовка данных для создания клиента
    const clientData: any = {
      name: newClient.name,
      phone: newClient.phone,
      email: newClient.email
    };

    // Если есть данные о компании, добавляем их
    if (newClient.companyName) {
      clientData.company = {
        name: newClient.companyName,
        inn: newClient.inn,
        kpp: newClient.kpp || undefined,
        address: newClient.address,
        bankDetails: newClient.bankDetails || undefined
      };
    }

    try {
      setLoading(true);
      // Создаем клиента через API
      const createdClient = await apiService.createClient(clientData);
      
      // Обновляем список клиентов
      setClients([...clients, createdClient]);
      
      // Закрываем диалог
      handleCloseNewClientDialog();
      
      // Показываем уведомление об успехе
      setNotification({
        open: true,
        message: 'Клиент успешно создан',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error creating client:', error);
      setNotification({
        open: true,
        message: 'Ошибка при создании клиента',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewClient = (id: string) => {
    navigate(`/clients/${id}`);
  };

  // Фильтрация клиентов по поисковому запросу
  const filteredClients = clients.filter(client => {
    const searchLower = searchTerm.toLowerCase();
    return (
      client.name.toLowerCase().includes(searchLower) ||
      client.phone.toLowerCase().includes(searchLower) ||
      client.email.toLowerCase().includes(searchLower) ||
      (client.company?.name && client.company.name.toLowerCase().includes(searchLower)) ||
      (client.company?.inn && client.company.inn.toLowerCase().includes(searchLower))
    );
  });

  // Колонки для таблицы клиентов
  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Имя/название',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'phone',
      headerName: 'Телефон',
      flex: 0.8,
      minWidth: 150,
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 0.8,
      minWidth: 180,
    },
    {
      field: 'companyName',
      headerName: 'Компания',
      flex: 0.8,
      minWidth: 180,
      valueGetter: (params: GridValueGetterParams) => 
        params.row.company ? params.row.company.name : '',
    },
    {
      field: 'actions',
      headerName: 'Действия',
      flex: 0.4,
      minWidth: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton 
          color="primary" 
          onClick={() => handleViewClient(params.row.id)}
        >
          <VisibilityIcon />
        </IconButton>
      ),
    },
  ];

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Клиенты
      </Typography>

      <Box sx={{ mb: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}>
        <TextField
          label="Поиск клиентов"
          variant="outlined"
          size="small"
          fullWidth={isMobile}
          value={searchTerm}
          onChange={handleSearchChange}
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
          onClick={handleOpenNewClientDialog}
        >
          Новый клиент
        </Button>
      </Box>

      <Paper sx={{ height: 'calc(100vh - 220px)', width: '100%' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {isMobile ? (
              // Мобильный вид - карточки
              <Box sx={{ p: 1 }}>
                {filteredClients.length === 0 ? (
                  <Typography variant="body1" sx={{ p: 2, textAlign: 'center' }}>
                    Клиенты не найдены
                  </Typography>
                ) : (
                  <Stack spacing={2}>
                    {filteredClients.map((client) => (
                      <Card key={client.id} sx={{ cursor: 'pointer' }} onClick={() => handleViewClient(client.id)}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            {client.company ? (
                              <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
                            ) : (
                              <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                            )}
                            <Typography variant="h6">{client.name}</Typography>
                          </Box>
                          
                          <Divider sx={{ my: 1 }} />
                          
                          <Stack spacing={1}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <PhoneIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                              <Typography variant="body2">{client.phone}</Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <EmailIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                              <Typography variant="body2">{client.email}</Typography>
                            </Box>
                            
                            {client.company && (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <BusinessIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                                <Typography variant="body2">{client.company.name}</Typography>
                              </Box>
                            )}
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Box>
            ) : (
              // Десктопный вид - таблица
              <DataGrid
                rows={filteredClients}
                columns={columns}
                initialState={{
                  pagination: {
                    paginationModel: { page: 0, pageSize: 25 },
                  },
                  sorting: {
                    sortModel: [{ field: 'name', sort: 'asc' }],
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

      {/* Диалог создания нового клиента */}
      <Dialog open={openNewClientDialog} onClose={handleCloseNewClientDialog} maxWidth="md" fullWidth>
        <DialogTitle>Создание нового клиента</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Основная информация
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Имя/Название"
                variant="outlined"
                fullWidth
                required
                value={newClient.name}
                onChange={(e) => handleNewClientChange('name', e.target.value)}
                placeholder="Например: ООО 'Солнечный дом' или 'Иванов Иван'"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Телефон"
                variant="outlined"
                fullWidth
                required
                value={newClient.phone}
                onChange={(e) => handleNewClientChange('phone', e.target.value)}
                placeholder="+7 (XXX) XXX-XX-XX"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Email"
                variant="outlined"
                fullWidth
                required
                type="email"
                value={newClient.email}
                onChange={(e) => handleNewClientChange('email', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Divider />
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Информация о компании (необязательно)
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Название компании"
                variant="outlined"
                fullWidth
                value={newClient.companyName}
                onChange={(e) => handleNewClientChange('companyName', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="ИНН"
                variant="outlined"
                fullWidth
                value={newClient.inn}
                onChange={(e) => handleNewClientChange('inn', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="КПП"
                variant="outlined"
                fullWidth
                value={newClient.kpp}
                onChange={(e) => handleNewClientChange('kpp', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Юридический адрес"
                variant="outlined"
                fullWidth
                value={newClient.address}
                onChange={(e) => handleNewClientChange('address', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Банковские реквизиты"
                variant="outlined"
                fullWidth
                multiline
                rows={2}
                value={newClient.bankDetails}
                onChange={(e) => handleNewClientChange('bankDetails', e.target.value)}
                placeholder="Например: р/с 40702810123456789012 в ПАО 'Сбербанк'"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewClientDialog}>Отмена</Button>
          <Button variant="contained" onClick={handleCreateClient}>Создать</Button>
        </DialogActions>
      </Dialog>

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

export default Clients;