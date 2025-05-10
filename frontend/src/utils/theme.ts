import { createTheme } from '@mui/material/styles';
import { ruRU } from '@mui/material/locale';

// Создание собственной темы
const theme = createTheme(
  {
    palette: {
      primary: {
        main: '#2196f3', // синий
        light: '#64b5f6',
        dark: '#1976d2'
      },
      secondary: {
        main: '#9c27b0', // фиолетовый
        light: '#ba68c8',
        dark: '#7b1fa2'
      },
      success: {
        main: '#4caf50', // зеленый
        light: '#81c784',
        dark: '#388e3c'
      },
      error: {
        main: '#f44336', // красный
        light: '#e57373',
        dark: '#d32f2f'
      },
      warning: {
        main: '#ff9800', // оранжевый
        light: '#ffb74d',
        dark: '#f57c00'
      },
      info: {
        main: '#03a9f4', // светло-синий
        light: '#4fc3f7',
        dark: '#0288d1'
      },
      background: {
        default: '#f5f5f5',
        paper: '#ffffff'
      }
    },
    typography: {
      fontFamily: [
        'Roboto',
        'Arial',
        'sans-serif',
      ].join(','),
      h1: {
        fontSize: '2.5rem',
        fontWeight: 500
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 500
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 500
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 500
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 500
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 500
      }
    },
    shape: {
      borderRadius: 8
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500
          },
          containedPrimary: {
            '&:hover': {
              backgroundColor: '#1976d2'
            }
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            transition: 'box-shadow 0.3s ease-in-out'
          }
        }
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 600,
            backgroundColor: '#f5f5f5'
          }
        }
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }
        }
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 500
          }
        }
      }
    }
  },
  ruRU // Добавляем русскую локализацию
);

export default theme;