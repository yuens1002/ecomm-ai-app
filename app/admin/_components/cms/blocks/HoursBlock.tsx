"use client";

import { HoursBlock as HoursBlockType } from "@/lib/blocks/schemas";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup } from "@/components/ui/field";
import { FormHeading } from "@/components/ui/forms/FormHeading";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { BlockDialog } from "./BlockDialog";
import { HoursCard } from "@/app/(site)/_components/content/HoursCard";
import { useValidation } from "@/hooks/useFormDialog";

interface HoursBlockProps {
  block: HoursBlockType;
  isEditing: boolean;
  onUpdate?: (block: HoursBlockType) => void;
  // Dialog control from BlockRenderer
  isDialogOpen?: boolean;
  onDialogOpenChange?: (open: boolean) => void;
}

export function HoursBlock({
  block,
  isEditing,
  onUpdate,
  isDialogOpen = false,
  onDialogOpenChange,
}: HoursBlockProps) {
  // For backward compatibility, use internal state if not controlled
  const [internalDialogOpen, setInternalDialogOpen] = useState(false);
  const dialogOpen = onDialogOpenChange ? isDialogOpen : internalDialogOpen;
  const setDialogOpen = onDialogOpenChange || setInternalDialogOpen;

  const [editedBlock, setEditedBlock] = useState(block);

  // Use validation hook for error state and toast
  const { errors, hasErrors, clearError, clearAllErrors, showValidationError } =
    useValidation<{ schedule?: string }>();

  // Sync editedBlock with block prop when it changes (after save)
  useEffect(() => {
    setEditedBlock(block);
  }, [block]);

  // Display mode (non-editing page view)
  // BlockRenderer handles deleted state and wrapper
  if (!isEditing) {
    return <HoursCard schedule={block.content.schedule} />;
  }

  // Save changes from dialog
  const handleSave = () => {
    // Validate: at least one row with both day and hours filled
    const fieldErrors: { schedule?: string } = {};

    const hasValidRow = editedBlock.content.schedule.some(
      (item) => item.day.trim() && item.hours.trim()
    );

    if (!hasValidRow) {
      fieldErrors.schedule = "At least one row with day and hours is required";
    }

    // Show toast and set errors if validation fails
    if (!showValidationError(fieldErrors)) {
      return;
    }

    // Filter out completely empty rows before saving
    const cleanedSchedule = editedBlock.content.schedule.filter(
      (item) => item.day.trim() || item.hours.trim()
    );

    onUpdate?.({
      ...editedBlock,
      content: {
        ...editedBlock.content,
        schedule:
          cleanedSchedule.length > 0
            ? cleanedSchedule
            : [{ day: "", hours: "" }],
      },
    });
    setDialogOpen(false);
  };

  // Cancel changes
  const handleCancel = () => {
    setEditedBlock(block);
    clearAllErrors();
    setDialogOpen(false);
  };

  // Edit mode with dialog
  return (
    <>
      <BlockDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Edit Hours Block"
        description={`Update your business hours schedule • ${editedBlock.content.schedule.length} of 7 rows`}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={hasErrors}>
              Save
            </Button>
          </>
        }
      >
        <FieldGroup>
          {errors.schedule && (
            <p className="text-sm text-destructive">{errors.schedule}</p>
          )}
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
                    if (errors.schedule) clearError("schedule");
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
                      if (errors.schedule) clearError("schedule");
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

      {/* Display content - wrapper handled by BlockRenderer */}
      <HoursCard schedule={block.content.schedule} />
    </>
  );
}
