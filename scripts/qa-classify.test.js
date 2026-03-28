/**
 * @jest-environment node
 *
 * Unit tests for qa-classify.js decision tree.
 * Uses fixture data — no file system reads, no network calls.
 */

const { classify, hasASignal } = require("./qa-classify.js");

// Fixture hint keys: matches the 6 ACs that currently have AC_HINTS entries
const FIXTURE_HINT_KEYS = new Set(["AC-IF-2", "AC-IF-3", "AC-IF-4", "AC-IF-5", "AC-KV-2", "AC-KV-3"]);
const FIXTURE_HINT_TEXTS = {
  "AC-KV-2": "Call clear_session first. Navigate to '/auth/admin-signin'. Fill 'Email' with Admin email, fill 'Password' with Admin password. Click 'Sign In'. PASS if URL path is /admin.",
  "AC-IF-5": "Fill these 5 fields in order: fill('Store name', ...), fill('Your name', ...), fill('Email address', ...), fill('Password', ...), fill('Confirm password', ...). Then click('Take me to my store').",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeResult(overrides = {}) {
  return {
    runId: "test-run-1",
    timestamp: "2026-03-28T06:00:00.000Z",
    exitCode: 1,
    baseUrl: "https://qa.example.com",
    model: "claude-haiku-4-5-20251001",
    totalTokens: 50000,
    infraError: null,
    results: [],
    ...overrides,
  };
}

function makeAC(id, status, evidence, toolCallTrace = [], turnCount = 5) {
  return {
    id,
    status,
    evidence,
    turnCount,
    toolCallTrace,
    finalPageSnapshot: status === "FAIL" ? "- heading: Sign In" : null,
    finalPageUrl: status === "FAIL" ? "https://qa.example.com/auth/admin-signin" : null,
  };
}

// ── Category C tests ──────────────────────────────────────────────────────────

describe("Category C: infrastructure failures", () => {
  test("exit 3 with infraError → Category C", () => {
    const result = makeResult({
      exitCode: 3,
      infraError: "Cannot reach https://qa.example.com: ECONNREFUSED",
      results: [],
    });
    const out = classify(result, FIXTURE_HINT_KEYS, FIXTURE_HINT_TEXTS);
    expect(out.category).toBe("C");
    expect(out.repairable).toBe(false);
    expect(out.reason).toContain("ECONNREFUSED");
  });

  test("exit 2 (budget exceeded) → Category C", () => {
    const result = makeResult({ exitCode: 2, totalTokens: 305000, infraError: null, results: [] });
    const out = classify(result, FIXTURE_HINT_KEYS, FIXTURE_HINT_TEXTS);
    expect(out.category).toBe("C");
    expect(out.repairable).toBe(false);
    expect(out.reason).toContain("Token budget exceeded");
  });

  test("exit 0 (all pass) → Category C (no failures)", () => {
    const result = makeResult({ exitCode: 0, results: [] });
    const out = classify(result, FIXTURE_HINT_KEYS, FIXTURE_HINT_TEXTS);
    expect(out.category).toBe("C");
    expect(out.repairable).toBe(false);
  });
});

// ── Category A tests ──────────────────────────────────────────────────────────

describe("Category A: AC_HINTS config bug", () => {
  test("AC-KV-2 FAIL with fill trace and 'without verdict' evidence → Category A", () => {
    const result = makeResult({
      results: [
        makeAC("AC-KV-2", "FAIL", "agent ended without verdict", ["navigate", "fill", "done"], 10),
      ],
    });
    const out = classify(result, FIXTURE_HINT_KEYS, FIXTURE_HINT_TEXTS);
    expect(out.category).toBe("A");
    expect(out.repairable).toBe(true);
    expect(out.failedAcs).toHaveLength(1);
    expect(out.failedAcs[0].id).toBe("AC-KV-2");
    expect(out.failedAcs[0].acHintKey).toBe("AC-KV-2");
    expect(out.failedAcs[0].currentHintText).toBeTruthy();
  });

  test("AC-IF-5 FAIL with fill trace and high turn count → Category A", () => {
    const result = makeResult({
      results: [
        makeAC("AC-IF-5", "FAIL", "exceeded max turns — agent did not reach a verdict", ["fill", "click", "fill", "done"], 18),
      ],
    });
    const out = classify(result, FIXTURE_HINT_KEYS, FIXTURE_HINT_TEXTS);
    expect(out.category).toBe("A");
    expect(out.repairable).toBe(true);
  });

  test("multiple hinted ACs with fill/click A-signals → still Category A", () => {
    const result = makeResult({
      results: [
        makeAC("AC-KV-2", "FAIL", "agent ended without verdict", ["navigate", "fill", "done"], 10),
        makeAC("AC-IF-5", "FAIL", "exceeded max turns — agent did not reach a verdict", ["fill", "fill", "click", "done"], 18),
      ],
    });
    const out = classify(result, FIXTURE_HINT_KEYS, FIXTURE_HINT_TEXTS);
    expect(out.category).toBe("A");
    expect(out.failedAcs).toHaveLength(2);
  });
});

// ── Category B tests ──────────────────────────────────────────────────────────

describe("Category B: app regression (conservative fallback)", () => {
  test("AC-IF-5 FAIL with 403 evidence (no A-signal) → Category B", () => {
    const result = makeResult({
      results: [
        makeAC("AC-IF-5", "FAIL", "HTTP 403 Forbidden — access denied", ["navigate", "fill", "click", "done"], 3),
      ],
    });
    const out = classify(result, FIXTURE_HINT_KEYS, FIXTURE_HINT_TEXTS);
    expect(out.category).toBe("B");
    expect(out.repairable).toBe(false);
  });

  test("AC without hint entry FAIL → Category B", () => {
    const result = makeResult({
      results: [
        makeAC("AC-IS-1", "FAIL", "getting started checklist not visible", ["navigate", "read_page", "done"], 2),
      ],
    });
    const out = classify(result, FIXTURE_HINT_KEYS, FIXTURE_HINT_TEXTS);
    expect(out.category).toBe("B");
    expect(out.repairable).toBe(false);
  });

  test("mix of A-signal and B-signal ACs → Category B (conservative)", () => {
    const result = makeResult({
      results: [
        makeAC("AC-KV-2", "FAIL", "agent ended without verdict", ["navigate", "fill", "done"], 10),
        makeAC("AC-IS-3", "FAIL", "orders empty state not visible", ["navigate", "read_page", "done"], 2),
      ],
    });
    const out = classify(result, FIXTURE_HINT_KEYS, FIXTURE_HINT_TEXTS);
    expect(out.category).toBe("B");
    expect(out.repairable).toBe(false);
  });

  test("hinted AC with assertion failure evidence (not element-not-found) → Category B", () => {
    const result = makeResult({
      results: [
        makeAC("AC-KV-2", "FAIL", "URL is /auth/admin-signin after sign in — expected /admin", ["navigate", "fill", "click", "done"], 3),
      ],
    });
    const out = classify(result, FIXTURE_HINT_KEYS, FIXTURE_HINT_TEXTS);
    expect(out.category).toBe("B");
    expect(out.repairable).toBe(false);
  });
});

// ── hasASignal unit tests ─────────────────────────────────────────────────────

describe("hasASignal", () => {
  test("returns false when AC not in hint keys", () => {
    const ac = makeAC("AC-IS-1", "FAIL", "not found", ["navigate", "read_page", "done"], 5);
    expect(hasASignal(ac, FIXTURE_HINT_KEYS)).toBe(false);
  });

  test("returns false when no fill/click in trace", () => {
    const ac = makeAC("AC-KV-2", "FAIL", "agent ended without verdict", ["navigate", "read_page", "done"], 5);
    expect(hasASignal(ac, FIXTURE_HINT_KEYS)).toBe(false);
  });

  test("returns false when evidence is assertion failure (not element-not-found)", () => {
    const ac = makeAC("AC-KV-2", "FAIL", "URL still on signin page after submit", ["navigate", "fill", "click", "done"], 3);
    expect(hasASignal(ac, FIXTURE_HINT_KEYS)).toBe(false);
  });

  test("returns true for canonical label-mismatch pattern", () => {
    const ac = makeAC("AC-KV-2", "FAIL", "agent ended without verdict", ["navigate", "fill", "done"], 10);
    expect(hasASignal(ac, FIXTURE_HINT_KEYS)).toBe(true);
  });

  test("returns true for high turn count with fill", () => {
    const ac = makeAC("AC-IF-5", "FAIL", "some other message", ["fill", "click", "done"], 9);
    expect(hasASignal(ac, FIXTURE_HINT_KEYS)).toBe(true);
  });
});
