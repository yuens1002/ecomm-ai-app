# Plan: Counter UX Overhaul — feat/counter-ux

## Context

Phase 2 established Smart Search as the primary AI shopping feature. This iteration matures it into a coherent product:
- The customer-facing panel gets a real name ("Counter") and a mobile-first UX that matches the at-the-counter conversation framing
- Product cards become two-liner info cards tuned to product type
- All UI text (greeting, placeholder) is driven by the owner's voice surfaces, not hardcoded copy
- The admin consolidates Smart Search into the AI Settings page, retiring deprecated feature toggles
- Five bugs fixed: settings nav active state, mobile height restoration, loading animation, mobile nav label, dev CORS

Branch: `feat/counter-ux` (built on top of `feat/phase2-voice-cadence` — Phase 2 commits included)

---

## Cluster 1: Counter Panel Core

### 1a. Rename title
- `ChatPanel.tsx:494` — change `"Smart Search Assistant"` → `"Counter"`
- `ChatPanel.tsx:497` — update sr-only description to something descriptive: e.g. `"Chat about our products and get personalized recommendations"`
- `SiteHeader.tsx:289,301` — mobile nav label `"Search"` → `"Counter"`

### 1b. Mobile drawer width (direction unchanged)
The drawer already slides from the correct side at all breakpoints — **only the width changes on mobile (xs–sm)**.
- `DrawerContent` className: change `w-[85vw]` → `w-full` for xs/sm, keep `sm:w-[min(25vw,360px)]` for desktop
- Direction stays `"right"` — no direction prop changes needed

### 1c. Mobile viewport / keyboard height fixes
Port from `ChatBarista.tsx:60–99`:
- Add `visualViewport` resize + scroll listeners when panel is open
- Track `{ height, offsetTop }` in state
- Apply `height` as inline style on the panel container (overrides CSS)
- Auto-scroll messages to bottom on viewport change (keyboard events)
- Fixes both keyboard-open push-up AND keyboard-retract height restoration

### 1d. Loading animation fix
`app/globals.css` — `waiting-dots` animation cycles 1→2→3→4→5 dots.
Fix: start the steps animation from 0 (empty) by adjusting the `@keyframes` or step count so initial state is 0 dots.

---

## Cluster 2: Product Cards

### 2a. Add product fields to search response
`app/api/search/route.ts` — Prisma `findMany` select:
- Add `roastLevel: true` to top-level product select
- Add `tastingNotes: true` to top-level product select  
- Add `type: true` to top-level product select (COFFEE vs MERCH)
- Add `description: true` (truncated on client for merch secondary line)
- Keep `take: 50` → change to `take: 7` (hard cap)

Add to `SearchProduct` type in types file.

### 2b. Product card two-liner
`ChatPanel.tsx:405–432` — `ProductCard` component:
- Coffee (`product.type === "COFFEE"` or `product.roastLevel`):
  - Line 1: `product.name`
  - Line 2: `{roastLevel} — {tastingNotes}` (truncated, muted text)
- Merch (`product.type === "MERCH"` or no roastLevel):
  - Line 1: `product.name`
  - Line 2: `product.description` (truncated ~60 chars, muted text)
- Keep image (40×40)
- **Remove price** — this is a conversation, not a sales prompt

### 2c. Click product → close + navigate
`ChatPanel.tsx:408` — product card is currently a `<Link>`. Wrap with:
```tsx
const closePanel = useChatPanelStore((s) => s.close);
// onClick: closePanel()
```
Keep `href` for navigation — `close()` sets `isOpen: false`, then Link navigates normally.

---

## Cluster 3: Voice Surfaces — Placeholder + Defaults

### 3a. Add `placeholder` to VoiceSurfaces
`lib/ai/voice-surfaces.ts`:
- Add `placeholder: string` to `VoiceSurfaces` interface
- Add default to `DEFAULT_VOICE_SURFACES`: e.g. `"What are you after today?"`

`lib/ai/voice-surfaces.server.ts`:
- Add `placeholder` to the JSON schema in `generateVoiceSurfaces` prompt:
  `"placeholder": "8–12 words, question or invitation in the owner's voice, for the chat input field"`

### 3b. Load placeholder in ChatPanel
`ChatPanel.tsx:246` — replace hardcoded `placeholder="Ask about our coffee…"` with:
```tsx
placeholder={voiceSurfaces.placeholder}
```
Surfaces are already loaded via `loadSurfaces()` on panel open (line 121–123).

### 3c. Update DEFAULT_VOICE_SURFACES greeting tone
`lib/ai/voice-surfaces.ts:34–46` — update `"greeting.home"` default:
- Remove "I'm here to help you find the perfect coffee" (search language)
- Use conversational default: e.g. `"What are you in the mood for today?"`

---

## Cluster 4: AI Prompt Tuning

### 4a. Acknowledgment tone
`app/api/search/route.ts` — `buildExtractionPrompt()` (lines 158–190):
- Change acknowledgment instruction from:
  `"Use service verbs: 'let me grab', 'try this', 'you'll love', 'I'd pour you', 'pick out', 'pull a'"`
- To:
  `"Sound like you're at the counter sharing an opinion: 'I'd go with', 'I'd say try', 'personally I'd', 'if it were me'. No physical action verbs ('grab', 'pour', 'pick out', 'pull'). One short sentence."`

Same update to system prompt role section (lines 131–132).

### 4b. Follow-up redundancy
`buildExtractionPrompt()` — strengthen follow-up instruction:
- Add: `"NEVER ask about a dimension the customer already mentioned in their query. If they said 'dark', never offer roast-level chips. If they mentioned brew method, skip brew-method chips."`

---

## Cluster 5: Admin AI Settings Restructure

### 5a. Move Smart Search section into AI settings page
`app/admin/settings/ai/page.tsx`:
- Remove "AI Chat (Barista)" toggle block (lines 317–341)
- Remove "Coffee Recommender" toggle block (lines 343–367)
- Remove "About Page Assistant" toggle block (lines 369–393)
- Remove "Feature Toggles" section heading (lines 313–316) — no longer needed with deprecated toggles gone
- Add Smart Search section after Provider Configuration:
  - Section title: "Smart Search" (2 words, no "Assistant")
  - Description: 2–3 sentences, admin-appropriate, shorter than current
  - Enable toggle: title left, Switch right (flex row justify-between)
  - Voice Examples sub-section — **use Store Description textarea pattern** (see below)
  - No "Update how AI sounds" button

The Smart Search section state + API calls can stay on the existing `/api/admin/settings/ai-search` endpoint — no backend changes needed.

**Voice Examples textarea UI pattern** (matches admin product edit page auto-save indicator):

- Each Q&A answer textarea shows a char count (e.g. `"45/280"`) using `FormInputField` from `components/ui/forms/FormInputField.tsx`
- **Auto-saves** on blur (no explicit Save button) — triggers POST to `/api/admin/settings/ai-search` with `voiceExamples`, which runs `generateVoiceSurfaces` in the background
- **Status indicator row** (reference: product edit page screenshot — undo ↩ · redo ↪ · ● Saved):
  - Left: `"Reset to defaults"` ghost button — resets all textareas to `DEFAULT_VOICE_EXAMPLES` answers and marks dirty
  - Right: `● Saved` (green dot) or `● Saving…` (amber dot, pulsing) status indicator
  - No explicit Save button — status dot IS the feedback mechanism
- Implementation: custom state management (not a direct `SettingsField` wrapper, since we're saving 5 fields atomically), but reuse `FormInputField` + `FormHeading` for individual textarea rendering and the status dot display

### 5b. Remove AISearchSettingsSection from Storefront
`app/admin/settings/storefront/page.tsx`:
- Remove `AISearchSettingsSection` import and `{aiConfigured && <AISearchSettingsSection />}` render
- Remove `isAIConfigured()` check if no longer needed

`app/admin/settings/storefront/_components/AISearchSettingsSection.tsx`:
- Delete file (entire component moves to AI settings page as inline JSX or extracted component)

### 5c. Restore original Q&A defaults
`lib/ai/voice-examples.ts` — verify `DEFAULT_VOICE_EXAMPLES` matches the verbose originals from commit `24a658b` (they should already be correct in code — the DB test fixtures are a separate concern).
- No code change needed if already correct; just confirm.
- "Reset to defaults" button (added in 5a) uses `DEFAULT_VOICE_EXAMPLES` as its reset target.

---

## Voice Personification Pipeline

**How owner Q&As tune AI behavior — two paths:**

```
Owner saves Q&A answers  (stored as ai_voice_examples — NEVER overwritten by surfaces generation)
        │
        ├──► generateVoiceSurfaces(examples)                 [triggered on Q&A save]
        │         └── AI reads Q&As as demonstrations
        │              └── generates greeting/placeholder/waiting/etc IN owner's tone
        │                   └── stored separately as ai_voice_surfaces → rendered in ChatPanel
        │
        └──► buildSystemPrompt(voiceExamples)                [called on every search request]
                  └── Q&A pairs passed as few-shot examples:
                       "Customer: '...'\nYou: '...'" × 5
                       └── AI mirrors the tone/vocabulary/rhythm from those examples
                            └── every search response sounds like the owner at the counter
```

**DB separation:** `ai_voice_examples` (the owner's Q&A answers) and `ai_voice_surfaces` (the generated surface strings) are stored in separate DB keys. `generateVoiceSurfaces` reads examples and WRITES surfaces — it never touches the examples. This means test fixtures for `ai_voice_examples` remain stable across surface regeneration cycles.

**Defaults:** `DEFAULT_VOICE_EXAMPLES` (5 verbose, opinionated, asks-back Q&As) are the fallback when no DB customization exists. They do NOT need code changes — plan only verifies they match the commit `24a658b` originals.

**How "Reset to defaults" works:** Reset populates the 5 answer textareas with `DEFAULT_VOICE_EXAMPLES` answers and marks dirty → auto-save triggers `generateVoiceSurfaces` → surfaces regenerated from defaults.

**Unit test plan for personification (new tests required):**

Add `lib/ai/__tests__/voice-surfaces.test.ts` + `app/api/search/__tests__/build-system-prompt.test.ts`:

1. **`buildSystemPrompt` with two Q&A sets** — mock `chatCompletion`, call `buildSystemPrompt` with:
   - Fixture A: casual/conversational answers ("Honestly I'd go Ethiopia…") → assert system prompt string contains all Q&A pairs verbatim
   - Fixture B: formal/corporate answers ("I recommend our premium...") → assert system prompt string contains those pairs instead
   - These tests assert the plumbing, not AI output (which is non-deterministic)

2. **`generateVoiceSurfaces` pipeline test** — mock `chatCompletion` to return a known `VoiceSurfaces` JSON:
   - Call with Fixture A → assert `chatCompletion` was called with a system prompt that includes Fixture A's Q&A pairs
   - Call with Fixture B → assert `chatCompletion` was called with a system prompt that includes Fixture B's Q&A pairs
   - Assert return value matches the mocked AI output (correct parsing)
   - Assert `ai_voice_examples` in DB is NOT modified (surfaces ≠ examples)

**What ACs verify personification is working end-to-end:**

1. **AC-FN-5** (code review): system prompt instruction uses opinion phrasing, not action verbs
2. **AC-UI-13** (interactive): live query → AI response uses "I'd go with / I'd say / personally" framing
3. **AC-UI-7** (screenshot): placeholder shows owner-voice text, not hardcoded `"Ask about our coffee…"`

---

## Cluster 6: Bugs

### 6a. Settings nav active state
`app/admin/_components/dashboard/AdminTopNav.tsx` — `NavDropdown` function (lines 68–82):

Current broken logic:
```typescript
const firstChildRoute = item.children?.[0] ? findRouteByHref(item.children[0].href) : null;
const parentRouteId = firstChildRoute?.parentId || "";
const hasActiveChild = useHasActiveDescendant(parentRouteId);
```
Problem: parent-level nav items in overflow (Settings, Management) have no `href`, so `findRouteByHref(undefined)` → null → `parentRouteId = ""` → never active.

Fix: replace with pathname-based recursive check:
```typescript
const pathname = usePathname(); // from next/navigation
const hasActiveChild = item.children?.some(child =>
  child.children?.some(grandchild => 
    grandchild.href && pathname.startsWith(grandchild.href)
  ) || (child.href && pathname.startsWith(child.href))
) ?? false;
```

### 6b. `allowedDevOrigins`
`next.config.ts` — add after `env` block:
```typescript
...(process.env.NODE_ENV === 'development' && {
  allowedDevOrigins: ['192.168.86.30'],
}),
```
Note: this IP is the user's local dev machine. Consider using env var `ALLOWED_DEV_ORIGIN` so it's not hardcoded.

---

## Critical Files

| File | Changes |
|------|---------|
| `app/(site)/_components/ai/ChatPanel.tsx` | Title, mobile drawer, viewport tracking, product card, click-close, placeholder from surfaces |
| `app/(site)/_components/layout/SiteHeader.tsx` | "Search" → "Counter" x2 |
| `app/api/search/route.ts` | Add roastLevel/tastingNotes/type/description fields, cap take:7, prompt tuning |
| `lib/ai/voice-surfaces.ts` | Add placeholder field + default |
| `lib/ai/voice-surfaces.server.ts` | Add placeholder to generation prompt |
| `app/admin/settings/ai/page.tsx` | Remove 3 deprecated toggles, add Smart Search section |
| `app/admin/settings/storefront/page.tsx` | Remove AISearchSettingsSection |
| `app/admin/settings/storefront/_components/AISearchSettingsSection.tsx` | Delete or repurpose |
| `app/admin/_components/dashboard/AdminTopNav.tsx` | Fix overflow active state logic |
| `lib/ai/voice-examples.ts` | Verify DEFAULT_VOICE_EXAMPLES are correct |
| `app/globals.css` | Fix waiting-dots animation to start at 0 |
| `next.config.ts` | allowedDevOrigins dev-only |
| `lib/ai/__tests__/voice-surfaces.test.ts` | New: generateVoiceSurfaces fixture tests (2 Q&A sets) |
| `app/api/search/__tests__/build-system-prompt.test.ts` | New: buildSystemPrompt Q&A embedding tests |

---

## Acceptance Criteria

### UI

| AC | What | How | Pass |
|----|------|-----|------|
| AC-UI-1 | Counter panel title on storefront | Screenshot: open Counter panel at 390px mobile | DrawerTitle/header text reads "Counter" (not "Smart Search Assistant") |
| AC-UI-2 | Mobile Counter is full-width | Screenshot: Counter open at 390px | Panel covers full viewport width (no visible side margin); desktop remains narrow right drawer |
| AC-UI-3 | Mobile nav label | Screenshot: open mobile hamburger menu at 390px | "Counter" label visible next to chat icon (no "Search") |
| AC-UI-4 | Coffee product card two-liner | Interactive: submit query "bright fruity coffee" → screenshot result cards | Coffee card shows name on line 1, roast level + tasting notes on line 2 |
| AC-UI-5 | Merch product card two-liner | Interactive: submit query that returns merch → screenshot | Merch card shows name on line 1, short description on line 2 |
| AC-UI-6 | Hard cap 7 results | Interactive: submit query "coffee" → screenshot results (seed has 30 coffee products, all would match without cap) | At most 7 product cards visible; no 8th card despite 30 seed products matching |
| AC-UI-7 | Placeholder from voice surface | Screenshot: Counter panel open, no query entered | Input placeholder shows owner-voice text (not "Ask about our coffee…") |
| AC-UI-8 | Admin AI settings — Smart Search section present | Screenshot: `/admin/settings/ai` at 1280px | "Smart Search" section visible with enable toggle, Q&A textareas with char counts, "Reset to defaults" ghost btn, ● Saved status indicator |
| AC-UI-9 | Admin AI settings — deprecated toggles removed | Screenshot: `/admin/settings/ai` at 1280px | No "AI Chat (Barista)", "Coffee Recommender", or "About Page Assistant" visible |
| AC-UI-10 | Smart Search toggle right-aligned | Screenshot: `/admin/settings/ai` — Smart Search section | Section title on left, toggle Switch on right in same row |
| AC-UI-11 | Storefront settings — Smart Search removed | Screenshot: `/admin/settings/storefront` at 1280px | No Smart Search or Voice Examples section on this page |
| AC-UI-12 | Settings nav active state | Interactive: navigate to `/admin/settings/ai` → screenshot top nav | "...more" button has active/highlighted styling |
| AC-UI-13 | AI response uses owner-voice opinion phrasing | Interactive: submit query "dark roast" → screenshot response | Response contains at least one of ("I'd go with", "I'd say", "personally", "if it were me"); zero action verbs ("grab", "pour", "pick out", "pull") |

### Functional

| AC | What | How | Pass |
|----|------|-----|------|
| AC-FN-1 | Click product → close Counter + navigate | Code review: `ChatPanel.tsx` product card onClick | `close()` is called before/during navigation; no panel re-open on PDP |
| AC-FN-2 | Hard cap at 7 | Code review: `app/api/search/route.ts` DB query | `take` is ≤ 7 in the `findMany` call |
| AC-FN-3 | roastLevel + tastingNotes in response | Code review: `app/api/search/route.ts` select block | `roastLevel`, `tastingNotes`, `type` fields included in Prisma select |
| AC-FN-4 | Placeholder from voice surfaces | Code review: `ChatPanel.tsx` + `lib/ai/voice-surfaces.ts` | `VoiceSurfaces` interface has `placeholder` field; ChatPanel uses `voiceSurfaces.placeholder` |
| AC-FN-5 | Acknowledgment tone — no physical verbs | Code review: `app/api/search/route.ts` `buildExtractionPrompt` | Instruction uses "I'd go with / I'd say try / personally I'd"; no "grab/pour/pick out/pull" in the instruction |
| AC-FN-6 | Smart Search toggle in AI settings endpoint | Code review: `app/admin/settings/ai/page.tsx` | Page fetches `smartSearchEnabled` from `/api/admin/settings/ai-search` and saves back on toggle |
| AC-FN-7 | AISearchSettingsSection removed from storefront | Code review: `app/admin/settings/storefront/page.tsx` | No import or render of `AISearchSettingsSection`; no reference to voice examples |
| AC-FN-8 | Nav active state fix | Code review: `AdminTopNav.tsx` `NavDropdown` | Active check uses pathname-based descendant matching, not `findRouteByHref` with empty parentId |

### Regression

| AC | What | How | Pass |
|----|------|-----|------|
| AC-REG-1 | All tests pass including new voice pipeline tests | Test run: `npm run test:ci` | 1224+ tests pass (including new `buildSystemPrompt` + `generateVoiceSurfaces` fixture tests), 0 failures |
| AC-REG-2 | Precheck clean | Test run: `npm run precheck` | 0 TS errors, 0 ESLint errors |
| AC-REG-3 | Cart drawer unaffected | Screenshot: open cart at 390px | Cart drawer still opens from right, no layout regression |
| AC-REG-4 | Admin storefront settings still work | Screenshot: `/admin/settings/storefront` | Hero settings and product menu settings render correctly |

---

## Commit Schedule

> **Session safety:** After each commit, update `verification-status.json` to `"implementing"`.
> If a session ends mid-implementation, the next session reads `verification-status.json`, sees `"implementing"`, checks git log to find the last commit, and resumes from the next uncommitted cluster.
> **Do not run `/verify-workflow` between intermediate commits** — only once ALL code is written and precheck passes (after commit 9) does status advance to `"pending"` and verification begin.

1. `docs: add plan for counter-ux overhaul`
   → update status: `"planned"` → `"implementing"`

2. `feat: rename Counter panel title + mobile full-width drawer + viewport tracking`
   _(Clusters 1a, 1b, 1c)_

3. `feat: product card two-liner — roastLevel/tastingNotes/type in search response`
   _(Cluster 2a + 2b)_

4. `feat: click product closes Counter + navigates to PDP; cap results at 7`
   _(Cluster 2c)_

5. `feat: voice surfaces — add placeholder field, load in ChatPanel`
   _(Cluster 3a + 3b + 3c)_

6. `feat: prompt tuning — conversational opinion tone, follow-up redundancy guard`
   _(Cluster 4a + 4b)_

7. `feat: admin AI settings — consolidate Smart Search, remove deprecated toggles`
   _(Cluster 5a + 5b + 5c)_

8. `fix: settings nav active state + mobile nav Counter rename`
   _(Cluster 6a)_

9. `fix: loading animation start at 0 + allowedDevOrigins dev config`
   _(Cluster 1d + 6b)_
   → run `npm run precheck` → fix any errors
   → update status: `"implementing"` → `"pending"`

10. **Run `/verify-workflow`** — spawns verification sub-agent with full AC list
    → sub-agent fills Agent column in ACs doc
    → main thread fills QC column
    → iterate if any AC fails (fix → re-verify)
    → update status: `"pending"` → `"verified"` when all pass

11. `chore: update verification status — all ACs verified`
    → present handoff to human for Reviewer column

---

## Session Resume Protocol

If this branch is found in `"implementing"` state on session start:
1. Run `git log --oneline -10` to see last completed commit
2. Match against the commit schedule above to find the next unstarted cluster
3. Resume from that cluster — do NOT restart from cluster 1
4. After all clusters done + precheck passes → advance to `"pending"` and run `/verify-workflow`

If found in `"pending"` or `"partial"` state on session start:
1. Read ACs doc at `docs/features/smart-search-ux/counter-ux/ACs.md`
2. Spawn verification sub-agent — **first line MUST be**: `Run the AC verification protocol from .claude/commands/ac-verify.md.`
3. Do NOT skip this line or improvise — see retro-log.md 2026-04-12 for why
