#!/bin/bash

# force_reset_to_remote.sh
# ⚠️  DANGER: This will delete any work on THIS computer that hasn't been saved to the cloud.
# Use this on Computer B if it gets stuck and you just want it to look like Computer A.

echo "⚠️  WARNING: This will wipe all unsaved changes on this computer!"
read -p "Are you sure? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ Cancelled."
    exit 1
fi

echo "🔄 Fetching latest version..."
git fetch origin main

echo "🔥 Resetting hard to match remote..."
git reset --hard origin/main

echo "✅ Done! This computer is now identical to the cloud version."
