import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Card, 
  CardContent,
  Grid
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChatIcon from '@mui/icons-material/Chat';
import GroupIcon from '@mui/icons-material/Group';
import SecurityIcon from '@mui/icons-material/Security';
import GetAppIcon from '@mui/icons-material/GetApp';

const Home = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const features = [
    {
      icon: <ChatIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Real-time Chat',
      description: 'Send and receive messages instantly with real-time updates'
    },
    {
      icon: <GroupIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Global Community',
      description: 'Connect with users from around the world in a shared chat space'
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Secure & Private',
      description: 'Your messages are encrypted and your privacy is protected'
    }
  ];

  return (
    <Container 
      maxWidth="lg" 
      sx={{ 
        mt: isMobile ? 2 : 4,
        mb: isMobile ? 8 : 4,
        px: isMobile ? 1 : 3
      }}
    >
      {/* Welcome Section */}
      <Box sx={{ 
        textAlign: 'center', 
        mb: isMobile ? 4 : 6,
        py: isMobile ? 2 : 4
      }}>
        <Typography 
          variant={isMobile ? "h4" : "h3"} 
          component="h1" 
          gutterBottom
          sx={{ 
            fontWeight: 'bold',
            color: 'primary.main',
            mb: 2
          }}
        >
          Welcome to ChatApp
        </Typography>
        <Typography 
          variant={isMobile ? "body1" : "h6"} 
          color="text.secondary"
          sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}
        >
          Join our global community and start chatting with people from around the world. 
          Share thoughts, ideas, and connect in real-time.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/chat')}
            sx={{ 
              px: 4, 
              py: 1.5,
              fontSize: isMobile ? '1rem' : '1.1rem',
              borderRadius: 2
            }}
          >
            Start Chatting
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/download')}
            startIcon={<GetAppIcon />}
            sx={{ 
              px: 4, 
              py: 1.5,
              fontSize: isMobile ? '1rem' : '1.1rem',
              borderRadius: 2
            }}
          >
            Download App
          </Button>
        </Box>
      </Box>

      {/* Features Section */}
      <Box sx={{ mb: isMobile ? 4 : 6 }}>
        <Typography 
          variant={isMobile ? "h5" : "h4"} 
          component="h2" 
          textAlign="center"
          sx={{ mb: 4, fontWeight: 'bold' }}
        >
          Features
        </Typography>
        <Grid container spacing={isMobile ? 2 : 4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card 
                sx={{ 
                  height: '100%',
                  textAlign: 'center',
                  p: isMobile ? 2 : 3,
                  borderRadius: 2,
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    transition: 'transform 0.3s ease-in-out',
                    boxShadow: 4
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography 
                    variant="h6" 
                    component="h3" 
                    gutterBottom
                    sx={{ fontWeight: 'bold' }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* User Info Section */}
      {user && (
        <Box sx={{ 
          textAlign: 'center',
          p: isMobile ? 2 : 3,
          bgcolor: 'background.paper',
          borderRadius: 2,
          border: 1,
          borderColor: 'divider'
        }}>
          <Typography variant="h6" gutterBottom>
            Welcome back, {user.username}!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You're logged in and ready to chat. Click the button above to join the conversation.
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default Home; 