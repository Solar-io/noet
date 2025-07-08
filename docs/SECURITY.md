# Security and Privacy Guidelines

## Git Ignore Configuration

The following directories and files contain sensitive user data and are excluded from version control:

### Excluded Paths

- `server/notes/` - All user note content, metadata, and attachments
- `server/users.json` - User account information and credentials
- `users.json` - Root level user data
- `notes/` - Legacy notes directory
- `server/.temp-imports/` - Temporary files from imports

### Server Directory Structure

The `server/*/` pattern excludes all subdirectories except:

- `server/middleware/` - Application middleware (safe to commit)
- `server/routes/` - API route definitions (safe to commit)
- `server/tests/` - Test files (safe to commit)
- `server/utils/` - Utility functions (safe to commit)

## Removing Tracked Sensitive Data

If sensitive data was accidentally committed, remove it from git history:

```bash
# Remove from tracking but keep files on disk
git rm -r --cached server/notes/
git rm --cached server/users.json users.json

# Commit the removal
git commit -m "Remove sensitive user data from git tracking"

# For complete removal from history (if needed)
# Warning: This rewrites git history
git filter-branch --tree-filter 'rm -rf server/notes server/users.json users.json' HEAD
```

## Best Practices

1. **Never commit user data** - All user-generated content should remain local
2. **Use example files** - Create `.example` versions of config files with dummy data
3. **Environment variables** - Store secrets in `.env` files (already in .gitignore)
4. **Regular audits** - Periodically check `git status` to ensure no sensitive data is tracked

## Data Storage

User data is stored in:

- `server/notes/[userId]/[noteId]/` - Individual note directories
- `server/notes/[userId]/tags.json` - User tags
- `server/notes/[userId]/notebooks.json` - User notebooks
- `server/notes/[userId]/folders.json` - User folders
- `server/users.json` - User accounts

All these paths are excluded from version control to protect user privacy.
