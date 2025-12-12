#!/bin/bash

# COLOURED OUTPUT
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🔄 Checking for updates from Main Computer...${NC}"

git fetch origin

# FORCE SYNC: Always stash and pull to clean the mess
echo -e "${YELLOW}📦 Auto-Stashing any local changes (worker_backup)...${NC}"
git stash save "worker_auto_stash_$(date +%s)"

echo -e "${YELLOW}⬇️ Force Pulling latest code...${NC}"
git pull origin main

echo -e "${YELLOW}📦 Refreshing dependencies...${NC}"
npm install

echo -e "${GREEN}✅ Update Complete!${NC}"
echo -e "${GREEN}🚀 Starting Agent Worker...${NC}"
echo -e "${YELLOW}(Press Ctrl+C to stop)${NC}"

node scripts/agent_worker.js
