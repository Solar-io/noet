# Noet App - Local Project .bashrc
# This file ensures the terminal always starts in the correct project directory

export NOET_PROJECT_PATH="/Users/sgallant/sync/rygel/noet-app"

# Auto-correct directory function
noet_auto_correct() {
    local current_dir="$(pwd)"
    
    # If we're not in the project directory, fix it immediately
    if [[ "$current_dir" != "$NOET_PROJECT_PATH" ]]; then
        echo "🚨 Auto-correcting directory: $current_dir → $NOET_PROJECT_PATH"
        cd "$NOET_PROJECT_PATH" || {
            echo "❌ FATAL: Cannot access project directory!"
            exit 1
        }
        echo "✅ Now in correct project directory: $(pwd)"
    fi
}

# Run auto-correction immediately when this file is sourced
noet_auto_correct

# Override cd command to prevent leaving project directory
cd() {
    if [[ $# -eq 0 ]]; then
        # cd with no arguments goes to project directory
        builtin cd "$NOET_PROJECT_PATH"
        echo "🏠 Redirected to project directory: $(pwd)"
        return
    fi
    
    local target="$1"
    
    # Block attempts to leave project directory
    if [[ "$target" == ".." ]] || [[ "$target" =~ ^/ ]] || [[ "$target" =~ \.\. ]]; then
        echo "🚨 Directory navigation blocked - staying in project directory"
        echo "   Current: $(pwd)"
        echo "   Use 'builtin cd' if you really need to leave"
        return 1
    fi
    
    # Allow relative navigation within project
    builtin cd "$@"
}

# Block other navigation commands
pushd() {
    echo "🚨 PUSHD disabled - use regular 'cd' within project directory"
    return 1
}

popd() {
    echo "🚨 POPD disabled - staying in project directory"
    return 1
}

# Export project path for all child processes
export NOET_PROJECT_PATH

echo "🔒 Noet project directory protection active: $NOET_PROJECT_PATH"
