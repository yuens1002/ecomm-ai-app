"use client";

import {
  FaqItemBlock as FaqItemBlockType,
  FAQ_CATEGORIES,
} from "@/lib/blocks/schemas";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup } from "@/components/ui/field";
import { FormHeading } from "@/components/ui/app/FormHeading";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { BlockDialog } from "./BlockDialog";
import { FaqAccordionItem } from "@/app/(site)/_components/content/FaqAccordionItem";
import { useValidation } from "@/hooks/useFormDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FaqItemBlockProps {
  block: FaqItemBlockType;
  isEditing: boolean;
  onUpdate?: (block: FaqItemBlockType) => void;
  // Dialog control from BlockRenderer
  isDialogOpen?: boolean;
  onDialogOpenChange?: (open: boolean) => void;
}

export function FaqItemBlock({
  block,
  isEditing,
  onUpdate,
  isDialogOpen = false,
  onDialogOpenChange,
}: FaqItemBlockProps) {
  // For backward compatibility, use internal state if not controlled
  const [internalDialogOpen, setInternalDialogOpen] = useState(false);
  const dialogOpen = onDialogOpenChange ? isDialogOpen : internalDialogOpen;
  const setDialogOpen = onDialogOpenChange || setInternalDialogOpen;

  const [editedBlock, setEditedBlock] = useState(block);

  // Use validation hook for error state and toast
  const { errors, hasErrors, clearError, clearAllErrors, showValidationError } =
    useValidation<{ question?: string; answer?: string }>();

  // Sync editedBlock with block prop when it changes (after save)
  useEffect(() => {
    setEditedBlock(block);
  }, [block]);

  // Display mode (non-editing page view)
  // BlockRenderer handles deleted state and wrapper
  if (!isEditing) {
    return (
      <FaqAccordionItem
        question={block.content.question}
        answer={block.content.answer}
        isInteractive
      />
    );
  }

  // Save changes from dialog
  const handleSave = () => {
    // Validate required fields
    const fieldErrors: { question?: string; answer?: string } = {};

    if (!editedBlock.content.question.trim()) {
      fieldErrors.question = "Question is required";
    }

    if (!editedBlock.content.answer.trim()) {
      fieldErrors.answer = "Answer is required";
    }

    // Show toast and set errors if validation fails
    if (!showValidationError(fieldErrors)) {
      return;
    }

    onUpdate?.(editedBlock);
    setDialogOpen(false);
  };

  // Cancel changes
  const handleCancel = () => {
    setEditedBlock(block);
    clearAllErrors();
    setDialogOpen(false);
  };

  // Edit mode with dialog
  return (
    <>
      <BlockDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Edit FAQ Item Block"
        description={`Update the question and answer • ${editedBlock.content.answer.length} of 1000 characters`}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={hasErrors}>
              Save
            </Button>
          </>
        }
      >
        <FieldGroup>
          <Field>
            <FormHeading
              htmlFor={`faq-question-${block.id}`}
              label="Question"
              required={true}
              validationType={errors.question ? "error" : undefined}
              isDirty={editedBlock.content.question !== block.content.question}
              errorMessage={errors.question}
            />
            <Input
              id={`faq-question-${block.id}`}
              value={editedBlock.content.question}
              onChange={(e) => {
                setEditedBlock({
                  ...editedBlock,
                  content: {
                    ...editedBlock.content,
                    question: e.target.value,
                  },
                });
                if (errors.question) clearError("question");
              }}
              placeholder="What is your question?"
              maxLength={200}
              className={errors.question ? "border-destructive" : ""}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {editedBlock.content.question.length}/200 characters
            </p>
          </Field>
          <Field>
            <FormHeading
              htmlFor={`faq-answer-${block.id}`}
              label="Answer"
              required={true}
              validationType={errors.answer ? "error" : undefined}
              isDirty={editedBlock.content.answer !== block.content.answer}
              errorMessage={errors.answer}
            />
            <Textarea
              id={`faq-answer-${block.id}`}
              value={editedBlock.content.answer}
              onChange={(e) => {
                setEditedBlock({
                  ...editedBlock,
                  content: {
                    ...editedBlock.content,
                    answer: e.target.value,
                  },
                });
                if (errors.answer) clearError("answer");
              }}
              placeholder="Provide a detailed answer..."
              rows={4}
              maxLength={1000}
              className={errors.answer ? "border-destructive" : ""}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {editedBlock.content.answer.length}/1000 characters
            </p>
          </Field>
          <Field>
            <FormHeading
              htmlFor={`faq-category-${block.id}`}
              label="Category"
              required={true}
              isDirty={editedBlock.content.category !== block.content.category}
            />
            <Select
              value={editedBlock.content.category || "general"}
              onValueChange={(value) => {
                setEditedBlock({
                  ...editedBlock,
                  content: {
                    ...editedBlock.content,
                    category: value as typeof editedBlock.content.category,
                  },
                });
              }}
            >
              <SelectTrigger id={`faq-category-${block.id}`}>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {FAQ_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Group this FAQ under a category for easier navigation
            </p>
          </Field>
        </FieldGroup>
      </BlockDialog>

      {/* Display content - wrapper handled by BlockRenderer */}
      <FaqAccordionItem
        question={block.content.question}
        answer={block.content.answer}
      />
    </>
  );
}
