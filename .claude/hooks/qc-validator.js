// .claude/hooks/qc-validator.js
//
// Shared QC quality validator for verification hooks.
// Validates that QC column entries in ACs tracking docs are substantive,
// not rubber stamps, and independent from Agent column entries.
//
// For UI ACs, also validates that the How column's verification method
// matches the evidence provided — screenshot methods require screenshot
// evidence (.png/.jpg refs), code review methods require file:line refs.
//
// Usage:
//   const { validateQC } = require('./qc-validator');
//   const result = validateQC(projectDir, 'docs/plans/feature-ACs.md');
//   // result: { valid: boolean, issues: string[], skipped?: boolean }

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");

// Single-word or very short rubber-stamp phrases (case-insensitive)
const RUBBER_STAMPS = [
  "confirmed",
  "pass",
  "ok",
  "okay",
  "yes",
  "lgtm",
  "looks good",
  "verified",
  "approved",
  "agree",
  "correct",
  "good",
  "fine",
  "accepted",
  "no issues",
  "all good",
];

// Minimum substantive characters after stripping common prefixes like "PASS —"
const MIN_SUBSTANCE_CHARS = 15;

// ---------------------------------------------------------------------------
// How-column method detection
// ---------------------------------------------------------------------------

// How-column prefixes that require screenshot evidence (.png/.jpg references)
// in the Agent and/or QC columns.
const SCREENSHOT_HOW_PREFIXES = [
  "screenshot",
  "interactive",
  "exercise",
  "static",
];

// How-column prefixes that allow code-only evidence (file:line refs).
const CODE_REVIEW_HOW_PREFIXES = ["code review"];

// Keywords that prove a screenshot was actually taken/referenced.
const SCREENSHOT_EVIDENCE_KEYWORDS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  "screenshot",
  ".screenshots/",
];

// Fallback keywords for UI ACs with code-review How methods.
// These are generic UI-observation words — accepted only when How says "Code review".
const CODE_REVIEW_UI_KEYWORDS = [
  "file:",
  "line ",
  "line:",
  ":line",
  "visible",
  "renders",
  "rendered",
  "displays",
  "displayed",
  "shows",
  "shown",
  "appears",
  "layout",
  "badge",
  "button",
  "dialog",
  "modal",
  "label",
  "tab",
  "icon",
];

/**
 * Determine if a How column value specifies a screenshot-based method.
 * Returns "screenshot" | "code-review" | "unknown".
 */
function classifyHowMethod(how) {
  if (!how) return "unknown";
  const howLower = how.toLowerCase().trim();
  for (const prefix of SCREENSHOT_HOW_PREFIXES) {
    if (howLower.startsWith(prefix)) return "screenshot";
  }
  for (const prefix of CODE_REVIEW_HOW_PREFIXES) {
    if (howLower.startsWith(prefix)) return "code-review";
  }
  return "unknown";
}

/**
 * Parse markdown tables from ACs doc that have both "Agent" and "QC" headers.
 * Returns array of { ac, agent, qc, how, isUI } objects.
 */
function parseACTables(content) {
  const lines = content.split("\n");
  const results = [];

  let inTable = false;
  let acIdx = -1;
  let agentIdx = -1;
  let qcIdx = -1;
  let howIdx = -1;
  let separatorSeen = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detect table header row (has pipes and both "Agent" and "QC")
    if (
      line.startsWith("|") &&
      /\bAgent\b/i.test(line) &&
      /\bQC\b/i.test(line)
    ) {
      const headers = line
        .split("|")
        .map((h) => h.trim())
        .filter((h) => h.length > 0);

      acIdx = headers.findIndex((h) => /^AC$/i.test(h));
      agentIdx = headers.findIndex((h) => /^Agent$/i.test(h));
      qcIdx = headers.findIndex((h) => /^QC$/i.test(h));
      howIdx = headers.findIndex((h) => /^How$/i.test(h));

      if (acIdx >= 0 && agentIdx >= 0 && qcIdx >= 0) {
        inTable = true;
        separatorSeen = false;
        continue;
      }
    }

    // Skip separator row (|---|---|...)
    if (inTable && !separatorSeen && /^\|[\s\-|:]+\|$/.test(line)) {
      separatorSeen = true;
      continue;
    }

    // Parse data rows
    if (inTable && separatorSeen && line.startsWith("|")) {
      const rawCells = splitTableRow(line);

      if (rawCells.length > Math.max(acIdx, agentIdx, qcIdx)) {
        const ac = rawCells[acIdx] || "";
        const agent = rawCells[agentIdx] || "";
        const qc = rawCells[qcIdx] || "";
        const how = howIdx >= 0 && rawCells.length > howIdx ? rawCells[howIdx] || "" : "";
        const isUI = /^AC-UI/i.test(ac);

        results.push({ ac, agent, qc, how, isUI });
      }
    }

    // End of table (non-pipe line after table started)
    if (inTable && separatorSeen && !line.startsWith("|") && line.length > 0) {
      inTable = false;
      acIdx = -1;
      agentIdx = -1;
      qcIdx = -1;
      howIdx = -1;
      separatorSeen = false;
    }
  }

  return results;
}

/**
 * Split a markdown table row into cells, preserving empty cells.
 * Handles escaped pipes (\|) inside cell content.
 */
function splitTableRow(line) {
  // Remove leading and trailing pipe
  let inner = line.trim();
  if (inner.startsWith("|")) inner = inner.slice(1);
  if (inner.endsWith("|")) inner = inner.slice(0, -1);

  // Split on unescaped pipes only (not preceded by backslash)
  const cells = [];
  let current = "";
  for (let i = 0; i < inner.length; i++) {
    if (inner[i] === "|" && (i === 0 || inner[i - 1] !== "\\")) {
      cells.push(current.trim());
      current = "";
    } else {
      current += inner[i];
    }
  }
  cells.push(current.trim());

  return cells;
}

/**
 * Strip common prefixes like "PASS —", "PASS:", "PASS -", "Confirmed." etc.
 * Returns the remaining text.
 */
function stripPrefix(text) {
  return text
    .replace(/^(PASS|FAIL|OK|Confirmed)\s*[—–\-:.]?\s*/i, "")
    .trim();
}

/**
 * Calculate word overlap ratio between two texts.
 * Returns ratio from 0 to 1 (1 = complete overlap).
 */
function wordOverlap(text1, text2) {
  const words1 = new Set(
    text1
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
  const words2 = new Set(
    text2
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );

  if (words1.size === 0 || words2.size === 0) return 0;

  let overlap = 0;
  for (const w of words2) {
    if (words1.has(w)) overlap++;
  }

  return overlap / words2.size;
}

/**
 * Validate QC entries in an ACs tracking document.
 *
 * @param {string} projectDir - Absolute path to the project root
 * @param {string} acsDocRelPath - Relative path to the ACs doc from project root
 * @returns {{ valid: boolean, issues: string[], skipped?: boolean }}
 */
function validateQC(projectDir, acsDocRelPath) {
  if (!acsDocRelPath) {
    return { valid: true, issues: [], skipped: true };
  }

  const acsDocPath = path.resolve(projectDir, acsDocRelPath);

  if (!fs.existsSync(acsDocPath)) {
    return { valid: true, issues: [], skipped: true };
  }

  const content = fs.readFileSync(acsDocPath, "utf8");
  const acs = parseACTables(content);

  if (acs.length === 0) {
    return { valid: true, issues: [], skipped: true };
  }

  const issues = [];

  // Track UI AC screenshot method stats for the 50% rule
  let uiScreenshotMethodCount = 0;
  let uiTotalCount = 0;

  for (const { ac, agent, qc, how, isUI } of acs) {
    if (!ac) continue; // skip rows without AC identifier

    if (isUI) uiTotalCount++;

    // Rule 1: Empty check
    if (!qc || qc.length === 0) {
      issues.push(`${ac}: QC column is empty`);
      continue;
    }

    // Rule 2: Rubber stamp detection
    const qcNormalized = qc.toLowerCase().replace(/[.\s]+$/, "").trim();
    if (RUBBER_STAMPS.includes(qcNormalized)) {
      issues.push(
        `${ac}: QC is a rubber stamp ("${qc}"). Write independent evidence.`
      );
      continue;
    }

    // Also catch single-word QC entries that aren't in the list
    if (!/\s/.test(qcNormalized) && qcNormalized.length < 15) {
      issues.push(
        `${ac}: QC is a single word ("${qc}"). Write substantive evidence.`
      );
      continue;
    }

    // Rule 3: Minimum substance after stripping prefix
    const stripped = stripPrefix(qc);
    if (stripped.length < MIN_SUBSTANCE_CHARS) {
      issues.push(
        `${ac}: QC lacks substance (${stripped.length} chars after prefix). Min ${MIN_SUBSTANCE_CHARS} chars of evidence required.`
      );
      continue;
    }

    // Rule 4: UI evidence — method-aware validation (AC-UI-* only)
    if (isUI) {
      const howMethod = classifyHowMethod(how);
      const combinedEvidence = `${agent} ${qc}`.toLowerCase();

      if (howMethod === "screenshot") {
        // Screenshot method: require screenshot evidence in Agent or QC
        uiScreenshotMethodCount++;
        const hasScreenshotRef = SCREENSHOT_EVIDENCE_KEYWORDS.some((kw) =>
          combinedEvidence.includes(kw.toLowerCase())
        );
        if (!hasScreenshotRef) {
          issues.push(
            `${ac}: UI AC How says "${how.split(":")[0].trim()}" but Agent/QC lack screenshot evidence (.png/.jpg reference). Take screenshots or change How to "Code review".`
          );
          continue;
        }
      } else if (howMethod === "code-review") {
        // Code review method: accept file:line refs or UI observation keywords
        const hasFileLineRef = /\.\w+:\d+/.test(qc);
        const hasObservation = CODE_REVIEW_UI_KEYWORDS.some((kw) =>
          qc.toLowerCase().includes(kw.toLowerCase())
        );
        if (!hasFileLineRef && !hasObservation) {
          issues.push(
            `${ac}: UI AC QC lacks evidence (no file:line ref or UI observation keyword)`
          );
          continue;
        }
      } else {
        // Unknown How method — fallback: require either screenshot or file:line
        const hasScreenshotRef = SCREENSHOT_EVIDENCE_KEYWORDS.some((kw) =>
          combinedEvidence.includes(kw.toLowerCase())
        );
        const hasFileLineRef = /\.\w+:\d+/.test(qc);
        const hasObservation = CODE_REVIEW_UI_KEYWORDS.some((kw) =>
          qc.toLowerCase().includes(kw.toLowerCase())
        );
        if (!hasScreenshotRef && !hasFileLineRef && !hasObservation) {
          issues.push(
            `${ac}: UI AC QC lacks visual evidence (no screenshot ref, file:line, or visual observation keyword)`
          );
          continue;
        }
      }
    }

    // Rule 5: Echo detection — QC is substring of Agent or >80% word overlap
    if (agent && agent.length > 0) {
      const agentLower = agent.toLowerCase();
      const qcLower = qc.toLowerCase();

      // Substring check (QC contained within Agent)
      if (agentLower.includes(qcLower)) {
        issues.push(
          `${ac}: QC is a substring of Agent column. Write independent evidence.`
        );
        continue;
      }

      // Word overlap check
      const overlap = wordOverlap(agent, qc);
      if (overlap > 0.8) {
        issues.push(
          `${ac}: QC has ${Math.round(overlap * 100)}% word overlap with Agent column. Write independent evidence.`
        );
        continue;
      }
    }
  }

  // Rule 6: At least 50% of UI ACs should use screenshot methods
  // (only flag when there are UI ACs and none use screenshots)
  if (uiTotalCount > 0 && uiScreenshotMethodCount === 0) {
    issues.push(
      `0/${uiTotalCount} UI ACs use screenshot verification (Screenshot/Interactive/Exercise). At least 50% should use screenshot-based methods per acs-template.md.`
    );
  } else if (
    uiTotalCount >= 4 &&
    uiScreenshotMethodCount / uiTotalCount < 0.5
  ) {
    issues.push(
      `${uiScreenshotMethodCount}/${uiTotalCount} UI ACs use screenshot verification — below the 50% minimum. Add screenshot-based How methods to more UI ACs.`
    );
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

module.exports = { validateQC, parseACTables };
