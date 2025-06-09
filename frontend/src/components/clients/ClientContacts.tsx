import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  Stack,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import EventIcon from '@mui/icons-material/Event';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import { Contact } from '../../types';
import { format } from 'date-fns';

interface ClientContactsProps {
  clientId: string;
  contacts: Contact[];
  isEditing: boolean;
  onAddContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onEditContact: (contact: Contact) => void;
  onDeleteContact: (contactId: string) => void;
}

const ClientContacts: React.FC<ClientContactsProps> = ({
  clientId,
  contacts = [],
  isEditing,
  onAddContact,
  onEditContact,
  onDeleteContact
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [openContactDialog, setOpenContactDialog] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState({ open: false, contactId: '' });
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [newContact, setNewContact] = useState<Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    position: '',
    notes: '',
    clientId: clientId,
  });

  const handleOpenContactDialog = () => {
    setOpenContactDialog(true);
  };

  const handleCloseContactDialog = () => {
    setOpenContactDialog(false);
    setEditingContact(null);
    setNewContact({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      position: '',
      notes: '',
      clientId: clientId,
    });
  };

  const handleContactChange = (field: keyof typeof newContact, value: any) => {
    setNewContact({
      ...newContact,
      [field]: value
    });
  };

  const handleCreateContact = () => {
    if (editingContact) {
      onEditContact({
        ...editingContact,
        ...newContact,
      });
    } else {
      onAddContact(newContact);
    }
    handleCloseContactDialog();
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setNewContact({
      firstName: contact.firstName,
      lastName: contact.lastName,
      phone: contact.phone || '',
      email: contact.email || '',
      birthDate: contact.birthDate,
      position: contact.position || '',
      notes: contact.notes || '',
      clientId: contact.clientId
    });
    handleOpenContactDialog();
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmDialog.contactId) {
      onDeleteContact(deleteConfirmDialog.contactId);
      setDeleteConfirmDialog({ open: false, contactId: '' });
    }
  };

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 2
          }}>
            <Typography variant="h6">
              Контактные лица
            </Typography>
            {isEditing && (
              <Button 
                variant="contained" 
                size="small" 
                startIcon={<AddIcon />}
                onClick={handleOpenContactDialog}
              >
                Добавить контакт
              </Button>
            )}
          </Box>

          {contacts.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              У данного клиента нет контактных лиц
            </Typography>
          ) : (
            <List sx={{ p: 0 }}>
              {contacts.map((contact, index) => (
                <React.Fragment key={contact.id}>
                  {index > 0 && <Divider component="li" />}
                  <ListItem 
                    alignItems="flex-start"
                    secondaryAction={isEditing ? (
                      <Box>
                        <IconButton 
                          edge="end" 
                          aria-label="edit" 
                          size="small"
                          onClick={() => handleEditContact(contact)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          edge="end" 
                          aria-label="delete" 
                          size="small"
                          onClick={() => setDeleteConfirmDialog({ open: true, contactId: contact.id })}
                          sx={{ ml: 1 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ) : null}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                          {contact.lastName} {contact.firstName}
                          {contact.position && (
                            <Chip 
                              icon={<WorkIcon fontSize="small" />} 
                              label={contact.position} 
                              size="small" 
                              variant="outlined"
                              sx={{ ml: 1, fontSize: '0.75rem' }}
                            />
                          )}
                        </Typography>
                      }                      secondary={
                        <Box component="span" sx={{ mt: 1, display: 'block' }}>
                          {contact.phone && (
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                              <PhoneIcon fontSize="small" color="action" />
                              <Box component="span" sx={{ fontSize: '0.875rem' }}>{contact.phone}</Box>
                            </Stack>
                          )}
                          {contact.email && (
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                              <EmailIcon fontSize="small" color="action" />
                              <Box component="span" sx={{ fontSize: '0.875rem' }}>{contact.email}</Box>
                            </Stack>
                          )}
                          {contact.birthDate && (
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                              <EventIcon fontSize="small" color="action" />
                              <Box component="span" sx={{ fontSize: '0.875rem' }}>
                                {format(new Date(contact.birthDate), 'dd.MM.yyyy')}
                              </Box>
                            </Stack>
                          )}
                          {contact.notes && (
                            <Box 
                              component="span"
                              sx={{ 
                                mt: 1, 
                                fontStyle: 'italic',
                                fontSize: '0.875rem',
                                color: 'text.secondary',
                                display: 'block'
                              }}
                            >
                              {contact.notes}
                            </Box>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Диалог добавления/редактирования контакта */}
      <Dialog 
        open={openContactDialog} 
        onClose={handleCloseContactDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingContact ? 'Редактирование контакта' : 'Добавление нового контакта'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Фамилия"
                fullWidth
                required
                value={newContact.lastName}
                onChange={(e) => handleContactChange('lastName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Имя"
                fullWidth
                required
                value={newContact.firstName}
                onChange={(e) => handleContactChange('firstName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Телефон"
                fullWidth
                value={newContact.phone}
                onChange={(e) => handleContactChange('phone', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email"
                fullWidth
                type="email"
                value={newContact.email}
                onChange={(e) => handleContactChange('email', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Должность"
                fullWidth
                value={newContact.position}
                onChange={(e) => handleContactChange('position', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                <DatePicker
                  label="Дата рождения"
                  value={newContact.birthDate ? new Date(newContact.birthDate) : null}
                  onChange={(newValue) => handleContactChange('birthDate', newValue ? newValue.toISOString().split('T')[0] : null)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      variant: 'outlined',
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Примечания"
                fullWidth
                multiline
                rows={3}
                value={newContact.notes}
                onChange={(e) => handleContactChange('notes', e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseContactDialog}>Отмена</Button>
          <Button 
            variant="contained"
            onClick={handleCreateContact}
            disabled={!newContact.firstName || !newContact.lastName}
          >
            {editingContact ? 'Сохранить' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог подтверждения удаления */}
      <Dialog
        open={deleteConfirmDialog.open}
        onClose={() => setDeleteConfirmDialog({ open: false, contactId: '' })}
      >
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить этот контакт? Это действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmDialog({ open: false, contactId: '' })}>
            Отмена
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ClientContacts;
