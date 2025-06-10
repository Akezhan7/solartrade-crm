import React, { useState, useEffect } from 'react';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  Drawer, 
  List,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Badge,
  useMediaQuery,
  useTheme,
  SwipeableDrawer,
  Backdrop
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth}px`,
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
  [theme.breakpoints.down('sm')]: {
    marginLeft: 0,
    padding: theme.spacing(2, 1),
    paddingTop: theme.spacing(1),
    width: '100%',
  },
}));

interface AppBarProps {
  open?: boolean;
}

const AppBarStyled = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    marginLeft: 0,
    zIndex: theme.zIndex.drawer + 2,
  },
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

interface MenuOption {
  title: string;
  path: string;
  icon: React.ReactNode;
}

const menuOptions: MenuOption[] = [
  { title: 'Обзор', path: '/', icon: <DashboardIcon /> },
  { title: 'Клиенты', path: '/clients', icon: <PeopleIcon /> },
  { title: 'Сделки', path: '/deals', icon: <BusinessCenterIcon /> },
  { title: 'Задачи', path: '/tasks', icon: <TaskAltIcon /> },
  { title: 'Настройки', path: '/settings', icon: <SettingsIcon /> },
];

interface User {
  id: string;
  name: string;
  role?: string;
}

const MainLayout: React.FC = () => {
  const [open, setOpen] = useState(true);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [anchorElNotifications, setAnchorElNotifications] = useState<null | HTMLElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Добавляем пункт "Пользователи" только для администратора
  const isAdmin = user?.role === 'ADMIN';
  
  // Получение данных пользователя
  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        const userData = JSON.parse(userJson) as User;
        setUser(userData);
      } catch (e) {
        console.error('Ошибка при чтении данных пользователя:', e);
        // Возможно здесь вы захотите вызвать logout для очистки данных
      }
    }
  }, []);

  // Если экран мобильный, то меню по умолчанию закрыто
  useEffect(() => {
    if (isMobile) {
      setOpen(false);
    } else {
      setOpen(true);
    }
  }, [isMobile]);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleOpenNotificationsMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNotifications(event.currentTarget);
  };

  const handleCloseNotificationsMenu = () => {
    setAnchorElNotifications(null);
  };

  const handleLogout = () => {
    // Очистка данных авторизации
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Закрытие меню
    handleCloseUserMenu();
    
    // Перенаправление на страницу входа
    navigate('/login');
  };

  const getUserInitials = () => {
    if (!user || !user.name) return 'User';
    
    const nameParts = user.name.split(' ');
    if (nameParts.length > 1) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    
    return nameParts[0].substring(0, 2).toUpperCase();
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBarStyled position="fixed" open={!isMobile && open}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={handleDrawerOpen}
              edge="start"
              sx={{ mr: 1, ...(open && !isMobile && { display: 'none' }) }}
            >
              <MenuIcon />
            </IconButton>
            <Typography 
              variant="h6" 
              noWrap 
              component="div" 
              sx={{ 
                fontSize: { xs: '1rem', sm: '1.25rem' },
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {isSmallScreen ? 'SolarTrade' : 'SolarTrade CRM'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Иконка уведомлений */}
            <IconButton
              size="large"
              aria-label="показать новые уведомления"
              color="inherit"
              onClick={handleOpenNotificationsMenu}
              sx={{ mr: { xs: 0.5, sm: 1 } }}
            >
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-notifications"
              anchorEl={anchorElNotifications}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElNotifications)}
              onClose={handleCloseNotificationsMenu}
            >
              <MenuItem onClick={handleCloseNotificationsMenu}>
                <ListItemText 
                  primary="Новая задача назначена вам"
                  secondary="5 минут назад"
                />
              </MenuItem>
              <MenuItem onClick={handleCloseNotificationsMenu}>
                <ListItemText 
                  primary="Новая сделка создана"
                  secondary="20 минут назад"
                />
              </MenuItem>
              <MenuItem onClick={handleCloseNotificationsMenu}>
                <ListItemText 
                  primary="Срок задачи истекает"
                  secondary="1 час назад"
                />
              </MenuItem>
            </Menu>

            {/* Меню пользователя */}
            <Tooltip title="Открыть настройки">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0, ml: { xs: 0.5, sm: 1 } }}>
                <Avatar alt={user?.name || 'Пользователь'} sx={{ width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 } }}>
                  {getUserInitials()}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              <MenuItem onClick={() => { handleCloseUserMenu(); navigate('/profile'); }}>
                <ListItemIcon>
                  <AccountCircleIcon fontSize="small" />
                </ListItemIcon>
                <Typography textAlign="center">Профиль</Typography>
              </MenuItem>
              <MenuItem onClick={() => { handleCloseUserMenu(); navigate('/settings'); }}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                <Typography textAlign="center">Настройки</Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" color="error" />
                </ListItemIcon>
                <Typography textAlign="center" color="error">Выйти</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBarStyled>
      
      {isMobile ? (
        <SwipeableDrawer
          open={open}
          onClose={handleDrawerClose}
          onOpen={handleDrawerOpen}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
            },
            zIndex: theme.zIndex.drawer + 1,
          }}
        >
          <DrawerHeader>
            <Typography variant="h6" sx={{ flexGrow: 1, pl: 1 }}>
              SolarTrade
            </Typography>
            <IconButton onClick={handleDrawerClose}>
              <ChevronLeftIcon />
            </IconButton>
          </DrawerHeader>
          <Divider />
          <List>
            {menuOptions.map((option) => (
              <ListItem key={option.path} disablePadding>
                <ListItemButton
                  selected={location.pathname === option.path}
                  onClick={() => {
                    navigate(option.path);
                    handleDrawerClose();
                  }}
                >
                  <ListItemIcon>
                    {option.icon}
                  </ListItemIcon>
                  <ListItemText primary={option.title} />
                </ListItemButton>
              </ListItem>
            ))}
            
            {/* Пункт "Пользователи" только для администратора */}
            {isAdmin && (
              <ListItem disablePadding>
                <ListItemButton
                  selected={location.pathname === '/users'}
                  onClick={() => {
                    navigate('/users');
                    handleDrawerClose();
                  }}
                >
                  <ListItemIcon>
                    <PeopleIcon />
                  </ListItemIcon>
                  <ListItemText primary="Пользователи" />
                </ListItemButton>
              </ListItem>
            )}
          </List>
          
          <Divider sx={{ mt: 'auto' }} />
          <ListItem disablePadding>
            <ListItemButton onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon color="error" />
              </ListItemIcon>
              <ListItemText primary="Выйти" sx={{ color: 'error.main' }} />
            </ListItemButton>
          </ListItem>
        </SwipeableDrawer>
      ) : (
        <Drawer
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
            },
          }}
          variant="persistent"
          anchor="left"
          open={open}
        >
          <DrawerHeader>
            <Typography variant="h6" sx={{ flexGrow: 1, pl: 1 }}>
              SolarTrade
            </Typography>
            <IconButton onClick={handleDrawerClose}>
              <ChevronLeftIcon />
            </IconButton>
          </DrawerHeader>
          <Divider />
          <List>
            {menuOptions.map((option) => (
              <ListItem key={option.path} disablePadding>
                <ListItemButton
                  selected={location.pathname === option.path}
                  onClick={() => {
                    navigate(option.path);
                  }}
                >
                  <ListItemIcon>
                    {option.icon}
                  </ListItemIcon>
                  <ListItemText primary={option.title} />
                </ListItemButton>
              </ListItem>
            ))}
            
            {/* Пункт "Пользователи" только для администратора */}
            {isAdmin && (
              <ListItem disablePadding>
                <ListItemButton
                  selected={location.pathname === '/users'}
                  onClick={() => {
                    navigate('/users');
                  }}
                >
                  <ListItemIcon>
                    <PeopleIcon />
                  </ListItemIcon>
                  <ListItemText primary="Пользователи" />
                </ListItemButton>
              </ListItem>
            )}
          </List>
        </Drawer>
      )}
      
      {/* Backdrop за выдвижным меню для мобильных устройств */}
      {isMobile && open && (
        <Backdrop
          sx={{ zIndex: theme.zIndex.drawer }}
          open={true}
          onClick={handleDrawerClose}
        />
      )}
      
      <Main open={!isMobile && open}>
        <DrawerHeader />
        <Box sx={{ 
          pb: 5,
          px: { xs: 0.5, sm: 1, md: 2 },
          maxWidth: '100%', 
          overflowX: 'hidden'
        }}>
          <Outlet />
        </Box>
      </Main>
    </Box>
  );
};

export default MainLayout;