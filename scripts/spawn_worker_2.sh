#!/bin/bash

# This script launches a second instance of agent_worker.js with a debug-agent persona

cd /Users/rept0rix/Documents/GitHub/kosmoi

# Use npm to run the worker script defined in package.json
npm run worker -- --persona="debug-agent"