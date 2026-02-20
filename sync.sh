#!/bin/bash

# Simple Sync Script for Kosmoi
# Usage: ./sync.sh [optional message]

echo "🔄 Starting Sync..."

# 1. Add all changes
echo "➕ Staging changes..."
git add .

# 2. Commit (so we don't block the pull)
MSG=${1:-"Auto-sync from script"}
# Only commit if there are changes
if ! git diff-index --quiet HEAD --; then
    echo "📦 Committing with message: '$MSG'..."
    git commit -m "$MSG"
else
    echo "👍 No local changes to commit."
fi

# 3. Pull latest changes (rebase to keep history clean)
echo "⬇️  Pulling..."
git pull --rebase
if [ $? -ne 0 ]; then
    echo "❌ Error pulling changes. You might have conflicts."
    exit 1
fi

# 4. Push
echo "⬆️  Pushing..."
git push

echo "✅ Sync Complete!"
