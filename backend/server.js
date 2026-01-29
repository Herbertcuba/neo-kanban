const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const chokidar = require('chokidar');
const WebSocket = require('ws');

const app = express();
const PORT = 3001;

// Base path for tasks
const TASKS_BASE_PATH = path.join(__dirname, '../../');
const STATUS_DIRS = {
  'ideas': 'Ideas',
  'backlog': 'Backlog', 
  'todo': 'Todo',
  'doing': 'Doing',
  'review': 'Review',
  'blog-publish': 'Blog-publish',
  'done': 'Done',
  'cancelled': 'Cancelled'
};

// Middleware
app.use(cors());
app.use(express.json());

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ port: 3002 });

wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.on('close', () => console.log('Client disconnected'));
});

// Broadcast to all connected clients
function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// File watcher for real-time updates
const watcher = chokidar.watch([
  path.join(TASKS_BASE_PATH, 'Backlog'),
  path.join(TASKS_BASE_PATH, 'Todo'),
  path.join(TASKS_BASE_PATH, 'Doing'),
  path.join(TASKS_BASE_PATH, 'Done')
], {
  ignored: /\.DS_Store/,
  persistent: true,
  depth: 2
});

watcher.on('all', (event, filepath) => {
  console.log('File change detected:', event, filepath);
  // Broadcast file system changes to connected clients
  broadcast({ type: 'file_change', event, filepath });
});

// Helper function to scan task folders
async function scanTasks() {
  const tasks = {};
  
  for (const [status, dirName] of Object.entries(STATUS_DIRS)) {
    const statusPath = path.join(TASKS_BASE_PATH, dirName);
    tasks[status] = [];
    
    try {
      if (await fs.pathExists(statusPath)) {
        const items = await fs.readdir(statusPath);
        
        for (const item of items) {
          if (item === '.DS_Store') continue;
          
          const itemPath = path.join(statusPath, item);
          const stats = await fs.stat(itemPath);
          
          if (stats.isDirectory()) {
            const descriptionPath = path.join(itemPath, 'description.md');
            let description = '';
            let fileCount = 0;
            let fileNames = [];
            
            try {
              // List files in directory
              const files = await fs.readdir(itemPath);
              fileNames = files.filter(f => f !== '.DS_Store');
              fileCount = fileNames.length;
              
              // Read description if it exists
              if (await fs.pathExists(descriptionPath)) {
                description = await fs.readFile(descriptionPath, 'utf8');
              }
            } catch (error) {
              console.error(`Error reading task ${item}:`, error);
            }
            
            // Extract title, creation date and tags from description
            const titleMatch = description.match(/^#\s+(.+)/m);
            const dateMatch = description.match(/Created:\s*(\d{4}-\d{2}-\d{2})/i);
            const tagsMatch = description.match(/Tags:\s*(.+)/i) || description.match(/#\w+/g);
            
            let tags = [];
            if (tagsMatch) {
              if (typeof tagsMatch[0] === 'string' && tagsMatch[0].startsWith('Tags:')) {
                tags = tagsMatch[1].split(/[\s,]+/).map(t => t.trim().replace(/^#/, '')).filter(t => t);
              } else {
                tags = tagsMatch.map(t => t.replace(/^#/, ''));
              }
            }

            tasks[status].push({
              id: item,
              title: titleMatch ? titleMatch[1] : item.replace(/-/g, ' '),
              description: description || `# ${item.replace(/-/g, ' ')}\n\nCreated via file system scan.`,
              tags: tags,
              files: fileCount,
              fileNames,
              created: dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0],
              path: itemPath
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning ${status}:`, error);
    }
  }
  
  return tasks;
}

// API Routes

// Get all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await scanTasks();
    res.json(tasks);
  } catch (error) {
    console.error('Error getting tasks:', error);
    res.status(500).json({ error: 'Failed to get tasks' });
  }
});

// Get specific task
app.get('/api/tasks/:status/:id', async (req, res) => {
  try {
    const { status, id } = req.params;
    const dirName = STATUS_DIRS[status];
    
    if (!dirName) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const taskPath = path.join(TASKS_BASE_PATH, dirName, id);
    const descriptionPath = path.join(taskPath, 'description.md');
    const feedbackPath = path.join(taskPath, 'feedback.md');
    
    if (!await fs.pathExists(taskPath)) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    let description = '';
    if (await fs.pathExists(descriptionPath)) {
      description = await fs.readFile(descriptionPath, 'utf8');
    }
    
    let feedback = '';
    if (await fs.pathExists(feedbackPath)) {
      feedback = await fs.readFile(feedbackPath, 'utf8');
    }
    
    const files = await fs.readdir(taskPath);
    const fileNames = files.filter(f => f !== '.DS_Store');
    const fileCount = fileNames.length;
    
    res.json({
      id,
      status,
      description,
      feedback,
      files: fileCount,
      fileNames,
      path: taskPath
    });
  } catch (error) {
    console.error('Error getting task:', error);
    res.status(500).json({ error: 'Failed to get task' });
  }
});

// Create new task
app.post('/api/tasks/:status', async (req, res) => {
  try {
    const { status } = req.params;
    const { title } = req.body;
    
    const dirName = STATUS_DIRS[status];
    if (!dirName) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    // Generate ID from title
    const id = title.toLowerCase()
      .replace(/[åäöÅÄÖ]/g, match => ({'å':'a','ä':'a','ö':'o','Å':'A','Ä':'A','Ö':'O'}[match]))
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    const taskPath = path.join(TASKS_BASE_PATH, dirName, id);
    const descriptionPath = path.join(taskPath, 'description.md');
    
    // Create directory
    await fs.ensureDir(taskPath);
    
    // Create description file
    const created = new Date().toISOString().split('T')[0];
    const descriptionContent = `# ${title}

Created: ${created}
Status: ${status.charAt(0).toUpperCase() + status.slice(1)}

## Description

This task was created via the Kanban interface.

## Objectives

- [ ] Define specific goals
- [ ] Add relevant links and resources
- [ ] Update status as work progresses

## Links

- (Add relevant links here)

## Next Steps

1. Define task scope
2. Add necessary resources
3. Begin execution

## Notes

(Add your notes here...)`;

    await fs.writeFile(descriptionPath, descriptionContent);
    
    broadcast({ type: 'task_created', status, id, title });
    
    res.json({
      id,
      title,
      status,
      description: descriptionContent,
      files: 1,
      created,
      path: taskPath
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Move task between statuses
app.put('/api/tasks/:fromStatus/:id/move/:toStatus', async (req, res) => {
  try {
    const { fromStatus, id, toStatus } = req.params;
    
    const fromDir = STATUS_DIRS[fromStatus];
    const toDir = STATUS_DIRS[toStatus];
    
    if (!fromDir || !toDir) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const fromPath = path.join(TASKS_BASE_PATH, fromDir, id);
    const toPath = path.join(TASKS_BASE_PATH, toDir, id);
    
    if (!await fs.pathExists(fromPath)) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Move the directory
    await fs.move(fromPath, toPath);
    
    // Update description with new status
    const descriptionPath = path.join(toPath, 'description.md');
    if (await fs.pathExists(descriptionPath)) {
      let description = await fs.readFile(descriptionPath, 'utf8');
      description = description.replace(
        /Status:\s*\w+/i,
        `Status: ${toStatus.charAt(0).toUpperCase() + toStatus.slice(1)}`
      );
      await fs.writeFile(descriptionPath, description);
    }
    
    broadcast({ type: 'task_moved', id, fromStatus, toStatus });
    
    res.json({ success: true, id, fromStatus, toStatus });
  } catch (error) {
    console.error('Error moving task:', error);
    res.status(500).json({ error: 'Failed to move task' });
  }
});

// Update task description
app.put('/api/tasks/:status/:id/description', async (req, res) => {
  try {
    const { status, id } = req.params;
    const { description } = req.body;
    
    const dirName = STATUS_DIRS[status];
    if (!dirName) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const taskPath = path.join(TASKS_BASE_PATH, dirName, id);
    const descriptionPath = path.join(taskPath, 'description.md');
    
    if (!await fs.pathExists(taskPath)) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    await fs.writeFile(descriptionPath, description);
    
    broadcast({ type: 'task_updated', status, id });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating task description:', error);
    res.status(500).json({ error: 'Failed to update task description' });
  }
});

// Update task feedback
app.put('/api/tasks/:status/:id/feedback', async (req, res) => {
  try {
    const { status, id } = req.params;
    const { feedback } = req.body;
    
    const dirName = STATUS_DIRS[status];
    if (!dirName) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const taskPath = path.join(TASKS_BASE_PATH, dirName, id);
    const feedbackPath = path.join(taskPath, 'feedback.md');
    
    if (!await fs.pathExists(taskPath)) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    await fs.writeFile(feedbackPath, feedback);
    
    broadcast({ type: 'task_updated', status, id });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating task feedback:', error);
    res.status(500).json({ error: 'Failed to update task feedback' });
  }
});

// Open folder in Finder
app.post('/api/tasks/:status/:id/open', async (req, res) => {
  try {
    const { status, id } = req.params;
    const dirName = STATUS_DIRS[status];
    
    if (!dirName) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const taskPath = path.join(TASKS_BASE_PATH, dirName, id);
    
    if (!await fs.pathExists(taskPath)) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Open in Finder (macOS specific)
    const { exec } = require('child_process');
    exec(`open "${taskPath}"`, (error) => {
      if (error) {
        console.error('Error opening folder:', error);
        return res.status(500).json({ error: 'Failed to open folder' });
      }
      res.json({ success: true });
    });
  } catch (error) {
    console.error('Error opening folder:', error);
    res.status(500).json({ error: 'Failed to open folder' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Neo Kanban API running on http://localhost:${PORT}`);
  console.log(`📁 Watching: ${TASKS_BASE_PATH}`);
  console.log(`🔌 WebSocket on port 3002`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  watcher.close();
  process.exit(0);
});