import React, { useState, useRef, useEffect } from 'react';
import {
  IconButton,
  Box,
  Typography,
  LinearProgress,
  Button,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Mic as MicIcon,
  Stop as StopIcon,
  PlayArrow as PlayIcon,
  Delete as DeleteIcon,
  Send as SendIcon
} from '@mui/icons-material';
import API_URL from '../utils/api';

const AudioRecorder = ({ onSendAudio, disabled = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);
  const startTimeRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      startTimeRef.current = Date.now();
      
      // Update duration every 100ms
      intervalRef.current = setInterval(() => {
        setDuration((Date.now() - startTimeRef.current) / 1000);
      }, 100);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('No se pudo acceder al micrófono. Verifica los permisos.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const sendAudio = async () => {
    if (!audioBlob) return;
    
    setIsUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      console.log('Uploading audio to:', `${API_URL}/api/audio/upload`);
      
      const response = await fetch(`${API_URL}/api/audio/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      console.log('Upload response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload error response:', errorText);
        throw new Error(`Error uploading audio: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Upload successful:', data);
      
      // Send audio message
      await onSendAudio(data.audioUrl, Math.round(duration));
      
      // Clean up
      deleteRecording();
      
    } catch (error) {
      console.error('Error sending audio:', error);
      setError(`Error al enviar el audio: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {!audioBlob ? (
        // Recording interface
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            color={isRecording ? 'error' : 'primary'}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={disabled}
            sx={{
              bgcolor: isRecording ? 'error.main' : 'primary.main',
              color: 'white',
              '&:hover': {
                bgcolor: isRecording ? 'error.dark' : 'primary.dark',
              },
              width: isMobile ? 48 : 40,
              height: isMobile ? 48 : 40,
            }}
          >
            {isRecording ? <StopIcon /> : <MicIcon />}
          </IconButton>
          
          {isRecording && (
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Grabando... {formatTime(duration)}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(duration / 60) * 100} // Max 60 seconds
                sx={{ mt: 0.5 }}
              />
            </Box>
          )}
        </Box>
      ) : (
        // Playback interface
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
          <IconButton
            color="primary"
            onClick={isPlaying ? pauseAudio : playAudio}
            size="small"
          >
            {isPlaying ? <StopIcon /> : <PlayIcon />}
          </IconButton>
          
          <Box sx={{ flexGrow: 1, mx: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {formatTime(currentTime)} / {formatTime(duration)}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={(currentTime / duration) * 100}
              sx={{ mt: 0.5 }}
            />
          </Box>
          
          <IconButton
            color="error"
            onClick={deleteRecording}
            size="small"
            disabled={isUploading}
          >
            <DeleteIcon />
          </IconButton>
          
          <Button
            variant="contained"
            size="small"
            onClick={sendAudio}
            disabled={disabled || isUploading}
            startIcon={<SendIcon />}
          >
            {isUploading ? 'Enviando...' : 'Enviar'}
          </Button>
        </Box>
      )}
      
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleAudioEnded}
          style={{ display: 'none' }}
        />
      )}
    </Box>
  );
};

export default AudioRecorder; 