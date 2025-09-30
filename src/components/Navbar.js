import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  useMediaQuery,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Menu as MenuIcon,
  Chat as ChatIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Home as HomeIcon,
  GetApp as GetAppIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    setMobileMenuOpen(false);
    logout();
    navigate('/login');
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileNavigation = (path) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  const mobileMenuItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/' },
    { text: 'Projects', icon: <CodeIcon />, path: '/projects' },
    { text: 'Chat', icon: <ChatIcon />, path: '/chat' },
    { text: 'Profile', icon: <PersonIcon />, path: '/profile' },
    { text: 'Download App', icon: <GetAppIcon />, path: '/download' },
  ];

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: 'inherit',
            fontSize: { xs: '1rem', sm: '1.25rem' }
          }}
        >
          Image Share
        </Typography>

        {user ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isMobile ? (
              <>
                <IconButton
                  color="inherit"
                  onClick={handleMobileMenuToggle}
                  sx={{ mr: 1 }}
                >
                  <MenuIcon />
                </IconButton>
                <IconButton
                  size="large"
                  onClick={handleMenu}
                  color="inherit"
                >
                  <Avatar sx={{ width: 32, height: 32 }}>
                    {user.username[0].toUpperCase()}
                  </Avatar>
                </IconButton>
              </>
            ) : (
              <>
                <Button
                  color="inherit"
                  component={RouterLink}
                  to="/projects"
                  sx={{ mr: 1 }}
                >
                  Projects
                </Button>
                <Button
                  color="inherit"
                  component={RouterLink}
                  to="/chat"
                  sx={{ mr: 1 }}
                >
                  Chat
                </Button>
                <IconButton
                  size="large"
                  onClick={handleMenu}
                  color="inherit"
                >
                  <Avatar sx={{ width: 32, height: 32 }}>
                    {user.username[0].toUpperCase()}
                  </Avatar>
                </IconButton>
              </>
            )}
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem
                component={RouterLink}
                to="/profile"
                onClick={handleClose}
              >
                Profile
              </MenuItem>
              <MenuItem
                component={RouterLink}
                to="/download"
                onClick={handleClose}
                startIcon={<GetAppIcon />}
              >
                Download App
              </MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              color="inherit"
              component={RouterLink}
              to="/login"
              size={isMobile ? "small" : "medium"}
            >
              Login
            </Button>
            <Button
              color="inherit"
              component={RouterLink}
              to="/register"
              size={isMobile ? "small" : "medium"}
            >
              Register
            </Button>
          </Box>
        )}
      </Toolbar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        PaperProps={{
          sx: {
            width: 250,
            bgcolor: 'background.paper'
          }
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {user?.username}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.email}
          </Typography>
        </Box>
        
        <List sx={{ pt: 1 }}>
          {mobileMenuItems.map((item) => (
            <ListItem
              key={item.text}
              button
              onClick={() => handleMobileNavigation(item.path)}
              sx={{
                '&:hover': {
                  bgcolor: 'action.hover'
                }
              }}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
          
          <ListItem
            button
            onClick={handleLogout}
            sx={{
              '&:hover': {
                bgcolor: 'error.light'
              }
            }}
          >
            <ListItemIcon>
              <LogoutIcon color="error" />
            </ListItemIcon>
            <ListItemText 
              primary="Logout" 
              sx={{ color: 'error.main' }}
            />
          </ListItem>
        </List>
      </Drawer>
    </AppBar>
  );
};

export default Navbar; 