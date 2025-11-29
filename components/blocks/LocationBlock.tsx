"use client";

import { LocationBlock as LocationBlockType } from "@/lib/blocks/schemas";
import { MapPin, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { DeletedBlockOverlay } from "./DeletedBlockOverlay";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LocationBlockProps {
  block: LocationBlockType;
  isEditing: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  onUpdate?: (block: LocationBlockType) => void;
  onDelete?: (blockId: string) => void;
  onRestore?: (blockId: string) => void;
}

export function LocationBlock({
  block,
  isEditing,
  isSelected = false,
  onSelect,
  onUpdate,
  onDelete,
  onRestore,
}: LocationBlockProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editedBlock, setEditedBlock] = useState(block);

  // Deleted/disabled state
  if (block.isDeleted) {
    return (
      <DeletedBlockOverlay
        blockId={block.id}
        blockName="Location Block"
        onRestore={onRestore}
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
      </DeletedBlockOverlay>
    );
  }

  // Display mode (non-editing page view)
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
            <DialogTitle>Edit Location Block</DialogTitle>
            <DialogDescription>
              Update location name, address, and Google Maps link
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 -mx-6 px-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor={`location-name-${block.id}`}>
                  Location Name
                </FieldLabel>
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
              </Field>
              <Field>
                <FieldLabel htmlFor={`location-address-${block.id}`}>
                  Address
                </FieldLabel>
                <Textarea
                  id={`location-address-${block.id}`}
                  value={editedBlock.content.address}
                  onChange={(e) =>
                    setEditedBlock({
                      ...editedBlock,
                      content: {
                        ...editedBlock.content,
                        address: e.target.value,
                      },
                    })
                  }
                  placeholder="123 Main St&#10;City, State 12345"
                  rows={3}
                  maxLength={300}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={`location-maps-${block.id}`}>
                  Google Maps URL (Optional)
                </FieldLabel>
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
      <div
        className="relative flex flex-col gap-4 rounded-lg border p-6 group cursor-pointer transition-all hover:ring-1 hover:ring-[#00d4ff]"
        onClick={() => {
          if (onSelect) onSelect();
          setIsDialogOpen(true);
        }}
      >
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
      </div>
    </>
  );
}
