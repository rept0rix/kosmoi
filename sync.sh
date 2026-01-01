#!/bin/bash

# Simple Sync Script for Kosmoi
# Usage: ./sync.sh [optional message]

echo "🔄 Starting Sync..."

# 1. Pull latest changes (fast-forward only to avoid messy merges if possible)
echo "⬇️  Pulling..."
git pull --rebase
if [ $? -ne 0 ]; then
    echo "❌ Error pulling changes. specific manual intervention required."
    exit 1
fi

# 2. Add all changes
echo "➕ Adding files..."
git add .

# 3. Commit
MSG=${1:-"Auto-sync from script"}
echo "📦 Committing with message: '$MSG'..."
git commit -m "$MSG"

# 4. Push
echo "⬆️  Pushing..."
git push

echo "✅ Sync Complete!"
