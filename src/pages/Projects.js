import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  CircularProgress
} from '@mui/material';
import { Add, Code, People, AccessTime, Delete, FileCopy } from '@mui/icons-material';
import api from '../utils/api';

const Projects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialog, setCreateDialog] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    language: 'javascript',
    visibility: 'private'
  });

  const languages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'c', label: 'C' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'typescript', label: 'TypeScript' }
  ];

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    try {
      const response = await api.post('/projects', newProject);
      setProjects([response.data, ...projects]);
      setCreateDialog(false);
      setNewProject({ name: '', description: '', language: 'javascript', visibility: 'private' });
      // Navigate to the new project
      navigate(`/projects/${response.data._id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleDeleteProject = async (projectId, event) => {
    event.stopPropagation();
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await api.delete(`/projects/${projectId}`);
        setProjects(projects.filter(p => p._id !== projectId));
      } catch (error) {
        console.error('Failed to delete project:', error);
      }
    }
  };

  const handleCloneProject = async (projectId, projectName, event) => {
    event.stopPropagation();
    const cloneName = prompt(`Clone project as:`, `${projectName} (Clone)`);
    if (cloneName) {
      try {
        const response = await api.post(`/projects/${projectId}/clone`, {
          name: cloneName,
          visibility: 'private'
        });
        setProjects([response.data, ...projects]);
        // Navigate to the cloned project
        navigate(`/projects/${response.data._id}`);
      } catch (error) {
        console.error('Failed to clone project:', error);
        alert('Failed to clone project: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            My Projects
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Collaborative coding workspaces
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialog(true)}
          size="large"
        >
          New Project
        </Button>
      </Box>

      {/* Projects Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : projects.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 2
          }}
        >
          <Code sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No projects yet
          </Typography>
          <Typography color="text.secondary" paragraph>
            Create your first collaborative coding project
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateDialog(true)}>
            Create Project
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project._id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
                onClick={() => navigate(`/projects/${project._id}`)}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Chip
                      label={project.language}
                      size="small"
                      color="primary"
                      sx={{ textTransform: 'uppercase', fontSize: '10px' }}
                    />
                    <Box>
                      <IconButton
                        size="small"
                        onClick={(e) => handleCloneProject(project._id, project.name, e)}
                        sx={{ color: 'info.main', mr: 0.5 }}
                        title="Clone Project"
                      >
                        <FileCopy fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => handleDeleteProject(project._id, e)}
                        sx={{ color: 'error.main' }}
                        title="Delete Project"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    {project.name}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 2,
                      minHeight: 40,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}
                  >
                    {project.description || 'No description'}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <People fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        {project.collaborators?.length || 0} collaborators
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AccessTime fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(project.lastActivity || project.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>

                <CardActions>
                  <Button size="small" onClick={() => navigate(`/projects/${project._id}`)}>
                    Open Project
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Project Dialog */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Project Name"
              fullWidth
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              required
            />

            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            />

            <TextField
              select
              label="Language"
              fullWidth
              value={newProject.language}
              onChange={(e) => setNewProject({ ...newProject, language: e.target.value })}
            >
              {languages.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Visibility"
              fullWidth
              value={newProject.visibility}
              onChange={(e) => setNewProject({ ...newProject, visibility: e.target.value })}
            >
              <MenuItem value="private">Private</MenuItem>
              <MenuItem value="unlisted">Unlisted</MenuItem>
              <MenuItem value="public">Public</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateProject}
            variant="contained"
            disabled={!newProject.name.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Projects;
