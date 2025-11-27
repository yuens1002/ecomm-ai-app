"use client";

import { PullQuoteBlock as PullQuoteBlockType } from "@/lib/blocks/schemas";
import { PullQuote } from "@/components/app-components/PullQuote";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, Check, X } from "lucide-react";
import { useState } from "react";

interface PullQuoteBlockProps {
  block: PullQuoteBlockType;
  isEditing: boolean;
  onUpdate: (block: PullQuoteBlockType) => void;
  onDelete: (blockId: string) => void;
}

export function PullQuoteBlock({
  block,
  isEditing,
  onUpdate,
  onDelete,
}: PullQuoteBlockProps) {
  const [isEditingBlock, setIsEditingBlock] = useState(false);
  const [editedBlock, setEditedBlock] = useState(block);

  if (!isEditing) {
    return <PullQuote text={block.content.text} author={block.content.author} />;
  }

  if (isEditingBlock) {
    return (
      <div className="border-2 border-primary rounded-lg p-4 space-y-4 bg-muted/50">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold uppercase text-muted-foreground">
            Editing Pull Quote
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
            <Label htmlFor={`quote-text-${block.id}`}>Quote Text</Label>
            <Textarea
              id={`quote-text-${block.id}`}
              value={editedBlock.content.text}
              onChange={(e) =>
                setEditedBlock({
                  ...editedBlock,
                  content: { ...editedBlock.content, text: e.target.value },
                })
              }
              placeholder="Enter quote text..."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {editedBlock.content.text.length}/500
            </p>
          </div>
          <div>
            <Label htmlFor={`quote-author-${block.id}`}>
              Author (Optional)
            </Label>
            <Input
              id={`quote-author-${block.id}`}
              value={editedBlock.content.author || ""}
              onChange={(e) =>
                setEditedBlock({
                  ...editedBlock,
                  content: { ...editedBlock.content, author: e.target.value },
                })
              }
              placeholder="e.g., Founder"
              maxLength={100}
            />
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
      <PullQuote text={block.content.text} author={block.content.author} />
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
