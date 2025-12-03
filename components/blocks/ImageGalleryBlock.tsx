"use client";

import { ImageGalleryBlock as ImageGalleryBlockType } from "@/lib/blocks/schemas";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Upload } from "lucide-react";
import { useState } from "react";
import { DeletedBlockOverlay } from "./DeletedBlockOverlay";
import { EditableBlockWrapper } from "./EditableBlockWrapper";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface GalleryGridProps {
  images: Array<{ url: string; alt?: string }>;
  className?: string;
}

/**
 * Reusable image grid component
 * Displays multiple images in a responsive grid layout
 */
export function GalleryGrid({ images, className = "" }: GalleryGridProps) {
  return (
    <div
      className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`}
    >
      {images.map((image, index) => (
        <div
          key={index}
          className="relative aspect-4/3 overflow-hidden rounded-lg"
        >
          <Image
            src={image.url}
            alt={image.alt || `Gallery image ${index + 1}`}
            fill
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}

interface ImageGalleryBlockProps {
  block: ImageGalleryBlockType;
  isEditing: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  onUpdate?: (block: ImageGalleryBlockType) => void;
  onDelete?: (blockId: string) => void;
  onRestore?: (blockId: string) => void;
}

export function ImageGalleryBlock({
  block,
  isEditing,
  isSelected = false,
  onSelect,
  onUpdate,
  onDelete,
  onRestore,
}: ImageGalleryBlockProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editedBlock, setEditedBlock] = useState(block);

  // Deleted/disabled state
  if (block.isDeleted) {
    return (
      <DeletedBlockOverlay
        blockId={block.id}
        blockName="Image Gallery Block"
        onRestore={onRestore}
      >
        <GalleryGrid images={block.content.images} />
      </DeletedBlockOverlay>
    );
  }

  // Display mode (non-editing page view)
  if (!isEditing) {
    return <GalleryGrid images={block.content.images} />;
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
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="pr-8 shrink-0">
            <DialogTitle>Edit Image Gallery Block</DialogTitle>
            <DialogDescription>
              Manage gallery images • {editedBlock.content.images.length} of 20
              images
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            {editedBlock.content.images.map((image, index) => (
              <div key={index} className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold">
                    Image {index + 1}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const newImages = editedBlock.content.images.filter(
                        (_, i) => i !== index
                      );
                      setEditedBlock({
                        ...editedBlock,
                        content: { images: newImages },
                      });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Field>
                  <FieldLabel htmlFor={`gallery-url-${block.id}-${index}`}>
                    Image URL
                  </FieldLabel>
                  <div className="flex gap-2">
                    <Input
                      id={`gallery-url-${block.id}-${index}`}
                      value={image.url}
                      onChange={(e) => {
                        const newImages = [...editedBlock.content.images];
                        newImages[index] = { ...image, url: e.target.value };
                        setEditedBlock({
                          ...editedBlock,
                          content: { images: newImages },
                        });
                      }}
                      placeholder="/images/gallery-1.jpg"
                    />
                    <Button variant="outline" size="icon">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </Field>
                <Field>
                  <FieldLabel htmlFor={`gallery-alt-${block.id}-${index}`}>
                    Alt Text
                  </FieldLabel>
                  <Input
                    id={`gallery-alt-${block.id}-${index}`}
                    value={image.alt || ""}
                    onChange={(e) => {
                      const newImages = [...editedBlock.content.images];
                      newImages[index] = { ...image, alt: e.target.value };
                      setEditedBlock({
                        ...editedBlock,
                        content: { images: newImages },
                      });
                    }}
                    placeholder="Describe the image..."
                    maxLength={200}
                  />
                </Field>
                {image.url && (
                  <div className="relative h-32 w-full rounded overflow-hidden">
                    <Image
                      src={image.url}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
            ))}

            {editedBlock.content.images.length < 20 && (
              <Button
                variant="outline"
                onClick={() => {
                  const newImages = [
                    ...editedBlock.content.images,
                    { url: "", alt: "" },
                  ];
                  setEditedBlock({
                    ...editedBlock,
                    content: { images: newImages },
                  });
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Image
              </Button>
            )}
          </FieldGroup>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

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
        <GalleryGrid images={block.content.images} />
      </EditableBlockWrapper>
    </>
  );
}
