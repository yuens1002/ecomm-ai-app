#!/usr/bin/env node
/**
 * QA failure classifier.
 *
 * Reads qa-results.json and classifies the failure into one of three categories:
 *   A — AC_HINTS config bug (wrong label/selector). Auto-repairable.
 *   B — App regression (feature broke). Issue enrichment only.
 *   C — Infrastructure failure (Vercel down, budget, crash). Diagnostics only.
 *
 * Output: JSON to stdout { category, failedAcs, reason, repairable }
 * Exit code: always 0
 *
 * Usage:
 *   node scripts/qa-classify.js [--results-file path]
 *   node scripts/qa-classify.js --results-file qa-results.json
 */

"use strict";

const fs   = require("fs");
const path = require("path");

// ── CLI args ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
function getArg(name) {
  const i = args.indexOf(name);
  return i !== -1 ? args[i + 1] : null;
}

const resultsFile = getArg("--results-file") || "qa-results.json";

// ── Extract AC_HINTS keys from qa-agent.js source ─────────────────────────────
// Identifies which ACs have machine-readable hints — Category A is only possible for these.

const agentSrc = fs.readFileSync(path.join(__dirname, "qa-agent.js"), "utf8");
const hintKeys  = extractHintKeys(agentSrc);
const hintTexts = extractHintTexts(agentSrc, hintKeys);

// ── Core logic (exported for unit tests) ─────────────────────────────────────

/**
 * Extract AC_HINTS keys from qa-agent.js source text.
 * @param {string} src
 * @returns {Set<string>}
 */
function extractHintKeys(src) {
  return new Set([...src.matchAll(/"(AC-[A-Z]+-\d+)":/g)].map((m) => m[1]));
}

/**
 * Extract AC_HINTS text values from qa-agent.js source.
 * @param {string} src
 * @param {Set<string>} keys
 * @returns {Record<string, string>}
 */
function extractHintTexts(src, keys) {
  const texts = {};
  for (const key of keys) {
    const keyPattern = new RegExp(`"${key}":\\s*\\[([\\s\\S]*?)\\]\\.join\\(" "\\)`, "m");
    const match = src.match(keyPattern);
    if (match) {
      const strings = [...match[1].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1].replace(/\\'/g, "'"));
      texts[key] = strings.join(" ");
    }
  }
  return texts;
}

/**
 * Classify a QA run result.
 * @param {object} result - Parsed qa-results.json
 * @param {Set<string>} [resolvedHintKeys] - AC_HINTS keys (injectable for tests)
 * @param {Record<string, string>} [resolvedHintTexts] - AC_HINTS texts (injectable for tests)
 * @returns {{ category: "A"|"B"|"C", failedAcs: object[], reason: string, repairable: boolean }}
 */
function classify(result, resolvedHintKeys, resolvedHintTexts) {
  resolvedHintKeys  = resolvedHintKeys  || hintKeys;
  resolvedHintTexts = resolvedHintTexts || hintTexts;

  // Category C: infrastructure failure
  if (result.exitCode >= 2 || result.infraError) {
    const reason = result.infraError
      ? `Infrastructure error: ${result.infraError}`
      : result.exitCode === 2
        ? `Token budget exceeded (${result.totalTokens} tokens)`
        : "Unexpected crash (exit 3)";
    return { category: "C", failedAcs: [], reason, repairable: false };
  }

  if (result.exitCode === 0) {
    return { category: "C", failedAcs: [], reason: "No failures detected (exit 0)", repairable: false };
  }

  // exitCode === 1: one or more ACs failed
  const failedAcs = (result.results || []).filter((r) => r.status === "FAIL");

  if (failedAcs.length === 0) {
    return { category: "C", failedAcs: [], reason: "Exit 1 but no failed ACs in results — malformed results file", repairable: false };
  }

  // Check each failed AC for A-signals vs B-signals
  const aSignalAcs = [];
  const bSignalAcs = [];
  for (const ac of failedAcs) {
    if (hasASignal(ac, resolvedHintKeys)) {
      aSignalAcs.push(ac);
    } else {
      bSignalAcs.push(ac);
    }
  }

  // Conservative: any B-signal → Category B
  if (bSignalAcs.length > 0) {
    const ids = bSignalAcs.map((a) => a.id).join(", ");
    return {
      category: "B",
      failedAcs: failedAcs.map((ac) => enrichFailed(ac, resolvedHintKeys, resolvedHintTexts)),
      reason: `App regression suspected on ${ids} — no AC_HINTS A-signal`,
      repairable: false,
    };
  }

  // All failed ACs have A-signals → Category A
  return {
    category: "A",
    failedAcs: aSignalAcs.map((ac) => enrichFailed(ac, resolvedHintKeys, resolvedHintTexts)),
    reason: `AC_HINTS config bug suspected on ${aSignalAcs.map((a) => a.id).join(", ")} — element-not-found pattern with known hint`,
    repairable: true,
  };
}

/**
 * A-signal criteria (conservative — all must apply):
 * 1. AC has an entry in AC_HINTS (only hintable ACs can be auto-repaired)
 * 2. toolCallTrace includes at least one interaction tool (fill or click)
 * 3. Evidence or turn count suggests element-not-found (not a logic failure)
 * @param {object} ac
 * @param {Set<string>} [resolvedHintKeys]
 * @returns {boolean}
 */
function hasASignal(ac, resolvedHintKeys) {
  resolvedHintKeys = resolvedHintKeys || hintKeys;

  // Must have a hint
  if (!resolvedHintKeys.has(ac.id)) return false;

  // Must have attempted an interaction tool
  const trace = ac.toolCallTrace || [];
  const hasInteraction = trace.includes("fill") || trace.includes("click");
  if (!hasInteraction) return false;

  // Evidence must suggest element-not-found / silent failure, not a logical assertion failure
  const evidence = (ac.evidence || "").toLowerCase();
  const isElementNotFound =
    evidence.includes("without verdict") ||    // agent ended without done
    evidence.includes("exceeded max turns") ||  // retried until budget
    evidence.includes("not found") ||
    evidence.includes("no element") ||
    evidence.includes("locator") ||
    evidence.includes("timeout");

  // High turn count on a simple AC also signals repeated retries on wrong label
  const highTurnCount = typeof ac.turnCount === "number" && ac.turnCount >= 8;

  return isElementNotFound || highTurnCount;
}

function enrichFailed(ac, resolvedHintKeys, resolvedHintTexts) {
  return {
    id: ac.id,
    evidence: ac.evidence,
    turnCount: ac.turnCount,
    toolCallTrace: ac.toolCallTrace,
    acHintKey: resolvedHintKeys.has(ac.id) ? ac.id : null,
    currentHintText: resolvedHintTexts[ac.id] || null,
    finalPageUrl: ac.finalPageUrl || null,
  };
}

function output(result) {
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}

// ── Exports (for unit tests) ──────────────────────────────────────────────────
module.exports = { classify, hasASignal, extractHintKeys, extractHintTexts };

// ── CLI entrypoint ────────────────────────────────────────────────────────────
if (require.main === module) {
  let runResult;
  try {
    runResult = JSON.parse(fs.readFileSync(resultsFile, "utf8"));
  } catch (e) {
    output({ category: "C", failedAcs: [], reason: `Cannot read results file: ${e.message}`, repairable: false });
    process.exit(0);
  }
  output(classify(runResult, hintKeys, hintTexts));
}
