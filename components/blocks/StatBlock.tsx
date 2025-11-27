"use client";

import { StatBlock as StatBlockType } from "@/lib/blocks/schemas";
import { StatCard } from "@/components/app-components/StatCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, Check, X } from "lucide-react";
import { useState } from "react";

interface StatBlockProps {
  block: StatBlockType;
  isEditing: boolean;
  onUpdate: (block: StatBlockType) => void;
  onDelete: (blockId: string) => void;
}

export function StatBlock({
  block,
  isEditing,
  onUpdate,
  onDelete,
}: StatBlockProps) {
  const [isEditingBlock, setIsEditingBlock] = useState(false);
  const [editedBlock, setEditedBlock] = useState(block);

  if (!isEditing) {
    // Display mode - show the stat card
    return <StatCard label={block.content.label} value={block.content.value} />;
  }

  if (isEditingBlock) {
    // Inline editing mode
    return (
      <div className="border-2 border-primary rounded-lg p-4 space-y-4 bg-muted/50">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold uppercase text-muted-foreground">
            Editing Stat
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
            <Label htmlFor={`stat-value-${block.id}`}>Value</Label>
            <Input
              id={`stat-value-${block.id}`}
              value={editedBlock.content.value}
              onChange={(e) =>
                setEditedBlock({
                  ...editedBlock,
                  content: { ...editedBlock.content, value: e.target.value },
                })
              }
              placeholder="e.g., 25+"
              maxLength={50}
            />
          </div>
          <div>
            <Label htmlFor={`stat-label-${block.id}`}>Label</Label>
            <Input
              id={`stat-label-${block.id}`}
              value={editedBlock.content.label}
              onChange={(e) =>
                setEditedBlock({
                  ...editedBlock,
                  content: { ...editedBlock.content, label: e.target.value },
                })
              }
              placeholder="e.g., Years of Experience"
              maxLength={50}
            />
          </div>
        </div>
      </div>
    );
  }

  // Hover state - show the card with edit overlay
  return (
    <div
      className="relative group cursor-pointer"
      onClick={() => setIsEditingBlock(true)}
    >
      <StatCard label={block.content.label} value={block.content.value} />
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
