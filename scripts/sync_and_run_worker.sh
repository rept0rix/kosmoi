#!/bin/bash

# COLOURED OUTPUT
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔄 Checking for updates from Main Computer...${NC}"

# 1. Fetch latest meta-data
git fetch origin

# 2. Check if we are behind
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u})

if [ $LOCAL = $REMOTE ]; then
    echo -e "${GREEN}✅ Worker is up to date.${NC}"
else
    echo -e "${RED}⚠️ Worker is BEHIND! Updating now...${NC}"
    
    # 3. Stash local changes (The "18 files" you see) to prevent conflicts
    # We name the stash so we can find it later if needed
    echo -e "${YELLOW}📦 Stashing local changes to 'worker_backup'...${NC}"
    git stash save "worker_backup_$(date +%s)"

    # 4. Force pull the latest code
    echo -e "${YELLOW}⬇️ Pulling latest code...${NC}"
    git pull origin main
    
    # 5. Refresh dependencies just in case
    echo -e "${YELLOW}📦 Checking dependencies...${NC}"
    npm install
    
    echo -e "${GREEN}✅ Update Complete!${NC}"
fi

echo -e "${GREEN}🚀 Starting Agent Worker...${NC}"
echo -e "${YELLOW}(Press Ctrl+C to stop)${NC}"

# 6. Run the worker
node scripts/agent_worker.js
