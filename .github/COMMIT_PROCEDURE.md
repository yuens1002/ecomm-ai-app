# Standard Commit Procedure

## Overview

This document defines the standard procedure for committing code changes during development sessions.

## When to Commit

- After completing a logical unit of work (feature, fix, refactor)
- Before switching branches or ending a session
- When making significant progress on large tasks (incremental commits)
- After code quality improvements (lint/type fixes)

## Commit Procedure

### 1. Stage Changes

```bash
git add -A
```

### 2. Update CHANGELOG.md

Add entry at the top with:

- **Version number** (increment patch for fixes, minor for features)
- **Date** (YYYY-MM-DD format)
- **Brief category title** with description
- **Bulleted list** of specific changes
- **Metrics** when applicable (test results, error counts, performance)

**Format:**

```markdown
## 0.x.y - YYYY-MM-DD

- **Category Title**: Brief description
  - Specific change 1
  - Specific change 2 with details (metrics if applicable)
  - Remaining work or notes (if applicable)
```

**Example:**

```markdown
## 0.30.4 - 2025-12-05

- **Code Quality Improvements**: Major ESLint and TypeScript cleanup (135→112 problems, 49→25 errors)
  - Fixed all react-hooks/set-state-in-effect violations (5 files) using proper React patterns
  - Replaced 15+ `any` types with proper TypeScript types
  - Fixed all @next/next/no-html-link-for-pages violations
  - Remaining Work: 25 errors and 87 warnings to address in next iteration
```

### 3. Commit with Standard Message

**Format:**

```bash
git commit -m "<type>: <brief description> (v0.x.y)"
```

**Types:**

- `feat:` - New feature
- `fix:` - Bug fix or code quality improvement
- `refactor:` - Code restructuring without behavior change
- `docs:` - Documentation only
- `chore:` - Build process, dependencies, tooling
- `test:` - Adding or updating tests
- `perf:` - Performance improvements

**Examples:**

```bash
git commit -m "feat: add icon selection for pages with navigation ordering (v0.30.3)"
git commit -m "fix: code quality improvements - ESLint/TypeScript cleanup (v0.30.4)"
git commit -m "refactor: consolidate block rendering logic (v0.31.0)"
```

### 4. Push to Remote (when ready)

```bash
git push origin <branch-name>
```

## Best Practices

### Changelog Guidelines

**DO:**

- ✅ Include version number and date
- ✅ Use category titles (bold) for grouping related changes
- ✅ List specific, actionable changes with bullet points
- ✅ Include metrics when measuring improvements (error counts, test coverage, performance)
- ✅ Note remaining work or known issues
- ✅ Keep descriptions concise but informative
- ✅ Use past tense for completed work

**DON'T:**

- ❌ Use vague descriptions like "various fixes" or "improvements"
- ❌ Include implementation details (save for commit message or PR description)
- ❌ Mix unrelated changes in one entry
- ❌ Forget to update version number
- ❌ Skip changelog for "small" changes (they add up!)

### Commit Message Guidelines

**DO:**

- ✅ Keep first line under 72 characters
- ✅ Use imperative mood ("add feature" not "added feature")
- ✅ Include version number in parentheses
- ✅ Be specific about what changed
- ✅ Reference issue numbers when applicable

**DON'T:**

- ❌ Use generic messages like "update files" or "fix stuff"
- ❌ Include multiple unrelated changes
- ❌ Forget the type prefix (feat:, fix:, etc.)
- ❌ Write paragraphs (save details for changelog)

### Version Numbering

Follow Semantic Versioning (MAJOR.MINOR.PATCH):

- **MAJOR (0.x.0)**: Breaking changes, major rewrites
- **MINOR (0.x.0)**: New features, significant additions (most common)
- **PATCH (0.0.x)**: Bug fixes, small improvements, code quality

For this project currently in 0.x.y:

- Most feature work: increment MINOR (0.30.0 → 0.31.0)
- Bug fixes and cleanup: increment PATCH (0.30.3 → 0.30.4)

## AI Assistant Reminder

When working with an AI coding assistant:

1. **Request changelog update** before committing:

   > "Let's commit this work. Update the changelog with a summary."

2. **Confirm commit procedure**:

   > "Use the standard commit procedure: update changelog, commit with version number."

3. **Review before pushing**:
   > "Show me the changelog entry and commit message before pushing."

## Automation (Optional)

Consider creating a git hook or script:

**File:** `.git/hooks/pre-commit` or `scripts/commit.sh`

```bash
#!/bin/bash
# Enforce changelog update before commit
if ! git diff --cached --name-only | grep -q "CHANGELOG.md"; then
  echo "❌ Error: CHANGELOG.md not updated"
  echo "Please update CHANGELOG.md before committing"
  exit 1
fi
```

## Template Checklist

Before every commit:

- [ ] Changes staged with `git add -A`
- [ ] CHANGELOG.md updated with version, date, and detailed changes
- [ ] Version number incremented appropriately
- [ ] Commit message follows format: `<type>: <description> (v0.x.y)`
- [ ] Type prefix matches change category (feat/fix/refactor/etc.)
- [ ] Brief but specific commit message
- [ ] Ready to push to remote (or noted for later)

---

**Last Updated**: December 5, 2025  
**Applies To**: All commits in the ecomm-ai-app repository
