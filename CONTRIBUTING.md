# Contributing to Artisan Roast

First off, thanks for considering contributing to Artisan Roast! Whether you're fixing a typo, reporting a bug, or building a new feature - every contribution helps.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Style Guide](#style-guide)
- [Community](#community)

---

## Code of Conduct

This project follows our [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you agree to uphold a welcoming, inclusive environment for everyone.

**TL;DR:** Be kind. Be respectful. Assume good intentions.

---

## Getting Started

### Prerequisites

- Node.js 22+ and npm 10+
- Git
- A code editor (VS Code recommended)

### Local Setup

```bash

# Fork the repo on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/ecomm-ai-app.git
cd ecomm-ai-app

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Set up the database and seed data
npm run setup

# Start development server
npm run dev
```

See [SETUP.md](./SETUP.md) for detailed instructions including API keys setup.

---

## How to Contribute

### Reporting Bugs

Found a bug? Please [open an issue](https://github.com/yuens1002/ecomm-ai-app/issues/new) with:

- **Clear title** describing the problem
- **Steps to reproduce** the issue
- **Expected behavior** vs what actually happened
- **Screenshots** if applicable
- **Environment** (browser, OS, Node version)

### Suggesting Features

Have an idea? [Open a discussion](https://github.com/yuens1002/ecomm-ai-app/discussions) first to talk it through. This helps avoid duplicate work and ensures the feature fits the project direction.

### Quick Wins (Great for First-Timers)

Look for issues labeled [`good first issue`](https://github.com/yuens1002/ecomm-ai-app/labels/good%20first%20issue). These are specifically chosen to be approachable for new contributors.

Other ways to help:
- **Documentation** - Fix typos, clarify confusing sections, add examples
- **Accessibility** - Audit and improve a11y (keyboard nav, screen readers, ARIA)
- **Testing** - Add test coverage for untested code paths
- **Translation** - Help with i18n (coming soon)

### Code Contributions

1. Check [open issues](https://github.com/yuens1002/ecomm-ai-app/issues) for something to work on
2. Comment on the issue to claim it (prevents duplicate work)
3. Fork, branch, code, test, PR (details below)

---

## Development Workflow

### Branch Naming

```text
feature/add-inventory-alerts
fix/cart-quantity-bug
docs/update-setup-guide
refactor/simplify-menu-builder
```

### Running Tests

```bash

npm run test        # Watch mode
npm run test:ci     # Single run (CI mode)
```

### Code Quality Checks

```bash

npm run precheck    # TypeScript + ESLint (run before committing)
npm run typecheck   # TypeScript only
npm run lint        # ESLint only
```

### Database Changes

If your change requires schema modifications:

```text

# 1. Edit prisma/schema.prisma
# 2. Create migration
npx prisma migrate dev --name your-migration-name

# 3. Update seed data if needed (prisma/seed.ts)
```

---

## Pull Request Process

### Before Submitting

- [ ] Code follows the [style guide](#style-guide)
- [ ] All tests pass (`npm run test:ci`)
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Self-reviewed your own code
- [ ] Added tests for new functionality (if applicable)
- [ ] Updated documentation (if applicable)

### PR Template

When you open a PR, please include:

```markdown
## Summary
Brief description of what this PR does.

## Changes
- Change 1
- Change 2

## Testing
How did you test these changes?

## Screenshots
(If UI changes)

## Related Issues
Closes #123
```

### Review Process

1. A maintainer will review your PR
2. They may request changes - this is normal and collaborative
3. Once approved, a maintainer will merge
4. Your contribution will be in the next release!

---

## Style Guide

### TypeScript

- **Strict mode** - No `any` types (use `unknown` with type guards)
- **Explicit types** for function parameters and return values
- **Zod validation** for all external inputs (forms, API requests)

```typescript

// Good
function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}

// Avoid
function calculateTotal(items: any) {
  return items.reduce((sum: any, item: any) => sum + item.price * item.quantity, 0)
}
```

### React

- **Server Components by default** - Only use `"use client"` when necessary
- **Functional components** - No class components
- **Named exports** - Except for default page exports

```typescript

// Good
export function ProductCard({ product }: { product: Product }) {
  return <div>...</div>
}

// Avoid
export default class ProductCard extends React.Component { ... }
```

### File Naming

- **Files:** `kebab-case.ts` or `kebab-case.tsx`
- **Components:** `PascalCase.tsx` (matches export name)
- **Hooks:** `use-something.ts` or `useSomething.ts`

### Imports

Group imports in this order:

```typescript

// 1. External packages
import { useState } from 'react'
import { z } from 'zod'

// 2. Internal absolute imports
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'

// 3. Relative imports
import { ProductCard } from './ProductCard'
import type { Product } from './types'
```

### Comments

- Write self-documenting code (good names > comments)
- Comments explain **why**, not **what**
- Don't commit commented-out code

```tsx

// Good - explains why
// Skip validation for admin users to allow bulk operations
if (user.role === 'admin') return data

// Avoid - explains what (the code already says this)
// Check if user is admin
if (user.role === 'admin') return data
```

### Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```text
feat: add inventory low-stock alerts
fix: cart quantity not updating on mobile
docs: clarify Stripe webhook setup
refactor: simplify menu builder state
test: add coverage for checkout flow
chore: update dependencies
```

---

## Community

- **Questions?** [Open a discussion](https://github.com/yuens1002/ecomm-ai-app/discussions)
- **Found a security issue?** Email directly (don't open a public issue)
- **Want to chat?** Join our Discord (coming soon)

---

## Recognition

Contributors are recognized in:
- The GitHub contributors graph
- Release notes for significant contributions
- A future Contributors page on the site

---

Thanks for being part of Artisan Roast! ☕
