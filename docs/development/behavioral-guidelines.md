# Behavioral Guidelines for Development Sessions

## 🔥 **CRITICAL: Check These First Before Any Development**

Before starting ANY development work, read these essential references:

1. **`COMPLETE_DEVELOPMENT_HISTORY.md`** - Complete journey of all previous development attempts, failures, and successes. **This prevents redoing failed work!**
2. **`TECHNICAL_REFERENCE.md`** - Copy-paste ready working code for all implementations
3. **`DOCUMENTATION_INDEX.md`** - Guide to all documentation files

**Following these behavioral guidelines while leveraging our comprehensive documentation ensures efficient, high-quality development.**

## 🎯 **Core Development Behaviors**

When working on this project, please follow these established patterns:

### 📚 **Documentation-First Approach**

- **Check existing documentation first** - Review `COMPLETE_DEVELOPMENT_HISTORY.md` before implementing similar features
- **Use working code from `TECHNICAL_REFERENCE.md`** as starting points for new implementations
- **Always create or update documentation** when implementing features or fixes
- **Include examples and troubleshooting** in all documentation
- **Create summary documents** for complex work or multi-step processes
- **Update existing docs** (README, etc.) when adding new functionality
- **Reference established patterns** documented in our comprehensive guides

### 🧪 **Comprehensive Testing**

- **Use existing test suite** - Run `./test-runner.sh` before and after changes
- **Follow established test patterns** from `TECHNICAL_REFERENCE.md`
- **Create test scripts** for new features and significant changes
- **Test from multiple starting conditions** (different directories, clean states)
- **Include both positive and negative test cases**
- **Verify existing functionality** still works after changes
- **Where possible test scripts should always be created and used for testing** - This saves significant time and ensures reliability

### 🛠️ **Robust Script Development**

- **Use `simple-config.sh` pattern** for all new scripts (see `TECHNICAL_REFERENCE.md` for exact implementation)
- **Use absolute paths** or proper relative path handling in all scripts
- **Include clear error messages** with suggested solutions
- **Add directory validation** before executing project-specific commands
- **Make scripts portable** - they should work from any directory
- **Follow established script patterns** documented in our comprehensive guides

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

- **Check `COMPLETE_DEVELOPMENT_HISTORY.md` for established patterns** before implementing similar features
- **Follow code examples from `TECHNICAL_REFERENCE.md`** to maintain consistency
- **Use the NOET_PROJECT_PATH** variable for project references (see `simple-config.sh`)
- **Maintain the existing file organization** and naming conventions
- **Keep the development environment portable** and well-documented
- **Consistently commit files and upload to Github** - we do not want a significant gap between local work and commits to Github
- **Filter UUID tags everywhere** - Critical pattern established for tag management
- **Use predefined options over arbitrary values** - Learned from font size implementation failures

## 📋 **Before Completing Any Task**

Always ensure:

- [ ] **Checked `COMPLETE_DEVELOPMENT_HISTORY.md`** for similar previous work
- [ ] **Reviewed `TECHNICAL_REFERENCE.md`** for existing working solutions
- [ ] Documentation is created or updated
- [ ] Test scripts validate the functionality (use `./test-runner.sh`)
- [ ] Error handling is robust with clear messages
- [ ] Changes work from any starting directory (use `simple-config.sh` pattern)
- [ ] Existing functionality is not broken
- [ ] New developers can follow the process
- [ ] **Avoided documented failure patterns** (especially font size implementation)
- [ ] **Followed UUID filtering patterns** for any tag-related work

## 💡 **Key Philosophy**

**"Leave every part of the project better than you found it"**

This means better documentation, more robust error handling, clearer organization, comprehensive testing, and easier onboarding for new developers.

**"Never repeat documented failures"**

Always check our comprehensive development history before implementing features to avoid rediscovering failed approaches.

## 🚨 **Critical Behavioral Patterns**

### For Tag-Related Work
- **Always filter UUID tags** in both backend and frontend
- **Generate tags from notes**, don't use separate storage
- **Keep tag logic simple** - complex refresh logic was removed for good reason

### For UI Features  
- **Use predefined options** instead of arbitrary values (font family ✅, font size ❌)
- **Test integration with existing features** before implementing
- **Consider accessibility** and user experience impact

### For Script Development
- **Always use `simple-config.sh` pattern** for directory handling
- **Test from `/tmp` directory** to verify portability
- **Include error messages** with suggested solutions

---

_These behaviors ensure consistency, maintainability, and a welcoming development environment for all contributors while leveraging our comprehensive documentation to avoid repeating past mistakes._
