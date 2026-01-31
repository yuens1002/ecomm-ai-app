# Code Quality Standards

## Automatic Enforcement

This project uses automated tools to catch common mistakes **before** they're committed:

### ESLint Rules (Real-time in VS Code)

The following rules are configured as **errors** (not warnings) and will show red squiggles in your editor:

1. **`@typescript-eslint/no-explicit-any`** - NEVER use `any` type

   ```typescript
   // ❌ BAD
   function process(data: any) { ... }

   // ✅ GOOD
   function process(data: Record<string, unknown>) { ... }
   function process(data: { id: string; name: string }) { ... }
```

2. **`react-hooks/set-state-in-effect`** - NEVER call setState directly in useEffect

   ```typescript
   // ❌ BAD
   useEffect(() => {
     setState(newValue);
   }, [dependency]);

   // ✅ GOOD - Option 1: Conditional during render
   if (condition !== lastCondition) {
     setLastCondition(condition);
     setState(newValue);
   }

   // ✅ GOOD - Option 2: setTimeout wrapper for async updates
   useEffect(() => {
     const timer = setTimeout(() => setState(newValue), 0);
     return () => clearTimeout(timer);
   }, [dependency]);
```

3. **`react-hooks/static-components`** - NEVER create components during render

   ```typescript
   // ❌ BAD
   function MyComponent() {
     const IconComponent = getIcon(); // Component created each render
     return <IconComponent />;
   }

   // ✅ GOOD
   function MyComponent() {
     const IconToRender = getIcon(); // Reference to existing component
     return <IconToRender />;
   }
```

4. **`react-hooks/exhaustive-deps`** - ALWAYS include all dependencies

   ```typescript
   // ❌ BAD
   useEffect(() => {
     doSomething(value);
   }, []); // Missing 'value' dependency

   // ✅ GOOD
   useEffect(() => {
     doSomething(value);
   }, [value]);
```

5. **`@typescript-eslint/no-unused-vars`** - Remove unused imports/variables

   ```typescript
   // ❌ BAD
   import { Button, Card } from "@/components/ui"; // Card unused

   // ✅ GOOD
   import { Button } from "@/components/ui";

   // ✅ GOOD - Prefix with _ if intentionally unused
   const [_unusedState, setUsedState] = useState();
```

### Pre-commit Hook

Git will automatically run these checks before each commit:

1. **TypeScript compilation** (`npm run typecheck`)
2. **ESLint** (`npm run lint`)

If either fails, the commit is blocked until issues are fixed.

## Setup Instructions

### 1. Install Husky (if not already installed)

```bash

npm install --save-dev husky
npx husky init
```

### 2. Make pre-commit hook executable (Linux/Mac)

```text

chmod +x .husky/pre-commit
```

### 3. Enable ESLint in VS Code

Install the ESLint extension:

- Open Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
- Search for "ESLint"
- Install "ESLint" by Microsoft

Configure VS Code to auto-fix on save (`.vscode/settings.json`):

```json

{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ]
}
```

## Common Patterns

### Replacing `any` Types

| Scenario                 | Instead of `any`   | Use                                                |
| ------------------------ | ------------------ | -------------------------------------------------- |
| Unknown object structure | `data: any`        | `data: Record<string, unknown>`                    |
| Unknown array            | `items: any[]`     | `items: unknown[]`                                 |
| Prisma JSON field        | `field: any`       | `field: JsonValue` (from Prisma)                   |
| Event handlers           | `(e: any) => void` | `(e: React.ChangeEvent<HTMLInputElement>) => void` |
| API responses            | `response: any`    | Create an interface with expected fields           |

### React Hooks Best Practices

**When to use `useEffect` dependencies:**

- **Always** include values from props/state used inside the effect
- **Never** include functions that are recreated each render (wrap in `useCallback` first)
- **Prefix** with `eslint-disable-next-line` only as last resort with explanation

**Avoiding setState in effects:**

- Most "setState in effect" can be replaced with conditional setState during render
- Use `useMemo` for derived state instead of effect + setState
- Only use effects for external synchronization (subscriptions, DOM manipulation, etc.)

## Manual Checks

If you need to bypass the pre-commit hook (emergency only):

```bash

git commit --no-verify -m "message"
```

**⚠️ WARNING:** Only use `--no-verify` for:

- Emergency hotfixes that will be cleaned up immediately
- Work-in-progress commits on feature branches
- Never use on main/integration branches

## Benefits

- **Catch errors at write-time** - Red squiggles in VS Code before you even save
- **Prevent bad code from being committed** - Pre-commit hook catches what you miss
- **Consistent code quality** - Entire team follows same standards
- **Faster code reviews** - No need to comment on these common issues
- **Less time debugging** - Common issues caught before they cause problems

## Troubleshooting

**"ESLint not working in VS Code"**

1. Restart VS Code
2. Check ESLint extension is installed and enabled
3. Check workspace has `eslint.config.mjs`
4. Run "ESLint: Restart ESLint Server" from command palette

**"Pre-commit hook not running"**

1. Check `.husky/pre-commit` exists
2. Make it executable: `chmod +x .husky/pre-commit` (Linux/Mac)
3. Verify Husky is installed: `npx husky`

**"Too many errors after enabling strict rules"**

- Fix them incrementally by file/directory
- Create a cleanup branch
- Or temporarily set rules to "warn" while cleaning up, then change back to "error"

---

**Last Updated**: December 5, 2025  
**Maintained by**: Development Team
