"use client";

import { RichTextBlock as RichTextBlockType } from "@/lib/blocks/schemas";
import { Typography } from "@/components/ui/typography";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, Check, X, Bold, Italic, Heading } from "lucide-react";
import { useState } from "react";

interface RichTextBlockProps {
  block: RichTextBlockType;
  isEditing: boolean;
  onUpdate: (block: RichTextBlockType) => void;
  onDelete: (blockId: string) => void;
}

export function RichTextBlock({
  block,
  isEditing,
  onUpdate,
  onDelete,
}: RichTextBlockProps) {
  const [isEditingBlock, setIsEditingBlock] = useState(false);
  const [editedBlock, setEditedBlock] = useState(block);

  if (!isEditing) {
    return (
      <Typography>
        <div dangerouslySetInnerHTML={{ __html: block.content.html }} />
      </Typography>
    );
  }

  if (isEditingBlock) {
    return (
      <div className="border-2 border-primary rounded-lg p-4 space-y-4 bg-muted/50">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold uppercase text-muted-foreground">
            Editing Rich Text
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

        <div>
          <Label htmlFor={`richtext-${block.id}`}>Content (HTML)</Label>
          <Textarea
            id={`richtext-${block.id}`}
            value={editedBlock.content.html}
            onChange={(e) =>
              setEditedBlock({
                ...editedBlock,
                content: { ...editedBlock.content, html: e.target.value },
              })
            }
            placeholder="<p>Enter HTML content...</p>"
            rows={10}
            className="font-mono text-sm"
          />
          <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Bold className="h-3 w-3" /> &lt;strong&gt;
            </span>
            <span className="flex items-center gap-1">
              <Italic className="h-3 w-3" /> &lt;em&gt;
            </span>
            <span className="flex items-center gap-1">
              <Heading className="h-3 w-3" /> &lt;h2&gt;-&lt;h6&gt;
            </span>
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-background">
          <p className="text-xs font-semibold mb-2">Preview:</p>
          <Typography>
            <div dangerouslySetInnerHTML={{ __html: editedBlock.content.html }} />
          </Typography>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative group cursor-pointer"
      onClick={() => setIsEditingBlock(true)}
    >
      <Typography>
        <div dangerouslySetInnerHTML={{ __html: block.content.html }} />
      </Typography>
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
