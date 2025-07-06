#!/bin/bash

# Universal Test Runner for Noet App
# Uses simple config approach for directory management

# Source simple config and switch to project directory
source "$(dirname "${BASH_SOURCE[0]}")/scripts/simple-config.sh"
cd "$NOET_PROJECT_PATH"

# Function to run a specific test
run_single_test() {
    local test_file="$1"
    echo ""
    echo "════════════════════════════════════════"
    echo "🧪 Running: $test_file"
    echo "════════════════════════════════════════"
    
    if noet_run node "$test_file"; then
        echo "✅ PASSED: $test_file"
        return 0
    else
        echo "❌ FAILED: $test_file"
        return 1
    fi
}

# Function to run all tests
run_all_tests() {
    local test_files=($(ls "$NOET_PROJECT_ROOT"/test-*.js 2>/dev/null))
    
    if [[ ${#test_files[@]} -eq 0 ]]; then
        echo "⚠️ No test files found in $NOET_PROJECT_ROOT"
        return 1
    fi
    
    local passed=0
    local failed=0
    local failed_tests=()
    
    echo "🚀 Running all tests from $NOET_PROJECT_ROOT..."
    echo "Found ${#test_files[@]} test files"
    
    for test_file in "${test_files[@]}"; do
        local test_name=$(basename "$test_file")
        if run_single_test "$test_name"; then
            ((passed++))
        else
            ((failed++))
            failed_tests+=("$test_name")
        fi
    done
    
    echo ""
    echo "════════════════════════════════════════"
    echo "📊 Test Results Summary"
    echo "════════════════════════════════════════"
    echo "✅ Passed: $passed"
    echo "❌ Failed: $failed"
    echo "📋 Total:  $((passed + failed))"
    
    if [[ $failed -gt 0 ]]; then
        echo ""
        echo "❌ Failed Tests:"
        for test in "${failed_tests[@]}"; do
            echo "   - $test"
        done
        return 1
    else
        echo ""
        echo "🎉 All tests passed!"
        return 0
    fi
}

# Main execution
if [[ $# -eq 0 ]]; then
    echo "Noet Test Runner"
    echo ""
    echo "Usage: $0 [test-file|all]"
    echo ""
    echo "Examples:"
    echo "  $0 test-note-counts.js  # Run specific test"
    echo "  $0 all                  # Run all tests"
    echo "  $0                      # Show available tests"
    echo ""
    echo "Available tests:"
    ls -1 "$NOET_PROJECT_ROOT"/test-*.js 2>/dev/null | sed 's|.*/||; s/^/  /' || echo "  No test scripts found"
    echo ""
    echo "Project: $NOET_PROJECT_ROOT"
    exit 0
fi

case "$1" in
    "all")
        run_all_tests
        ;;
    *)
        if [[ -f "$NOET_PROJECT_ROOT/$1" ]]; then
            run_single_test "$1"
        else
            echo "❌ Test file not found: $NOET_PROJECT_ROOT/$1"
            echo ""
            echo "Available tests:"
            ls -1 "$NOET_PROJECT_ROOT"/test-*.js 2>/dev/null | sed 's|.*/||; s/^/  /' || echo "  No test scripts found"
            exit 1
        fi
        ;;
esac
