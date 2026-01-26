import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import axios from 'axios';
import { RefreshCw, Folder, Plus, X, ExternalLink } from 'lucide-react';
import TaskModal from './components/TaskModal';
import './App.css';

const STATUS_CONFIG = {
  ideas: { title: '💡 Ideas', color: '#a78bfa' },
  backlog: { title: '📋 Backlog', color: '#94a3b8' },
  todo: { title: '📌 Todo', color: '#60a5fa' },
  doing: { title: '🔨 Doing', color: '#fbbf24' },
  review: { title: '👀 Review', color: '#f59e0b' },
  done: { title: '✅ Done', color: '#4ade80' },
  cancelled: { title: '❌ Cancelled', color: '#ef4444' }
};

const COLUMN_ORDER = ['ideas', 'backlog', 'todo', 'doing', 'review', 'done', 'cancelled'];

function App() {
  const [tasks, setTasks] = useState({
    backlog: [],
    todo: [],
    doing: [],
    done: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [websocket, setWebsocket] = useState(null);
  const [status, setStatus] = useState({ message: '', type: '' });

  useEffect(() => {
    loadTasks();
    setupWebSocket();
    
    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, []);

  // Global keyboard navigation
  useEffect(() => {
    const handleGlobalKeyPress = (e) => {
      // Only handle Enter when no modal is open and not in input fields
      if (e.key === 'Enter' && !selectedTask && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        openFirstAvailableTask();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyPress);
    return () => document.removeEventListener('keydown', handleGlobalKeyPress);
  }, [selectedTask, tasks]);

  const setupWebSocket = () => {
    const ws = new WebSocket('ws://localhost:3002');
    
    ws.onopen = () => {
      console.log('WebSocket connected');
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('WebSocket message:', data);
      
      if (data.type === 'file_change' || data.type === 'task_moved' || data.type === 'task_created') {
        loadTasks();
      }
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      // Reconnect after 3 seconds
      setTimeout(setupWebSocket, 3000);
    };
    
    setWebsocket(ws);
  };

  const loadTasks = async () => {
    try {
      const response = await axios.get('/api/tasks');
      setTasks(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading tasks:', error);
      showStatus('Error loading tasks', 'error');
      setLoading(false);
    }
  };

  const showStatus = (message, type = 'success') => {
    setStatus({ message, type });
    setTimeout(() => setStatus({ message: '', type: '' }), 3000);
  };

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const taskId = draggableId;
    const fromStatus = source.droppableId;
    const toStatus = destination.droppableId;

    // Optimistic update
    const newTasks = { ...tasks };
    const [movedTask] = newTasks[fromStatus].splice(source.index, 1);
    newTasks[toStatus].splice(destination.index, 0, movedTask);
    setTasks(newTasks);

    try {
      await axios.put(`/api/tasks/${fromStatus}/${taskId}/move/${toStatus}`);
      showStatus(`Moved "${movedTask.title}" to ${STATUS_CONFIG[toStatus].title.split(' ')[1]}`, 'success');
    } catch (error) {
      console.error('Error moving task:', error);
      // Revert optimistic update
      loadTasks();
      showStatus('Error moving task', 'error');
    }
  };

  const createTask = async (status) => {
    if (!newTaskTitle.trim()) return;

    try {
      await axios.post(`/api/tasks/${status}`, { title: newTaskTitle.trim() });
      setNewTaskTitle('');
      setShowCreateForm(null);
      showStatus(`Created "${newTaskTitle}"`, 'success');
      loadTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      showStatus('Error creating task', 'error');
    }
  };

  const openTaskModal = (task, status) => {
    setSelectedTask({ ...task, status });
  };

  const openInFinder = async (task, status) => {
    try {
      await axios.post(`/api/tasks/${status}/${task.id}/open`);
      showStatus('Opened folder in Finder', 'success');
    } catch (error) {
      console.error('Error opening folder:', error);
      showStatus('Error opening folder', 'error');
    }
  };

  // Navigation helpers
  const openFirstAvailableTask = () => {
    for (const column of COLUMN_ORDER) {
      if (tasks[column] && tasks[column].length > 0) {
        setSelectedTask({ ...tasks[column][0], status: column, columnIndex: 0, taskIndex: 0 });
        return;
      }
    }
  };

  const navigateTask = (direction) => {
    if (!selectedTask) return;

    const { status, taskIndex, columnIndex } = selectedTask;
    
    if (direction === 'up' || direction === 'down') {
      // Navigate within the same column
      const currentTasks = tasks[status] || [];
      let newIndex = taskIndex;
      
      if (direction === 'up') {
        newIndex = Math.max(0, taskIndex - 1);
      } else {
        newIndex = Math.min(currentTasks.length - 1, taskIndex + 1);
      }
      
      if (newIndex !== taskIndex && currentTasks[newIndex]) {
        setSelectedTask({ 
          ...currentTasks[newIndex], 
          status, 
          columnIndex: COLUMN_ORDER.indexOf(status), 
          taskIndex: newIndex 
        });
      }
    } else if (direction === 'left' || direction === 'right') {
      // Navigate to adjacent columns
      const currentColumnIndex = COLUMN_ORDER.indexOf(status);
      let targetColumnIndex = currentColumnIndex;
      
      if (direction === 'left') {
        // Search left for a column with tasks
        for (let i = currentColumnIndex - 1; i >= 0; i--) {
          if (tasks[COLUMN_ORDER[i]] && tasks[COLUMN_ORDER[i]].length > 0) {
            targetColumnIndex = i;
            break;
          }
        }
      } else {
        // Search right for a column with tasks
        for (let i = currentColumnIndex + 1; i < COLUMN_ORDER.length; i++) {
          if (tasks[COLUMN_ORDER[i]] && tasks[COLUMN_ORDER[i]].length > 0) {
            targetColumnIndex = i;
            break;
          }
        }
      }
      
      // If we found a different column with tasks, switch to it
      if (targetColumnIndex !== currentColumnIndex) {
        const targetColumn = COLUMN_ORDER[targetColumnIndex];
        const targetTask = tasks[targetColumn][0];
        setSelectedTask({ 
          ...targetTask, 
          status: targetColumn, 
          columnIndex: targetColumnIndex, 
          taskIndex: 0 
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <RefreshCw className="loading-spinner" size={32} />
          <p>Loading Kanban board...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1><span className="neo">Neo</span> & Herbert</h1>
        <p className="subtitle">File-system based Kanban with real-time sync</p>
        <div className="header-buttons">
          <button className="btn btn-primary" onClick={loadTasks}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => openInFinder({ id: '' }, '')}>
            <Folder size={16} /> Open Root
          </button>
        </div>
      </header>

      {!selectedTask && (
        <div className="keyboard-hint">
          Press Enter to open first task • Click any task to start navigation
        </div>
      )}

      {status.message && (
        <div className={`status-message ${status.type}`}>
          {status.message}
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="board">
          {Object.entries(STATUS_CONFIG).map(([status, config]) => (
            <div key={status} className="column">
              <div className="column-header">
                <span className="column-title" style={{ color: config.color }}>
                  {config.title}
                </span>
                <span className="column-count">
                  {tasks[status]?.length || 0}
                </span>
              </div>

              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`tasks ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
                  >
                    {tasks[status]?.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`task ${snapshot.isDragging ? 'dragging' : ''}`}
                            onClick={() => {
                              const columnIndex = COLUMN_ORDER.indexOf(status);
                              setSelectedTask({ ...task, status, columnIndex, taskIndex: index });
                            }}
                          >
                            <div className="task-title">{task.title}</div>
                            <div className="task-meta">
                              <span className="task-files">{task.files} files</span>
                              <span className="task-date">{task.created}</span>
                            </div>
                            <button
                              className="task-folder-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                openInFinder(task, status);
                              }}
                            >
                              <ExternalLink size={14} />
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              {/* Add Task Button */}
              {showCreateForm === status ? (
                <div className="create-task-form">
                  <input
                    type="text"
                    placeholder="Task name..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && createTask(status)}
                    autoFocus
                  />
                  <div className="form-buttons">
                    <button 
                      className="btn btn-primary" 
                      onClick={() => createTask(status)}
                      disabled={!newTaskTitle.trim()}
                    >
                      Create
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => {
                        setShowCreateForm(null);
                        setNewTaskTitle('');
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  className="add-task-btn"
                  onClick={() => setShowCreateForm(status)}
                >
                  <Plus size={16} /> New Task
                </button>
              )}
            </div>
          ))}
        </div>
      </DragDropContext>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onOpenInFinder={() => openInFinder(selectedTask, selectedTask.status)}
          onUpdate={loadTasks}
          onNavigate={navigateTask}
        />
      )}
    </div>
  );
}

export default App;