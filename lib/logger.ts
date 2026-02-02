/**
 * Simple log level utility
 * Set LOG_LEVEL env var: debug | info | warn | error
 * Default: info (skips debug messages in production)
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = (process.env.LOG_LEVEL as LogLevel) || "info";

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

export const logger = {
  debug: (...args: unknown[]) => shouldLog("debug") && console.log(...args),
  info: (...args: unknown[]) => shouldLog("info") && console.log(...args),
  warn: (...args: unknown[]) => shouldLog("warn") && console.warn(...args),
  error: (...args: unknown[]) => shouldLog("error") && console.error(...args),
};
