import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="calc(100vh - 64px)"
    >
      <Paper
        elevation={3}
        sx={{
          p: 5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: 500
        }}
      >
        <ErrorOutlineIcon color="error" sx={{ fontSize: 100, mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Страница не найдена
        </Typography>
        <Typography variant="body1" color="textSecondary" align="center" paragraph>
          Извините, но запрошенная вами страница не существует или была перемещена.
        </Typography>
        <Box mt={3}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/')}
          >
            Вернуться на главную
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default NotFound;