#!/bin/bash

# Simple test runner that sources config and runs tests
source "$(dirname "${BASH_SOURCE[0]}")/simple-config.sh"
cd "$NOET_PROJECT_PATH"

echo "🧪 Running tests from: $(pwd)"

if [[ $# -eq 0 ]]; then
    echo "Usage: $0 <test-file>"
    echo "Available tests:"
    ls -1 test-*.js 2>/dev/null || echo "No test files found"
    exit 1
fi

test_file="$1"

if [[ ! -f "$test_file" ]]; then
    echo "❌ Test file not found: $test_file"
    exit 1
fi

echo "🚀 Running: $test_file"
node "$test_file"
