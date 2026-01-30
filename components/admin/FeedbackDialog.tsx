"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FeedbackData, feedbackTypeLabels } from "@/lib/feedback";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GITHUB_DISCUSSIONS_URL = "https://github.com/yuens1002/ecomm-ai-app/discussions";

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FeedbackData>({
    message: "",
    type: "feature",
    email: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.message.trim().length < 10) {
      toast({
        title: "Message too short",
        description: "Please provide at least 10 characters of feedback.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit feedback");
      }

      toast({
        title: "Feedback submitted",
        description: data.message || "Thank you for your feedback!",
      });

      // Reset form and close dialog
      setFormData({ message: "", type: "feature", email: "" });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <FieldSet>
              <FieldLegend>Share Feedback</FieldLegend>
              <FieldDescription>
                Help us improve Artisan Roast. Your feedback goes directly to our team.
              </FieldDescription>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="message">What&apos;s on your mind?</FieldLabel>
                  <Textarea
                    id="message"
                    placeholder="Describe your feedback, bug report, or feature request..."
                    value={formData.message}
                    onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                    rows={4}
                    required
                    minLength={10}
                    disabled={isSubmitting}
                  />
                </Field>

                <Field>
                  <FieldLabel>Type of feedback</FieldLabel>
                  <RadioGroup
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        type: value as FeedbackData["type"],
                      }))
                    }
                    className="flex flex-wrap gap-4"
                    disabled={isSubmitting}
                  >
                    {(Object.keys(feedbackTypeLabels) as FeedbackData["type"][]).map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <RadioGroupItem value={type} id={type} />
                        <FieldLabel htmlFor={type} className="font-normal cursor-pointer">
                          {feedbackTypeLabels[type]}
                        </FieldLabel>
                      </div>
                    ))}
                  </RadioGroup>
                </Field>

                <Field>
                  <FieldLabel htmlFor="email">Email (optional)</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    disabled={isSubmitting}
                  />
                  <FieldDescription>
                    Include if you&apos;d like us to follow up with you.
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </FieldSet>

            <Field orientation="horizontal">
              <Button variant="link" asChild className="mr-auto">
                <Link href={GITHUB_DISCUSSIONS_URL} target="_blank" rel="noopener noreferrer">
                  <ChevronLeft /> Discuss on GitHub
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
