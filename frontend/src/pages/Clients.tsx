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
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Tooltip,
  Fab,
  Chip,
  Badge,
  Container
} from '@mui/material';
import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import FilterListIcon from '@mui/icons-material/FilterList';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useNavigate } from 'react-router-dom';
import { Client } from '../types';
import apiService from '../utils/apiService';

const Clients: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isSmallMobile = useMediaQuery('(max-width:360px)');
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [openNewClientDialog, setOpenNewClientDialog] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [managers, setManagers] = useState<any[]>([]);
  const [selectedManager, setSelectedManager] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  
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

  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  useEffect(() => {
    const adminCheck = apiService.isAdmin();
    setIsAdmin(adminCheck);
    
    if (adminCheck) {
      fetchManagers();
    }
    
    fetchClients();
  }, []);
  
  const fetchManagers = async () => {
    try {
      const response = await apiService.getUsers();
      const managerUsers = response.filter((user: any) => 
        user.role === 'MANAGER' || user.role === 'ADMIN'
      );
      setManagers(managerUsers);
    } catch (error) {
      console.error('Error fetching managers:', error);
      setNotification({
        open: true,
        message: 'Ошибка при загрузке списка менеджеров',
        severity: 'error'
      });
    }
  };

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await apiService.getClients();
      setClients(response);
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching clients:', error);
      setLoading(false);
      
      if (error.response && error.response.status === 403) {
        setNotification({
          open: true,
          message: 'У вас нет доступа к просмотру этих клиентов',
          severity: 'warning'
        });
      } else {
        setNotification({
          open: true,
          message: 'Ошибка при загрузке данных клиентов с сервера',
          severity: 'error'
        });
      }
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleManagerFilterChange = (event: SelectChangeEvent<string>) => {
    setSelectedManager(event.target.value);
  };

  const getFilteredClients = () => {
    let filtered = clients;
    
    if (searchTerm.trim() !== '') {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(client => 
        client.name.toLowerCase().includes(search) || 
        client.phone.toLowerCase().includes(search) || 
        client.email.toLowerCase().includes(search) ||
        (client.company && client.company.name.toLowerCase().includes(search))
      );
    }
    
    if (isAdmin && selectedManager !== 'all') {
      filtered = filtered.filter(client => client.managerId === selectedManager);
    }
    
    return filtered;
  };

  const filteredClients = getFilteredClients();

  const handleOpenNewClientDialog = () => {
    setOpenNewClientDialog(true);
  };

  const handleCloseNewClientDialog = () => {
    setOpenNewClientDialog(false);
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
    if (!newClient.name || !newClient.phone || !newClient.email) {
      setNotification({
        open: true,
        message: 'Пожалуйста, заполните все обязательные поля',
        severity: 'error'
      });
      return;
    }

    const clientData: any = {
      name: newClient.name,
      phone: newClient.phone,
      email: newClient.email
    };

    if (newClient.companyName) {
      clientData.company = {
        name: newClient.companyName,
        inn: newClient.inn || '',
        kpp: newClient.kpp || '',
        address: newClient.address || '',
        bankDetails: newClient.bankDetails || ''
      };
    }

    try {
      await apiService.createClient(clientData);
      handleCloseNewClientDialog();
      fetchClients();
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
    }
  };

  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };

  const handleViewClient = (id: string) => {
    navigate(`/clients/${id}`);
  };

  const handleCallClient = (phone: string, event: React.MouseEvent) => {
    event.stopPropagation();
    window.location.href = `tel:${phone}`;
  };

  const handleEmailClient = (email: string, event: React.MouseEvent) => {
    event.stopPropagation();
    window.location.href = `mailto:${email}`;
  };

  const columns: GridColDef[] = [
    { 
      field: 'name', 
      headerName: 'Имя/Название', 
      width: 250,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {params.row.company ? (
            <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
          ) : (
            <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
          )}
          <Typography variant="body1">{params.value}</Typography>
        </Box>
      )
    },
    { 
      field: 'phone', 
      headerName: 'Телефон', 
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2">{params.value}</Typography>
          <IconButton
            size="small"
            onClick={(e) => handleCallClient(params.value, e)}
            sx={{ ml: 1 }}
          >
            <PhoneIcon fontSize="small" color="primary" />
          </IconButton>
        </Box>
      )
    },
    { 
      field: 'email', 
      headerName: 'Email', 
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2">{params.value}</Typography>
          <IconButton
            size="small"
            onClick={(e) => handleEmailClient(params.value, e)}
            sx={{ ml: 1 }}
          >
            <EmailIcon fontSize="small" color="primary" />
          </IconButton>
        </Box>
      )
    },
    { 
      field: 'company', 
      headerName: 'Компания', 
      width: 200,
      valueGetter: (params: GridValueGetterParams) => 
        params.row.company ? params.row.company.name : '',
    },
    {
      field: 'actions',
      headerName: 'Действия',
      width: 100,
      renderCell: (params) => (
        <Box>
          <IconButton 
            onClick={() => handleViewClient(params.row.id)}
            size="small"
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ maxWidth: '100%', overflow: 'hidden' }}>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2,
          flexDirection: isMobile ? 'column' : 'row',
        }}
      >
        <Typography 
          variant="h5" 
          sx={{ 
            mb: isMobile ? 2 : 0,
            fontWeight: 500,
            fontSize: { xs: '1.5rem', sm: '1.8rem' } 
          }}
        >
          Клиенты
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, width: isMobile ? '100%' : 'auto' }}>
          {isAdmin && (
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
          )}
          {isAdmin && isMobile && (
            <IconButton onClick={() => setShowFilters(!showFilters)} color="primary">
              <FilterListIcon />
            </IconButton>
          )}
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={isMobile ? null : <AddIcon />}
            onClick={handleOpenNewClientDialog}
            sx={{ 
              flexGrow: isMobile ? 1 : 0,
              minWidth: isSmallMobile ? 'initial' : '150px',
              px: isSmallMobile ? 1 : 2
            }}
          >
            {isMobile ? <AddIcon /> : 'Новый клиент'}
          </Button>
        </Box>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm>
            <TextField
              fullWidth
              placeholder="Поиск по имени, телефону или email..."
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
          </Grid>
          
          {isAdmin && showFilters && (
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                <InputLabel id="manager-filter-label">Менеджер</InputLabel>
                <Select
                  labelId="manager-filter-label"
                  id="manager-filter"
                  value={selectedManager}
                  label="Менеджер"
                  onChange={handleManagerFilterChange}
                >
                  <MenuItem value="all">Все менеджеры</MenuItem>
                  {managers.map((manager) => (
                    <MenuItem key={manager.id} value={manager.id}>{manager.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {isMobile ? (
              <Box sx={{ p: 1 }}>
                {filteredClients.length === 0 ? (
                  <Typography variant="body1" sx={{ p: 2, textAlign: 'center' }}>
                    Клиенты не найдены
                  </Typography>
                ) : (
                  <Stack spacing={2}>
                    {filteredClients.map((client) => (
                      <Card key={client.id} sx={{ cursor: 'pointer', borderRadius: '8px' }} onClick={() => handleViewClient(client.id)}>
                        <CardContent sx={{ p: '12px' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            {client.company ? (
                              <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
                            ) : (
                              <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                            )}
                            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 500 }}>
                              {client.name}
                            </Typography>
                          </Box>
                          
                          <Divider sx={{ my: 0.5 }} />
                          
                          <Grid container spacing={1} sx={{ mt: 0.5 }}>
                            <Grid item xs={12}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <PhoneIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                                  <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>{client.phone}</Typography>
                                </Box>
                                <IconButton 
                                  size="small" 
                                  onClick={(e) => handleCallClient(client.phone, e)}
                                  sx={{ p: 0.5 }}
                                >
                                  <PhoneIcon fontSize="small" color="primary" />
                                </IconButton>
                              </Box>
                            </Grid>
                            
                            <Grid item xs={12}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <EmailIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      fontSize: '0.875rem',
                                      maxWidth: '180px', 
                                      overflow: 'hidden', 
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap' 
                                    }}
                                  >
                                    {client.email}
                                  </Typography>
                                </Box>
                                <IconButton 
                                  size="small" 
                                  onClick={(e) => handleEmailClient(client.email, e)}
                                  sx={{ p: 0.5 }}
                                >
                                  <EmailIcon fontSize="small" color="primary" />
                                </IconButton>
                              </Box>
                            </Grid>
                            
                            {client.company && (
                              <Grid item xs={12}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <BusinessIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      fontSize: '0.875rem',
                                      maxWidth: '220px', 
                                      overflow: 'hidden', 
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap' 
                                    }}
                                  >
                                    {client.company.name}
                                  </Typography>
                                </Box>
                              </Grid>
                            )}
                          </Grid>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Box>
            ) : (
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

      {isMobile && (
        <Fab 
          color="primary" 
          aria-label="Новый клиент" 
          onClick={handleOpenNewClientDialog}
          sx={{ 
            position: 'fixed', 
            bottom: 16, 
            right: 16,
            display: { xs: 'none', sm: 'flex' }
          }}
        >
          <AddIcon />
        </Fab>
      )}

      <Dialog 
        open={openNewClientDialog} 
        onClose={handleCloseNewClientDialog} 
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
                onClick={handleCloseNewClientDialog}
                sx={{ mr: 1 }}
              >
                <ChevronLeftIcon />
              </IconButton>
              <Typography variant="h6">Новый клиент</Typography>
            </Box>
          ) : (
            "Создание нового клиента"
          )}
        </DialogTitle>
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
                size={isMobile ? "small" : "medium"}
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
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Email"
                variant="outlined"
                fullWidth
                required
                value={newClient.email}
                onChange={(e) => handleNewClientChange('email', e.target.value)}
                placeholder="example@mail.com"
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" gutterBottom>
                Информация о компании (необязательно)
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Название компании"
                variant="outlined"
                fullWidth
                value={newClient.companyName}
                onChange={(e) => handleNewClientChange('companyName', e.target.value)}
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="ИНН"
                variant="outlined"
                fullWidth
                value={newClient.inn}
                onChange={(e) => handleNewClientChange('inn', e.target.value)}
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="КПП"
                variant="outlined"
                fullWidth
                value={newClient.kpp}
                onChange={(e) => handleNewClientChange('kpp', e.target.value)}
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Адрес"
                variant="outlined"
                fullWidth
                value={newClient.address}
                onChange={(e) => handleNewClientChange('address', e.target.value)}
                size={isMobile ? "small" : "medium"}
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
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
          <Button onClick={handleCloseNewClientDialog} color="inherit">
            Отмена
          </Button>
          <Button 
            onClick={handleCreateClient} 
            variant="contained" 
            color="primary"
            disabled={!newClient.name || !newClient.phone || !newClient.email}
          >
            Создать
          </Button>
        </DialogActions>
      </Dialog>

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

export default Clients;