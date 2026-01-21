#!/bin/bash
# Logan Wrapper Script for Kosmoi
# This script runs the local source version of Logan (OpenCode) using Bun.

# Get the absolute path of the project root
PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Run the CLI from the tools directory
# We pass all arguments ("$@") to the CLI
bun run --cwd "$PROJECT_ROOT/tools/logan" packages/opencode/src/index.ts "$@"
