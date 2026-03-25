import { Resend } from "resend";

let _resend: Resend | null = null;
let _resendKey: string | null = null;

/**
 * Returns a Resend client for the given API key, or null if no key is available.
 * When called with an explicit key (from DB settings), a fresh client is returned.
 * When called without a key, falls back to RESEND_API_KEY env var with lazy singleton.
 */
export function getResend(apiKey?: string): Resend | null {
  const key = apiKey || process.env.RESEND_API_KEY;
  if (!key) return null;
  // Return fresh client if key differs from cached (DB key updated)
  if (apiKey && apiKey !== _resendKey) {
    return new Resend(apiKey);
  }
  if (!_resend) {
    _resend = new Resend(key);
    _resendKey = key;
  }
  return _resend;
}

/**
 * Returns true if RESEND_API_KEY is set in environment variables.
 * Use getEmailProviderSettings() to check DB-stored keys.
 */
export function isResendConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}
