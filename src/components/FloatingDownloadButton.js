import React, { useState, useEffect } from 'react';
import {
  Fab,
  Tooltip,
  useMediaQuery,
  useTheme,
  Snackbar,
  Alert
} from '@mui/material';
import {
  GetApp as GetAppIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const FloatingDownloadButton = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);

  useEffect(() => {
    // Check if PWA is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPWAInstalled(true);
    }
  }, []);

  const handleDownloadClick = () => {
    if (isPWAInstalled) {
      setShowSnackbar(true);
    } else {
      navigate('/download');
    }
  };

  // Don't show if not mobile or if PWA is already installed
  if (!isMobile || isPWAInstalled) {
    return null;
  }

  return (
    <>
      <Tooltip title="Download App" placement="left">
        <Fab
          color="primary"
          aria-label="download app"
          onClick={handleDownloadClick}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
            boxShadow: 3,
            '&:hover': {
              boxShadow: 6,
              transform: 'scale(1.1)',
              transition: 'all 0.2s ease-in-out'
            }
          }}
        >
          <GetAppIcon />
        </Fab>
      </Tooltip>

      <Snackbar
        open={showSnackbar}
        autoHideDuration={4000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowSnackbar(false)} 
          severity="info" 
          sx={{ width: '100%' }}
        >
          App is already installed! You're using the best version.
        </Alert>
      </Snackbar>
    </>
  );
};

export default FloatingDownloadButton; 