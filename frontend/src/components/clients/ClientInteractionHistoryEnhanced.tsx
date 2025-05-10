import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  Divider,
  IconButton,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Grid,
  useTheme,
  useMediaQuery,
  Alert,
  Snackbar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EmailIcon from '@mui/icons-material/Email';
import CallIcon from '@mui/icons-material/Call';
import NoteIcon from '@mui/icons-material/Note';
import BusinessIcon from '@mui/icons-material/Business';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Interaction, InteractionType } from '../../types';
import apiService from '../../utils/apiService';

// Маппинг типов взаимодействий для отображения
const interactionTypeMap: Record<InteractionType, { 
  label: string; 
  icon: React.ReactElement; 
  color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
}> = {
  NOTE: { 
    label: 'Заметка', 
    icon: <NoteIcon fontSize="small" />, 
    color: 'default'
  },
  CALL: { 
    label: 'Звонок', 
    icon: <CallIcon fontSize="small" />, 
    color: 'primary'
  },
  EMAIL: { 
    label: 'Email', 
    icon: <EmailIcon fontSize="small" />, 
    color: 'info'
  },
  DEAL: { 
    label: 'Сделка', 
    icon: <BusinessIcon fontSize="small" />, 
    color: 'success'
  },
  TASK: { 
    label: 'Задача', 
    icon: <AssignmentIcon fontSize="small" />, 
    color: 'warning'
  }
};

interface ExtendedInteraction extends Interaction {
  createdBy: string; // Добавляем поле, которое используется, но не определено в Interaction
  createdById: string;
  updatedAt: string;
}

// Тестовые данные для истории взаимодействий
const mockInteractions: ExtendedInteraction[] = [
  {
    id: '1',
    type: 'CALL' as InteractionType,
    content: 'Созвонились с клиентом по поводу нового заказа. Клиент интересуется солнечными панелями для загородного дома.',
    clientId: '1',
    createdById: '1',
    createdAt: '2025-05-04T10:30:00Z',
    updatedAt: '2025-05-04T10:30:00Z',
    createdBy: 'Иван Иванов'
  },
  {
    id: '2',
    type: 'EMAIL' as InteractionType,
    content: 'Отправил коммерческое предложение на поставку 5 солнечных панелей и инвертора.',
    clientId: '1',
    createdById: '1',
    createdAt: '2025-05-04T14:20:00Z',
    updatedAt: '2025-05-04T14:20:00Z',
    createdBy: 'Иван Иванов'
  },
  {
    id: '3',
    type: 'DEAL' as InteractionType,
    content: 'Создана новая сделка: Поставка оборудования для солнечной электростанции',
    clientId: '1',
    createdById: '0',
    createdAt: '2025-05-05T11:00:00Z',
    updatedAt: '2025-05-05T11:00:00Z',
    createdBy: 'Система'
  },
  {
    id: '4',
    type: 'NOTE' as InteractionType,
    content: 'Клиент просил перезвонить на следующей неделе для обсуждения сроков поставки.',
    clientId: '1',
    createdById: '2',
    createdAt: '2025-05-05T16:45:00Z',
    updatedAt: '2025-05-05T16:45:00Z',
    createdBy: 'Петр Петров'
  },
  {
    id: '5',
    type: 'TASK' as InteractionType,
    content: 'Создана задача: Подготовить документы для договора с клиентом',
    clientId: '1',
    createdById: '0',
    createdAt: '2025-05-06T09:15:00Z',
    updatedAt: '2025-05-06T09:15:00Z',
    createdBy: 'Система'
  }
];

interface ClientInteractionHistoryProps {
  clientId: string;
}

const ClientInteractionHistoryEnhanced: React.FC<ClientInteractionHistoryProps> = ({ clientId }) => {
  const [interactions, setInteractions] = useState<ExtendedInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [openNewInteractionDialog, setOpenNewInteractionDialog] = useState(false);
  const [newInteraction, setNewInteraction] = useState<{
    type: InteractionType;
    content: string;
  }>({
    type: 'NOTE',
    content: ''
  });

  // Состояние для редактируемого взаимодействия
  const [editingInteraction, setEditingInteraction] = useState<ExtendedInteraction | null>(null);
  
  // Состояние для диалога подтверждения удаления
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState({
    open: false,
    interactionId: ''
  });
  
  // Состояние для уведомлений
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'info' | 'warning' | 'error'
  });

  // Получаем тему и медиа-запросы
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    const fetchInteractions = async () => {
      setLoading(true);
      try {
        // В реальном приложении здесь будет запрос к API
        // const response = await apiService.getClientInteractions(clientId);
        // setInteractions(response);
        
        // Фильтруем взаимодействия для текущего клиента
        const filteredInteractions = mockInteractions.filter(
          interaction => interaction.clientId === clientId
        );
        
        // Сортируем взаимодействия по дате (новые вверху)
        const sortedInteractions = filteredInteractions.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        setTimeout(() => {
          setInteractions(sortedInteractions);
          setLoading(false);
        }, 500); // Искусственная задержка для демонстрации загрузки
      } catch (error) {
        console.error('Error fetching interactions:', error);
        setLoading(false);
        setSnackbar({
          open: true,
          message: 'Ошибка при загрузке истории взаимодействий',
          severity: 'error'
        });
      }
    };

    fetchInteractions();
  }, [clientId]);

  const handleOpenNewInteractionDialog = () => {
    setOpenNewInteractionDialog(true);
  };

  const handleCloseNewInteractionDialog = () => {
    setOpenNewInteractionDialog(false);
    setEditingInteraction(null);
    setNewInteraction({
      type: 'NOTE',
      content: ''
    });
  };

  const handleNewInteractionChange = (field: string, value: any) => {
    setNewInteraction({
      ...newInteraction,
      [field]: value
    });
  };

  const handleCreateInteraction = async () => {
    try {
      // Добавление индикатора загрузки
      setLoading(true);
      
      // Если это редактирование существующего взаимодействия
      if (editingInteraction) {
        // В реальном приложении здесь будет запрос к API для обновления
        // const response = await apiService.updateInteraction(editingInteraction.id, newInteraction);
        
        // Обновляем взаимодействие локально
        const updatedInteractions = interactions.map(interaction => 
          interaction.id === editingInteraction.id 
            ? { 
                ...interaction, 
                type: newInteraction.type, 
                content: newInteraction.content,
                updatedAt: new Date().toISOString()
              } 
            : interaction
        );
        
        setInteractions(updatedInteractions);
        setSnackbar({
          open: true,
          message: 'Взаимодействие успешно обновлено',
          severity: 'success'
        });
      } else {
        // В реальном приложении здесь будет запрос к API для создания записи
        // const response = await apiService.createInteraction(clientId, newInteraction);
        
        // Добавляем запись локально
        const interaction = {
          id: `mock-${Date.now()}`,
          ...newInteraction,
          clientId,
          createdById: '1',
          createdBy: 'Текущий пользователь',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        setInteractions([interaction, ...interactions]);
        setSnackbar({
          open: true,
          message: 'Взаимодействие успешно добавлено',
          severity: 'success'
        });
      }
      
      handleCloseNewInteractionDialog();
    } catch (error) {
      console.error('Error with interaction:', error);
      setSnackbar({
        open: true,
        message: editingInteraction 
          ? 'Ошибка при обновлении взаимодействия' 
          : 'Ошибка при добавлении взаимодействия',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Функция для начала редактирования взаимодействия
  const handleEditInteraction = (interaction: ExtendedInteraction) => {
    setEditingInteraction(interaction);
    setNewInteraction({
      type: interaction.type as InteractionType,
      content: interaction.content
    });
    setOpenNewInteractionDialog(true);
  };
  
  // Функция для удаления взаимодействия
  const handleDeleteInteraction = (interactionId: string) => {
    setDeleteConfirmDialog({
      open: true,
      interactionId
    });
  };
  
  // Функция для подтверждения удаления
  const confirmDeleteInteraction = async () => {
    try {
      // Добавление индикатора загрузки
      setLoading(true);
      
      // В реальном приложении здесь будет запрос к API для удаления
      // await apiService.deleteInteraction(deleteConfirmDialog.interactionId);
      
      // Удаляем запись локально
      const updatedInteractions = interactions.filter(
        interaction => interaction.id !== deleteConfirmDialog.interactionId
      );
      
      setInteractions(updatedInteractions);
      setDeleteConfirmDialog({ open: false, interactionId: '' });
      
      setSnackbar({
        open: true,
        message: 'Взаимодействие успешно удалено',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting interaction:', error);
      
      setSnackbar({
        open: true,
        message: 'Ошибка при удалении взаимодействия',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading && interactions.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">История взаимодействий</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingInteraction(null);
            setNewInteraction({ type: 'NOTE', content: '' });
            handleOpenNewInteractionDialog();
          }}
          size={isMobile ? 'small' : 'medium'}
        >
          Добавить
        </Button>
      </Box>

      {interactions.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          У этого клиента пока нет истории взаимодействий.
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {interactions.map((interaction) => (
            <Grid item xs={12} key={interaction.id}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip
                        size="small"
                        icon={interactionTypeMap[interaction.type as InteractionType].icon}
                        label={interactionTypeMap[interaction.type as InteractionType].label}
                        color={interactionTypeMap[interaction.type as InteractionType].color}
                        sx={{ mr: 1 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {formatDistanceToNow(new Date(interaction.createdAt), { 
                          addSuffix: true, 
                          locale: ru 
                        })}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleEditInteraction(interaction)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteInteraction(interaction.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 1 }}>
                    {interaction.content}
                  </Typography>
                  
                  <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    sx={{ 
                      display: 'block', 
                      textAlign: 'right',
                      fontStyle: 'italic'
                    }}
                  >
                    Добавил(а): {interaction.createdBy} • {format(new Date(interaction.createdAt), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Диалог для создания/редактирования взаимодействия */}
      <Dialog 
        open={openNewInteractionDialog} 
        onClose={handleCloseNewInteractionDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editingInteraction ? 'Редактировать взаимодействие' : 'Добавить взаимодействие'}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel id="interaction-type-label">Тип взаимодействия</InputLabel>
            <Select
              labelId="interaction-type-label"
              value={newInteraction.type}
              label="Тип взаимодействия"
              onChange={(e) => handleNewInteractionChange('type', e.target.value)}
            >
              <MenuItem value="NOTE">
                <Stack direction="row" spacing={1} alignItems="center">
                  <NoteIcon fontSize="small" />
                  <span>Заметка</span>
                </Stack>
              </MenuItem>
              <MenuItem value="CALL">
                <Stack direction="row" spacing={1} alignItems="center">
                  <CallIcon fontSize="small" />
                  <span>Звонок</span>
                </Stack>
              </MenuItem>
              <MenuItem value="EMAIL">
                <Stack direction="row" spacing={1} alignItems="center">
                  <EmailIcon fontSize="small" />
                  <span>Email</span>
                </Stack>
              </MenuItem>
            </Select>
          </FormControl>
          <TextField
            autoFocus
            margin="dense"
            id="content"
            label="Содержание"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={newInteraction.content}
            onChange={(e) => handleNewInteractionChange('content', e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewInteractionDialog}>Отмена</Button>
          <Button 
            onClick={handleCreateInteraction} 
            color="primary"
            variant="contained"
            disabled={!newInteraction.content.trim()}
          >
            {editingInteraction ? 'Сохранить' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Диалог подтверждения удаления */}
      <Dialog
        open={deleteConfirmDialog.open}
        onClose={() => setDeleteConfirmDialog({ open: false, interactionId: '' })}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Подтверждение удаления</DialogTitle>
        <DialogContent>
          <Typography>
            Вы действительно хотите удалить эту запись? Это действие нельзя будет отменить.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteConfirmDialog({ open: false, interactionId: '' })}
          >
            Отмена
          </Button>
          <Button 
            onClick={confirmDeleteInteraction} 
            color="error" 
            variant="contained"
            autoFocus
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar для уведомлений */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ClientInteractionHistoryEnhanced;
