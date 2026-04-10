"use client";

import { useState, useEffect } from "react";
import { Wand2, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function AISearchSettingsSection() {
  const [persona, setPersona] = useState("");
  const [savedPersona, setSavedPersona] = useState("");
  const [reframing, setReframing] = useState(false);
  const [reframed, setReframed] = useState<string | null>(null);
  const [originalForRetry, setOriginalForRetry] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/settings/ai-search")
      .then((r) => r.json())
      .then((data: { aiVoicePersona?: string }) => {
        const value = data.aiVoicePersona ?? "";
        setPersona(value);
        setSavedPersona(value);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleReframe = async (input: string) => {
    setReframing(true);
    setReframed(null);
    setOriginalForRetry(input);
    try {
      const res = await fetch("/api/admin/reframe-voice-persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawPersona: input }),
      });
      const data = (await res.json()) as { reframedPersona?: string };
      if (res.ok && data.reframedPersona) {
        setReframed(data.reframedPersona);
      }
    } finally {
      setReframing(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/ai-search", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiVoicePersona: persona }),
      });
      if (res.ok) {
        setSavedPersona(persona);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  };

  const isDirty = persona !== savedPersona;

  if (loading) return null;

  return (
    <div className="rounded-lg border p-6 space-y-6">
      <div>
        <h3 className="text-base font-semibold">Smart Search</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Give your AI search assistant a voice that reflects how you talk about
          coffee with your customers.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="voice-persona">Your Coffee Voice</Label>
        <p className="text-xs text-muted-foreground">
          Write a few sentences about how you talk about coffee with your
          customers — your philosophy, what you love to highlight, how you&apos;d
          answer &quot;what should I try?&quot; at the counter. The AI will
          speak in your voice.
        </p>
        <Textarea
          id="voice-persona"
          value={persona}
          onChange={(e) => setPersona(e.target.value)}
          placeholder="We're obsessed with transparency and traceability. Every coffee we carry has a story — the farmer, the altitude, the processing method. When someone asks what to try, I always start with where they like to brew..."
          className="max-w-[72ch] min-h-[120px] resize-y"
          disabled={loading}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleReframe(persona)}
          disabled={reframing || !persona.trim()}
        >
          <Wand2 className="h-3.5 w-3.5 mr-1.5" />
          {reframing ? "Reframing…" : "Reframe with AI"}
        </Button>
      </div>

      {reframed && (
        <div className="rounded-md border bg-muted/40 p-4 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            AI Suggestion
          </p>
          <p className="text-sm whitespace-pre-wrap">{reframed}</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => {
                setPersona(reframed);
                setReframed(null);
              }}
            >
              <Check className="h-3.5 w-3.5 mr-1.5" />
              Use this
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleReframe(originalForRetry)}
              disabled={reframing}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Try again
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col mt-auto pt-5">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving || !isDirty}
          className="w-fit"
        >
          {saved ? "Saved" : saving ? "Saving…" : "Save Voice"}
        </Button>
      </div>
    </div>
  );
}
