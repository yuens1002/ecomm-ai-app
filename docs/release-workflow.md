# Release Workflow

## Documentation Strategy

Our release process separates **public-facing** information from **internal implementation** details:

| Document           | Audience        | Content          | Details                                    |
| ------------------ | --------------- | ---------------- | ------------------------------------------ |
| **Commit Message** | Developers      | Single line      | Concise "what changed"                     |
| **CHANGELOG.md**   | Users/Employers | Feature summary  | Bold title + user-visible features         |
| **Git Tag**        | Developers      | Brief summary    | 2-3 sentences + link to internal docs      |
| **Internal Docs**  | Team            | Complete details | Schema, migrations, auth, design decisions |

**Key Principle**: Keep public docs focused on value delivered; save technical details for internal documentation.

---

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

When working on a feature branch (e.g., `feature/social-links-management`):

### 1. Make Changes and Commit

```powershell
git add -A
git commit -m "feat: concise commit message"
```

**Commit Message Guidelines:**

- Keep commit messages **concise** - one line describing what changed
- Use conventional commit prefixes: `feat:`, `fix:`, `chore:`, `docs:`
- Keep under 72 characters
- Describe **what** changed, not **how**

You can make multiple commits on the feature branch - each is isolated to the branch.

### 2. Create Internal Documentation

**When**: After completing a substantial feature

**Location**: `docs/releases/v{X.X.X}-{feature-name}.md`

**Template**: Use `docs/releases/TEMPLATE.md` as starting point

**Includes**:

- Database schema changes & migration names
- API endpoint specifications
- File structure and components
- Authentication/authorization implementation
- Design decisions and tradeoffs
- Admin credentials (if applicable)
- Testing considerations
- Future enhancement ideas

**Example**: `docs/releases/v0.22.0-mega-footer.md`

**Why**: This is your internal reference for understanding how the feature was built. Include everything developers need.

### 3. Update CHANGELOG.md

**Purpose**: Public-facing summary for users/employers

**Format**:

```markdown
## X.X.X - YYYY-MM-DD

- **Feature Title**: Brief user-facing description
  - User-visible feature 1
  - User-visible feature 2
  - User-visible feature 3
```

**Example**:

```markdown
## 0.22.0 - 2025-11-23

- **Mega Footer with Social Links & Newsletter**: Admin-managed footer with social media links, newsletter signup, and dynamic category navigation
  - Social media link management in admin panel
  - Newsletter subscription with email validation
  - Responsive mega footer with category groups
```

**Guidelines**:

- Bold title with brief description
- Bullet points for user-visible features only
- **NO** technical details (migrations, file paths, code changes)
- Focus on **value delivered** to end users
- Keep it professional and concise

### 4. Run Precheck Before Push

```powershell
npm run precheck
```

Fix any TypeScript or ESLint errors before pushing.

### 5. Push to Feature Branch

```powershell
git push origin feature/branch-name
```

This only pushes to the feature branch - `main` is not affected.

### 6. Create Annotated Tag

**Purpose**: Developer-facing summary with link to internal docs

**Format**:

```powershell
git tag -a v{X.X.X} -m "Feature Title

Brief 2-3 sentence summary of what was accomplished.

Commit: {short_hash}
See: docs/releases/v{X.X.X}-{feature-name}.md for implementation details"
```

**Example**:

```powershell
git tag -a v0.22.0 -m "Mega Footer with Social Links & Newsletter

Complete footer redesign with admin-managed social media links,
newsletter subscription, and dynamic category navigation.

Commit: b9d2fb1
See: docs/releases/v0.22.0-mega-footer.md for implementation details"
```

**Guidelines**:

- Brief summary (2-3 sentences)
- Include commit hash
- Link to internal docs for technical details
- Keep it professional but minimal

### 7. Push Everything

```powershell
git push origin feature/branch-name
git push origin v{X.X.X}
```

Or use one line:

```powershell
git push origin feature/branch-name; git push origin v{X.X.X}
```

### 8. When Ready to Merge to Main

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

## Standard Release Process (Main Branch)

Follow these steps when releasing to `main`:

### 1. Create Internal Documentation

**Location**: `docs/releases/v{X.X.X}-{feature-name}.md`

Use the template and include all technical implementation details.

### 2. Update CHANGELOG.md

Add a new section at the top with **user-facing summary only**:

```markdown
## X.X.X - YYYY-MM-DD

- **Feature Title**: Brief description
  - User-visible feature 1
  - User-visible feature 2
```

**Guidelines**:

- **NO** technical details (schema, migrations, file paths)
- Focus on value delivered to users
- Group by category if needed: Features, Bug Fixes, etc.

### 3. Bump Version in package.json

Update the `version` field:

```json
"version": "0.22.0"
```

### 4. Commit Changes

```powershell
git add -A
git commit -m "feat: concise commit message"
```

### 5. Version Bump Commit

```powershell
git add package.json CHANGELOG.md
git commit -m "chore: bump version to 0.22.0"
```

### 6. Create Annotated Tag

```powershell
git tag -a v0.22.0 -m "Feature Title

Brief 2-3 sentence summary.

Commit: {hash}
See: docs/releases/v0.22.0-{feature}.md"
```

### 7. Push to Main with Tags

```powershell
git push origin main --tags
```

## Quick Release One-Liner

After updating internal docs, CHANGELOG.md, and package.json:

```powershell
git add package.json CHANGELOG.md; git commit -m "chore: bump version to 0.22.0"; git tag -a v0.22.0 -m "Feature Title`n`nBrief summary.`n`nCommit: {hash}`nSee: docs/releases/v0.22.0-{feature}.md"; git push origin main --tags
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
