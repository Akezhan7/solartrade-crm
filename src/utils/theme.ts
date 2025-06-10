import { createTheme, responsiveFontSizes } from '@mui/material/styles';
import { ruRU } from '@mui/material/locale';

// Создание собственной темы
let theme = createTheme(
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
        fontWeight: 500
      },
      h2: {
        fontWeight: 500
      },
      h3: {
        fontWeight: 500
      },
      h4: {
        fontWeight: 500
      },
      h5: {
        fontWeight: 500
      },
      h6: {
        fontWeight: 500
      },
      // Адаптивный размер текста для мобильных устройств
      body1: {
        fontSize: '1rem',
      },
      body2: {
        fontSize: '0.875rem',
      },
    },
    shape: {
      borderRadius: 8
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            // Уменьшение отступов для мобильных устройств
            '@media (max-width:600px)': {
              padding: '6px 12px',
            },
          },
          containedPrimary: {
            '&:hover': {
              backgroundColor: '#1976d2'
            }
          },
          // Оптимизация для маленьких экранов
          sizeSmall: {
            padding: '4px 10px',
            fontSize: '0.8125rem',
          },
          sizeLarge: {
            '@media (max-width:600px)': {
              padding: '8px 16px',
              fontSize: '0.9375rem',
            },
          },
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
            transition: 'box-shadow 0.3s ease-in-out',
            '@media (max-width:600px)': {
              borderRadius: '6px',
            },
          }
        }
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 600,
            backgroundColor: '#f5f5f5'
          },
          // Уменьшение отступов в таблицах для мобильных устройств
          root: {
            '@media (max-width:600px)': {
              padding: '8px 6px',
            },
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
            fontWeight: 500,
            // Уменьшение размеров для мобильных устройств
            '@media (max-width:600px)': {
              height: '28px',
              fontSize: '0.75rem',
            },
          },
          // Уменьшение отступов для мобильных устройств
          label: {
            '@media (max-width:600px)': {
              paddingLeft: '10px',
              paddingRight: '10px',
            },
          },
        }
      },
      MuiDialog: {
        styleOverrides: {
          // Улучшение адаптивности диалогов
          paper: {
            '@media (max-width:600px)': {
              margin: '12px',
              width: 'calc(100% - 24px)',
              maxHeight: 'calc(100% - 24px)',
            },
          },
        }
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            '@media (max-width:600px)': {
              padding: '16px',
            },
          },
        }
      },
      MuiDialogContent: {
        styleOverrides: {
          root: {
            '@media (max-width:600px)': {
              padding: '8px 16px',
            },
          },
        }
      },
      MuiDialogActions: {
        styleOverrides: {
          root: {
            '@media (max-width:600px)': {
              padding: '8px 16px',
            },
          },
        }
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '@media (max-width:600px)': {
              marginBottom: '8px',
            },
          },
        }
      },
    }
  },
  ruRU // Добавляем русскую локализацию
);

// Применяем адаптивные размеры шрифтов
theme = responsiveFontSizes(theme);

export default theme;