"use client";

import { FaqItemBlock as FaqItemBlockType } from "@/lib/blocks/schemas";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup } from "@/components/ui/field";
import { FormHeading } from "@/components/ui/app/FormHeading";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { EditableBlockWrapper } from "./EditableBlockWrapper";
import { useState, useEffect } from "react";
import { DeletedBlockOverlay } from "./DeletedBlockOverlay";
import { BlockDialog } from "./BlockDialog";
import { FaqAccordionItem } from "@/components/app-components/FaqAccordionItem";
import { useValidation } from "@/hooks/useFormDialog";

interface FaqItemBlockProps {
  block: FaqItemBlockType;
  isEditing: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  onUpdate?: (block: FaqItemBlockType) => void;
  onDelete?: (blockId: string) => void;
  onRestore?: (blockId: string) => void;
}

export function FaqItemBlock({
  block,
  isEditing,
  isSelected = false,
  onSelect,
  onUpdate,
  onDelete,
  onRestore,
}: FaqItemBlockProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editedBlock, setEditedBlock] = useState(block);

  // Use validation hook for error state and toast
  const { errors, hasErrors, clearError, clearAllErrors, showValidationError } =
    useValidation<{ question?: string; answer?: string }>();

  // Sync editedBlock with block prop when it changes (after save)
  useEffect(() => {
    setEditedBlock(block);
  }, [block]);

  // Deleted/disabled state
  if (block.isDeleted) {
    return (
      <DeletedBlockOverlay
        blockId={block.id}
        blockName="FAQ Item Block"
        onRestore={onRestore}
      >
        <FaqAccordionItem
          question={block.content.question}
          answer={block.content.answer}
        />
      </DeletedBlockOverlay>
    );
  }

  // Display mode (non-editing page view)
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
    setIsDialogOpen(false);
  };

  // Cancel changes
  const handleCancel = () => {
    setEditedBlock(block);
    clearAllErrors();
    setIsDialogOpen(false);
  };

  // Edit mode with dialog
  return (
    <>
      <BlockDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
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
        </FieldGroup>
      </BlockDialog>

      {/* WYSIWYG Block Display with hover/select states */}
      <EditableBlockWrapper
        onEdit={() => {
          if (onSelect) onSelect();
          setIsDialogOpen(true);
        }}
        editButtons={
          <Button
            size="sm"
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(block.id);
            }}
            className="shadow-lg"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        }
      >
        <FaqAccordionItem
          question={block.content.question}
          answer={block.content.answer}
        />
      </EditableBlockWrapper>
    </>
  );
}
