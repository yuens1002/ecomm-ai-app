"use client";

import { ImageGalleryBlock as ImageGalleryBlockType } from "@/lib/blocks/schemas";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, Check, X, Plus, Upload } from "lucide-react";
import { useState } from "react";

interface ImageGalleryBlockProps {
  block: ImageGalleryBlockType;
  isEditing: boolean;
  onUpdate: (block: ImageGalleryBlockType) => void;
  onDelete: (blockId: string) => void;
}

export function ImageGalleryBlock({
  block,
  isEditing,
  onUpdate,
  onDelete,
}: ImageGalleryBlockProps) {
  const [isEditingBlock, setIsEditingBlock] = useState(false);
  const [editedBlock, setEditedBlock] = useState(block);

  if (!isEditing) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {block.content.images.map((image, index) => (
          <div key={index} className="relative aspect-square overflow-hidden rounded-lg">
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

  if (isEditingBlock) {
    return (
      <div className="border-2 border-primary rounded-lg p-4 space-y-4 bg-muted/50">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold uppercase text-muted-foreground">
            Editing Image Gallery
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
              <div>
                <Label htmlFor={`gallery-url-${block.id}-${index}`}>
                  Image URL
                </Label>
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
              </div>
              <div>
                <Label htmlFor={`gallery-alt-${block.id}-${index}`}>
                  Alt Text
                </Label>
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
              </div>
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
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative group cursor-pointer"
      onClick={() => setIsEditingBlock(true)}
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {block.content.images.map((image, index) => (
          <div key={index} className="relative aspect-square overflow-hidden rounded-lg">
            <Image
              src={image.url}
              alt={image.alt || `Gallery image ${index + 1}`}
              fill
              className="object-cover"
            />
          </div>
        ))}
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
