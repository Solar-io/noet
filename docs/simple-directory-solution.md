# Simple Directory Management Solution

## The Problem
Scripts and terminals were defaulting to `/Users/sgallant/sync/common` instead of the project directory `/Users/sgallant/sync/rygel/noet-app`.

## The Simple Solution
Instead of complex directory guards and terminal profiles, we use a single config file that all scripts source.

## Implementation

### 1. Config File (`simple-config.sh`)
```bash
#!/bin/bash

# Simple Noet App Configuration
export RYGEL_BASE="/Users/sgallant/sync/rygel"
export NOET_PROJECT_PATH="$RYGEL_BASE/noet-app"

# Convenience function to switch to project directory
cd_noet() {
    cd "$NOET_PROJECT_PATH"
}
```

### 2. Any Script Pattern
```bash
#!/bin/bash

# Source config and work in project directory
source "$(dirname "${BASH_SOURCE[0]}")/simple-config.sh"
cd "$NOET_PROJECT_PATH"

# Now do whatever you need to do
echo "Working in: $(pwd)"
```

### 3. VS Code Terminal Profile
```json
"terminal.integrated.profiles.osx": {
  "noet-simple": {
    "path": "bash",
    "args": [
      "-c",
      "source '/Users/sgallant/sync/rygel/noet-app/simple-config.sh' && cd \"$NOET_PROJECT_PATH\" && echo '✅ Terminal started in: $(pwd)' && exec bash"
    ],
    "icon": "terminal-bash"
  }
}
```

## Benefits

1. **Centralized Configuration**: Change the base path in one place
2. **Simple to Understand**: Just source the config and cd to the project
3. **Reliable**: Works from any directory
4. **Maintainable**: No complex logic or guards needed
5. **Flexible**: Easy to extend with more variables if needed

## Testing
All scripts can be run from any directory and will automatically work in the correct project directory:

```bash
cd /tmp
/Users/sgallant/sync/rygel/noet-app/simple-noet.sh npm start
/Users/sgallant/sync/rygel/noet-app/simple-test.sh test-tag-counts.js
```

## Migration
To migrate existing scripts:
1. Add `source "$(dirname "${BASH_SOURCE[0]}")/simple-config.sh"` at the top
2. Add `cd "$NOET_PROJECT_PATH"` after sourcing
3. Remove any complex directory handling logic
