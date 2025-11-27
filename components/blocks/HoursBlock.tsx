"use client";

import { HoursBlock as HoursBlockType } from "@/lib/blocks/schemas";
import { Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, Check, X } from "lucide-react";
import { useState } from "react";

interface HoursBlockProps {
  block: HoursBlockType;
  isEditing: boolean;
  onUpdate: (block: HoursBlockType) => void;
  onDelete: (blockId: string) => void;
}

export function HoursBlock({
  block,
  isEditing,
  onUpdate,
  onDelete,
}: HoursBlockProps) {
  const [isEditingBlock, setIsEditingBlock] = useState(false);
  const [editedBlock, setEditedBlock] = useState(block);

  if (!isEditing) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border p-6">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Hours</h3>
        </div>
        <div className="grid gap-2">
          {block.content.schedule.map((item, index) => (
            <div key={index} className="flex justify-between">
              <span className="text-muted-foreground">{item.days}</span>
              <span className="font-medium">{item.hours}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isEditingBlock) {
    return (
      <div className="border-2 border-primary rounded-lg p-4 space-y-4 bg-muted/50">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold uppercase text-muted-foreground">
            Editing Hours
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
          {editedBlock.content.schedule.map((item, index) => (
            <div key={index} className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor={`hours-days-${block.id}-${index}`}>Days</Label>
                <Input
                  id={`hours-days-${block.id}-${index}`}
                  value={item.days}
                  onChange={(e) => {
                    const newSchedule = [...editedBlock.content.schedule];
                    newSchedule[index] = { ...item, days: e.target.value };
                    setEditedBlock({
                      ...editedBlock,
                      content: { schedule: newSchedule },
                    });
                  }}
                  placeholder="Mon-Fri"
                  maxLength={50}
                />
              </div>
              <div>
                <Label htmlFor={`hours-time-${block.id}-${index}`}>Hours</Label>
                <div className="flex gap-2">
                  <Input
                    id={`hours-time-${block.id}-${index}`}
                    value={item.hours}
                    onChange={(e) => {
                      const newSchedule = [...editedBlock.content.schedule];
                      newSchedule[index] = { ...item, hours: e.target.value };
                      setEditedBlock({
                        ...editedBlock,
                        content: { schedule: newSchedule },
                      });
                    }}
                    placeholder="9am - 5pm"
                    maxLength={50}
                  />
                  {editedBlock.content.schedule.length > 1 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        const newSchedule = editedBlock.content.schedule.filter(
                          (_, i) => i !== index
                        );
                        setEditedBlock({
                          ...editedBlock,
                          content: { schedule: newSchedule },
                        });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {editedBlock.content.schedule.length < 7 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newSchedule = [
                  ...editedBlock.content.schedule,
                  { days: "", hours: "" },
                ];
                setEditedBlock({
                  ...editedBlock,
                  content: { schedule: newSchedule },
                });
              }}
            >
              Add Row
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
      <div className="flex flex-col gap-4 rounded-lg border p-6">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Hours</h3>
        </div>
        <div className="grid gap-2">
          {block.content.schedule.map((item, index) => (
            <div key={index} className="flex justify-between">
              <span className="text-muted-foreground">{item.days}</span>
              <span className="font-medium">{item.hours}</span>
            </div>
          ))}
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
