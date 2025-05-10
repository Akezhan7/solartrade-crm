import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
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
  CardActions,
  Tooltip,
  Grid,
  useTheme,
  useMediaQuery,
  Alert
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

const ClientInteractionHistory: React.FC<ClientInteractionHistoryProps> = ({ clientId }) => {
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
        
        setTimeout(() => {
          setInteractions(filteredInteractions);
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error fetching interactions:', error);
        setLoading(false);
      }
    };

    fetchInteractions();
  }, [clientId]);

  const handleOpenNewInteractionDialog = () => {
    setOpenNewInteractionDialog(true);
  };

  const handleCloseNewInteractionDialog = () => {
    setOpenNewInteractionDialog(false);
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
    // Создаем новое взаимодействие
    const newInteractionData: ExtendedInteraction = {
      id: (interactions.length + 1).toString(),
      type: newInteraction.type,
      content: newInteraction.content,
      clientId: clientId,
      createdById: '1', // Предполагаем, что это ID текущего пользователя
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), 
      createdBy: 'Текущий пользователь' // В реальном приложении - имя авторизованного пользователя
    };

    try {
      // В реальном приложении здесь будет запрос к API
      // const result = await apiService.createInteraction(newInteractionData);
      // setInteractions([result, ...interactions]);
      
      // Добавляем новое взаимодействие в начало списка
      setInteractions([newInteractionData, ...interactions]);
      
      handleCloseNewInteractionDialog();
    } catch (error) {
      console.error('Error creating interaction:', error);
    }
  };

  // Форматирование даты
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d MMMM yyyy 'в' HH:mm", { locale: ru });
  };

  // Сортировка взаимодействий по дате (новые вверху)
  const sortedInteractions = [...interactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">История взаимодействий</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenNewInteractionDialog}
          size="small"
        >
          Добавить
        </Button>
      </Box>

      {interactions.length === 0 ? (
        <Typography variant="body1" sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
          Нет записей о взаимодействиях с данным клиентом
        </Typography>
      ) : (
        <List>
          {sortedInteractions.map((interaction, index) => (
            <React.Fragment key={interaction.id}>
              {index > 0 && <Divider component="li" />}
              <ListItem alignItems="flex-start">
                <Stack direction="column" spacing={1} sx={{ width: '100%' }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip 
                      icon={interactionTypeMap[interaction.type].icon} 
                      label={interactionTypeMap[interaction.type].label} 
                      color={interactionTypeMap[interaction.type].color}
                      size="small"
                    />
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(interaction.createdAt)} • {interaction.createdBy}
                    </Typography>
                  </Stack>
                  <Typography variant="body1">{interaction.content}</Typography>
                </Stack>
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      )}

      {/* Dialog для добавления нового взаимодействия */}
      <Dialog open={openNewInteractionDialog} onClose={handleCloseNewInteractionDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Добавить новое взаимодействие</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="interaction-type-label">Тип взаимодействия</InputLabel>
              <Select
                labelId="interaction-type-label"
                value={newInteraction.type}
                label="Тип взаимодействия"
                onChange={(e) => handleNewInteractionChange('type', e.target.value)}
              >
                <MenuItem value="NOTE">Заметка</MenuItem>
                <MenuItem value="CALL">Звонок</MenuItem>
                <MenuItem value="EMAIL">Email</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Описание"
              value={newInteraction.content}
              onChange={(e) => handleNewInteractionChange('content', e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewInteractionDialog}>Отмена</Button>
          <Button 
            onClick={handleCreateInteraction} 
            variant="contained" 
            color="primary"
            disabled={!newInteraction.content.trim()}
          >
            Добавить
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ClientInteractionHistory;