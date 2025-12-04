"use client";

import { HoursBlock as HoursBlockType } from "@/lib/blocks/schemas";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup } from "@/components/ui/field";
import { FormHeading } from "@/components/ui/app/FormHeading";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { DeletedBlockOverlay } from "./DeletedBlockOverlay";
import { BlockDialog } from "./BlockDialog";
import { HoursCard } from "@/components/app-components/HoursCard";

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
        <HoursCard schedule={block.content.schedule} />
      </DeletedBlockOverlay>
    );
  }

  // Display mode (non-editing page view)
  if (!isEditing) {
    return <HoursCard schedule={block.content.schedule} />;
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
      <BlockDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title="Edit Hours Block"
        description={`Update your business hours schedule • ${editedBlock.content.schedule.length} of 7 rows`}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </>
        }
      >
        <FieldGroup>
          {editedBlock.content.schedule.map((item, index) => (
            <div key={index} className="grid grid-cols-2 gap-3">
              <Field>
                <FormHeading
                  htmlFor={`hours-days-${block.id}-${index}`}
                  label="Days"
                  isDirty={
                    item.day !== (block.content.schedule[index]?.day || "")
                  }
                />
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
                <FormHeading
                  htmlFor={`hours-time-${block.id}-${index}`}
                  label="Hours"
                  isDirty={
                    item.hours !== (block.content.schedule[index]?.hours || "")
                  }
                />
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
                        const newSchedule = editedBlock.content.schedule.filter(
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
      </BlockDialog>

      {/* WYSIWYG Block Display with hover/select states */}
      <HoursCard
        schedule={block.content.schedule}
        isEditing={true}
        onClick={() => {
          if (onSelect) onSelect();
          setIsDialogOpen(true);
        }}
        actionButtons={
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
      />
    </>
  );
}
