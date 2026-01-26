#!/bin/bash

# Deploy Neo Kanban to GitHub
echo "🚀 Deploying Neo Kanban to GitHub..."

# Check if gh CLI is authenticated
if ! gh auth status &>/dev/null; then
    echo "❌ GitHub CLI not authenticated. Run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI authenticated"

# Create the repository
echo "📦 Creating GitHub repository..."
gh repo create neo-kanban \
  --public \
  --description "Revolutionary file-system based Kanban board built with React + Node.js. Tasks are real folders, descriptions are Markdown files, everything syncs with iCloud." \
  --add-readme=false \
  --clone=false

# Add remote and push
echo "⬆️ Pushing code to GitHub..."
git remote add origin https://github.com/herbertcubagarcia/neo-kanban.git
git branch -M main
git push -u origin main

# Add topics for discoverability
echo "🏷️ Adding repository topics..."
gh repo edit neo-kanban --add-topic "kanban,react,nodejs,file-system,task-management,icloud,markdown,drag-and-drop,real-time"

echo "✅ Repository created successfully!"
echo "🌐 View at: https://github.com/herbertcubagarcia/neo-kanban"

# Optional: Create first release
read -p "🎁 Create v1.0.0 release? (y/N): " create_release
if [[ $create_release =~ ^[Yy]$ ]]; then
    gh release create v1.0.0 \
      --title "🚀 Neo Kanban v1.0.0 - Initial Release" \
      --notes "**Revolutionary File-System Kanban Board**

🎯 **Features:**
- Real file & folder integration
- React drag & drop interface  
- Live WebSocket sync
- Markdown task descriptions
- macOS Finder integration
- iCloud Drive compatibility

🛠️ **Tech Stack:**
- Frontend: React 18 + react-beautiful-dnd
- Backend: Node.js + Express + Chokidar
- Real-time: WebSocket connections
- Storage: Native file system

This is the initial stable release of Neo Kanban. Perfect for developers who want their tasks as accessible as any other file on their computer."
    
    echo "🎁 Release v1.0.0 created!"
fi