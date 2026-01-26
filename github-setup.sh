#!/bin/bash

# GitHub Setup Script for Neo Kanban
echo "🚀 Setting up GitHub remote and pushing..."

# Add GitHub remote (replace with your actual GitHub repo URL)
git remote add origin https://github.com/herbertcubagarcia/neo-kanban.git

# Push to GitHub
git branch -M main
git push -u origin main

echo "✅ Repository pushed to GitHub!"
echo "🌐 View at: https://github.com/herbertcubagarcia/neo-kanban"