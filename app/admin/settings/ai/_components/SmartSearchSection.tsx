"use client";

import { useState, useEffect, useRef } from "react";
import { Undo2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DEFAULT_VOICE_EXAMPLES,
  VOICE_EXAMPLE_QUESTIONS,
  type VoiceExample,
} from "@/lib/ai/voice-examples";

type SaveStatus = "idle" | "saving" | "saved";

const MAX_ANSWER_LENGTH = 280;

export function SmartSearchSection() {
  const [loading, setLoading] = useState(true);
  const [voiceAnswers, setVoiceAnswers] = useState<string[]>(
    DEFAULT_VOICE_EXAMPLES.map((e) => e.answer)
  );
  const [savedVoiceAnswers, setSavedVoiceAnswers] = useState<string[]>(
    DEFAULT_VOICE_EXAMPLES.map((e) => e.answer)
  );
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [smartSearchEnabled, setSmartSearchEnabled] = useState(true);
  const [savingToggle, setSavingToggle] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings/ai-search")
      .then((r) => r.json())
      .then(
        (data: { voiceExamples?: VoiceExample[]; smartSearchEnabled?: boolean }) => {
          if (data.voiceExamples && data.voiceExamples.length > 0) {
            const answers = VOICE_EXAMPLE_QUESTIONS.map((q, i) => {
              const stored = data.voiceExamples!.find((e) => e.question === q);
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

  const saveExamples = async (answers: string[]) => {
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    setSaveStatus("saving");
    try {
      const examples: VoiceExample[] = VOICE_EXAMPLE_QUESTIONS.map((q, i) => ({
        question: q,
        answer: answers[i],
      }));
      const res = await fetch("/api/admin/settings/ai-search", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceExamples: examples }),
      });
      if (res.ok) {
        setSavedVoiceAnswers([...answers]);
        setSaveStatus("saved");
        savedTimerRef.current = setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        setSaveStatus("idle");
      }
    } catch {
      setSaveStatus("idle");
    }
  };

  const handleBlur = (currentAnswers: string[]) => {
    const isDirty = currentAnswers.some((a, i) => a !== savedVoiceAnswers[i]);
    if (isDirty) void saveExamples(currentAnswers);
  };

  const handleResetToDefaults = () => {
    const defaults = DEFAULT_VOICE_EXAMPLES.map((e) => e.answer);
    setVoiceAnswers(defaults);
    void saveExamples(defaults);
  };

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

  if (loading) return null;

  return (
    <div className="rounded-lg border p-6 space-y-8">
      {/* Title + description */}
      <div>
        <h3 className="text-base font-semibold">Smart Search</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-[72ch]">
          Let customers chat with your store and get product recommendations in
          your voice. Edit the answers below to teach the AI how you actually
          talk — questions are fixed so the AI learns from consistent cues.
          Changes save automatically.
        </p>
      </div>

      {/* Enable toggle: title left, Switch right */}
      <div className="flex items-center justify-between max-w-[72ch]">
        <div className="space-y-1">
          <Label htmlFor="smart-search-enabled" className="text-sm font-medium">
            Enable Smart Search
          </Label>
          <p className="text-xs text-muted-foreground">
            Shows the Counter chat icon in the storefront header.
          </p>
        </div>
        <Switch
          id="smart-search-enabled"
          checked={smartSearchEnabled}
          onCheckedChange={handleToggleSmartSearch}
          disabled={savingToggle}
        />
      </div>

      {/* Voice Examples */}
      <div className="space-y-4 border-t pt-6">
        <div>
          <h4 className="text-sm font-medium">Your Voice</h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-[72ch]">
            These answers teach the AI your tone. Write them the way you&apos;d
            actually say it at the counter.
          </p>
        </div>

        <div className="space-y-5 max-w-[72ch]">
          {VOICE_EXAMPLE_QUESTIONS.map((question, i) => (
            <div key={i} className="space-y-1.5">
              <Label
                htmlFor={`voice-example-${i}`}
                className="text-xs font-medium text-muted-foreground"
              >
                &ldquo;{question}&rdquo;
              </Label>
              <Textarea
                id={`voice-example-${i}`}
                value={voiceAnswers[i]}
                maxLength={MAX_ANSWER_LENGTH}
                onChange={(e) => {
                  const next = [...voiceAnswers];
                  next[i] = e.target.value;
                  setVoiceAnswers(next);
                }}
                onBlur={() => handleBlur(voiceAnswers)}
                className="text-sm min-h-[80px] resize-y"
              />
              <p className="text-[11px] text-muted-foreground text-right">
                {voiceAnswers[i].length}/{MAX_ANSWER_LENGTH}
              </p>
            </div>
          ))}
        </div>

        {/* Status row: Reset (left) · ● status (right) */}
        <div className="flex items-center justify-between max-w-[72ch] pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetToDefaults}
            disabled={saveStatus === "saving"}
            className="text-muted-foreground hover:text-foreground -ml-2"
          >
            <Undo2 className="h-3.5 w-3.5 mr-1.5" />
            Reset to defaults
          </Button>

          {saveStatus !== "idle" && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  saveStatus === "saving"
                    ? "bg-amber-500 animate-pulse"
                    : "bg-green-500"
                )}
              />
              {saveStatus === "saving" ? "Saving…" : "Saved"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
