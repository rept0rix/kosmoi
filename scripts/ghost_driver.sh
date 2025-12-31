#!/bin/bash

# Ghost Driver - The Iron Calendar Automation Script
# Connects the Ghost Machine to the Hive Mind.

CATEGORY=$1

if [ -z "$CATEGORY" ]; then
  echo "Usage: ./ghost_driver.sh <category>"
  echo "Example: ./ghost_driver.sh hotels"
  exit 1
fi

echo "👻 Ghost Protocol Initiated: Target [$CATEGORY]"

# 1. Ensure we have the latest orders
echo "📡 Syncing with Hive Mind..."
git pull origin main

# 2. Run the Crawler
echo "🕷️ Releasing the Crawler..."
# Assuming the standard crawler command. Adjust if package.json script differs.
# We use the existing 'npm run crawler' but passing the category if supported, 
# or just relying on the hardcoded script if strictly defined.
# For now, we assume the user modifies the crawler code or we pass an arg if supported.
# If strict arg passing isn't set up in package.json, we run the default.
npm run crawler

# 3. Check if data changed
if git diff --quiet downloads/samui_map/harvested_data.json; then
  echo "💤 No new data harvested. Ghost sleeping."
else
  echo "📦 New Intel Acquired. Packaging..."
  git add downloads/samui_map/harvested_data.json
  git commit -m "harvest: fresh data for $CATEGORY [ghost-machine]"
  
  echo "🚀 Transmitting to Hive Mind..."
  git push origin main
  echo "✅ Transmission Complete."
fi

echo "🏁 Mission Accomplished."
