"use client";

import { useState, useEffect } from "react";
import { Sparkles, Check, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_VOICE_EXAMPLES,
  VOICE_EXAMPLE_QUESTIONS,
  type VoiceExample,
} from "@/lib/ai/voice-examples";

export function AISearchSettingsSection() {
  const [loading, setLoading] = useState(true);

  // Voice examples state — answers only (questions are fixed)
  const [voiceAnswers, setVoiceAnswers] = useState<string[]>(
    DEFAULT_VOICE_EXAMPLES.map((e) => e.answer)
  );
  const [savedVoiceAnswers, setSavedVoiceAnswers] = useState<string[]>(
    DEFAULT_VOICE_EXAMPLES.map((e) => e.answer)
  );
  const [savingExamples, setSavingExamples] = useState(false);
  const [savedExamples, setSavedExamples] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerated, setRegenerated] = useState(false);

  // Smart Search Assistant enable/disable toggle
  const [smartSearchEnabled, setSmartSearchEnabled] = useState(true);
  const [savingToggle, setSavingToggle] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings/ai-search")
      .then((r) => r.json())
      .then(
        (data: {
          voiceExamples?: VoiceExample[];
          smartSearchEnabled?: boolean;
        }) => {
          // If owner has saved custom answers, use those; otherwise keep defaults
          if (data.voiceExamples && data.voiceExamples.length > 0) {
            const answers = VOICE_EXAMPLE_QUESTIONS.map((q, i) => {
              const stored = data.voiceExamples!.find(
                (e) => e.question === q
              );
              return stored?.answer ?? DEFAULT_VOICE_EXAMPLES[i].answer;
            });
            setVoiceAnswers(answers);
            setSavedVoiceAnswers(answers);
          }

          if (typeof data.smartSearchEnabled === "boolean") {
            setSmartSearchEnabled(data.smartSearchEnabled);
          }
          setLoading(false);
        }
      )
      .catch(() => setLoading(false));
  }, []);

  const handleToggleSmartSearch = async (next: boolean) => {
    setSavingToggle(true);
    setSmartSearchEnabled(next);
    try {
      await fetch("/api/admin/settings/ai-search", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ smartSearchEnabled: next }),
      });
    } finally {
      setSavingToggle(false);
    }
  };

  const handleSaveExamples = async () => {
    setSavingExamples(true);
    try {
      const examples: VoiceExample[] = VOICE_EXAMPLE_QUESTIONS.map((q, i) => ({
        question: q,
        answer: voiceAnswers[i],
      }));
      const res = await fetch("/api/admin/settings/ai-search", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceExamples: examples }),
      });
      if (res.ok) {
        setSavedVoiceAnswers([...voiceAnswers]);
        setSavedExamples(true);
        setTimeout(() => setSavedExamples(false), 2500);
      }
    } finally {
      setSavingExamples(false);
    }
  };

  const handleResetAnswer = (index: number) => {
    setVoiceAnswers((prev) => {
      const next = [...prev];
      next[index] = DEFAULT_VOICE_EXAMPLES[index].answer;
      return next;
    });
  };

  const handleAnswerChange = (index: number, value: string) => {
    setVoiceAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleRegenerateSurfaces = async () => {
    setRegenerating(true);
    try {
      const res = await fetch(
        "/api/admin/settings/ai-search/regenerate-surfaces",
        { method: "POST" }
      );
      if (res.ok) {
        setRegenerated(true);
        setTimeout(() => setRegenerated(false), 2500);
      }
    } finally {
      setRegenerating(false);
    }
  };

  const isExamplesDirty = voiceAnswers.some(
    (a, i) => a !== savedVoiceAnswers[i]
  );

  if (loading) return null;

  return (
    <div className="rounded-lg border p-6 space-y-8">
      <div>
        <h3 className="text-base font-semibold">Smart Search Assistant</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-[72ch]">
          Give your Smart Search Assistant a voice that reflects how you talk
          to customers in your shop. The Q&amp;A pairs below teach the AI your
          tone — edit the answers to match how you&apos;d actually respond at
          the counter.
        </p>
      </div>

      {/* Enable/disable toggle */}
      <div className="flex items-start justify-between gap-4 max-w-[72ch]">
        <div className="space-y-1">
          <Label htmlFor="smart-search-enabled" className="text-sm font-medium">
            Enable Smart Search Assistant
          </Label>
          <p className="text-xs text-muted-foreground">
            When on, customers see the chat icon in the header and can converse
            with the assistant. Turn off to hide it from the storefront without
            losing your voice settings.
          </p>
        </div>
        <Switch
          id="smart-search-enabled"
          checked={smartSearchEnabled}
          onCheckedChange={handleToggleSmartSearch}
          disabled={savingToggle}
        />
      </div>

      {/* ── Voice Examples ────────────────────────────────────── */}
      <div className="space-y-4 border-t pt-6">
        <div>
          <h4 className="text-sm font-medium">Voice Examples</h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-[72ch]">
            These Q&amp;A pairs teach the AI how you actually talk. Edit the
            answers to sound like you — the questions are fixed on purpose so
            the AI learns your voice from consistent prompts.
          </p>
        </div>

            <div className="space-y-5 max-w-[72ch]">
              {VOICE_EXAMPLE_QUESTIONS.map((question, i) => {
                const isDefault =
                  voiceAnswers[i] === DEFAULT_VOICE_EXAMPLES[i].answer;
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor={`voice-example-${i}`}
                        className="text-xs font-medium text-muted-foreground"
                      >
                        &ldquo;{question}&rdquo;
                      </Label>
                      {!isDefault && (
                        <button
                          type="button"
                          onClick={() => handleResetAnswer(i)}
                          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Undo2 className="h-3 w-3" />
                          Reset to default
                        </button>
                      )}
                    </div>
                    <Textarea
                      id={`voice-example-${i}`}
                      value={voiceAnswers[i]}
                      onChange={(e) => handleAnswerChange(i, e.target.value)}
                      className="text-sm min-h-[80px] resize-y"
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {isExamplesDirty && (
                <Button
                  size="sm"
                  onClick={handleSaveExamples}
                  disabled={savingExamples}
                >
                  {savedExamples ? (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1.5" />
                      Saved
                    </>
                  ) : savingExamples ? (
                    "Saving…"
                  ) : (
                    "Save Examples"
                  )}
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerateSurfaces}
                disabled={regenerating}
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                {regenerated
                  ? "Updated!"
                  : regenerating
                    ? "Updating…"
                    : "Update how AI sounds"}
              </Button>
        </div>
      </div>
    </div>
  );
}
