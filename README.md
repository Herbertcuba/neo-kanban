# Neo Kanban — File-System Based Task Management

> A revolutionary Kanban board where tasks are actual folders, descriptions are Markdown files, and everything syncs seamlessly with iCloud Drive.

![Neo Kanban Screenshot](https://via.placeholder.com/800x400/1a1a2e/4ade80?text=Neo+Kanban+Board)

## ✨ Why Neo Kanban?

Traditional Kanban tools lock your data in proprietary formats. Neo Kanban stores everything as **real files and folders** that you can access from Finder, edit in any app, and sync across all your devices.

**The Philosophy:** Your tasks should be as accessible as any other file on your computer.

## 🚀 Features

- **📁 Real File System Integration** — Tasks are actual folders you can access via Finder
- **📝 Markdown Descriptions** — Rich task descriptions stored as `description.md` files  
- **💬 Feedback System** — `feedback.md` files for collaboration and guidance
- **🎯 Drag & Drop** — Move tasks between columns by dragging (moves actual folders)
- **⚡ Real-Time Sync** — Changes reflect instantly via WebSocket connections
- **🔍 Live File Watching** — External changes in Finder update the UI automatically
- **💻 Native Finder Integration** — Open task folders directly from the web interface
- **☁️ iCloud Ready** — Works perfectly with iCloud Drive for multi-device access
- **✏️ In-App Editing** — Edit descriptions and feedback directly in the beautiful web interface
- **📊 File Management** — See and manage all files within each task folder
- **🏷️ Smart Tagging** — Organize tasks with #talks #business #finance tags

## 🏗️ Architecture

```
kanban-app/
├── backend/              # Node.js + Express API
│   ├── server.js         # Main server with file watching
│   └── package.json
├── frontend/             # React + TypeScript UI
│   ├── src/
│   │   ├── App.js        # Main Kanban component
│   │   ├── components/   # Reusable UI components
│   │   └── App.css       # Styling
│   └── package.json
├── start.sh             # One-command startup script
└── restart.sh           # Auto-restart after rebuilds
```

**Task Structure:**
```
Ideas/
├── ai-transformation-talk/
│   ├── description.md    # Main task description
│   ├── feedback.md       # Herbert's guidance & corrections
│   ├── article.md        # Auto-generated articles (for #talks)
│   ├── research.pdf      # Supporting documents
│   └── notes.txt         # Additional files
└── feature-beta/
    ├── description.md
    └── feedback.md
```

## 🚀 Quick Start

### Prerequisites

- **Node.js 16+** (`brew install node`)
- **macOS** (for Finder integration)

### Installation & Launch

1. **Clone the repository:**
   ```bash
   git clone https://github.com/herbertcubagarcia/neo-kanban.git
   cd neo-kanban
   ```

2. **Start the application:**
   ```bash
   ./start.sh
   ```

3. **Browser opens automatically:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

That's it! The script handles dependency installation, server startup, and browser launch automatically.

### After Making Changes

```bash
./restart.sh    # Stops existing servers and restarts
```

## 🎯 Usage Guide

### Creating Tasks

1. Click **"+ New Task"** in any column
2. Enter a descriptive task name
3. Press Enter or click Create
4. A new folder is created with `description.md` and `feedback.md` files

### Adding Feedback

1. **Click on any task** to open the details modal
2. **Edit feedback section** to provide guidance and corrections
3. **Save changes** — they're written directly to `feedback.md`

### Moving Tasks

- **Drag and drop** tasks between columns
- The corresponding folders are moved in the file system
- Changes sync instantly across all open instances

### Editing Descriptions

1. **Click the Edit button** (pencil icon) in the description section
2. **Modify content** directly in the editor
3. **Save changes** — they're written to `description.md`

### Adding Files

1. **Click "Open in Finder"** from any task modal
2. **Drag files** into the task folder
3. **File count updates** automatically in the web interface

### External Editing

- Edit `.md` files in any text editor
- Add/remove files via Finder
- Changes appear **instantly** in the web interface

## 🛠️ Development

### Backend Only
```bash
cd backend
npm install
npm run dev        # Uses nodemon for auto-restart
```

### Frontend Only
```bash
cd frontend
npm install
npm start          # React dev server with hot reload
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks` | Get all tasks across all columns |
| `GET` | `/api/tasks/:status/:id` | Get specific task details |
| `POST` | `/api/tasks/:status` | Create new task |
| `PUT` | `/api/tasks/:from/:id/move/:to` | Move task between columns |
| `PUT` | `/api/tasks/:status/:id/description` | Update task description |
| `PUT` | `/api/tasks/:status/:id/feedback` | Update task feedback |
| `POST` | `/api/tasks/:status/:id/open` | Open task folder in Finder |

### WebSocket Events

- `file_change` — File system change detected
- `task_created` — New task created  
- `task_moved` — Task moved between columns
- `task_updated` — Task description/feedback updated

## 📋 Task Workflow

Each task follows a structured workflow:

```
💡 Ideas → 📋 Backlog → 📌 Todo → 🔨 Doing → 👀 Review → ✅ Done / ❌ Cancelled
```

### Feedback Integration

- **Ideas → Backlog:** Add initial guidance
- **Backlog → Todo:** Final requirements before execution  
- **Review:** Comments on deliverables before approval

### Smart Features

- **Auto-article creation** for #talks tasks
- **Real-time collaboration** via feedback system
- **File system integration** with instant sync
- **Professional deliverables** ready for immediate use

## 🔧 Configuration

### Custom Columns

Edit the `STATUS_DIRS` object in `backend/server.js`:

```javascript
const STATUS_DIRS = {
  'ideas': 'Ideas',
  'backlog': 'Backlog', 
  'todo': 'Todo',
  'doing': 'Doing',
  'review': 'Review',
  'done': 'Done',
  'cancelled': 'Cancelled'
};
```

### File Watching

The backend automatically watches for changes in task folders. Supported events:
- File creation/deletion
- Folder creation/deletion  
- File modifications

## 🌐 Browser Support

- Chrome 80+ ✅
- Firefox 75+ ✅  
- Safari 13+ ✅
- Edge 80+ ✅

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Beautiful DnD** for smooth drag & drop interactions
- **Chokidar** for robust file system watching
- **Express.js** for the clean API architecture
- **Lucide React** for beautiful, consistent icons

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/herbertcubagarcia/neo-kanban/issues)
- **Email:** herbertcuba@gmail.com
- **Twitter:** [@herbertcuba](https://twitter.com/herbertcuba)

---

**Built with 💚 by Herbert Cuba Garcia**  
*Making task management as simple as files and folders*