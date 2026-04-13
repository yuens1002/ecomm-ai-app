"use client";

import { useState, useEffect, useRef } from "react";
import { Undo2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupTextarea,
  InputGroupText,
  InputGroupButton,
} from "@/components/ui/forms/InputGroup";
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

  const handleResetOne = (index: number) => {
    const next = [...voiceAnswers];
    next[index] = DEFAULT_VOICE_EXAMPLES[index].answer;
    setVoiceAnswers(next);
    void saveExamples(next);
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
    <div className="rounded-lg border p-6 space-y-6">
      {/* Title row: heading left, toggle right */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Smart Search</h3>
          <Switch
            id="smart-search-enabled"
            checked={smartSearchEnabled}
            onCheckedChange={handleToggleSmartSearch}
            disabled={savingToggle}
          />
        </div>
        <p className="text-sm text-muted-foreground max-w-[72ch]">
          Let customers chat with your store and get product recommendations in
          your voice. Edit the answers below to teach the AI how you talk —
          questions are fixed so the AI learns from consistent cues. Changes
          save automatically.
        </p>
      </div>

      {/* Voice Examples */}
      <div className="space-y-4 border-t pt-6">
        <div>
          <h4 className="text-sm font-medium">Your Voice</h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-[72ch]">
            Write these the way you&apos;d actually say it at the counter.
          </p>
        </div>

        <div className="space-y-3 max-w-[72ch]">
          {VOICE_EXAMPLE_QUESTIONS.map((question, i) => (
            <InputGroup key={i}>
              {/* Block-start: question + reset + status */}
              <InputGroupAddon align="block-start" className="justify-between">
                <span className="text-xs text-muted-foreground truncate mr-2">
                  &ldquo;{question}&rdquo;
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  {saveStatus !== "idle" && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
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
                  <InputGroupButton
                    size="xs"
                    variant="ghost"
                    onClick={() => handleResetOne(i)}
                    disabled={saveStatus === "saving"}
                    title="Reset to default"
                  >
                    <Undo2 className="h-3 w-3" />
                    Reset
                  </InputGroupButton>
                </div>
              </InputGroupAddon>

              {/* Textarea */}
              <InputGroupTextarea
                id={`voice-example-${i}`}
                value={voiceAnswers[i]}
                maxLength={MAX_ANSWER_LENGTH}
                rows={3}
                onChange={(e) => {
                  const next = [...voiceAnswers];
                  next[i] = e.target.value;
                  setVoiceAnswers(next);
                }}
                onBlur={() => handleBlur(voiceAnswers)}
              />

              {/* Block-end: char count */}
              <InputGroupAddon align="block-end">
                <InputGroupText className="text-xs">
                  {voiceAnswers[i].length}/{MAX_ANSWER_LENGTH}
                </InputGroupText>
              </InputGroupAddon>
            </InputGroup>
          ))}
        </div>
      </div>
    </div>
  );
}
