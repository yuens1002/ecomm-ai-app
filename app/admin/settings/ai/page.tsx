"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, CheckCircle2, XCircle, Eye, EyeOff } from "lucide-react";
import { SettingsSection } from "@/app/admin/_components/forms/SettingsSection";
import { PageTitle } from "@/app/admin/_components/forms/PageTitle";
import { Field, FieldDescription } from "@/components/ui/field";
import { FormHeading } from "@/components/ui/forms/FormHeading";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SmartSearchSection } from "./_components/SmartSearchSection";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AI_PROVIDER_PRESETS } from "@/lib/ai-provider-presets";
import { IS_DEMO } from "@/lib/demo";

interface AISettingsData {
  baseUrl: string;
  apiKey: string;
  model: string;
  hasApiKey: boolean;
}

type TestStatus = "idle" | "testing" | "success" | "error";

export default function AISettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<AISettingsData>({
    baseUrl: "",
    apiKey: "",
    model: "",
    hasApiKey: false,
  });
  const [original, setOriginal] = useState<AISettingsData>(settings);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [testMessage, setTestMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/settings/ai");
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        setSettings(data);
        setOriginal(data);
      } catch {
        toast({
          title: "Error",
          description: "Failed to load AI settings",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [toast]);

  const isDirty =
    settings.baseUrl !== original.baseUrl ||
    settings.apiKey !== original.apiKey ||
    settings.model !== original.model;

  const handleSave = useCallback(async () => {
    if (IS_DEMO) { toast({ title: "Changes are disabled in demo mode.", variant: "demo" }); setSettings(original); return; }
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/settings/ai", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl: settings.baseUrl,
          apiKey: settings.apiKey,
          model: settings.model,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");
      const data = await res.json();
      setSettings(data);
      setOriginal(data);
      toast({ title: "Success", description: "AI settings saved" });
    } catch {
      toast({
        title: "Error",
        description: "Failed to save AI settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [settings, original, toast]);

  const handleTest = useCallback(async () => {
    setTestStatus("testing");
    setTestMessage("");
    try {
      const res = await fetch("/api/admin/settings/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl: settings.baseUrl,
          apiKey: settings.apiKey,
          model: settings.model,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setTestStatus("error");
        setTestMessage(data.error || "Connection failed");
        return;
      }

      setTestStatus("success");
      setTestMessage(`Connected — ${data.model} (${data.responseTime}ms)`);
    } catch {
      setTestStatus("error");
      setTestMessage("Connection failed. Check your settings.");
    }
  }, [settings]);

  const handlePreset = useCallback(
    (presetId: string) => {
      const preset = AI_PROVIDER_PRESETS[presetId];
      if (!preset) return;
      setSettings((prev) => ({
        ...prev,
        baseUrl: preset.baseUrl,
        model: prev.model || preset.modelHint,
      }));
      setTestStatus("idle");
      setTestMessage("");
    },
    []
  );

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageTitle title="AI Settings" subtitle="Configure your AI provider" />
        <div className="h-64 bg-muted animate-pulse rounded-md" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageTitle
        title="AI Settings"
        subtitle="Configure your LLM provider for AI-powered features"
      />

      <SettingsSection
        title="Provider Configuration"
        description="Connect any OpenAI-compatible AI provider. Choose a preset or enter custom settings."
      >
        {/* Provider preset */}
        <Field>
          <FormHeading label="Quick Setup" />
          <Select onValueChange={handlePreset}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Choose a provider preset..." />
            </SelectTrigger>
            <SelectContent position="popper" side="bottom" align="start" sideOffset={4}>
              {Object.entries(AI_PROVIDER_PRESETS).map(([id, preset]) => (
                <SelectItem key={id} value={id}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldDescription>
            Auto-fills Base URL. You can customize after selecting.
          </FieldDescription>
        </Field>

        {/* Base URL */}
        <Field>
          <FormHeading
            htmlFor="ai-base-url"
            label="Base URL"
            isDirty={settings.baseUrl !== original.baseUrl}
          />
          <Input
            id="ai-base-url"
            placeholder="https://api.openai.com/v1"
            value={settings.baseUrl}
            onChange={(e) => {
              setSettings((prev) => ({ ...prev, baseUrl: e.target.value }));
              setTestStatus("idle");
            }}
            className={`max-w-[72ch] ${settings.baseUrl !== original.baseUrl ? "border-amber-500" : ""}`}
          />
          <FieldDescription>
            OpenAI-compatible API endpoint (must support /chat/completions)
          </FieldDescription>
        </Field>

        {/* API Key */}
        <Field>
          <FormHeading
            htmlFor="ai-api-key"
            label="API Key"
            isDirty={settings.apiKey !== original.apiKey}
          />
          <div className="relative max-w-sm">
            <Input
              id="ai-api-key"
              type={showApiKey ? "text" : "password"}
              placeholder={settings.hasApiKey ? "••••••••(saved)" : "Enter API key"}
              value={settings.apiKey}
              onChange={(e) => {
                setSettings((prev) => ({ ...prev, apiKey: e.target.value }));
                setTestStatus("idle");
              }}
              className={settings.apiKey !== original.apiKey ? "border-amber-500 pr-10" : "pr-10"}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setShowApiKey((v) => !v)}
            >
              {showApiKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          <FieldDescription>
            Optional for local providers (e.g., Ollama)
          </FieldDescription>
        </Field>

        {/* Model */}
        <Field>
          <FormHeading
            htmlFor="ai-model"
            label="Model"
            isDirty={settings.model !== original.model}
          />
          <Input
            id="ai-model"
            placeholder="gpt-4o-mini"
            value={settings.model}
            onChange={(e) => {
              setSettings((prev) => ({ ...prev, model: e.target.value }));
              setTestStatus("idle");
            }}
            className={`max-w-xs ${settings.model !== original.model ? "border-amber-500" : ""}`}
          />
          <FieldDescription>
            Model identifier (e.g., gpt-4o-mini, gemini-2.5-flash, llama3.2)
          </FieldDescription>
        </Field>

        {/* Actions row */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            onClick={handleTest}
            variant="outline"
            disabled={!settings.baseUrl || !settings.model || testStatus === "testing"}
          >
            {testStatus === "testing" && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Test Connection
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>

          {/* Test result */}
          {testStatus === "success" && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              {testMessage}
            </span>
          )}
          {testStatus === "error" && (
            <span className="flex items-center gap-1 text-sm text-destructive">
              <XCircle className="h-4 w-4" />
              {testMessage}
            </span>
          )}
        </div>
      </SettingsSection>

      <SmartSearchSection />
    </div>
  );
}
