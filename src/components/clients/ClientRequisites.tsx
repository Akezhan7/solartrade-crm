import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Divider,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Company } from '../../types';

interface ClientRequisitesProps {
  company: Company;
  isEditing: boolean;
  onCompanyChange?: (field: string, value: string) => void;
}

const ClientRequisites: React.FC<ClientRequisitesProps> = ({ company, isEditing, onCompanyChange }) => {
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleFieldChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onCompanyChange) {
      onCompanyChange(field, e.target.value);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Реквизиты компании
        </Typography>
        
        <Grid container spacing={2}>
          {/* Основные данные */}
          <Grid item xs={12}>
            <TextField
              label="Наименование организации"
              fullWidth
              value={company.name}
              onChange={handleFieldChange('name')}
              disabled={!isEditing}
              margin="dense"
              InputProps={{
                endAdornment: !isEditing && (
                  <Tooltip title="Скопировать">
                    <IconButton onClick={() => handleCopyText(company.name)} size="small">
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              label="ИНН"
              fullWidth
              value={company.inn}
              onChange={handleFieldChange('inn')}
              disabled={!isEditing}
              margin="dense"
              InputProps={{
                endAdornment: !isEditing && (
                  <Tooltip title="Скопировать">
                    <IconButton onClick={() => handleCopyText(company.inn)} size="small">
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              label="КПП"
              fullWidth
              value={company.kpp}
              onChange={handleFieldChange('kpp')}
              disabled={!isEditing}
              margin="dense"
              InputProps={{
                endAdornment: !isEditing && (
                  <Tooltip title="Скопировать">
                    <IconButton onClick={() => handleCopyText(company.kpp)} size="small">
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Юридический адрес"
              fullWidth
              value={company.address}
              onChange={handleFieldChange('address')}
              disabled={!isEditing}
              margin="dense"
              multiline
              rows={2}
              InputProps={{
                endAdornment: !isEditing && (
                  <Tooltip title="Скопировать">
                    <IconButton onClick={() => handleCopyText(company.address)} size="small">
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Банковские реквизиты"
              fullWidth
              value={company.bankDetails}
              onChange={handleFieldChange('bankDetails')}
              disabled={!isEditing}
              margin="dense"
              multiline
              rows={3}
              InputProps={{
                endAdornment: !isEditing && (
                  <Tooltip title="Скопировать">
                    <IconButton onClick={() => handleCopyText(company.bankDetails)} size="small">
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )
              }}
            />
          </Grid>
        </Grid>

        {!isEditing && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Полные реквизиты для копирования:
            </Typography>
            <Typography variant="body2" component="pre" 
              sx={{ 
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word', 
                fontFamily: 'inherit',
                bgcolor: 'background.paper',
                p: 1,
                borderRadius: 1
              }}
            >
              {`${company.name}
ИНН: ${company.inn}
КПП: ${company.kpp}
Адрес: ${company.address}
${company.bankDetails}`}
            </Typography>
            <Button 
              variant="outlined" 
              size="small" 
              startIcon={<ContentCopyIcon />} 
              sx={{ mt: 1 }}
              onClick={() => handleCopyText(`${company.name}
ИНН: ${company.inn}
КПП: ${company.kpp}
Адрес: ${company.address}
${company.bankDetails}`)}
            >
              Копировать все реквизиты
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientRequisites;
