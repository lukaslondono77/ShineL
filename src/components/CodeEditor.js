import React, { useEffect, useRef, useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { useProject } from '../context/ProjectContext';
import { Box, IconButton, Tooltip, CircularProgress, Chip } from '@mui/material';
import { PlayArrow, Save, Close, AutoAwesome } from '@mui/icons-material';
import api from '../utils/api';
import './CodeEditor.css';

const CodeEditor = ({ file }) => {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const [code, setCode] = useState(file?.content || '');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  
  const {
    socket,
    currentProject,
    saveFile,
    executeCode,
    isExecuting,
    cursors,
    setCursors,
    closeFile
  } = useProject();

  const decorationsRef = useRef([]);

  // Update code when file changes
  useEffect(() => {
    if (file) {
      setCode(file.content || '');
      setHasUnsavedChanges(false);
    }
  }, [file?._id]);

  // AI Autocomplete Function
  const getAICompletion = useCallback(async (editor, monaco) => {
    if (!aiEnabled || isLoadingAI) return;

    const model = editor.getModel();
    const position = editor.getPosition();
    const code = model.getValue();

    setIsLoadingAI(true);

    try {
      const response = await api.post('/ai/complete', {
        code,
        language: file?.language || 'javascript',
        cursorPosition: {
          line: position.lineNumber,
          column: position.column
        }
      });

      const suggestion = response.data.suggestion;

      if (suggestion && suggestion.trim()) {
        // Show inline suggestion (ghost text)
        const endLineNumber = position.lineNumber;
        const endColumn = position.column;
        
        // Insert AI suggestion as ghost text
        editor.executeEdits('ai-completion', [{
          range: new monaco.Range(
            endLineNumber,
            endColumn,
            endLineNumber,
            endColumn
          ),
          text: suggestion
        }]);

        // Move cursor to end of insertion
        const lines = suggestion.split('\n');
        const lastLine = lines[lines.length - 1];
        const newPosition = new monaco.Position(
          endLineNumber + lines.length - 1,
          lines.length === 1 ? endColumn + lastLine.length : lastLine.length + 1
        );
        editor.setPosition(newPosition);
        editor.revealPositionInCenter(newPosition);
      }
    } catch (error) {
      console.error('AI completion error:', error);
    } finally {
      setIsLoadingAI(false);
    }
  }, [file, aiEnabled, isLoadingAI]);

  // Handle editor mount
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, handleSave);
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, handleRun);
    
    // AI Autocomplete - Ctrl+Space
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space,
      () => getAICompletion(editor, monaco)
    );

    // Register AI completion provider
    monaco.languages.registerCompletionItemProvider(file?.language || 'javascript', {
      triggerCharacters: ['.', '(', ' '],
      provideCompletionItems: async (model, position) => {
        if (!aiEnabled) return { suggestions: [] };

        const code = model.getValue();
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };

        try {
          const response = await api.post('/ai/complete', {
            code,
            language: file?.language || 'javascript',
            cursorPosition: {
              line: position.lineNumber,
              column: position.column
            }
          });

          const suggestion = response.data.suggestion?.trim();

          if (suggestion) {
            return {
              suggestions: [{
                label: '✨ AI Suggestion',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: suggestion,
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                range: range,
                detail: 'AI-powered completion',
                documentation: suggestion
              }]
            };
          }
        } catch (error) {
          console.error('AI provider error:', error);
        }

        return { suggestions: [] };
      }
    });
    
    // Focus editor
    editor.focus();
  };

  // Handle code changes
  const handleEditorChange = useCallback((value) => {
    setCode(value);
    setHasUnsavedChanges(true);

    if (socket && currentProject && file) {
      // Get the changes from Monaco
      const model = editorRef.current?.getModel();
      if (!model) return;

      // Emit code change to other users
      socket.emit('code_change', {
        projectId: currentProject._id,
        fileId: file._id,
        changes: [{
          range: model.getFullModelRange(),
          text: value
        }],
        version: model.getVersionId()
      });
    }
  }, [socket, currentProject, file]);

  // Handle cursor position changes
  const handleCursorChange = useCallback((e) => {
    if (!socket || !currentProject || !file) return;

    const position = e.position;
    socket.emit('cursor_update', {
      projectId: currentProject._id,
      fileId: file._id,
      position: {
        line: position.lineNumber,
        column: position.column
      }
    });
  }, [socket, currentProject, file]);

  // Listen for remote code changes
  useEffect(() => {
    if (!socket || !file) return;

    const handleCodeUpdated = ({ fileId, changes, userId, socketId }) => {
      if (fileId !== file._id || socketId === socket.id) return;

      const editor = editorRef.current;
      const monaco = monacoRef.current;
      if (!editor || !monaco) return;

      // Apply remote changes
      changes.forEach(change => {
        const model = editor.getModel();
        if (model) {
          const range = new monaco.Range(
            change.range.startLineNumber,
            change.range.startColumn,
            change.range.endLineNumber,
            change.range.endColumn
          );
          
          model.pushEditOperations(
            [],
            [{ range, text: change.text }],
            () => null
          );
        }
      });
    };

    const handleCursorMoved = ({ fileId, userId, socketId, username, position }) => {
      if (fileId !== file._id || socketId === socket.id) return;

      setCursors(prev => ({
        ...prev,
        [socketId]: { userId, username, position }
      }));

      // Show cursor decoration
      const editor = editorRef.current;
      const monaco = monacoRef.current;
      if (!editor || !monaco) return;

      // Remove old decorations for this user
      const oldDecorations = decorationsRef.current.filter(d => d.socketId === socketId);
      if (oldDecorations.length > 0) {
        editor.deltaDecorations(oldDecorations.map(d => d.id), []);
      }

      // Add new cursor decoration
      const newDecorations = editor.deltaDecorations(
        [],
        [{
          range: new monaco.Range(
            position.line,
            position.column,
            position.line,
            position.column + 1
          ),
          options: {
            className: `remote-cursor remote-cursor-${socketId.substr(0, 6)}`,
            hoverMessage: { value: `**${username}**'s cursor` },
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
          }
        }]
      );

      decorationsRef.current = decorationsRef.current.filter(d => d.socketId !== socketId);
      decorationsRef.current.push({ socketId, id: newDecorations[0] });
    };

    socket.on('code_updated', handleCodeUpdated);
    socket.on('cursor_moved', handleCursorMoved);

    return () => {
      socket.off('code_updated', handleCodeUpdated);
      socket.off('cursor_moved', handleCursorMoved);
    };
  }, [socket, file, setCursors]);

  // Add cursor position listener
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const disposable = editor.onDidChangeCursorPosition(handleCursorChange);
    return () => disposable.dispose();
  }, [handleCursorChange]);

  // Save file
  const handleSave = useCallback(async () => {
    if (!file || !hasUnsavedChanges || isSaving) return;

    try {
      setIsSaving(true);
      await saveFile(file._id, code);
      setHasUnsavedChanges(false);
      console.log('File saved successfully');
    } catch (error) {
      console.error('Failed to save file:', error);
    } finally {
      setIsSaving(false);
    }
  }, [file, code, hasUnsavedChanges, isSaving, saveFile]);

  // Run code
  const handleRun = useCallback(async () => {
    if (!file || isExecuting) return;

    try {
      await executeCode(code, file.language);
    } catch (error) {
      console.error('Failed to execute code:', error);
    }
  }, [file, code, isExecuting, executeCode]);

  // Close file
  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Close anyway?')) {
        closeFile(file._id);
      }
    } else {
      closeFile(file._id);
    }
  };

  if (!file) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#888'
        }}
      >
        Select a file to start editing
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* File Tab */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: '#2d2d2d',
          borderBottom: '1px solid #1e1e1e',
          px: 2,
          py: 0.5
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <span style={{ color: '#fff', fontSize: '14px' }}>
            {file.name}
            {hasUnsavedChanges && <span style={{ color: '#fff' }}> •</span>}
          </span>
          <span style={{ color: '#888', fontSize: '12px' }}>
            {file.language}
          </span>
        </Box>

        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          {/* AI Status Indicator */}
          <Chip
            icon={<AutoAwesome fontSize="small" />}
            label={isLoadingAI ? 'AI...' : 'AI'}
            size="small"
            onClick={() => setAiEnabled(!aiEnabled)}
            sx={{
              height: '24px',
              bgcolor: aiEnabled ? 'rgba(147, 51, 234, 0.2)' : 'transparent',
              color: aiEnabled ? '#a78bfa' : '#666',
              border: '1px solid',
              borderColor: aiEnabled ? '#a78bfa' : '#666',
              '& .MuiChip-icon': { color: 'inherit' },
              cursor: 'pointer',
              mr: 1
            }}
          />

          <Tooltip title="AI Autocomplete (Ctrl+Space)">
            <IconButton
              size="small"
              onClick={() => getAICompletion(editorRef.current, monacoRef.current)}
              disabled={!aiEnabled || isLoadingAI}
              sx={{ color: aiEnabled ? '#a78bfa' : '#666' }}
            >
              {isLoadingAI ? <CircularProgress size={18} /> : <AutoAwesome fontSize="small" />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Save (Ctrl+S)">
            <IconButton
              size="small"
              onClick={handleSave}
              disabled={!hasUnsavedChanges || isSaving}
              sx={{ color: hasUnsavedChanges ? '#4CAF50' : '#666' }}
            >
              {isSaving ? <CircularProgress size={18} /> : <Save fontSize="small" />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Run Code (Ctrl+Enter)">
            <IconButton
              size="small"
              onClick={handleRun}
              disabled={isExecuting}
              sx={{ color: '#2196F3' }}
            >
              {isExecuting ? <CircularProgress size={18} /> : <PlayArrow fontSize="small" />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Close">
            <IconButton
              size="small"
              onClick={handleClose}
              sx={{ color: '#666' }}
            >
              <Close fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Monaco Editor */}
      <Box sx={{ flexGrow: 1, position: 'relative' }}>
        <Editor
          height="100%"
          language={file.language}
          value={code}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            fontSize: 14,
            minimap: { enabled: true },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            tabSize: 2,
            insertSpaces: true,
            formatOnPaste: true,
            formatOnType: true,
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: true
          }}
        />
      </Box>
    </Box>
  );
};

export default CodeEditor;
