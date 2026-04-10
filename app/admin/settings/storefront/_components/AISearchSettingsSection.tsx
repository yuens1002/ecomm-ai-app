"use client";

import { useState, useEffect } from "react";
import { Sparkles, RotateCcw, Check, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SmartSearchIcon } from "@/components/shared/icons/SmartSearchIcon";

interface Conversation {
  question: string;
  answer: string;
}

type Mode = "edit" | "preview";

export function AISearchSettingsSection() {
  const [persona, setPersona] = useState("");
  const [savedPersona, setSavedPersona] = useState("");
  const [mode, setMode] = useState<Mode>("edit");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [previewing, setPreviewing] = useState(false);
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

  const handlePreview = async () => {
    if (!persona.trim()) return;
    setPreviewing(true);
    setConversations([]);
    try {
      const res = await fetch("/api/admin/reframe-voice-persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawPersona: persona }),
      });
      const data = (await res.json()) as { conversations?: Conversation[] };
      if (res.ok && data.conversations?.length) {
        setConversations(data.conversations);
        setMode("preview");
      }
    } finally {
      setPreviewing(false);
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
        setMode("edit");
        setTimeout(() => setSaved(false), 2500);
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

      {mode === "edit" ? (
        /* ── Edit mode ───────────────────────────────────────────── */
        <>
          <div className="space-y-2">
            <Label htmlFor="voice-persona">Your Coffee Voice</Label>
            <p className="text-xs text-muted-foreground">
              Write a few sentences about how you talk about coffee with your
              customers — your philosophy, what you love to highlight, how you&apos;d
              answer &quot;what should I try?&quot; at the counter.
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

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
              disabled={previewing || !persona.trim()}
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              {previewing ? "Generating preview…" : "See how I sound"}
            </Button>

            {isDirty && (
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
              >
                {saved ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1.5" />
                    Saved
                  </>
                ) : saving ? (
                  "Saving…"
                ) : (
                  "Save Voice"
                )}
              </Button>
            )}
          </div>
        </>
      ) : (
        /* ── Preview mode ────────────────────────────────────────── */
        <>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Here&apos;s how you sound to customers
            </p>
            <p className="text-xs text-muted-foreground">
              This is how your AI would respond in your voice.
            </p>
          </div>

          <div className="space-y-5 max-w-[72ch]">
            {conversations.map((conv, i) => (
              <div key={i} className="space-y-2">
                {/* Customer question */}
                <div className="flex justify-end">
                  <div className="bg-muted text-foreground text-sm px-3.5 py-2 rounded-2xl max-w-[85%] leading-snug">
                    {conv.question}
                  </div>
                </div>
                {/* AI response in persona */}
                <div className="flex items-start gap-2">
                  <SmartSearchIcon className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary/50" />
                  <p className="text-sm text-foreground/80 leading-relaxed">{conv.answer}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? (
                "Saving…"
              ) : (
                <>
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                  {saved ? "Saved!" : "This sounds like me — Save"}
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setMode("edit")}
              disabled={saving}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Adjust
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handlePreview}
              disabled={previewing}
              className="text-muted-foreground"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-0.5" />
              {previewing ? "Regenerating…" : "Try again"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
