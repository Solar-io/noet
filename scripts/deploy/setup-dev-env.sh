#!/bin/bash

# Setup script for NOET_PROJECT_PATH environment variable
# Run this once to configure your development environment

echo "🔧 Noet App - Development Environment Setup"
echo "=========================================="

# Get the absolute path to the project directory
PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
echo "📁 Project directory: $PROJECT_DIR"

# Detect shell and profile file
if [[ "$SHELL" == *"zsh"* ]]; then
    PROFILE_FILE="$HOME/.zshrc"
    SHELL_NAME="zsh"
elif [[ "$SHELL" == *"bash"* ]]; then
    PROFILE_FILE="$HOME/.bash_profile"
    # Also check for .bashrc on Linux systems
    if [[ ! -f "$PROFILE_FILE" ]] && [[ -f "$HOME/.bashrc" ]]; then
        PROFILE_FILE="$HOME/.bashrc"
    fi
    SHELL_NAME="bash"
else
    echo "⚠️  Unknown shell: $SHELL"
    echo "Please manually add the following lines to your shell profile:"
    echo ""
    echo "export NOET_PROJECT_PATH=\"$PROJECT_DIR\""
    echo "alias noet=\"cd \$NOET_PROJECT_PATH\""
    exit 1
fi

echo "🐚 Detected shell: $SHELL_NAME"
echo "📄 Profile file: $PROFILE_FILE"

# Check if already configured
if grep -q "NOET_PROJECT_PATH" "$PROFILE_FILE" 2>/dev/null; then
    echo "✅ NOET_PROJECT_PATH already configured in $PROFILE_FILE"
    
    # Show current configuration
    echo ""
    echo "📋 Current configuration:"
    grep -A 1 "NOET_PROJECT_PATH" "$PROFILE_FILE" 2>/dev/null || echo "Configuration found but could not display"
    
    echo ""
    echo "💡 To update the path, edit $PROFILE_FILE manually"
    echo "💡 Then run: source $PROFILE_FILE"
else
    echo ""
    echo "🎯 Adding NOET_PROJECT_PATH configuration to $PROFILE_FILE"
    
    # Add configuration to profile
    echo "" >> "$PROFILE_FILE"
    echo "# Noet App Project Configuration" >> "$PROFILE_FILE"
    echo "export NOET_PROJECT_PATH=\"$PROJECT_DIR\"" >> "$PROFILE_FILE"
    echo "alias noet=\"cd \$NOET_PROJECT_PATH\"" >> "$PROFILE_FILE"
    
    echo "✅ Configuration added!"
    echo ""
    echo "🔄 To activate the configuration, run:"
    echo "   source $PROFILE_FILE"
    echo ""
    echo "🎉 After that, you can use 'noet' to navigate to the project directory from anywhere!"
fi

echo ""
echo "📚 For more information, see DEVELOPMENT_ENVIRONMENT.md"
