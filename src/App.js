import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, useMediaQuery } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { useAuth } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';

// Components
import Navbar from './components/Navbar';
import FloatingDownloadButton from './components/FloatingDownloadButton';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Download from './pages/Download';
import Projects from './pages/Projects';
import ProjectPage from './pages/ProjectPage';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

function App() {
  const isMobile = useMediaQuery('(max-width:768px)');

  const theme = createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
    },
    typography: {
      // Mobile-friendly typography
      h6: {
        fontSize: isMobile ? '1.1rem' : '1.25rem',
        fontWeight: 500,
      },
      body1: {
        fontSize: isMobile ? '0.9rem' : '1rem',
      },
      body2: {
        fontSize: isMobile ? '0.8rem' : '0.875rem',
      },
      caption: {
        fontSize: isMobile ? '0.7rem' : '0.75rem',
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            // Ensure touch targets are large enough
            minHeight: isMobile ? '44px' : '36px',
            borderRadius: isMobile ? '8px' : '4px',
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            // Ensure touch targets are large enough
            minWidth: isMobile ? '44px' : '40px',
            minHeight: isMobile ? '44px' : '40px',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            // Prevent zoom on iOS
            '& input': {
              fontSize: isMobile ? '16px' : '14px',
            },
          },
        },
      },
      MuiContainer: {
        styleOverrides: {
          root: {
            paddingLeft: isMobile ? '8px' : '16px',
            paddingRight: isMobile ? '8px' : '16px',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: isMobile ? '8px' : '4px',
          },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ProjectProvider>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/download" element={<Download />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <PrivateRoute>
                <Chat />
              </PrivateRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <PrivateRoute>
                <Projects />
              </PrivateRoute>
            }
          />
          <Route
            path="/projects/:id"
            element={
              <PrivateRoute>
                <ProjectPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
        </Routes>
        <FloatingDownloadButton />
      </ProjectProvider>
    </ThemeProvider>
  );
}

export default App; 