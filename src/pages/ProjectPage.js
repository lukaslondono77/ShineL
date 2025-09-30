import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography, Chip, Avatar, AvatarGroup, Tooltip, IconButton } from '@mui/material';
import { DragHandle, Chat as ChatIcon } from '@mui/icons-material';
import { useProject } from '../context/ProjectContext';
import FileExplorer from '../components/FileExplorer';
import CodeEditor from '../components/CodeEditor';
import Terminal from '../components/Terminal';
import ChatPanel from '../components/ChatPanel';

const ProjectPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    loadProject,
    leaveProject,
    currentProject,
    openFiles,
    activeFileId,
    activeUsers
  } = useProject();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [terminalHeight, setTerminalHeight] = useState(300);
  const [isDragging, setIsDragging] = useState(false);
  const [showChat, setShowChat] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        await loadProject(id);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load project:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    load();

    return () => {
      leaveProject();
    };
  }, [id]);

  const activeFile = openFiles.find(f => f._id === activeFileId);

  // Handle terminal resize dragging
  const handleMouseDown = () => {
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      const windowHeight = window.innerHeight;
      const topBarHeight = 48; // Top bar height
      const newTerminalHeight = windowHeight - e.clientY;
      
      // Constrain between 100px and 70% of window height
      const minHeight = 100;
      const maxHeight = (windowHeight - topBarHeight) * 0.7;
      
      if (newTerminalHeight >= minHeight && newTerminalHeight <= maxHeight) {
        setTerminalHeight(newTerminalHeight);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          bgcolor: '#1e1e1e'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          bgcolor: '#1e1e1e',
          color: '#fff'
        }}
      >
        <Box textAlign="center">
          <Typography variant="h5" color="error" gutterBottom>
            Failed to load project
          </Typography>
          <Typography color="text.secondary">{error}</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#1e1e1e' }}>
      {/* Top Bar */}
      <Box
        sx={{
          height: 48,
          bgcolor: '#2d2d2d',
          borderBottom: '1px solid #1e1e1e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography
            variant="h6"
            sx={{ color: '#fff', cursor: 'pointer' }}
            onClick={() => navigate('/projects')}
          >
            {currentProject?.name || 'Project'}
          </Typography>
          <Chip
            label={currentProject?.language || 'unknown'}
            size="small"
            sx={{ bgcolor: '#4caf50', color: '#fff', fontSize: '11px' }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Active Users */}
          {activeUsers.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ color: '#9e9e9e' }}>
                {activeUsers.length} active
              </Typography>
              <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 28, height: 28, fontSize: 12 } }}>
                {activeUsers.map((user, index) => (
                  <Tooltip key={user.userId || index} title={user.username || 'User'}>
                    <Avatar sx={{ bgcolor: '#2196f3' }}>
                      {(user.username || 'U')[0].toUpperCase()}
                    </Avatar>
                  </Tooltip>
                ))}
              </AvatarGroup>
            </Box>
          )}

          {/* Chat Toggle */}
          <Tooltip title={showChat ? 'Hide Chat' : 'Show Chat'}>
            <IconButton
              size="small"
              onClick={() => setShowChat(!showChat)}
              sx={{
                color: showChat ? '#1976d2' : '#9e9e9e',
                bgcolor: showChat ? 'rgba(25, 118, 210, 0.1)' : 'transparent'
              }}
            >
              <ChatIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
          {/* File Explorer */}
          <Box sx={{ width: 250, borderRight: '1px solid #2d2d2d', overflow: 'hidden' }}>
            <FileExplorer />
          </Box>

          {/* Code Editor + Terminal */}
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Code Editor */}
            <Box sx={{ flexGrow: 1, minHeight: 0, overflow: 'hidden' }}>
              <CodeEditor file={activeFile} />
            </Box>

            {/* Resizable Divider */}
            <Box
              onMouseDown={handleMouseDown}
              sx={{
                height: 6,
                bgcolor: isDragging ? '#1976d2' : '#2d2d2d',
                cursor: 'ns-resize',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: isDragging ? 'none' : 'background-color 0.2s',
                '&:hover': {
                  bgcolor: '#1976d2'
                },
                userSelect: 'none'
              }}
            >
              <DragHandle 
                sx={{ 
                  fontSize: 16, 
                  color: '#666',
                  transform: 'rotate(90deg)'
                }} 
              />
            </Box>

            {/* Terminal / Output */}
            <Box sx={{ height: terminalHeight, overflow: 'hidden' }}>
              <Terminal />
            </Box>
          </Box>

          {/* Chat Panel */}
          {showChat && <ChatPanel onClose={() => setShowChat(false)} />}
        </Box>
      </Box>
    </Box>
  );
};

export default ProjectPage;
