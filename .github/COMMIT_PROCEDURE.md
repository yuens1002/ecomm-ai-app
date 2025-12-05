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

## Suggestions

### Branching Strategy

**Feature Development Workflow:**

- Use `feat/feature-name` for new features
- Use `fix/issue-description` for bug fixes
- Merge feature branches to `feat/integration-branch` for testing
- Merge integration branch to `main` when ready for release

**Example:**

```bash
# Feature development
git checkout -b feat/add-user-authentication
# ... development work ...
git checkout -b feat/integration-auth
git merge feat/add-user-authentication
# ... integration testing ...
git checkout main
git merge feat/integration-auth
```

### Build & Backup Gate (major merges to integration/main)

For major bodies of work merging to integration or main, run the integrity pipeline before merging:

```bash
npm run build:safe
```

This executes:

- `npm run check:backup-models` – verifies Prisma models are covered by backups (fails fast on schema drift)
- `npm run db:backup` – creates a fresh JSON backup (timestamped + latest alias)
- `npm run build` – typecheck and production build

If the model check fails, the backup and build do not run. Fix schema/table list alignment, rerun `build:safe`, then merge.

### Quality Assurance Before Commit

**Always run before committing:**

```bash
npm i                    # Install dependencies
npm run precheck        # TypeScript + ESLint
npm run build          # Production build verification
```

**Benefits:** Catches issues before they reach main branch.

### Version Synchronization

**Keep versions in sync:**

- Update `package.json` version to match CHANGELOG.md
- Create git tags for releases: `git tag v0.x.y && git push --tags`
- Ensure all version references are consistent

**Example:**

```bash
# After updating CHANGELOG.md to v0.31.0
npm version 0.31.0 --no-git-tag-version  # Updates package.json only
git add package.json
git commit -m "chore: update package.json version to 0.31.0"
git tag v0.31.0
git push && git push --tags
```

### Documentation Updates

**When to update documentation:**

- New features: Update relevant docs (API docs, user guides)
- Code quality changes: Update `CODE_QUALITY_STANDARDS.md`
- Architecture changes: Update relevant architecture docs
- Breaking changes: Update migration guides

**Commit docs separately or with features:**

```bash
git commit -m "docs: update API documentation for new endpoints"
```

### Large Feature Development

**For complex features:**

- Break into smaller, logical commits
- Use incremental commits with clear progression
- Update changelog progressively
- Consider feature flags for gradual rollouts

**Example progression:**

```bash
git commit -m "feat: add user authentication skeleton (v0.31.0)"
git commit -m "feat: implement login/logout flow (v0.31.0)"
git commit -m "feat: add password reset functionality (v0.31.0)"
```

### Code Review Integration

**Before merging to main:**

- Ensure all commits follow this procedure
- Verify changelog entries are accurate and detailed
- Check that version numbers are properly incremented
- Confirm automated tests pass

**AI Assistant Workflow:**

- Request changelog updates: _"Update the changelog with a summary"_
- Confirm procedure: _"Follow the standard commit procedure"_
- Review before push: _"Show me the changelog entry and commit message"_

---

**Last Updated**: December 5, 2025  
**Applies To**: All commits in the ecomm-ai-app repository
