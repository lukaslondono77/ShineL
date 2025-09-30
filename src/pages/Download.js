import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  useMediaQuery,
  useTheme,
  Paper
} from '@mui/material';
import {
  GetApp as GetAppIcon,
  PhoneAndroid as AndroidIcon,
  PhoneIphone as IphoneIcon,
  Computer as ComputerIcon,
  CheckCircle as CheckIcon,
  ArrowForward as ArrowIcon,
  Share as ShareIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Download = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);

  useEffect(() => {
    // Check if PWA is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPWAInstalled(true);
    }

    // Listen for install prompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setIsPWAInstalled(true);
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Global Chat App',
          text: 'Check out this awesome real-time chat app!',
          url: window.location.origin
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.origin);
      alert('Link copied to clipboard!');
    }
  };

  const installationSteps = {
    android: [
      'Open Chrome browser on your Android device',
      'Navigate to the Global Chat app',
      'Tap the three dots menu (⋮) in the top right',
      'Select "Add to Home screen" or "Install app"',
      'Tap "Add" to confirm installation',
      'The app will now appear on your home screen'
    ],
    iphone: [
      'Open Safari browser on your iPhone',
      'Navigate to the Global Chat app',
      'Tap the Share button (square with arrow)',
      'Scroll down and tap "Add to Home Screen"',
      'Tap "Add" to confirm',
      'The app will now appear on your home screen'
    ],
    desktop: [
      'Open Chrome browser on your computer',
      'Navigate to the Global Chat app',
      'Look for the install icon in the address bar',
      'Click the install icon (usually looks like a download symbol)',
      'Click "Install" in the popup',
      'The app will open in a new window'
    ]
  };

  if (isPWAInstalled) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
        <Box textAlign="center" sx={{ mb: 4 }}>
          <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom>
            App Already Installed!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            You're already using the Global Chat app. Enjoy chatting with the community!
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => window.location.href = '/chat'}
            startIcon={<ArrowIcon />}
            sx={{ mr: 2 }}
          >
            Go to Chat
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={handleShare}
            startIcon={<ShareIcon />}
          >
            Share App
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Header Section */}
      <Box textAlign="center" sx={{ mb: 6 }}>
        <GetAppIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h3" component="h1" gutterBottom>
          Download Global Chat
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          Install our app for the best experience on your device
        </Typography>
        
        {showInstallPrompt && (
          <Alert 
            severity="info" 
            sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={handleInstall}
                startIcon={<GetAppIcon />}
              >
                Install Now
              </Button>
            }
          >
            You can install Global Chat as an app for a better experience!
          </Alert>
        )}
      </Box>

      {/* Installation Instructions */}
      <Grid container spacing={4}>
        {/* Android Instructions */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AndroidIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
                <Typography variant="h5" component="h2">
                  Android
                </Typography>
              </Box>
              <List dense>
                {installationSteps.android.map((step, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <Typography variant="body2" color="primary.main" fontWeight="bold">
                        {index + 1}.
                      </Typography>
                    </ListItemIcon>
                    <ListItemText 
                      primary={step}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* iPhone Instructions */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <IphoneIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
                <Typography variant="h5" component="h2">
                  iPhone
                </Typography>
              </Box>
              <List dense>
                {installationSteps.iphone.map((step, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <Typography variant="body2" color="primary.main" fontWeight="bold">
                        {index + 1}.
                      </Typography>
                    </ListItemIcon>
                    <ListItemText 
                      primary={step}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Desktop Instructions */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ComputerIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
                <Typography variant="h5" component="h2">
                  Desktop
                </Typography>
              </Box>
              <List dense>
                {installationSteps.desktop.map((step, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <Typography variant="body2" color="primary.main" fontWeight="bold">
                        {index + 1}.
                      </Typography>
                    </ListItemIcon>
                    <ListItemText 
                      primary={step}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Benefits Section */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h4" component="h2" textAlign="center" gutterBottom>
          Why Install the App?
        </Typography>
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3, textAlign: 'center', height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                📱 Native Experience
              </Typography>
              <Typography variant="body2" color="text.secondary">
                App-like interface with smooth animations and native feel
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3, textAlign: 'center', height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                ⚡ Faster Loading
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cached resources for instant loading and offline access
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3, textAlign: 'center', height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                🔔 Push Notifications
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Get notified of new messages even when the app is closed
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3, textAlign: 'center', height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                💾 Save Space
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No app store download required, installs directly from browser
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ mt: 6, textAlign: 'center' }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleShare}
          startIcon={<ShareIcon />}
          sx={{ mr: 2, mb: 2 }}
        >
          Share App
        </Button>
        <Button
          variant="outlined"
          size="large"
          onClick={() => window.location.href = '/chat'}
          startIcon={<ArrowIcon />}
          sx={{ mb: 2 }}
        >
          Continue to Chat
        </Button>
      </Box>

      {/* Info Alert */}
      <Alert severity="info" sx={{ mt: 4 }}>
        <Typography variant="body2">
          <strong>Note:</strong> This is a Progressive Web App (PWA) that works on all modern browsers. 
          No app store download required - it installs directly from your browser!
        </Typography>
      </Alert>
    </Container>
  );
};

export default Download; 