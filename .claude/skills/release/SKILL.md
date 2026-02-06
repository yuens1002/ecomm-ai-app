---
name: release
description: Git release workflow for creating patches and releases with proper versioning
---

# Release Workflow Skill

This skill guides you through the proper release workflow for this project, ensuring all versioning artifacts stay in sync.

## Arguments

- `$1` - Version bump type: `patch` (default), `minor`, or `major`
- `--github-release` - Also create a GitHub Release (triggers upgrade notice in app)
- `--docs-only` - Skip version changes (for documentation-only PRs)

## Workflow Overview

The release workflow depends on the current git state:

### Scenario A: Changes on a Feature Branch (Pre-PR)

If on a feature branch with uncommitted or committed changes:

1. **Update CHANGELOG.md** with the next version and changes
2. **Update package.json** with the next version (required for Vercel)
3. **Commit** the version changes
4. **Push** and create PR
5. After PR merges, run `/release` again to create the tag

### Scenario B: On Main Branch After Merge (Tag Creation)

If on main branch with no uncommitted changes:

1. **Verify** package.json matches the version to tag
2. If not, create a quick PR to sync package.json
3. **Create git tag** pointing to current HEAD
4. **Push tag** to origin
5. Optionally **create GitHub Release** (if `--github-release` specified)

### Scenario C: Docs-Only Changes (No Version Needed)

If `--docs-only` is specified:

1. Skip all version-related steps
2. Just commit and create PR
3. CI will skip build for docs-only changes

## Step-by-Step Instructions

### Step 1: Determine Current State

```bash
# Check current branch
git rev-parse --abbrev-ref HEAD

# Check for uncommitted changes
git status --porcelain

# Get latest tag
git tag -l v* --sort=-version:refname | head -1

# Get package.json version
grep '"version"' package.json
```

### Step 2: Calculate Next Version

Based on the bump type ($ARGUMENTS or default to patch):

- **patch**: 0.82.5 → 0.82.6
- **minor**: 0.82.5 → 0.83.0
- **major**: 0.82.5 → 1.0.0

### Step 3: Pre-PR Checklist (if on feature branch)

Before creating the PR, ensure:

1. [ ] CHANGELOG.md updated with new version section
2. [ ] package.json version updated to match
3. [ ] Changes committed with conventional commit message
4. [ ] Branch pushed to origin

### Step 4: Create Tag (if on main after merge)

```bash
# Run the release script
npm run release:patch -- -y --push --sync-package

# Or for minor with GitHub release
npm run release:minor -- -y --push --sync-package --github-release
```

### Step 5: Verify Release

After release:

1. Check GitHub for new tag: `https://github.com/yuens1002/ecomm-ai-app/tags`
2. Verify Vercel deployment triggered
3. If GitHub Release created, check upgrade notice in app

## Common Commands

```bash
# Quick patch (most common)
npm run release:patch -- -y --push --sync-package

# Minor release with announcement
npm run release:minor -- -y --push --sync-package --github-release

# Check what would be released
npm run release:patch
```

## Important Notes

- **Vercel requires package.json** to match the tag version (git tags unavailable in build)
- **Branch protection** prevents pushing directly to main
- **GitHub Releases** trigger the upgrade notice banner in the app
- **Docs-only PRs** (only .md files) automatically skip CI build

## Troubleshooting

### Package.json out of sync after merge

The release script will detect this and offer to create a sync PR:

```bash
npm run release:patch -- --sync-package
```

### CI failing on version PR

Wait for checks or use admin merge if urgent:

```bash
gh pr merge --admin --squash --delete-branch
```

### Need to undo a tag

```bash
git tag -d v0.82.6
git push origin :refs/tags/v0.82.6
```
