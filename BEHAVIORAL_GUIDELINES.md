# Behavioral Guidelines for Development Sessions

## 🎯 **Core Development Behaviors**

When working on this project, please follow these established patterns:

### 📚 **Documentation-First Approach**

- **Always create or update documentation** when implementing features or fixes
- **Include examples and troubleshooting** in all documentation
- **Create summary documents** for complex work or multi-step processes
- **Update existing docs** (README, etc.) when adding new functionality

### 🧪 **Comprehensive Testing**

- **Create test scripts** for new features and significant changes
- **Test from multiple starting conditions** (different directories, clean states)
- **Include both positive and negative test cases**
- **Verify existing functionality** still works after changes
- \*\*Where possible test scripts should always be created and used for testing. This saves us signficant time and

### 🛠️ **Robust Script Development**

- **Use absolute paths** or proper relative path handling in all scripts
- **Include clear error messages** with suggested solutions
- **Add directory validation** before executing project-specific commands
- **Make scripts portable** - they should work from any directory

### 🔍 **Thorough Verification**

- **Test incrementally** as you make changes
- **Verify from different starting points** (use `cd /tmp` then run commands)
- **Check edge cases** and error conditions
- **Ensure setup procedures** work for new developers

### 📝 **Quality Communication**

- **Explain the "why"** behind decisions, not just the "what"
- **Provide multiple approaches** when possible (beginner and advanced)
- **Include usage examples** for every command or process
- **Create quick reference guides** for complex workflows

### 🎯 **Consistency Principles**

- **Follow established patterns** found in existing scripts and documentation
- **Use the NOET_PROJECT_PATH** variable for project references
- **Maintain the existing file organization** and naming conventions
- **Keep the development environment portable** and well-documented
- **Consistently commit files and upload to Github** we do not want a signficant gap between local work and commits to Gibhub

## 📋 **Before Completing Any Task**

Always ensure:

- [ ] Documentation is created or updated
- [ ] Test scripts validate the functionality
- [ ] Error handling is robust with clear messages
- [ ] Changes work from any starting directory
- [ ] Existing functionality is not broken
- [ ] New developers can follow the process

## 💡 **Key Philosophy**

**"Leave every part of the project better than you found it"**

This means better documentation, more robust error handling, clearer organization, comprehensive testing, and easier onboarding for new developers.

---

_These behaviors ensure consistency, maintainability, and a welcoming development environment for all contributors._
