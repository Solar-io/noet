# Development Protocol Prompt Template

## Copy-Paste This Into Future Development Sessions

```
CRITICAL: Follow this development protocol for ALL code changes:

### 🔄 WORKFLOW REQUIREMENTS
1. **Feature Branch Strategy**: Never work directly on main branch
   - Create feature branches: `feature/description` or `fix/issue-name`
   - One feature/fix per branch
   - Merge only after complete testing

2. **Pre-Implementation Review**:
   - Analyze the request thoroughly
   - Identify ALL affected components and dependencies
   - Create implementation plan with checkpoints
   - Estimate potential breaking changes
   - Verify all required dependencies exist

3. **Atomic Commits**:
   - One logical change per commit
   - Separate concerns (CSS fixes ≠ new features ≠ dependency updates)
   - Commit messages must be descriptive
   - Each commit should be potentially revertible

### 🧪 TESTING REQUIREMENTS
**MANDATORY**: Test every change before declaring it complete

1. **Pre-Testing Checklist**:
   - Verify all imports/dependencies exist
   - Check for compilation errors
   - Test in clean browser session
   - Verify core functionality still works

2. **Manual Testing Protocol**:
   - Test the specific feature/fix
   - Test related functionality
   - Test edge cases and error conditions
   - Test user workflows end-to-end

3. **Never commit without testing**:
   - "Did you test this?" = Yes, with specific evidence
   - Document test results
   - Include screenshots/videos for UI changes

### 🛠️ DEBUGGING PROTOCOL
When issues arise:

1. **Isolation**: Create minimal reproduction case
2. **Root Cause**: Identify exact problem source
3. **Impact Analysis**: What else might be affected?
4. **Surgical Fix**: Minimal change to fix the issue
5. **Verification**: Test fix thoroughly before committing

### 📋 CHECKPOINT SYSTEM
For complex changes, use checkpoints:

1. **Planning Phase**: Create todo list with dependencies
2. **Implementation Phase**: Complete one checkpoint at a time
3. **Testing Phase**: Test each checkpoint before proceeding
4. **Integration Phase**: Verify everything works together
5. **Documentation Phase**: Update docs and commit

### 🚨 ROLLBACK PROCEDURES
Always have a rollback plan:

1. **Commit History**: Keep clean, revertible commits
2. **Backup Strategy**: Know the last working commit
3. **Emergency Rollback**: Document how to quickly revert
4. **Dependency Tracking**: Know what changes affect what

### 🔍 QUALITY GATES
Before any commit:

- [ ] All dependencies installed and working
- [ ] No compilation errors
- [ ] Manual testing completed
- [ ] Core functionality verified
- [ ] Edge cases tested
- [ ] Documentation updated if needed
- [ ] Rollback plan identified

### 🚫 ANTI-PATTERNS TO AVOID
- Working directly on main branch
- Multiple unrelated changes in one commit
- Committing untested code
- Adding dependencies without verification
- Making assumptions about existing code
- Skipping manual testing
- Creating circular dependencies

### 💡 BEST PRACTICES
- Use semantic commit messages
- Small, focused changes
- Test-driven development
- Document complex decisions
- Regular checkpoints
- Proactive communication about blocking issues

**Remember**: It's better to take longer and do it right than to rush and break existing functionality. Quality over speed.
```

## Full Documentation

For complete details, see: [`docs/development/development-protocol.md`](./development-protocol.md)
