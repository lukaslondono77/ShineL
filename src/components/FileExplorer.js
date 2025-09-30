import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Folder,
  FolderOpen,
  InsertDriveFile,
  MoreVert,
  Add,
  CreateNewFolder,
  NoteAdd,
  Delete,
  Edit
} from '@mui/icons-material';
import { useProject } from '../context/ProjectContext';

const FileExplorer = () => {
  const { files, openFile, createFile, deleteFile } = useProject();
  const [expandedFolders, setExpandedFolders] = useState(['/']);
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [createDialog, setCreateDialog] = useState({ open: false, type: 'file', parent: null });
  const [newFileName, setNewFileName] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Toggle folder expansion
  const toggleFolder = (folderId) => {
    setExpandedFolders(prev =>
      prev.includes(folderId)
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };

  // Handle context menu
  const handleContextMenu = (event, file) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY
    });
    setSelectedFile(file);
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  // Handle file click
  const handleFileClick = (file) => {
    if (file.type === 'folder') {
      toggleFolder(file._id);
    } else {
      openFile(file);
    }
  };

  // Create file dialog
  const handleOpenCreateDialog = (type, parent = null) => {
    setCreateDialog({ open: true, type, parent });
    handleCloseContextMenu();
  };

  const handleCloseCreateDialog = () => {
    setCreateDialog({ open: false, type: 'file', parent: null });
    setNewFileName('');
  };

  const handleCreateFile = async () => {
    if (!newFileName.trim()) {
      setSnackbar({ open: true, message: 'Please enter a name', severity: 'warning' });
      return;
    }

    try {
      await createFile(newFileName, createDialog.type, createDialog.parent);
      setSnackbar({ 
        open: true, 
        message: `${createDialog.type === 'folder' ? 'Folder' : 'File'} created successfully!`, 
        severity: 'success' 
      });
      handleCloseCreateDialog();
    } catch (error) {
      console.error('Failed to create file:', error);
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.message || `Failed to create ${createDialog.type}`, 
        severity: 'error' 
      });
    }
  };

  // Delete file
  const handleDeleteFile = async () => {
    if (!selectedFile) return;

    if (window.confirm(`Delete ${selectedFile.name}?`)) {
      try {
        await deleteFile(selectedFile._id);
        setSnackbar({ open: true, message: 'Deleted successfully!', severity: 'success' });
        handleCloseContextMenu();
      } catch (error) {
        console.error('Failed to delete file:', error);
        setSnackbar({ 
          open: true, 
          message: error.response?.data?.message || 'Failed to delete', 
          severity: 'error' 
        });
      }
    }
  };

  // Build file tree
  const buildTree = (parentId = null, level = 0) => {
    return files
      .filter(file => file.parent === parentId)
      .sort((a, b) => {
        // Folders first, then alphabetical
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'folder' ? -1 : 1;
      })
      .map(file => (
        <React.Fragment key={file._id}>
          <ListItem
            disablePadding
            onContextMenu={(e) => handleContextMenu(e, file)}
            sx={{ pl: level * 2 }}
          >
            <ListItemButton onClick={() => handleFileClick(file)}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                {file.type === 'folder' ? (
                  expandedFolders.includes(file._id) ? (
                    <FolderOpen sx={{ color: '#90caf9' }} />
                  ) : (
                    <Folder sx={{ color: '#90caf9' }} />
                  )
                ) : (
                  <InsertDriveFile sx={{ color: '#9e9e9e' }} />
                )}
              </ListItemIcon>
              <ListItemText
                primary={file.name}
                primaryTypographyProps={{
                  fontSize: '14px',
                  color: '#fff'
                }}
              />
            </ListItemButton>
          </ListItem>

          {/* Render children if folder is expanded */}
          {file.type === 'folder' && expandedFolders.includes(file._id) && (
            <Box>{buildTree(file._id, level + 1)}</Box>
          )}
        </React.Fragment>
      ));
  };

  return (
    <Box sx={{ height: '100%', bgcolor: '#1e1e1e', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
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
          EXPLORER
        </Typography>
        <Box>
          <IconButton
            size="small"
            onClick={() => handleOpenCreateDialog('file')}
            sx={{ color: '#9e9e9e' }}
          >
            <NoteAdd fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleOpenCreateDialog('folder')}
            sx={{ color: '#9e9e9e' }}
          >
            <CreateNewFolder fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* File Tree */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        <List dense>{buildTree()}</List>
      </Box>

      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        {selectedFile?.type === 'folder' && (
          <>
            <MenuItem onClick={() => handleOpenCreateDialog('file', selectedFile._id)}>
              <ListItemIcon><NoteAdd fontSize="small" /></ListItemIcon>
              <ListItemText>New File</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleOpenCreateDialog('folder', selectedFile._id)}>
              <ListItemIcon><CreateNewFolder fontSize="small" /></ListItemIcon>
              <ListItemText>New Folder</ListItemText>
            </MenuItem>
          </>
        )}
        <MenuItem onClick={handleDeleteFile}>
          <ListItemIcon><Delete fontSize="small" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Create File/Folder Dialog */}
      <Dialog open={createDialog.open} onClose={handleCloseCreateDialog}>
        <DialogTitle>
          Create New {createDialog.type === 'folder' ? 'Folder' : 'File'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreateFile();
              }
            }}
            placeholder={createDialog.type === 'folder' ? 'my-folder' : 'index.js'}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog}>Cancel</Button>
          <Button onClick={handleCreateFile} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FileExplorer;
