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

## Standard Release Process

Follow these steps for every release to GitHub:

### 1. Update CHANGELOG.md

Add a new section at the top with:

- Version number and date (e.g., `## 0.11.3 - 2025-11-16`)
- Bullet points for all new features, bug fixes, and changes
- Group by category: Features, Bug Fixes, Dependencies, etc.

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
