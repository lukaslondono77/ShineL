import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  ListItemAvatar,
  useMediaQuery,
  useTheme,
  AppBar,
  Toolbar,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  Send as SendIcon,
  People as PeopleIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  Mic as MicIcon,
  Keyboard as KeyboardIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';
import PWAInstallPrompt from '../components/PWAInstallPrompt';
import AudioRecorder from '../components/AudioRecorder';
import AudioMessage from '../components/AudioMessage';
import API_URL from '../utils/api';

const Chat = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showParticipants, setShowParticipants] = useState(false);
  const [inputMode, setInputMode] = useState('text'); // 'text' or 'audio'
  const messagesEndRef = useRef();
  const socketRef = useRef();
  const messageListenerRegistered = useRef(false);

  useEffect(() => {
    fetchChats();
    const SOCKET_URL = process.env.REACT_APP_API_URL || 'https://chat-app-backend-6e9b.onrender.com';
    
    console.log('🔄 Component mounting - Creating Socket.IO connection to:', SOCKET_URL);
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on('connect', () => {
      console.log('✅ Socket.IO connected with ID:', socketRef.current.id);
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ Socket.IO disconnected');
    });

    return () => {
      console.log('🔄 Component unmounting - Cleaning up Socket.IO connection');
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (chats.length > 0 && !selectedChat) {
      // Automatically select the first (and only) chat (Global Chat)
      setSelectedChat(chats[0]);
    }
  }, [chats, selectedChat]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat._id);
      socketRef.current.emit('join', selectedChat._id);
    }

    return () => {
      if (selectedChat) {
        socketRef.current.emit('leave', selectedChat._id);
      }
    };
  }, [selectedChat, isMobile]);

  useEffect(() => {
    // Only register listener once when socket is available
    if (!socketRef.current || messageListenerRegistered.current) {
      console.log('🚫 Skipping message listener registration:', {
        socketExists: !!socketRef.current,
        alreadyRegistered: messageListenerRegistered.current
      });
      return;
    }

    console.log('🎯 Registering message listener for the first time - Socket ID:', socketRef.current.id);
    messageListenerRegistered.current = true;
    
    socketRef.current.on('message', (message) => {
      console.log('📨 Received message via Socket.IO:', {
        id: message._id,
        content: message.content,
        audioUrl: message.audioUrl,
        messageType: message.messageType,
        sender: message.sender?.username,
        timestamp: new Date().toISOString(),
        socketId: socketRef.current?.id
      });
      
      if (message && message.sender && (message.content || message.audioUrl)) {
        setMessages((prev) => {
          // Check if message already exists to prevent duplicates
          const messageExists = prev.some(msg => msg._id === message._id);
          if (messageExists) {
            console.log('🚫 Message already exists, not adding duplicate:', message._id);
            return prev;
          }
          
          console.log('✅ Adding new message to state:', message._id);
          return [...prev, message];
        });
      } else {
        console.error('❌ Invalid message structure received:', message);
      }
    });

    // Cleanup function
    return () => {
      if (socketRef.current) {
        console.log('🧹 Cleaning up message listener for socket:', socketRef.current.id);
        socketRef.current.off('message');
        messageListenerRegistered.current = false;
      }
    };
  }, [socketRef.current?.connected]);

  const fetchChats = async () => {
    try {
      const res = await axios.get('/api/chats');
      setChats(res.data);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const res = await axios.get(`/api/chats/${chatId}`);
      setMessages(res.data.messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    console.log('Sending message:', {
      content: newMessage,
      chatId: selectedChat._id,
      userId: user._id
    });

    try {
      const res = await axios.post(`/api/chats/${selectedChat._id}/messages`, {
        content: newMessage
      });
      
      console.log('Message sent successfully via HTTP:', res.data);
      
      // Don't manually add the message here - let Socket.IO handle it
      // setMessages((prev) => [...prev, res.data]);
      setNewMessage('');

      // Don't emit via Socket.IO - the backend will handle this
      // socketRef.current.emit('message', {
      //   chatId: selectedChat._id,
      //   message: res.data
      // });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSendAudio = async (audioUrl, duration) => {
    try {
      console.log('Sending audio message:', {
        audioUrl,
        duration,
        chatId: selectedChat._id
      });

      const res = await axios.post(`${API_URL}/api/audio/chats/${selectedChat._id}/audio`, {
        audioUrl,
        audioDuration: duration
      });
      
      console.log('Audio message sent successfully:', res.data);
      
    } catch (error) {
      console.error('Error sending audio message:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
      }
    }
  };

  const renderMessage = (message) => {
    // Add null checks to prevent errors
    if (!message || !message.sender || !user) {
      return null;
    }
    
    const isOwnMessage = message.sender._id === user._id;
    
    return (
      <Box
        key={message._id}
        sx={{
          display: 'flex',
          justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
          mb: 2,
          px: 1
        }}
      >
        <Box
          sx={{
            maxWidth: isMobile ? '80%' : '60%',
            display: 'flex',
            flexDirection: isOwnMessage ? 'row-reverse' : 'row',
            alignItems: 'flex-end',
            gap: 1
          }}
        >
          {!isOwnMessage && (
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: 'primary.main',
                fontSize: '0.875rem'
              }}
            >
              {message.sender.username[0].toUpperCase()}
            </Avatar>
          )}
          
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
              maxWidth: '100%'
            }}
          >
            {!isOwnMessage && (
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  mb: 0.5,
                  fontSize: '0.75rem'
                }}
              >
                {message.sender.username}
              </Typography>
            )}
            
            {message.messageType === 'audio' ? (
              <AudioMessage
                audioUrl={message.audioUrl}
                duration={message.audioDuration}
                isOwnMessage={isOwnMessage}
              />
            ) : (
              <Paper
                elevation={1}
                sx={{
                  p: 1.5,
                  bgcolor: isOwnMessage ? 'primary.main' : 'background.paper',
                  color: isOwnMessage ? 'primary.contrastText' : 'text.primary',
                  borderRadius: 2,
                  border: 1,
                  borderColor: isOwnMessage ? 'primary.main' : 'divider',
                  wordBreak: 'break-word',
                  maxWidth: '100%'
                }}
              >
                <Typography variant="body2">
                  {message.content}
                </Typography>
              </Paper>
            )}
            
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                mt: 0.5,
                fontSize: '0.7rem'
              }}
            >
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (isMobile) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Mobile Header */}
        <AppBar position="static">
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => window.history.back()}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              {selectedChat?.name || 'Chat'}
            </Typography>
            <IconButton
              color="inherit"
              onClick={() => setShowParticipants(true)}
            >
              <PeopleIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Messages Area */}
        <Box
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            p: 1,
            bgcolor: 'background.default'
          }}
        >
          {messages.map(renderMessage)}
          <div ref={messagesEndRef} />
        </Box>

        {/* Input Area */}
        <Box sx={{ p: 2, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
          {inputMode === 'text' ? (
            <Box component="form" onSubmit={handleSendMessage} sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Escribe un mensaje..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                sx={{ flexGrow: 1 }}
              />
              <IconButton
                type="submit"
                color="primary"
                disabled={!newMessage.trim()}
                sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
              >
                <SendIcon />
              </IconButton>
              <IconButton
                onClick={() => setInputMode('audio')}
                color="primary"
              >
                <MicIcon />
              </IconButton>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <AudioRecorder onSendAudio={handleSendAudio} />
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <IconButton
                  onClick={() => setInputMode('text')}
                  color="primary"
                >
                  <KeyboardIcon />
                </IconButton>
              </Box>
            </Box>
          )}
        </Box>

        {/* Participants Dialog */}
        <Dialog
          open={showParticipants}
          onClose={() => setShowParticipants(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>
            Participantes
            <IconButton
              onClick={() => setShowParticipants(false)}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <List>
              {selectedChat?.participants?.map((participant) => (
                <ListItem key={participant._id}>
                  <ListItemAvatar>
                    <Avatar>
                      {participant.username[0].toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={participant.username} />
                </ListItem>
              ))}
            </List>
          </DialogContent>
        </Dialog>

        <PWAInstallPrompt />
      </Box>
    );
  }

  // Desktop layout
  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 2, height: 'calc(100vh - 100px)' }}>
      <Grid container spacing={2} sx={{ height: '100%' }}>
        {/* Chat List */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ height: '100%', overflow: 'hidden' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">Chats</Typography>
            </Box>
            <List sx={{ overflowY: 'auto', maxHeight: 'calc(100% - 70px)' }}>
              {chats.map((chat) => (
                <ListItem
                  key={chat._id}
                  button
                  selected={selectedChat?._id === chat._id}
                  onClick={() => setSelectedChat(chat)}
                >
                  <ListItemAvatar>
                    <Avatar>
                      {chat.name[0].toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={chat.name}
                    secondary={`${chat.participants?.length || 0} participantes`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Chat Area */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Chat Header */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6">
                {selectedChat?.name || 'Selecciona un chat'}
              </Typography>
              {selectedChat && (
                <IconButton
                  onClick={() => setShowParticipants(true)}
                  size="small"
                >
                  <PeopleIcon />
                </IconButton>
              )}
            </Box>

            {/* Messages Area */}
            <Box
              sx={{
                flexGrow: 1,
                overflowY: 'auto',
                p: 2,
                bgcolor: 'background.default'
              }}
            >
              {selectedChat ? (
                messages.map(renderMessage)
              ) : (
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                  <Typography variant="h6" color="text.secondary">
                    Selecciona un chat para comenzar
                  </Typography>
                </Box>
              )}
              <div ref={messagesEndRef} />
            </Box>

            {/* Input Area */}
            {selectedChat && (
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <ToggleButtonGroup
                  value={inputMode}
                  exclusive
                  onChange={(e, newMode) => newMode && setInputMode(newMode)}
                  size="small"
                  sx={{ mb: 1 }}
                >
                  <ToggleButton value="text">
                    <KeyboardIcon />
                  </ToggleButton>
                  <ToggleButton value="audio">
                    <MicIcon />
                  </ToggleButton>
                </ToggleButtonGroup>
                
                {inputMode === 'text' ? (
                  <Box component="form" onSubmit={handleSendMessage} sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Escribe un mensaje..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={!newMessage.trim()}
                      startIcon={<SendIcon />}
                    >
                      Enviar
                    </Button>
                  </Box>
                ) : (
                  <AudioRecorder onSendAudio={handleSendAudio} />
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Participants Dialog */}
      <Dialog
        open={showParticipants}
        onClose={() => setShowParticipants(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Participantes
          <IconButton
            onClick={() => setShowParticipants(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <List>
            {selectedChat?.participants?.map((participant) => (
              <ListItem key={participant._id}>
                <ListItemAvatar>
                  <Avatar>
                    {participant.username[0].toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary={participant.username} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>

      <PWAInstallPrompt />
    </Container>
  );
};

export default Chat; 