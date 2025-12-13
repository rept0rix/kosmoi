#!/bin/bash

# COLOURED OUTPUT
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# AUTO-RESTART LOOP
while true; do
    echo -e "${YELLOW}🔄 Checking for updates from Main Computer...${NC}"
    
    git fetch origin
    
    # Check if behind
    LOCAL=$(git rev-parse @)
    REMOTE=$(git rev-parse @{u})
    
    if [ $LOCAL = $REMOTE ]; then
        echo -e "${GREEN}✅ Up to date.${NC}"
    else
        echo -e "${YELLOW}⬇️ Updates detected! Pulling...${NC}"
        git stash save "worker_auto_stash_$(date +%s)"
        git pull origin main
        echo -e "${YELLOW}📦 Refreshing dependencies...${NC}"
        npm install
    fi

    echo -e "${GREEN}🚀 Starting Agent Worker...${NC}"
    # Pass arguments if any
    node scripts/agent_worker.js "$@"
    
    EXIT_CODE=$?
    echo -e "${RED}⚠️ Agent Worker stopped (Exit Code: $EXIT_CODE).${NC}"
    echo -e "${YELLOW}⏳ Restarting in 5 seconds... (Press Ctrl+C to abort)${NC}"
    sleep 5
done
