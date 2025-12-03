"use client";

import { FaqItemBlock as FaqItemBlockType } from "@/lib/blocks/schemas";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup } from "@/components/ui/field";
import { FormHeading } from "@/components/ui/app/FormHeading";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronDown } from "lucide-react";
import { EditableBlockWrapper } from "./EditableBlockWrapper";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DeletedBlockOverlay } from "./DeletedBlockOverlay";
import { BlockDialog } from "./BlockDialog";

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
  const [isOpen, setIsOpen] = useState(false);

  // Deleted/disabled state
  if (block.isDeleted) {
    return (
      <DeletedBlockOverlay
        blockId={block.id}
        blockName="FAQ Item Block"
        onRestore={onRestore}
      >
        <Collapsible>
          <div className="border rounded-lg">
            <CollapsibleTrigger className="flex w-full items-center justify-between p-4 font-medium pointer-events-none">
              {block.content.question}
              <ChevronDown className="h-4 w-4" />
            </CollapsibleTrigger>
          </div>
        </Collapsible>
      </DeletedBlockOverlay>
    );
  }

  // Display mode (non-editing page view)
  if (!isEditing) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="border rounded-lg">
          <CollapsibleTrigger className="flex w-full items-center justify-between p-4 font-medium hover:bg-muted/50 transition-colors">
            {block.content.question}
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-4 text-muted-foreground">
            {block.content.answer}
          </CollapsibleContent>
        </div>
      </Collapsible>
    );
  }

  // Save changes from dialog
  const handleSave = () => {
    onUpdate?.(editedBlock);
    setIsDialogOpen(false);
  };

  // Cancel changes
  const handleCancel = () => {
    setEditedBlock(block);
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
            <Button onClick={handleSave}>Save</Button>
          </>
        }
      >
        <FieldGroup>
          <Field>
            <FormHeading
              htmlFor={`faq-question-${block.id}`}
              label="Question"
              required={true}
              isDirty={editedBlock.content.question !== block.content.question}
            />
            <Input
              id={`faq-question-${block.id}`}
              value={editedBlock.content.question}
              onChange={(e) =>
                setEditedBlock({
                  ...editedBlock,
                  content: {
                    ...editedBlock.content,
                    question: e.target.value,
                  },
                })
              }
              placeholder="What is your question?"
              maxLength={200}
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
              isDirty={editedBlock.content.answer !== block.content.answer}
            />
            <Textarea
              id={`faq-answer-${block.id}`}
              value={editedBlock.content.answer}
              onChange={(e) =>
                setEditedBlock({
                  ...editedBlock,
                  content: {
                    ...editedBlock.content,
                    answer: e.target.value,
                  },
                })
              }
              placeholder="Provide a detailed answer..."
              rows={4}
              maxLength={1000}
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
        <Collapsible>
          <div className="border rounded-lg">
            <CollapsibleTrigger className="flex w-full items-center justify-between p-4 font-medium pointer-events-none">
              {block.content.question}
              <ChevronDown className="h-4 w-4" />
            </CollapsibleTrigger>
          </div>
        </Collapsible>
      </EditableBlockWrapper>
    </>
  );
}
