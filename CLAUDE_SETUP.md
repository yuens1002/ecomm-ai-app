# Claude Code Setup & Usage Guide

## What Was Configured

Your Claude Code setup now includes multi-agent workflows and auto-review capabilities optimized for your e-commerce project.

### Files Created/Modified

1. **[claude.md](claude.md)** - Main configuration file
   - Project context and architecture
   - Multi-agent workflow definitions
   - Auto-review checklists
   - Development patterns
   - Common commands

2. **[.clauderc](.clauderc)** - Advanced automation config
   - Agent behavior settings
   - Workflow automation rules
   - Quality gates
   - Integration settings

3. **[.vscode/settings.json](.vscode/settings.json)** - VS Code optimizations
   - Claude Code settings
   - Auto-save and formatting
   - TypeScript enhancements
   - File exclusions

---

## How Multi-Agent Workflows Work

### 1. Exploration Agent
**Triggers automatically when you ask:**
- "Where is X implemented?"
- "How does Y work?"
- "Show me all files related to Z"
- "What's the structure of..."

**Example:**
```
You: "Where are product mutations handled?"
Claude: [Uses Exploration Agent to search codebase]
Claude: "Product mutations are in app/admin/(product-menu)/hooks/useProductMenuMutations.ts:45"
```

### 2. Planning Agent
**Triggers automatically for:**
- New feature requests
- Refactoring tasks
- Architectural changes
- Multi-file modifications

**Example:**
```
You: "Add email notifications for orders"
Claude: [Enters Plan Mode]
Claude: "I'll create a plan for email notifications. Let me explore..."
[Presents plan for approval]
You: [Approve or provide feedback]
Claude: [Implements based on approved plan]
```

### 3. Review Agent
**Triggers automatically before:**
- Creating commits
- Creating pull requests
- Major code changes

**Reviews for:**
- Type safety (no `any` types)
- Security (input validation, auth checks)
- Performance (query optimization, re-renders)
- Accessibility (semantic HTML, ARIA)
- Testing (coverage for critical paths)

**Example:**
```
You: "Create a commit for this feature"
Claude: [Runs auto-review]
Claude: "Review complete. Found 2 issues:
1. Missing Zod validation in server action
2. Client component should be server component
Let me fix these..."
[Fixes issues]
[Creates commit]
```

### 4. Testing Agent
**Triggers automatically after:**
- Code implementations
- Bug fixes
- Refactoring

**Runs:**
- Unit tests
- Type checking
- Linting
- Build verification

---

## How to Use Claude Code Effectively

### For New Features

**You say:**
```
"Add a favorites feature where users can save products"
```

**What happens:**
1. Planning Agent activates
2. Explores existing patterns (products, user data)
3. Proposes architecture (schema changes, server actions, UI)
4. Waits for your approval
5. Implements with tests
6. Review Agent checks quality
7. Runs tests
8. Creates commit with proper message

### For Bug Fixes

**You say:**
```
"Fix the cart total calculation bug"
```

**What happens:**
1. Exploration Agent finds cart logic
2. Identifies the issue
3. Writes a failing test
4. Fixes the bug
5. Verifies test passes
6. Review Agent checks changes
7. Creates commit

### For Code Understanding

**You say:**
```
"Explain how the menu builder state management works"
```

**What happens:**
1. Exploration Agent finds relevant files
2. Reads implementation
3. Explains architecture with file references
4. Can drill deeper if you ask follow-up questions

### For Refactoring

**You say:**
```
"Refactor the action bar config to be more type-safe"
```

**What happens:**
1. Exploration Agent understands current implementation
2. Planning Agent proposes refactoring strategy
3. Ensures tests exist
4. Refactors incrementally
5. Verifies tests still pass
6. Review Agent validates changes

---

## Auto-Review Features

### What Gets Reviewed

#### ✅ Type Safety
- No `any` types
- All server actions have Zod validation
- Prisma types used correctly
- Proper TypeScript strictness

#### ✅ Next.js Patterns
- Server Components by default
- Server Actions in correct locations
- Proper error handling
- Client-side rendering only when needed

#### ✅ Security
- Input validation with Zod
- Authentication checks
- No secrets in code
- CSRF protection

#### ✅ Performance
- Optimized database queries
- No N+1 query problems
- Proper React optimization
- Image optimization

#### ✅ Accessibility
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Screen reader support

### Review Severity Levels

- **Error:** Blocks commit (type errors, security issues)
- **Warning:** Suggests fix (performance, accessibility)
- **Info:** Best practice suggestions

---

## Quick Commands Reference

### Ask Claude To...

**Explore Codebase:**
- "Show me the file structure for menu builder"
- "Where is authentication handled?"
- "Find all Stripe webhook handlers"
- "How does AI recommendation work?"

**Implement Features:**
- "Add [feature description]"
- "Implement [specific functionality]"
- "Create a new [component/hook/action]"

**Fix Issues:**
- "Fix the [bug description]"
- "Debug why [something isn't working]"
- "The [feature] is broken, help fix it"

**Review Code:**
- "Review my recent changes"
- "Check if this code is secure"
- "Is this component optimized?"
- "Review before commit"

**Refactor:**
- "Refactor [file/component] to [improvement]"
- "Improve the structure of [code]"
- "Make this more type-safe"

**Testing:**
- "Run the tests"
- "Add tests for [feature]"
- "Fix failing tests"
- "Increase test coverage for [code]"

**Git Operations:**
- "Create a commit"
- "Create a PR for this branch"
- "Show me what changed"
- "Review git status"

---

## Keyboard Shortcuts (Recommended Setup)

Open VS Code Keyboard Shortcuts (`Ctrl+K Ctrl+S`) and set:

| Action | Recommended Shortcut |
|--------|---------------------|
| Open Claude Code | `Ctrl+Shift+L` |
| Send Selection to Claude | `Ctrl+Shift+K` |
| New Conversation | `Ctrl+Alt+C` |
| Toggle Panel | `Ctrl+J` |

---

## Best Practices

### 1. Be Specific
❌ "Make this better"
✅ "Refactor this to use Zod validation and add error handling"

### 2. Provide Context
❌ "Fix the bug"
✅ "The cart total is showing $0 when adding subscription products. Fix the calculation in the cart reducer."

### 3. Use Selection
- Highlight code in editor
- Ask Claude about it
- Claude sees your selection automatically

### 4. Review Suggestions
- Claude will suggest alternatives
- Ask "why" if you want reasoning
- Can request different approaches

### 5. Iterate
- Start with exploration
- Then planning
- Then implementation
- Review and refine

---

## Workflow Examples

### Workflow 1: Add New Feature
```
You: "Add a product review feature"

[Planning Phase]
Claude: "I'll plan the product review feature. Let me explore..."
Claude: [Presents plan with schema changes, server actions, UI components]
You: "Looks good, but use a 1-5 star rating instead of 1-10"
Claude: [Updates plan]

[Implementation Phase]
Claude: [Creates migration, server actions, components, tests]

[Review Phase]
Claude: [Auto-reviews code]
Claude: "Implementation complete. All checks passed. Ready to commit?"
You: "Yes"
Claude: [Creates commit with conventional format]
```

### Workflow 2: Debug Production Issue
```
You: "Users report checkout failing with Stripe webhooks"

[Investigation]
Claude: [Explores webhook handlers]
Claude: "Found the issue in app/api/webhooks/stripe/route.ts:67"
Claude: "The signature verification is failing because..."

[Fix]
Claude: [Implements fix with proper error handling]
Claude: [Adds test to prevent regression]

[Verification]
Claude: [Runs tests]
Claude: "Fix verified. Creating commit..."
```

### Workflow 3: Refactor for Performance
```
You: "The menu builder is slow when loading many products"

[Analysis]
Claude: [Profiles the code]
Claude: "Found N+1 query in useProductMenuData hook"

[Planning]
Claude: "I'll optimize by:
1. Adding eager loading to Prisma query
2. Implementing pagination
3. Adding loading states"

[Implementation]
Claude: [Refactors with optimizations]
Claude: [Tests before/after performance]
Claude: "Load time reduced from 3s to 300ms"
```

---

## Troubleshooting

### Claude doesn't understand project context
**Solution:** Claude reads `claude.md` automatically. If context is missing, update that file.

### Auto-review is too strict
**Solution:** Adjust severity in `.clauderc` under `auto_review.checks`

### Agent not activating automatically
**Solution:** Check `.clauderc` under `agents.{agent_name}.auto_enable`

### Tests failing after changes
**Solution:** Ask "Run tests and fix any failures"

### Want different commit message
**Solution:** "Create commit with message: [your message]"

---

## Advanced Features

### Custom Workflows
Edit `.clauderc` to add custom command sequences:

```yaml
commands:
  my_workflow:
    description: "My custom workflow"
    steps:
      - "npm run precheck"
      - "npm run test:ci"
      - "git add ."
```

Then: "Run my_workflow"

### Context Sharing
Claude can share context between conversations. Reference previous work:
"Continue with the feature we discussed earlier"

### Parallel Agents
For complex tasks: "Run exploration and testing agents in parallel"

---

## Configuration Files Reference

### claude.md
- **Purpose:** Main project context
- **Update when:** Architecture changes, new patterns, important decisions
- **Sections:** Project overview, patterns, workflows, agent configs

### .clauderc
- **Purpose:** Automation and behavior settings
- **Update when:** Want to change automation rules, quality gates, integrations
- **Sections:** Agent settings, workflows, quality rules, integrations

### .vscode/settings.json
- **Purpose:** VS Code and Claude Code IDE integration
- **Update when:** Want different editor behavior or tool settings
- **Sections:** Editor, language, Claude Code, file management

---

## Next Steps

### 1. Test the Setup
Try asking Claude:
```
"Explain the menu builder architecture"
```

This will test if the Exploration Agent works correctly.

### 2. Try a Small Feature
```
"Add a console log to track when products are added to cart"
```

This tests Planning → Implementation → Review workflow.

### 3. Create a Commit
```
"Review my changes and create a commit"
```

This tests the Review Agent and git integration.

### 4. Customize Further
- Adjust `.clauderc` rules to your preferences
- Add project-specific patterns to `claude.md`
- Set up keyboard shortcuts

---

## Getting Help

### In this session:
- "How do I [task]?"
- "Explain [concept]"
- "Show me an example of [pattern]"

### Documentation:
- Main config: [claude.md](claude.md)
- Automation: [.clauderc](.clauderc)
- Project docs: [docs/](docs/)

### Feedback:
- Report issues: https://github.com/anthropics/claude-code/issues

---

**Setup Complete!** 🎉

You now have:
- ✅ Multi-agent workflows configured
- ✅ Auto-review enabled
- ✅ Project context optimized
- ✅ VS Code integration enhanced
- ✅ Custom commands defined

Try asking me to help with your next feature or bug fix!

---

*Last Updated: 2026-01-10*
*Created by: Claude Sonnet 4.5*
