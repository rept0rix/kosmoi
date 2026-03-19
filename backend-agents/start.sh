#!/bin/bash
exec /Library/Frameworks/Python.framework/Versions/3.13/bin/uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload --app-dir /Users/naoryanko/Downloads/samui-service-hub-main/backend-agents
