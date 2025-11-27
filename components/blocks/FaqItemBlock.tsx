"use client";

import { FaqItemBlock as FaqItemBlockType } from "@/lib/blocks/schemas";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, Check, X, ChevronDown } from "lucide-react";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface FaqItemBlockProps {
  block: FaqItemBlockType;
  isEditing: boolean;
  onUpdate: (block: FaqItemBlockType) => void;
  onDelete: (blockId: string) => void;
}

export function FaqItemBlock({
  block,
  isEditing,
  onUpdate,
  onDelete,
}: FaqItemBlockProps) {
  const [isEditingBlock, setIsEditingBlock] = useState(false);
  const [editedBlock, setEditedBlock] = useState(block);
  const [isOpen, setIsOpen] = useState(false);

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

  if (isEditingBlock) {
    return (
      <div className="border-2 border-primary rounded-lg p-4 space-y-4 bg-muted/50">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold uppercase text-muted-foreground">
            Editing FAQ Item
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                onUpdate(editedBlock);
                setIsEditingBlock(false);
              }}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditedBlock(block);
                setIsEditingBlock(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor={`faq-question-${block.id}`}>Question</Label>
            <Input
              id={`faq-question-${block.id}`}
              value={editedBlock.content.question}
              onChange={(e) =>
                setEditedBlock({
                  ...editedBlock,
                  content: { ...editedBlock.content, question: e.target.value },
                })
              }
              placeholder="What is your question?"
              maxLength={200}
            />
          </div>
          <div>
            <Label htmlFor={`faq-answer-${block.id}`}>Answer</Label>
            <Textarea
              id={`faq-answer-${block.id}`}
              value={editedBlock.content.answer}
              onChange={(e) =>
                setEditedBlock({
                  ...editedBlock,
                  content: { ...editedBlock.content, answer: e.target.value },
                })
              }
              placeholder="Provide a detailed answer..."
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {editedBlock.content.answer.length}/1000
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative group cursor-pointer"
      onClick={() => setIsEditingBlock(true)}
    >
      <Collapsible>
        <div className="border rounded-lg">
          <CollapsibleTrigger className="flex w-full items-center justify-between p-4 font-medium pointer-events-none">
            {block.content.question}
            <ChevronDown className="h-4 w-4" />
          </CollapsibleTrigger>
        </div>
      </Collapsible>
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
        <span className="text-white text-sm font-medium">Click to edit</span>
        <Button
          size="sm"
          variant="destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(block.id);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
