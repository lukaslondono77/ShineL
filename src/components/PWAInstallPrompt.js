import React, { useState, useEffect } from 'react';
import { 
  Snackbar, 
  Alert, 
  Button, 
  Box 
} from '@mui/material';
import GetAppIcon from '@mui/icons-material/GetApp';

const PWAInstallPrompt = () => {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show the install prompt
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleClose = () => {
    setShowInstallPrompt(false);
  };

  return (
    <Snackbar
      open={showInstallPrompt}
      autoHideDuration={10000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert 
        onClose={handleClose} 
        severity="info" 
        sx={{ width: '100%' }}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              color="inherit" 
              size="small" 
              onClick={handleInstall}
              startIcon={<GetAppIcon />}
            >
              Install
            </Button>
            <Button 
              color="inherit" 
              size="small" 
              onClick={handleClose}
            >
              Later
            </Button>
          </Box>
        }
      >
        Install Global Chat as an app for a better experience!
      </Alert>
    </Snackbar>
  );
};

export default PWAInstallPrompt; 