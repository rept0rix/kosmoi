#!/bin/bash

# Ghost Driver - The Iron Calendar Automation Script
# Connects the Ghost Machine to the Hive Mind.

CATEGORY=$1

if [ "$CATEGORY" == "hotels" ]; then
  REAL_CATEGORY="accomodations"
else
  REAL_CATEGORY=$CATEGORY
fi

echo "👻 Ghost Protocol Initiated: Target [$REAL_CATEGORY]"

# 1. Ensure we have the latest orders
echo "📡 Syncing with Hive Mind..."
git pull origin main

# 2. Run the Crawler
echo "🕷️ Releasing the Crawler..."
# We use 'npm run cron:crawler' which maps to 'node scripts/harvest_samuimap.js'
npm run cron:crawler -- --category="$REAL_CATEGORY"

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
