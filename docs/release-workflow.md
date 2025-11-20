# Release Workflow

## Pre-Push Checklist

Before pushing code to GitHub, **always run**:

```powershell
npm run precheck
```

This runs:

1. **TypeScript type checking** (`tsc --noEmit`) - catches type errors before they break production
2. **ESLint** - catches code quality issues

If either fails, fix the issues before committing and pushing.

---

## Feature Branch Workflow

When working on a feature branch (e.g., `feature/voice-barista-mvp`):

### 1. Make Changes and Commit

```powershell
git add -A
git commit -m "feat: descriptive commit message"
```

You can make multiple commits on the feature branch - each is isolated to the branch.

### 2. Document Significant Commits in CHANGELOG.md (Optional)

For commits that represent substantial features or improvements worth documenting:

1. Get the commit hash: `git log -1 --format="%H"`
2. Add entry under the current version section with this format:

```markdown
- **Feature Title**: One-line summary of what the commit accomplishes ([commit_hash](https://github.com/yuens1002/ecomm-ai-app/commit/{full_hash}))
  - Key accomplishment or feature 1
  - Key accomplishment or feature 2
  - Key accomplishment or feature 3
```

**Example:**
```markdown
- **AI Barista Chat MVP**: Text-based conversational interface with comprehensive error handling and brewing knowledge ([6560e73](https://github.com/yuens1002/ecomm-ai-app/commit/6560e730f3fe67fe86c5e11512388d90048ccefa))
  - Modal-based chat UI with fixed height, scrollable messages, and always-visible input
  - Gemini AI integration with user context (order history, favorites, addresses)
  - Retry mechanism for service errors with spinning state and right-aligned button
  - Comprehensive brewing method guide in system prompt (drip vs espresso distinction)
  - Bilingual support with auto-detection (English/Spanish)
  - Error handling for rate limits, service unavailable, and empty responses
```

**Guidelines:**
- Each worthy commit gets its own entry with commit link
- One-line summary describes what was accomplished
- 2-6 bullet points detail the key features/improvements
- Keep bullets concise and high-level (avoid implementation minutiae)
- This documentation helps track progress on feature branches and makes merging to main easier

### 3. Run Precheck Before Push

```powershell
npm run precheck
```

Fix any TypeScript or ESLint errors before pushing.

### 3. Push to Feature Branch

```powershell
git push origin feature/branch-name
```

This only pushes to the feature branch - `main` is not affected.

### 4. When Ready to Merge to Main

Use the merge script to merge the feature branch to main, create a tag, and push:

```powershell
npx tsx scripts/merge-feature.ts "feat: commit message" "0.15.0"
```

This script:
- Switches to main
- Merges the feature branch
- Creates a version tag
- Pushes main + tags to GitHub

---

## Standard Release Process

Follow these steps for every release to GitHub:

### 1. Update CHANGELOG.md

Add a new section at the top with:

- Version number and date (e.g., `## 0.11.3 - 2025-11-16`)
- **Main entry**: Feature name/title with GitHub commit link in format `([commit_hash](https://github.com/yuens1002/ecomm-ai-app/commit/{full_hash}))`
- **2-4 concise bullets**: High-level summary statements only - what was accomplished, not implementation details
- Keep it readable and valuable - avoid nitty-gritty technical details
- Group by category: Features, Bug Fixes, Dependencies, etc.

**Example:**
```markdown
## 0.15.0 - 2025-11-20

- **Voice Barista UI Foundation**: Session-based hero section with voice chat interface ([abc1234](https://github.com/yuens1002/ecomm-ai-app/commit/abc1234))
  - VoiceBarista component replaces hero for authenticated users
  - Voice AI platform research complete - selected VAPI
  - Conversation flow designed with 6 backend functions
```

### 2. Bump Version in package.json

Update the `version` field:

```json
"version": "0.11.3"
```

### 3. Commit Changes

```powershell
git add -A
git commit -m "feat: descriptive commit message"
```

### 4. Version Bump Commit

```powershell
git add package.json CHANGELOG.md
git commit -m "chore: bump version to 0.11.3"
```

### 5. Tag and Push

```powershell
git tag v0.11.3
git push origin main --tags
```

## One-Liner for Steps 4-5

```powershell
git add package.json CHANGELOG.md; git commit -m "chore: bump version to 0.11.3"; git tag v0.11.3; git push origin main --tags
```

## Version Numbering (Semantic Versioning)

Format: `MAJOR.MINOR.PATCH` (e.g., `0.11.3`)

- **MAJOR**: Breaking changes (e.g., `1.0.0`)
- **MINOR**: New features, backward compatible (e.g., `0.11.0` → `0.12.0`)
- **PATCH**: Bug fixes, minor changes (e.g., `0.11.2` → `0.11.3`)

Current project status: Pre-1.0 (0.x.x) - API may change

## Notes

- Always update CHANGELOG.md BEFORE bumping package.json
- Use descriptive commit messages following conventional commits
- Tags should match package.json version (with 'v' prefix)
- `--tags` flag pushes all tags, not just the new one
- Check GitHub Releases page after push to verify tag appears
