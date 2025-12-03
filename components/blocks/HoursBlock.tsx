"use client";

import { HoursBlock as HoursBlockType } from "@/lib/blocks/schemas";
import { Clock, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
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

interface HoursBlockProps {
  block: HoursBlockType;
  isEditing: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  onUpdate?: (block: HoursBlockType) => void;
  onDelete?: (blockId: string) => void;
  onRestore?: (blockId: string) => void;
}

export function HoursBlock({
  block,
  isEditing,
  isSelected = false,
  onSelect,
  onUpdate,
  onDelete,
  onRestore,
}: HoursBlockProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editedBlock, setEditedBlock] = useState(block);

  // Deleted/disabled state
  if (block.isDeleted) {
    return (
      <DeletedBlockOverlay
        blockId={block.id}
        blockName="Hours Block"
        onRestore={onRestore}
      >
        <div className="flex flex-col gap-4 rounded-lg border p-6">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Hours</h3>
          </div>
          <div className="grid gap-2">
            {block.content.schedule.map((item, index) => (
              <div key={index} className="flex justify-between">
                <span className="text-muted-foreground">{item.day}</span>
                <span className="font-medium">{item.hours}</span>
              </div>
            ))}
          </div>
        </div>
      </DeletedBlockOverlay>
    );
  }

  // Display mode (non-editing page view)
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
              <span className="text-muted-foreground">{item.day}</span>
              <span className="font-medium">{item.hours}</span>
            </div>
          ))}
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
            <DialogTitle>Edit Hours Block</DialogTitle>
            <DialogDescription>
              Update your business hours schedule •{" "}
              {editedBlock.content.schedule.length} of 7 rows
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 -mx-6 px-6">
            <FieldGroup>
              {editedBlock.content.schedule.map((item, index) => (
                <div key={index} className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel htmlFor={`hours-days-${block.id}-${index}`}>
                      Days
                    </FieldLabel>
                    <Input
                      id={`hours-days-${block.id}-${index}`}
                      value={item.day}
                      onChange={(e) => {
                        const newSchedule = [...editedBlock.content.schedule];
                        newSchedule[index] = { ...item, day: e.target.value };
                        setEditedBlock({
                          ...editedBlock,
                          content: {
                            ...editedBlock.content,
                            schedule: newSchedule,
                          },
                        });
                      }}
                      placeholder="Mon-Fri"
                      maxLength={50}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`hours-time-${block.id}-${index}`}>
                      Hours
                    </FieldLabel>
                    <div className="flex gap-2">
                      <Input
                        id={`hours-time-${block.id}-${index}`}
                        value={item.hours}
                        onChange={(e) => {
                          const newSchedule = [...editedBlock.content.schedule];
                          newSchedule[index] = {
                            ...item,
                            hours: e.target.value,
                          };
                          setEditedBlock({
                            ...editedBlock,
                            content: {
                              ...editedBlock.content,
                              schedule: newSchedule,
                            },
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
                            const newSchedule =
                              editedBlock.content.schedule.filter(
                                (_, i) => i !== index
                              );
                            setEditedBlock({
                              ...editedBlock,
                              content: {
                                ...editedBlock.content,
                                schedule: newSchedule,
                              },
                            });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </Field>
                </div>
              ))}
              {editedBlock.content.schedule.length < 7 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newSchedule = [
                      ...editedBlock.content.schedule,
                      { day: "", hours: "" },
                    ];
                    setEditedBlock({
                      ...editedBlock,
                      content: {
                        ...editedBlock.content,
                        schedule: newSchedule,
                      },
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Row
                </Button>
              )}
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
        className="flex flex-col gap-4 rounded-lg border p-6"
      >
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Hours</h3>
        </div>
        <div className="grid gap-2">
          {block.content.schedule.map((item, index) => (
            <div key={index} className="flex justify-between">
              <span className="text-muted-foreground">{item.day}</span>
              <span className="font-medium">{item.hours}</span>
            </div>
          ))}
        </div>
      </EditableBlockWrapper>
    </>
  );
}
