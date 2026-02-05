---
name: ui-verify
description: Visual UI verification workflow with responsive screenshot comparison
disable-model-invocation: true
user-invocable: true
allowed-tools: Bash, Read, Write, Glob, Grep
argument-hint: [component-name] [--before|--after|--compare]
---

# UI Verification Skill

This skill provides a systematic approach to verify UI changes across responsive breakpoints.

## Arguments

- `$1` - Component or feature name being tested
- `--before` - Take "before" screenshots (run before making changes)
- `--after` - Take "after" screenshots (run after making changes)
- `--compare` - View and compare before/after screenshots
- `--clean` - Remove screenshot files

## Workflow Overview

### Standard Verification Loop

```text
1. /ui-verify [feature] --before     # Capture current state
2. Make code changes                  # Implement the fix
3. /ui-verify [feature] --after      # Capture new state
4. /ui-verify [feature] --compare    # Review differences
5. Iterate if needed                  # Fix issues, repeat 3-4
6. Commit when all ACs pass          # Create PR
```

## Screenshot Script

The project includes a screenshot script at `scripts/take-responsive-screenshots.js`.

### Usage

```bash
# Take before screenshots
node scripts/take-responsive-screenshots.js before

# Take after screenshots
node scripts/take-responsive-screenshots.js after
```

### Breakpoints Captured

| Name | Width | Height | Description |
|------|-------|--------|-------------|
| mobile | 375px | 812px | iPhone X |
| tablet | 768px | 1024px | iPad |
| desktop | 1440px | 900px | Desktop |

### Screenshots Location

Screenshots are saved to `.screenshots/` directory (gitignored):

```text
.screenshots/
├── before-mobile-footer.png
├── before-mobile-mobile-menu.png
├── before-tablet-footer.png
├── before-tablet-mobile-menu.png
├── before-desktop-footer.png
├── before-desktop-nav-dropdown.png
├── after-mobile-footer.png
├── after-mobile-mobile-menu.png
├── after-tablet-footer.png
├── after-tablet-mobile-menu.png
├── after-desktop-footer.png
└── after-desktop-nav-dropdown.png
```

## Verification Checklist

When comparing screenshots, verify:

### Layout

- [ ] Elements maintain correct reading order (left-to-right, top-to-bottom)
- [ ] Column count changes correctly at breakpoints
- [ ] No unexpected overflow or wrapping

### Spacing

- [ ] Consistent horizontal gaps between items
- [ ] Consistent vertical gaps between items
- [ ] Padding matches design requirements

### Visual Consistency

- [ ] Font sizes remain appropriate at each breakpoint
- [ ] Interactive elements remain accessible (touch targets)
- [ ] No text truncation that breaks meaning

## Extending the Screenshot Script

To capture additional pages or components, modify `scripts/take-responsive-screenshots.js`:

```javascript
// Add new page captures
await page.goto(`${BASE_URL}/your-page`, { waitUntil: 'networkidle2' });
await page.screenshot({
  path: path.join(OUTPUT_DIR, `${prefix}-${bp.name}-your-component.png`),
  fullPage: false,
});
```

## Prerequisites

- Dev server running on localhost:3000
- Puppeteer installed: `npm install -D puppeteer`

## Common Issues

### Screenshots show blank or loading state

Increase wait times in the script:

```javascript
await new Promise(r => setTimeout(r, 2000)); // Increase from 1000
```

### Menu not opening

The script uses JavaScript click fallbacks. If still failing, check:

- Menu button selector in script
- Any SSR hydration delays

### Inconsistent screenshots

Ensure:

- Dev server is freshly started
- No dynamic content affecting layout
- Browser cache cleared

## Example: Verifying Reading Order Fix

```text
# 1. Capture current broken state
node scripts/take-responsive-screenshots.js before

# 2. Make fix to CategoryMenuColumns.tsx
# (Remove JS column distribution, use CSS Grid flow)

# 3. Verify types compile
npm run typecheck

# 4. Capture fixed state
node scripts/take-responsive-screenshots.js after

# 5. Compare screenshots
# Read both and verify:
# - Labels flow left-to-right at 3-col
# - Labels flow left-to-right at 2-col
# - Single column maintains source order

# 6. If issues found, iterate steps 2-5
# 7. Commit and create PR
```
