import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Deal, DealStatus } from '../../types';

interface ClientDealsProps {
  deals: Deal[];
  onAddDeal?: () => void;
  onEditDeal?: (deal: Deal) => void;
  onDeleteDeal?: (dealId: string) => void;
  loading?: boolean;
}

const ClientDeals: React.FC<ClientDealsProps> = ({
  deals,
  onAddDeal,
  onEditDeal,
  onDeleteDeal,
  loading = false
}) => {
  // Маппинг статусов сделок для отображения
  const dealStatusMap: Record<DealStatus, { 
    label: string;
    color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'; 
  }> = {
    NEW: { label: 'Новая', color: 'info' },
    NEGOTIATION: { label: 'Переговоры', color: 'warning' },
    PROPOSAL: { label: 'Предложение', color: 'primary' },
    AGREEMENT: { label: 'Согласование', color: 'primary' },
    PAID: { label: 'Оплачено', color: 'success' },
    INSTALLATION: { label: 'Установка', color: 'secondary' },
    COMPLETED: { label: 'Завершена', color: 'success' },
    CANCELLED: { label: 'Отменена', color: 'error' }
  };
  
  // Состояние для диалога подтверждения удаления
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState({
    open: false,
    dealId: ''
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Не указана';
    return format(new Date(dateString), 'dd MMMM yyyy', { locale: ru });
  };
  
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    });
  };
  
  // Расчет текущей стадии сделки в процентах
  const calculateStagePercentage = (status: DealStatus): number => {
    const stages: DealStatus[] = ['NEW', 'NEGOTIATION', 'PROPOSAL', 'AGREEMENT', 'PAID', 'INSTALLATION', 'COMPLETED'];
    if (status === 'CANCELLED') return 0;
    
    const stageIndex = stages.indexOf(status);
    return Math.round((stageIndex / (stages.length - 1)) * 100);
  };
  
  // Обработка подтверждения удаления
  const handleConfirmDelete = () => {
    if (onDeleteDeal) {
      onDeleteDeal(deleteConfirmDialog.dealId);
    }
    setDeleteConfirmDialog({ open: false, dealId: '' });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Сделки клиента</Typography>
        {onAddDeal && (
          <Button variant="contained" color="primary" onClick={onAddDeal}>
            Добавить сделку
          </Button>
        )}
      </Box>

      {deals.length === 0 ? (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center">
              У данного клиента пока нет сделок
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {deals.map((deal) => (
            <Grid item xs={12} sm={6} md={4} key={deal.id}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6" component="div" noWrap sx={{ flexGrow: 1 }}>
                      {deal.title}
                    </Typography>
                    <Box>
                      {onEditDeal && (
                        <IconButton 
                          size="small" 
                          color="primary" 
                          onClick={() => onEditDeal(deal)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      )}
                      {onDeleteDeal && (
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => setDeleteConfirmDialog({ open: true, dealId: deal.id })}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                  
                  <Chip 
                    label={dealStatusMap[deal.status].label} 
                    color={dealStatusMap[deal.status].color}
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, height: '40px', overflow: 'hidden' }}>
                    {deal.description || 'Без описания'}
                  </Typography>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Typography variant="h6" color="primary.main" sx={{ mb: 1 }}>
                    {formatCurrency(deal.amount)}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CalendarTodayIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Плановая дата: {formatDate(deal.estimatedClosingDate)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccountCircleIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary" noWrap>
                      Менеджер: {deal.managerName}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Вероятность:</span>
                      <span>{deal.probability}%</span>
                    </Typography>
                    <Box
                      sx={{
                        mt: 0.5,
                        height: 6,
                        bgcolor: 'grey.300',
                        borderRadius: 3,
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          height: '100%',
                          width: `${deal.probability}%`,
                          bgcolor: deal.probability > 70 ? 'success.main' : deal.probability > 30 ? 'warning.main' : 'error.main',
                          borderRadius: 3
                        }}
                      />
                    </Box>
                  </Box>
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Прогресс:</span>
                      <span>{calculateStagePercentage(deal.status)}%</span>
                    </Typography>
                    <Box
                      sx={{
                        mt: 0.5,
                        height: 6,
                        bgcolor: 'grey.300',
                        borderRadius: 3,
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          height: '100%',
                          width: `${calculateStagePercentage(deal.status)}%`,
                          bgcolor: 'primary.main',
                          borderRadius: 3
                        }}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Диалог подтверждения удаления */}
      <Dialog
        open={deleteConfirmDialog.open}
        onClose={() => setDeleteConfirmDialog({ open: false, dealId: '' })}
      >
        <DialogTitle>Подтверждение удаления сделки</DialogTitle>
        <DialogContent>
          <Typography>
            Вы действительно хотите удалить эту сделку? Это действие нельзя будет отменить.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmDialog({ open: false, dealId: '' })}>
            Отмена
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClientDeals;
