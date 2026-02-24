/**
 * Theme Add Script
 *
 * Automates extraction of themes from shadcn-compatible registries.
 * Installs a theme CSS file into public/themes/ and updates manifest.json.
 *
 * Usage:
 *   npm run theme:add -- --name lush --url https://tweakcn.com/r/themes/cmlxzdqhc000004js4867ch0s
 *   npm run theme:add -- --list
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const THEMES_DIR = path.resolve(__dirname, "../public/themes");
const MANIFEST_PATH = path.join(THEMES_DIR, "manifest.json");
const GLOBALS_CSS_PATH = path.resolve(__dirname, "../app/globals.css");

interface ThemeColors {
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  accent: string;
  muted: string;
  destructive: string;
}

interface ThemeEntry {
  id: string;
  name: string;
  source: string;
  colors: {
    light: ThemeColors;
    dark: ThemeColors;
  };
}

interface Manifest {
  themes: ThemeEntry[];
}

function readManifest(): Manifest {
  if (!fs.existsSync(MANIFEST_PATH)) {
    return { themes: [] };
  }
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));
}

function writeManifest(manifest: Manifest): void {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
}

function listThemes(): void {
  const manifest = readManifest();
  if (manifest.themes.length === 0) {
    console.log("No themes installed.");
    return;
  }
  console.log(`\nInstalled themes (${manifest.themes.length}):\n`);
  for (const theme of manifest.themes) {
    console.log(`  ${theme.id.padEnd(20)} ${theme.name.padEnd(20)} ${theme.source}`);
  }
  console.log("");
}

function extractCSSVarValue(
  cssBlock: string,
  varName: string
): string | null {
  const regex = new RegExp(`--${varName}:\\s*([^;]+);`);
  const match = cssBlock.match(regex);
  return match ? match[1].trim() : null;
}

function extractColors(cssBlock: string): ThemeColors {
  const colorKeys: (keyof ThemeColors)[] = [
    "background",
    "foreground",
    "primary",
    "secondary",
    "accent",
    "muted",
    "destructive",
  ];

  const colors: Partial<ThemeColors> = {};
  for (const key of colorKeys) {
    colors[key] = extractCSSVarValue(cssBlock, key) || "";
  }
  return colors as ThemeColors;
}

function extractThemeBlocks(
  oldCSS: string,
  newCSS: string
): { rootBlock: string; darkBlock: string } | null {
  // Find the :root and .dark blocks in the new CSS that differ from old
  const rootRegex = /:root\s*\{([^}]+)\}/;
  const darkRegex = /\.dark\s*\{([^}]+)\}/;

  const newRoot = newCSS.match(rootRegex);
  const newDark = newCSS.match(darkRegex);
  const oldRoot = oldCSS.match(rootRegex);
  const oldDark = oldCSS.match(darkRegex);

  if (!newRoot || !newDark) {
    console.error("Could not find :root or .dark blocks in modified globals.css");
    return null;
  }

  // Extract only the variables that changed
  const extractVars = (block: string): Map<string, string> => {
    const vars = new Map<string, string>();
    const regex = /--([\w-]+):\s*([^;]+);/g;
    let match;
    while ((match = regex.exec(block)) !== null) {
      vars.set(match[1], match[2].trim());
    }
    return vars;
  };

  const oldRootVars = oldRoot ? extractVars(oldRoot[1]) : new Map();
  const newRootVars = extractVars(newRoot[1]);
  const oldDarkVars = oldDark ? extractVars(oldDark[1]) : new Map();
  const newDarkVars = extractVars(newDark[1]);

  // Build CSS with only changed variables
  const buildBlock = (
    oldVars: Map<string, string>,
    newVars: Map<string, string>
  ): string => {
    const lines: string[] = [];
    for (const [key, value] of newVars) {
      if (oldVars.get(key) !== value) {
        lines.push(`  --${key}: ${value};`);
      }
    }
    return lines.join("\n");
  };

  const rootVars = buildBlock(oldRootVars, newRootVars);
  const darkVars = buildBlock(oldDarkVars, newDarkVars);

  if (!rootVars && !darkVars) {
    console.error("No CSS variable changes detected after shadcn install.");
    return null;
  }

  return {
    rootBlock: `:root {\n${rootVars}\n}`,
    darkBlock: `.dark {\n${darkVars}\n}`,
  };
}

function addTheme(name: string, url: string): void {
  const id = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const displayName = name.charAt(0).toUpperCase() + name.slice(1);
  const themePath = path.join(THEMES_DIR, `${id}.css`);

  // Check if already exists
  const manifest = readManifest();
  if (manifest.themes.some((t) => t.id === id)) {
    console.error(`Theme "${id}" already exists. Remove it first or use a different name.`);
    process.exit(1);
  }

  // Ensure themes directory exists
  if (!fs.existsSync(THEMES_DIR)) {
    fs.mkdirSync(THEMES_DIR, { recursive: true });
  }

  // Backup globals.css
  const backupPath = GLOBALS_CSS_PATH + ".backup";
  const originalCSS = fs.readFileSync(GLOBALS_CSS_PATH, "utf-8");
  fs.writeFileSync(backupPath, originalCSS);
  console.log(`Backed up globals.css`);

  try {
    // Run shadcn add
    console.log(`Installing theme from ${url}...`);
    execSync(`npx shadcn@latest add "${url}"`, {
      stdio: "inherit",
      cwd: path.resolve(__dirname, ".."),
    });

    // Read modified globals.css
    const modifiedCSS = fs.readFileSync(GLOBALS_CSS_PATH, "utf-8");

    // Extract theme blocks
    const blocks = extractThemeBlocks(originalCSS, modifiedCSS);
    if (!blocks) {
      console.error("Failed to extract theme. Restoring globals.css.");
      fs.writeFileSync(GLOBALS_CSS_PATH, originalCSS);
      process.exit(1);
    }

    // Write theme CSS file
    const themeCSSContent = `${blocks.rootBlock}\n\n${blocks.darkBlock}\n`;
    fs.writeFileSync(themePath, themeCSSContent);
    console.log(`Created ${themePath}`);

    // Extract swatch colors for manifest
    const rootRegex = /:root\s*\{([^}]+)\}/;
    const darkRegex = /\.dark\s*\{([^}]+)\}/;
    const rootMatch = themeCSSContent.match(rootRegex);
    const darkMatch = themeCSSContent.match(darkRegex);

    const lightColors = rootMatch
      ? extractColors(rootMatch[1])
      : extractColors("");
    const darkColors = darkMatch
      ? extractColors(darkMatch[1])
      : extractColors("");

    // Update manifest
    manifest.themes.push({
      id,
      name: displayName,
      source: url,
      colors: { light: lightColors, dark: darkColors },
    });
    writeManifest(manifest);
    console.log(`Updated manifest.json`);
  } finally {
    // Restore globals.css
    fs.writeFileSync(GLOBALS_CSS_PATH, originalCSS);
    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
    }
    console.log(`Restored globals.css`);
  }

  console.log(`\nTheme "${displayName}" installed successfully!`);
}

// CLI argument parsing
const args = process.argv.slice(2);

if (args.includes("--list")) {
  listThemes();
  process.exit(0);
}

const nameIndex = args.indexOf("--name");
const urlIndex = args.indexOf("--url");

if (nameIndex === -1 || urlIndex === -1) {
  console.log(`
Usage:
  npm run theme:add -- --name <theme-name> --url <registry-url>
  npm run theme:add -- --list

Examples:
  npm run theme:add -- --name lush --url https://tweakcn.com/r/themes/cmlxzdqhc000004js4867ch0s
  npm run theme:add -- --list
`);
  process.exit(1);
}

const themeName = args[nameIndex + 1];
const themeUrl = args[urlIndex + 1];

if (!themeName || !themeUrl) {
  console.error("Both --name and --url are required.");
  process.exit(1);
}

addTheme(themeName, themeUrl);
