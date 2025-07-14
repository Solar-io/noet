# Development Protocol

## Overview

This document establishes a mandatory development protocol for ALL code changes to prevent the issues encountered during the scrolling fix implementation, where untested changes, missing dependencies, and poor branch management led to significant debugging overhead.

## 🔄 WORKFLOW REQUIREMENTS

### 1. Feature Branch Strategy

**Never work directly on main branch**

- Create feature branches: `feature/description` or `fix/issue-name`
- One feature/fix per branch
- Merge only after complete testing
- Example: `git checkout -b fix/middle-pane-scrolling`

### 2. Pre-Implementation Review

**Analyze before coding**

- Analyze the request thoroughly
- Identify ALL affected components and dependencies
- Create implementation plan with checkpoints
- Estimate potential breaking changes
- Verify all required dependencies exist

### 3. Atomic Commits

**One logical change per commit**

- Separate concerns (CSS fixes ≠ new features ≠ dependency updates)
- Commit messages must be descriptive
- Each commit should be potentially revertible
- Example: Good commits separate CSS changes from dependency updates

## 🧪 TESTING REQUIREMENTS

### MANDATORY: Test every change before declaring it complete

### 1. Pre-Testing Checklist

- [ ] Verify all imports/dependencies exist
- [ ] Check for compilation errors
- [ ] Test in clean browser session
- [ ] Verify core functionality still works

### 2. Manual Testing Protocol

- [ ] Test the specific feature/fix
- [ ] Test related functionality
- [ ] Test edge cases and error conditions
- [ ] Test user workflows end-to-end

### 3. Never commit without testing

- "Did you test this?" = Yes, with specific evidence
- Document test results
- Include screenshots/videos for UI changes

## 🛠️ DEBUGGING PROTOCOL

### When issues arise:

1. **Isolation**: Create minimal reproduction case
2. **Root Cause**: Identify exact problem source
3. **Impact Analysis**: What else might be affected?
4. **Surgical Fix**: Minimal change to fix the issue
5. **Verification**: Test fix thoroughly before committing

### Example from scrolling fix:

- **Issue**: Middle pane causing whole-screen scrolling
- **Root Cause**: `.main-layout-container > div { overflow: hidden }`
- **Surgical Fix**: Remove overly broad rule, add specific overflow controls
- **Verification**: Test all three panes scroll independently

## 📋 CHECKPOINT SYSTEM

### For complex changes, use checkpoints:

1. **Planning Phase**: Create todo list with dependencies
2. **Implementation Phase**: Complete one checkpoint at a time
3. **Testing Phase**: Test each checkpoint before proceeding
4. **Integration Phase**: Verify everything works together
5. **Documentation Phase**: Update docs and commit

### Example Todo List:

```
- [ ] Isolate CSS rule causing scrolling issue
- [ ] Remove problematic overflow rule (depends on: isolate)
- [ ] Add specific overflow controls (depends on: remove)
- [ ] Test middle pane scrolling (depends on: add controls)
- [ ] Verify other panes unaffected (depends on: test middle)
```

## 🚨 ROLLBACK PROCEDURES

### Always have a rollback plan:

1. **Commit History**: Keep clean, revertible commits
2. **Backup Strategy**: Know the last working commit
3. **Emergency Rollback**: Document how to quickly revert
4. **Dependency Tracking**: Know what changes affect what

### Example Rollback Commands:

```bash
# Revert to last working commit
git reset --hard abc123

# Revert specific file
git checkout HEAD~1 -- src/index.css

# Revert specific commit
git revert abc123
```

## 🔍 QUALITY GATES

### Before any commit:

- [ ] All dependencies installed and working
- [ ] No compilation errors
- [ ] Manual testing completed
- [ ] Core functionality verified
- [ ] Edge cases tested
- [ ] Documentation updated if needed
- [ ] Rollback plan identified

## 🚫 ANTI-PATTERNS TO AVOID

### Based on lessons learned:

- ❌ Working directly on main branch
- ❌ Multiple unrelated changes in one commit
- ❌ Committing untested code
- ❌ Adding dependencies without verification
- ❌ Making assumptions about existing code
- ❌ Skipping manual testing
- ❌ Creating circular dependencies
- ❌ Mixing CSS changes with feature additions

## 💡 BEST PRACTICES

### Proven approaches:

- ✅ Use semantic commit messages
- ✅ Small, focused changes
- ✅ Test-driven development
- ✅ Document complex decisions
- ✅ Regular checkpoints
- ✅ Proactive communication about blocking issues
- ✅ Separate dependency updates from feature work

## 🔧 DEPENDENCY MANAGEMENT

### Learned from @tiptap/extension-placeholder failure:

1. **Verify Before Use**: Check if dependency exists before importing
2. **Install Before Import**: `npm install package` before `import Package`
3. **Version Compatibility**: Ensure compatible versions
4. **Test Immediately**: Test import works before building on it

### Example Safe Dependency Addition:

```bash
# 1. Check if package exists
npm info @tiptap/extension-placeholder

# 2. Install package
npm install @tiptap/extension-placeholder

# 3. Test import works
# Add import to file and test compilation

# 4. Only then use in code
```

## 🎯 SPECIFIC FIXES FROM EXPERIENCE

### CSS Layout Issues:

- **Problem**: Overly broad CSS rules affecting unintended elements
- **Solution**: Use specific selectors and test each pane independently
- **Prevention**: Always test UI changes across all affected components

### Missing Dependencies:

- **Problem**: Importing packages that don't exist
- **Solution**: Install and verify before importing
- **Prevention**: Use package manager to verify availability

### Undefined Functions:

- **Problem**: Using functions that don't exist in scope
- **Solution**: Verify all functions exist before calling
- **Prevention**: Use TypeScript or careful manual checking

## 📝 COMMIT MESSAGE STANDARDS

### Format:

```
type(scope): description

Examples:
fix(css): remove overly broad overflow rule causing scrolling issues
feat(editor): add font size extension with proper dependency management
docs(protocol): add development protocol to prevent future issues
```

### Types:

- `fix`: Bug fixes
- `feat`: New features
- `docs`: Documentation changes
- `style`: CSS/styling changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `deps`: Dependency updates

## 🚀 IMPLEMENTATION CHECKLIST

### Before starting any work:

- [ ] Read this protocol completely
- [ ] Create feature branch
- [ ] Understand the full scope
- [ ] Plan implementation with checkpoints
- [ ] Identify all dependencies
- [ ] Create rollback plan

### During implementation:

- [ ] Follow atomic commit strategy
- [ ] Test each checkpoint
- [ ] Document decisions
- [ ] Keep commits focused
- [ ] Verify dependencies exist

### Before merging:

- [ ] Complete manual testing
- [ ] Verify all functionality works
- [ ] Test edge cases
- [ ] Update documentation
- [ ] Confirm rollback plan
- [ ] Get code review if possible

## 🎓 LEARNING FROM FAILURES

### Key Lessons:

1. **Scrolling Issue**: CSS rules can have far-reaching effects
2. **Dependency Issues**: Always verify packages exist before importing
3. **Testing**: Manual testing is non-negotiable
4. **Rollback**: Keep clean commit history for easy rollback
5. **Scope**: Understand full impact before making changes

**Remember**: It's better to take longer and do it right than to rush and break existing functionality. Quality over speed.

## 🔗 Related Documentation

- [`COMPLETE_DEVELOPMENT_HISTORY.md`](../development/complete-development-history.md) - Historical context
- [`TECHNICAL_REFERENCE.md`](../development/technical-reference.md) - Working code examples
- [`BEHAVIORAL_GUIDELINES.md`](../development/behavioral-guidelines.md) - Application behavior guidelines
- [`API_DEBUGGING_GUIDE.md`](../api/debugging-guide.md) - API debugging procedures
