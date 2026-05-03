"use client";

import { useState, useEffect, useCallback } from "react";
import { ExternalLink, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface StripeConfigResponse {
  encryptionKeySet: boolean;
  envSecretSet: boolean;
  envWebhookSet: boolean;
  envPublishableSet: boolean;
  db: {
    hasRow: boolean;
    hasSecretKey: boolean;
    hasWebhookSecret: boolean;
    publishableKey: string | null;
    accountId: string | null;
    accountName: string | null;
    isTestMode: boolean | null;
    lastValidatedAt: string | null;
    decryptionError: boolean;
    secretKeyMasked: string | null;
    webhookSecretMasked: string | null;
  };
}

interface ValidationResult {
  accountId: string;
  accountName: string;
  country: string;
  currency: string;
  isTestMode: boolean;
}

export function StripeCredentialsForm() {
  const [config, setConfig] = useState<StripeConfigResponse | null>(null);
  const [fetching, setFetching] = useState(true);
  const [secretKey, setSecretKey] = useState("");
  const [publishableKey, setPublishableKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [secretVisible, setSecretVisible] = useState(false);
  const [webhookVisible, setWebhookVisible] = useState(false);
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings/stripe");
      if (res.ok) {
        const data: StripeConfigResponse = await res.json();
        setConfig(data);
        // Pre-populate fields with masked values if DB row exists
        if (data.db.secretKeyMasked) setSecretKey(data.db.secretKeyMasked);
        if (data.db.webhookSecretMasked) setWebhookSecret(data.db.webhookSecretMasked);
        if (data.db.publishableKey) setPublishableKey(data.db.publishableKey);
      }
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const isTestMode = (key: string) => /^(sk|pk|rk)_test_/.test(key);
  const isLiveMode = (key: string) => /^(sk|pk|rk)_live_/.test(key);
  const secretMode = isTestMode(secretKey) ? "test" : isLiveMode(secretKey) ? "live" : null;

  const formDisabled = !config?.encryptionKeySet;

  const handleValidate = async () => {
    setError(null);
    setValidating(true);
    try {
      const res = await fetch("/api/admin/settings/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secretKey, publishableKey: publishableKey || undefined, webhookSecret: webhookSecret || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Validation failed");
        return;
      }
      setValidationResult(data);
      setShowConfirmModal(true);
    } finally {
      setValidating(false);
    }
  };

  const handleSave = async () => {
    setShowConfirmModal(false);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings/stripe", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secretKey: secretKey || undefined,
          publishableKey: publishableKey || undefined,
          webhookSecret: webhookSecret || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      await fetchConfig();
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setShowClearModal(false);
    setClearing(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings/stripe", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Clear failed");
        return;
      }
      setSecretKey("");
      setPublishableKey("");
      setWebhookSecret("");
      await fetchConfig();
    } finally {
      setClearing(false);
    }
  };

  if (fetching) {
    return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading Stripe configuration…</div>;
  }

  const { envSecretSet, db } = config!;

  return (
    <div className="space-y-6">
      {/* Stripe-account-first card */}
      <div className="rounded-lg border bg-muted/40 p-4">
        <div className="flex items-start gap-3">
          <Info className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <div className="text-sm">
            <span className="font-medium">Don&rsquo;t have a Stripe account yet?</span>{" "}
            Create one at{" "}
            <a
              href="https://dashboard.stripe.com/register"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-primary hover:underline"
            >
              dashboard.stripe.com/register
              <ExternalLink className="h-3 w-3 ml-0.5" />
            </a>{" "}
            before entering keys below.
          </div>
        </div>
      </div>

      {/* Status banner */}
      {!config?.encryptionKeySet ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-destructive">Encryption key required</p>
              <p className="text-muted-foreground mt-1">
                Set <code className="text-xs bg-muted px-1 py-0.5 rounded">PAYMENT_CREDENTIALS_ENCRYPTION_KEY</code> to enable credential storage.
              </p>
              <p className="text-muted-foreground mt-1 text-xs font-mono">
                openssl rand -hex 32
              </p>
            </div>
          </div>
        </div>
      ) : envSecretSet ? (
        <div className="rounded-lg border bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 p-4">
          <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Stripe is configured via environment variables.
          </div>
        </div>
      ) : db.decryptionError ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Credentials encrypted with a different key — re-enter your keys below to re-save.
        </div>
      ) : db.hasRow ? (
        <div className="rounded-lg border bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 p-4">
          <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Stripe is configured via admin UI
            {db.accountName && <span className="font-medium">: {db.accountName}</span>}
            {db.isTestMode !== null && (
              <span className={`ml-1 text-xs px-1.5 py-0.5 rounded font-medium ${db.isTestMode ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"}`}>
                {db.isTestMode ? "Test Mode" : "Live Mode"}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800 p-4">
          <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Stripe is not configured — payments will not work.
          </div>
        </div>
      )}

      {/* Credentials form */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="stripe-secret-key">
            Secret Key
            {secretMode === "test" && (
              <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 font-medium">Test Mode</span>
            )}
            {secretMode === "live" && (
              <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium">Live Mode</span>
            )}
          </Label>
          <div className="relative max-w-[72ch]">
            <Input
              id="stripe-secret-key"
              type={secretVisible ? "text" : "password"}
              placeholder={db.hasSecretKey ? "Re-enter to change" : "sk_test_… or sk_live_…"}
              value={secretKey}
              onChange={(e) => { setSecretKey(e.target.value); setError(null); }}
              disabled={formDisabled || validating || saving}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setSecretVisible((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={secretVisible ? "Hide secret key" : "Show secret key"}
            >
              {secretVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="stripe-publishable-key">Publishable Key</Label>
          <Input
            id="stripe-publishable-key"
            type="text"
            placeholder="pk_test_… or pk_live_…"
            value={publishableKey}
            onChange={(e) => { setPublishableKey(e.target.value); setError(null); }}
            disabled={formDisabled || validating || saving}
            className="max-w-[72ch]"
          />
          <p className="text-xs text-muted-foreground">
            Stored for reference. The live storefront uses <code className="text-xs bg-muted px-1 py-0.5 rounded">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> at build time.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="stripe-webhook-secret">Webhook Secret</Label>
          <div className="relative max-w-[72ch]">
            <Input
              id="stripe-webhook-secret"
              type={webhookVisible ? "text" : "password"}
              placeholder={db.hasWebhookSecret ? "Re-enter to change" : "whsec_…"}
              value={webhookSecret}
              onChange={(e) => { setWebhookSecret(e.target.value); setError(null); }}
              disabled={formDisabled || validating || saving}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setWebhookVisible((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={webhookVisible ? "Hide webhook secret" : "Show webhook secret"}
            >
              {webhookVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <div className="flex items-center gap-3">
          <Button
            onClick={handleValidate}
            disabled={formDisabled || !secretKey || validating || saving}
          >
            {validating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {validating ? "Validating with Stripe…" : "Validate"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setSecretKey(db.secretKeyMasked ?? "");
              setWebhookSecret(db.webhookSecretMasked ?? "");
              setPublishableKey(db.publishableKey ?? "");
              setError(null);
            }}
            disabled={formDisabled || validating || saving}
          >
            Cancel
          </Button>
        </div>
      </div>

      {/* Active config + clear */}
      {db.hasRow && (
        <div className="rounded-lg border p-4 space-y-3">
          <p className="text-sm font-medium">Active configuration</p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm max-w-md">
            {db.accountName && (
              <>
                <dt className="text-muted-foreground">Account</dt>
                <dd>{db.accountName}</dd>
              </>
            )}
            {db.accountId && (
              <>
                <dt className="text-muted-foreground">Account ID</dt>
                <dd className="font-mono text-xs">{db.accountId}</dd>
              </>
            )}
            {db.isTestMode !== null && (
              <>
                <dt className="text-muted-foreground">Mode</dt>
                <dd>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${db.isTestMode ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"}`}>
                    {db.isTestMode ? "Test Mode" : "Live Mode"}
                  </span>
                </dd>
              </>
            )}
            {db.lastValidatedAt && (
              <>
                <dt className="text-muted-foreground">Last validated</dt>
                <dd>{new Date(db.lastValidatedAt).toLocaleString()}</dd>
              </>
            )}
          </dl>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowClearModal(true)}
            disabled={clearing || saving}
          >
            {clearing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Clear DB credentials
          </Button>
          {envSecretSet && (
            <p className="text-xs text-muted-foreground">
              Environment variable <code className="bg-muted px-1 py-0.5 rounded">STRIPE_SECRET_KEY</code> is set and takes precedence over these saved credentials.
            </p>
          )}
        </div>
      )}

      {/* Validate confirm modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Stripe credentials?</DialogTitle>
            <DialogDescription>
              {validationResult && (
                <>
                  Validated successfully for{" "}
                  <strong>{validationResult.accountName}</strong> (
                  {validationResult.accountId},{" "}
                  {validationResult.country?.toUpperCase()},{" "}
                  {validationResult.currency?.toUpperCase()}).{" "}
                  {validationResult.isTestMode ? (
                    <span className="text-yellow-700 dark:text-yellow-400">This is a test mode key.</span>
                  ) : (
                    <span className="text-emerald-700 dark:text-emerald-400">This is a live mode key.</span>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear confirm modal */}
      <Dialog open={showClearModal} onOpenChange={setShowClearModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear DB credentials?</DialogTitle>
            <DialogDescription>
              This will remove DB-stored Stripe credentials. Stripe will fall back to environment variables if set. If environment variables are not set, payments will stop working.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClear} disabled={clearing}>
              {clearing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
