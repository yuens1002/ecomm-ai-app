import { z } from "zod";

export const feedbackSchema = z.object({
  message: z.string().min(10, "Please provide at least 10 characters"),
  type: z.enum(["bug", "feature", "other"]),
  email: z.string().email().optional().or(z.literal("")),
});

export type FeedbackData = z.infer<typeof feedbackSchema>;

export const feedbackTypeLabels: Record<FeedbackData["type"], string> = {
  bug: "Bug Report",
  feature: "Feature Request",
  other: "Other Feedback",
};

export const feedbackTypeEmojis: Record<FeedbackData["type"], string> = {
  bug: "bug",
  feature: "enhancement",
  other: "question",
};
