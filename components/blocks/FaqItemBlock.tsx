"use client";

import { FaqItemBlock as FaqItemBlockType } from "@/lib/blocks/schemas";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronDown } from "lucide-react";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DeletedBlockOverlay } from "./DeletedBlockOverlay";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="pr-8 flex-shrink-0">
            <DialogTitle>Edit FAQ Item Block</DialogTitle>
            <DialogDescription>
              Update the question and answer •{" "}
              {editedBlock.content.answer.length} of 1000 characters
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 -mx-6 px-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor={`faq-question-${block.id}`}>
                  Question
                </FieldLabel>
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
              </Field>
              <Field>
                <FieldLabel htmlFor={`faq-answer-${block.id}`}>
                  Answer
                </FieldLabel>
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
              </Field>
            </FieldGroup>
          </div>

          <div className="flex justify-end gap-2 mt-6 flex-shrink-0">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* WYSIWYG Block Display with hover/select states */}
      <Collapsible
        className="relative group cursor-pointer transition-all hover:ring-1 hover:ring-[#00d4ff]"
        onClick={() => {
          if (onSelect) onSelect();
          setIsDialogOpen(true);
        }}
      >
        <div className="border rounded-lg">
          <CollapsibleTrigger className="flex w-full items-center justify-between p-4 font-medium pointer-events-none">
            {block.content.question}
            <ChevronDown className="h-4 w-4" />
          </CollapsibleTrigger>
        </div>

        {/* Action Controls on Hover */}
        <div className="absolute top-2 right-2 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
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
        </div>
      </Collapsible>
    </>
  );
}
