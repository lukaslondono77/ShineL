import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  IconButton,
  Typography,
  LinearProgress,
  Paper,
  useTheme,
  useMediaQuery,
  Alert
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Mic as MicIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { getFileUrl } from '../utils/api';

const AudioMessage = ({ audioUrl, duration, isOwnMessage }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [audioBlob, setAudioBlob] = useState(null);
  
  const audioRef = useRef(null);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Load audio file using fetch to avoid CORS issues
  const loadAudio = async () => {
    try {
      setIsLoading(true);
      setHasError(false);
      
      const fullAudioUrl = getFileUrl(audioUrl);
      console.log('Loading audio via fetch from:', fullAudioUrl);
      
      const response = await fetch(fullAudioUrl, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'audio/wav,audio/*,*/*'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const audioObjectUrl = URL.createObjectURL(blob);
      
      setAudioBlob(audioObjectUrl);
      setIsLoaded(true);
      setIsLoading(false);
      
      console.log('Audio loaded successfully via fetch');
      
    } catch (error) {
      console.error('Error loading audio via fetch:', error);
      setIsLoading(false);
      setHasError(true);
      setIsLoaded(false);
    }
  };

  useEffect(() => {
    loadAudio();
    
    // Cleanup function to revoke object URL
    return () => {
      if (audioBlob) {
        URL.revokeObjectURL(audioBlob);
      }
    };
  }, [audioUrl]);

  const handlePlay = () => {
    if (audioRef.current && audioBlob) {
      audioRef.current.play().catch(error => {
        console.error('Error playing audio:', error);
        setHasError(true);
      });
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    setIsLoaded(true);
    setIsLoading(false);
    setHasError(false);
    console.log('Audio metadata loaded successfully');
  };

  const handleCanPlay = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleError = (error) => {
    console.error('Error with audio element:', error);
    setIsLoading(false);
    setHasError(true);
    setIsLoaded(false);
  };

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    setIsLoaded(false);
    loadAudio();
  };

  if (hasError) {
    return (
      <Paper
        elevation={1}
        sx={{
          p: 1.5,
          maxWidth: isMobile ? 250 : 300,
          bgcolor: isOwnMessage ? 'primary.light' : 'background.paper',
          color: isOwnMessage ? 'primary.contrastText' : 'text.primary',
          borderRadius: 2,
          border: 1,
          borderColor: 'error.main',
          position: 'relative'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <MicIcon sx={{ fontSize: 20, color: 'error.main' }} />
          <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'error.main' }}>
            Error al cargar audio
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            size="small"
            onClick={handleRetry}
            sx={{
              color: 'error.main',
              '&:hover': {
                bgcolor: 'error.light',
              }
            }}
          >
            <RefreshIcon />
          </IconButton>
          
          <Typography variant="caption" color="text.secondary">
            No se pudo cargar el audio. Toca el botón para reintentar.
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={1}
      sx={{
        p: 1.5,
        maxWidth: isMobile ? 250 : 300,
        bgcolor: isOwnMessage ? 'primary.light' : 'background.paper',
        color: isOwnMessage ? 'primary.contrastText' : 'text.primary',
        borderRadius: 2,
        border: 1,
        borderColor: isOwnMessage ? 'primary.main' : 'divider',
        position: 'relative'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <MicIcon sx={{ fontSize: 20, color: isOwnMessage ? 'primary.contrastText' : 'primary.main' }} />
        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
          Mensaje de voz
        </Typography>
        {isLoading && (
          <Typography variant="caption" color="text.secondary">
            (Cargando...)
          </Typography>
        )}
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton
          size="small"
          onClick={isPlaying ? handlePause : handlePlay}
          disabled={!isLoaded || isLoading}
          sx={{
            color: isOwnMessage ? 'primary.contrastText' : 'primary.main',
            bgcolor: isOwnMessage ? 'rgba(255,255,255,0.2)' : 'rgba(25,118,210,0.1)',
            '&:hover': {
              bgcolor: isOwnMessage ? 'rgba(255,255,255,0.3)' : 'rgba(25,118,210,0.2)',
            }
          }}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </IconButton>
        
        <IconButton
          size="small"
          onClick={handleStop}
          disabled={!isLoaded || currentTime === 0 || isLoading}
          sx={{
            color: isOwnMessage ? 'primary.contrastText' : 'text.secondary',
            '&:hover': {
              bgcolor: isOwnMessage ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
            }
          }}
        >
          <StopIcon />
        </IconButton>
        
        <Box sx={{ flexGrow: 1, mx: 1 }}>
          <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </Typography>
          <LinearProgress
            variant={isLoading ? "indeterminate" : "determinate"}
            value={duration > 0 ? (currentTime / duration) * 100 : 0}
            sx={{
              height: 4,
              borderRadius: 2,
              bgcolor: isOwnMessage ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)',
              '& .MuiLinearProgress-bar': {
                bgcolor: isOwnMessage ? 'primary.contrastText' : 'primary.main',
              }
            }}
          />
        </Box>
      </Box>
      
      <audio
        ref={audioRef}
        src={audioBlob}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleCanPlay}
        onEnded={handleEnded}
        onError={handleError}
        preload="metadata"
        style={{ display: 'none' }}
      />
    </Paper>
  );
};

export default AudioMessage; 