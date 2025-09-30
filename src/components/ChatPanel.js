import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Paper,
  Divider
} from '@mui/material';
import { Send, Close } from '@mui/icons-material';
import { useProject } from '../context/ProjectContext';
import api from '../utils/api';

const ChatPanel = ({ onClose }) => {
  const { currentProject, socket } = useProject();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const chatId = getChatId();
    if (chatId) {
      loadMessages(chatId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProject]);

  useEffect(() => {
    const chatId = getChatId();
    if (!socket || !chatId) return;

    // Join chat room
    socket.emit('join', chatId);

    // Listen for new messages
    const handleNewMessage = (message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
      if (chatId) {
        socket.emit('leave', chatId);
      }
    };
  }, [socket, currentProject]);

  const getChatId = () => {
    if (!currentProject?.chat) return null;
    // Handle both populated object and ID string
    return typeof currentProject.chat === 'object' ? currentProject.chat._id : currentProject.chat;
  };

  const loadMessages = async (chatId) => {
    try {
      const response = await api.get(`/chats/${chatId}`);
      setMessages(response.data.messages || []);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const chatId = getChatId();
    if (!chatId) return;

    try {
      const response = await api.post(`/chats/${chatId}/messages`, {
        content: newMessage,
        type: 'text'
      });

      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
      scrollToBottom();

      // Emit to socket for real-time
      if (socket) {
        socket.emit('send_message', response.data);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box
      sx={{
        width: 300,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#252526',
        borderLeft: '1px solid #2d2d2d'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 1.5,
          borderBottom: '1px solid #2d2d2d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Typography variant="subtitle2" sx={{ color: '#9e9e9e', fontWeight: 500 }}>
          TEAM CHAT
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: '#9e9e9e' }}>
          <Close fontSize="small" />
        </IconButton>
      </Box>

      {/* Messages */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5
        }}
      >
        {messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="body2" sx={{ color: '#666' }}>
              No messages yet
            </Typography>
            <Typography variant="caption" sx={{ color: '#666' }}>
              Start chatting with your team!
            </Typography>
          </Box>
        ) : (
          messages.map((msg, index) => (
            <Box key={msg._id || index} sx={{ display: 'flex', gap: 1 }}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: '#1976d2',
                  fontSize: 14
                }}
              >
                {msg.sender?.username?.[0]?.toUpperCase() || 'U'}
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.5 }}>
                  <Typography
                    variant="body2"
                    sx={{ color: '#fff', fontWeight: 500, fontSize: 13 }}
                  >
                    {msg.sender?.username || 'Unknown'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#666', fontSize: 11 }}>
                    {formatTime(msg.createdAt)}
                  </Typography>
                </Box>
                <Paper
                  sx={{
                    p: 1,
                    bgcolor: '#1e1e1e',
                    border: '1px solid #333',
                    borderRadius: 1
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#ccc',
                      fontSize: 13,
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {msg.content}
                  </Typography>
                </Paper>
              </Box>
            </Box>
          ))
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input */}
      <Box
        component="form"
        onSubmit={handleSendMessage}
        sx={{
          p: 1.5,
          borderTop: '1px solid #2d2d2d',
          bgcolor: '#1e1e1e'
        }}
      >
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                bgcolor: '#252526',
                fontSize: 13,
                '& fieldset': {
                  borderColor: '#2d2d2d'
                },
                '&:hover fieldset': {
                  borderColor: '#1976d2'
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#1976d2'
                }
              },
              '& .MuiInputBase-input::placeholder': {
                color: '#666',
                opacity: 1
              }
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
          <IconButton
            type="submit"
            sx={{
              bgcolor: '#1976d2',
              color: '#fff',
              '&:hover': {
                bgcolor: '#1565c0'
              },
              '&:disabled': {
                bgcolor: '#333',
                color: '#666'
              }
            }}
            disabled={!newMessage.trim()}
          >
            <Send fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default ChatPanel;
