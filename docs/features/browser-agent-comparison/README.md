# Browser Agent Comparison — Decision Record

**Date:** 2026-03-29
**Status:** Decided
**Context:** Evaluated Vercel Agent Browser CLI as a potential replacement or enhancement for our current Claude SDK + Playwright QA setup.

---

## What We Compared

### Our Current Setup (Claude SDK + Playwright Duo)

Two-agent system built around `qa-agent.js` and `qa-repair-agent.js`:

- **QA Agent** — Claude SDK (`@anthropic-ai/sdk`) drives Playwright through acceptance criteria defined in `VERIFICATION.md`. Each AC is plain-English. Claude reads the accessibility tree via `ariaSnapshot()`, receives per-AC structured hints, and autonomously decides what actions to take. No hardcoded selectors, no fixed sequences.
- **Self-Heal Agent** — Nightly CI repair agent that classifies failures (Category A/B/C), auto-fixes stale hints for Category A, verifies the fix, and opens a PR. 10K token budget per repair.
- **Token budget:** 300K per QA run, routed through Vercel AI Gateway.
- **Test contracts:** Structured ACs from `VERIFICATION.md` with blocker cascading and dynamic tool filtering.

### Vercel Agent Browser

Open-source Rust CLI (`agent-browser`) by Vercel Labs, launched January 2026.

- **Architecture:** Rust CLI wrapping a Playwright daemon. AI agents issue shell commands (`agent-browser click @e3`) instead of API tool calls.
- **Snapshot + Refs:** Returns compact accessibility snapshots with stable `@ref` identifiers (~200-400 tokens per page vs. thousands for raw accessibility tree).
- **Token efficiency:** Claims 82-93% less context than Playwright MCP. No tool schema loaded into context window.
- **Maturity:** Pre-1.0 (v0.22.3), ~25K GitHub stars, 135K weekly npm installs. Apache-2.0 license.
- **Limitations:** No network interception, limited deep browser features, Windows support broken, thin docs.

---

## Key Tradeoffs

### Full LLM Agent vs. Scripted Playwright

We considered whether to replace the LLM-driven approach entirely with scripted Playwright tests using semantic selectors (`getByRole`, `getByLabel`).

**Why we rejected scripting:** The brittleness isn't in selectors — it's in the translation layer. Our ACs are human-intent descriptions. Converting them to scripts requires a human to interpret the exact step sequence, hardcode assertions, and maintain all of it when flows evolve. With the LLM approach, **the AC descriptions ARE the tests** — no translation step, no drift between spec and implementation.

Semantic Playwright selectors get you ~80% of the resilience, but the remaining 20% (reworded labels, reordered flows, ambiguous states) is exactly where Claude earns its token cost. And the maintenance burden of keeping scripts in sync with evolving ACs scales badly with AC count.

### Token Cost Reality

| Approach | Cost per QA run | Monthly (nightly CI) |
|---|---|---|
| Current (full a11y tree) | ~$0.90-2.70 | ~$30-80 |
| With agent-browser snapshots | ~$0.15-0.55 (est. 80% reduction) | ~$5-17 |
| Scripted Playwright | $0 | $0 + developer maintenance time |

### Agent Browser as Full Replacement vs. Snapshot-Only Swap

| Dimension | Full migration | Snapshot swap only |
|---|---|---|
| Token savings | High | High (same snapshot format) |
| AC framework preserved | No — must rebuild | Yes |
| Self-heal preserved | No — must rebuild | Yes |
| Tool filtering preserved | No | Yes |
| Blocker cascading preserved | No | Yes |
| Migration effort | Large | Small (replace `read_page` internals) |
| Risk | High (pre-1.0 tool, thin docs) | Low (isolated change) |

---

## Decisions

### 1. Keep the LLM-driven QA agent

The "ACs are the tests" model is the core value. No scripted alternative preserves this without reintroducing the translation/maintenance layer.

### 2. Swap `read_page` to use agent-browser compact snapshots

Replace the `ariaSnapshot()` dump in `read_page` with agent-browser's snapshot + `@ref` format. This cuts per-page token usage by ~80% while keeping the entire orchestration layer intact.

**Scope:** Only the `read_page` tool implementation changes. Claude still receives an accessibility representation — just a more compact one with stable refs instead of verbose tree output.

### 3. Keep the self-heal agent

Already built, runs at 10K tokens per fix (~$0.03), and solves the one thing that still breaks — stale hints. Without it, a label change means nightly QA is red until a human notices. With it, the fix PR is waiting by morning. The ROI is developer attention, not dollars.

### 4. Do not migrate the full orchestration to agent-browser

Agent-browser is a lower-level primitive. It doesn't provide AC frameworks, tool filtering, blocker cascading, or self-healing. Our orchestration layer is more valuable than what agent-browser offers out of the box, and rebuilding it on top of a pre-1.0 CLI adds risk for no architectural gain.

---

## Action Items

- [ ] Install `agent-browser` as a dev dependency
- [ ] Update `read_page` tool in `qa-agent.js` to use agent-browser snapshot format
- [ ] Update `qa-repair-agent.js` `read_page` to match
- [ ] Benchmark token usage before/after on a full QA run
- [ ] Monitor agent-browser stability (pre-1.0, active development)

---

## References

- [vercel-labs/agent-browser (GitHub)](https://github.com/vercel-labs/agent-browser)
- [Token efficiency analysis (DEV Community)](https://dev.to/chen_zhang_bac430bc7f6b95/why-vercels-agent-browser-is-winning-the-token-efficiency-war-for-ai-browser-automation-4p87)
- [Self-Verifying AI Agents (Pulumi Blog)](https://www.pulumi.com/blog/self-verifying-ai-agents-vercels-agent-browser-in-the-ralph-wiggum-loop/)
- Internal: `docs/features/app-qa/` — QA agent architecture
- Internal: `docs/features/qa-self-healing/` — Self-heal repair agent
