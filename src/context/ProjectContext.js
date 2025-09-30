import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import api from '../utils/api';

const ProjectContext = createContext();

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

export const ProjectProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [currentProject, setCurrentProject] = useState(null);
  const [files, setFiles] = useState([]);
  const [openFiles, setOpenFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [cursors, setCursors] = useState({});
  const [executionOutput, setExecutionOutput] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // Initialize Socket.IO connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5001', {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Load project
  const loadProject = useCallback(async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}`);
      setCurrentProject(response.data);
      setFiles(response.data.files || []);
      
      // Join project room
      if (socket) {
        socket.emit('join_project', {
          projectId,
          userId: response.data.owner._id || response.data.owner
        });
      }
    } catch (error) {
      console.error('Failed to load project:', error);
      throw error;
    }
  }, [socket]);

  // Leave project
  const leaveProject = useCallback(() => {
    if (socket && currentProject) {
      socket.emit('leave_project', {
        projectId: currentProject._id,
        userId: currentProject.owner._id || currentProject.owner
      });
    }
    setCurrentProject(null);
    setFiles([]);
    setOpenFiles([]);
    setActiveFileId(null);
    setActiveUsers([]);
    setCursors({});
  }, [socket, currentProject]);

  // Open file in editor
  const openFile = useCallback(async (file) => {
    // Check if already open
    const existingFile = openFiles.find(f => f._id === file._id);
    if (existingFile) {
      setActiveFileId(file._id);
      return;
    }

    // Load file content if not loaded
    if (!file.content) {
      try {
        const response = await api.get(`/projects/${currentProject._id}/files/${file._id}`);
        file = response.data;
      } catch (error) {
        console.error('Failed to load file:', error);
        return;
      }
    }

    setOpenFiles(prev => [...prev, file]);
    setActiveFileId(file._id);

    // Emit file_open event
    if (socket && currentProject) {
      socket.emit('file_open', {
        projectId: currentProject._id,
        fileId: file._id
      });
    }
  }, [openFiles, currentProject, socket]);

  // Close file
  const closeFile = useCallback((fileId) => {
    setOpenFiles(prev => prev.filter(f => f._id !== fileId));
    
    if (activeFileId === fileId) {
      const remaining = openFiles.filter(f => f._id !== fileId);
      setActiveFileId(remaining.length > 0 ? remaining[remaining.length - 1]._id : null);
    }

    if (socket && currentProject) {
      socket.emit('file_close', {
        projectId: currentProject._id,
        fileId
      });
    }
  }, [openFiles, activeFileId, socket, currentProject]);

  // Save file
  const saveFile = useCallback(async (fileId, content) => {
    try {
      await api.put(`/projects/${currentProject._id}/files/${fileId}`, { content });
      
      // Update local state
      setOpenFiles(prev => prev.map(f => 
        f._id === fileId ? { ...f, content } : f
      ));
      setFiles(prev => prev.map(f => 
        f._id === fileId ? { ...f, content } : f
      ));

      // Emit save event
      if (socket) {
        socket.emit('file_save', {
          projectId: currentProject._id,
          fileId,
          content
        });
      }
    } catch (error) {
      console.error('Failed to save file:', error);
      throw error;
    }
  }, [currentProject, socket]);

  // Create file
  const createFile = useCallback(async (name, type = 'file', parent = null) => {
    if (!currentProject) {
      console.error('No project loaded');
      throw new Error('No project loaded. Please select a project first.');
    }
    
    try {
      console.log('Creating file/folder:', { name, type, parent, projectId: currentProject._id });
      const response = await api.post(`/projects/${currentProject._id}/files`, {
        name,
        type,
        parent
      });
      
      console.log('File created successfully:', response.data);
      setFiles(prev => [...prev, response.data]);
      return response.data;
    } catch (error) {
      console.error('Failed to create file:', error);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  }, [currentProject]);

  // Delete file
  const deleteFile = useCallback(async (fileId) => {
    try {
      await api.delete(`/projects/${currentProject._id}/files/${fileId}`);
      setFiles(prev => prev.filter(f => f._id !== fileId));
      
      // Close if open
      if (openFiles.find(f => f._id === fileId)) {
        closeFile(fileId);
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  }, [currentProject, openFiles, closeFile]);

  // Execute code
  const executeCode = useCallback(async (code, language, input = '') => {
    try {
      setIsExecuting(true);
      setExecutionOutput(null);

      const response = await api.post('/execute', {
        code,
        language,
        input,
        projectId: currentProject?._id,
        fileId: activeFileId
      });

      setExecutionOutput(response.data);
      setIsExecuting(false);
      return response.data;
    } catch (error) {
      console.error('Execution failed:', error);
      setExecutionOutput({
        output: {
          error: error.response?.data?.message || error.message
        },
        status: 'error'
      });
      setIsExecuting(false);
      throw error;
    }
  }, [currentProject, activeFileId]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // User joined/left
    socket.on('user_joined', ({ userId, username }) => {
      setActiveUsers(prev => [...prev, { userId, username }]);
      console.log(`${username} joined the project`);
    });

    socket.on('user_left', ({ userId }) => {
      setActiveUsers(prev => prev.filter(u => u.userId !== userId));
      setCursors(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    });

    socket.on('project_users', ({ activeUsers }) => {
      setActiveUsers(activeUsers);
    });

    // File events
    socket.on('file_created', ({ file }) => {
      setFiles(prev => [...prev, file]);
    });

    socket.on('file_deleted', ({ fileId }) => {
      setFiles(prev => prev.filter(f => f._id !== fileId));
      if (openFiles.find(f => f._id === fileId)) {
        closeFile(fileId);
      }
    });

    socket.on('file_renamed', ({ fileId, newName, language }) => {
      setFiles(prev => prev.map(f => 
        f._id === fileId ? { ...f, name: newName, language } : f
      ));
      setOpenFiles(prev => prev.map(f => 
        f._id === fileId ? { ...f, name: newName, language } : f
      ));
    });

    // Execution complete
    socket.on('execution_complete', (data) => {
      setExecutionOutput(data);
      setIsExecuting(false);
    });

    return () => {
      socket.off('user_joined');
      socket.off('user_left');
      socket.off('project_users');
      socket.off('file_created');
      socket.off('file_deleted');
      socket.off('file_renamed');
      socket.off('execution_complete');
    };
  }, [socket, openFiles, closeFile]);

  const value = {
    socket,
    currentProject,
    files,
    openFiles,
    activeFileId,
    activeUsers,
    cursors,
    executionOutput,
    isExecuting,
    loadProject,
    leaveProject,
    openFile,
    closeFile,
    saveFile,
    createFile,
    deleteFile,
    executeCode,
    setActiveFileId,
    setCursors
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};

export default ProjectContext;
