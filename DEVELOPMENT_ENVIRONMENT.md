# Development Environment Setup

## Working Directory Configuration

This project includes several configuration options to ensure consistent working directory usage across different development environments.

### NOET_PROJECT_PATH Variable

A `NOET_PROJECT_PATH` environment variable has been configured in your shell profile to provide a consistent reference to the project directory:

```bash
export NOET_PROJECT_PATH="~/sync/rygel/noet-app"
```

### Quick Navigation

Use the `noet` alias to quickly navigate to the project directory from anywhere:

```bash
noet  # Changes to the project directory
```

This alias is defined as:
```bash
alias noet="cd $NOET_PROJECT_PATH"
```

### Script Directory Handling

All project scripts are designed to work correctly regardless of where they are invoked from:

- **`quick-start.sh`** - Automatically detects and navigates to the project directory
- **`start-dev.sh`** - Uses `cd "$(dirname "$0")"` to ensure correct working directory
- **`noet.sh`** - Comprehensive script that validates project directory and provides development commands
- **`dev-status.sh`** - Git workflow helper that works from the current directory
- **`dev-check.sh`** - Development sanity checker
- **`port-manager.sh`** - Port management utilities
- **`auto-git.sh`** - Automated git workflow helper

### Best Practices

1. **Always use absolute paths** when referencing the project directory in scripts
2. **Use `$NOET_PROJECT_PATH`** when creating new scripts that need to reference the project directory
3. **Test scripts from different directories** to ensure they work correctly
4. **Use the `noet` alias** for quick navigation during development

### Troubleshooting

If you encounter issues with scripts not finding the correct directory:

1. Verify the `NOET_PROJECT_PATH` variable is set:
   ```bash
   echo $NOET_PROJECT_PATH
   ```

2. Check that the variable points to the correct directory:
   ```bash
   ls $NOET_PROJECT_PATH/package.json
   ```

3. If the project has been moved, update the `NOET_PROJECT_PATH` variable in your shell profile:
   ```bash
   export NOET_PROJECT_PATH="/new/path/to/noet-app"
   ```

### Shell Profile Configuration

The following lines should be present in your shell profile (`.bash_profile`, `.zshrc`, etc.):

```bash
# Noet App Project Configuration
export NOET_PROJECT_PATH="~/sync/rygel/noet-app"
alias noet="cd $NOET_PROJECT_PATH"
```

**Note:** If your shell profile contains a line like `cd "$HOME/sync/common"`, this will cause your terminal to always start in that directory. This is intentional if you have a multi-project workflow, but you can use the `noet` alias to quickly navigate to this project when needed.

## Development Workflow

1. **Starting a new terminal session:**
   ```bash
   noet  # Navigate to project directory
   ```

2. **Quick development startup:**
   ```bash
   ./quick-start.sh  # Comprehensive setup and status check
   ```

3. **Start development servers:**
   ```bash
   ./noet.sh both  # Start both frontend and backend
   ```

4. **Check development status:**
   ```bash
   ./dev-status.sh  # Git status and server status
   ```

This configuration ensures that the project can be easily moved or shared while maintaining consistent development workflows.
