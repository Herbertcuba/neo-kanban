import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, ExternalLink, RefreshCw, Edit, Save } from 'lucide-react';
import './TaskModal.css';

const TaskModal = ({ task, onClose, onOpenInFinder, onUpdate }) => {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');

  useEffect(() => {
    loadTaskDetails();
  }, [task]);

  const loadTaskDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/tasks/${task.status}/${task.id}`);
      setDescription(response.data.description);
      setEditedDescription(response.data.description);
      setLoading(false);
    } catch (error) {
      console.error('Error loading task details:', error);
      setDescription(task.description || 'Error loading description');
      setLoading(false);
    }
  };

  const saveDescription = async () => {
    try {
      await axios.put(`/api/tasks/${task.status}/${task.id}/description`, {
        description: editedDescription
      });
      setDescription(editedDescription);
      setEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error saving description:', error);
      alert('Error saving description. Please try again.');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Escape') {
      if (editing) {
        setEditing(false);
        setEditedDescription(description);
      } else {
        onClose();
      }
    }
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const iconMap = {
      'md': '📄',
      'txt': '📝',
      'pdf': '📊',
      'doc': '📄',
      'docx': '📄',
      'xls': '📈',
      'xlsx': '📈',
      'ppt': '📊',
      'pptx': '📊',
      'jpg': '🖼️',
      'jpeg': '🖼️',
      'png': '🖼️',
      'gif': '🖼️',
      'mp4': '🎥',
      'mov': '🎥',
      'avi': '🎥'
    };
    return iconMap[ext] || '📄';
  };

  const renderFileList = () => {
    const files = ['description.md']; // Always include description.md
    
    // Add mock files if more than 1 file exists
    if (task.files > 1) {
      const additionalFiles = [
        'notes.txt',
        'research.pdf',
        'links.md',
        'meeting-notes.md',
        'resources.pdf'
      ];
      
      for (let i = 1; i < task.files; i++) {
        if (additionalFiles[i-1]) {
          files.push(additionalFiles[i-1]);
        } else {
          files.push(`document${i}.txt`);
        }
      }
    }

    return files.map((filename, index) => (
      <div key={index} className="file-item">
        <span className="file-icon">{getFileIcon(filename)}</span>
        <div className="file-info">
          <div className="file-name">{filename}</div>
          <div className="file-type">
            {filename === 'description.md' ? 'Main Description' : 'Document'}
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className="modal-overlay" onKeyDown={handleKeyPress} tabIndex={0}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{task.title}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-section">
            <div className="section-header">
              <h3>📄 Description</h3>
              <div className="section-buttons">
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={loadTaskDetails}
                  title="Refresh description"
                >
                  <RefreshCw size={14} />
                </button>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => setEditing(!editing)}
                  title={editing ? "Cancel edit" : "Edit description"}
                >
                  <Edit size={14} />
                </button>
              </div>
            </div>
            
            {loading ? (
              <div className="description-loading">
                <RefreshCw className="loading-spinner" size={20} />
                Loading description...
              </div>
            ) : editing ? (
              <div className="description-editor">
                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className="description-textarea"
                  placeholder="Edit task description..."
                  autoFocus
                />
                <div className="editor-buttons">
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={saveDescription}
                  >
                    <Save size={14} /> Save
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setEditing(false);
                      setEditedDescription(description);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <pre className="task-description">{description}</pre>
            )}
          </div>

          <div className="modal-section">
            <h3>📁 Files ({task.files})</h3>
            {task.files === 0 ? (
              <p className="no-files">
                No files yet. Add documents to the folder via Finder.
              </p>
            ) : (
              <div className="file-list">
                {renderFileList()}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary" onClick={onOpenInFinder}>
            <ExternalLink size={16} /> Open in Finder
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;