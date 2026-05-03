"use client";

import { useState, useEffect, useCallback } from "react";
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, Circle, XCircle } from "lucide-react";
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

type SaveStep = "idle" | "verifying" | "saving" | "done" | "error";
type IconState = "none" | "muted" | "green" | "error";

function resolveIconState(value: string, dirty: boolean, saveStep: SaveStep): IconState {
  if (!value) return "none";
  if (saveStep === "error") return "error";
  if (!dirty || saveStep === "done") return "green"; // pre-populated from DB or just verified
  return "muted";
}

function FieldIcon({ state }: { state: IconState }) {
  if (state === "none") return <span className="w-4 shrink-0" />;
  if (state === "green") return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
  if (state === "error") return <XCircle className="h-4 w-4 text-destructive shrink-0" />;
  return <Circle className="h-4 w-4 text-muted-foreground/30 shrink-0" />;
}

export function StripeCredentialsForm() {
  const [config, setConfig] = useState<StripeConfigResponse | null>(null);
  const [fetching, setFetching] = useState(true);
  const [secretKey, setSecretKey] = useState("");
  const [publishableKey, setPublishableKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [secretDirty, setSecretDirty] = useState(false);
  const [pubDirty, setPubDirty] = useState(false);
  const [webhookDirty, setWebhookDirty] = useState(false);
  const [secretVisible, setSecretVisible] = useState(false);
  const [webhookVisible, setWebhookVisible] = useState(false);
  const [saveStep, setSaveStep] = useState<SaveStep>("idle");
  const [stepLabel, setStepLabel] = useState("");
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings/stripe");
      if (res.ok) {
        const data: StripeConfigResponse = await res.json();
        setConfig(data);
        if (data.db.secretKeyMasked) setSecretKey(data.db.secretKeyMasked);
        if (data.db.webhookSecretMasked) setWebhookSecret(data.db.webhookSecretMasked);
        if (data.db.publishableKey) setPublishableKey(data.db.publishableKey);
        // Reset dirty: these values came from DB and are already verified
        setSecretDirty(false);
        setPubDirty(false);
        setWebhookDirty(false);
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

  const isBusy = saveStep === "verifying" || saveStep === "saving";
  const isDev = process.env.NODE_ENV === "development";

  const simulateSave = async () => {
    setError(null);
    setSaveStep("verifying");
    setStepLabel("Verifying with Stripe…");
    await new Promise((r) => setTimeout(r, 2000));
    setSaveStep("saving");
    setStepLabel("Saving credentials…");
    await new Promise((r) => setTimeout(r, 1500));
    setSaveStep("done");
    setTimeout(() => setSaveStep("idle"), 3000);
  };

  const handleSave = async () => {
    setError(null);
    setSaveStep("verifying");
    setStepLabel("Verifying with Stripe…");
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
        setSaveStep("error");
        setError(data.error ?? "Could not save credentials. Please try again.");
        return;
      }
      setStepLabel("Saving credentials…");
      setSaveStep("saving");
      await new Promise((r) => setTimeout(r, 400));
      await fetchConfig();
      setSaveStep("done");
      setTimeout(() => setSaveStep("idle"), 3000);
    } catch {
      setSaveStep("error");
      setError("Could not connect to server. Please try again.");
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
        setError(data.error ?? "Disconnect failed");
        return;
      }
      setSecretKey("");
      setPublishableKey("");
      setWebhookSecret("");
      setSaveStep("idle");
      await fetchConfig();
    } finally {
      setClearing(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading Stripe configuration…
      </div>
    );
  }

  const { db } = config!;
  const noKeysConfigured = !db.hasRow;

  return (
    <div className="space-y-6">
      {/* Banner: only shown when no keys are saved */}
      {noKeysConfigured && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800 p-4 w-full max-w-[72ch]">
          <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Stripe is not connected — the store cannot accept payments until you add the API keys below.
          </div>
        </div>
      )}

      {/* Credentials form */}
      <div className="space-y-4">
        {/* Secret Key */}
        <div className="space-y-2">
          <Label htmlFor="stripe-secret-key">
            Secret Key
            {secretMode === "test" && (
              <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 font-medium">
                Test Mode
              </span>
            )}
            {secretMode === "live" && (
              <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium">
                Live Mode
              </span>
            )}
          </Label>
          <div className="flex items-center gap-2">
            <div className="relative w-full max-w-[72ch]">
              <Input
                id="stripe-secret-key"
                type={secretVisible ? "text" : "password"}
                placeholder={db.hasSecretKey ? "Re-enter to change" : "sk_test_… or sk_live_…"}
                value={secretKey}
                onChange={(e) => {
                  setSecretKey(e.target.value);
                  setSecretDirty(true);
                  setError(null);
                  setSaveStep("idle");
                }}
                disabled={isBusy}
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
            <FieldIcon state={resolveIconState(secretKey, secretDirty, saveStep)} />
          </div>
        </div>

        {/* Publishable Key */}
        <div className="space-y-2">
          <Label htmlFor="stripe-publishable-key">Publishable Key</Label>
          <div className="flex items-center gap-2">
            <div className="relative w-full max-w-[72ch]">
              <Input
                id="stripe-publishable-key"
                type="text"
                placeholder="pk_test_… or pk_live_…"
                value={publishableKey}
                onChange={(e) => {
                  setPublishableKey(e.target.value);
                  setPubDirty(true);
                  setError(null);
                  setSaveStep("idle");
                }}
                disabled={isBusy}
              />
            </div>
            <FieldIcon state={resolveIconState(publishableKey, pubDirty, saveStep)} />
          </div>
        </div>

        {/* Webhook Secret */}
        <div className="space-y-2">
          <Label htmlFor="stripe-webhook-secret">Webhook Secret</Label>
          <div className="flex items-center gap-2">
            <div className="relative w-full max-w-[72ch]">
              <Input
                id="stripe-webhook-secret"
                type={webhookVisible ? "text" : "password"}
                placeholder={db.hasWebhookSecret ? "Re-enter to change" : "whsec_…"}
                value={webhookSecret}
                onChange={(e) => {
                  setWebhookSecret(e.target.value);
                  setWebhookDirty(true);
                  setError(null);
                  setSaveStep("idle");
                }}
                disabled={isBusy}
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
            <FieldIcon state={resolveIconState(webhookSecret, webhookDirty, saveStep)} />
          </div>
          <p className="text-xs text-muted-foreground">
            Required to receive order confirmations from Stripe.
          </p>
        </div>

        {/* Save button + inline status */}
        <div className="flex items-center gap-3 w-full max-w-[72ch]">
          {isDev && (
            <Button variant="outline" size="sm" onClick={simulateSave} disabled={isBusy} className="text-xs text-muted-foreground">
              Simulate
            </Button>
          )}
          <Button onClick={handleSave} disabled={isBusy}>
            {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isBusy ? "Saving" : "Save"}
          </Button>
          <span className="ml-auto text-sm text-right">
            {isBusy && (
              <span className="flex flex-col items-end text-muted-foreground">
                <span>{stepLabel}</span>
                <span className="text-xs">This may take a few seconds — hang tight.</span>
              </span>
            )}
            {saveStep === "done" && (
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Saved successfully.
              </span>
            )}
            {saveStep === "error" && error && (
              <span className="flex items-center gap-1.5 text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Active configuration details */}
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
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      db.isTestMode
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                    }`}
                  >
                    {db.isTestMode ? "Test Mode" : "Live Mode"}
                  </span>
                </dd>
              </>
            )}
            {db.lastValidatedAt && (
              <>
                <dt className="text-muted-foreground">Last verified</dt>
                <dd>{new Date(db.lastValidatedAt).toLocaleString()}</dd>
              </>
            )}
          </dl>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowClearModal(true)}
            disabled={clearing || isBusy}
          >
            {clearing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Disconnect Stripe
          </Button>
        </div>
      )}

      {/* Disconnect confirm modal */}
      <Dialog open={showClearModal} onOpenChange={setShowClearModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect Stripe?</DialogTitle>
            <DialogDescription>
              This will remove your saved Stripe keys. Payments will stop working until you add new keys.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClear} disabled={clearing}>
              {clearing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
