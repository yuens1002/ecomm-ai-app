"use client";

import { LocationBlock as LocationBlockType } from "@/lib/blocks/schemas";
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, Check, X } from "lucide-react";
import { useState } from "react";

interface LocationBlockProps {
  block: LocationBlockType;
  isEditing: boolean;
  onUpdate: (block: LocationBlockType) => void;
  onDelete: (blockId: string) => void;
}

export function LocationBlock({
  block,
  isEditing,
  onUpdate,
  onDelete,
}: LocationBlockProps) {
  const [isEditingBlock, setIsEditingBlock] = useState(false);
  const [editedBlock, setEditedBlock] = useState(block);

  if (!isEditing) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border p-6">
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-primary mt-1" />
          <div>
            <h3 className="font-semibold text-lg">{block.content.name}</h3>
            <address className="not-italic text-muted-foreground mt-1">
              {block.content.address}
            </address>
            {block.content.googleMapsUrl && (
              <a
                href={block.content.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline mt-2 inline-block"
              >
                View on Google Maps →
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isEditingBlock) {
    return (
      <div className="border-2 border-primary rounded-lg p-4 space-y-4 bg-muted/50">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold uppercase text-muted-foreground">
            Editing Location
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
            <Label htmlFor={`location-name-${block.id}`}>Location Name</Label>
            <Input
              id={`location-name-${block.id}`}
              value={editedBlock.content.name}
              onChange={(e) =>
                setEditedBlock({
                  ...editedBlock,
                  content: { ...editedBlock.content, name: e.target.value },
                })
              }
              placeholder="e.g., Main Cafe"
              maxLength={100}
            />
          </div>
          <div>
            <Label htmlFor={`location-address-${block.id}`}>Address</Label>
            <Textarea
              id={`location-address-${block.id}`}
              value={editedBlock.content.address}
              onChange={(e) =>
                setEditedBlock({
                  ...editedBlock,
                  content: { ...editedBlock.content, address: e.target.value },
                })
              }
              placeholder="123 Main St&#10;City, State 12345"
              rows={3}
              maxLength={300}
            />
          </div>
          <div>
            <Label htmlFor={`location-maps-${block.id}`}>
              Google Maps URL (Optional)
            </Label>
            <Input
              id={`location-maps-${block.id}`}
              value={editedBlock.content.googleMapsUrl || ""}
              onChange={(e) =>
                setEditedBlock({
                  ...editedBlock,
                  content: {
                    ...editedBlock.content,
                    googleMapsUrl: e.target.value,
                  },
                })
              }
              placeholder="https://maps.google.com/..."
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
      <div className="flex flex-col gap-4 rounded-lg border p-6">
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-primary mt-1" />
          <div>
            <h3 className="font-semibold text-lg">{block.content.name}</h3>
            <address className="not-italic text-muted-foreground mt-1">
              {block.content.address}
            </address>
            {block.content.googleMapsUrl && (
              <a
                href={block.content.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline mt-2 inline-block"
              >
                View on Google Maps →
              </a>
            )}
          </div>
        </div>
      </div>
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
