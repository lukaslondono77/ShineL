import React, { useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { useProject } from '../context/ProjectContext';

const Terminal = () => {
  const outputRef = useRef(null);
  const { executionOutput, isExecuting } = useProject();

  // Auto-scroll to bottom when new output appears
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [executionOutput]);

  const renderOutput = () => {
    if (isExecuting) {
      return (
        <Box sx={{ color: '#f9a825', mb: 1 }}>
          <Typography component="pre" sx={{ fontFamily: 'monospace', fontSize: 14 }}>
            ⟳ Executing code...
          </Typography>
        </Box>
      );
    }

    if (!executionOutput) {
      return (
        <Box sx={{ color: '#90caf9' }}>
          <Typography component="pre" sx={{ fontFamily: 'monospace', fontSize: 14, mb: 1 }}>
╔════════════════════════════════════════╗
║   Collaborative IDE Terminal v1.0     ║
╚════════════════════════════════════════╝
          </Typography>
          <Typography component="pre" sx={{ fontFamily: 'monospace', fontSize: 14, color: '#4caf50' }}>
Ready to execute code...
          </Typography>
          <Typography component="pre" sx={{ fontFamily: 'monospace', fontSize: 14, color: '#666' }}>
Press Ctrl+Enter in the editor to run your code.
          </Typography>
        </Box>
      );
    }

    const { status, output, executionTime, memoryUsed, local, mock } = executionOutput;

    return (
      <Box>
        {/* Status */}
        <Typography 
          component="pre" 
          sx={{ 
            fontFamily: 'monospace', 
            fontSize: 14, 
            color: status === 'completed' ? '#4caf50' : '#f44336',
            mb: 2 
          }}
        >
          {status === 'completed' ? '✓' : '✗'} Execution {status}
        </Typography>

        {/* Output */}
        {output?.stdout && (
          <Box sx={{ mb: 2 }}>
            <Typography component="pre" sx={{ fontFamily: 'monospace', fontSize: 14, color: '#90caf9', mb: 0.5 }}>
              [Output]
            </Typography>
            <Typography 
              component="pre" 
              sx={{ 
                fontFamily: 'monospace', 
                fontSize: 14, 
                color: '#cccccc',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {output.stdout}
            </Typography>
          </Box>
        )}

        {/* Errors */}
        {output?.stderr && (
          <Box sx={{ mb: 2 }}>
            <Typography component="pre" sx={{ fontFamily: 'monospace', fontSize: 14, color: '#f44336', mb: 0.5 }}>
              [Error]
            </Typography>
            <Typography 
              component="pre" 
              sx={{ 
                fontFamily: 'monospace', 
                fontSize: 14, 
                color: '#f44336',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {output.stderr}
            </Typography>
          </Box>
        )}

        {output?.error && (
          <Box sx={{ mb: 2 }}>
            <Typography component="pre" sx={{ fontFamily: 'monospace', fontSize: 14, color: '#f44336', mb: 0.5 }}>
              [System Error]
            </Typography>
            <Typography 
              component="pre" 
              sx={{ 
                fontFamily: 'monospace', 
                fontSize: 14, 
                color: '#f44336',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {output.error}
            </Typography>
          </Box>
        )}

        {output?.compileOutput && (
          <Box sx={{ mb: 2 }}>
            <Typography component="pre" sx={{ fontFamily: 'monospace', fontSize: 14, color: '#f9a825', mb: 0.5 }}>
              [Compilation]
            </Typography>
            <Typography 
              component="pre" 
              sx={{ 
                fontFamily: 'monospace', 
                fontSize: 14, 
                color: '#f9a825',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {output.compileOutput}
            </Typography>
          </Box>
        )}

        {/* Performance metrics */}
        <Box sx={{ borderTop: '1px solid #333', pt: 1, mt: 2 }}>
          {executionTime !== undefined && (
            <Typography component="pre" sx={{ fontFamily: 'monospace', fontSize: 13, color: '#666' }}>
              Execution time: {executionTime}ms
            </Typography>
          )}
          {memoryUsed && (
            <Typography component="pre" sx={{ fontFamily: 'monospace', fontSize: 13, color: '#666' }}>
              Memory used: {(memoryUsed / 1024).toFixed(2)} KB
            </Typography>
          )}
          {local && (
            <Typography component="pre" sx={{ fontFamily: 'monospace', fontSize: 13, color: '#4caf50', mt: 1 }}>
              ✓ Running with local Node.js/Python
            </Typography>
          )}
          {mock && (
            <Typography component="pre" sx={{ fontFamily: 'monospace', fontSize: 13, color: '#f9a825', mt: 1 }}>
              ⚠ Running in mock mode - Judge0 API not configured
            </Typography>
          )}
        </Box>

        <Typography 
          component="pre" 
          sx={{ 
            fontFamily: 'monospace', 
            fontSize: 14, 
            color: '#333', 
            mt: 2,
            borderTop: '1px solid #333',
            pt: 1
          }}
        >
          {'─'.repeat(50)}
        </Typography>
      </Box>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#1e1e1e' }}>
      <Box
        sx={{
          p: 1,
          borderBottom: '1px solid #2d2d2d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Typography variant="subtitle2" sx={{ color: '#9e9e9e', fontWeight: 500 }}>
          OUTPUT
        </Typography>
      </Box>
      <Box
        ref={outputRef}
        sx={{
          flexGrow: 1,
          p: 2,
          bgcolor: '#1e1e1e',
          overflow: 'auto',
          fontFamily: 'Menlo, Monaco, "Courier New", monospace'
        }}
      >
        {renderOutput()}
      </Box>
    </Box>
  );
};

export default Terminal;