"use client";

import { HeroBlock as HeroBlockType } from "@/lib/blocks/schemas";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check, X, Upload } from "lucide-react";
import { useState } from "react";

interface HeroBlockProps {
  block: HeroBlockType;
  isEditing: boolean;
  onUpdate: (block: HeroBlockType) => void;
  onDelete: (blockId: string) => void;
}

export function HeroBlock({ block, isEditing, onUpdate }: HeroBlockProps) {
  const [isEditingBlock, setIsEditingBlock] = useState(false);
  const [editedBlock, setEditedBlock] = useState(block);

  if (!isEditing) {
    return (
      <div className="relative h-64 w-full md:h-96">
        <Image
          src={block.content.imageUrl}
          alt={block.content.imageAlt || block.content.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-4xl font-bold text-white md:text-6xl">
            {block.content.title}
          </h1>
        </div>
      </div>
    );
  }

  if (isEditingBlock) {
    return (
      <div className="border-2 border-primary rounded-lg p-4 space-y-4 bg-muted/50">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold uppercase text-muted-foreground">
            Editing Hero
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
            <Label htmlFor={`hero-title-${block.id}`}>Title</Label>
            <Input
              id={`hero-title-${block.id}`}
              value={editedBlock.content.title}
              onChange={(e) =>
                setEditedBlock({
                  ...editedBlock,
                  content: { ...editedBlock.content, title: e.target.value },
                })
              }
              placeholder="e.g., About Our Roastery"
              maxLength={100}
            />
          </div>
          <div>
            <Label htmlFor={`hero-image-${block.id}`}>Image URL</Label>
            <div className="flex gap-2">
              <Input
                id={`hero-image-${block.id}`}
                value={editedBlock.content.imageUrl}
                onChange={(e) =>
                  setEditedBlock({
                    ...editedBlock,
                    content: { ...editedBlock.content, imageUrl: e.target.value },
                  })
                }
                placeholder="/images/hero.jpg"
              />
              <Button variant="outline" size="icon">
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor={`hero-alt-${block.id}`}>Image Alt Text</Label>
            <Input
              id={`hero-alt-${block.id}`}
              value={editedBlock.content.imageAlt || ""}
              onChange={(e) =>
                setEditedBlock({
                  ...editedBlock,
                  content: { ...editedBlock.content, imageAlt: e.target.value },
                })
              }
              placeholder="Describe the image..."
              maxLength={200}
            />
          </div>
        </div>

        {editedBlock.content.imageUrl && (
          <div className="relative h-48 w-full rounded-lg overflow-hidden">
            <Image
              src={editedBlock.content.imageUrl}
              alt="Preview"
              fill
              className="object-cover"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="relative group cursor-pointer"
      onClick={() => setIsEditingBlock(true)}
    >
      <div className="relative h-64 w-full md:h-96">
        <Image
          src={block.content.imageUrl}
          alt={block.content.imageAlt || block.content.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-4xl font-bold text-white md:text-6xl">
            {block.content.title}
          </h1>
        </div>
      </div>
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <span className="text-white text-sm font-medium">Click to edit</span>
      </div>
    </div>
  );
}
