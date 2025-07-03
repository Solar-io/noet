#!/bin/bash
# Direct vite startup script
# Uses NOET_PROJECT_PATH if available, otherwise uses script directory

if [[ -n "$NOET_PROJECT_PATH" ]] && [[ -d "$NOET_PROJECT_PATH" ]]; then
    cd "$NOET_PROJECT_PATH"
    echo "📁 Using NOET_PROJECT_PATH: $(pwd)"
else
    cd "$(dirname "$0")"
    echo "📁 Using script directory: $(pwd)"
fi

export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
node node_modules/vite/bin/vite.js
