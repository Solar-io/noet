#!/bin/bash
# Direct vite startup script
cd "$(dirname "$0")"
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
node node_modules/vite/bin/vite.js
