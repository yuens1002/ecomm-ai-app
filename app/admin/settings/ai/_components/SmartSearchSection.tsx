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
  const [saveStatuses, setSaveStatuses] = useState<SaveStatus[]>(
    DEFAULT_VOICE_EXAMPLES.map(() => "idle")
  );
  const timerRefs = useRef<(ReturnType<typeof setTimeout> | null)[]>(
    DEFAULT_VOICE_EXAMPLES.map(() => null)
  );

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

  const setFieldStatus = (index: number, status: SaveStatus) => {
    setSaveStatuses((prev) => {
      const next = [...prev];
      next[index] = status;
      return next;
    });
  };

  // Save a single field — sends full array but only field[index] changes
  const saveField = async (index: number, answer: string) => {
    if (timerRefs.current[index]) clearTimeout(timerRefs.current[index]);
    setFieldStatus(index, "saving");

    const examples: VoiceExample[] = VOICE_EXAMPLE_QUESTIONS.map((q, i) => ({
      question: q,
      answer: i === index ? answer : savedVoiceAnswers[i],
    }));

    try {
      const res = await fetch("/api/admin/settings/ai-search", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceExamples: examples }),
      });
      if (res.ok) {
        setSavedVoiceAnswers((prev) => {
          const next = [...prev];
          next[index] = answer;
          return next;
        });
        setFieldStatus(index, "saved");
        timerRefs.current[index] = setTimeout(
          () => setFieldStatus(index, "idle"),
          3000
        );
      } else {
        setFieldStatus(index, "idle");
      }
    } catch {
      setFieldStatus(index, "idle");
    }
  };

  const handleBlur = (index: number) => {
    if (voiceAnswers[index] !== savedVoiceAnswers[index]) {
      void saveField(index, voiceAnswers[index]);
    }
  };

  const handleResetOne = (index: number) => {
    const defaultAnswer = DEFAULT_VOICE_EXAMPLES[index].answer;
    setVoiceAnswers((prev) => {
      const next = [...prev];
      next[index] = defaultAnswer;
      return next;
    });
    void saveField(index, defaultAnswer);
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
    <div className="bg-card text-card-foreground rounded-xl border py-6 shadow-sm px-6 space-y-6">
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
          Smart Search lets customers find products by asking questions, with
          the AI responding in your voice. Your answers below train that voice
          — write them the way you&apos;d speak with your customers at the counter. Questions are
          fixed; answers are yours. Changes save automatically.
        </p>
      </div>

      {/* Voice Examples */}
      <div className="space-y-3 max-w-[72ch]">
        {VOICE_EXAMPLE_QUESTIONS.map((question, i) => (
          <InputGroup key={i}>
            {/* Block-start: question (left) · status + reset (right) */}
            <InputGroupAddon align="block-start" className="justify-between">
              <span className="text-sm truncate mr-2">{question}</span>
              <div className="flex items-center gap-1 shrink-0">
                {saveStatuses[i] !== "idle" && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        saveStatuses[i] === "saving"
                          ? "bg-amber-500 animate-pulse"
                          : "bg-green-500"
                      )}
                    />
                    {saveStatuses[i] === "saving" ? "Saving…" : "Saved"}
                  </span>
                )}
                <InputGroupButton
                  size="xs"
                  variant="ghost"
                  onClick={() => handleResetOne(i)}
                  disabled={saveStatuses[i] === "saving"}
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
              onBlur={() => handleBlur(i)}
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
  );
}
